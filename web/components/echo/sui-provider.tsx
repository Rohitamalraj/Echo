"use client"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
import { SuiClientProvider, WalletProvider } from "@mysten/dapp-kit"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

// The @mysten/dapp-kit v1.1.1 types are mismatched with @mysten/sui v2.19.0.
// At runtime SuiClientProvider accepts { url } directly — cast to bypass the TS error.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const networks = { testnet: { url: "https://fullnode.testnet.sui.io:443" } } as any

const queryClient = new QueryClient()

export default function SuiProvider({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <SuiClientProvider networks={networks} defaultNetwork="testnet">
        <WalletProvider autoConnect>
          {children}
        </WalletProvider>
      </SuiClientProvider>
    </QueryClientProvider>
  )
}
