'use client' // This is required for hooks in Next.js App Router

import { useWeb3Auth } from '@web3auth/modal-react-hooks'
import { useWalletAddress } from '@/hooks/useWalletAddress'
import { useSmartAccount } from '@/hooks/useSmartAccount'

export default function WalletConnect() {
  const { connect, logout, isConnected, userInfo } = useWeb3Auth()
  const { address } = useWalletAddress()
  const { smartAccountAddress, isLoading, error, fundingStatus } = useSmartAccount()

  const handleConnect = async () => {
    try {
      await connect()
    } catch (error) {
      console.error('Connection failed:', error)
    }
  }

  const handleDisconnect = async () => {
    try {
      await logout()
    } catch (error) {
      console.error('Disconnect failed:', error)
    }
  }

 if (isConnected) {
    return (
      <div className="flex items-center gap-4 p-4 bg-white rounded-lg shadow">
        <div className="flex-1">
          {userInfo && (
            <>
              <p className="font-medium text-sm">{userInfo.name}</p>
              <p className="text-xs text-gray-500">{userInfo.email}</p>
            </>
          )}
          
          {isLoading && (
            <p className="text-xs text-blue-600 mt-1">Setting up smart wallet...</p>
          )}
          
          {smartAccountAddress && (
            <div className="mt-1">
              <p className="text-xs text-gray-600">Smart Wallet:</p>
              <p className="text-xs font-mono text-green-600">
                {smartAccountAddress.slice(0, 6)}...{smartAccountAddress.slice(-4)}
              </p>
            </div>
          )}
          
          {fundingStatus === 'funding' && (
            <p className="text-xs text-blue-600 mt-1">💰 Adding test funds...</p>
          )}
          
          {fundingStatus === 'funded' && (
            <p className="text-xs text-green-600 mt-1">✅ Wallet ready!</p>
          )}
          
          {fundingStatus === 'failed' && (
            <p className="text-xs text-orange-600 mt-1">
              ⚠️ Auto-funding failed. Transactions may not work.
            </p>
          )}
          
          {error && (
            <p className="text-xs text-red-600 mt-1">Error: {error}</p>
          )}
        </div>
        
        <button
          onClick={handleDisconnect}
          className="px-4 py-2 bg-red-500 text-white rounded text-sm hover:bg-red-600"
        >
          Disconnect
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={handleConnect}
      className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
    >
      🔐 Sign in with Google
    </button>
  )
}