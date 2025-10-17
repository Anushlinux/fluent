import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Get total count of successful fundings
    const totalUsers = await prisma.fundedWallet.count({
      where: { status: 'success' }
    })
    
    // Get all successful fundings to calculate total
    const successfulFundings = await prisma.fundedWallet.findMany({
      where: { status: 'success' },
      select: { amount: true }
    })
    
    // Calculate total ETH distributed
    const totalFunded = successfulFundings.reduce((sum, funding) => {
      return sum + parseFloat(funding.amount)
    }, 0)
    
    // Get recent fundings (last 20)
    const recentFundings = await prisma.fundedWallet.findMany({
      take: 20,
      orderBy: { fundedAt: 'desc' },
      select: {
        id: true,
        smartAccount: true,
        amount: true,
        txHash: true,
        fundedAt: true,
        status: true,
        errorMessage: true
      }
    })
    
    // Get status breakdown
    const statusCounts = await prisma.fundedWallet.groupBy({
      by: ['status'],
      _count: true
    })
    
    // Get funding activity by day (last 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    
    const recentActivity = await prisma.fundedWallet.findMany({
      where: {
        fundedAt: {
          gte: sevenDaysAgo
        }
      },
      orderBy: { fundedAt: 'asc' }
    })
    
    return NextResponse.json({
      totalUsers,
      totalFunded: totalFunded.toFixed(4),
      recentFundings,
      statusCounts,
      recentActivity: recentActivity.length,
      lastUpdated: new Date().toISOString()
    })
    
  } catch (error: any) {
    console.error('Error fetching admin stats:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch stats',
      details: error.message 
    }, { status: 500 })
  }
}

