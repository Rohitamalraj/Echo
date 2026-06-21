const highlights = [
  {
    value: "85 / 15",
    label: "Payout Split",
    sub: "enforced by Move contract",
    color: "text-[#7A7FEE]",
  },
  {
    value: "0",
    label: "Middlemen",
    sub: "fully on-chain settlement",
    color: "text-green-500",
  },
  {
    value: "1 tx",
    label: "to Copy",
    sub: "wallet sign → done",
    color: "text-[#f59e0b]",
  },
  {
    value: "Sui",
    label: "Testnet",
    sub: "no real money",
    color: "text-[#4da2ff]",
  },
]

const stack = ["DeepBook Predict", "Walrus", "SEAL", "Sui Move"]

export default function ProtocolStrip() {
  return (
    <div className="my-8 space-y-4">
      {/* Key numbers */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {highlights.map((h) => (
          <div key={h.label} className="card p-5 shadow-sm text-center">
            <p className={`text-2xl font-bold mb-0.5 ${h.color}`}>{h.value}</p>
            <p className="text-sm font-semibold text-black dark:text-white">{h.label}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{h.sub}</p>
          </div>
        ))}
      </div>

      {/* Stack strip */}
      <div className="card px-6 py-3 shadow-sm flex flex-wrap items-center gap-2">
        <span className="text-xs text-gray-400 mr-1">Built with</span>
        {stack.map((s, i) => (
          <span key={s} className="flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{s}</span>
            {i < stack.length - 1 && (
              <span className="text-gray-300 dark:text-gray-600">·</span>
            )}
          </span>
        ))}
        <span className="ml-auto text-xs text-gray-400 hidden sm:block">Sui Overflow 2026 · DeepBook Track</span>
      </div>
    </div>
  )
}
