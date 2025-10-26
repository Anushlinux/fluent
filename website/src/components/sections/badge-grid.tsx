"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { getUserBadges, type BadgeData } from "@/lib/graphStorage";
import { getDomainConfig } from "@/lib/domain-config";
import { Trophy, TrendingUp, Award, Calendar, Share2, Globe, Lock } from "lucide-react";
import { BadgeDetailModal } from "../BadgeDetailModal";
import { ShareModal } from "../ShareModal";
import { Button } from "@/components/ui/button";
import { toggleBadgePrivacy } from "@/lib/shareService";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { EvervaultCard } from "@/components/ui/evervault-card";

// Emoji mapping for domains
const getDomainEmoji = (iconName: string): string => {
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
  return iconMap[iconName.toLowerCase()] || '🎓';
};

export default function BadgeGrid({ userId }: { userId: string }) {
  const [badges, setBadges] = useState<BadgeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBadge, setSelectedBadge] = useState<BadgeData | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareBadge, setShareBadge] = useState<BadgeData | null>(null);
  const [badgeVisibility, setBadgeVisibility] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const loadBadges = async () => {
      try {
        const userBadges = await getUserBadges(userId);
        setBadges(userBadges);
        
        // Load visibility status for each badge
        const visibility: Record<string, boolean> = {};
        for (const badge of userBadges) {
          try {
            const supabase = getSupabaseBrowserClient();
            if (supabase) {
              const { data } = await supabase
                .from('owned_nfts')
                .select('is_public')
                .eq('id', badge.id)
                .single();
              
              visibility[badge.id] = data?.is_public ?? true;
            }
          } catch (error) {
            visibility[badge.id] = true; // Default to public
          }
        }
        setBadgeVisibility(visibility);
      } catch (error) {
        console.error("[BadgeGrid] Failed to load badges:", error);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      loadBadges();
    }
  }, [userId]);

  const handleShareClick = (e: React.MouseEvent, badge: BadgeData) => {
    e.stopPropagation();
    setShareBadge(badge);
    setShowShareModal(true);
  };

  const handleTogglePrivacy = async (e: React.MouseEvent, badge: BadgeData) => {
    e.stopPropagation();
    try {
      const currentVisibility = badgeVisibility[badge.id] ?? true;
      await toggleBadgePrivacy(badge.id, !currentVisibility);
      setBadgeVisibility(prev => ({ ...prev, [badge.id]: !currentVisibility }));
    } catch (error) {
      console.error('Failed to toggle privacy:', error);
    }
  };

  const handleBadgeClick = (badge: BadgeData) => {
    setSelectedBadge(badge);
    setShowModal(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-foreground-secondary">Loading your badges...</div>
      </div>
    );
  }

  if (badges.length === 0) {
    return null;
  }

  return (
    <section className="relative bg-background-primary py-16 md:py-24">
      <div className="container mx-auto flex max-w-[1216px] flex-col items-center gap-12 px-4 md:gap-20 xl:px-0">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 w-full">
          {badges.map((badge) => {
            const domainConfig = getDomainConfig(badge.domain);
            if (!domainConfig) return null;

            const domainEmoji = getDomainEmoji(domainConfig.icon);

            return (
              <div
                key={badge.id}
                onClick={() => handleBadgeClick(badge)}
                className="group relative cursor-pointer transition-all duration-300 hover:-translate-y-2"
              >
                {/* Evervault Card */}
                <div className="relative rounded-2xl border border-border bg-card overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300">
                  <div className="h-64">
                    <EvervaultCard text={domainEmoji} />
                  </div>

                {/* Info Section Below Evervault Card */}
                <div className="p-5 space-y-3 bg-card border-t border-border">
                  {/* Domain Info */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-lg text-foreground-primary truncate mb-1">
                        {domainConfig.name}
                      </h4>
                      <p className="text-sm text-foreground-secondary">
                        Badge #{badge.token_id}
                      </p>
                    </div>
                    <div 
                      className="p-2 rounded-lg shrink-0"
                      style={{ backgroundColor: `${domainConfig.color}15` }}
                    >
                      <Trophy className="h-5 w-5" style={{ color: domainConfig.color }} />
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-4 pt-3 border-t border-border">
                    {/* Score */}
                    <div className="flex items-center gap-2">
                      <Award className="h-4 w-4 text-primary" />
                      <div>
                        <p className="text-xs text-foreground-secondary">Score</p>
                        <p className="text-sm font-bold text-primary">{badge.score}%</p>
                      </div>
                    </div>

                    {/* Nodes */}
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-primary" />
                      <div>
                        <p className="text-xs text-foreground-secondary">Nodes</p>
                        <p className="text-sm font-bold text-primary">{badge.node_count}</p>
                      </div>
                    </div>
                  </div>

                  {/* Mint Date */}
                  <div className="flex items-center gap-2 text-xs text-foreground-secondary">
                    <Calendar className="h-3 w-3" />
                    <span>{new Date(badge.minted_at).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric',
                      year: 'numeric'
                    })}</span>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 pt-3 border-t border-border">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => handleShareClick(e, badge)}
                      className="flex-1"
                    >
                      <Share2 className="h-3 w-3 mr-1" />
                      Share
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => handleTogglePrivacy(e, badge)}
                      title={badgeVisibility[badge.id] === false ? 'Make Public' : 'Make Private'}
                    >
                      {badgeVisibility[badge.id] === false ? (
                        <Lock className="h-3 w-3 text-gray-500" />
                      ) : (
                        <Globe className="h-3 w-3 text-blue-500" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
            );
          })}
        </div>

        {/* Badge Detail Modal */}
        {showModal && selectedBadge && (
          <BadgeDetailModal
            badge={selectedBadge}
            open={showModal}
            onOpenChange={setShowModal}
          />
        )}

        {/* Share Modal */}
        {showShareModal && shareBadge && (
          <ShareModal
            open={showShareModal}
            onOpenChange={setShowShareModal}
            badge={shareBadge}
            domainConfig={getDomainConfig(shareBadge.domain)!}
            userId={userId}
          />
        )}
      </div>
    </section>
  );
}

