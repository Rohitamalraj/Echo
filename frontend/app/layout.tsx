import type React from 'react'
import type { Metadata } from 'next'
import { Manrope, Inter } from 'next/font/google'
import './globals.css'

const manrope = Manrope({ subsets: ['latin'], variable: '--font-manrope' })
const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'Echo — Social Copy Trading on DeepBook Predict',
  description: 'Copy the best prediction traders on Sui. Verified on-chain track records. Automatic payout split.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`font-sans ${manrope.variable} ${inter.variable} min-h-screen bg-background text-foreground`}>
        {children}
      </body>
    </html>
  )
}
