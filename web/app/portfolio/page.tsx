"use client"

import { useState } from "react"
import Link from "next/link"
import Header from "@/components/landing-page/header"
import Footer from "@/components/landing-page/footer"
import { portfolioPositions, getPredictorByAddress } from "@/lib/mock-data"
import { fetchFollowerCopies } from "@/lib/sui-client"
import { fetchManagers, fetchManagerSummary, fetchManagerPositions, type ManagerSummary } from "@/lib/predict-api"
import { DUSDC_DECIMALS } from "@/lib/constants"
import { useCurrentAccount } from "@mysten/dapp-kit"
import { useQuery } from "@tanstack/react-query"
import { TrendingUp, DollarSign, Activity, BarChart2, Loader2, ExternalLink } from "lucide-react"

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
  const [settlingId, setSettlingId] = useState<string | null>(null)

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

  const isLoading = managerLoading || summaryLoading || copyLoading || positionsLoading
  const isLive = !!managerData && !!managerSummary

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
      direction: j.is_up ? "UP" : "DOWN",
      strike: Number(j.strike),
      expiryMs: Number(j.expiry_ms),
      amountDusd: Number(j.amount_dusd),
      settled: false,
    }
  })

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
            <div className="px-4 py-2 mb-6 bg-[#f59e0b]/10 border border-[#f59e0b]/20 rounded-lg text-[#f59e0b] text-xs font-medium">
              Showing demo data — no PredictManager found for this wallet yet.
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
                          {["Market", "Direction", "Strike", "Expiry", "Quantity", "Cost", "Tx"].map(h => (
                            <th key={h} className="p-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {myMinted.map((pos, i) => {
                          const expired = pos.expiry <= Date.now()
                          return (
                            <tr key={pos.digest + i} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-[#1e1e1e] transition-colors">
                              <td className="p-4 text-sm text-gray-700 dark:text-gray-300">{pos.oracle_id.slice(0, 8)}…</td>
                              <td className="p-4"><span className={`text-xs px-2 py-1 rounded-md font-semibold ${dirClasses(pos.is_up ? "UP" : "DOWN")}`}>{pos.is_up ? "UP" : "DOWN"}</span></td>
                              <td className="p-4 text-sm text-gray-700 dark:text-gray-300">{formatStrikeRaw(pos.strike)}</td>
                              <td className={`p-4 text-sm font-medium ${expired ? "text-red-500" : "text-[#f59e0b]"}`}>{formatExpiry(pos.expiry)}</td>
                              <td className="p-4 text-sm font-medium text-black dark:text-white">{(pos.quantity / 1e6).toFixed(2)}</td>
                              <td className="p-4 text-sm text-gray-700 dark:text-gray-300">{(pos.cost / 1e6).toFixed(2)} dUSDC</td>
                              <td className="p-4">
                                <a href={`https://suiscan.xyz/testnet/tx/${pos.digest}`} target="_blank" rel="noopener noreferrer" className="text-xs text-[#7A7FEE] hover:underline">
                                  {pos.digest.slice(0, 8)}… <ExternalLink className="w-3 h-3 inline" />
                                </a>
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
              <div className="card overflow-hidden shadow-md mb-10">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700">
                        {["Predictor", "Direction", "Strike", "Expires", "Amount", "Status"].map(h => (
                          <th key={h} className="p-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {myCopyEvents.map(pos => {
                        const predictor = getPredictorByAddress(pos.predictorAddress)
                        const name = predictor?.displayName ?? pos.predictorAddress.slice(0, 10) + "…"
                        const expired = pos.expiryMs <= Date.now()
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
                            <td className={`p-4 text-sm font-medium ${expired ? "text-red-500" : "text-[#f59e0b]"}`}>{formatExpiry(pos.expiryMs)}</td>
                            <td className="p-4 text-sm font-medium text-black dark:text-white">{formatDusd(pos.amountDusd)} dUSDC</td>
                            <td className="p-4">
                              {expired ? (
                                <button
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
            </>
          )}

          {/* Open Positions from mock (fallback) */}
          {!isLive && (
            <>
              <h2 className="text-black dark:text-white mb-6 text-2xl md:text-3xl font-medium leading-tight">
                Open <span className="text-[#7A7FEE]">Positions</span>
              </h2>
              <div className="card overflow-hidden shadow-md mb-10">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700">
                        {["Predictor", "Direction", "Strike", "Amount", "Status"].map(h => (
                          <th key={h} className="p-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {portfolioPositions.filter(p => p.outcome === "OPEN").map(pos => {
                        const predictor = getPredictorByAddress(pos.predictorAddress)
                        const name = predictor?.displayName ?? "Unknown"
                        return (
                          <tr key={pos.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-[#1e1e1e] transition-colors">
                            <td className="p-4">
                              <Link href={`/predictor/${pos.predictorAddress}`} className="flex items-center gap-2 group">
                                <div className="w-7 h-7 rounded-full bg-[#7A7FEE] flex items-center justify-center text-white text-xs font-semibold">{name.slice(0,2).toUpperCase()}</div>
                                <span className="text-sm font-medium text-black dark:text-white group-hover:text-[#7A7FEE] transition-colors">{name}</span>
                              </Link>
                            </td>
                            <td className="p-4"><span className={`text-xs px-2 py-1 rounded-md font-semibold ${dirClasses(pos.direction)}`}>{pos.direction}</span></td>
                            <td className="p-4 text-sm text-gray-700 dark:text-gray-300">${pos.strike.toLocaleString()}</td>
                            <td className="p-4 text-sm font-medium text-black dark:text-white">{(pos.amountCents / 100).toFixed(2)} dUSDC</td>
                            <td className="p-4"><span className="text-xs px-2 py-1 rounded-md bg-[#f59e0b]/10 text-[#f59e0b] font-medium">Pending</span></td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Settled History */}
              <h2 className="text-black dark:text-white mb-6 text-2xl md:text-3xl font-medium leading-tight">
                Settled <span className="text-[#7A7FEE]">History</span>
              </h2>
              <div className="card overflow-hidden shadow-md">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700">
                        {["Predictor", "Direction", "Strike", "Amount", "Payout", "Result"].map(h => (
                          <th key={h} className="p-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {portfolioPositions.filter(p => p.outcome !== "OPEN").map(pos => {
                        const predictor = getPredictorByAddress(pos.predictorAddress)
                        const name = predictor?.displayName ?? "Unknown"
                        const won = pos.outcome === "WIN"
                        return (
                          <tr key={pos.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-[#1e1e1e] transition-colors">
                            <td className="p-4">
                              <Link href={`/predictor/${pos.predictorAddress}`} className="flex items-center gap-2 group">
                                <div className="w-7 h-7 rounded-full bg-[#7A7FEE] flex items-center justify-center text-white text-xs font-semibold">{name.slice(0,2).toUpperCase()}</div>
                                <span className="text-sm font-medium text-black dark:text-white group-hover:text-[#7A7FEE] transition-colors">{name}</span>
                              </Link>
                            </td>
                            <td className="p-4"><span className={`text-xs px-2 py-1 rounded-md font-semibold ${dirClasses(pos.direction)}`}>{pos.direction}</span></td>
                            <td className="p-4 text-sm text-gray-700 dark:text-gray-300">${pos.strike.toLocaleString()}</td>
                            <td className="p-4 text-sm text-gray-700 dark:text-gray-300">{(pos.amountCents/100).toFixed(2)} dUSDC</td>
                            <td className="p-4 text-sm font-medium">{won ? <span className="text-green-500">+{(pos.payoutCents/100).toFixed(2)}</span> : <span className="text-red-500">0</span>}</td>
                            <td className="p-4"><span className={`text-xs px-2 py-1 rounded-md font-medium ${won ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"}`}>{won ? "Won" : "Lost"}</span></td>
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
