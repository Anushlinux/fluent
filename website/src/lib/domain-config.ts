import { 
  Building2,  // DeFi
  Users,       // DAO
  Image,       // NFT
  Layers,      // L2
  Brain,       // AI
  Server,      // Infrastructure
  Code,        // Development
  Shield,      // Security
  Key,         // ERC-4337
  Globe,       // General
  LucideIcon 
} from 'lucide-react';

export interface DomainConfig {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  keywords: string[];
}

export const domainConfigs: DomainConfig[] = [
  {
    id: 'DeFi',
    name: 'DeFi',
    description: 'Decentralized finance protocols, DEXs, lending platforms, and yield farming',
    icon: 'Building2',
    color: '#3b82f6',
    keywords: ['defi', 'decentralized finance', 'yield farming', 'liquidity pool', 'dex', 'amm', 'uniswap', 'aave', 'compound']
  },
  {
    id: 'DAO',
    name: 'DAO',
    description: 'Decentralized autonomous organizations, governance tokens, and voting mechanisms',
    icon: 'Users',
    color: '#8b5cf6',
    keywords: ['dao', 'governance', 'voting', 'proposal', 'token holder']
  },
  {
    id: 'NFT',
    name: 'NFT',
    description: 'Non-fungible tokens, digital collectibles, art, and digital ownership',
    icon: 'Image',
    color: '#ec4899',
    keywords: ['nft', 'non-fungible token', 'digital art', 'collectible', 'erc-721', 'opensea']
  },
  {
    id: 'L2',
    name: 'Layer 2',
    description: 'Scaling solutions, rollups, sidechains, and layer 2 protocols',
    icon: 'Layers',
    color: '#f59e0b',
    keywords: ['layer 2', 'rollup', 'sidechain', 'optimism', 'arbitrum', 'polygon', 'scaling']
  },
  {
    id: 'AI',
    name: 'AI',
    description: 'Artificial intelligence, machine learning, LLMs, and AI-powered Web3 applications',
    icon: 'Brain',
    color: '#10b981',
    keywords: ['ai', 'artificial intelligence', 'machine learning', 'llm', 'neural network', 'deep learning']
  },
  {
    id: 'Infrastructure',
    name: 'Infrastructure',
    description: 'Validators, nodes, consensus mechanisms, and blockchain infrastructure',
    icon: 'Server',
    color: '#6366f1',
    keywords: ['node', 'validator', 'consensus', 'mining', 'staking', 'proof of stake', 'proof of work']
  },
  {
    id: 'Development',
    name: 'Development',
    description: 'Smart contracts, dApps, Web3 development, and programming',
    icon: 'Code',
    color: '#ef4444',
    keywords: ['smart contract', 'solidity', 'web3', 'dapp', 'erc-20', 'hardhat', 'truffle']
  },
  {
    id: 'Security',
    name: 'Security',
    description: 'Security audits, vulnerabilities, exploits, and blockchain security practices',
    icon: 'Shield',
    color: '#14b8a6',
    keywords: ['audit', 'vulnerability', 'exploit', 'security', 'oracle', 'reentrancy']
  },
  {
    id: 'ERC-4337',
    name: 'ERC-4337',
    description: 'Account abstraction, user operations, paymasters, and entry points',
    icon: 'Key',
    color: '#f97316',
    keywords: ['erc-4337', 'account abstraction', 'bundler', 'paymaster', 'user operation']
  },
  {
    id: 'General',
    name: 'General',
    description: 'General Web3 concepts, blockchain fundamentals, and general topics',
    icon: 'Globe',
    color: '#6b7280',
    keywords: ['blockchain', 'web3', 'general', 'crypto', 'token', 'wallet']
  }
];

export const getDomainConfig = (id: string): DomainConfig | undefined => {
  return domainConfigs.find(d => d.id.toLowerCase() === id.toLowerCase());
};

export const getDomainConfigByContext = (context: string): DomainConfig | undefined => {
  return domainConfigs.find(d => 
    d.id.toLowerCase() === context.toLowerCase() || 
    d.name.toLowerCase() === context.toLowerCase()
  );
};

export const getAllDomainIds = (): string[] => {
  return domainConfigs.map(d => d.id.toLowerCase());
};

export const iconMap: Record<string, LucideIcon> = {
  Building2,
  Users,
  Image,
  Layers,
  Brain,
  Server,
  Code,
  Shield,
  Key,
  Globe,
};

export const getDomainIcon = (iconName: string): LucideIcon => {
  return iconMap[iconName] || Globe;
};

