"use client"

import { SealClient, SessionKey, NoAccessError } from "@mysten/seal"
import { fromHex, toHex } from "@mysten/sui/utils"
import { Transaction } from "@mysten/sui/transactions"
import { ECHO_PACKAGE_ID, WALRUS_AGGREGATOR, WALRUS_PUBLISHER } from "./constants"
import type { SuiJsonRpcClient } from "@mysten/sui/jsonRpc"

// ── SEAL Key Server (Sui Testnet, run by Mysten Labs) ────────────────────────
const SEAL_KEY_SERVER_OBJECT_ID = "0xb012378c9f3799fb5b1a7083da74a4069e3c3f1c93de0b27212a5799ce1e1e98"
const SEAL_AGGREGATOR_URL = "https://seal-aggregator-testnet.mystenlabs.com"

// ── Client factory ───────────────────────────────────────────────────────────

function createSealClient(suiClient: SuiJsonRpcClient): SealClient {
  return new SealClient({
    // SuiJsonRpcClient implements SealCompatibleClient (has .core)
    suiClient: suiClient as Parameters<typeof SealClient.prototype.encrypt>[0] extends never
      ? never
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      : any,
    serverConfigs: [
      {
        objectId: SEAL_KEY_SERVER_OBJECT_ID,
        weight: 1,
        aggregatorUrl: SEAL_AGGREGATOR_URL,
      },
    ],
    verifyKeyServers: false,
  })
}

// ── Encryption ───────────────────────────────────────────────────────────────

export interface SealEncryptResult {
  blobId: string
  /** Hex-encoded SEAL ID = [policy_object_id_bytes (32)] || [nonce (5)] */
  sealId: string
}

/**
 * Encrypt `text` under the given SignalPolicy object ID, upload the
 * CIPHERTEXT (not plaintext) to Walrus, and return blobId + sealId.
 *
 * The sealId must be stored alongside blobId so the SEAL SDK can request
 * the correct decryption key from the key server later.
 *
 * ID format matches the namespace check in seal_signal::seal_approve:
 *   first 32 bytes = policy object ID, last 5 bytes = random nonce.
 */
export async function encryptAndUpload(
  text: string,
  policyObjectId: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  suiClient: any,
  epochs = 5,
): Promise<SealEncryptResult> {
  const sealClient = createSealClient(suiClient)

  const nonce = crypto.getRandomValues(new Uint8Array(5))
  const policyBytes = fromHex(policyObjectId)
  const sealId = toHex(new Uint8Array([...policyBytes, ...nonce]))

  const data = new TextEncoder().encode(text)
  const { encryptedObject: encryptedBytes } = await sealClient.encrypt({
    threshold: 1,
    packageId: ECHO_PACKAGE_ID,
    id: sealId,
    data,
  })

  // Upload CIPHERTEXT (Uint8Array) to Walrus
  const res = await fetch(`${WALRUS_PUBLISHER}/v1/blobs?epochs=${epochs}`, {
    method: "PUT",
    body: encryptedBytes,
    headers: { "Content-Type": "application/octet-stream" },
  })
  if (!res.ok) throw new Error(`Walrus upload failed: ${res.status}`)
  const body = await res.json()
  const blobId: string | undefined =
    body?.newlyCreated?.blobObject?.blobId ?? body?.alreadyCertified?.blobId
  if (!blobId) throw new Error("Walrus returned no blobId")

  return { blobId, sealId }
}

// ── Decryption ───────────────────────────────────────────────────────────────

export interface DecryptSignalOptions {
  blobId: string
  sealId: string
  policyObjectId: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  suiClient: any
  currentAddress: string
  /** wallet.signPersonalMessage from dapp-kit */
  signPersonalMessage: (args: { message: Uint8Array }) => Promise<{ signature: string }>
}

/**
 * Download the SEAL-encrypted blob from Walrus, request the decryption key
 * from the SEAL key server (which calls seal_approve on-chain to verify the
 * wallet has paid), and decrypt locally.
 *
 * Throws NoAccessError if the wallet has not paid the signal fee yet.
 */
export async function downloadAndDecryptSignal({
  blobId,
  sealId,
  policyObjectId,
  suiClient,
  currentAddress,
  signPersonalMessage,
}: DecryptSignalOptions): Promise<string> {
  const sealClient = createSealClient(suiClient)

  // 1. Create a short-lived session key (proves identity to key server)
  const sessionKey = await SessionKey.create({
    address: currentAddress,
    packageId: ECHO_PACKAGE_ID,
    ttlMin: 10,
    suiClient,
  })

  // 2. Sign the session key personal message with the connected wallet
  const personalMessage = sessionKey.getPersonalMessage()
  const { signature } = await signPersonalMessage({ message: personalMessage })
  await sessionKey.setPersonalMessageSignature(signature)

  // 3. Download encrypted bytes from Walrus
  const aggUrls = [WALRUS_AGGREGATOR, "https://aggregator.walrus-testnet.walrus.space"]
  const aggUrl = aggUrls[Math.floor(Math.random() * aggUrls.length)]
  const res = await fetch(`${aggUrl}/v1/blobs/${blobId}`, {
    signal: AbortSignal.timeout(10_000),
  })
  if (!res.ok) throw new Error(`Walrus fetch failed: ${res.status}`)
  const encryptedBytes = new Uint8Array(await res.arrayBuffer())

  // 4. Build the PTB that calls seal_approve — key server simulates this to
  //    verify the wallet has paid before releasing the decryption key.
  const tx = new Transaction()
  tx.moveCall({
    target: `${ECHO_PACKAGE_ID}::seal_signal::seal_approve`,
    arguments: [
      tx.pure.vector("u8", Array.from(fromHex(sealId))),
      tx.object(policyObjectId),
    ],
  })
  tx.setSender(currentAddress)
  const txBytes = await tx.build({ client: suiClient, onlyTransactionKind: true })

  // 5. decrypt() internally calls fetchKeys then decrypts locally — keys never
  //    leave the browser.
  const decrypted = await sealClient.decrypt({
    data: encryptedBytes,
    sessionKey,
    txBytes,
  })

  return new TextDecoder().decode(decrypted)
}

export { NoAccessError }
