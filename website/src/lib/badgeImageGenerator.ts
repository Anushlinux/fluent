/**
 * Badge Image Generator
 * Generates high-quality badge images using HTML Canvas
 */

import { DomainConfig } from './domain-config';

export interface BadgeImageOptions {
  domainConfig: DomainConfig;
  score?: number;
  nodeCount?: number;
  tokenId?: number | string;
  mintedAt?: string;
  size?: number; // Size in pixels (e.g., 512, 1080, 2048)
  format?: 'square' | 'story' | 'certificate';
  includeQR?: boolean;
  qrData?: string;
}

/**
 * Generate high-resolution PNG/JPG badge image using Canvas
 */
export async function generateBadgeImage(options: BadgeImageOptions): Promise<string> {
  const {
    domainConfig,
    score,
    nodeCount,
    tokenId,
    mintedAt,
    size = 1080,
    format = 'square',
    includeQR = false,
    qrData = ''
  } = options;

  // Create canvas based on format
  let canvasWidth = size;
  let canvasHeight = size;
  
  if (format === 'story') {
    canvasWidth = size;
    canvasHeight = Math.round(size * 1.7778); // 9:16 ratio
  } else if (format === 'certificate') {
    canvasWidth = Math.round(size * 1.4142); // A4 ratio
    canvasHeight = size;
  }

  const canvas = document.createElement('canvas');
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }

  // Set up anti-aliasing
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // Extract RGB from hex color
  const hex = domainConfig.color.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  // Create gradient background
  const gradient = ctx.createLinearGradient(0, 0, canvasWidth, canvasHeight);
  gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.8)`);
  gradient.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, 0.6)`);
  gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0.4)`);

  // Draw background
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  // Add shine effect
  const shineGradient = ctx.createRadialGradient(
    canvasWidth * 0.3, 
    canvasHeight * 0.3, 
    0,
    canvasWidth * 0.3, 
    canvasHeight * 0.3, 
    canvasWidth * 0.5
  );
  shineGradient.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
  shineGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
  
  ctx.fillStyle = shineGradient;
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  // Draw decorative circles
  ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.2)`;
  ctx.beginPath();
  ctx.arc(canvasWidth / 2, canvasHeight / 3, canvasWidth * 0.15, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.3)`;
  ctx.beginPath();
  ctx.arc(canvasWidth / 2, canvasHeight / 3, canvasWidth * 0.1, 0, Math.PI * 2);
  ctx.fill();

  // Map domain icons to emoji
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

  const emoji = iconMap[domainConfig.icon.toLowerCase()] || '🎓';

  // Draw emoji icon
  ctx.font = `${canvasWidth / 4}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = 'white';
  ctx.fillText(emoji, canvasWidth / 2, canvasHeight * 0.35);

  // Draw domain name
  ctx.font = `bold ${canvasWidth / 15}px Arial`;
  ctx.fillText(domainConfig.name, canvasWidth / 2, canvasHeight * 0.55);

  // Draw score if provided
  if (score !== undefined) {
    ctx.font = `${canvasWidth / 20}px Arial`;
    ctx.fillText(`${score}% Score`, canvasWidth / 2, canvasHeight * 0.65);
  }

  // Draw node count if provided
  if (nodeCount !== undefined) {
    ctx.font = `${canvasWidth / 25}px Arial`;
    ctx.fillText(`${nodeCount} nodes`, canvasWidth / 2, canvasHeight * 0.72);
  }

  // Draw token ID if provided
  if (tokenId !== undefined) {
    ctx.font = `${canvasWidth / 30}px Arial`;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.fillText(`#${tokenId}`, canvasWidth / 2, canvasHeight * 0.85);
  }

  // Draw border
  ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, 0.5)`;
  ctx.lineWidth = canvasWidth / 100;
  ctx.strokeRect(0, 0, canvasWidth, canvasHeight);

  // Add QR code if requested
  if (includeQR && qrData) {
    await drawQRCode(ctx, canvasWidth, canvasHeight, qrData, canvasWidth / 8);
  }

  return canvas.toDataURL('image/png', 1.0);
}

/**
 * Draw QR code on canvas
 */
async function drawQRCode(
  ctx: CanvasRenderingContext2D, 
  canvasWidth: number, 
  canvasHeight: number, 
  data: string, 
  size: number
): Promise<void> {
  // Import QR code library dynamically
  const QRCode = (await import('qrcode')).default;
  
  try {
    // Generate QR code data URL
    const qrDataUrl = await QRCode.toDataURL(data, {
      width: size,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    // Draw QR code image
    const img = new Image();
    await new Promise((resolve, reject) => {
      img.onload = () => {
        // Position QR code in bottom-right corner with padding
        const padding = canvasWidth / 20;
        const x = canvasWidth - size - padding;
        const y = canvasHeight - size - padding;
        
        // Draw white background for QR code
        ctx.fillStyle = 'white';
        ctx.fillRect(x - padding / 2, y - padding / 2, size + padding, size + padding);
        
        // Draw QR code
        ctx.drawImage(img, x, y, size, size);
        
        // Add "Scan to view" text
        ctx.fillStyle = '#000000';
        ctx.font = `${size / 8}px Arial`;
        ctx.textAlign = 'center';
        ctx.fillText('Scan to verify', x + size / 2, y + size + size / 6);
        
        resolve(void 0);
      };
      img.onerror = reject;
      img.src = qrDataUrl;
    });
  } catch (error) {
    console.error('[BadgeImageGenerator] Failed to generate QR code:', error);
  }
}

/**
 * Download badge image as file
 */
export async function downloadBadgeImage(
  options: BadgeImageOptions,
  filename?: string
): Promise<void> {
  const imageDataUrl = await generateBadgeImage(options);
  
  // Create download link
  const link = document.createElement('a');
  link.download = filename || `fluent-${options.domainConfig.name.toLowerCase()}-badge.png`;
  link.href = imageDataUrl;
  
  // Trigger download
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Generate certificate format image
 */
export async function generateCertificate(options: BadgeImageOptions): Promise<string> {
  // Use certificate format
  return generateBadgeImage({
    ...options,
    format: 'certificate'
  });
}

/**
 * Download certificate as PDF
 */
export async function downloadCertificatePDF(
  options: BadgeImageOptions,
  filename?: string
): Promise<void> {
  try {
    // Import libraries
    const jsPDF = (await import('jspdf')).default;
    
    // Generate certificate image
    const certificateDataUrl = await generateCertificate(options);
    
    // Load the image
    const img = new Image();
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = certificateDataUrl;
    });

    // Create PDF (A4 format)
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    // Calculate dimensions to fit A4
    const a4Width = 297; // A4 width in mm
    const a4Height = 210; // A4 height in mm
    const imgWidth = a4Width - 20; // With margins
    const imgHeight = (img.height * imgWidth) / img.width;

    // Add image to PDF
    pdf.addImage(certificateDataUrl, 'PNG', 10, 10, imgWidth, imgHeight);
    
    // Save PDF
    pdf.save(filename || `fluent-${options.domainConfig.name.toLowerCase()}-certificate.pdf`);
  } catch (error) {
    console.error('[BadgeImageGenerator] Failed to generate PDF:', error);
    
    // Fallback: download as PNG if PDF generation fails
    await downloadBadgeImage(options, filename?.replace('.pdf', '.png'));
  }
}

/**
 * Generate badge image in multiple sizes
 */
export async function generateMultipleSizes(options: BadgeImageOptions): Promise<Record<string, string>> {
  const sizes = [512, 1080, 2048];
  const results: Record<string, string> = {};
  
  for (const size of sizes) {
    results[`${size}x${size}`] = await generateBadgeImage({ ...options, size });
  }
  
  return results;
}

/**
 * Get cache key for generated images
 */
export function getCacheKey(options: BadgeImageOptions): string {
  return `badge-image-${options.domainConfig.id}-${options.score || 0}-${options.nodeCount || 0}-${options.tokenId || 'none'}`;
}

/**
 * Cache generated image
 */
export function cacheImage(key: string, dataUrl: string): void {
  try {
    localStorage.setItem(key, dataUrl);
  } catch (error) {
    console.warn('[BadgeImageGenerator] Failed to cache image:', error);
  }
}

/**
 * Get cached image
 */
export function getCachedImage(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch (error) {
    return null;
  }
}

