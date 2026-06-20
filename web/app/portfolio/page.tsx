"use client"

import { useState } from "react"
import Link from "next/link"
import Header from "@/components/landing-page/header"
import Footer from "@/components/landing-page/footer"
import { fetchFollowerCopies, fetchAllProfiles, buildSettleCopyTx, buildRedeemOwnTradeTx, buildWithdrawFromManagerTx } from "@/lib/sui-client"
import { fetchManagers, fetchManagerSummary, fetchManagerPositions, fetchAllOracles, type ManagerSummary } from "@/lib/predict-api"
import { DUSDC_DECIMALS, MIN_QUANTITY } from "@/lib/constants"
import { useCurrentAccount, useSignAndExecuteTransaction } from "@mysten/dapp-kit"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { TrendingUp, TrendingDown, DollarSign, Activity, BarChart2, Loader2, ExternalLink, CheckCircle2, XCircle } from "lucide-react"
import CoinLogo from "@/components/echo/coin-logo"

function dirClasses(dir: string) {
  if (dir === "UP" || dir === "up") return "bg-green-500/10 text-green-500 border border-green-500/20"
  if (dir === "DOWN" || dir === "down") return "bg-red-500/10 text-red-500 border border-red-500/20"
  return "bg-blue-500/10 text-blue-500 border border-blue-500/20"
}

function dirLabel(dir: string) {
  if (dir === "UP" || dir === "up") return "UP"
  if (dir === "DOWN" || dir === "down") return "DOWN"
  return "RANGE"
}

function formatDusd(raw: string | number) {
  return (Number(raw) / Math.pow(10, DUSDC_DECIMALS)).toFixed(2)
}

function formatExpiry(expiryMs: number): string {
  const diff = expiryMs - Date.now()
  if (diff <= 0) return "Expired"
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m`
  return `${Math.floor(mins / 60)}h ${mins % 60}m`
}

function formatStrikeRaw(raw: number): string {
  return `$${(raw / 1e9).toLocaleString("en-US", { maximumFractionDigits: 0 })}`
}

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

  // Find user's PredictManager via Predict Server
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

  // Fetch manager summary (balance, pnl) from Predict Server
  const { data: managerSummary, isLoading: summaryLoading } = useQuery({
    queryKey: ["manager-summary", managerData?.manager_id],
    queryFn: () => fetchManagerSummary(managerData!.manager_id),
    enabled: !!managerData?.manager_id,
    staleTime: 15_000,
    refetchInterval: 30_000,
  })

  // Fetch manager positions (your own posted trades)
  const { data: managerPositions, isLoading: positionsLoading } = useQuery({
    queryKey: ["manager-positions", managerData?.manager_id],
    queryFn: () => fetchManagerPositions(managerData!.manager_id),
    enabled: !!managerData?.manager_id,
    staleTime: 15_000,
    refetchInterval: 30_000,
  })

  // Fetch CopyCreated events for this wallet (follower)
  const { data: copyEvents, isLoading: copyLoading } = useQuery({
    queryKey: ["follower-copies", account?.address],
    queryFn: () => fetchFollowerCopies(account!.address),
    enabled: !!account?.address,
    staleTime: 30_000,
    refetchInterval: 60_000,
  })

  // All oracles (including settled) for settlement status checks
  const { data: allOracles } = useQuery({
    queryKey: ["all-oracles"],
    queryFn: fetchAllOracles,
    staleTime: 30_000,
    enabled: !!account?.address,
  })

  // All Echo profiles for predictor profile object IDs
  const { data: allProfiles } = useQuery({
    queryKey: ["profiles"],
    queryFn: fetchAllProfiles,
    staleTime: 60_000,
    enabled: !!account?.address,
  })

  const isLoading = managerLoading || summaryLoading || copyLoading || positionsLoading
  const isLive = !!managerData && !!managerSummary
  // Key-based lookup: redeem tx digests differ from mint tx digests, so match by position identity
  const redeemedKeys = new Set(
    (managerPositions?.redeemed ?? []).map(p => `${p.oracle_id}:${p.strike}:${p.expiry}:${p.is_up}`)
  )

  // Build copy events display
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
      settled: false,
    }
  })

  async function handleSettle(pos: typeof myCopyEvents[0]) {
    if (!account || !managerData) return
    setSettlingId(pos.id)
    setSettleError(null)
    try {
      // Find oracle settlement data
      const oracle = allOracles?.find(o => o.oracle_id === pos.oracleId)
      if (!oracle) throw new Error("Oracle not found")
      if (oracle.status !== "settled" || oracle.settlement_price == null) {
        throw new Error("Oracle not settled yet — try again after expiry")
      }

      // Find predictor's Echo profile object ID
      const predictorProfile = allProfiles?.find(
        p => p.wallet.toLowerCase() === pos.predictorAddress.toLowerCase()
      )
      if (!predictorProfile) throw new Error("Predictor has no Echo profile")
      const predictorProfileId = (predictorProfile.id as unknown as { id: string }).id

      // Determine win/loss
      const won = pos.isUp
        ? oracle.settlement_price > pos.strike
        : oracle.settlement_price < pos.strike
      const quantity = BigInt(Math.max(pos.amountDusd, Number(MIN_QUANTITY)))
      const payoutAmount = won ? quantity : 0n

      const tx = buildSettleCopyTx({
        copyRecordId: pos.id,
        predictorProfileId,
        managerObjectId: managerData.manager_id,
        oracleId: pos.oracleId,
        strike: BigInt(pos.strike),
        isUp: pos.isUp,
        expiryMs: BigInt(pos.expiryMs),
        quantity,
        payoutAmount,
        won,
      })
      await signAndExecute({ transaction: tx })
      // Invalidate queries to refresh portfolio
      queryClient.invalidateQueries({ queryKey: ["follower-copies"] })
      queryClient.invalidateQueries({ queryKey: ["manager-summary"] })
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      setSettleError(msg.slice(0, 100))
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
      const msg = e instanceof Error ? e.message : String(e)
      setWithdrawError(msg.slice(0, 120))
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
      if (oracle.status !== "settled" || oracle.settlement_price == null) {
        throw new Error("Oracle not settled yet — try again after expiry")
      }
      const won = pos.is_up
        ? oracle.settlement_price > pos.strike
        : oracle.settlement_price < pos.strike

      if (!won) {
        setRedeemError("This trade was a loss — no payout to claim.")
        return
      }

      // Debug: log exact values going into the tx
      console.log("[Claim] pos.oracle_id:", pos.oracle_id)
      console.log("[Claim] pos.strike (raw):", pos.strike, "→ BigInt:", BigInt(pos.strike))
      console.log("[Claim] pos.is_up:", pos.is_up)
      console.log("[Claim] pos.expiry:", pos.expiry, "oracle.expiry:", oracle.expiry, "match?", pos.expiry === oracle.expiry)
      console.log("[Claim] pos.quantity (raw):", pos.quantity, "→ BigInt:", BigInt(pos.quantity))
      console.log("[Claim] pos.manager_id:", pos.manager_id)
      console.log("[Claim] oracle.settlement_price:", oracle.settlement_price, "won:", won)

      const tx = buildRedeemOwnTradeTx({
        managerObjectId: pos.manager_id,
        oracleId: pos.oracle_id,
        strike: BigInt(pos.strike),
        isUp: pos.is_up,
        expiryMs: BigInt(oracle.expiry),
        quantity: BigInt(pos.quantity),
        won,
        walletAddress: account.address,
      })
      await signAndExecute({ transaction: tx })
      queryClient.invalidateQueries({ queryKey: ["manager-positions"] })
      queryClient.invalidateQueries({ queryKey: ["manager-summary"] })
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      console.error("[Claim] error:", e)
      setRedeemError(msg.slice(0, 120))
    } finally {
      setRedeemingDigest(null)
    }
  }

  // Stats from live data (actual API fields: trading_balance, open_positions, account_value, realized_pnl)
  const liveBalance = managerSummary?.trading_balance ?? 0
  const livePositions = managerSummary?.open_positions ?? 0
  const myMinted = managerPositions?.minted ?? []

  const stats = [
    {
      label: "Account Value",
      value: isLive ? `${(liveBalance / 1e6).toFixed(2)} dUSDC` : "—",
      icon: DollarSign,
      color: "text-[#7A7FEE]",
    },
    {
      label: "Open Positions",
      value: isLive ? String(livePositions) : "—",
      icon: Activity,
      color: "text-[#f59e0b]",
    },
    {
      label: "Copy Trades",
      value: isLive ? String(myCopyEvents.length) : "—",
      icon: TrendingUp,
      color: "text-green-500",
    },
    {
      label: "Realized PnL",
      value: isLive ? `${((managerSummary?.realized_pnl ?? 0) / 1e6).toFixed(2)} dUSDC` : "—",
      icon: BarChart2,
      color: (managerSummary?.realized_pnl ?? 0) >= 0 ? "text-green-500" : "text-red-500",
    },
  ]

  return (
    <main className="min-h-screen bg-white dark:bg-[#111111]">
      <Header />

      <div className="container pt-4 pb-20">
        <section className="my-8">
          <div className="flex items-start justify-between mb-8 gap-4 flex-wrap">
            <div>
              <h1 className="text-black dark:text-white mb-2 text-3xl md:text-4xl lg:text-5xl font-medium leading-tight">
                My
                <span className="block text-[#7A7FEE] dark:text-[#7A7FEE]">Portfolio</span>
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {!account ? "Connect your wallet to see live positions"
                  : isLoading ? "Loading on-chain data…"
                  : isLive ? `Manager ${managerData.manager_id.slice(0, 10)}… · ${livePositions} positions`
                  : "No PredictManager found — click Post Trade to create one"}
              </p>
            </div>
            {managerData && (
              <a
                href={`https://suiscan.xyz/testnet/object/${managerData.manager_id}`}
                target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-[#7A7FEE] hover:underline mt-2"
              >
                View Manager on Suiscan <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>

          {!account ? (
            <div className="card p-12 text-center shadow-md mb-8">
              <p className="text-gray-700 dark:text-gray-300 mb-4">Connect your wallet to view your portfolio.</p>
              <button className="btn-primary">Connect Wallet</button>
            </div>
          ) : isLoading ? (
            <div className="card p-12 text-center shadow-md mb-8">
              <Loader2 className="w-8 h-8 animate-spin text-[#7A7FEE] mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400 text-sm">Fetching on-chain data…</p>
            </div>
          ) : null}

          {!isLive && !isLoading && account && (
            <div className="card p-12 text-center shadow-md mb-8">
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-1">No PredictManager found for this wallet.</p>
              <p className="text-xs text-gray-400">Click <strong className="text-[#7A7FEE]">Post Trade</strong> to create one and start trading.</p>
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10">
            {stats.map((s) => (
              <div key={s.label} className="card p-6 shadow-md hover:shadow-lg transition-shadow duration-300">
                <div className="w-12 h-12 rounded-full bg-[#7A7FEE]/10 flex items-center justify-center mb-4">
                  <s.icon className={`w-6 h-6 ${s.color}`} />
                </div>
                <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Withdraw Manager Balance */}
          {isLive && liveBalance > 0 && (
            <div className="card p-5 shadow-md mb-8 flex flex-col sm:flex-row sm:items-center gap-4 border border-[#7A7FEE]/20">
              <div className="flex items-center gap-3 flex-1">
                <div className="w-10 h-10 rounded-full bg-[#7A7FEE]/10 flex items-center justify-center flex-shrink-0">
                  <DollarSign className="w-5 h-5 text-[#7A7FEE]" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-black dark:text-white">
                    Manager Balance: <span className="text-[#7A7FEE]">{(liveBalance / 1e6).toFixed(2)} dUSDC</span>
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Winnings + unspent deposits sit here — withdraw to move them to your Sui wallet.
                  </p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <button
                  onClick={handleWithdrawAll}
                  disabled={withdrawing}
                  className="text-sm px-4 py-2 rounded-lg bg-[#7A7FEE] text-white font-semibold hover:bg-[#6a6fde] transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {withdrawing ? <><Loader2 className="w-4 h-4 animate-spin" /> Withdrawing…</> : "Withdraw All to Wallet"}
                </button>
                {withdrawSuccess && <p className="text-xs text-green-500">Withdrawn! Check your wallet.</p>}
                {withdrawError && <p className="text-xs text-red-400 max-w-xs text-right">{withdrawError}</p>}
              </div>
            </div>
          )}

          {/* Your Trades — minted positions from Post Trade */}
          {isLive && (
            <>
              <h2 className="text-black dark:text-white mb-6 text-2xl md:text-3xl font-medium leading-tight">
                Your <span className="text-[#7A7FEE]">Trades</span>
              </h2>
              {myMinted.length === 0 ? (
                <div className="card p-8 text-center shadow-md mb-10">
                  <p className="text-gray-500 dark:text-gray-400 text-sm mb-2">No trades posted yet.</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">Click <strong className="text-[#7A7FEE]">Post Trade</strong> on the home page to open your first position.</p>
                </div>
              ) : (
                <div className="card overflow-hidden shadow-md mb-10">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200 dark:border-gray-700">
                          {["Market", "Direction", "Strike", "Expiry", "Quantity", "Cost", "Tx", "Result", "Action"].map(h => (
                            <th key={h} className="p-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {redeemError && (
                          <tr>
                            <td colSpan={9} className="px-4 py-2">
                              <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-500">{redeemError}</div>
                            </td>
                          </tr>
                        )}
                        {myMinted.map((pos, i) => {
                          const expired = pos.expiry <= Date.now()
                          const oracle = allOracles?.find(o => o.oracle_id === pos.oracle_id)
                          const isSettled = oracle?.status === "settled" && oracle.settlement_price != null
                          const won = isSettled
                            ? (pos.is_up ? oracle!.settlement_price! > pos.strike : oracle!.settlement_price! < pos.strike)
                            : null
                          return (
                            <tr key={pos.digest + i} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-[#1e1e1e] transition-colors">
                              <td className="p-4">
                                <span className="flex items-center gap-1.5 text-sm font-semibold text-black dark:text-white">
                                  <CoinLogo symbol={oracle?.underlying_asset ?? "BTC"} size={18} />
                                  {oracle?.underlying_asset ?? "BTC"}
                                </span>
                              </td>
                              <td className="p-4"><span className={`text-xs px-2 py-1 rounded-md font-semibold flex items-center gap-1 w-fit ${dirClasses(pos.is_up ? "UP" : "DOWN")}`}>{pos.is_up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}{pos.is_up ? "UP" : "DOWN"}</span></td>
                              <td className="p-4 text-sm text-gray-700 dark:text-gray-300">{formatStrikeRaw(pos.strike)}</td>
                              <td className={`p-4 text-sm font-medium ${expired ? "text-red-500" : "text-[#f59e0b]"}`}>{formatExpiry(pos.expiry)}</td>
                              <td className="p-4 text-sm font-medium text-black dark:text-white">{(pos.quantity / 1e6).toFixed(2)}</td>
                              <td className="p-4 text-sm text-gray-700 dark:text-gray-300">{(pos.cost / 1e6).toFixed(2)} dUSDC</td>
                              <td className="p-4">
                                <a href={`https://suiscan.xyz/testnet/tx/${pos.digest}`} target="_blank" rel="noopener noreferrer" className="text-xs text-[#7A7FEE] hover:underline">
                                  {pos.digest.slice(0, 8)}… <ExternalLink className="w-3 h-3 inline" />
                                </a>
                              </td>
                              <td className="p-4">
                                {isSettled ? (
                                  won
                                    ? <span className="flex items-center gap-1 text-xs text-green-500 font-semibold"><CheckCircle2 className="w-3.5 h-3.5" /> Won</span>
                                    : <span className="flex items-center gap-1 text-xs text-red-400 font-semibold"><XCircle className="w-3.5 h-3.5" /> Lost</span>
                                ) : expired ? (
                                  <span className="text-xs text-gray-400">Settling…</span>
                                ) : (
                                  <span className="text-xs px-2 py-1 rounded-md bg-[#f59e0b]/10 text-[#f59e0b] font-medium">Live</span>
                                )}
                              </td>
                              <td className="p-4">
                                {redeemedKeys.has(`${pos.oracle_id}:${pos.strike}:${pos.expiry}:${pos.is_up}`) && won ? (
                                  <span className="text-xs text-gray-400">Claimed</span>
                                ) : redeemedKeys.has(`${pos.oracle_id}:${pos.strike}:${pos.expiry}:${pos.is_up}`) && !won ? (
                                  <span className="text-xs text-gray-400">—</span>
                                ) : isSettled && won ? (
                                  <button
                                    onClick={() => handleRedeemOwn({ ...pos, manager_id: pos.manager_id })}
                                    disabled={redeemingDigest === pos.digest}
                                    className="text-xs px-3 py-1.5 rounded-md bg-[#7A7FEE] text-white font-medium hover:bg-[#6a6fde] transition-colors disabled:opacity-50 flex items-center gap-1"
                                  >
                                    {redeemingDigest === pos.digest
                                      ? <><Loader2 className="w-3 h-3 animate-spin" /> Claiming…</>
                                      : "Claim"}
                                  </button>
                                ) : (
                                  <span className="text-xs text-gray-400">—</span>
                                )}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Copy Trades (on-chain CopyCreated events) */}
          {isLive && myCopyEvents.length > 0 && (
            <>
              <h2 className="text-black dark:text-white mb-6 text-2xl md:text-3xl font-medium leading-tight">
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
                        const oracle = allOracles?.find(o => o.oracle_id === pos.oracleId)
                        const isSettled = oracle?.status === "settled" && oracle.settlement_price != null
                        const won = isSettled
                          ? (pos.isUp ? oracle!.settlement_price! > pos.strike : oracle!.settlement_price! < pos.strike)
                          : null
                        return (
                          <tr key={pos.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-[#1e1e1e] transition-colors">
                            <td className="p-4">
                              <Link href={`/predictor/${pos.predictorAddress}`} className="flex items-center gap-2 group">
                                <div className="w-7 h-7 rounded-full bg-[#7A7FEE] flex items-center justify-center text-white text-xs font-semibold">{name.slice(0,2).toUpperCase()}</div>
                                <span className="text-sm font-medium text-black dark:text-white group-hover:text-[#7A7FEE] transition-colors">{name}</span>
                              </Link>
                            </td>
                            <td className="p-4"><span className={`text-xs px-2 py-1 rounded-md font-semibold ${dirClasses(pos.direction)}`}>{dirLabel(pos.direction)}</span></td>
                            <td className="p-4 text-sm text-gray-700 dark:text-gray-300">{formatStrikeRaw(pos.strike)}</td>
                            <td className={`p-4 text-sm font-medium ${expired ? "text-red-400" : "text-[#f59e0b]"}`}>{formatExpiry(pos.expiryMs)}</td>
                            <td className="p-4 text-sm font-medium text-black dark:text-white">{formatDusd(pos.amountDusd)} dUSDC</td>
                            <td className="p-4">
                              {isSettled ? (
                                won
                                  ? <span className="flex items-center gap-1 text-xs text-green-500 font-semibold"><CheckCircle2 className="w-3.5 h-3.5" /> Won</span>
                                  : <span className="flex items-center gap-1 text-xs text-red-400 font-semibold"><XCircle className="w-3.5 h-3.5" /> Lost</span>
                              ) : expired ? (
                                <span className="text-xs text-gray-400">Settling…</span>
                              ) : (
                                <span className="text-xs px-2 py-1 rounded-md bg-[#f59e0b]/10 text-[#f59e0b] font-medium">Pending</span>
                              )}
                            </td>
                            <td className="p-4">
                              {isSettled ? (
                                <button
                                  onClick={() => handleSettle(pos)}
                                  disabled={settlingId === pos.id}
                                  className="text-xs px-3 py-1.5 rounded-md bg-[#7A7FEE] text-white font-medium hover:bg-[#6a6fde] transition-colors disabled:opacity-50 flex items-center gap-1"
                                >
                                  {settlingId === pos.id ? <><Loader2 className="w-3 h-3 animate-spin" /> Settling…</> : "Claim"}
                                </button>
                              ) : (
                                <span className="text-xs text-gray-400">—</span>
                              )}
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

        </section>
      </div>

      <Footer />
    </main>
  )
}
