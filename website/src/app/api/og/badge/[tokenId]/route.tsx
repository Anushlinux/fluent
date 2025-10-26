import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';
import { getBadgeByTokenId } from '@/lib/graphStorage';
import { getDomainConfig } from '@/lib/domain-config';

// Image metadata
export const alt = 'Fluent Badge';
export const size = {
  width: 1200,
  height: 630,
};

export const contentType = 'image/png';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tokenId: string }> }
) {
  try {
    const { tokenId } = await params;
    const badge = await getBadgeByTokenId(tokenId);
    
    if (!badge) {
      return new Response('Badge not found', { status: 404 });
    }

    const domainConfig = getDomainConfig(badge.domain);
    if (!domainConfig) {
      return new Response('Domain not found', { status: 404 });
    }

    // Extract RGB from hex color
    const hex = domainConfig.color.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    // Icon emoji mapping
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

    return new ImageResponse(
      (
        <div
          style={{
            background: `linear-gradient(135deg, rgb(${r}, ${g}, ${b}) 0%, rgb(${r}, ${g}, ${b}, 0.6) 100%)`,
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyCenter: 'center',
            position: 'relative',
          }}
        >
          {/* Shine effect */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              background: 'radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.3) 0%, transparent 70%)',
            }}
          />

          {/* Main content */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '60px',
            }}
          >
            {/* Badge icon */}
            <div
              style={{
                fontSize: '120px',
                marginBottom: '20px',
              }}
            >
              {emoji}
            </div>

            {/* Badge title */}
            <div
              style={{
                fontSize: '56px',
                fontWeight: 'bold',
                color: 'white',
                marginBottom: '20px',
                textAlign: 'center',
              }}
            >
              {domainConfig.name} Mastery Badge
            </div>

            {/* Badge details */}
            <div
              style={{
                display: 'flex',
                gap: '40px',
                fontSize: '32px',
                color: 'rgba(255, 255, 255, 0.9)',
              }}
            >
              <span>Score: {badge.score}%</span>
              <span>•</span>
              <span>{badge.node_count} Nodes</span>
              <span>•</span>
              <span>#{badge.token_id}</span>
            </div>
          </div>

          {/* Bottom text */}
          <div
            style={{
              position: 'absolute',
              bottom: '40px',
              left: 0,
              right: 0,
              textAlign: 'center',
              fontSize: '24px',
              color: 'rgba(255, 255, 255, 0.8)',
            }}
          >
            fluent.xyz • Proof of Mastery
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (error) {
    console.error('[OG Image] Error generating image:', error);
    return new Response('Failed to generate image', { status: 500 });
  }
}

