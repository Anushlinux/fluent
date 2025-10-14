'use client' // This is required for hooks in Next.js App Router

import { useWeb3Auth } from '@web3auth/modal-react-hooks'
import { useWalletAddress } from '@/hooks/useWalletAddress'

export default function WalletConnect() {
  const { connect, logout, isConnected, userInfo } = useWeb3Auth()
  const { address } = useWalletAddress()

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

  if (isConnected && userInfo) {
    return (
      <div className="flex items-center gap-4">
        <div className="text-sm">
          <p className="font-medium">{userInfo.name}</p>
          <p className="text-gray-500 truncate w-32">
            {userInfo.email}
          </p>
          {address && (
            <p className="text-xs text-gray-600 font-mono mt-1">
              {address.slice(0, 6)}...{address.slice(-4)}
            </p>
          )}
        </div>
        <button
          onClick={handleDisconnect}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Disconnect
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={handleConnect}
      className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
    >
      Sign in with Google
    </button>
  )
}
