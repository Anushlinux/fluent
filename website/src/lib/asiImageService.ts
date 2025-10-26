/**
 * ASI Image Service
 * Handles AI-powered badge image generation using ASI:One API via agent
 */

import { DomainConfig } from './domain-config';
import { generatePlaceholderImage } from './badgeMetadata';

interface BadgeImageOptions {
  domain: string;
  score: number;
  nodeCount: number;
  concepts: string[];
  format: 'square' | 'story' | 'certificate' | 'poster' | 'banner';
  domainConfig: DomainConfig;
}

interface BadgeImageResponse {
  image_data: string; // base64 encoded
  prompt_used: string;
  generation_time: number;
  timestamp: number;
}

const AGENT_URL = process.env.NEXT_PUBLIC_AGENT_URL || 'http://localhost:8010';
const TIMEOUT_MS = 30000; // 30 seconds

/**
 * Generate badge image using ASI:One via agent API
 */
export async function generateBadgeWithASI(
  options: BadgeImageOptions
): Promise<string> {
  const { domain, score, nodeCount, concepts, format, domainConfig } = options;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    const response = await fetch(`${AGENT_URL}/generate-badge-image`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        domain,
        score,
        node_count: nodeCount,
        concepts: concepts.slice(0, 5), // Top 5 concepts
        format,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`ASI generation failed: ${response.statusText}`);
    }

    const data: BadgeImageResponse = await response.json();

    // Check if error response
    if (data.image_data.startsWith('Error:')) {
      throw new Error(data.image_data);
    }

    // Convert base64 to data URL
    const dataUrl = `data:image/png;base64,${data.image_data}`;
    
    console.log(`[ASI Image] Generated ${format} badge for ${domain} in ${data.generation_time.toFixed(2)}s`);
    
    return dataUrl;
  } catch (error: any) {
    if (error.name === 'AbortError') {
      console.warn('[ASI Image] Generation timeout, using fallback');
    } else {
      console.warn('[ASI Image] Generation failed, using fallback:', error.message);
    }
    throw error;
  }
}

/**
 * Generate multiple format variations of badge images
 */
export async function generateMultipleFormats(
  options: Omit<BadgeImageOptions, 'format'>
): Promise<Record<string, string>> {
  const formats: Array<'square' | 'story' | 'certificate' | 'poster' | 'banner'> = [
    'square',
    'story',
    'certificate',
    'poster',
    'banner',
  ];

  const results: Record<string, string> = {};

  // Generate all formats in parallel
  const promises = formats.map(async (format) => {
    try {
      const imageData = await generateBadgeWithASI({ ...options, format });
      results[format] = imageData;
    } catch (error) {
      console.warn(`[ASI Image] Failed to generate ${format} format:`, error);
      // Use fallback for failed formats
      results[format] = generatePlaceholderImage(options.domainConfig, options.score, options.nodeCount);
    }
  });

  await Promise.all(promises);

  return results;
}

/**
 * Generate badge with automatic fallback to canvas/SVG generation
 */
export async function generateWithFallback(
  options: BadgeImageOptions
): Promise<string> {
  try {
    return await generateBadgeWithASI(options);
  } catch (error) {
    console.log('[ASI Image] Using fallback canvas generation');
    return generatePlaceholderImage(
      options.domainConfig,
      options.score,
      options.nodeCount
    );
  }
}

/**
 * Check if ASI image generation is available
 */
export async function checkASIImageServiceAvailable(): Promise<boolean> {
  try {
    const response = await fetch(`${AGENT_URL}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000),
    });
    return response.ok;
  } catch (error) {
    console.warn('[ASI Image] Service unavailable:', error);
    return false;
  }
}

