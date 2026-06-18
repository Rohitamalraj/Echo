import type React from "react"
import type { Metadata } from "next"
import { Outfit } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { Analytics } from "@vercel/analytics/react"
import "@/components/landing-page/styles.css"
import "@mysten/dapp-kit/dist/index.css"
import { Suspense } from "react"
import "./globals.css"
import SuiProvider from "@/components/echo/sui-provider"

const outfit = Outfit({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
  variable: "--font-outfit",
})

export const metadata: Metadata = {
  title: "Echo — Social Copy-Trading on DeepBook Predict",
  description:
    "Follow verified on-chain predictors on DeepBook Predict. Copy their calls with one tap and earn automatically with a smart-contract-enforced 85/15 payout split.",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={outfit.className}>
        <Suspense fallback={null}>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
            <SuiProvider>
              {children}
            </SuiProvider>
          </ThemeProvider>
          <Analytics />
        </Suspense>
      </body>
    </html>
  )
}
