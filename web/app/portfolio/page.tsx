"use client"

import { useState } from "react"
import Link from "next/link"
import Header from "@/components/landing-page/header"
import Footer from "@/components/landing-page/footer"
import { portfolioPositions, getPredictorByAddress } from "@/lib/mock-data"
import { fetchFollowerCopies, buildSettleCopyTx } from "@/lib/sui-client"
import { DUSDC_DECIMALS } from "@/lib/constants"
import { useSignAndExecuteTransaction } from "@mysten/dapp-kit"
import { useCurrentAccount } from "@mysten/dapp-kit"
import { useQuery } from "@tanstack/react-query"
import { TrendingUp, DollarSign, Activity, BarChart2, Loader2 } from "lucide-react"

function dirClasses(dir: string) {
  if (dir === "UP" || dir === "up") return "bg-green-500/10 text-green-500 border border-green-500/20"
  if (dir === "DOWN" || dir === "down") return "bg-red-500/10 text-red-500 border border-red-500/20"
  return "bg-blue-500/10 text-blue-500 border border-blue-500/20"
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

export default function PortfolioPage() {
  const account = useCurrentAccount()
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction()
  const [settlingId, setSettlingId] = useState<string | null>(null)

  async function handleSettle(pos: any) {
    if (!account) return
    setSettlingId(pos.id)
    try {
      const tx = buildSettleCopyTx({
        copyRecordId: pos.id,
        predictorProfileId: pos.predictorProfileId ?? pos.predictorAddress,
        managerObjectId: pos.managerObjectId ?? "",
        oracleId: pos.oracleId ?? "",
        strike: BigInt(Math.round((pos.strike ?? 0) * 1e9)),
        isUp: pos.direction === "UP",
        expiryMs: BigInt(pos.expiryMs ?? 0),
        quantity: BigInt(pos.amountDusd ?? 0),
        payoutAmount: BigInt(pos.amountDusd ?? 0),
      })
      await signAndExecute({ transaction: tx })
    } catch (e) {
      console.error("Settle failed:", e)
    } finally {
      setSettlingId(null)
    }
  }

  // Live on-chain copies for connected wallet
  const { data: liveEvents, isLoading } = useQuery({
    queryKey: ["follower-copies", account?.address],
    queryFn: () => fetchFollowerCopies(account!.address),
    enabled: !!account?.address,
    staleTime: 30_000,
    refetchInterval: 60_000,
  })

  const isLive = !!liveEvents && liveEvents.length > 0

  // Build display rows from on-chain events
  type LiveRow = {
    id: string
    predictorAddress: string
    predictorName: string
    direction: string
    strike: bigint
    expiryMs: bigint
    amountDusd: bigint
    settled: boolean
    won: boolean
    followerPayoutDusd: bigint
  }

  const liveRows: LiveRow[] = (liveEvents ?? []).map((e) => {
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
      predictorName: j.predictor.slice(0, 8) + "...",
      direction: j.is_up ? "UP" : "DOWN",
      strike: BigInt(j.strike),
      expiryMs: BigInt(j.expiry_ms),
      amountDusd: BigInt(j.amount_dusd),
      settled: false,
      won: false,
      followerPayoutDusd: 0n,
    }
  })

  // Stats from mock data as baseline (overridden when live)
  const openPositions = isLive
    ? liveRows.filter((p) => !p.settled)
    : portfolioPositions.filter((p) => p.outcome === "OPEN")

  const settledPositions = isLive
    ? liveRows.filter((p) => p.settled)
    : portfolioPositions.filter((p) => p.outcome !== "OPEN")

  const totalInvested = isLive
    ? liveRows.reduce((acc, p) => acc + Number(formatDusd(p.amountDusd)), 0)
    : portfolioPositions.reduce((acc, p) => acc + p.amountCents / 100, 0)

  const totalWon = isLive
    ? 0
    : portfolioPositions.filter((p) => p.outcome === "WIN").reduce((acc, p) => acc + p.payoutCents / 100, 0)

  const netPnl = isLive
    ? 0
    : totalWon - portfolioPositions.filter((p) => p.outcome !== "OPEN").reduce((acc, p) => acc + p.amountCents / 100, 0)

  const stats = [
    { label: "Total Invested", value: `${totalInvested.toFixed(2)} dUSDC`, icon: DollarSign, color: "text-[#7A7FEE]" },
    { label: "Open Positions", value: String(openPositions.length), icon: Activity, color: "text-[#f59e0b]" },
    { label: "Total Returned", value: `${totalWon.toFixed(2)} dUSDC`, icon: TrendingUp, color: "text-green-500" },
    {
      label: "Net PnL",
      value: `${netPnl >= 0 ? "+" : ""}${netPnl.toFixed(2)} dUSDC`,
      icon: BarChart2,
      color: netPnl >= 0 ? "text-green-500" : "text-red-500",
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
                {!account
                  ? "Connect your wallet to see your live positions"
                  : isLoading
                  ? "Loading on-chain positions..."
                  : isLive
                  ? `${liveRows.length} copy trades found on-chain`
                  : "Demo data — copy a trade to see real positions here"}
              </p>
            </div>
          </div>

          {!account ? (
            <div className="card p-12 text-center shadow-md mb-8">
              <p className="text-gray-700 dark:text-gray-300 mb-4">Connect your wallet to view your portfolio.</p>
              <button className="btn-primary">Connect Wallet</button>
            </div>
          ) : isLoading ? (
            <div className="card p-12 text-center shadow-md mb-8">
              <Loader2 className="w-8 h-8 animate-spin text-[#7A7FEE] mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400 text-sm">Fetching your on-chain positions...</p>
            </div>
          ) : null}

          {!isLive && !isLoading && (
            <div className="px-4 py-2 mb-6 bg-[#f59e0b]/10 border border-[#f59e0b]/20 rounded-lg text-[#f59e0b] text-xs font-medium">
              Showing demo data — no on-chain copy trades found for this wallet yet.
            </div>
          )}

          {/* Stats grid */}
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

          {/* Open Positions */}
          <h2 className="text-black dark:text-white mb-6 text-2xl md:text-3xl font-medium leading-tight">
            Open <span className="text-[#7A7FEE]">Positions</span>
          </h2>

          {openPositions.length === 0 ? (
            <div className="card p-8 md:p-10 shadow-md text-center mb-10">
              <p className="text-gray-700 dark:text-gray-300 mb-4">No open positions.</p>
              <Link href="/" className="btn-primary">Browse Trade Feed</Link>
            </div>
          ) : (
            <div className="card overflow-hidden shadow-md mb-10">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      {["Predictor", "Direction", "Strike", "Expires", "Amount", "Status"].map((h) => (
                        <th key={h} className="p-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {openPositions.map((pos: any) => {
                      const direction = pos.direction ?? (pos.is_up ? "UP" : "DOWN")
                      const predictor = getPredictorByAddress(pos.predictorAddress)
                      const name = predictor?.displayName ?? pos.predictorName ?? pos.predictorAddress?.slice(0, 10)
                      const amount = isLive ? `${formatDusd(pos.amountDusd)} dUSDC` : `${(pos.amountCents / 100).toFixed(2)} dUSDC`
                      const expires = isLive ? formatExpiry(Number(pos.expiryMs)) : `${pos.expiryMinutes}m`
                      const strike = isLive ? `$${(Number(pos.strike) / 1e9).toLocaleString()}` : `$${pos.strike?.toLocaleString?.()}`
                      return (
                        <tr key={pos.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-[#1e1e1e] transition-colors">
                          <td className="p-4">
                            <Link href={`/predictor/${pos.predictorAddress}`} className="flex items-center gap-2 group">
                              <div className="w-7 h-7 rounded-full bg-[#7A7FEE] flex items-center justify-center text-white text-xs font-semibold">
                                {name.slice(0, 2).toUpperCase()}
                              </div>
                              <span className="text-sm font-medium text-black dark:text-white group-hover:text-[#7A7FEE] transition-colors">{name}</span>
                            </Link>
                          </td>
                          <td className="p-4"><span className={`text-xs px-2 py-1 rounded-md font-semibold ${dirClasses(direction)}`}>{direction}</span></td>
                          <td className="p-4 text-sm text-gray-700 dark:text-gray-300">{strike}</td>
                          <td className="p-4 text-sm text-[#f59e0b]">{expires}</td>
                          <td className="p-4 text-sm font-medium text-black dark:text-white">{amount}</td>
                          <td className="p-4">
                            {isLive && Number(pos.expiryMs) <= Date.now() ? (
                              <button
                                onClick={() => handleSettle(pos)}
                                disabled={settlingId === pos.id}
                                className="text-xs px-3 py-1.5 rounded-md bg-[#7A7FEE] text-white font-medium hover:bg-[#6a6fde] transition-colors disabled:opacity-50"
                              >
                                {settlingId === pos.id ? "Settling…" : "Settle"}
                              </button>
                            ) : (
                              <span className="text-xs px-2 py-1 rounded-md bg-[#f59e0b]/10 text-[#f59e0b] font-medium">Pending</span>
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

          {/* Settled History */}
          <h2 className="text-black dark:text-white mb-6 text-2xl md:text-3xl font-medium leading-tight">
            Settled <span className="text-[#7A7FEE]">History</span>
          </h2>

          {settledPositions.length === 0 ? (
            <div className="card p-8 shadow-md text-center">
              <p className="text-gray-700 dark:text-gray-300">No settled positions yet.</p>
            </div>
          ) : (
            <div className="card overflow-hidden shadow-md">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      {["Predictor", "Direction", "Strike", "Amount", "Payout", "Result"].map((h) => (
                        <th key={h} className="p-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {settledPositions.map((pos: any) => {
                      const direction = pos.direction ?? (pos.is_up ? "UP" : "DOWN")
                      const predictor = getPredictorByAddress(pos.predictorAddress)
                      const name = predictor?.displayName ?? pos.predictorAddress?.slice(0, 10)
                      const amount = isLive ? `${formatDusd(pos.amountDusd)} dUSDC` : `${(pos.amountCents / 100).toFixed(2)} dUSDC`
                      const payout = isLive ? `${formatDusd(pos.followerPayoutDusd)} dUSDC` : `${(pos.payoutCents / 100).toFixed(2)} dUSDC`
                      const won = isLive ? pos.won : pos.outcome === "WIN"
                      const strike = isLive ? `$${(Number(pos.strike) / 1e9).toLocaleString()}` : `$${pos.strike?.toLocaleString?.()}`
                      return (
                        <tr key={pos.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-[#1e1e1e] transition-colors">
                          <td className="p-4">
                            <Link href={`/predictor/${pos.predictorAddress}`} className="flex items-center gap-2 group">
                              <div className="w-7 h-7 rounded-full bg-[#7A7FEE] flex items-center justify-center text-white text-xs font-semibold">
                                {name.slice(0, 2).toUpperCase()}
                              </div>
                              <span className="text-sm font-medium text-black dark:text-white group-hover:text-[#7A7FEE] transition-colors">{name}</span>
                            </Link>
                          </td>
                          <td className="p-4"><span className={`text-xs px-2 py-1 rounded-md font-semibold ${dirClasses(direction)}`}>{direction}</span></td>
                          <td className="p-4 text-sm text-gray-700 dark:text-gray-300">{strike}</td>
                          <td className="p-4 text-sm text-gray-700 dark:text-gray-300">{amount}</td>
                          <td className="p-4 text-sm font-medium">
                            {won ? <span className="text-green-500">+{payout}</span> : <span className="text-red-500">0 dUSDC</span>}
                          </td>
                          <td className="p-4">
                            <span className={`text-xs px-2 py-1 rounded-md font-medium ${won ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"}`}>
                              {won ? "Won" : "Lost"}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      </div>

      <Footer />
    </main>
  )
}
