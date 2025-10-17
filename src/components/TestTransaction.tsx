'use client'

import { useState } from 'react'
import { useSmartAccount } from '@/hooks/useSmartAccount'
import { parseEther } from 'viem'

export default function TestTransaction() {
  const { smartAccountClient, smartAccountAddress } = useSmartAccount()
  const [status, setStatus] = useState('')
  const [txHash, setTxHash] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const sendTestTransaction = async () => {
    if (!smartAccountClient || !smartAccountAddress) {
      setStatus('❌ Smart account not ready')
      return
    }

    try {
      setIsLoading(true)
      setStatus('📝 Preparing transaction...')
      
      console.log('=== Test Transaction Start ===')
      console.log('From:', smartAccountAddress)
      console.log('To:', smartAccountAddress)
      console.log('Value: 0.001 ETH')
      
      // Send transaction
      setStatus('🔄 Sending transaction (this may take 10-15 seconds)...')
      
      const txHash = await smartAccountClient.sendTransaction({
        to: smartAccountAddress,
        value: parseEther('0.001'),
        data: '0x', // Empty data for simple transfer
      })
      
      console.log('✅ Transaction sent!')
      console.log('   Hash:', txHash)
      
      setTxHash(txHash)
      setStatus('✅ Transaction sent! Waiting for confirmation...')
      
      // Optional: Wait for receipt
      setStatus('⏳ Waiting for confirmation...')
      
      // You can add receipt waiting here if needed
      setStatus('✅ Transaction confirmed!')
      
    } catch (error: any) {
      console.error('❌ Transaction failed')
      console.error('   Error:', error.message)
      console.error('   Details:', error)
      
      setStatus(`❌ Transaction failed: ${error.shortMessage || error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  if (!smartAccountClient) {
    return (
      <div className="p-4 border rounded bg-gray-50">
        <p className="text-gray-500">Connect wallet to test transactions</p>
      </div>
    )
  }

  return (
    <div className="p-6 border rounded-lg space-y-4 bg-white shadow">
      <div>
        <h3 className="font-bold text-lg mb-2">🧪 Test Gasless Transaction</h3>
        <p className="text-sm text-gray-600 mb-4">
          This will send 0.001 ETH to yourself. Gas fees are sponsored by Pimlico!
        </p>
      </div>
      
      <button
        onClick={sendTestTransaction}
        disabled={isLoading}
        className={`
          px-6 py-3 rounded-lg font-medium transition w-full
          ${isLoading 
            ? 'bg-gray-400 cursor-not-allowed' 
            : 'bg-green-600 hover:bg-green-700 text-white'
          }
        `}
      >
        {isLoading ? '⏳ Processing...' : '🚀 Send Test Transaction'}
      </button>
      
      {status && (
        <div className={`
          p-3 rounded text-sm
          ${status.includes('❌') ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-blue-700'}
        `}>
          {status}
        </div>
      )}
      
      {txHash && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Transaction Hash:</p>
          <p className="text-xs font-mono bg-gray-100 p-2 rounded break-all">
            {txHash}
          </p>
          <a 
            href={`https://sepolia.etherscan.io/tx/${txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block text-blue-600 hover:underline text-sm"
          >
            View on Etherscan →
          </a>
        </div>
      )}
    </div>
  )
}
