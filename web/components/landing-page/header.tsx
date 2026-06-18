"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Menu } from "lucide-react"
import ThemeToggle from "./theme-toggle"
import MobileMenu from "./mobile-menu"
import { ConnectButton } from "@mysten/dapp-kit"

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10)
    window.addEventListener("scroll", handleScroll)
    handleScroll()
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const handleLogoClick = (e: React.MouseEvent) => {
    e.preventDefault()
    router.push("/")
  }

  return (
    <>
      <header
        className={`sticky top-0 z-40 w-full transition-all duration-200 ${
          isScrolled ? "bg-white/90 dark:bg-[#111111]/90 backdrop-blur-sm shadow-sm" : "bg-transparent"
        }`}
      >
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2" onClick={handleLogoClick}>
              <Image
                src="/purple-circle-wave-static.png"
                alt="Echo Logo"
                width={40}
                height={40}
                className="h-10 w-10 object-cover rounded-full"
                priority
              />
              <span className="text-xl font-semibold tracking-tight text-black dark:text-white">
                ECHO
              </span>
            </Link>

            <div className="flex items-center space-x-4">
              <nav className="hidden md:block">
                <ul className="flex space-x-6">
                  <li>
                    <Link
                      href="/"
                      className={`transition-colors ${
                        pathname === "/"
                          ? "text-[#7A7FEE] dark:text-[#7A7FEE]"
                          : "text-black dark:text-white hover:text-[#7A7FEE] dark:hover:text-[#7A7FEE]"
                      }`}
                    >
                      Feed
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/leaderboard"
                      className={`transition-colors ${
                        pathname === "/leaderboard"
                          ? "text-[#7A7FEE] dark:text-[#7A7FEE]"
                          : "text-black dark:text-white hover:text-[#7A7FEE] dark:hover:text-[#7A7FEE]"
                      }`}
                    >
                      Leaderboard
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/portfolio"
                      className={`transition-colors ${
                        pathname === "/portfolio"
                          ? "text-[#7A7FEE] dark:text-[#7A7FEE]"
                          : "text-black dark:text-white hover:text-[#7A7FEE] dark:hover:text-[#7A7FEE]"
                      }`}
                    >
                      Portfolio
                    </Link>
                  </li>
                </ul>
              </nav>

              <ThemeToggle />

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
    </>
  )
}
