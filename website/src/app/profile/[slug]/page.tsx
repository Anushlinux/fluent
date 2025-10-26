import { Suspense } from "react";
import { getPublicBadgesBySlug, getUserProfileBySlug, type BadgeData } from "@/lib/graphStorage";
import { getDomainConfig } from "@/lib/domain-config";
import BadgeGrid from "@/components/sections/badge-grid";
import { Trophy, Award, Network, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Share2 as ShareIcon } from "lucide-react";
import { Metadata } from "next";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const profile = await getUserProfileBySlug(slug);
  const badges = await getPublicBadgesBySlug(slug);

  return {
    title: profile?.email ? `Badges by ${profile.email.split('@')[0]}` : 'Public Badge Collection',
    description: `View ${badges.length} mastery badges earned on Fluent`,
    openGraph: {
      title: `${badges.length} Badges on Fluent`,
      description: 'Explore mastery achievements',
      type: 'profile',
    },
  };
}

export default async function PublicProfilePage({ params }: PageProps) {
  const { slug } = await params;
  const profile = await getUserProfileBySlug(slug);
  const badges = await getPublicBadgesBySlug(slug);

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Profile Not Found</h1>
          <p className="text-muted-foreground">This profile does not exist or is private.</p>
        </div>
      </div>
    );
  }

  // Calculate stats
  const totalBadges = badges.length;
  const domains = [...new Set(badges.map(b => b.domain))];
  const avgScore = badges.reduce((sum, b) => sum + b.score, 0) / totalBadges;
  const totalNodes = badges.reduce((sum, b) => sum + b.node_count, 0);

  return (
    <div className="min-h-screen bg-background-primary">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto max-w-7xl px-4 py-12">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">Badge Collection</h1>
              <p className="text-muted-foreground">
                {totalBadges} mastery badge{totalBadges !== 1 ? 's' : ''} across {domains.length} domain{domains.length !== 1 ? 's' : ''}
              </p>
            </div>
            <Button variant="outline" size="lg">
              <ShareIcon className="h-4 w-4 mr-2" />
              Share Profile
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      {totalBadges > 0 && (
        <div className="container mx-auto max-w-7xl px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-6 rounded-lg border bg-card">
              <div className="flex items-center gap-3 mb-2">
                <Trophy className="h-5 w-5 text-yellow-500" />
                <h3 className="font-semibold">Total Badges</h3>
              </div>
              <p className="text-3xl font-bold">{totalBadges}</p>
            </div>

            <div className="p-6 rounded-lg border bg-card">
              <div className="flex items-center gap-3 mb-2">
                <Award className="h-5 w-5 text-blue-500" />
                <h3 className="font-semibold">Avg Score</h3>
              </div>
              <p className="text-3xl font-bold">{Math.round(avgScore)}%</p>
            </div>

            <div className="p-6 rounded-lg border bg-card">
              <div className="flex items-center gap-3 mb-2">
                <Network className="h-5 w-5 text-green-500" />
                <h3 className="font-semibold">Total Nodes</h3>
              </div>
              <p className="text-3xl font-bold">{totalNodes}</p>
            </div>

            <div className="p-6 rounded-lg border bg-card">
              <div className="flex items-center gap-3 mb-2">
                <Share2 className="h-5 w-5 text-purple-500" />
                <h3 className="font-semibold">Domains</h3>
              </div>
              <p className="text-3xl font-bold">{domains.length}</p>
            </div>
          </div>
        </div>
      )}

      {/* Badges */}
      <div className="container mx-auto max-w-7xl px-4 py-8">
        {badges.length === 0 ? (
          <div className="text-center py-16">
            <Trophy className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-bold mb-2">No Public Badges</h2>
            <p className="text-muted-foreground">This user hasn't made any badges public yet.</p>
          </div>
        ) : (
          <Suspense fallback={<div className="text-center py-16">Loading badges...</div>}>
            <BadgeGrid userId={profile.id} />
          </Suspense>
        )}
      </div>
    </div>
  );
}

