import Image from "next/image"
import Link from "next/link"

export default function Hero() {
  return (
    <section id="hero" className="card my-8 relative overflow-hidden shadow-md">
      <div className="p-8 md:p-10 lg:p-12 flex flex-col md:flex-row items-start">
        {/* Text content - takes full width on mobile */}
        <div className="w-full md:w-3/5 z-10">
          <h1 className="text-black dark:text-white text-4xl md:text-5xl lg:text-6xl font-medium leading-tight">
            Trade Smarter.
            <span className="block text-[#7A7FEE] dark:text-[#7A7FEE]">Copy the Best.</span>
          </h1>
          <p className="my-6 text-sm md:text-base max-w-md text-gray-700 dark:text-gray-300">
            Follow verified on-chain predictors on DeepBook Predict. Copy their calls with one tap and earn
            automatically — the 85/15 payout split is enforced by smart contract, no middleman.
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <button className="btn-primary">Connect Wallet</button>
            <Link href="/leaderboard" className="btn-secondary text-black dark:text-white">
              View Leaderboard
            </Link>
          </div>
        </div>

        {/* Image - hidden on mobile, visible on md and up */}
        <div className="hidden md:block md:w-2/5 md:absolute md:right-0 md:top-0 md:bottom-0 md:flex md:items-center">
          <Image
            src="/echo.png"
            alt="Echo Logo"
            width={1000}
            height={1000}
            className="w-full h-auto md:h-full md:w-auto md:object-cover md:object-left"
          />
        </div>
      </div>
    </section>
  )
}
