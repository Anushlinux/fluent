/**
 * Share Service
 * Handles sharing badges to social media platforms and tracking analytics
 */

import { getSupabaseBrowserClient } from './supabase';
import { BadgeData } from './graphStorage';
import { DomainConfig } from './domain-config';

export type SharePlatform = 'twitter' | 'linkedin' | 'discord' | 'telegram' | 'email' | 'link' | 'embed';

export interface ShareOptions {
  badge: BadgeData;
  domainConfig: DomainConfig;
  platform: SharePlatform;
  message?: string;
}

export interface ShareStats {
  totalShares: number;
  sharesByPlatform: Record<string, number>;
  totalViews: number;
  recentShares: Array<{
    platform: string;
    timestamp: string;
  }>;
}

/**
 * Track share event in database
 */
export async function trackShare(
  badgeId: string,
  platform: SharePlatform
): Promise<void> {
  try {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      console.warn('[ShareService] Supabase not configured');
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.warn('[ShareService] User not authenticated');
      return;
    }

    await supabase.from('badge_shares').insert({
      badge_id: badgeId,
      user_id: user.id,
      platform,
    });

    console.log(`[ShareService] Tracked share to ${platform}`);
  } catch (error) {
    console.error('[ShareService] Failed to track share:', error);
  }
}

/**
 * Track badge view
 */
export async function trackView(badgeId: string): Promise<void> {
  try {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id || null;

    // Get IP address (if available)
    const ipAddress = await fetch('https://api.ipify.org?format=json')
      .then(res => res.json())
      .then(data => data.ip)
      .catch(() => null);

    await supabase.from('badge_views').insert({
      badge_id: badgeId,
      user_id: userId,
      ip_address: ipAddress,
      user_agent: navigator.userAgent,
    });
  } catch (error) {
    console.error('[ShareService] Failed to track view:', error);
  }
}

/**
 * Get share statistics for a badge
 */
export async function getBadgeShareStats(badgeId: string): Promise<ShareStats> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) {
    return {
      totalShares: 0,
      sharesByPlatform: {},
      totalViews: 0,
      recentShares: [],
    };
  }

  try {
    // Get shares
    const { data: shares } = await supabase
      .from('badge_shares')
      .select('platform, shared_at')
      .eq('badge_id', badgeId)
      .order('shared_at', { ascending: false });

    // Get views
    const { data: views } = await supabase
      .from('badge_views')
      .select('id')
      .eq('badge_id', badgeId);

    // Calculate stats
    const sharesByPlatform: Record<string, number> = {};
    (shares || []).forEach(share => {
      sharesByPlatform[share.platform] = (sharesByPlatform[share.platform] || 0) + 1;
    });

    return {
      totalShares: shares?.length || 0,
      sharesByPlatform,
      totalViews: views?.length || 0,
      recentShares: (shares || []).slice(0, 10).map(s => ({
        platform: s.platform,
        timestamp: s.shared_at,
      })),
    };
  } catch (error) {
    console.error('[ShareService] Failed to get share stats:', error);
    return {
      totalShares: 0,
      sharesByPlatform: {},
      totalViews: 0,
      recentShares: [],
    };
  }
}

/**
 * Share to Twitter/X
 */
export function shareToTwitter(options: ShareOptions): string {
  const { badge, domainConfig, message } = options;
  
  const text = message || `Just earned my ${domainConfig.name} mastery badge on @fluent! 🎓\n\nScore: ${badge.score}%\nNodes: ${badge.node_count}\n\nView my badge:`;
  const url = generateShareableUrl(badge.id, badge.token_id.toString());
  
  // Twitter share URL
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
  
  // Track share
  trackShare(badge.id, 'twitter');
  
  return twitterUrl;
}

/**
 * Share to LinkedIn
 */
export function shareToLinkedIn(options: ShareOptions): string {
  const { badge, domainConfig, message } = options;
  
  const title = `Fluent ${domainConfig.name} Badge`;
  const summary = message || `Just earned my ${domainConfig.name} mastery badge on Fluent! Score: ${badge.score}%, ${badge.node_count} knowledge nodes.`;
  const url = generateShareableUrl(badge.id, badge.token_id.toString());
  
  // LinkedIn share URL
  const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}&summary=${encodeURIComponent(summary)}`;
  
  // Track share
  trackShare(badge.id, 'linkedin');
  
  return linkedInUrl;
}

/**
 * Copy badge link to clipboard
 */
export async function copyShareLink(badgeId: string, tokenId: string | number): Promise<void> {
  const url = generateShareableUrl(badgeId, tokenId.toString());
  
  try {
    await navigator.clipboard.writeText(url);
    
    // Track share
    trackShare(badgeId, 'link');
  } catch (error) {
    console.error('[ShareService] Failed to copy link:', error);
    throw new Error('Failed to copy link to clipboard');
  }
}

/**
 * Copy embed code to clipboard
 */
export async function copyEmbedCode(badgeId: string, tokenId: string | number): Promise<void> {
  const embedCode = generateEmbedCode(badgeId, tokenId.toString());
  
  try {
    await navigator.clipboard.writeText(embedCode);
  } catch (error) {
    console.error('[ShareService] Failed to copy embed code:', error);
    throw new Error('Failed to copy embed code to clipboard');
  }
}

/**
 * Generate shareable badge URL
 */
export function generateShareableUrl(badgeId: string, tokenId: string | number, baseUrl?: string): string {
  const base = baseUrl || process.env.NEXT_PUBLIC_APP_URL || 'https://fluent.xyz';
  return `${base}/badge/${tokenId}`;
}

/**
 * Generate embed code for badge
 */
export function generateEmbedCode(badgeId: string, tokenId: string, width: number = 300, height: number = 300): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://fluent.xyz';
  const embedUrl = `${baseUrl}/embed/badge/${tokenId}`;
  
  return `<iframe src="${embedUrl}" width="${width}" height="${height}" frameborder="0" allowtransparency="true"></iframe>`;
}

/**
 * Generate email share link
 */
export function shareViaEmail(options: ShareOptions): string {
  const { badge, domainConfig, message } = options;
  
  const subject = `Check out my ${domainConfig.name} mastery badge!`;
  const body = message || `I just earned my ${domainConfig.name} mastery badge on Fluent!\n\nScore: ${badge.score}%\nKnowledge Nodes: ${badge.node_count}\n\nView my badge: ${generateShareableUrl(badge.id, badge.token_id.toString())}`;
  
  const mailtoUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  
  // Track share
  trackShare(badge.id, 'email');
  
  return mailtoUrl;
}

/**
 * Share to Discord via webhook
 */
export async function shareToDiscord(options: ShareOptions): Promise<void> {
  const { badge, domainConfig } = options;
  
  const webhookUrl = process.env.NEXT_PUBLIC_DISCORD_WEBHOOK_URL;
  if (!webhookUrl) {
    console.warn('[ShareService] Discord webhook URL not configured');
    return;
  }

  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        embeds: [
          {
            title: `Fluent ${domainConfig.name} Badge`,
            description: `Just earned my ${domainConfig.name} mastery badge!`,
            fields: [
              { name: 'Score', value: `${badge.score}%`, inline: true },
              { name: 'Knowledge Nodes', value: `${badge.node_count}`, inline: true },
            ],
            url: generateShareableUrl(badge.id, badge.token_id.toString()),
            timestamp: new Date().toISOString(),
            color: parseInt(domainConfig.color.replace('#', ''), 16),
          },
        ],
      }),
    });

    // Track share
    trackShare(badge.id, 'discord');
  } catch (error) {
    console.error('[ShareService] Failed to share to Discord:', error);
  }
}

/**
 * Share to Telegram
 */
export function shareToTelegram(options: ShareOptions): string {
  const { badge, domainConfig, message } = options;
  
  const text = message || `Just earned my ${domainConfig.name} mastery badge on Fluent! Score: ${badge.score}%, ${badge.node_count} knowledge nodes.`;
  const url = generateShareableUrl(badge.id, badge.token_id.toString());
  
  const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
  
  // Track share
  trackShare(badge.id, 'telegram');
  
  return telegramUrl;
}

/**
 * Toggle badge privacy (public/private)
 */
export async function toggleBadgePrivacy(badgeId: string, isPublic: boolean): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) {
    throw new Error('Supabase not configured');
  }

  const { error } = await supabase
    .from('owned_nfts')
    .update({ is_public: isPublic })
    .eq('id', badgeId);

  if (error) {
    console.error('[ShareService] Failed to toggle badge privacy:', error);
    throw new Error('Failed to toggle badge privacy');
  }
}

/**
 * Get public profile URL for user
 */
export async function getPublicProfileUrl(userId: string): Promise<string> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) {
    return '';
  }

  const { data } = await supabase
    .from('profiles')
    .select('profile_slug')
    .eq('id', userId)
    .single();

  if (!data?.profile_slug) {
    return '';
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://fluent.xyz';
  return `${baseUrl}/profile/${data.profile_slug}`;
}

