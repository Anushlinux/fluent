import { getBadgeByTokenId } from "@/lib/graphStorage";
import { getDomainConfig } from "@/lib/domain-config";
import { generatePlaceholderImage, getExplorerUrl } from "@/lib/badgeMetadata";
import { BadgeDetailModal } from "@/components/BadgeDetailModal";
import { Badge as BadgeComponent } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Network, Award, ExternalLink, Share2, Download } from "lucide-react";
import { Metadata } from "next";
import Link from "next/link";

interface PageProps {
  params: Promise<{ tokenId: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { tokenId } = await params;
  const badge = await getBadgeByTokenId(tokenId);
  const domainConfig = badge ? getDomainConfig(badge.domain) : null;

  const title = badge && domainConfig
    ? `${domainConfig.name} Mastery Badge #${badge.token_id}`
    : `Badge #${tokenId}`;

  const description = badge && domainConfig
    ? `Achievement badge for ${domainConfig.name} with ${badge.score}% score and ${badge.node_count} knowledge nodes`
    : 'View this mastery badge on Fluent';

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      images: badge ? [generatePlaceholderImage(domainConfig!, badge.score, badge.node_count)] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

export default async function PublicBadgePage({ params }: PageProps) {
  const { tokenId } = await params;
  const badge = await getBadgeByTokenId(tokenId);
  
  if (!badge) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Badge Not Found</h1>
          <p className="text-muted-foreground">This badge does not exist.</p>
        </div>
      </div>
    );
  }

  const domainConfig = getDomainConfig(badge.domain);
  if (!domainConfig) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Domain Not Found</h1>
          <p className="text-muted-foreground">Unable to load badge details.</p>
        </div>
      </div>
    );
  }

  const etherscanUrl = badge.tx_hash ? getExplorerUrl('tx', badge.tx_hash) : null;

  return (
    <div className="min-h-screen bg-background-primary">
      <div className="container mx-auto max-w-4xl px-4 py-12">
        {/* Badge Display */}
        <Card className="overflow-hidden">
          <div 
            className="h-64 flex items-center justify-center"
            style={{
              background: `linear-gradient(135deg, ${domainConfig.color}40, ${domainConfig.color}10)`,
            }}
          >
            <img
              src={generatePlaceholderImage(domainConfig, badge.score, badge.node_count)}
              alt={`${domainConfig.name} Badge`}
              className="w-64 h-64 rounded-3xl shadow-2xl"
            />
          </div>

          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2">
                  {domainConfig.name} Mastery Badge
                </h1>
                <p className="text-muted-foreground">
                  Badge #{badge.token_id}
                </p>
              </div>
              <Button>
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Performance Metrics */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                <div className="flex items-center gap-3 mb-2">
                  <Award className="h-5 w-5 text-primary" />
                  <p className="text-sm font-medium text-muted-foreground">Quiz Score</p>
                </div>
                <p className="text-3xl font-bold text-primary">{badge.score}%</p>
              </div>

              <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                <div className="flex items-center gap-3 mb-2">
                  <Network className="h-5 w-5 text-green-500" />
                  <p className="text-sm font-medium text-muted-foreground">Knowledge Nodes</p>
                </div>
                <p className="text-3xl font-bold text-green-500">{badge.node_count}</p>
              </div>
            </div>

            {/* On-Chain Details */}
            <div>
              <h3 className="font-semibold mb-3">Blockchain Details</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
                  <span className="text-sm font-medium">Token ID</span>
                  <span className="text-sm font-mono">{badge.token_id}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
                  <span className="text-sm font-medium">Network</span>
                  <span className="text-sm">Base Sepolia</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
                  <span className="text-sm font-medium">Standard</span>
                  <span className="text-sm">ERC-721 (Soulbound)</span>
                </div>
                {etherscanUrl && (
                  <Button variant="outline" className="w-full" asChild>
                    <a href={etherscanUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View on Etherscan
                    </a>
                  </Button>
                )}
              </div>
            </div>

            {/* Attributes */}
            <div>
              <h3 className="font-semibold mb-3">Badge Attributes</h3>
              <div className="flex flex-wrap gap-2">
                <BadgeComponent variant="secondary" className="px-3 py-1.5">
                  <span className="font-medium">Domain:</span> {domainConfig.name}
                </BadgeComponent>
                <BadgeComponent variant="secondary" className="px-3 py-1.5">
                  <span className="font-medium">Score:</span> {badge.score}%
                </BadgeComponent>
                <BadgeComponent variant="secondary" className="px-3 py-1.5">
                  <span className="font-medium">Nodes:</span> {badge.node_count}
                </BadgeComponent>
                <BadgeComponent variant="secondary" className="px-3 py-1.5">
                  <span className="font-medium">Minted:</span> {new Date(badge.minted_at).toLocaleDateString()}
                </BadgeComponent>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Call to Action */}
        <div className="mt-8 text-center">
          <h2 className="text-2xl font-bold mb-2">Ready to earn your own badge?</h2>
          <p className="text-muted-foreground mb-4">
            Start learning and capture your knowledge on Fluent
          </p>
          <Button asChild size="lg">
            <Link href="/">Get Started</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

