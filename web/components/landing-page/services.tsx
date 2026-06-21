import { BarChart2, Copy, Zap, ShieldCheck } from "lucide-react"

const steps = [
  {
    number: "01",
    title: "Post a Trade",
    description:
      "Open a BTC UP or DOWN position on DeepBook Predict. Your on-chain Echo profile records every result — win rate, streak, earnings — automatically.",
    icon: BarChart2,
    highlight: "Your track record lives on Sui. Immutable.",
  },
  {
    number: "02",
    title: "Copy Instantly",
    description:
      "Find a predictor with a verified track record, tap Copy Trade, enter your amount. One transaction mirrors their position at the same strike and expiry.",
    icon: Copy,
    highlight: "Same position. Same oracle. Same rules.",
  },
  {
    number: "03",
    title: "Earn Automatically",
    description:
      "When your copy trade wins, the smart contract settles and routes 85% to you and 15% to your predictor in a single transaction. Zero manual steps.",
    icon: Zap,
    highlight: "85% yours. Always. By contract.",
  },
  {
    number: "04",
    title: "Trust the Contract",
    description:
      "No admin key. No fee changes. The payout ratio is hardcoded in a Move smart contract deployed on Sui Testnet. Anyone can verify it on-chain.",
    icon: ShieldCheck,
    highlight: "Verify it yourself on Sui Explorer.",
  },
]

export default function Services() {
  return (
    <section id="services" className="my-20">
      <div className="mb-12">
        <h2 className="text-black dark:text-white text-3xl md:text-4xl lg:text-5xl font-medium leading-tight">
          How Echo
          <span className="block text-[#7A7FEE]">Works</span>
        </h2>
        <p className="mt-4 max-w-2xl text-gray-600 dark:text-gray-300">
          A social copy-trading layer on top of DeepBook Predict — Sui&apos;s native binary prediction market.
          Four steps, zero trust required.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {steps.map((step) => (
          <div key={step.number} className="card p-6 shadow-md hover:shadow-lg transition-shadow group">
            <div className="flex items-start gap-4">
              <span className="text-4xl font-black text-[#7A7FEE]/15 dark:text-[#7A7FEE]/20 leading-none flex-shrink-0 select-none">
                {step.number}
              </span>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-[#7A7FEE]/10 flex items-center justify-center flex-shrink-0">
                    <step.icon className="w-4 h-4 text-[#7A7FEE]" />
                  </div>
                  <h3 className="text-base font-semibold text-black dark:text-white">{step.title}</h3>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 leading-relaxed">
                  {step.description}
                </p>
                <p className="text-xs font-semibold text-[#7A7FEE]">{step.highlight}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
