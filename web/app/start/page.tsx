import Link from "next/link"
import Header from "@/components/landing-page/header"
import Footer from "@/components/landing-page/footer"
import { ArrowRight, Wallet, Coins, TrendingUp, Copy } from "lucide-react"

export const metadata = {
  title: "Get Started | Echo",
  description: "Start copy-trading on DeepBook Predict in four steps. Connect your Sui wallet, get testnet dUSDC, and copy your first predictor.",
}

const steps = [
  {
    icon: Wallet,
    step: "01",
    title: "Connect your Sui wallet",
    description: "Install the Sui Wallet browser extension and switch to Sui Testnet. You need a small amount of testnet SUI for gas fees.",
    action: { label: "Get testnet SUI", href: "https://faucet.sui.io/", external: true },
  },
  {
    icon: Coins,
    step: "02",
    title: "Get testnet dUSDC",
    description: "dUSDC is the quote token on DeepBook Predict. Request some from the faucet — you'll use it to fund your copy trades.",
    action: { label: "Open DeepBook Predict", href: "https://predict.deepbook.tech/", external: true },
  },
  {
    icon: TrendingUp,
    step: "03",
    title: "Create your Echo profile",
    description: "Click Post Trade in the header. If you don't have an Echo profile yet, the app guides you through creating one on-chain — it's a single transaction.",
    action: null,
  },
  {
    icon: Copy,
    step: "04",
    title: "Copy your first trade",
    description: "Browse the Feed or Leaderboard, find a predictor with a strong track record, and tap Copy Trade. Enter your amount and confirm in your wallet.",
    action: { label: "Browse Feed", href: "/feed", external: false },
  },
]

export default function GetStartedPage() {
  return (
    <main className="min-h-screen bg-white dark:bg-[#111111]">
      <Header />

      <div className="container pt-4 pb-20">
        <section className="my-12">
          <div className="max-w-2xl mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#7A7FEE]/10 border border-[#7A7FEE]/20 text-[#7A7FEE] text-xs font-medium mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-[#7A7FEE] animate-pulse" />
              Sui Testnet · under 5 minutes
            </div>
            <h1 className="text-black dark:text-white text-4xl md:text-5xl font-medium leading-tight mb-4">
              Get Started
              <span className="block text-[#7A7FEE]">with Echo</span>
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-base max-w-lg">
              Echo runs on Sui Testnet — no real money involved. Follow these steps to go from zero to
              your first copy trade in under 5 minutes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-16">
            {steps.map((s) => (
              <div key={s.step} className="card p-6 shadow-md flex flex-col gap-4">
                <div className="flex items-center gap-4">
                  <span className="text-4xl font-black text-[#7A7FEE]/15 leading-none select-none">{s.step}</span>
                  <div className="w-10 h-10 rounded-lg bg-[#7A7FEE]/10 flex items-center justify-center">
                    <s.icon className="w-5 h-5 text-[#7A7FEE]" />
                  </div>
                </div>
                <div>
                  <h3 className="text-base font-semibold text-black dark:text-white mb-1">{s.title}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{s.description}</p>
                </div>
                {s.action && (
                  s.action.external ? (
                    <a href={s.action.href} target="_blank" rel="noopener noreferrer"
                      className="mt-auto inline-flex items-center gap-1.5 text-sm text-[#7A7FEE] hover:underline font-medium">
                      {s.action.label} <ArrowRight className="w-3.5 h-3.5" />
                    </a>
                  ) : (
                    <Link href={s.action.href}
                      className="mt-auto inline-flex items-center gap-1.5 text-sm text-[#7A7FEE] hover:underline font-medium">
                      {s.action.label} <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  )
                )}
              </div>
            ))}
          </div>

          {/* Stats strip */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { label: "Copy split", value: "85 / 15", sub: "You keep 85% of winnings" },
              { label: "Settlement", value: "On-chain", sub: "Enforced by Move smart contract" },
              { label: "Network", value: "Sui Testnet", sub: "No real money involved" },
            ].map(c => (
              <div key={c.label} className="card p-5 shadow-sm text-center">
                <p className="text-2xl font-bold text-[#7A7FEE] mb-1">{c.value}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide mb-0.5">{c.label}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500">{c.sub}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      <Footer />
    </main>
  )
}
