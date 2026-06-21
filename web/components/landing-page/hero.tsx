import Image from "next/image"
import Link from "next/link"
import HeroConnectButton from "./hero-connect-button"
import Ticker from "./ticker"

export default function Hero() {
  return (
    <section id="hero" className="card my-8 relative overflow-hidden shadow-md">
      <div className="p-8 md:p-10 lg:p-14 flex flex-col md:flex-row items-start">
        <div className="w-full md:w-3/5 z-10">

          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#7A7FEE]/10 border border-[#7A7FEE]/20 text-[#7A7FEE] text-xs font-medium mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-[#7A7FEE] animate-pulse" />
            Live on Sui Testnet · Sui Overflow 2026
          </div>

          <h1 className="text-black dark:text-white text-4xl md:text-5xl lg:text-6xl font-medium leading-tight">
            Trade Smarter.
            <span className="block text-[#7A7FEE]">Copy the Best.</span>
          </h1>

          <p className="mt-6 mb-8 text-sm md:text-base max-w-md text-gray-600 dark:text-gray-300 leading-relaxed">
            Echo puts a social copy-trading layer on DeepBook Predict. Follow verified on-chain predictors,
            copy their calls in one tap — the <strong className="text-black dark:text-white">85/15 payout split</strong> is
            enforced by smart contract. No middleman. No trust required.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <HeroConnectButton />
            <Link href="/leaderboard" className="btn-secondary text-black dark:text-white">
              View Leaderboard
            </Link>
          </div>

          {/* Trust strip */}
          <div className="flex flex-wrap items-center gap-6 mt-8 pt-8 border-t border-gray-200 dark:border-gray-800">
            {[
              { label: "85/15 Split",   sub: "on-chain enforced" },
              { label: "0 Middlemen",   sub: "fully trustless"   },
              { label: "Instant Copy",  sub: "one transaction"   },
            ].map(s => (
              <div key={s.label}>
                <p className="text-sm font-semibold text-black dark:text-white">{s.label}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{s.sub}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Image */}
        <div className="hidden md:block md:w-2/5 md:absolute md:right-0 md:top-0 md:bottom-0">
          <Image
            src="/echo.png"
            alt="Echo"
            width={1000}
            height={1000}
            className="w-full h-full object-cover object-left opacity-20 md:opacity-100"
          />
        </div>
      </div>

      {/* Ticker — full-width strip at the bottom of the hero card */}
      <div className="border-t border-gray-200 dark:border-gray-800">
        <Ticker />
      </div>
    </section>
  )
}
