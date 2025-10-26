"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getDomainConfig, getDomainIcon } from "@/lib/domain-config";
import { generatePlaceholderImage, formatAddress, formatTxHash, copyToClipboard, getExplorerUrl } from "@/lib/badgeMetadata";
import { Trophy, ExternalLink, Calendar, Award, Network, Copy, Check, Zap, Share2, Download } from "lucide-react";
import type { BadgeData } from "@/lib/graphStorage";
import { GlowingEffect } from "@/components/ui/glowing-effect";
import { useRouter } from "next/navigation";

interface BadgeDetailModalProps {
  badge: BadgeData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BadgeDetailModal({ badge, open, onOpenChange }: BadgeDetailModalProps) {
  const [metadata, setMetadata] = useState<any>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (!badge) return;

    const loadMetadata = async () => {
      try {
        const domainConfig = getDomainConfig(badge.domain);
        if (!domainConfig) return;

        const placeholderMetadata = {
          name: `Fluent ${domainConfig.name} Badge #${badge.token_id}`,
          description: `Mastery badge for ${domainConfig.name} with ${badge.node_count} knowledge nodes and ${badge.score}% quiz score. This badge represents your achievement and dedication to learning about ${domainConfig.name}.`,
          image: generatePlaceholderImage(domainConfig, badge.score, badge.node_count),
          attributes: [
            { trait_type: "Domain", value: domainConfig.name },
            { trait_type: "Score", value: badge.score },
            { trait_type: "Nodes", value: badge.node_count },
            { trait_type: "Minted", value: new Date(badge.minted_at).toLocaleDateString() }
          ]
        };

        setMetadata(placeholderMetadata);
      } catch (error) {
        console.error("[BadgeDetailModal] Failed to load metadata:", error);
      }
    };

    loadMetadata();
  }, [badge]);

  if (!badge || !metadata) return null;

  const domainConfig = getDomainConfig(badge.domain);
  if (!domainConfig) return null;

  const IconComponent = getDomainIcon(domainConfig.icon);
  const etherscanUrl = badge.tx_hash 
    ? getExplorerUrl('tx', badge.tx_hash)
    : null;
  const contractAddress = process.env.NEXT_PUBLIC_BADGE_CONTRACT_ADDRESS || 'Not deployed';
  
  const handleCopy = async (text: string, label: string) => {
    try {
      await copyToClipboard(text);
      setCopied(label);
      setTimeout(() => setCopied(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleViewDomain = () => {
    onOpenChange(false);
    router.push(`/knowledge/domain/${badge.domain}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-[70vw] !w-[70vw] max-h-[90vh] overflow-hidden rounded-3xl">
        <div className="flex flex-col max-h-[88vh] overflow-y-auto px-6 py-6">
          {/* Hero Section */}
          <div className="relative mb-8 h-64 overflow-hidden rounded-3xl">
            <div 
              className="absolute inset-0 flex items-center justify-center"
              style={{
                background: `linear-gradient(135deg, ${domainConfig.color}40, ${domainConfig.color}10)`,
              }}
            >
              <div className="relative w-64 h-64 rounded-3xl overflow-hidden shadow-2xl">
                <GlowingEffect disabled={false} glow={true} spread={30} proximity={100} />
                <div className="relative w-full h-full rounded-3xl overflow-hidden z-10">
                  <img
                    src={metadata.image}
                    alt={metadata.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>
          
          {/* Domain Badge */}
          <div className="absolute bottom-4 left-4">
            <div className="flex items-center gap-3">
              <div 
                className="p-3 rounded-xl"
                style={{ backgroundColor: domainConfig.color }}
              >
                <IconComponent className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-foreground-primary">{domainConfig.name}</h3>
                <p className="text-sm text-foreground-secondary">Badge #{badge.token_id}</p>
              </div>
            </div>
          </div>

          {/* Minted Date Badge */}
          <div className="absolute top-4 right-4">
            <Badge className="bg-white/90 backdrop-blur-sm text-foreground-primary px-3 py-1">
              <Calendar className="h-3 w-3 mr-1" />
              {new Date(badge.minted_at).toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric',
                year: 'numeric'
              })}
            </Badge>
          </div>
        </div>

        <DialogHeader className="pb-4 text-center sm:text-left">
          <DialogTitle className="flex items-center justify-center sm:justify-start gap-2 text-2xl">
            <Trophy className="h-7 w-7 text-yellow-400" />
            {metadata.name}
          </DialogTitle>
          <p className="text-sm text-foreground-secondary mt-2">{metadata.description}</p>
        </DialogHeader>

        {/* Actions */}
        <div className="flex gap-3 mb-6">
          <Button 
            onClick={handleViewDomain}
            variant="default"
            className="flex-1"
          >
            <Network className="h-4 w-4 mr-2" />
            View Domain Graph
          </Button>
          {etherscanUrl && (
            <Button 
              variant="outline"
              asChild
            >
              <a href={etherscanUrl} target="_blank" rel="noopener noreferrer" className="flex items-center">
                <ExternalLink className="h-4 w-4 mr-2" />
                Etherscan
              </a>
            </Button>
          )}
          <Button 
            variant="outline"
            onClick={() => handleCopy(badge.tx_hash || '', 'tx')}
          >
            {copied === 'tx' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>

        {/* NFT Information Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Metadata Section */}
          <Card className="relative overflow-hidden">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-primary" />
                Performance Metrics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Score */}
              <div className="flex items-center justify-between p-4 rounded-lg bg-primary/10 border border-primary/20">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/20">
                    <Award className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground-secondary">Quiz Score</p>
                    <p className="text-2xl font-bold text-primary">{badge.score}%</p>
                  </div>
                </div>
                <div className="w-20 h-20 relative">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="40"
                      cy="40"
                      r="36"
                      stroke="currentColor"
                      strokeWidth="6"
                      fill="none"
                      className="text-border"
                    />
                    <circle
                      cx="40"
                      cy="40"
                      r="36"
                      stroke="currentColor"
                      strokeWidth="6"
                      fill="none"
                      strokeDasharray={`${badge.score * 2.26} 226`}
                      strokeDashoffset="0"
                      className="text-primary transition-all"
                    />
                  </svg>
                </div>
              </div>

              {/* Nodes */}
              <div className="p-4 rounded-lg bg-accent/50 border border-border">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-orange-500/20">
                    <Network className="h-5 w-5 text-orange-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground-secondary">Knowledge Nodes</p>
                    <p className="text-2xl font-bold">{badge.node_count}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* On-Chain Details */}
          <Card className="relative overflow-hidden">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-orange-500" />
                On-Chain Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Contract Address */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-accent/30 border border-border">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-foreground-secondary mb-1">Contract Address</p>
                  <p className="text-sm font-mono">{formatAddress(contractAddress)}</p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleCopy(contractAddress, 'contract')}
                  className="ml-2 shrink-0"
                >
                  {copied === 'contract' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>

              {/* Token ID */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-accent/30 border border-border">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-foreground-secondary mb-1">Token ID</p>
                  <p className="text-sm font-mono">{badge.token_id}</p>
                </div>
              </div>

              {/* Transaction Hash */}
              {badge.tx_hash && (
                <div className="flex items-center justify-between p-3 rounded-lg bg-accent/30 border border-border">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-foreground-secondary mb-1">Transaction Hash</p>
                    <p className="text-sm font-mono">{formatTxHash(badge.tx_hash)}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleCopy(badge.tx_hash, 'tx')}
                    className="ml-2 shrink-0"
                  >
                    {copied === 'tx' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              )}

              {/* Network */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-accent/30 border border-border">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-foreground-secondary mb-1">Network</p>
                  <p className="text-sm font-medium">Base Sepolia</p>
                </div>
              </div>

              {/* Token Standard */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-accent/30 border border-border">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-foreground-secondary mb-1">Standard</p>
                  <p className="text-sm font-medium">ERC-721 (Soulbound)</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Attributes */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Attributes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {metadata.attributes.map((attr: any, index: number) => (
                <Badge key={index} variant="secondary" className="px-3 py-1.5 text-sm">
                  <span className="font-medium">{attr.trait_type}:</span>{" "}
                  <span className="font-bold">{attr.value}</span>
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Metadata URI */}
        <Card className="mt-6 mb-6">
          <CardHeader>
            <CardTitle className="text-sm">Metadata URI</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-xs bg-accent/50 px-3 py-2 rounded-lg border border-border font-mono break-all">
                {badge.metadata_uri}
              </code>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleCopy(badge.metadata_uri, 'uri')}
              >
                {copied === 'uri' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
