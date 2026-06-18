import { PREDICT_SERVER_URL, PREDICT_OBJECT_ID } from "./constants";

const BASE = PREDICT_SERVER_URL;
const PREDICT_ID = PREDICT_OBJECT_ID;

// ── Types ────────────────────────────────────────────────────────────────────

export interface OracleState {
  predict_id: string;
  oracle_id: string;
  oracle_cap_id: string;
  underlying_asset: string;
  expiry: number;
  min_strike: number;
  tick_size: number;
  status: "active" | "settled" | "expired";
  activated_at: number;
  settlement_price: number | null;
  settled_at: number | null;
  created_checkpoint: number;
}

export interface OracleSVI {
  oracle_id: string;
  a: number;
  b: number;
  rho: number;
  m: number;
  sigma: number;
  forward_price: number;
  spot_price: number;
  timestamp: number;
}

export interface OraclePriceLatest {
  oracle_id: string;
  spot_price: number;
  forward_price: number;
  timestamp: number;
}

export interface ManagerSummary {
  manager_id: string;
  owner: string;
  balance: number;
  total_long_value: number;
  total_short_value: number;
  position_count: number;
}

export interface PositionMinted {
  oracle_id: string;
  manager_id: string;
  owner: string;
  market_key: {
    oracle_id: string;
    expiry: number;
    strike: number;
    direction: number; // 0 = UP, 1 = DOWN
  };
  quantity: number;
  cost: number;
  timestamp: number;
  tx_digest: string;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    next: { revalidate: 15 },
  } as RequestInit);
  if (!res.ok) throw new Error(`predict-api ${path}: ${res.status}`);
  return res.json() as Promise<T>;
}

// ── Exports ──────────────────────────────────────────────────────────────────

/** All currently active oracles (markets) */
export async function fetchActiveOracles(): Promise<OracleState[]> {
  const all = await get<OracleState[]>(`/predicts/${PREDICT_ID}/oracles`);
  return all.filter((o) => o.status === "active");
}

/** Oracle SVI volatility state (for implied probability) */
export async function fetchOracleSVI(oracleId: string): Promise<OracleSVI> {
  return get<OracleSVI>(`/oracles/${oracleId}/svi/latest`);
}

/** Latest spot + forward price from an oracle */
export async function fetchOraclePrice(
  oracleId: string
): Promise<OraclePriceLatest> {
  return get<OraclePriceLatest>(`/oracles/${oracleId}/prices/latest`);
}

/** Ask price bounds for a given oracle */
export async function fetchAskBounds(
  oracleId: string
): Promise<{ lower: number; upper: number }> {
  const raw = await get<{ lower: number; upper: number }>(
    `/oracles/${oracleId}/ask-bounds`
  );
  return raw;
}

/** All minted positions (feed of trade calls) */
export async function fetchMintedPositions(limit = 50): Promise<PositionMinted[]> {
  return get<PositionMinted[]>(`/positions/minted`);
}

/** Positions for a specific manager (wallet's portfolio) */
export async function fetchManagerSummary(
  managerId: string
): Promise<ManagerSummary> {
  return get<ManagerSummary>(`/managers/${managerId}/summary`);
}

/** Find manager IDs owned by a wallet address */
export async function fetchManagers(): Promise<
  { manager_id: string; owner: string }[]
> {
  return get<{ manager_id: string; owner: string }[]>(`/managers`);
}

/** Compute implied probability of UP from SVI parameters.
 *  Uses a simple approximation: p(UP) ≈ delta of the binary.
 *  For display purposes, we use (forward_price - strike) sensitivity.
 */
export function computeImpliedProbability(
  svi: OracleSVI,
  strike: number,
  isUp: boolean
): number {
  const { forward_price, a, b, rho, m, sigma } = svi;
  const k = Math.log(strike / forward_price);
  const w =
    a +
    b *
      (rho * (k - m) +
        Math.sqrt(Math.pow(k - m, 2) + Math.pow(sigma, 2)));
  const vol = Math.sqrt(Math.max(w, 0));

  // Normal CDF approximation
  const d = -k / (vol + 1e-10);
  const p = normalCDF(d);
  return isUp ? p : 1 - p;
}

function normalCDF(x: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(x));
  const poly =
    t *
    (0.319381530 +
      t *
        (-0.356563782 +
          t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))));
  const cdf = 1 - (1 / Math.sqrt(2 * Math.PI)) * Math.exp(-0.5 * x * x) * poly;
  return x >= 0 ? cdf : 1 - cdf;
}

/** Human-readable time until expiry */
export function formatExpiry(expiryMs: number): string {
  const diff = expiryMs - Date.now();
  if (diff <= 0) return "Expired";
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(mins / 60);
  if (hours > 0) return `${hours}h ${mins % 60}m`;
  return `${mins}m`;
}

/** Format strike from raw 9-decimal fixed-point to USD */
export function formatStrike(raw: number): string {
  return `$${(raw / 1e9).toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}
