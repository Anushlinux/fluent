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
export function generatePlaceholderImage(domainConfig: DomainConfig): string {
  // For now, return a data URI with domain-specific icon
  // In the future, this can be canvas-generated or pulled from an S3 bucket
  
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
  };

  const emoji = iconMap[iconName] || '🎓';
  
  // Create a simple SVG data URI
  const svg = `
    <svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${domainConfig.color}80;stop-opacity:1" />
          <stop offset="100%" style="stop-color:${domainConfig.color}40;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="512" height="512" rx="64" fill="url(#grad)"/>
      <text x="256" y="280" font-size="200" text-anchor="middle" font-family="Arial">${emoji}</text>
      <text x="256" y="380" font-size="48" text-anchor="middle" fill="white" font-weight="bold">${domainConfig.name}</text>
    </svg>
  `.trim();

  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

/**
 * Format metadata as JSON string
 */
export function formatMetadataAsJSON(metadata: BadgeMetadata): string {
  return JSON.stringify(metadata, null, 2);
}

