'use client'

import WalletConnect from '@/components/WalletConnect'
import { useWeb3Auth } from '@web3auth/modal-react-hooks'
import TestTransaction from '@/components/TestTransaction'

export default function ChatPage() {
  const { isConnected } = useWeb3Auth()

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="p-4 border-b bg-white shadow-sm">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold">DeFi Assistant</h1>
          <WalletConnect />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        {isConnected ? (
          <div className="h-full p-4">
            <p>Chat interface will go here</p>
            <TestTransaction />
          </div>
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-center space-y-4">
              <p className="text-gray-600">Please connect your wallet to start</p>
              <WalletConnect />
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
