"use client"

import { useState } from "react"
import Link from "next/link"
import Header from "@/components/landing-page/header"
import Footer from "@/components/landing-page/footer"
import {
  fetchFollowerCopies, fetchCopySettledEvents, fetchAllProfiles,
  buildSettleCopyTx, buildRedeemOwnTradeTx, buildWithdrawFromManagerTx,
} from "@/lib/sui-client"
import {
  fetchManagers, fetchManagerSummary, fetchManagerPositions, fetchAllOracles,
} from "@/lib/predict-api"
import { DUSDC_DECIMALS, MIN_QUANTITY } from "@/lib/constants"
import { useCurrentAccount, useSignAndExecuteTransaction } from "@mysten/dapp-kit"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import {
  TrendingUp, TrendingDown, DollarSign, Activity, BarChart2,
  Loader2, ExternalLink, CheckCircle2, XCircle, Trophy, Zap,
  Target, Users, Wallet,
} from "lucide-react"
import CoinLogo from "@/components/echo/coin-logo"

// ── helpers ──────────────────────────────────────────────────────────────────

function fDusd(raw: number) {
  return (raw / Math.pow(10, DUSDC_DECIMALS)).toFixed(2)
}

function fDusdSigned(raw: number) {
  const v = raw / Math.pow(10, DUSDC_DECIMALS)
  return (v >= 0 ? "+" : "") + v.toFixed(2)
}

function formatExpiry(ms: number) {
  const diff = ms - Date.now()
  if (diff <= 0) return "Expired"
  const mins = Math.floor(diff / 60_000)
  if (mins < 60) return `${mins}m`
  return `${Math.floor(mins / 60)}h ${mins % 60}m`
}

function formatStrikeRaw(raw: number) {
  return `$${(raw / 1e9).toLocaleString("en-US", { maximumFractionDigits: 0 })}`
}

function dirClasses(dir: string) {
  if (dir === "UP" || dir === "up") return "bg-green-500/10 text-green-500 border border-green-500/20"
  if (dir === "DOWN" || dir === "down") return "bg-red-500/10 text-red-500 border border-red-500/20"
  return "bg-blue-500/10 text-blue-500 border border-blue-500/20"
}

// ── DonutChart ────────────────────────────────────────────────────────────────

function DonutChart({ won, lost }: { won: number; lost: number }) {
  const total = won + lost
  const r = 38
  const circ = 2 * Math.PI * r
  const pct = total > 0 ? Math.round((won / total) * 100) : 0
  const wonArc = total > 0 ? (won / total) * circ : 0
  const lostArc = total > 0 ? (lost / total) * circ : 0

  return (
    <div className="relative w-[120px] h-[120px] flex-shrink-0">
      <svg width="120" height="120" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={r} fill="none" stroke="#374151" strokeWidth="13" />
        {total > 0 && (
          <>
            <circle cx="50" cy="50" r={r} fill="none" stroke="#ef4444" strokeWidth="13"
              strokeDasharray={`${lostArc} ${circ}`}
              transform="rotate(-90 50 50)" />
            <circle cx="50" cy="50" r={r} fill="none" stroke="#22c55e" strokeWidth="13"
              strokeDasharray={`${wonArc} ${circ}`}
              strokeDashoffset={-lostArc}
              transform="rotate(-90 50 50)" />
          </>
        )}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-bold text-black dark:text-white leading-none">{pct}%</span>
        <span className="text-[9px] text-gray-500 dark:text-gray-400 uppercase tracking-wider mt-0.5">wins</span>
      </div>
    </div>
  )
}

// ── StatCard ──────────────────────────────────────────────────────────────────

function StatCard({
  label, value, sub, icon: Icon, color, dimmed,
}: {
  label: string
  value: string
  sub?: string
  icon: React.ElementType
  color: string
  dimmed?: boolean
}) {
  return (
    <div className="card p-5 shadow-md hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${dimmed ? "bg-gray-100 dark:bg-gray-800" : "bg-[#7A7FEE]/10"}`}>
          <Icon className={`w-4 h-4 ${color}`} />
        </div>
      </div>
      <p className={`text-xl font-bold leading-none mb-1 ${dimmed ? "text-gray-400 dark:text-gray-500" : color}`}>
        {value}
      </p>
      <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{label}</p>
      {sub && <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">{sub}</p>}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function PortfolioPage() {
  const account = useCurrentAccount()
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction()
  const queryClient = useQueryClient()
  const [settlingId, setSettlingId] = useState<string | null>(null)
  const [settleError, setSettleError] = useState<string | null>(null)
  const [redeemingDigest, setRedeemingDigest] = useState<string | null>(null)
  const [redeemError, setRedeemError] = useState<string | null>(null)
  const [withdrawing, setWithdrawing] = useState(false)
  const [withdrawError, setWithdrawError] = useState<string | null>(null)
  const [withdrawSuccess, setWithdrawSuccess] = useState(false)

  // ── queries ──

  const { data: managerData, isLoading: managerLoading } = useQuery({
    queryKey: ["my-manager", account?.address],
    queryFn: async () => {
      if (!account?.address) return null
      const all = await fetchManagers()
      return all.find(m => m.owner === account.address) ?? null
    },
    enabled: !!account?.address,
    staleTime: 30_000,
  })

  const { data: managerSummary, isLoading: summaryLoading } = useQuery({
    queryKey: ["manager-summary", managerData?.manager_id],
    queryFn: () => fetchManagerSummary(managerData!.manager_id),
    enabled: !!managerData?.manager_id,
    staleTime: 15_000,
    refetchInterval: 30_000,
  })

  const { data: managerPositions, isLoading: positionsLoading } = useQuery({
    queryKey: ["manager-positions", managerData?.manager_id],
    queryFn: () => fetchManagerPositions(managerData!.manager_id),
    enabled: !!managerData?.manager_id,
    staleTime: 15_000,
    refetchInterval: 30_000,
  })

  const { data: copyEvents, isLoading: copyLoading } = useQuery({
    queryKey: ["follower-copies", account?.address],
    queryFn: () => fetchFollowerCopies(account!.address),
    enabled: !!account?.address,
    staleTime: 30_000,
    refetchInterval: 60_000,
  })

  const { data: allOracles } = useQuery({
    queryKey: ["all-oracles"],
    queryFn: fetchAllOracles,
    staleTime: 30_000,
    enabled: !!account?.address,
  })

  const { data: allProfiles } = useQuery({
    queryKey: ["profiles"],
    queryFn: fetchAllProfiles,
    staleTime: 60_000,
    enabled: !!account?.address,
  })

  const { data: settledCopyEvents } = useQuery({
    queryKey: ["settled-copy-events", account?.address],
    queryFn: () => fetchCopySettledEvents(200),
    enabled: !!account?.address,
    staleTime: 30_000,
  })

  // ── derived state ──

  const isLoading = managerLoading || summaryLoading || copyLoading || positionsLoading
  const isLive = !!managerData && !!managerSummary

  const redeemedKeys = new Set(
    (managerPositions?.redeemed ?? []).map(p => `${p.oracle_id}:${p.strike}:${p.expiry}:${p.is_up}`)
  )
  const settledCopyRecordIds = new Set(
    (settledCopyEvents?.data ?? [])
      .filter(e => (e.parsedJson as { follower: string }).follower === account?.address)
      .map(e => (e.parsedJson as { copy_record_id: string }).copy_record_id)
  )

  // Parse copy events
  const myCopyEvents = (copyEvents ?? []).map((e) => {
    const j = e.parsedJson as {
      copy_record_id: string
      follower: string
      predictor: string
      oracle_id: string
      strike: string
      is_up: boolean
      expiry_ms: string
      amount_dusd: string
    }
    return {
      id: j.copy_record_id,
      predictorAddress: j.predictor,
      oracleId: j.oracle_id,
      direction: j.is_up ? "UP" : "DOWN",
      isUp: j.is_up,
      strike: Number(j.strike),
      expiryMs: Number(j.expiry_ms),
      amountDusd: Number(j.amount_dusd),
    }
  })

  const myMinted = managerPositions?.minted ?? []

  // Oracle map for settlement lookups
  const oracleMap = new Map((allOracles ?? []).map(o => [o.oracle_id, o]))

  // Own trade outcomes
  const ownExpired = myMinted.filter(p => p.expiry <= Date.now())
  const ownSettled = ownExpired.filter(p => oracleMap.get(p.oracle_id)?.settlement_price != null)
  const ownWon = ownSettled.filter(p => {
    const sp = oracleMap.get(p.oracle_id)!.settlement_price!
    return p.is_up ? sp > p.strike : sp <= p.strike
  })
  const ownLost = ownSettled.filter(p => {
    const sp = oracleMap.get(p.oracle_id)!.settlement_price!
    return p.is_up ? sp <= p.strike : sp > p.strike
  })

  // Copy trade outcomes
  const copyExpired = myCopyEvents.filter(p => p.expiryMs <= Date.now())
  const copySettledList = copyExpired.filter(p => oracleMap.get(p.oracleId)?.settlement_price != null)
  const copyWon = copySettledList.filter(p => {
    const sp = oracleMap.get(p.oracleId)!.settlement_price!
    return p.isUp ? sp > p.strike : sp <= p.strike
  })
  const copyLost = copySettledList.filter(p => {
    const sp = oracleMap.get(p.oracleId)!.settlement_price!
    return p.isUp ? sp <= p.strike : sp > p.strike
  })

  // Combined metrics
  const totalWon = ownWon.length + copyWon.length
  const totalLost = ownLost.length + copyLost.length
  const totalSettled = totalWon + totalLost
  const overallWinRate = totalSettled > 0 ? Math.round((totalWon / totalSettled) * 100) : null

  // Recent 10 settled trades (newest first) for streak display
  const recentTrades = [
    ...ownSettled.map(p => ({
      time: p.checkpoint_timestamp_ms,
      won: ownWon.some(w => w.digest === p.digest),
      label: p.is_up ? "UP" : "DOWN",
    })),
    ...copySettledList.map(p => ({
      time: p.expiryMs,
      won: copyWon.some(w => w.id === p.id),
      label: p.isUp ? "UP" : "DOWN",
    })),
  ].sort((a, b) => b.time - a.time).slice(0, 10)

  let currentStreak = 0
  for (const t of recentTrades) {
    if (t.won) currentStreak++; else break
  }

  // Total wagered
  const totalWagered =
    myMinted.reduce((s, p) => s + p.cost, 0) / 1e6 +
    myCopyEvents.reduce((s, p) => s + p.amountDusd, 0) / 1e6

  // Echo profile for this wallet
  const echoProfile = allProfiles?.find(p => p.wallet === account?.address)
  const liveBalance = managerSummary?.trading_balance ?? 0
  const livePositions = managerSummary?.open_positions ?? 0
  const realizedPnl = managerSummary?.realized_pnl ?? 0
  const unrealizedPnl = managerSummary?.unrealized_pnl ?? 0
  const awaitingSettlement = managerSummary?.awaiting_settlement_positions ?? 0

  // ── handlers ──

  async function handleSettle(pos: typeof myCopyEvents[0]) {
    if (!account || !managerData) return
    setSettlingId(pos.id)
    setSettleError(null)
    try {
      const oracle = allOracles?.find(o => o.oracle_id === pos.oracleId)
      if (!oracle) throw new Error("Oracle not found")
      if (oracle.status !== "settled" || oracle.settlement_price == null)
        throw new Error("Oracle not settled yet — try again after expiry")
      const predictorProfile = allProfiles?.find(
        p => p.wallet.toLowerCase() === pos.predictorAddress.toLowerCase()
      )
      if (!predictorProfile) throw new Error("Predictor has no Echo profile")
      const predictorProfileId = (predictorProfile.id as unknown as { id: string }).id
      const won = pos.isUp
        ? oracle.settlement_price > pos.strike
        : oracle.settlement_price < pos.strike
      const quantity = BigInt(Math.max(pos.amountDusd, Number(MIN_QUANTITY)))
      const payoutAmount = won ? quantity : 0n
      const alreadyRedeemed = redeemedKeys.has(`${pos.oracleId}:${pos.strike}:${pos.expiryMs}:${pos.isUp}`)
      const tx = buildSettleCopyTx({
        copyRecordId: pos.id, predictorProfileId,
        managerObjectId: managerData.manager_id,
        oracleId: pos.oracleId, strike: BigInt(pos.strike),
        isUp: pos.isUp, expiryMs: BigInt(pos.expiryMs),
        quantity, payoutAmount, won, alreadyRedeemed,
      })
      await signAndExecute({ transaction: tx })
      queryClient.invalidateQueries({ queryKey: ["follower-copies"] })
      queryClient.invalidateQueries({ queryKey: ["manager-summary"] })
      queryClient.invalidateQueries({ queryKey: ["settled-copy-events"] })
    } catch (e) {
      setSettleError((e instanceof Error ? e.message : String(e)).slice(0, 100))
    } finally {
      setSettlingId(null)
    }
  }

  async function handleWithdrawAll() {
    if (!account || !managerData || !managerSummary) return
    const balance = managerSummary.trading_balance
    if (balance <= 0) return
    setWithdrawing(true)
    setWithdrawError(null)
    setWithdrawSuccess(false)
    try {
      const tx = buildWithdrawFromManagerTx({
        managerObjectId: managerData.manager_id,
        amount: BigInt(balance),
        walletAddress: account.address,
      })
      await signAndExecute({ transaction: tx })
      setWithdrawSuccess(true)
      queryClient.invalidateQueries({ queryKey: ["manager-summary"] })
      queryClient.invalidateQueries({ queryKey: ["manager-positions"] })
    } catch (e) {
      setWithdrawError((e instanceof Error ? e.message : String(e)).slice(0, 120))
    } finally {
      setWithdrawing(false)
    }
  }

  async function handleRedeemOwn(pos: { oracle_id: string; strike: number; is_up: boolean; expiry: number; quantity: number; digest: string; manager_id: string }) {
    if (!account) return
    setRedeemingDigest(pos.digest)
    setRedeemError(null)
    try {
      const oracle = allOracles?.find(o => o.oracle_id === pos.oracle_id)
      if (!oracle) throw new Error("Oracle not found")
      if (oracle.status !== "settled" || oracle.settlement_price == null)
        throw new Error("Oracle not settled yet — try again after expiry")
      const won = pos.is_up
        ? oracle.settlement_price > pos.strike
        : oracle.settlement_price < pos.strike
      if (!won) { setRedeemError("This trade was a loss — no payout to claim."); return }
      const tx = buildRedeemOwnTradeTx({
        managerObjectId: pos.manager_id,
        oracleId: pos.oracle_id, strike: BigInt(pos.strike),
        isUp: pos.is_up, expiryMs: BigInt(oracle.expiry),
        quantity: BigInt(pos.quantity), won,
        walletAddress: account.address,
      })
      await signAndExecute({ transaction: tx })
      queryClient.invalidateQueries({ queryKey: ["manager-positions"] })
      queryClient.invalidateQueries({ queryKey: ["manager-summary"] })
    } catch (e) {
      setRedeemError((e instanceof Error ? e.message : String(e)).slice(0, 120))
    } finally {
      setRedeemingDigest(null)
    }
  }

  // ── render ──

  return (
    <main className="min-h-screen bg-white dark:bg-[#111111]">
      <Header />

      <div className="container pt-4 pb-20">

        {/* Page header */}
        <div className="flex items-start justify-between my-8 gap-4 flex-wrap">
          <div>
            <h1 className="text-black dark:text-white text-3xl md:text-4xl lg:text-5xl font-medium leading-tight">
              My <span className="text-[#7A7FEE]">Portfolio</span>
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              {!account
                ? "Connect your wallet to see live positions"
                : isLoading
                ? "Loading on-chain data…"
                : isLive
                ? `Manager ${managerData.manager_id.slice(0, 10)}… · ${livePositions} open`
                : "No PredictManager found — click Post Trade to create one"}
            </p>
          </div>
          {managerData && (
            <a href={`https://suiscan.xyz/testnet/object/${managerData.manager_id}`}
              target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-[#7A7FEE] hover:underline mt-2">
              View Manager <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>

        {/* Not connected */}
        {!account && (
          <div className="card p-14 text-center shadow-md mb-8">
            <Wallet className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-700 dark:text-gray-300 mb-2 font-medium">Wallet not connected</p>
            <p className="text-xs text-gray-400">Connect your wallet in the top-right to view your dashboard.</p>
          </div>
        )}

        {/* Loading */}
        {account && isLoading && (
          <div className="card p-14 text-center shadow-md mb-8">
            <Loader2 className="w-8 h-8 animate-spin text-[#7A7FEE] mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400 text-sm">Fetching on-chain data…</p>
          </div>
        )}

        {/* No manager */}
        {account && !isLoading && !isLive && (
          <div className="card p-14 text-center shadow-md mb-8">
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-1">No PredictManager found for this wallet.</p>
            <p className="text-xs text-gray-400">
              Click <strong className="text-[#7A7FEE]">Post Trade</strong> in the header to create one.
            </p>
          </div>
        )}

        {/* ── DASHBOARD (only when live) ── */}
        {isLive && (
          <>
            {/* ── Stats row ── */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
              <StatCard
                label="Account Value"
                value={`${fDusd(managerSummary.account_value)} dUSDC`}
                icon={DollarSign}
                color="text-[#7A7FEE]"
              />
              <StatCard
                label="Realized PnL"
                value={`${fDusdSigned(realizedPnl)} dUSDC`}
                icon={BarChart2}
                color={realizedPnl >= 0 ? "text-green-500" : "text-red-400"}
              />
              <StatCard
                label="Unrealized PnL"
                value={`${fDusdSigned(unrealizedPnl)} dUSDC`}
                icon={TrendingUp}
                color={unrealizedPnl >= 0 ? "text-green-500" : "text-red-400"}
              />
              <StatCard
                label="Win Rate"
                value={overallWinRate !== null ? `${overallWinRate}%` : "—"}
                sub={totalSettled > 0 ? `${totalWon}W · ${totalLost}L of ${totalSettled}` : "No settled trades yet"}
                icon={Trophy}
                color={overallWinRate !== null ? (overallWinRate >= 60 ? "text-green-500" : "text-[#f59e0b]") : "text-gray-400"}
                dimmed={overallWinRate === null}
              />
              <StatCard
                label="Open Positions"
                value={String(livePositions)}
                sub={awaitingSettlement > 0 ? `${awaitingSettlement} awaiting settlement` : undefined}
                icon={Activity}
                color="text-[#f59e0b]"
              />
              <StatCard
                label="Total Wagered"
                value={`${totalWagered.toFixed(2)} dUSDC`}
                sub={`${myMinted.length} own · ${myCopyEvents.length} copies`}
                icon={Target}
                color="text-[#7A7FEE]"
              />
            </div>

            {/* ── Performance overview ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">

              {/* Win / Loss breakdown */}
              <div className="card p-6 shadow-md">
                <h3 className="text-sm font-semibold text-black dark:text-white mb-5">
                  Win / Loss Breakdown
                </h3>
                <div className="flex items-center gap-6">
                  <DonutChart won={totalWon} lost={totalLost} />
                  <div className="flex-1 space-y-3">
                    {/* combined */}
                    <div>
                      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                        <span>Overall</span>
                        <span className="font-medium text-black dark:text-white">
                          {totalWon}W · {totalLost}L
                        </span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                        {totalSettled > 0 && (
                          <div className="h-full bg-green-500 rounded-full"
                            style={{ width: `${Math.round(totalWon / totalSettled * 100)}%` }} />
                        )}
                      </div>
                    </div>
                    {/* own trades */}
                    <div>
                      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                        <span>Own Trades</span>
                        <span className="font-medium text-black dark:text-white">
                          {ownWon.length}W · {ownLost.length}L
                        </span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                        {ownSettled.length > 0 && (
                          <div className="h-full bg-[#7A7FEE] rounded-full"
                            style={{ width: `${Math.round(ownWon.length / ownSettled.length * 100)}%` }} />
                        )}
                      </div>
                    </div>
                    {/* copy trades */}
                    <div>
                      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                        <span>Copy Trades</span>
                        <span className="font-medium text-black dark:text-white">
                          {copyWon.length}W · {copyLost.length}L
                        </span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                        {copySettledList.length > 0 && (
                          <div className="h-full bg-green-500 rounded-full"
                            style={{ width: `${Math.round(copyWon.length / copySettledList.length * 100)}%` }} />
                        )}
                      </div>
                    </div>
                    {/* legend */}
                    <div className="flex items-center gap-4 pt-1">
                      <span className="flex items-center gap-1.5 text-xs text-gray-500">
                        <span className="w-2 h-2 rounded-full bg-green-500 inline-block" /> Win
                      </span>
                      <span className="flex items-center gap-1.5 text-xs text-gray-500">
                        <span className="w-2 h-2 rounded-full bg-red-400 inline-block" /> Loss
                      </span>
                      <span className="flex items-center gap-1.5 text-xs text-gray-500">
                        <span className="w-2 h-2 rounded-full bg-[#7A7FEE] inline-block" /> Own
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent performance */}
              <div className="card p-6 shadow-md">
                <h3 className="text-sm font-semibold text-black dark:text-white mb-5">
                  Recent Performance
                </h3>
                {recentTrades.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-[calc(100%-2rem)] text-center py-6">
                    <Zap className="w-8 h-8 text-gray-300 dark:text-gray-600 mb-3" />
                    <p className="text-sm text-gray-400 dark:text-gray-500">No settled trades yet</p>
                    <p className="text-xs text-gray-400 mt-1">Your streak will appear here</p>
                  </div>
                ) : (
                  <>
                    {/* streak badges */}
                    <div className="flex flex-wrap gap-2 mb-5">
                      {recentTrades.map((t, i) => (
                        <div key={i} title={t.won ? "Win" : "Loss"}
                          className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                            t.won
                              ? "bg-green-500/15 text-green-500 border border-green-500/30"
                              : "bg-red-500/15 text-red-400 border border-red-400/30"
                          }`}>
                          {t.won ? "W" : "L"}
                        </div>
                      ))}
                      {recentTrades.length < 10 && Array.from({ length: 10 - recentTrades.length }).map((_, i) => (
                        <div key={`empty-${i}`}
                          className="w-8 h-8 rounded-lg border border-dashed border-gray-300 dark:border-gray-700 flex-shrink-0" />
                      ))}
                    </div>

                    {/* streak stats */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-gray-50 dark:bg-[#1e1e1e] rounded-xl p-3 text-center">
                        <p className={`text-lg font-bold ${currentStreak > 0 ? "text-green-500" : "text-gray-400"}`}>
                          {currentStreak > 0 ? `${currentStreak} 🔥` : "0"}
                        </p>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wide mt-0.5">Streak</p>
                      </div>
                      <div className="bg-gray-50 dark:bg-[#1e1e1e] rounded-xl p-3 text-center">
                        <p className="text-lg font-bold text-black dark:text-white">
                          {recentTrades.length}
                        </p>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wide mt-0.5">Settled</p>
                      </div>
                      <div className="bg-gray-50 dark:bg-[#1e1e1e] rounded-xl p-3 text-center">
                        <p className="text-lg font-bold text-[#7A7FEE]">
                          {recentTrades.length > 0 ? `${Math.round(recentTrades.filter(t => t.won).length / recentTrades.length * 100)}%` : "—"}
                        </p>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wide mt-0.5">Recent W%</p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* ── Echo profile strip ── */}
            {echoProfile && (
              <div className="card p-5 shadow-md mb-8 border border-[#7A7FEE]/15">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-[#7A7FEE] flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                      {(echoProfile.display_name ?? account?.address?.slice(0, 2) ?? "??").slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-black dark:text-white">
                          {echoProfile.display_name ?? "Echo Predictor"}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 bg-green-500/10 text-green-500 rounded font-medium border border-green-500/20">
                          ON-CHAIN
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">Echo predictor profile</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-5 gap-3 sm:gap-4 flex-shrink-0">
                    {[
                      { label: "Win Rate", value: `${Math.round(Number(echoProfile.win_rate_bps) / 100)}%`, color: "text-green-500" },
                      { label: "Trades", value: String(Number(echoProfile.total_trades)), color: "text-black dark:text-white" },
                      { label: "Streak", value: `${Number(echoProfile.current_streak)}🔥`, color: "text-[#f59e0b]" },
                      { label: "Followers", value: String(Number(echoProfile.follower_count)), color: "text-[#7A7FEE]" },
                      { label: "Copy Earn", value: `${fDusd(Number(echoProfile.copy_earnings_cents))}`, color: "text-green-500" },
                    ].map(s => (
                      <div key={s.label} className="text-center">
                        <p className={`text-sm font-bold ${s.color}`}>{s.value}</p>
                        <p className="text-[9px] text-gray-500 dark:text-gray-400 uppercase tracking-wide mt-0.5">{s.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── Withdraw banner ── */}
            {liveBalance > 0 && (
              <div className="card p-5 shadow-md mb-8 border border-[#7A7FEE]/20">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-10 h-10 rounded-full bg-[#7A7FEE]/10 flex items-center justify-center flex-shrink-0">
                      <DollarSign className="w-5 h-5 text-[#7A7FEE]" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-black dark:text-white">
                        Manager Balance: <span className="text-[#7A7FEE]">{fDusd(liveBalance)} dUSDC</span>
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Winnings + unspent deposits — withdraw to your Sui wallet.
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <button onClick={handleWithdrawAll} disabled={withdrawing}
                      className="text-sm px-4 py-2 rounded-lg bg-[#7A7FEE] text-white font-semibold hover:bg-[#6a6fde] transition-colors disabled:opacity-50 flex items-center gap-2">
                      {withdrawing ? <><Loader2 className="w-4 h-4 animate-spin" /> Withdrawing…</> : "Withdraw All"}
                    </button>
                    {withdrawSuccess && <p className="text-xs text-green-500">Withdrawn! Check your wallet.</p>}
                    {withdrawError && <p className="text-xs text-red-400 max-w-xs text-right">{withdrawError}</p>}
                  </div>
                </div>
              </div>
            )}

            {/* ── Your Trades table ── */}
            <h2 className="text-black dark:text-white mb-5 text-2xl md:text-3xl font-medium">
              Your <span className="text-[#7A7FEE]">Trades</span>
            </h2>
            {myMinted.length === 0 ? (
              <div className="card p-10 text-center shadow-md mb-10">
                <p className="text-gray-500 dark:text-gray-400 text-sm mb-1">No trades posted yet.</p>
                <p className="text-xs text-gray-400">
                  Click <strong className="text-[#7A7FEE]">Post Trade</strong> to open your first position.
                </p>
              </div>
            ) : (
              <div className="card overflow-hidden shadow-md mb-10">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700">
                        {["Market", "Direction", "Strike", "Expiry", "Size", "Cost", "Result", "Action"].map(h => (
                          <th key={h} className="p-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {redeemError && (
                        <tr>
                          <td colSpan={8} className="px-4 py-2">
                            <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-500">{redeemError}</div>
                          </td>
                        </tr>
                      )}
                      {myMinted.map((pos, i) => {
                        const expired = pos.expiry <= Date.now()
                        const oracle = oracleMap.get(pos.oracle_id)
                        const isSettled = oracle?.status === "settled" && oracle.settlement_price != null
                        const won = isSettled
                          ? (pos.is_up ? oracle!.settlement_price! > pos.strike : oracle!.settlement_price! < pos.strike)
                          : null
                        const alreadyClaimed = redeemedKeys.has(`${pos.oracle_id}:${pos.strike}:${pos.expiry}:${pos.is_up}`)
                        return (
                          <tr key={pos.digest + i} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-[#1a1a1a] transition-colors">
                            <td className="p-4">
                              <span className="flex items-center gap-1.5 text-sm font-semibold text-black dark:text-white">
                                <CoinLogo symbol={oracle?.underlying_asset ?? "BTC"} size={16} />
                                {oracle?.underlying_asset ?? "BTC"}
                              </span>
                            </td>
                            <td className="p-4">
                              <span className={`text-xs px-2 py-1 rounded-md font-semibold flex items-center gap-1 w-fit ${dirClasses(pos.is_up ? "UP" : "DOWN")}`}>
                                {pos.is_up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                {pos.is_up ? "UP" : "DOWN"}
                              </span>
                            </td>
                            <td className="p-4 text-sm text-gray-700 dark:text-gray-300">{formatStrikeRaw(pos.strike)}</td>
                            <td className={`p-4 text-sm font-medium ${expired ? "text-red-400" : "text-[#f59e0b]"}`}>{formatExpiry(pos.expiry)}</td>
                            <td className="p-4 text-sm font-medium text-black dark:text-white">{(pos.quantity / 1e6).toFixed(2)}</td>
                            <td className="p-4 text-sm text-gray-500 dark:text-gray-400">{(pos.cost / 1e6).toFixed(2)} dUSDC</td>
                            <td className="p-4">
                              {isSettled ? (
                                won
                                  ? <span className="flex items-center gap-1 text-xs text-green-500 font-semibold"><CheckCircle2 className="w-3.5 h-3.5" /> Won</span>
                                  : <span className="flex items-center gap-1 text-xs text-red-400 font-semibold"><XCircle className="w-3.5 h-3.5" /> Lost</span>
                              ) : expired
                                ? <span className="text-xs text-gray-400">Settling…</span>
                                : <span className="text-xs px-2 py-1 rounded-md bg-[#f59e0b]/10 text-[#f59e0b] font-medium">Live</span>
                              }
                            </td>
                            <td className="p-4">
                              {alreadyClaimed
                                ? <span className="text-xs text-gray-400">{won ? "Claimed" : "—"}</span>
                                : isSettled && won
                                ? (
                                  <button onClick={() => handleRedeemOwn({ ...pos, manager_id: pos.manager_id })}
                                    disabled={redeemingDigest === pos.digest}
                                    className="text-xs px-3 py-1.5 rounded-md bg-[#7A7FEE] text-white font-medium hover:bg-[#6a6fde] transition-colors disabled:opacity-50 flex items-center gap-1">
                                    {redeemingDigest === pos.digest
                                      ? <><Loader2 className="w-3 h-3 animate-spin" /> Claiming…</>
                                      : "Claim"}
                                  </button>
                                ) : <span className="text-xs text-gray-400">—</span>
                              }
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ── Copy Trades table ── */}
            {myCopyEvents.length > 0 && (
              <>
                <h2 className="text-black dark:text-white mb-5 text-2xl md:text-3xl font-medium">
                  Copy <span className="text-[#7A7FEE]">Trades</span>
                </h2>
                {settleError && (
                  <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-500">
                    {settleError}
                  </div>
                )}
                <div className="card overflow-hidden shadow-md mb-10">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200 dark:border-gray-700">
                          {["Predictor", "Direction", "Strike", "Expires", "Amount", "Result", "Action"].map(h => (
                            <th key={h} className="p-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {myCopyEvents.map(pos => {
                          const profile = allProfiles?.find(p => p.wallet.toLowerCase() === pos.predictorAddress.toLowerCase())
                          const name = profile?.display_name ?? pos.predictorAddress.slice(0, 10) + "…"
                          const expired = pos.expiryMs <= Date.now()
                          const oracle = oracleMap.get(pos.oracleId)
                          const isSettled = oracle?.status === "settled" && oracle.settlement_price != null
                          const won = isSettled
                            ? (pos.isUp ? oracle!.settlement_price! > pos.strike : oracle!.settlement_price! < pos.strike)
                            : null
                          return (
                            <tr key={pos.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-[#1a1a1a] transition-colors">
                              <td className="p-4">
                                <Link href={`/predictor/${pos.predictorAddress}`} className="flex items-center gap-2 group">
                                  <div className="w-7 h-7 rounded-full bg-[#7A7FEE] flex items-center justify-center text-white text-xs font-bold">{name.slice(0, 2).toUpperCase()}</div>
                                  <span className="text-sm font-medium text-black dark:text-white group-hover:text-[#7A7FEE] transition-colors">{name}</span>
                                </Link>
                              </td>
                              <td className="p-4">
                                <span className={`text-xs px-2 py-1 rounded-md font-semibold ${dirClasses(pos.direction)}`}>
                                  {pos.direction}
                                </span>
                              </td>
                              <td className="p-4 text-sm text-gray-700 dark:text-gray-300">{formatStrikeRaw(pos.strike)}</td>
                              <td className={`p-4 text-sm font-medium ${expired ? "text-red-400" : "text-[#f59e0b]"}`}>{formatExpiry(pos.expiryMs)}</td>
                              <td className="p-4 text-sm font-medium text-black dark:text-white">{fDusd(pos.amountDusd)} dUSDC</td>
                              <td className="p-4">
                                {isSettled ? (
                                  won
                                    ? <span className="flex items-center gap-1 text-xs text-green-500 font-semibold"><CheckCircle2 className="w-3.5 h-3.5" /> Won</span>
                                    : <span className="flex items-center gap-1 text-xs text-red-400 font-semibold"><XCircle className="w-3.5 h-3.5" /> Lost</span>
                                ) : expired
                                  ? <span className="text-xs text-gray-400">Settling…</span>
                                  : <span className="text-xs px-2 py-1 rounded-md bg-[#f59e0b]/10 text-[#f59e0b] font-medium">Pending</span>
                                }
                              </td>
                              <td className="p-4">
                                {settledCopyRecordIds.has(pos.id)
                                  ? <span className="text-xs text-gray-400">{won ? "Settled" : "—"}</span>
                                  : isSettled && won === true
                                  ? (
                                    <button onClick={() => handleSettle(pos)} disabled={settlingId === pos.id}
                                      className="text-xs px-3 py-1.5 rounded-md bg-[#7A7FEE] text-white font-medium hover:bg-[#6a6fde] transition-colors disabled:opacity-50 flex items-center gap-1">
                                      {settlingId === pos.id ? <><Loader2 className="w-3 h-3 animate-spin" /> Settling…</> : "Claim"}
                                    </button>
                                  ) : <span className="text-xs text-gray-400">—</span>
                                }
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </>
        )}

      </div>

      <Footer />
    </main>
  )
}
