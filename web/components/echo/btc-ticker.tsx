"use client"

import { useEffect, useState } from "react"
import { TrendingUp, TrendingDown, Activity } from "lucide-react"
import CoinLogo from "@/components/echo/coin-logo"

interface BtcData {
  price: number
  change24h: number
  changePct24h: number
  high24h: number
  low24h: number
  volume24hB: number
}

async function fetchBtcPrice(): Promise<BtcData> {
  const res = await fetch("https://api.binance.com/api/v3/ticker/24hr?symbol=BTCUSDT", {
    cache: "no-store",
  })
  if (!res.ok) throw new Error("Binance fetch failed")
  const d = await res.json()
  return {
    price: parseFloat(d.lastPrice),
    change24h: parseFloat(d.priceChange),
    changePct24h: parseFloat(d.priceChangePercent),
    high24h: parseFloat(d.highPrice),
    low24h: parseFloat(d.lowPrice),
    volume24hB: parseFloat(d.quoteVolume) / 1e9,
  }
}

export default function BtcTicker() {
  const [data, setData] = useState<BtcData | null>(null)
  const [prev, setPrev] = useState<number | null>(null)
  const [flash, setFlash] = useState<"up" | "down" | null>(null)

  useEffect(() => {
    let mounted = true

    async function refresh() {
      try {
        const d = await fetchBtcPrice()
        if (!mounted) return
        setData(cur => {
          if (cur) {
            setPrev(cur.price)
            setFlash(d.price > cur.price ? "up" : d.price < cur.price ? "down" : null)
            setTimeout(() => setFlash(null), 600)
          }
          return d
        })
      } catch { /* silent */ }
    }

    refresh()
    const id = setInterval(refresh, 10_000)
    return () => { mounted = false; clearInterval(id) }
  }, [])

  if (!data) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-400 animate-pulse">
        <Activity className="w-4 h-4" />
        Loading BTC price…
      </div>
    )
  }

  const positive = data.changePct24h >= 0

  return (
    <div className="w-full rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1a1a1a] px-5 py-4 flex flex-wrap items-center gap-x-6 gap-y-3">
      {/* Main price */}
      <div className="flex items-center gap-3">
        <CoinLogo symbol="BTC" size={32} />
        <div>
          <p className="text-xs text-gray-500 leading-none mb-0.5">BTC / USD · Live</p>
          <p className={`text-xl font-bold tabular-nums transition-colors duration-300 ${
            flash === "up" ? "text-green-500" : flash === "down" ? "text-red-500" : "text-black dark:text-white"
          }`}>
            ${data.price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      {/* 24h change */}
      <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-sm font-semibold ${
        positive ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
      }`}>
        {positive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
        {positive ? "+" : ""}{data.changePct24h.toFixed(2)}%
        <span className="font-normal opacity-70 text-xs">24h</span>
      </div>

      {/* Stats */}
      <div className="hidden sm:flex items-center gap-5 text-xs text-gray-500 dark:text-gray-400 ml-auto">
        <div>
          <span className="block text-[10px] uppercase tracking-wide text-gray-400">24h High</span>
          <span className="font-medium text-black dark:text-white">
            ${data.high24h.toLocaleString("en-US", { maximumFractionDigits: 0 })}
          </span>
        </div>
        <div>
          <span className="block text-[10px] uppercase tracking-wide text-gray-400">24h Low</span>
          <span className="font-medium text-black dark:text-white">
            ${data.low24h.toLocaleString("en-US", { maximumFractionDigits: 0 })}
          </span>
        </div>
        <div>
          <span className="block text-[10px] uppercase tracking-wide text-gray-400">Volume</span>
          <span className="font-medium text-black dark:text-white">
            ${data.volume24hB.toFixed(2)}B
          </span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          <span className="text-[10px] text-green-500">LIVE</span>
        </div>
      </div>
    </div>
  )
}
