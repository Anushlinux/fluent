'use client'

import { Inter } from 'next/font/google'
import './globals.css'
import { Web3AuthProvider } from '@web3auth/modal-react-hooks'
import { web3AuthContextConfig } from '@/lib/web3auth'

const inter = Inter({ subsets: ['latin'] })

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <title>DeFi Assistant</title>
        <meta name="description" content="Earn interest on crypto without complexity" />
      </head>
      <body className={inter.className}>
        <Web3AuthProvider config={web3AuthContextConfig as any}>
          {children}
        </Web3AuthProvider>
      </body>
    </html>
  )
}
