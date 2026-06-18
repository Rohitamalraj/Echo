"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SuiClientProvider, WalletProvider } from "@mysten/dapp-kit";
import { getJsonRpcFullnodeUrl } from "@mysten/sui/jsonRpc";
import type { ReactNode } from "react";

const networks = {
  testnet: { url: getJsonRpcFullnodeUrl("testnet"), network: "testnet" as const },
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 10_000, refetchInterval: 30_000 },
  },
});

export function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <SuiClientProvider networks={networks} defaultNetwork="testnet">
        <WalletProvider autoConnect>{children}</WalletProvider>
      </SuiClientProvider>
    </QueryClientProvider>
  );
}
