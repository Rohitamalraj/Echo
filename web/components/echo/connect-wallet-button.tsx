"use client"

import { useState } from "react"
import dynamic from "next/dynamic"
import { useCurrentAccount, useWalletConnection, useDAppKit } from "@mysten/dapp-kit-react"
import { dAppKit } from "@/lib/dapp-kit"
import { Wallet, ChevronDown, LogOut } from "lucide-react"

const ConnectModal = dynamic(
  () => import("@mysten/dapp-kit-react/ui").then((m) => ({ default: m.ConnectModal })),
  { ssr: false }
)

function truncate(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

export default function ConnectWalletButton() {
  const [modalOpen, setModalOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  const connection = useWalletConnection()
  const account = useCurrentAccount()
  const kit = useDAppKit()

  const isConnected = connection.status === "connected"

  if (isConnected && account) {
    return (
      <div className="relative">
        <button
          onClick={() => setMenuOpen((v) => !v)}
          className="btn-primary text-sm flex items-center gap-2"
        >
          <Wallet className="w-4 h-4" />
          {truncate(account.address)}
          <ChevronDown className="w-3 h-3" />
        </button>

        {menuOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
            <div className="absolute right-0 mt-2 w-52 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#272829] shadow-lg z-50 p-2">
              <p className="text-xs text-gray-500 dark:text-gray-400 px-3 py-2 font-mono">
                {truncate(account.address)}
              </p>
              <hr className="border-gray-200 dark:border-gray-700 my-1" />
              <button
                onClick={async () => { setMenuOpen(false); await kit.disconnectWallet() }}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Disconnect
              </button>
            </div>
          </>
        )}
      </div>
    )
  }

  return (
    <>
      <button
        onClick={() => setModalOpen(true)}
        className="btn-primary text-sm flex items-center gap-2"
      >
        <Wallet className="w-4 h-4" />
        Connect Wallet
      </button>

      <ConnectModal
        instance={dAppKit as never}
        open={modalOpen}
        close={async () => setModalOpen(false)}
      />
    </>
  )
}
