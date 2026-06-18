import { createDAppKit } from "@mysten/dapp-kit-core"
import { SuiGrpcClient } from "@mysten/sui/grpc"

const GRPC_URLS = {
  testnet: "https://fullnode.testnet.sui.io:443",
  mainnet: "https://fullnode.mainnet.sui.io:443",
} as const

export const dAppKit = createDAppKit({
  networks: ["testnet", "mainnet"] as const,
  defaultNetwork: "testnet",
  createClient: (network) =>
    new SuiGrpcClient({ network, baseUrl: GRPC_URLS[network] }),
})

// Register the global dAppKit type so all hooks are typed without needing
// to pass the instance explicitly to each hook call.
declare module "@mysten/dapp-kit-react" {
  interface Register {
    dAppKit: typeof dAppKit
  }
}
