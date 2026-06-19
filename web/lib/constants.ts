// ── Echo Contract Addresses (Sui Testnet) ────────────────────────────────────
export const ECHO_PACKAGE_ID =
  process.env.NEXT_PUBLIC_ECHO_PACKAGE_ID ??
  "0x74ddf6ea29b138db0f55db9aea82452ad80bbecf7d26bd05caa6095d05184125";

export const PROFILE_REGISTRY_ID =
  process.env.NEXT_PUBLIC_PROFILE_REGISTRY_ID ??
  "0xb846a650ce785b26f151ec79a074a80b1263a9b508c0d67af92f4b524ca49f24";

// ── DeepBook Predict Addresses (Sui Testnet) ─────────────────────────────────
export const PREDICT_PACKAGE_ID =
  process.env.NEXT_PUBLIC_PREDICT_PACKAGE_ID ??
  "0xf5ea2b3749c65d6e56507cc35388719aadb28f9cab873696a2f8687f5c785138";

export const PREDICT_OBJECT_ID =
  process.env.NEXT_PUBLIC_PREDICT_OBJECT_ID ??
  "0xc8736204d12f0a7277c86388a68bf8a194b0a14c5538ad13f22cbd8e2a38028a";

export const PREDICT_REGISTRY_ID =
  process.env.NEXT_PUBLIC_PREDICT_REGISTRY_ID ??
  "0x43af14fed5480c20ff77e2263d5f794c35b9fab7e2212903127062f4fe2a6e64";

// ── dUSDC Coin Type ───────────────────────────────────────────────────────────
export const DUSDC_TYPE =
  process.env.NEXT_PUBLIC_DUSDC_TYPE ??
  "0xe95040085976bfd54a1a07225cd46c8a2b4e8e2b6732f140a0fc49850ba73e1a::dusdc::DUSDC";

// ── Walrus Endpoints ─────────────────────────────────────────────────────────
export const WALRUS_AGGREGATOR =
  process.env.NEXT_PUBLIC_WALRUS_AGGREGATOR ??
  "https://aggregator.walrus-testnet.walrus.space";

export const WALRUS_PUBLISHER =
  process.env.NEXT_PUBLIC_WALRUS_PUBLISHER ??
  "https://publisher.walrus-testnet.walrus.space";

// ── DeepBook Predict Server ───────────────────────────────────────────────────
export const PREDICT_SERVER_URL =
  process.env.NEXT_PUBLIC_PREDICT_SERVER_URL ??
  "https://predict-server.testnet.mystenlabs.com";

// ── Sui Network ──────────────────────────────────────────────────────────────
export const SUI_NETWORK =
  process.env.NEXT_PUBLIC_SUI_NETWORK ?? "testnet";

export const SUI_RPC_URL = "https://fullnode.testnet.sui.io:443";

// ── Business Logic ───────────────────────────────────────────────────────────
export const FOLLOWER_BPS = 8500n; // 85%
export const PREDICTOR_BPS = 1500n; // 15%
export const BPS_DENOMINATOR = 10000n;
export const MIN_COPY_DUSD = 1_000_000n; // 1 dUSDC (6 decimals)
export const MIN_QUANTITY = 1_000_000n;  // minimum contracts for predict::mint
export const DUSDC_DECIMALS = 6;

// ── Helpers ───────────────────────────────────────────────────────────────────
export function formatDusd(raw: bigint | number): string {
  const n = typeof raw === "number" ? BigInt(raw) : raw;
  const whole = n / BigInt(10 ** DUSDC_DECIMALS);
  const frac = n % BigInt(10 ** DUSDC_DECIMALS);
  return `${whole}.${frac.toString().padStart(DUSDC_DECIMALS, "0").slice(0, 2)}`;
}

export function parseDusd(human: string): bigint {
  const [whole = "0", frac = "0"] = human.split(".");
  const fracPadded = frac.padEnd(DUSDC_DECIMALS, "0").slice(0, DUSDC_DECIMALS);
  return BigInt(whole) * BigInt(10 ** DUSDC_DECIMALS) + BigInt(fracPadded);
}
