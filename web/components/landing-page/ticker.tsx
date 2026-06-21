"use client"

import { useEffect } from "react"
import CoinLogo from "@/components/echo/coin-logo"

const ASSETS = [
  { symbol: "BTC",   name: "Bitcoin",    price: "$68,420", change: "+2.3%", up: true  },
  { symbol: "ETH",   name: "Ethereum",   price: "$3,847",  change: "+1.8%", up: true  },
  { symbol: "SOL",   name: "Solana",     price: "$187.50", change: "+4.2%", up: true  },
  { symbol: "SUI",   name: "Sui",        price: "$1.84",   change: "+6.2%", up: true  },
  { symbol: "BNB",   name: "BNB",        price: "$612.00", change: "−0.5%", up: false },
  { symbol: "XRP",   name: "XRP",        price: "$0.621",  change: "+0.9%", up: true  },
  { symbol: "ADA",   name: "Cardano",    price: "$0.483",  change: "−1.2%", up: false },
  { symbol: "AVAX",  name: "Avalanche",  price: "$38.90",  change: "+3.1%", up: true  },
  { symbol: "DOT",   name: "Polkadot",   price: "$7.85",   change: "−0.8%", up: false },
  { symbol: "MATIC", name: "Polygon",    price: "$0.893",  change: "+2.7%", up: true  },
  { symbol: "LINK",  name: "Chainlink",  price: "$14.32",  change: "+1.5%", up: true  },
  { symbol: "UNI",   name: "Uniswap",    price: "$9.47",   change: "−0.3%", up: false },
  { symbol: "DOGE",  name: "Dogecoin",   price: "$0.163",  change: "+5.8%", up: true  },
  { symbol: "ATOM",  name: "Cosmos",     price: "$9.12",   change: "+1.1%", up: true  },
  { symbol: "LTC",   name: "Litecoin",   price: "$82.40",  change: "−0.4%", up: false },
  { symbol: "NEAR",  name: "NEAR",       price: "$7.21",   change: "+3.4%", up: true  },
  { symbol: "APT",   name: "Aptos",      price: "$10.84",  change: "+2.9%", up: true  },
  { symbol: "ARB",   name: "Arbitrum",   price: "$1.13",   change: "−0.7%", up: false },
  { symbol: "OP",    name: "Optimism",   price: "$2.38",   change: "+1.4%", up: true  },
  { symbol: "INJ",   name: "Injective",  price: "$28.60",  change: "+7.3%", up: true  },
  { symbol: "SEI",   name: "Sei",        price: "$0.541",  change: "+4.1%", up: true  },
  { symbol: "TIA",   name: "Celestia",   price: "$8.17",   change: "−2.1%", up: false },
  { symbol: "FIL",   name: "Filecoin",   price: "$5.94",   change: "−1.8%", up: false },
  { symbol: "TRX",   name: "TRON",       price: "$0.128",  change: "+0.6%", up: true  },
]

const DOUBLED = [...ASSETS, ...ASSETS]

export default function Ticker() {
  useEffect(() => {
    const id = "echo-ticker-keyframes"
    if (document.getElementById(id)) return
    const style = document.createElement("style")
    style.id = id
    style.textContent = `
      @keyframes echo-ticker {
        from { transform: translateX(0); }
        to   { transform: translateX(-50%); }
      }
    `
    document.head.appendChild(style)
  }, [])

  return (
    <div
      style={{ overflow: "hidden", position: "relative", padding: "10px 0" }}
    >
      {/* left fade */}
      <div style={{
        position: "absolute", left: 0, top: 0, bottom: 0, width: 48, zIndex: 10,
        background: "linear-gradient(to right, rgba(42,42,42,0.9), transparent)",
        pointerEvents: "none",
      }} />
      {/* right fade */}
      <div style={{
        position: "absolute", right: 0, top: 0, bottom: 0, width: 48, zIndex: 10,
        background: "linear-gradient(to left, rgba(42,42,42,0.9), transparent)",
        pointerEvents: "none",
      }} />

      <div
        style={{
          display: "flex",
          alignItems: "center",
          width: "max-content",
          animation: "echo-ticker 45s linear infinite",
        }}
        onMouseEnter={e => (e.currentTarget.style.animationPlayState = "paused")}
        onMouseLeave={e => (e.currentTarget.style.animationPlayState = "running")}
      >
        {DOUBLED.map((asset, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "4px 14px",
              flexShrink: 0,
              cursor: "default",
            }}
          >
            <CoinLogo symbol={asset.symbol} size={22} />
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, lineHeight: 1, color: "inherit", margin: 0 }}
                className="text-black dark:text-white">
                {asset.symbol}
              </p>
              <p style={{ fontSize: 10, lineHeight: 1, marginTop: 3, color: "#9ca3af" }}>
                {asset.price}
              </p>
            </div>
            <span style={{ fontSize: 10, fontWeight: 600, color: asset.up ? "#22c55e" : "#f87171" }}>
              {asset.change}
            </span>
            <span style={{ color: "#4b5563", margin: "0 4px", fontSize: 12 }}>·</span>
          </div>
        ))}
      </div>
    </div>
  )
}
