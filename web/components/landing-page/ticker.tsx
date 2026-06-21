"use client"

import CoinLogo from "@/components/echo/coin-logo"

const ASSETS = [
  { symbol: "BTC",   name: "Bitcoin",     price: "$68,420",  change: "+2.3%",  up: true  },
  { symbol: "ETH",   name: "Ethereum",    price: "$3,847",   change: "+1.8%",  up: true  },
  { symbol: "SOL",   name: "Solana",      price: "$187.50",  change: "+4.2%",  up: true  },
  { symbol: "SUI",   name: "Sui",         price: "$1.84",    change: "+6.2%",  up: true  },
  { symbol: "BNB",   name: "BNB",         price: "$612.00",  change: "−0.5%",  up: false },
  { symbol: "XRP",   name: "XRP",         price: "$0.621",   change: "+0.9%",  up: true  },
  { symbol: "ADA",   name: "Cardano",     price: "$0.483",   change: "−1.2%",  up: false },
  { symbol: "AVAX",  name: "Avalanche",   price: "$38.90",   change: "+3.1%",  up: true  },
  { symbol: "DOT",   name: "Polkadot",    price: "$7.85",    change: "−0.8%",  up: false },
  { symbol: "MATIC", name: "Polygon",     price: "$0.893",   change: "+2.7%",  up: true  },
  { symbol: "LINK",  name: "Chainlink",   price: "$14.32",   change: "+1.5%",  up: true  },
  { symbol: "UNI",   name: "Uniswap",     price: "$9.47",    change: "−0.3%",  up: false },
  { symbol: "DOGE",  name: "Dogecoin",    price: "$0.163",   change: "+5.8%",  up: true  },
  { symbol: "ATOM",  name: "Cosmos",      price: "$9.12",    change: "+1.1%",  up: true  },
  { symbol: "LTC",   name: "Litecoin",    price: "$82.40",   change: "−0.4%",  up: false },
  { symbol: "NEAR",  name: "NEAR",        price: "$7.21",    change: "+3.4%",  up: true  },
  { symbol: "APT",   name: "Aptos",       price: "$10.84",   change: "+2.9%",  up: true  },
  { symbol: "ARB",   name: "Arbitrum",    price: "$1.13",    change: "−0.7%",  up: false },
  { symbol: "OP",    name: "Optimism",    price: "$2.38",    change: "+1.4%",  up: true  },
  { symbol: "TRX",   name: "TRON",        price: "$0.128",   change: "+0.6%",  up: true  },
  { symbol: "FIL",   name: "Filecoin",    price: "$5.94",    change: "−1.8%",  up: false },
  { symbol: "INJ",   name: "Injective",   price: "$28.60",   change: "+7.3%",  up: true  },
  { symbol: "SEI",   name: "Sei",         price: "$0.541",   change: "+4.1%",  up: true  },
  { symbol: "TIA",   name: "Celestia",    price: "$8.17",    change: "−2.1%",  up: false },
]

// duplicate for seamless loop
const DOUBLED = [...ASSETS, ...ASSETS]

export default function Ticker() {
  return (
    <>
      <style>{`
        @keyframes ticker-scroll {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        .ticker-track {
          animation: ticker-scroll 40s linear infinite;
          will-change: transform;
        }
        .ticker-track:hover {
          animation-play-state: paused;
        }
      `}</style>

      <div className="relative overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#111111] py-2">
        {/* left fade */}
        <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-16 z-10
          bg-gradient-to-r from-white dark:from-[#111111] to-transparent" />
        {/* right fade */}
        <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-16 z-10
          bg-gradient-to-l from-white dark:from-[#111111] to-transparent" />

        <div className="ticker-track flex items-center gap-3">
          {DOUBLED.map((asset, i) => (
            <div
              key={i}
              className="flex items-center gap-2.5 flex-shrink-0 px-4 py-2 rounded-lg
                hover:bg-gray-50 dark:hover:bg-[#1e1e1e] transition-colors cursor-default"
            >
              <CoinLogo symbol={asset.symbol} size={26} />
              <div className="min-w-0">
                <p className="text-xs font-bold text-black dark:text-white leading-none">{asset.symbol}</p>
                <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5 leading-none">{asset.name}</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-semibold text-black dark:text-white leading-none">{asset.price}</p>
                <p className={`text-[10px] font-medium mt-0.5 leading-none ${asset.up ? "text-green-500" : "text-red-400"}`}>
                  {asset.change}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
