import { WALRUS_PUBLISHER, WALRUS_AGGREGATOR } from "./constants"

/** Upload text content to Walrus decentralised storage. Returns the blob ID. */
export async function uploadToWalrus(content: string, epochs = 5): Promise<string> {
  const res = await fetch(`${WALRUS_PUBLISHER}/v1/blobs?epochs=${epochs}`, {
    method: "PUT",
    body: content,
    headers: { "Content-Type": "text/plain" },
  })
  if (!res.ok) throw new Error(`Walrus upload failed: ${res.status}`)
  const data = await res.json()
  const blobId: string | undefined =
    data?.newlyCreated?.blobObject?.blobId ?? data?.alreadyCertified?.blobId
  if (!blobId) throw new Error("Walrus returned no blobId")
  return blobId
}

/** Fetch text content from Walrus by blob ID. */
export async function fetchFromWalrus(blobId: string): Promise<string> {
  const res = await fetch(`${WALRUS_AGGREGATOR}/v1/blobs/${blobId}`)
  if (!res.ok) throw new Error(`Walrus fetch failed: ${res.status}`)
  return res.text()
}

export function walrusUrl(blobId: string): string {
  return `${WALRUS_AGGREGATOR}/v1/blobs/${blobId}`
}
