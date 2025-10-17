'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface FundingStats {
  totalUsers: number
  totalFunded: string
  recentFundings: Array<{
    id: string
    smartAccount: string
    amount: string
    txHash: string | null
    fundedAt: string
    status: string
    errorMessage: string | null
  }>
  statusCounts: Array<{
    status: string
    _count: number
  }>
  recentActivity: number
  lastUpdated: string
}

export default function AdminPage() {
  const [stats, setStats] = useState<FundingStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/stats')
      if (!response.ok) throw new Error('Failed to fetch stats')
      const data = await response.json()
      setStats(data)
      setError(null)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
    // Refresh every 10 seconds
    const interval = setInterval(fetchStats, 100000)
    return () => clearInterval(interval)
  }, [])

  if (loading && !stats) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading stats...</p>
        </div>
      </div>
    )
  }

  if (error && !stats) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-red-600 text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold mb-2">Error Loading Stats</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchStats}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  const successCount = stats?.statusCounts.find(s => s.status === 'success')?._count || 0
  const pendingCount = stats?.statusCounts.find(s => s.status === 'pending')?._count || 0
  const failedCount = stats?.statusCounts.find(s => s.status === 'failed')?._count || 0

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">💰 Funding Dashboard</h1>
              <p className="text-sm text-gray-500 mt-1">
                Last updated: {stats && new Date(stats.lastUpdated).toLocaleTimeString()}
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={fetchStats}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
              >
                🔄 Refresh
              </button>
              <Link
                href="/chat"
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition"
              >
                ← Back to App
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-sm text-gray-600 mb-2">Total Users Funded</p>
            <p className="text-4xl font-bold text-blue-600">{stats?.totalUsers || 0}</p>
            <p className="text-xs text-gray-500 mt-2">Successfully funded accounts</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-sm text-gray-600 mb-2">Total ETH Distributed</p>
            <p className="text-4xl font-bold text-green-600">{stats?.totalFunded || '0.00'}</p>
            <p className="text-xs text-gray-500 mt-2">Sepolia testnet ETH</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-sm text-gray-600 mb-2">Recent Activity</p>
            <p className="text-4xl font-bold text-purple-600">{stats?.recentActivity || 0}</p>
            <p className="text-xs text-gray-500 mt-2">Last 7 days</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-sm text-gray-600 mb-2">Success Rate</p>
            <p className="text-4xl font-bold text-orange-600">
              {stats && stats.totalUsers > 0 
                ? Math.round((successCount / (successCount + failedCount)) * 100) 
                : 0}%
            </p>
            <p className="text-xs text-gray-500 mt-2">{successCount} success / {failedCount} failed</p>
          </div>
        </div>

        {/* Status Breakdown */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-lg font-bold mb-4">Status Breakdown</h2>
          <div className="flex gap-4">
            <div className="flex-1 bg-green-50 p-4 rounded">
              <p className="text-sm text-green-600 font-medium">✅ Success</p>
              <p className="text-2xl font-bold text-green-700">{successCount}</p>
            </div>
            <div className="flex-1 bg-yellow-50 p-4 rounded">
              <p className="text-sm text-yellow-600 font-medium">⏳ Pending</p>
              <p className="text-2xl font-bold text-yellow-700">{pendingCount}</p>
            </div>
            <div className="flex-1 bg-red-50 p-4 rounded">
              <p className="text-sm text-red-600 font-medium">❌ Failed</p>
              <p className="text-2xl font-bold text-red-700">{failedCount}</p>
            </div>
          </div>
        </div>

        {/* Recent Fundings Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-bold">Recent Fundings</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Smart Account</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Transaction</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {stats?.recentFundings.map((funding) => (
                  <tr key={funding.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`
                        px-2 py-1 text-xs font-medium rounded-full
                        ${funding.status === 'success' ? 'bg-green-100 text-green-800' : ''}
                        ${funding.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : ''}
                        ${funding.status === 'failed' ? 'bg-red-100 text-red-800' : ''}
                      `}>
                        {funding.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-mono">
                      {funding.smartAccount.slice(0, 8)}...{funding.smartAccount.slice(-6)}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium">
                      {funding.amount} ETH
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(funding.fundedAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {funding.txHash ? (
                        <a
                          href={`https://sepolia.etherscan.io/tx/${funding.txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          View →
                        </a>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                  </tr>
                ))}
                {(!stats || stats.recentFundings.length === 0) && (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                      No fundings yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer Note */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>💡 Tip:</strong> This dashboard tracks all auto-funding activity. Use it to monitor your funding wallet balance and success rates during the hackathon demo.
          </p>
        </div>
      </main>
    </div>
  )
}

