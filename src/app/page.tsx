import Link from 'next/link'
import WalletConnect from '@/components/WalletConnect'

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="max-w-2xl text-center space-y-8">
        <h1 className="text-5xl font-bold">
          💰 DeFi Assistant
        </h1>
        <p className="text-xl text-gray-600">
          Earn interest on crypto without the complexity
        </p>
        
        <div className="flex flex-col items-center gap-4">
          <WalletConnect />
          
          <Link 
            href="/chat"
            className="text-blue-600 hover:underline"
          >
            Or go to chat →
          </Link>
        </div>
      </div>
    </main>
  )
}
