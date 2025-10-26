'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { domainConfigs } from '@/lib/domain-config';
import { DomainCard } from '@/components/domain-card';
import { getAvailableDomains } from '@/lib/graphStorage';
import { getSupabaseBrowserClient } from '@/lib/supabase';
import { Button } from '@/components/ui/button';

interface DomainCount {
  context: string;
  count: number;
}

const GraphSection = () => {
  const [domainCounts, setDomainCounts] = useState<DomainCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();

  // Load initial data
  useEffect(() => {
    checkAuthAndLoadData();
  }, []);

  const checkAuthAndLoadData = async () => {
    setLoading(true);
    
    // Check authentication
    if (supabase) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setIsAuthenticated(true);
        await loadDomains(user.id);
      } else {
        setIsAuthenticated(false);
        setDomainCounts([]);
      }
    } else {
      // Supabase not configured, show all domains as empty
      setIsAuthenticated(true);
      setDomainCounts([]);
    }
    
    setLoading(false);
  };

  const loadDomains = async (userId: string) => {
    try {
      const counts = await getAvailableDomains(userId);
      setDomainCounts(counts);
    } catch (error) {
      console.error('[Graph Section] Failed to load domains:', error);
      setDomainCounts([]);
    }
  };

  // Get count for a specific domain
  const getDomainCount = (domainId: string): number => {
    const count = domainCounts.find(c => c.context === domainId);
    return count?.count || 0;
  };

  if (loading) {
    return (
      <section className="relative px-4 py-16 md:py-24">
        {/* Dotted background */}
        <div
          className="pointer-events-none absolute inset-0 z-0"
          style={{
            backgroundImage: 'radial-gradient(var(--color-map-dots) 1px, transparent 1px)',
            backgroundSize: '12px 12px',
            opacity: 0.35,
          }}
        />
        <div className="mx-auto max-w-[1800px] relative z-10">
          <div className="flex flex-col items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-foreground-primary mx-auto mb-4"></div>
              <p className="text-foreground-primary/80">Loading domains...</p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // Show login prompt if not authenticated
  if (!isAuthenticated && supabase) {
    return (
      <section className="relative px-4 py-16 md:py-24">
        {/* Dotted background */}
        <div
          className="pointer-events-none absolute inset-0 z-0"
          style={{
            backgroundImage: 'radial-gradient(var(--color-map-dots) 1px, transparent 1px)',
            backgroundSize: '12px 12px',
            opacity: 0.35,
          }}
        />
        <div className="mx-auto max-w-[1800px] relative z-10">
          {/* Section Header */}
          <div className="flex flex-col items-center justify-center mb-12">
            <div className="mx-auto flex max-w-[1080px] flex-col items-center text-center">
              <h3 className="text-balance text-foreground-primary">
                Explore Your Knowledge Domains
              </h3>
              <p className="mt-4 text-balance whitespace-pre-line text-body-lg text-foreground-primary/70">
                Discover your learning journey across different Web3 domains.
              </p>
            </div>
          </div>

          {/* Login Prompt */}
          <div className="bg-background border border-border rounded-lg p-12 text-center max-w-md mx-auto">
            <div className="text-5xl mb-6">📚</div>
            <h4 className="text-lg font-semibold text-foreground-primary mb-2">
              Sign In to View Your Domains
            </h4>
            <p className="text-body text-foreground-primary/70 mb-6">
              Sign in to access your personalized knowledge domains and start visualizing your learning journey.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={() => router.push('/login')}
                size="lg"
              >
                Sign In
              </Button>
              <Button
                onClick={() => router.push('/signup')}
                variant="outline"
                size="lg"
              >
                Create Account
              </Button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="relative px-4 py-16 md:py-24">
      {/* Dotted background */}
      <div
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          backgroundImage: 'radial-gradient(var(--color-map-dots) 1px, transparent 1px)',
          backgroundSize: '12px 12px',
          opacity: 0.35,
        }}
      />
      <div className="mx-auto max-w-[1800px] relative z-10">
        {/* Section Header */}
        <div className="flex flex-col items-center justify-center mb-12">
          <div className="mx-auto flex max-w-[1080px] flex-col items-center text-center">
            <h3 className="text-balance text-foreground-primary">
              Explore Your Knowledge Domains
            </h3>
            <p className="mt-4 text-balance whitespace-pre-line text-body-lg text-foreground-primary/70">
              Navigate through different Web3 domains to explore your captured knowledge and understanding.
            </p>
          </div>
        </div>

        {/* Domain Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {domainConfigs.map((domain) => {
            const count = getDomainCount(domain.id);
            const isEmpty = count === 0;
            
            return (
              <DomainCard
                key={domain.id}
                domain={domain}
                sentenceCount={count}
                isEmpty={isEmpty}
              />
            );
          })}
        </div>

        {/* Empty State - if all domains are empty */}
        {domainCounts.length === 0 && isAuthenticated && (
          <div className="mt-12 text-center">
            <div className="bg-background/50 border border-border rounded-lg p-8 max-w-md mx-auto">
              <div className="text-4xl mb-4">🌐</div>
              <h4 className="text-lg font-semibold text-foreground-primary mb-2">
                Start Your Learning Journey
              </h4>
              <p className="text-body text-foreground-primary/70 mb-4">
                Capture your first sentence to begin building your knowledge graph across these domains.
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default GraphSection;
