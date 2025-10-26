/**
 * Badge Metadata Generation
 * Creates NFT metadata and handles Pinata IPFS uploads
 */

import { getSupabaseBrowserClient } from './supabase';
import { DomainConfig } from './domain-config';
import axios from 'axios';

export interface BadgeMetadata {
  name: string;
  description: string;
  image: string;
  attributes: Array<{
    trait_type: string;
    value: string | number;
  }>;
  subgraph: {
    sentences: string[];
    edges: any[];
  };
  external_url: string;
}

/**
 * Generate badge metadata for a domain
 */
export async function generateBadgeMetadata(
  domain: string,
  score: number,
  userId: string,
  domainConfig: DomainConfig
): Promise<BadgeMetadata> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) {
    throw new Error('Supabase not configured');
  }

  // Get user's graph data for this domain
  const { data: nodes, error: nodesError } = await supabase
    .from('graph_nodes')
    .select('id, label, terms, context')
    .eq('user_id', userId)
    .eq('context', domain);

  if (nodesError) {
    throw new Error(`Failed to fetch nodes: ${nodesError.message}`);
  }

  const { data: edges, error: edgesError } = await supabase
    .from('graph_edges')
    .select('source_id, target_id, weight, type')
    .eq('user_id', userId);

  if (edgesError) {
    throw new Error(`Failed to fetch edges: ${edgesError.message}`);
  }

  // Get domain-specific edges
  const domainNodes = nodes?.map(n => n.id) || [];
  const domainEdges = edges?.filter(e => 
    domainNodes.includes(e.source_id) && domainNodes.includes(e.target_id)
  ) || [];

  // Get captured sentences for this domain
  const { data: sentences, error: sentencesError } = await supabase
    .from('captured_sentences')
    .select('sentence, terms, confidence')
    .eq('user_id', userId)
    .eq('context', domain)
    .order('timestamp', { ascending: false })
    .limit(3);

  if (sentencesError) {
    throw new Error(`Failed to fetch sentences: ${sentencesError.message}`);
  }

  // Count inferences (edges with high weight)
  const inferencesCount = domainEdges.filter(e => e.weight > 0.7).length;
  const nodeCount = nodes?.length || 0;

  // Get next token ID (mock for now, real ID comes from blockchain)
  const tokenId = Math.floor(Math.random() * 10000) + 1; // TODO: Get from contract

  const metadata: BadgeMetadata = {
    name: `Fluent ${domainConfig.name} Badge #${tokenId}`,
    description: `Mastered ${nodeCount} concepts with ${Math.round(score)}% quiz accuracy on ${domainConfig.name} domain`,
    image: generatePlaceholderImage(domainConfig),
    attributes: [
      {
        trait_type: 'Domain',
        value: domainConfig.name,
      },
      {
        trait_type: 'Score',
        value: Math.round(score),
      },
      {
        trait_type: 'Nodes',
        value: nodeCount,
      },
      {
        trait_type: 'Inferences',
        value: inferencesCount,
      },
      {
        trait_type: 'Minted',
        value: new Date().toISOString().split('T')[0],
      },
    ],
    subgraph: {
      sentences: (sentences || []).map(s => s.sentence),
      edges: domainEdges.map(e => ({
        source: e.source_id,
        target: e.target_id,
        weight: e.weight,
        type: e.type,
      })),
    },
    external_url: `${process.env.NEXT_PUBLIC_WEBSITE_URL || 'https://fluent.xyz'}/badges/${tokenId}`,
  };

  return metadata;
}

/**
 * Upload metadata to Pinata IPFS
 */
export async function uploadToPinata(metadata: BadgeMetadata): Promise<string> {
  const pinataApiKey = process.env.NEXT_PUBLIC_PINATA_API_KEY;
  const pinataSecretKey = process.env.NEXT_PUBLIC_PINATA_SECRET_KEY;

  if (!pinataApiKey || !pinataSecretKey) {
    throw new Error('Pinata API keys not configured');
  }

  let attempts = 0;
  const maxAttempts = 3;

  while (attempts < maxAttempts) {
    try {
      const response = await axios.post(
        'https://api.pinata.cloud/pinning/pinJSONToIPFS',
        {
          pinataContent: metadata,
          pinataMetadata: {
            name: `fluent-badge-${metadata.name}`,
          },
        },
        {
          headers: {
            'Content-Type': 'application/json',
            pinata_api_key: pinataApiKey,
            pinata_secret_api_key: pinataSecretKey,
          },
        }
      );

      const ipfsHash = response.data.IpfsHash;
      console.log('[Pinata] Uploaded metadata to IPFS:', ipfsHash);
      return `ipfs://${ipfsHash}`;
    } catch (error: any) {
      attempts++;
      console.error(`[Pinata] Upload attempt ${attempts} failed:`, error.message);

      if (attempts >= maxAttempts) {
        throw new Error(`Failed to upload to Pinata after ${maxAttempts} attempts: ${error.message}`);
      }

      // Wait before retry (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
    }
  }

  throw new Error('Upload to Pinata failed');
}

/**
 * Generate placeholder badge image
 */
export function generatePlaceholderImage(domainConfig: DomainConfig, score?: number, nodeCount?: number): string {
  const iconName = domainConfig.icon.toLowerCase();
  
  // Map domain icons to emoji (for placeholder)
  const iconMap: Record<string, string> = {
    'building2': '🏦',
    'users': '👥',
    'image': '🎨',
    'layers': '⛓️',
    'brain': '🧠',
    'server': '🖥️',
    'code': '💻',
    'shield': '🛡️',
    'key': '🔑',
    'globe': '🌐',
    'database': '💾',
    'network': '🌐',
    'lock': '🔒',
    'wallet': '💰',
    'chart': '📊',
    'rocket': '🚀',
  };

  const emoji = iconMap[iconName] || '🎓';
  
  // Extract RGB from hex color
  const hex = domainConfig.color.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  // Create a more sophisticated SVG badge with gradient and details
  const svg = `
    <svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${domainConfig.color}CC;stop-opacity:1" />
          <stop offset="50%" style="stop-color:${domainConfig.color}99;stop-opacity:1" />
          <stop offset="100%" style="stop-color:${domainConfig.color}66;stop-opacity:1" />
        </linearGradient>
        <radialGradient id="shine" cx="30%" cy="30%">
          <stop offset="0%" style="stop-color:#FFFFFF60;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#FFFFFF00;stop-opacity:1" />
        </radialGradient>
        <filter id="shadow">
          <feDropShadow dx="0" dy="8" stdDeviation="16" flood-color="${domainConfig.color}40"/>
        </filter>
      </defs>
      <!-- Background -->
      <rect width="512" height="512" rx="72" fill="url(#grad)" filter="url(#shadow)"/>
      
      <!-- Shine effect -->
      <rect width="512" height="512" rx="72" fill="url(#shine)" opacity="0.6"/>
      
      <!-- Decorative circle -->
      <circle cx="256" cy="150" r="80" fill="${domainConfig.color}40" opacity="0.3"/>
      <circle cx="256" cy="150" r="60" fill="${domainConfig.color}60" opacity="0.5"/>
      
      <!-- Icon emoji -->
      <text x="256" y="200" font-size="160" text-anchor="middle" font-family="system-ui, -apple-system">${emoji}</text>
      
      <!-- Domain name -->
      <text x="256" y="320" font-size="40" text-anchor="middle" fill="white" font-weight="bold" font-family="system-ui, -apple-system">${domainConfig.name}</text>
      
      ${score !== undefined ? `
      <!-- Score -->
      <text x="256" y="370" font-size="32" text-anchor="middle" fill="white" font-family="system-ui, -apple-system">${score}% Score</text>
      ` : ''}
      
      ${nodeCount !== undefined ? `
      <!-- Node count -->
      <text x="256" y="410" font-size="24" text-anchor="middle" fill="white" opacity="0.8" font-family="system-ui, -apple-system">${nodeCount} nodes</text>
      ` : ''}
      
      <!-- Border glow -->
      <rect width="512" height="512" rx="72" fill="none" stroke="${domainConfig.color}80" stroke-width="4" opacity="0.6"/>
    </svg>
  `.trim().replace(/\s+/g, ' ');

  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

/**
 * Format metadata as JSON string
 */
export function formatMetadataAsJSON(metadata: BadgeMetadata): string {
  return JSON.stringify(metadata, null, 2);
}

/**
 * Format address for display: 0x1234...5678
 */
export function formatAddress(address: string): string {
  if (!address || address.length < 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * Format transaction hash for display
 */
export function formatTxHash(hash: string): string {
  if (!hash || hash.length < 20) return hash;
  return `${hash.slice(0, 10)}...${hash.slice(-8)}`;
}

/**
 * Copy text to clipboard
 */
export function copyToClipboard(text: string): Promise<void> {
  if (navigator.clipboard && window.isSecureContext) {
    return navigator.clipboard.writeText(text);
  }
  // Fallback for older browsers
  const textArea = document.createElement('textarea');
  textArea.value = text;
  textArea.style.position = 'fixed';
  textArea.style.left = '-999999px';
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  return new Promise((resolve, reject) => {
    if (document.execCommand('copy')) {
      resolve();
    } else {
      reject(new Error('Copy failed'));
    }
    document.body.removeChild(textArea);
  });
}

/**
 * Get block explorer URL
 */
export function getExplorerUrl(type: 'tx' | 'address', value: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_ETHERSCAN_BASE_URL || 'https://sepolia.basescan.org';
  if (type === 'tx') {
    return `${baseUrl}/tx/${value}`;
  }
  return `${baseUrl}/address/${value}`;
}

