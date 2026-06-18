"use client"

import Link from "next/link"
import Header from "@/components/landing-page/header"
import Footer from "@/components/landing-page/footer"
import { MOCK_PORTFOLIO } from "@/components/echo/mock-data"
import { getDirectionClasses, formatExpiry } from "@/components/echo/mock-data"
import { TrendingUp, DollarSign, Activity, BarChart2, ArrowUpRight } from "lucide-react"

export default function PortfolioPage() {
  const openPositions = MOCK_PORTFOLIO.filter((p) => p.status === "open")
  const settledPositions = MOCK_PORTFOLIO.filter((p) => p.status !== "open")

  const totalInvested = MOCK_PORTFOLIO.reduce((acc, p) => acc + p.amount, 0)
  const totalReturned = settledPositions
    .filter((p) => p.status === "won")
    .reduce((acc, p) => acc + (p.payout || 0), 0)
  const netPnl =
    totalReturned - settledPositions.reduce((acc, p) => acc + p.amount, 0)

  const stats = [
    { label: "Total Invested", value: `${totalInvested} dUSDC`, icon: DollarSign, color: "text-[#7A7FEE]" },
    { label: "Open Positions", value: String(openPositions.length), icon: Activity, color: "text-[#f59e0b]" },
    { label: "Total Returned", value: `${totalReturned} dUSDC`, icon: TrendingUp, color: "text-green-500" },
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
        {/* Heading */}
        <section className="my-8">
          <h1 className="text-black dark:text-white mb-6 text-3xl md:text-4xl lg:text-5xl font-medium leading-tight">
            My
            <span className="block text-[#7A7FEE] dark:text-[#7A7FEE]">Portfolio</span>
          </h1>
          <p className="mb-12 max-w-2xl text-gray-700 dark:text-gray-300">
            All your open copy trades, settled positions, and performance at a glance. Connect your wallet to see
            live on-chain data.
          </p>

          {/* Stats grid — same as services 3-col cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
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
            <div className="card p-8 md:p-10 shadow-md text-center mb-12">
              <p className="text-gray-700 dark:text-gray-300 mb-4">No open positions yet.</p>
              <Link href="/" className="btn-primary">
                Browse Trade Feed
              </Link>
            </div>
          ) : (
            <div className="card overflow-hidden shadow-md mb-12">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      {["Predictor", "Direction", "Strike", "Expires", "Amount", "Status"].map((h) => (
                        <th
                          key={h}
                          className="p-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {openPositions.map((pos) => {
                      const dirClasses = getDirectionClasses(pos.direction)
                      return (
                        <tr
                          key={pos.id}
                          className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-[#1e1e1e] transition-colors"
                        >
                          <td className="p-4">
                            <Link
                              href={`/predictor/${pos.predictor.address}`}
                              className="flex items-center gap-2 group"
                            >
                              <div className="w-7 h-7 rounded-full bg-[#7A7FEE] flex items-center justify-center text-white text-xs font-semibold">
                                {pos.predictor.displayName.slice(0, 2).toUpperCase()}
                              </div>
                              <span className="text-sm font-medium text-black dark:text-white group-hover:text-[#7A7FEE] transition-colors">
                                {pos.predictor.displayName}
                              </span>
                            </Link>
                          </td>
                          <td className="p-4">
                            <span className={`text-xs px-2 py-1 rounded-md font-semibold ${dirClasses.badge}`}>
                              {pos.direction}
                            </span>
                          </td>
                          <td className="p-4 text-sm text-gray-700 dark:text-gray-300">
                            ${pos.strike.toLocaleString()}
                          </td>
                          <td className="p-4 text-sm text-[#f59e0b]">{formatExpiry(pos.expiryMs)}</td>
                          <td className="p-4 text-sm font-medium text-black dark:text-white">
                            {pos.amount} dUSDC
                          </td>
                          <td className="p-4">
                            <span className="text-xs px-2 py-1 rounded-md bg-[#f59e0b]/10 text-[#f59e0b] font-medium">
                              Pending
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

          {/* Settled Positions */}
          <h2 className="text-black dark:text-white mb-6 text-2xl md:text-3xl font-medium leading-tight">
            Settled <span className="text-[#7A7FEE]">History</span>
          </h2>

          <div className="card overflow-hidden shadow-md">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    {["Predictor", "Direction", "Strike", "Amount", "Payout", "Result"].map((h) => (
                      <th
                        key={h}
                        className="p-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {settledPositions.map((pos) => {
                    const dirClasses = getDirectionClasses(pos.direction)
                    return (
                      <tr
                        key={pos.id}
                        className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-[#1e1e1e] transition-colors"
                      >
                        <td className="p-4">
                          <Link
                            href={`/predictor/${pos.predictor.address}`}
                            className="flex items-center gap-2 group"
                          >
                            <div className="w-7 h-7 rounded-full bg-[#7A7FEE] flex items-center justify-center text-white text-xs font-semibold">
                              {pos.predictor.displayName.slice(0, 2).toUpperCase()}
                            </div>
                            <span className="text-sm font-medium text-black dark:text-white group-hover:text-[#7A7FEE] transition-colors">
                              {pos.predictor.displayName}
                            </span>
                          </Link>
                        </td>
                        <td className="p-4">
                          <span className={`text-xs px-2 py-1 rounded-md font-semibold ${dirClasses.badge}`}>
                            {pos.direction}
                          </span>
                        </td>
                        <td className="p-4 text-sm text-gray-700 dark:text-gray-300">
                          ${pos.strike.toLocaleString()}
                        </td>
                        <td className="p-4 text-sm text-gray-700 dark:text-gray-300">{pos.amount} dUSDC</td>
                        <td className="p-4 text-sm font-medium">
                          {pos.status === "won" ? (
                            <span className="text-green-500">+{pos.payout} dUSDC</span>
                          ) : (
                            <span className="text-red-500">0 dUSDC</span>
                          )}
                        </td>
                        <td className="p-4">
                          <span
                            className={`text-xs px-2 py-1 rounded-md font-medium ${
                              pos.status === "won"
                                ? "bg-green-500/10 text-green-500"
                                : "bg-red-500/10 text-red-500"
                            }`}
                          >
                            {pos.status === "won" ? "Won" : "Lost"}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>

      <Footer />
    </main>
  )
}
