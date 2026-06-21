import Link from "next/link"
import HeroConnectButton from "./hero-connect-button"

export default function CallToAction() {
  return (
    <section id="cta" className="my-20">
      <div className="card p-8 md:p-12 shadow-md bg-gradient-to-br from-[#7A7FEE]/5 via-transparent to-transparent border border-[#7A7FEE]/10">
        <div className="max-w-2xl">
          {/* Tag */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#7A7FEE]/10 border border-[#7A7FEE]/20 text-[#7A7FEE] text-xs font-medium mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-[#7A7FEE] animate-pulse" />
            Testnet live now
          </div>

          <h2 className="text-black dark:text-white text-3xl md:text-4xl lg:text-5xl font-medium leading-tight mb-4">
            Your First Copy Trade
            <span className="block text-[#7A7FEE]">Starts Here.</span>
          </h2>

          <p className="text-gray-600 dark:text-gray-300 mb-3 max-w-lg leading-relaxed">
            Connect your Sui wallet, browse the leaderboard, and copy a verified predictor in under 60 seconds.
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-8 max-w-lg">
            The 85/15 split is hardcoded in a Move smart contract — no admin, no middleman, no catch.
          </p>

          <div className="flex flex-wrap items-center gap-3 mb-10">
            <HeroConnectButton />
            <Link href="/leaderboard" className="btn-secondary text-black dark:text-white">
              Browse Leaderboard
            </Link>
            <Link href="/feed" className="text-sm text-[#7A7FEE] hover:underline font-medium">
              See live trades →
            </Link>
          </div>

          {/* Protocol stack */}
          <div className="flex flex-wrap items-center gap-2 pt-8 border-t border-gray-200 dark:border-gray-800">
            <span className="text-xs text-gray-400 mr-1">Powered by</span>
            {[
              { label: "Sui", color: "text-[#4da2ff]" },
              { label: "DeepBook Predict", color: "text-[#7A7FEE]" },
              { label: "Walrus", color: "text-emerald-500" },
              { label: "SEAL", color: "text-orange-400" },
            ].map((p, i, arr) => (
              <span key={p.label} className="flex items-center gap-2">
                <span className={`text-xs font-semibold ${p.color}`}>{p.label}</span>
                {i < arr.length - 1 && <span className="text-gray-300 dark:text-gray-600 text-xs">·</span>}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
