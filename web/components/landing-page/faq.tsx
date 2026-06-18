"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"

const faqs = [
  {
    id: 1,
    question: "How does the 85/15 payout split work?",
    answer:
      "When you copy a predictor and your position wins, the smart contract automatically sends 85% of your gross payout to your wallet and 15% to the predictor's wallet — all in a single settlement transaction. The predictor only earns if you win. There is no platform fee and no admin key that can change this ratio.",
  },
  {
    id: 2,
    question: "Are predictor stats verified or self-reported?",
    answer:
      "All stats — win rate, total trades, streak, ROI — are stored on-chain in a PredictorProfile Move object and updated automatically at every trade settlement. No predictor can edit or delete past results. You can verify any stat directly on Sui Explorer.",
  },
  {
    id: 3,
    question: "What is DeepBook Predict?",
    answer:
      "DeepBook Predict is Sui's native on-chain binary and range prediction market protocol. It uses a Black-Scholes oracle and SVI volatility surface pricing to offer BTC UP/DOWN/RANGE positions with sub-hour rolling expiries. Echo is built directly on top of it.",
  },
  {
    id: 4,
    question: "What is a Premium Signal?",
    answer:
      "Predictors can optionally encrypt their trade reasoning using Seal — Sui's on-chain access control layer. The encrypted text is stored on Walrus. Followers pay a small dUSDC fee to unlock the decryption key via Seal's key servers. The predictor earns signal fees even from followers who don't copy.",
  },
  {
    id: 5,
    question: "Do I need to understand options pricing to use Echo?",
    answer:
      "No. Echo translates every DeepBook Predict position into plain English — 'BTC ABOVE $68,500 in 43 minutes, 67% implied probability.' You just decide whether you agree with the predictor's call and how much to copy.",
  },
  {
    id: 6,
    question: "What tokens do I need to trade?",
    answer:
      "Echo runs on Sui Testnet during the hackathon. You need testnet SUI (for gas) and testnet dUSDC (for positions). Request dUSDC from the DeepBook Predict faucet before your first trade.",
  },
]

export default function Faq() {
  const [openItem, setOpenItem] = useState<number | null>(null)

  const toggleItem = (id: number) => {
    setOpenItem(openItem === id ? null : id)
  }

  return (
    <section id="faq" className="my-20">
      <div className="card p-8 md:p-10 shadow-lg">
        <h2 className="text-black dark:text-white mb-6 text-3xl md:text-4xl lg:text-5xl font-medium leading-tight">
          Frequently Asked
          <span className="block text-[#7A7FEE] dark:text-[#7A7FEE]">Questions</span>
        </h2>
        <p className="mb-8 max-w-2xl text-gray-700 dark:text-gray-300">
          Everything you need to know about copy-trading on Echo, how the on-chain payout split works, and how
          predictor track records are verified.
        </p>

        <div className="space-y-4">
          {faqs.map((faq) => (
            <div key={faq.id} className="border-b pb-4 border-gray-300 dark:border-gray-700">
              <button
                onClick={() => toggleItem(faq.id)}
                className="flex justify-between items-center w-full text-left py-2 font-medium text-black dark:text-white hover:text-[#7A7FEE] dark:hover:text-[#7A7FEE] transition-colors"
                aria-expanded={openItem === faq.id}
                aria-controls={`faq-answer-${faq.id}`}
              >
                <span className="font-medium">{faq.question}</span>
                <ChevronDown
                  className={`w-5 h-5 transition-transform ${openItem === faq.id ? "rotate-180 text-[#7A7FEE]" : ""}`}
                />
              </button>
              {openItem === faq.id && (
                <div id={`faq-answer-${faq.id}`} className="mt-2 text-gray-700 dark:text-gray-300">
                  {faq.answer}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
