import { BarChart2, Copy, Zap } from "lucide-react"

const services = [
  {
    id: 1,
    title: "Post a Trade",
    description: "Browse DeepBook Predict markets, pick a direction, add your reasoning. Your on-chain profile tracks every result automatically.",
    icon: BarChart2,
    color: "bg-[#7A7FEE]",
  },
  {
    id: 2,
    title: "Copy Instantly",
    description: "One tap mirrors a verified predictor's open position at the same strike and expiry. No options knowledge required.",
    icon: Copy,
    color: "bg-[#7A7FEE]",
  },
  {
    id: 3,
    title: "Earn Automatically",
    description: "When you win, the smart contract routes 85% to your wallet and 15% to your predictor in the same settlement transaction.",
    icon: Zap,
    color: "bg-[#7A7FEE]",
  },
]

export default function Services() {
  return (
    <section id="services" className="my-20">
      <h2 className="text-black dark:text-white mb-6 text-3xl md:text-4xl lg:text-5xl font-medium leading-tight">
        How Echo
        <span className="block text-[#7A7FEE] dark:text-[#7A7FEE]">Works</span>
      </h2>
      <p className="mb-12 max-w-2xl text-gray-700 dark:text-gray-300">
        Echo puts a social copy-trading layer on top of DeepBook Predict — Sui's on-chain binary prediction market.
        Three steps, zero trust required.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {services.map((service) => (
          <div key={service.id} className="card p-6 shadow-md hover:shadow-lg transition-shadow duration-300">
            <div className={`${service.color} w-12 h-12 rounded-full flex items-center justify-center mb-4 shadow-sm`}>
              <service.icon className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-black dark:text-white">{service.title}</h3>
            <p className="text-gray-700 dark:text-gray-300">{service.description}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
