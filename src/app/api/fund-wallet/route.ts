import { NextRequest, NextResponse } from 'next/server'
import { createWalletClient, createPublicClient, http, parseEther, formatEther } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { sepolia } from 'viem/chains'
import { prisma } from '@/lib/prisma'

// Your pre-funded wallet (YOU fund this once from faucet)
const FUNDING_WALLET_PK = process.env.FUNDING_WALLET_PRIVATE_KEY!
const FUNDING_AMOUNT = '0.05' // Reduced from 0.1 to make funds last longer

export async function POST(request: NextRequest) {
  try {
    const { smartAccountAddress } = await request.json()
    
    if (!smartAccountAddress) {
      console.error('❌ Missing smartAccountAddress in request')
      return NextResponse.json({ error: 'Missing smartAccountAddress' }, { status: 400 })
    }
    
    if (!FUNDING_WALLET_PK) {
      console.error('❌ FUNDING_WALLET_PRIVATE_KEY not set in environment')
      return NextResponse.json({ error: 'Funding wallet not configured' }, { status: 500 })
    }
    
    console.log('💰 Auto-funding request for:', smartAccountAddress)
    
    // Check if already funded in database
    const existingFunding = await prisma.fundedWallet.findUnique({
      where: { smartAccount: smartAccountAddress }
    })
    
    if (existingFunding && existingFunding.status === 'success') {
      console.log('✅ Already funded on', existingFunding.fundedAt)
      return NextResponse.json({
        success: true,
        alreadyFunded: true,
        fundedAt: existingFunding.fundedAt,
        amount: existingFunding.amount,
        txHash: existingFunding.txHash
      })
    }
    
    // Get RPC URL (use existing env var that's already configured)
    const rpcUrl = process.env.NEXT_PUBLIC_ALCHEMY_RPC_URL || `https://eth-sepolia.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`
    
    if (!rpcUrl || rpcUrl.includes('undefined')) {
      console.error('❌ Alchemy RPC URL not configured')
      return NextResponse.json({ error: 'RPC URL not configured' }, { status: 500 })
    }
    
    // Create clients
    const account = privateKeyToAccount(FUNDING_WALLET_PK as `0x${string}`)
    const publicClient = createPublicClient({
      chain: sepolia,
      transport: http(rpcUrl),
    })
    const walletClient = createWalletClient({
      account,
      chain: sepolia,
      transport: http(rpcUrl),
    })
    
    // Check funding wallet balance
    const fundingBalance = await publicClient.getBalance({ 
      address: account.address 
    })
    
    console.log('💵 Funding wallet balance:', formatEther(fundingBalance), 'ETH')
    
    if (fundingBalance < parseEther(FUNDING_AMOUNT)) {
      console.error('❌ Funding wallet depleted!')
      return NextResponse.json({
        error: 'Funding wallet needs refill',
        fundingWalletAddress: account.address,
        currentBalance: formatEther(fundingBalance),
        requiredBalance: FUNDING_AMOUNT
      }, { status: 503 })
    }
    
    // Create pending record in database
    const funding = await prisma.fundedWallet.create({
      data: {
        smartAccount: smartAccountAddress,
        amount: FUNDING_AMOUNT,
        fundedBy: account.address,
        status: 'pending'
      }
    })
    
    console.log('📤 Sending', FUNDING_AMOUNT, 'ETH from:', account.address)
    
    try {
      // Send transaction
      const hash = await walletClient.sendTransaction({
        to: smartAccountAddress as `0x${string}`,
        value: parseEther(FUNDING_AMOUNT),
      })
      
      console.log('✅ Auto-funding successful!')
      console.log('   Transaction hash:', hash)
      console.log('   Amount:', FUNDING_AMOUNT, 'ETH')
      
      // Update database to success
      await prisma.fundedWallet.update({
        where: { id: funding.id },
        data: { 
          status: 'success', 
          txHash: hash 
        }
      })
      
      return NextResponse.json({ 
        success: true, 
        txHash: hash,
        amount: `${FUNDING_AMOUNT} ETH`
      })
      
    } catch (txError: any) {
      // Update database to failed
      await prisma.fundedWallet.update({
        where: { id: funding.id },
        data: { 
          status: 'failed', 
          errorMessage: txError.message 
        }
      })
      
      console.error('❌ Transaction failed:', txError.message)
      throw txError
    }
    
  } catch (error: any) {
    console.error('❌ Auto-funding failed:', error.message)
    console.error('   Details:', error)
    return NextResponse.json({ 
      error: error.message || 'Failed to fund wallet',
      details: error.shortMessage || error.message 
    }, { status: 500 })
  }
}
