'use client'

import { useState, useEffect } from 'react'
import { useWeb3Auth } from '@web3auth/modal-react-hooks'
import { createSmartAccount, getSignerFromWeb3Auth } from '@/lib/smartAccount'

type FundingStatus = 'idle' | 'funding' | 'funded' | 'failed'

export function useSmartAccount() {
  const { web3Auth, isConnected } = useWeb3Auth()
  const [smartAccountAddress, setSmartAccountAddress] = useState<string | null>(null)
  const [smartAccountClient, setSmartAccountClient] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fundingStatus, setFundingStatus] = useState<FundingStatus>('idle')

  // Initialize smart account
  useEffect(() => {
    async function initSmartAccount() {
      if (!isConnected || !web3Auth?.provider) {
        setSmartAccountAddress(null)
        setSmartAccountClient(null)
        setFundingStatus('idle')
        return
      }

      try {
        setIsLoading(true)
        setError(null)
        
        // Convert Web3Auth provider to viem signer
        const signer = await getSignerFromWeb3Auth(web3Auth.provider)
        
        // Create smart account
        const { smartAccountClient, smartAccountAddress } = await createSmartAccount(signer)
        
        setSmartAccountClient(smartAccountClient)
        setSmartAccountAddress(smartAccountAddress)
      } catch (err: any) {
        console.error('Failed to initialize smart account:', err)
        setError(err.message)
      } finally {
        setIsLoading(false)
      }
    }

    initSmartAccount()
  }, [isConnected, web3Auth])

  // Auto-fund wallet after smart account is created
  useEffect(() => {
    async function fundWallet() {
      if (!smartAccountAddress || fundingStatus !== 'idle') {
        return
      }

      try {
        setFundingStatus('funding')
        console.log('💰 Requesting auto-funding for:', smartAccountAddress)
        
        const response = await fetch('/api/fund-wallet', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ smartAccountAddress }),
        })

        const data = await response.json()

        if (response.ok && data.success) {
          if (data.alreadyFunded) {
            console.log('✅ Already funded on', new Date(data.fundedAt).toLocaleString())
            console.log('   Transaction hash:', data.txHash)
            console.log('   Amount:', data.amount)
          } else {
            console.log('✅ Auto-funding successful!')
            console.log('   Transaction hash:', data.txHash)
            console.log('   Amount:', data.amount)
          }
          setFundingStatus('funded')
        } else {
          console.warn('⚠️ Auto-funding failed (non-critical):', data.error)
          console.warn('   Details:', data.details || 'No additional details')
          if (data.fundingWalletAddress) {
            console.warn('   Funding wallet needs refill:', data.fundingWalletAddress)
            console.warn('   Current balance:', data.currentBalance, 'ETH')
          }
          setFundingStatus('failed')
        }
      } catch (err: any) {
        console.warn('⚠️ Auto-funding error (non-critical):', err.message)
        setFundingStatus('failed')
        // Don't throw - let user continue
      }
    }

    fundWallet()
  }, [smartAccountAddress, fundingStatus])

  return {
    smartAccountAddress,
    smartAccountClient,
    isLoading,
    error,
    fundingStatus,
  }
}
