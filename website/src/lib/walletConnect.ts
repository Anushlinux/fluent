/**
 * Wallet Connection Utilities
 * Handles MetaMask connection and Base Sepolia network setup
 */

import { BrowserProvider, Contract, JsonRpcSigner, Interface } from 'ethers';

// FluentBadges contract ABI
const FluentBadgesABI = [
  {
    inputs: [
      { internalType: "address", name: "to", type: "address" },
      { internalType: "string", name: "uri", type: "string" },
      { internalType: "string", name: "domain", type: "string" }
    ],
    name: "mint",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "to", type: "address" },
      { indexed: true, internalType: "uint256", name: "tokenId", type: "uint256" },
      { indexed: false, internalType: "string", name: "uri", type: "string" },
      { indexed: false, internalType: "string", name: "domain", type: "string" }
    ],
    name: "BadgeMinted",
    type: "event"
  },
  {
    inputs: [{ internalType: "uint256", name: "tokenId", type: "uint256" }],
    name: "tokenURI",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "view",
    type: "function"
  }
] as const;

interface WalletState {
  connected: boolean;
  account: string | null;
  provider: BrowserProvider | null;
  signer: JsonRpcSigner | null;
}

// Global state
let walletState: WalletState = {
  connected: false,
  account: null,
  provider: null,
  signer: null,
};

/**
 * Connect to MetaMask wallet
 */
export async function connectMetaMask(): Promise<JsonRpcSigner> {
  if (typeof window === 'undefined') {
    throw new Error('Window is not available');
  }

  if (!window.ethereum) {
    throw new Error('MetaMask is not installed. Please install MetaMask to continue.');
  }

  // Request account access
  await window.ethereum.request({ method: 'eth_requestAccounts' });

  // Get provider and signer
  const provider = new BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  const account = await signer.getAddress();

  walletState = {
    connected: true,
    account,
    provider,
    signer,
  };

  console.log('[Wallet] Connected to account:', account);
  return signer;
}

/**
 * Get current wallet signer
 */
export function getSigner(): JsonRpcSigner | null {
  return walletState.signer;
}

/**
 * Check if wallet is connected
 */
export function isConnected(): boolean {
  return walletState.connected && walletState.account !== null;
}

/**
 * Get current account address
 */
export function getAccount(): string | null {
  return walletState.account;
}

/**
 * Switch to Base Sepolia network
 */
export async function switchToBaseSepolia(): Promise<void> {
  if (typeof window === 'undefined') {
    throw new Error('Window is not available');
  }

  if (!window.ethereum) {
    throw new Error('MetaMask is not installed');
  }

  const chainId = await window.ethereum.request({ method: 'eth_chainId' });
  const baseSepoliaChainId = '0x14a34'; // 84532 in hex

  if (chainId !== baseSepoliaChainId) {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: baseSepoliaChainId }],
      });
    } catch (switchError: any) {
      // If chain doesn't exist, add it
      if (switchError.code === 4902) {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId: baseSepoliaChainId,
              chainName: 'Base Sepolia',
              nativeCurrency: {
                name: 'ETH',
                symbol: 'ETH',
                decimals: 18,
              },
              rpcUrls: ['https://sepolia.base.org'],
              blockExplorerUrls: ['https://sepolia.basescan.org'],
            },
          ],
        });
      } else {
        throw switchError;
      }
    }
  }
}

/**
 * Estimate gas cost for a transaction
 */
export async function estimateGasCost(
  method: any,
  params: any[]
): Promise<bigint> {
  const { gasLimit } = await method.estimateGas(...params);
  return gasLimit * BigInt(100); // Add 100% buffer for safety
}

/**
 * Mint a badge NFT
 */
export async function mintBadge(
  contractAddress: string,
  userAddress: string,
  tokenURI: string,
  domain: string
): Promise<{ txHash: string; tokenId: number }> {
  const signer = walletState.signer;
  if (!signer) {
    throw new Error('Wallet not connected. Please connect your MetaMask wallet.');
  }

  // Switch to Base Sepolia
  await switchToBaseSepolia();

  // Get contract instance
  const contract = new Contract(contractAddress, FluentBadgesABI, signer);

  try {
    // Check if minter role is set (this will be the site's minter address)
    console.log('[Mint] Preparing to mint badge...');
    
    // Estimate gas
    const gasLimit = await contract.mint.estimateGas(userAddress, tokenURI, domain);
    const gasPrice = await signer.provider.getFeeData();
    
    console.log('[Mint] Estimated gas:', gasLimit.toString());
    console.log('[Mint] Gas price:', gasPrice);

    // Execute mint transaction
    const tx = await contract.mint(userAddress, tokenURI, domain, {
      gasLimit: gasLimit * BigInt(120) / BigInt(100), // 20% buffer
    });

    console.log('[Mint] Transaction sent:', tx.hash);
    
    // Wait for 1 block confirmation
    const receipt = await tx.wait(1);
    
    console.log('[Mint] Transaction confirmed:', receipt.hash);
    
    // Parse the BadgeMinted event to get the token ID
    let tokenId = 0;
    if (receipt.logs && receipt.logs.length > 0) {
      const eventInterface = new Interface(FluentBadgesABI);
      for (const log of receipt.logs) {
        try {
          const decoded = eventInterface.parseLog({
            topics: log.topics as string[],
            data: log.data
          });
          
          if (decoded && decoded.name === 'BadgeMinted') {
            // Event signature: BadgeMinted(address indexed to, uint256 tokenId, string uri, string domain)
            // args[0] = to (address)
            // args[1] = tokenId (uint256)
            tokenId = Number(decoded.args[1]); // Second arg is tokenId (first is 'to' address)
            console.log('[Mint] Token ID from event:', tokenId);
            break;
          }
        } catch (e) {
          console.error('[Mint] Failed to parse log:', e);
        }
      }
    }

    if (tokenId === 0) {
      throw new Error('Failed to extract token ID from transaction receipt');
    }
    
    return { txHash: receipt.hash, tokenId };
  } catch (error: any) {
    console.error('[Mint] Failed to mint badge:', error);
    
    if (error.code === 4001) {
      throw new Error('Transaction rejected by user');
    } else if (error.message?.includes('insufficient funds')) {
      throw new Error('Insufficient gas. Please add ETH to your wallet.');
    } else if (error.message?.includes('Soulbound')) {
      throw new Error('Token is soulbound and cannot be transferred.');
    } else {
      throw new Error(`Minting failed: ${error.message}`);
    }
  }
}

/**
 * Get transaction status
 */
export async function getTransactionStatus(txHash: string): Promise<{
  status: 'pending' | 'confirmed' | 'failed';
  confirmations: number;
}> {
  if (!walletState.provider) {
    throw new Error('Wallet not connected');
  }

  const receipt = await walletState.provider.getTransactionReceipt(txHash);
  
  if (!receipt) {
    return { status: 'pending', confirmations: 0 };
  }

  return {
    status: receipt.status === 1 ? 'confirmed' : 'failed',
    confirmations: Number(receipt.confirmations),
  };
}

/**
 * Disconnect wallet
 */
export function disconnectWallet(): void {
  walletState = {
    connected: false,
    account: null,
    provider: null,
    signer: null,
  };
}

// Extend Window interface for TypeScript
declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: any[] }) => Promise<any>;
      on: (event: string, callback: () => void) => void;
      removeListener: (event: string, callback: () => void) => void;
    };
  }
}

