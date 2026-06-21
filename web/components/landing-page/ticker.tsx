"use client"

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
  return (
    <div className="relative overflow-hidden py-3">
      {/* left fade */}
      <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-12 z-10 bg-gradient-to-r from-white/80 dark:from-[#2a2a2a]/80 to-transparent" />
      {/* right fade */}
      <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-12 z-10 bg-gradient-to-l from-white/80 dark:from-[#2a2a2a]/80 to-transparent" />

      <div
        className="flex items-center gap-1 w-max"
        style={{ animation: "ticker-scroll 45s linear infinite" }}
        onMouseEnter={e => (e.currentTarget.style.animationPlayState = "paused")}
        onMouseLeave={e => (e.currentTarget.style.animationPlayState = "running")}
      >
        {DOUBLED.map((asset, i) => (
          <div
            key={i}
            className="flex items-center gap-2 px-4 py-1.5 rounded-lg flex-shrink-0 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors cursor-default"
          >
            <CoinLogo symbol={asset.symbol} size={22} />
            <div>
              <p className="text-xs font-bold text-black dark:text-white leading-none">{asset.symbol}</p>
              <p className="text-[10px] text-gray-400 leading-none mt-0.5">{asset.price}</p>
            </div>
            <span className={`text-[10px] font-semibold ${asset.up ? "text-green-500" : "text-red-400"}`}>
              {asset.change}
            </span>
            {/* separator dot */}
            <span className="text-gray-300 dark:text-gray-700 text-xs mx-1">·</span>
          </div>
        ))}
      </div>
    </div>
  )
}
