'use client';

import type { FC } from 'react';
import { useState, useEffect } from 'react';
import { Globe, MapPin, Server } from 'lucide-react';
import { domainConfigs } from '@/lib/domain-config';
import { DomainCard } from '@/components/domain-card';
import { getAvailableDomains } from '@/lib/graphStorage';
import { getSupabaseBrowserClient } from '@/lib/supabase';

const Card = ({
  icon: Icon,
  title,
  children,
  className,
}: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
  className?: string;
}) => (
  <div className={`flex flex-col ${className}`}>
    <Icon className="h-7 w-7 text-primary" strokeWidth={1.5} />
    <h6 className="mt-4 text-xl font-semibold text-foreground-primary">{title}</h6>
    <p className="mt-2 text-base text-foreground-secondary">{children}</p>
  </div>
);

interface DomainCount {
  context: string;
  count: number;
}

const GlobalNetwork: FC = () => {
  const [domainCounts, setDomainCounts] = useState<DomainCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const supabase = getSupabaseBrowserClient();

  useEffect(() => {
    checkAuthAndLoadData();
  }, []);

  const checkAuthAndLoadData = async () => {
    setLoading(true);
    
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
      console.error('[Global Network] Failed to load domains:', error);
      setDomainCounts([]);
    }
  };

  const getDomainCount = (domainId: string): number => {
    const count = domainCounts.find(c => c.context === domainId);
    return count?.count || 0;
  };

  return (
    <section className="relative bg-background-primary py-16 md:py-24">
      {/* Dotted background */}
      <div
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          backgroundImage: 'radial-gradient(var(--color-map-dots) 1px, transparent 1px)',
          backgroundSize: '12px 12px',
          opacity: 0.35,
        }}
      />
      <div className="container relative z-10 mx-auto flex max-w-[1216px] flex-col items-center gap-12 px-4 md:gap-20 xl:px-0">
        {/* Header */}
        <div className="mx-auto flex max-w-[640px] flex-col items-center text-center">
          <h3 className="text-4xl font-semibold -tracking-[0.01em] text-foreground-primary md:text-5xl">
            Explore Your Knowledge Domains
          </h3>
          <p className="mt-4 max-w-[500px] text-lg text-foreground-secondary md:text-xl">
            Navigate through different Web3 domains to explore your captured knowledge and understanding.
          </p>
        </div>

        {/* Domain Grid */}
        {loading ? (
          <div className="w-full flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-foreground-secondary">Loading domains...</p>
            </div>
          </div>
        ) : !isAuthenticated && supabase ? (
          <div className="w-full max-w-md">
            <div className="bg-background border border-border rounded-lg p-12 text-center">
              <div className="text-5xl mb-6">📚</div>
              <h4 className="text-lg font-semibold text-foreground-primary mb-2">
                Sign In to View Your Domains
              </h4>
              <p className="text-body text-foreground-primary/70">
                Sign in to access your personalized knowledge domains.
              </p>
            </div>
          </div>
        ) : (
          <div className="w-full">
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
                  <p className="text-body text-foreground-primary/70">
                    Capture your first sentence to begin building your knowledge graph across these domains.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Feature Cards */}
        <div className="w-full rounded-2xl border border-border bg-card p-6 md:p-10">
          <div className="grid grid-cols-1 gap-x-6 gap-y-8 md:grid-cols-3">
            <Card icon={Globe} title="Run everywhere" className="border-b border-border pb-8 md:border-b-0 md:border-r md:pr-6 md:pb-0">
              Run code in 330+ cities around the world, within 50ms of 95% of the world's population.
            </Card>
            <Card icon={MapPin} title="Run anywhere" className="border-b border-border pb-8 md:border-b-0 md:border-r md:px-6 md:pb-0">
               Run code near the user, database, or near your APIs. Our smart network will schedule your requests to optimize for the best latency.
            </Card>
            <Card icon={Server} title="Run at massive scale" className="md:pl-6">
              Run on This project of fluent's infrastructure, supporting 405 Tbps of network capacity, serving over 84 million HTTP requests per second.
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};

export default GlobalNetwork;
