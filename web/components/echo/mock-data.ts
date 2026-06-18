export interface Predictor {
  address: string
  displayName: string
  winRate: number
  totalTrades: number
  streak: number
  roi7d: number
  followers: number
}

export type TradeDirection = "UP" | "DOWN" | "RANGE"

export interface TradeCall {
  id: string
  predictor: Predictor
  direction: TradeDirection
  strike: number
  expiryMs: number
  impliedProb: number
  positionSize: number
  copiers: number
  reasoning: string
  isPremium: boolean
  signalFee?: number
  postedAt: number
}

export interface PortfolioPosition {
  id: string
  predictor: Predictor
  direction: TradeDirection
  strike: number
  expiryMs: number
  amount: number
  status: "open" | "won" | "lost"
  payout?: number
  settledAt?: number
}

export interface TradeHistoryItem {
  id: string
  direction: TradeDirection
  strike: number
  outcome: "won" | "lost"
  payout: number
  amount: number
  date: number
}

const NOW = Date.now()

export const MOCK_PREDICTORS: Predictor[] = [
  {
    address: "0x4a5fe2d1c3b8f9a7",
    displayName: "Alex.sui",
    winRate: 71,
    totalTrades: 47,
    streak: 8,
    roi7d: 34.2,
    followers: 156,
  },
  {
    address: "0x9b2c7e4d1f5a8c3e",
    displayName: "CryptoOracle",
    winRate: 68,
    totalTrades: 92,
    streak: 5,
    roi7d: 22.7,
    followers: 243,
  },
  {
    address: "0x3d8f1a5c9e2b7d4f",
    displayName: "SuiWhale",
    winRate: 64,
    totalTrades: 134,
    streak: 3,
    roi7d: 18.4,
    followers: 89,
  },
  {
    address: "0x7e1b4d9c2f6a3e8b",
    displayName: "VolSurfer",
    winRate: 79,
    totalTrades: 28,
    streak: 12,
    roi7d: 51.3,
    followers: 67,
  },
  {
    address: "0x2f9d6c1e4b8a5f3d",
    displayName: "DeepBookDegen",
    winRate: 55,
    totalTrades: 203,
    streak: 1,
    roi7d: 8.9,
    followers: 412,
  },
]

export const MOCK_TRADE_CALLS: TradeCall[] = [
  {
    id: "1",
    predictor: MOCK_PREDICTORS[0],
    direction: "UP",
    strike: 68500,
    expiryMs: NOW + 43 * 60 * 1000,
    impliedProb: 67,
    positionSize: 50,
    copiers: 12,
    reasoning:
      "I think the 4h support at 68.2k holds and we squeeze into the expiry. High conviction. The order book is stacked at 68.1k and shorts are getting squeezed hard.",
    isPremium: false,
    postedAt: NOW - 8 * 60 * 1000,
  },
  {
    id: "2",
    predictor: MOCK_PREDICTORS[1],
    direction: "DOWN",
    strike: 69000,
    expiryMs: NOW + 87 * 60 * 1000,
    impliedProb: 54,
    positionSize: 100,
    reasoning: "",
    isPremium: true,
    signalFee: 0.5,
    copiers: 31,
    postedAt: NOW - 22 * 60 * 1000,
  },
  {
    id: "3",
    predictor: MOCK_PREDICTORS[3],
    direction: "UP",
    strike: 67800,
    expiryMs: NOW + 28 * 60 * 1000,
    impliedProb: 73,
    positionSize: 25,
    copiers: 8,
    reasoning:
      "Vol surface pricing looks cheap here. 1H implied vol collapsed after the CPI print. This is a vol reversion play — BTC bounces before expiry.",
    isPremium: false,
    postedAt: NOW - 5 * 60 * 1000,
  },
  {
    id: "4",
    predictor: MOCK_PREDICTORS[2],
    direction: "RANGE",
    strike: 68000,
    expiryMs: NOW + 115 * 60 * 1000,
    impliedProb: 61,
    positionSize: 75,
    copiers: 5,
    reasoning:
      "BTC is pinned between 67.8k and 69.2k. Expecting choppy price action into the weekend. Range gives 61% implied probability from the SVI surface.",
    isPremium: false,
    postedAt: NOW - 35 * 60 * 1000,
  },
]

export const MOCK_PORTFOLIO: PortfolioPosition[] = [
  {
    id: "p1",
    predictor: MOCK_PREDICTORS[0],
    direction: "UP",
    strike: 68500,
    expiryMs: NOW + 43 * 60 * 1000,
    amount: 20,
    status: "open",
  },
  {
    id: "p2",
    predictor: MOCK_PREDICTORS[1],
    direction: "DOWN",
    strike: 69500,
    expiryMs: NOW - 2 * 60 * 60 * 1000,
    amount: 30,
    status: "won",
    payout: 25.5,
    settledAt: NOW - 2 * 60 * 60 * 1000,
  },
  {
    id: "p3",
    predictor: MOCK_PREDICTORS[2],
    direction: "UP",
    strike: 67000,
    expiryMs: NOW - 5 * 60 * 60 * 1000,
    amount: 15,
    status: "lost",
    payout: 0,
    settledAt: NOW - 5 * 60 * 60 * 1000,
  },
]

export const MOCK_TRADE_HISTORY: TradeHistoryItem[] = [
  { id: "h1", direction: "UP", strike: 67500, outcome: "won", payout: 42, amount: 25, date: NOW - 24 * 60 * 60 * 1000 },
  { id: "h2", direction: "DOWN", strike: 69000, outcome: "won", payout: 85, amount: 50, date: NOW - 2 * 24 * 60 * 60 * 1000 },
  { id: "h3", direction: "UP", strike: 68000, outcome: "lost", payout: 0, amount: 30, date: NOW - 3 * 24 * 60 * 60 * 1000 },
  { id: "h4", direction: "RANGE", strike: 67000, outcome: "won", payout: 120, amount: 75, date: NOW - 4 * 24 * 60 * 60 * 1000 },
  { id: "h5", direction: "DOWN", strike: 70000, outcome: "won", payout: 38, amount: 20, date: NOW - 5 * 24 * 60 * 60 * 1000 },
  { id: "h6", direction: "UP", strike: 66500, outcome: "lost", payout: 0, amount: 40, date: NOW - 6 * 24 * 60 * 60 * 1000 },
]

export function formatExpiry(expiryMs: number): string {
  const diff = expiryMs - Date.now()
  if (diff <= 0) return "Expired"
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m`
  const hrs = Math.floor(mins / 60)
  const rem = mins % 60
  return rem > 0 ? `${hrs}h ${rem}m` : `${hrs}h`
}

export function formatPostedAt(postedAt: number): string {
  const diff = Date.now() - postedAt
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  return `${Math.floor(mins / 60)}h ago`
}

export function getDirectionClasses(direction: TradeDirection) {
  if (direction === "UP")
    return { badge: "bg-green-500/10 text-green-500 border border-green-500/20", text: "text-green-500" }
  if (direction === "DOWN")
    return { badge: "bg-red-500/10 text-red-500 border border-red-500/20", text: "text-red-500" }
  return { badge: "bg-blue-500/10 text-blue-500 border border-blue-500/20", text: "text-blue-500" }
}
