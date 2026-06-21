"use client"

import { useEffect, useRef } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { X } from "lucide-react"
import { ConnectButton } from "@mysten/dapp-kit"

interface MobileMenuProps {
  isOpen: boolean
  onClose: () => void
}

export default function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)
  const pathname = usePathname()

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : ""
    return () => { document.body.style.overflow = "" }
  }, [isOpen])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) onClose()
    }
    if (isOpen) document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const linkClass = (href: string) =>
    `flex items-center py-3 px-4 rounded-lg text-base transition-colors ${
      pathname === href
        ? "bg-[#7A7FEE]/10 text-[#7A7FEE]"
        : "text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
    }`

  return (
    <div className="fixed inset-0 z-[100] bg-black/50 md:hidden">
      <div
        ref={menuRef}
        className="fixed top-0 right-0 h-full w-[85%] max-w-sm bg-white dark:bg-[#111111] shadow-xl overflow-y-auto"
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-[#111111]">
          <Link href="/" className="flex items-center gap-2" onClick={onClose}>
            <Image src="/echo.png" alt="Echo" width={36} height={36} className="h-9 w-9 object-cover rounded-full" />
            <span className="text-lg font-semibold tracking-tight text-black dark:text-white">ECHO</span>
          </Link>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
            aria-label="Close menu"
          >
            <X className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* Nav links */}
        <nav className="p-4">
          <ul className="space-y-1">
            {[
              { href: "/", label: "Home" },
              { href: "/feed", label: "Feed" },
              { href: "/leaderboard", label: "Leaderboard" },
              { href: "/portfolio", label: "Portfolio" },
            ].map(({ href, label }) => (
              <li key={href}>
                <Link href={href} className={linkClass(href)} onClick={onClose}>
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Wallet connect */}
        <div className="p-4 mt-2 border-t border-gray-200 dark:border-gray-800">
          <ConnectButton />
        </div>
      </div>
    </div>
  )
}
