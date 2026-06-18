export type Direction = 'UP' | 'DOWN' | 'RANGE'
export type TradeOutcome = 'WIN' | 'LOSS' | 'OPEN'

export interface Predictor {
  address: string
  displayName: string
  initials: string
  avatarColor: string
  winRate: number
  totalTrades: number
  winningTrades: number
  streak: number
  bestStreak: number
  roi30d: number
  roi7d: number
  earningsCents: number
  followerCount: number
  joinedDaysAgo: number
  totalVolumeCents: number
  signalFeesEarnedCents: number
  recentTrades: HistoricalTrade[]
}

export interface ActiveTrade {
  id: string
  predictorAddress: string
  direction: Direction
  strike: number
  expiryMinutes: number
  impliedProb: number
  positionSizeCents: number
  copies: number
  postedMinutesAgo: number
  reasoning: string | null
  isPremium: boolean
  signalFeeCents: number
  btcCurrentPrice: number
  /** Real DeepBook Predict oracle ID when backed by live data */
  oracleId?: string
  /** On-chain PredictorProfile object ID — required for real copy transactions */
  predictorProfileObjectId?: string
  /** Override display fields when predictor isn't in mock data */
  predictorDisplay?: { displayName: string; initials: string; avatarColor: string; winRate: number; streak: number }
}

export interface HistoricalTrade {
  id: string
  direction: Direction
  strike: number
  outcome: TradeOutcome
  positionSizeCents: number
  payoutCents: number
  settledHoursAgo: number
  impliedProb: number
  copies: number
}

export interface PortfolioPosition {
  id: string
  predictorAddress: string
  direction: Direction
  strike: number
  expiryMinutes: number
  impliedProb: number
  amountCents: number
  outcome: TradeOutcome
  payoutCents: number
  predictorCutCents: number
  copiedMinutesAgo: number
}

// ─── Predictors ────────────────────────────────────────────────────────────────

export const predictors: Predictor[] = [
  {
    address: '0x1a2b3c4d5e6f7890abcdef1234567890abcd',
    displayName: 'Alex Chen',
    initials: 'AC',
    avatarColor: 'bg-indigo-500/20 text-indigo-400',
    winRate: 71,
    totalTrades: 47,
    winningTrades: 33,
    streak: 9,
    bestStreak: 12,
    roi30d: 34.2,
    roi7d: 18.4,
    earningsCents: 1245000,
    followerCount: 234,
    joinedDaysAgo: 45,
    totalVolumeCents: 18600000,
    signalFeesEarnedCents: 48000,
    recentTrades: [
      { id: 'h1', direction: 'UP', strike: 68200, outcome: 'WIN', positionSizeCents: 5000, payoutCents: 9200, settledHoursAgo: 2, impliedProb: 68, copies: 14 },
      { id: 'h2', direction: 'UP', strike: 67500, outcome: 'WIN', positionSizeCents: 5000, payoutCents: 8800, settledHoursAgo: 7, impliedProb: 65, copies: 9 },
      { id: 'h3', direction: 'DOWN', strike: 69000, outcome: 'WIN', positionSizeCents: 5000, payoutCents: 9600, settledHoursAgo: 14, impliedProb: 71, copies: 11 },
      { id: 'h4', direction: 'UP', strike: 67000, outcome: 'LOSS', positionSizeCents: 5000, payoutCents: 0, settledHoursAgo: 22, impliedProb: 58, copies: 6 },
      { id: 'h5', direction: 'RANGE', strike: 68000, outcome: 'WIN', positionSizeCents: 5000, payoutCents: 7400, settledHoursAgo: 31, impliedProb: 62, copies: 8 },
      { id: 'h6', direction: 'UP', strike: 66800, outcome: 'WIN', positionSizeCents: 5000, payoutCents: 9100, settledHoursAgo: 38, impliedProb: 70, copies: 12 },
    ],
  },
  {
    address: '0x5678abcdef901234567890abcdef012345',
    displayName: 'Yuki Tanaka',
    initials: 'YT',
    avatarColor: 'bg-emerald-500/20 text-emerald-400',
    winRate: 78,
    totalTrades: 29,
    winningTrades: 22,
    streak: 12,
    bestStreak: 12,
    roi30d: 42.1,
    roi7d: 28.7,
    earningsCents: 1560000,
    followerCount: 187,
    joinedDaysAgo: 18,
    totalVolumeCents: 9800000,
    signalFeesEarnedCents: 82000,
    recentTrades: [
      { id: 'h7', direction: 'UP', strike: 69200, outcome: 'WIN', positionSizeCents: 10000, payoutCents: 18400, settledHoursAgo: 3, impliedProb: 72, copies: 21 },
      { id: 'h8', direction: 'UP', strike: 68900, outcome: 'WIN', positionSizeCents: 10000, payoutCents: 17200, settledHoursAgo: 9, impliedProb: 69, copies: 18 },
      { id: 'h9', direction: 'DOWN', strike: 70000, outcome: 'WIN', positionSizeCents: 10000, payoutCents: 19600, settledHoursAgo: 16, impliedProb: 74, copies: 24 },
      { id: 'h10', direction: 'UP', strike: 68000, outcome: 'WIN', positionSizeCents: 10000, payoutCents: 16800, settledHoursAgo: 24, impliedProb: 67, copies: 16 },
      { id: 'h11', direction: 'RANGE', strike: 68500, outcome: 'WIN', positionSizeCents: 10000, payoutCents: 14200, settledHoursAgo: 32, impliedProb: 63, copies: 13 },
      { id: 'h12', direction: 'UP', strike: 67200, outcome: 'LOSS', positionSizeCents: 10000, payoutCents: 0, settledHoursAgo: 40, impliedProb: 61, copies: 10 },
    ],
  },
  {
    address: '0x9012cdef34567890abcdef12345678abcd',
    displayName: 'Diana Walsh',
    initials: 'DW',
    avatarColor: 'bg-amber-500/20 text-amber-400',
    winRate: 61,
    totalTrades: 89,
    winningTrades: 54,
    streak: 3,
    bestStreak: 18,
    roi30d: 22.8,
    roi7d: 5.2,
    earningsCents: 2100000,
    followerCount: 412,
    joinedDaysAgo: 120,
    totalVolumeCents: 52000000,
    signalFeesEarnedCents: 124000,
    recentTrades: [
      { id: 'h13', direction: 'DOWN', strike: 68800, outcome: 'WIN', positionSizeCents: 3000, payoutCents: 5400, settledHoursAgo: 4, impliedProb: 66, copies: 7 },
      { id: 'h14', direction: 'UP', strike: 67800, outcome: 'WIN', positionSizeCents: 3000, payoutCents: 5100, settledHoursAgo: 11, impliedProb: 63, copies: 5 },
      { id: 'h15', direction: 'UP', strike: 68300, outcome: 'LOSS', positionSizeCents: 3000, payoutCents: 0, settledHoursAgo: 18, impliedProb: 59, copies: 4 },
      { id: 'h16', direction: 'DOWN', strike: 69500, outcome: 'WIN', positionSizeCents: 3000, payoutCents: 5600, settledHoursAgo: 26, impliedProb: 68, copies: 6 },
    ],
  },
  {
    address: '0xabcdef012345678901abcdef2345678901',
    displayName: 'Sarah Park',
    initials: 'SP',
    avatarColor: 'bg-pink-500/20 text-pink-400',
    winRate: 68,
    totalTrades: 38,
    winningTrades: 25,
    streak: 5,
    bestStreak: 9,
    roi30d: 29.6,
    roi7d: 14.1,
    earningsCents: 920000,
    followerCount: 156,
    joinedDaysAgo: 32,
    totalVolumeCents: 13400000,
    signalFeesEarnedCents: 36000,
    recentTrades: [
      { id: 'h17', direction: 'DOWN', strike: 68100, outcome: 'WIN', positionSizeCents: 4000, payoutCents: 7200, settledHoursAgo: 5, impliedProb: 64, copies: 8 },
      { id: 'h18', direction: 'UP', strike: 67900, outcome: 'WIN', positionSizeCents: 4000, payoutCents: 7000, settledHoursAgo: 12, impliedProb: 66, copies: 7 },
      { id: 'h19', direction: 'RANGE', strike: 68500, outcome: 'LOSS', positionSizeCents: 4000, payoutCents: 0, settledHoursAgo: 20, impliedProb: 57, copies: 5 },
      { id: 'h20', direction: 'DOWN', strike: 69200, outcome: 'WIN', positionSizeCents: 4000, payoutCents: 7600, settledHoursAgo: 28, impliedProb: 70, copies: 9 },
    ],
  },
  {
    address: '0xdef0123456789012cdef34567890abcdef',
    displayName: 'Marcus Rivera',
    initials: 'MR',
    avatarColor: 'bg-violet-500/20 text-violet-400',
    winRate: 64,
    totalTrades: 52,
    winningTrades: 33,
    streak: 2,
    bestStreak: 8,
    roi30d: 19.3,
    roi7d: -2.8,
    earningsCents: 780000,
    followerCount: 98,
    joinedDaysAgo: 67,
    totalVolumeCents: 21800000,
    signalFeesEarnedCents: 22000,
    recentTrades: [
      { id: 'h21', direction: 'UP', strike: 68400, outcome: 'WIN', positionSizeCents: 2500, payoutCents: 4400, settledHoursAgo: 6, impliedProb: 62, copies: 4 },
      { id: 'h22', direction: 'DOWN', strike: 68700, outcome: 'WIN', positionSizeCents: 2500, payoutCents: 4600, settledHoursAgo: 14, impliedProb: 65, copies: 3 },
      { id: 'h23', direction: 'UP', strike: 67600, outcome: 'LOSS', positionSizeCents: 2500, payoutCents: 0, settledHoursAgo: 22, impliedProb: 56, copies: 2 },
      { id: 'h24', direction: 'RANGE', strike: 68200, outcome: 'LOSS', positionSizeCents: 2500, payoutCents: 0, settledHoursAgo: 30, impliedProb: 54, copies: 3 },
    ],
  },
]

// ─── Active Trades (Feed) ──────────────────────────────────────────────────────

export const activeTrades: ActiveTrade[] = [
  {
    id: 'trade_001',
    predictorAddress: '0x1a2b3c4d5e6f7890abcdef1234567890abcd',
    direction: 'UP',
    strike: 68500,
    expiryMinutes: 43,
    impliedProb: 67,
    positionSizeCents: 5000,
    copies: 12,
    postedMinutesAgo: 8,
    reasoning: 'I think the 4h support at 68.2k holds and we squeeze into the expiry. High conviction based on the order book depth — bids stacking at 68.1k.',
    isPremium: false,
    signalFeeCents: 0,
    btcCurrentPrice: 68340,
  },
  {
    id: 'trade_002',
    predictorAddress: '0x5678abcdef901234567890abcdef012345',
    direction: 'UP',
    strike: 69200,
    expiryMinutes: 112,
    impliedProb: 72,
    positionSizeCents: 10000,
    copies: 19,
    postedMinutesAgo: 22,
    reasoning: null,
    isPremium: true,
    signalFeeCents: 50,
    btcCurrentPrice: 68340,
  },
  {
    id: 'trade_003',
    predictorAddress: '0x9012cdef34567890abcdef12345678abcd',
    direction: 'DOWN',
    strike: 67800,
    expiryMinutes: 55,
    impliedProb: 58,
    positionSizeCents: 3000,
    copies: 5,
    postedMinutesAgo: 14,
    reasoning: 'Resistance at 68.8k is strong. Volume declining on this rally — expecting rejection and a move back below 67.8k before the hour is out.',
    isPremium: false,
    signalFeeCents: 0,
    btcCurrentPrice: 68340,
  },
  {
    id: 'trade_004',
    predictorAddress: '0xabcdef012345678901abcdef2345678901',
    direction: 'DOWN',
    strike: 67000,
    expiryMinutes: 80,
    impliedProb: 44,
    positionSizeCents: 4000,
    copies: 8,
    postedMinutesAgo: 31,
    reasoning: null,
    isPremium: true,
    signalFeeCents: 100,
    btcCurrentPrice: 68340,
  },
  {
    id: 'trade_005',
    predictorAddress: '0x1a2b3c4d5e6f7890abcdef1234567890abcd',
    direction: 'RANGE',
    strike: 68000,
    expiryMinutes: 240,
    impliedProb: 61,
    positionSizeCents: 5000,
    copies: 7,
    postedMinutesAgo: 45,
    reasoning: 'BTC has been consolidating in the 67.8k–69.2k range for 18 hours. I expect this continues for another 4 hours — selling volatility here.',
    isPremium: false,
    signalFeeCents: 0,
    btcCurrentPrice: 68340,
  },
  {
    id: 'trade_006',
    predictorAddress: '0x5678abcdef901234567890abcdef012345',
    direction: 'UP',
    strike: 68800,
    expiryMinutes: 30,
    impliedProb: 74,
    positionSizeCents: 10000,
    copies: 24,
    postedMinutesAgo: 5,
    reasoning: 'Short-term momentum is strong. RSI divergence on the 15m chart pointing up. This should tap 68.8k in the next 30 minutes.',
    isPremium: false,
    signalFeeCents: 0,
    btcCurrentPrice: 68340,
  },
  {
    id: 'trade_007',
    predictorAddress: '0xdef0123456789012cdef34567890abcdef',
    direction: 'DOWN',
    strike: 68200,
    expiryMinutes: 95,
    impliedProb: 49,
    positionSizeCents: 2500,
    copies: 3,
    postedMinutesAgo: 52,
    reasoning: 'Contrarian play — the move to 68.3k felt exhausted. Expecting reversion.',
    isPremium: false,
    signalFeeCents: 0,
    btcCurrentPrice: 68340,
  },
  {
    id: 'trade_008',
    predictorAddress: '0x9012cdef34567890abcdef12345678abcd',
    direction: 'UP',
    strike: 69000,
    expiryMinutes: 180,
    impliedProb: 63,
    positionSizeCents: 3000,
    copies: 6,
    postedMinutesAgo: 67,
    reasoning: null,
    isPremium: true,
    signalFeeCents: 75,
    btcCurrentPrice: 68340,
  },
]

// ─── Portfolio (connected wallet = "0xYOUR...WALLET") ──────────────────────────

export const portfolioPositions: PortfolioPosition[] = [
  // Open positions
  {
    id: 'pos_001',
    predictorAddress: '0x5678abcdef901234567890abcdef012345',
    direction: 'UP',
    strike: 68800,
    expiryMinutes: 30,
    impliedProb: 74,
    amountCents: 2000,
    outcome: 'OPEN',
    payoutCents: 0,
    predictorCutCents: 0,
    copiedMinutesAgo: 5,
  },
  {
    id: 'pos_002',
    predictorAddress: '0x1a2b3c4d5e6f7890abcdef1234567890abcd',
    direction: 'RANGE',
    strike: 68000,
    expiryMinutes: 240,
    impliedProb: 61,
    amountCents: 1500,
    outcome: 'OPEN',
    payoutCents: 0,
    predictorCutCents: 0,
    copiedMinutesAgo: 10,
  },
  // Settled wins
  {
    id: 'pos_003',
    predictorAddress: '0x1a2b3c4d5e6f7890abcdef1234567890abcd',
    direction: 'UP',
    strike: 68200,
    expiryMinutes: 0,
    impliedProb: 68,
    amountCents: 2000,
    outcome: 'WIN',
    payoutCents: 3400,
    predictorCutCents: 510,
    copiedMinutesAgo: 130,
  },
  {
    id: 'pos_004',
    predictorAddress: '0x5678abcdef901234567890abcdef012345',
    direction: 'UP',
    strike: 68900,
    expiryMinutes: 0,
    impliedProb: 69,
    amountCents: 3000,
    outcome: 'WIN',
    payoutCents: 5100,
    predictorCutCents: 765,
    copiedMinutesAgo: 200,
  },
  {
    id: 'pos_005',
    predictorAddress: '0x9012cdef34567890abcdef12345678abcd',
    direction: 'DOWN',
    strike: 68800,
    expiryMinutes: 0,
    impliedProb: 66,
    amountCents: 1000,
    outcome: 'WIN',
    payoutCents: 1700,
    predictorCutCents: 255,
    copiedMinutesAgo: 260,
  },
  // Settled losses
  {
    id: 'pos_006',
    predictorAddress: '0xdef0123456789012cdef34567890abcdef',
    direction: 'UP',
    strike: 67600,
    expiryMinutes: 0,
    impliedProb: 56,
    amountCents: 1500,
    outcome: 'LOSS',
    payoutCents: 0,
    predictorCutCents: 0,
    copiedMinutesAgo: 320,
  },
  {
    id: 'pos_007',
    predictorAddress: '0xabcdef012345678901abcdef2345678901',
    direction: 'RANGE',
    strike: 68500,
    expiryMinutes: 0,
    impliedProb: 57,
    amountCents: 1000,
    outcome: 'LOSS',
    payoutCents: 0,
    predictorCutCents: 0,
    copiedMinutesAgo: 390,
  },
]

// ─── Helpers ───────────────────────────────────────────────────────────────────

export function getPredictorByAddress(address: string): Predictor | undefined {
  return predictors.find(p => p.address === address)
}

export function getTradesByPredictor(address: string): ActiveTrade[] {
  return activeTrades.filter(t => t.predictorAddress === address)
}

export const MOCK_WALLET = '0xYOUR7890wallet1234abcdef5678WALLET'

export const globalStats = {
  totalVolumeToday: 324700,
  activePositions: 89,
  livePredictors: 23,
  totalCopies: 341,
  btcPrice: 68340,
  btcChange24h: 2.4,
}
