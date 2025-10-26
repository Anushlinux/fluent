/**
 * QR Code Generator
 * Generates QR codes for badge verification with Fluent branding
 */

import QRCode from 'qrcode';

export interface QRCodeOptions {
  data: string;
  size?: number;
  margin?: number;
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
  includeLogo?: boolean;
  backgroundColor?: string;
  foregroundColor?: string;
}

/**
 * Generate QR code as data URL (for inline use)
 */
export async function generateQRCodeDataUrl(options: QRCodeOptions): Promise<string> {
  const {
    data,
    size = 200,
    margin = 2,
    errorCorrectionLevel = 'M',
    backgroundColor = '#FFFFFF',
    foregroundColor = '#000000',
  } = options;

  try {
    const dataUrl = await QRCode.toDataURL(data, {
      width: size,
      margin,
      color: {
        dark: foregroundColor,
        light: backgroundColor,
      },
      errorCorrectionLevel,
    });

    return dataUrl;
  } catch (error) {
    console.error('[QRCodeGenerator] Failed to generate QR code:', error);
    throw new Error('Failed to generate QR code');
  }
}

/**
 * Generate QR code with Fluent logo in center
 */
export async function generateQRCodeWithLogo(options: QRCodeOptions): Promise<string> {
  const {
    data,
    size = 200,
    margin = 2,
    errorCorrectionLevel = 'H', // Use high error correction for logo
  } = options;

  try {
    // Generate base QR code
    const qrDataUrl = await QRCode.toDataURL(data, {
      width: size,
      margin,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
      errorCorrectionLevel,
    });

    // Create canvas to add logo
    const canvas = document.createElement('canvas');
    canvas.width = size + (margin * 2);
    canvas.height = size + (margin * 2);
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      throw new Error('Failed to get canvas context');
    }

    // Draw QR code
    const qrImage = new Image();
    await new Promise((resolve, reject) => {
      qrImage.onload = resolve;
      qrImage.onerror = reject;
      qrImage.src = qrDataUrl;
    });

    ctx.drawImage(qrImage, 0, 0);

    // Add Fluent logo in center
    const logoSize = size / 4;
    const logoX = (size + margin * 2) / 2 - logoSize / 2;
    const logoY = (size + margin * 2) / 2 - logoSize / 2;

    // Draw white background for logo
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(logoX - 2, logoY - 2, logoSize + 4, logoSize + 4);

    // Draw simple F logo
    ctx.fillStyle = '#6366F1'; // Indigo color
    ctx.font = `bold ${logoSize * 0.7}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('F', (size + margin * 2) / 2, (size + margin * 2) / 2);

    return canvas.toDataURL('image/png');
  } catch (error) {
    console.error('[QRCodeGenerator] Failed to generate QR code with logo:', error);
    return generateQRCodeDataUrl(options);
  }
}

/**
 * Generate QR code SVG
 */
export async function generateQRCodeSVG(options: QRCodeOptions): Promise<string> {
  const {
    data,
    size = 200,
    margin = 2,
    errorCorrectionLevel = 'M',
  } = options;

  try {
    const svg = await QRCode.toString(data, {
      type: 'svg',
      width: size,
      margin,
      errorCorrectionLevel,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    });

    return svg;
  } catch (error) {
    console.error('[QRCodeGenerator] Failed to generate QR SVG:', error);
    throw new Error('Failed to generate QR SVG');
  }
}

/**
 * Download QR code as PNG
 */
export async function downloadQRCodePNG(
  options: QRCodeOptions,
  filename?: string
): Promise<void> {
  const dataUrl = await generateQRCodeWithLogo(options);
  
  const link = document.createElement('a');
  link.download = filename || 'fluent-badge-qr.png';
  link.href = dataUrl;
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Generate verification URL for badge
 */
export function generateVerificationUrl(tokenId: number | string, baseUrl?: string): string {
  const base = baseUrl || process.env.NEXT_PUBLIC_APP_URL || 'https://fluent.xyz';
  return `${base}/badge/${tokenId}`;
}

/**
 * Generate embed code for badge
 */
export function generateBadgeEmbedCode(
  tokenId: number | string,
  width: number = 300,
  height: number = 300
): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://fluent.xyz';
  const embedUrl = `${baseUrl}/embed/badge/${tokenId}`;
  
  return `<iframe src="${embedUrl}" width="${width}" height="${height}" frameborder="0" allowtransparency="true"></iframe>`;
}

/**
 * Generate shareable badge URL
 */
export function generateShareableUrl(
  userId: string,
  tokenId: number | string,
  baseUrl?: string
): string {
  const base = baseUrl || process.env.NEXT_PUBLIC_APP_URL || 'https://fluent.xyz';
  return `${base}/badge/${tokenId}`;
}

/**
 * Generate public profile URL
 */
export function generateProfileUrl(
  profileSlug: string,
  baseUrl?: string
): string {
  const base = baseUrl || process.env.NEXT_PUBLIC_APP_URL || 'https://fluent.xyz';
  return `${base}/profile/${profileSlug}`;
}

