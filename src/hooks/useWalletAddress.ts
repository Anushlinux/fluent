'use client'

import { useWeb3Auth } from '@web3auth/modal-react-hooks'
import { useEffect, useState } from 'react'

export function useWalletAddress() {
  const { web3Auth, isConnected } = useWeb3Auth()
  const [address, setAddress] = useState<string | null>(null)

  useEffect(() => {
    const getAddress = async () => {
      if (isConnected && web3Auth?.provider) {
        try {
          // Get accounts from provider
          const accounts = await web3Auth.provider.request({
            method: 'eth_accounts',
          }) as string[]
          
          if (accounts && accounts.length > 0) {
            setAddress(accounts[0])
          }
        } catch (error) {
          console.error('Failed to get address:', error)
        }
      } else {
        setAddress(null)
      }
    }

    getAddress()
  }, [isConnected, web3Auth])

  return { address }
}
