/**
 * Image Pre-generation Service
 * Pre-generates and caches badge images for better UX during minting
 */

const CACHE_PREFIX = 'badge-images-v1';
const MAX_CACHE_SIZE = 50 * 1024 * 1024; // 50MB

interface CachedImage {
  dataUrl: string;
  timestamp: number;
  format: string;
}

interface CacheMetadata {
  userId: string;
  domain: string;
  score: number;
  totalQuestions: number;
  timestamp: number;
}

/**
 * Get cache key for badge images
 */
function getCacheKey(userId: string, domain: string, format: string): string {
  return `${CACHE_PREFIX}:${userId}:${domain}:${format}`;
}

/**
 * Get metadata cache key
 */
function getMetadataKey(userId: string, domain: string): string {
  return `${CACHE_PREFIX}:metadata:${userId}:${domain}`;
}

/**
 * Pre-generate badge images for all formats and cache them
 */
export async function preGenerateBadgeImages(
  userId: string,
  domain: string,
  score: number,
  totalQuestions: number
): Promise<void> {
  // This function will be called from domain-graph-viewer.tsx
  // The actual generation will be handled there
  console.log(`[Image Pre-gen] Pre-generating images for ${domain}`);
  
  // Store metadata about what's being generated
  const metadata: CacheMetadata = {
    userId,
    domain,
    score,
    totalQuestions,
    timestamp: Date.now(),
  };

  try {
    localStorage.setItem(getMetadataKey(userId, domain), JSON.stringify(metadata));
  } catch (error) {
    console.warn('[Image Pre-gen] Failed to store metadata:', error);
  }
}

/**
 * Store generated image in cache
 */
export function cacheBadgeImage(
  userId: string,
  domain: string,
  format: string,
  dataUrl: string
): void {
  try {
    const cacheKey = getCacheKey(userId, domain, format);
    const cached: CachedImage = {
      dataUrl,
      timestamp: Date.now(),
      format,
    };

    localStorage.setItem(cacheKey, JSON.stringify(cached));
    console.log(`[Image Pre-gen] Cached ${format} image for ${domain}`);
  } catch (error) {
    console.warn('[Image Pre-gen] Failed to cache image:', error);
    // Try to clear old cache if storage is full
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      clearOldCachedImages();
    }
  }
}

/**
 * Retrieve cached badge image
 */
export async function getCachedBadgeImage(
  userId: string,
  domain: string,
  format: string
): Promise<string | null> {
  try {
    const cacheKey = getCacheKey(userId, domain, format);
    const cached = localStorage.getItem(cacheKey);

    if (!cached) {
      return null;
    }

    const data: CachedImage = JSON.parse(cached);

    // Check if cache is stale (older than 24 hours)
    const isStale = Date.now() - data.timestamp > 24 * 60 * 60 * 1000;

    if (isStale) {
      console.log(`[Image Pre-gen] Cache stale for ${format}, removing`);
      localStorage.removeItem(cacheKey);
      return null;
    }

    return data.dataUrl;
  } catch (error) {
    console.warn('[Image Pre-gen] Failed to retrieve cached image:', error);
    return null;
  }
}

/**
 * Check if cached images exist for a domain
 */
export function hasCachedImages(userId: string, domain: string): boolean {
  const formats = ['square', 'story', 'certificate', 'poster', 'banner'];

  for (const format of formats) {
    const cached = getCachedBadgeImage(userId, domain, format);
    if (cached !== null) {
      return true;
    }
  }

  return false;
}

/**
 * Get metadata for cached images
 */
export function getCacheMetadata(
  userId: string,
  domain: string
): CacheMetadata | null {
  try {
    const metadataKey = getMetadataKey(userId, domain);
    const metadata = localStorage.getItem(metadataKey);

    if (!metadata) {
      return null;
    }

    return JSON.parse(metadata) as CacheMetadata;
  } catch (error) {
    console.warn('[Image Pre-gen] Failed to get metadata:', error);
    return null;
  }
}

/**
 * Clear all cached images for a specific domain
 */
export async function clearCachedImages(userId: string, domain: string): Promise<void> {
  const formats = ['square', 'story', 'certificate', 'poster', 'banner'];

  for (const format of formats) {
    try {
      localStorage.removeItem(getCacheKey(userId, domain, format));
    } catch (error) {
      console.warn('[Image Pre-gen] Failed to clear cached image:', error);
    }
  }

  // Clear metadata
  try {
    localStorage.removeItem(getMetadataKey(userId, domain));
  } catch (error) {
    console.warn('[Image Pre-gen] Failed to clear metadata:', error);
  }

  console.log(`[Image Pre-gen] Cleared cache for ${domain}`);
}

/**
 * Clear old cached images to free up space
 */
function clearOldCachedImages(): void {
  try {
    const keys = Object.keys(localStorage);
    const oldKeys: string[] = [];

    for (const key of keys) {
      if (key.startsWith(CACHE_PREFIX) && key.includes(':cache:')) {
        try {
          const data = JSON.parse(localStorage.getItem(key) || '');
          // Remove images older than 7 days
          if (Date.now() - data.timestamp > 7 * 24 * 60 * 60 * 1000) {
            oldKeys.push(key);
          }
        } catch {
          // If we can't parse, it's probably corrupted, remove it
          oldKeys.push(key);
        }
      }
    }

    for (const key of oldKeys) {
      localStorage.removeItem(key);
    }

    if (oldKeys.length > 0) {
      console.log(`[Image Pre-gen] Cleared ${oldKeys.length} old cached images`);
    }
  } catch (error) {
    console.error('[Image Pre-gen] Failed to clear old images:', error);
  }
}

/**
 * Get estimated cache size
 */
export function getEstimatedCacheSize(): number {
  let totalSize = 0;

  try {
    const keys = Object.keys(localStorage);

    for (const key of keys) {
      if (key.startsWith(CACHE_PREFIX)) {
        const value = localStorage.getItem(key);
        if (value) {
          // Rough estimate: string length * 2 bytes per char for base64
          totalSize += value.length * 2;
        }
      }
    }
  } catch (error) {
    console.warn('[Image Pre-gen] Failed to estimate cache size:', error);
  }

  return totalSize;
}

