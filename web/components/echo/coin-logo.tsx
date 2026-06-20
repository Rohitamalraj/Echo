"use client"

import { useState } from "react"

// jsDelivr mirrors the cryptocurrency-icons npm package — free, SVG, symbol-based, no API key.
// Covers BTC, ETH, SOL, SUI, and 800+ other tickers.
const CDN = "https://cdn.jsdelivr.net/npm/cryptocurrency-icons@0.18.1/svg/color"

// Fallback colours when the CDN icon is not available for a symbol.
const FALLBACK_COLORS: Record<string, string> = {
  BTC: "#f7931a",
  ETH: "#627eea",
  SOL: "#9945ff",
  SUI: "#4da2ff",
}

interface CoinLogoProps {
  symbol: string       // e.g. "BTC", "ETH"
  size?: number        // px, default 24
  className?: string
}

export default function CoinLogo({ symbol, size = 24, className = "" }: CoinLogoProps) {
  const [failed, setFailed] = useState(false)
  const upper = symbol.toUpperCase()
  const lower = symbol.toLowerCase()
  const color = FALLBACK_COLORS[upper] ?? "#7A7FEE"

  if (failed) {
    return (
      <span
        className={`inline-flex items-center justify-center rounded-full font-bold text-white ${className}`}
        style={{ width: size, height: size, fontSize: size * 0.42, background: color, flexShrink: 0 }}
      >
        {upper.slice(0, 1)}
      </span>
    )
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`${CDN}/${lower}.svg`}
      alt={upper}
      width={size}
      height={size}
      className={`rounded-full ${className}`}
      style={{ flexShrink: 0 }}
      onError={() => setFailed(true)}
    />
  )
}
