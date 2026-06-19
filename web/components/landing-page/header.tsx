"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Menu, PlusCircle } from "lucide-react"
import ThemeToggle from "./theme-toggle"
import MobileMenu from "./mobile-menu"
import { ConnectButton, useCurrentAccount } from "@mysten/dapp-kit"
import { hasProfile } from "@/lib/sui-client"
import dynamic from "next/dynamic"

const CreateProfileModal = dynamic(() => import("@/components/echo/create-profile-modal"), { ssr: false })
const PostTradeModal = dynamic(() => import("@/components/echo/post-trade-modal"), { ssr: false })

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [profileModalOpen, setProfileModalOpen] = useState(false)
  const [postTradeOpen, setPostTradeOpen] = useState(false)
  const [userHasProfile, setUserHasProfile] = useState(false)

  const pathname = usePathname()
  const router = useRouter()
  const account = useCurrentAccount()

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10)
    window.addEventListener("scroll", handleScroll)
    handleScroll()
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Check on-chain profile when wallet connects
  useEffect(() => {
    if (!account?.address) { setUserHasProfile(false); return }
    hasProfile(account.address).then(setUserHasProfile).catch(() => setUserHasProfile(false))
  }, [account?.address])

  const handleLogoClick = (e: React.MouseEvent) => {
    e.preventDefault()
    router.push("/")
  }

  function handlePostTrade() {
    if (!account) return
    if (!userHasProfile) { setProfileModalOpen(true) } else { setPostTradeOpen(true) }
  }

  const navLinkClass = (href: string) =>
    `transition-colors ${pathname === href ? "text-[#7A7FEE] dark:text-[#7A7FEE]" : "text-black dark:text-white hover:text-[#7A7FEE] dark:hover:text-[#7A7FEE]"}`

  return (
    <>
      <header className={`sticky top-0 z-40 w-full transition-all duration-200 ${isScrolled ? "bg-white/90 dark:bg-[#111111]/90 backdrop-blur-sm shadow-sm" : "bg-transparent"}`}>
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2" onClick={handleLogoClick}>
              <Image src="/purple-circle-wave-static.png" alt="Echo Logo" width={40} height={40} className="h-10 w-10 object-cover rounded-full" priority />
              <span className="text-xl font-semibold tracking-tight text-black dark:text-white">ECHO</span>
            </Link>

            <div className="flex items-center space-x-4">
              <nav className="hidden md:block">
                <ul className="flex space-x-6">
                  {[
                    { href: "/feed", label: "Feed" },
                    { href: "/leaderboard", label: "Leaderboard" },
                    { href: "/portfolio", label: "Portfolio" },
                  ].map(({ href, label }) => (
                    <li key={href}>
                      <Link href={href} className={navLinkClass(href)}>{label}</Link>
                    </li>
                  ))}
                </ul>
              </nav>

              <ThemeToggle />

              {/* Post Trade — only when wallet connected */}
              {account && (
                <button
                  onClick={handlePostTrade}
                  className="hidden md:flex items-center gap-1.5 btn-secondary text-black dark:text-white text-sm"
                >
                  <PlusCircle className="w-4 h-4" /> Post Trade
                </button>
              )}

              {/* Connect Wallet */}
              <div className="hidden md:block">
                <ConnectButton />
              </div>

              <button
                onClick={() => setMobileMenuOpen(true)}
                className="p-2 rounded-md bg-transparent hover:bg-gray-200/50 dark:hover:bg-gray-800/20 md:hidden"
                aria-label="Toggle menu"
              >
                <Menu className="h-6 w-6 text-black dark:text-white" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <MobileMenu isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />

      <CreateProfileModal
        open={profileModalOpen}
        onOpenChange={setProfileModalOpen}
        onSuccess={() => { setUserHasProfile(true); setPostTradeOpen(true) }}
      />

      <PostTradeModal open={postTradeOpen} onOpenChange={setPostTradeOpen} />
    </>
  )
}
