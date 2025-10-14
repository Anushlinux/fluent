import { WEB3AUTH_NETWORK, type Web3AuthOptions } from '@web3auth/modal'
import { CHAIN_NAMESPACES } from '@web3auth/base'
import { EthereumPrivateKeyProvider } from '@web3auth/ethereum-provider'

// Use Alchemy RPC if available, otherwise fall back to Infura's public Sepolia RPC
const rpcTarget = process.env.NEXT_PUBLIC_ALCHEMY_RPC_URL || 'https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161'

const chainConfig = {
  chainNamespace: CHAIN_NAMESPACES.EIP155,
  chainId: '0xaa36a7', 
  rpcTarget: rpcTarget,
  displayName: 'Ethereum Sepolia Testnet',
  blockExplorerUrl: 'https://sepolia.etherscan.io',
  ticker: 'ETH',
  tickerName: 'Ethereum',
}

const privateKeyProvider = new EthereumPrivateKeyProvider({
  config: {
    chainConfig,
  },
})

const web3AuthOptions: Web3AuthOptions = {
  clientId: process.env.NEXT_PUBLIC_WEB3AUTH_CLIENT_ID || '', 
  web3AuthNetwork: WEB3AUTH_NETWORK.SAPPHIRE_DEVNET,
  privateKeyProvider: privateKeyProvider as any,
}

export const web3AuthContextConfig = {
  web3AuthOptions,
}

export default web3AuthContextConfig