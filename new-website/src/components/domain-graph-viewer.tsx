'use client';

import React, { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { DomainConfig } from '@/lib/domain-config';
import GraphViewer from './GraphViewer';
import QueryControls from './QueryControls';
import StatsPanel from './StatsPanel';
import { GraphData } from '@/lib/graphTypes';
import { 
  getGraphDataByContext, 
  getSentencesByContext,
  refreshGraphForContext
} from '@/lib/graphStorage';
import { getSupabaseBrowserClient } from '@/lib/supabase';
import { getDomainIcon } from '@/lib/domain-config';
import { CapturedSentence } from '@/lib/graphTypes';
import { Button } from '@/components/ui/button';
import { RefreshCw, Award, Lock } from 'lucide-react';
import { QuizModal } from './QuizModal';
import { MintModal } from './MintModal';
import { checkBadgeMinted } from '@/lib/graphStorage';

interface DomainGraphViewerProps {
  domainConfig: DomainConfig;
}

export function DomainGraphViewer({ domainConfig }: DomainGraphViewerProps) {
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [filteredData, setFilteredData] = useState<GraphData | null>(null);
  const [sentences, setSentences] = useState<CapturedSentence[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshSuccess, setRefreshSuccess] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [showMintModal, setShowMintModal] = useState(false);
  const [badgeMinted, setBadgeMinted] = useState(false);
  const [badgeState, setBadgeState] = useState<'disabled' | 'ready' | 'pending' | 'minted'>('disabled');
  const [quizScore, setQuizScore] = useState<{ score: number; total: number; passed: boolean } | null>(null);
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();
  const Icon = getDomainIcon(domainConfig.icon);

  useEffect(() => {
    loadData();
  }, [domainConfig.id]);

  const loadData = async () => {
    setLoading(true);
    
    // Check authentication
    if (supabase) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setIsAuthenticated(true);
        setUserId(user.id);
        await loadDomainData(user.id, true); // Enable auto-refresh
      } else {
        setIsAuthenticated(false);
        setUserId(null);
      }
    } else {
      // Supabase not configured, allow local access
      setIsAuthenticated(true);
      setUserId('local'); // Use 'local' as a placeholder
    }
    
    setLoading(false);
  };

  const loadDomainData = async (userId: string, autoRefresh = false) => {
    try {
      // Load filtered graph data
      const data = await getGraphDataByContext(domainConfig.id, userId);
      setGraphData(data);
      setFilteredData(data);

      // Load sentences for this domain
      const domainSentences = await getSentencesByContext(domainConfig.id, userId);
      setSentences(domainSentences);

      // Check if badge is already minted
      const isMinted = await checkBadgeMinted(userId, domainConfig.id);
      setBadgeMinted(isMinted);

      // Determine badge state
      if (isMinted) {
        setBadgeState('minted');
      } else if (domainSentences.length >= 5) {
        setBadgeState('pending');
      } else {
        setBadgeState('disabled');
      }

      // Auto-refresh: if sentences exist but no graph, automatically build the graph
      if (autoRefresh && domainSentences.length > 0 && !data) {
        console.log(`[Domain Graph Viewer] Auto-building graph for ${domainConfig.name}`);
        const success = await refreshGraphForContext(domainConfig.id, userId);
        if (success) {
          // Reload the data after building
          const newData = await getGraphDataByContext(domainConfig.id, userId);
          setGraphData(newData);
          setFilteredData(newData);
        }
      }
    } catch (error) {
      console.error('[Domain Graph Viewer] Failed to load data:', error);
      setGraphData(null);
      setFilteredData(null);
      setSentences([]);
    }
  };

  const handleRefresh = async () => {
    if (!userId) return;

    setRefreshing(true);
    setRefreshSuccess(false);

    try {
      // Refresh the graph for this context
      const success = await refreshGraphForContext(domainConfig.id, userId);
      
      if (success) {
        setRefreshSuccess(true);
        // Reload the data without auto-refresh (manual refresh)
        await loadDomainData(userId, false);
        
        // Hide success message after 3 seconds
        setTimeout(() => setRefreshSuccess(false), 3000);
      }
    } catch (error) {
      console.error('[Domain Graph Viewer] Failed to refresh:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleFilterChange = (newData: GraphData) => {
    setFilteredData(newData);
  };

  const handleMintButtonClick = () => {
    if (badgeState === 'pending') {
      setShowQuizModal(true);
    } else if (badgeState === 'ready') {
      setShowMintModal(true);
    }
  };

  const handleQuizSuccess = (score: number, total: number, questions: any[]) => {
    const passed = (score / total) >= 0.8;
    setQuizScore({ score, total, passed });
    
    if (passed) {
      setBadgeState('ready');
      setShowQuizModal(false);
      setShowMintModal(true);
    }
  };

  const handleMintSuccess = (txHash: string) => {
    setBadgeMinted(true);
    setBadgeState('minted');
    setShowMintModal(false);
    // Show toast notification (can be enhanced later)
    console.log('Badge minted! Tx:', txHash);
  };

  if (loading) {
    return (
      <div className="relative px-4 py-16 md:py-24">
        <div className="mx-auto max-w-[1800px]">
          <div className="flex flex-col items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-foreground-primary mx-auto mb-4"></div>
              <p className="text-foreground-primary/80">Loading domain data...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated && supabase) {
    return (
      <div className="relative px-4 py-16 md:py-24">
        <div className="mx-auto max-w-[1800px]">
          <div className="bg-background border border-border rounded-lg p-12 text-center max-w-md mx-auto">
            <div className="text-5xl mb-6">🔒</div>
            <h4 className="text-lg font-semibold text-foreground-primary mb-2">
              Sign In Required
            </h4>
            <p className="text-body text-foreground-primary/70 mb-6">
              Please sign in to view this domain.
            </p>
            <Button
              onClick={() => router.push('/login')}
              size="lg"
            >
              Sign In
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const hasData = graphData && graphData.nodes.length > 0;

  return (
    <div className="relative px-4 py-16 md:py-24">
      {/* Dotted background */}
      <div
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          backgroundImage: 'radial-gradient(var(--color-map-dots) 1px, transparent 1px)',
          backgroundSize: '12px 12px',
          opacity: 0.1,
        }}
      />

      <div className="mx-auto max-w-[1800px] relative z-10">
        {/* Back Button */}
        <button
          onClick={() => router.push('/')}
          className="group mb-8 flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-foreground-secondary transition-all hover:border-primary/30 hover:bg-primary/5"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          Back to Domains
        </button>

        {/* Domain Header */}
        <div className="mb-12 flex flex-col items-center text-center relative">
          <div className="absolute top-0 right-0 flex flex-col items-end gap-2">
            {/* Show refresh button if user has sentences for this domain, even if no graph yet */}
            {sentences.length > 0 && userId !== 'local' && (
              <Button
                onClick={handleRefresh}
                disabled={refreshing}
                variant="outline"
                size="sm"
                className="group relative"
              >
                <RefreshCw 
                  className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} 
                />
                {refreshing ? 'Building Graph...' : hasData ? 'Refresh Graph' : 'Build Graph'}
              </Button>
            )}
            {refreshSuccess && (
              <div className="bg-green-500 text-white px-3 py-1 rounded-md text-sm animate-pulse">
                Graph refreshed!
              </div>
            )}
          </div>

          <div
            className="mb-6 flex h-24 w-24 items-center justify-center rounded-full shadow-2xl"
            style={{
              background: `radial-gradient(circle at 30% 30%, ${domainConfig.color}80, ${domainConfig.color}40)`,
              border: `2px solid ${domainConfig.color}60`,
            }}
          >
            <Icon className="h-12 w-12 text-white" strokeWidth={1.5} />
          </div>

          <h1 className="mb-4 text-4xl font-semibold text-foreground-primary md:text-5xl">
            {domainConfig.name}
          </h1>

          <p className="max-w-[800px] text-lg text-foreground-secondary md:text-xl">
            {domainConfig.description}
          </p>

          {/* Mint Badge Button */}
          {userId && userId !== 'local' && (
            <div className="mt-8">
              <button
                onClick={handleMintButtonClick}
                disabled={badgeState === 'disabled' || badgeState === 'minted'}
                className={`
                  flex items-center gap-3 rounded-full px-6 py-3 font-semibold transition-all
                  ${badgeState === 'minted' 
                    ? 'bg-blue-500 text-white' 
                    : badgeState === 'ready' 
                    ? 'bg-green-500 text-white animate-pulse' 
                    : badgeState === 'pending'
                    ? 'bg-yellow-500 text-white hover:bg-yellow-600'
                    : 'bg-gray-500 text-white cursor-not-allowed opacity-50'
                  }
                `}
              >
                {badgeState === 'minted' && (
                  <>
                    <Award className="h-5 w-5" />
                    Badge Minted
                  </>
                )}
                {badgeState === 'ready' && (
                  <>
                    <Award className="h-5 w-5" />
                    Mint Badge
                  </>
                )}
                {badgeState === 'pending' && (
                  <>
                    <Lock className="h-5 w-5" />
                    Take Quiz to Mint
                  </>
                )}
                {badgeState === 'disabled' && (
                  <>
                    <Lock className="h-5 w-5" />
                    Collect More Data
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Empty State */}
        {!hasData ? (
          <div className="mt-12 text-center">
            <div className="bg-background/50 border border-border rounded-lg p-8 max-w-md mx-auto">
              <div className="text-4xl mb-4">📝</div>
              <h4 className="text-lg font-semibold text-foreground-primary mb-2">
                No {domainConfig.name} Data Yet
              </h4>
              <p className="text-body text-foreground-primary/70">
                Start capturing sentences in the {domainConfig.name} domain to build your knowledge graph here.
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* BentoGrid Container */}
            <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-4 md:auto-rows-[18rem]">
              {/* Main Graph Area - Large Bento Item */}
              <div className="md:row-span-4 md:col-span-2 min-h-[600px] md:min-h-[720px]">
                <div className="relative h-full rounded-xl border border-border bg-card overflow-hidden shadow-lg">
                  {filteredData && (
                    <GraphViewer data={filteredData} hasMintedBadge={badgeMinted} />
                  )}
                </div>
              </div>

              {/* Query Controls - Medium Bento Item */}
              {graphData && graphData.nodes.length > 0 && (
                <div className="md:row-span-2 md:col-span-1">
                  <QueryControls 
                    data={graphData} 
                    onFilterChange={handleFilterChange} 
                  />
                </div>
              )}

              {/* Stats Panel - Extended Bento Item */}
              {filteredData && (
                <div className="md:row-span-2 md:col-span-1">
                  <StatsPanel data={filteredData} />
                </div>
              )}
            </div>

            {/* Captured Sentences List */}
            {sentences.length > 0 && (
              <div className="mb-12 rounded-2xl border border-border bg-card p-6 md:p-10">
                <h3 className="mb-6 text-2xl font-semibold text-foreground-primary">
                  Captured Sentences ({sentences.length})
                </h3>
                <div className="space-y-4">
                  {sentences.slice(0, 10).map((sentence) => (
                    <div
                      key={sentence.id}
                      className="rounded-xl border border-border bg-background-primary p-4 transition-all hover:border-primary/30"
                    >
                      <p className="text-base text-foreground-secondary">{sentence.sentence}</p>
                      {sentence.terms && sentence.terms.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {sentence.terms.map((term, idx) => (
                            <span
                              key={idx}
                              className="rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary"
                            >
                              {term}
                            </span>
                          ))}
                        </div>
                      )}
                      <p className="mt-2 text-xs text-foreground-secondary">
                        {new Date(sentence.timestamp).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
                {sentences.length > 10 && (
                  <p className="mt-4 text-center text-sm text-foreground-secondary">
                    Showing 10 of {sentences.length} sentences
                  </p>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Quiz Modal */}
      {showQuizModal && userId && (
        <QuizModal
          domain={domainConfig.id}
          userId={userId}
          onClose={() => setShowQuizModal(false)}
          onSuccess={(score, total, questions) => handleQuizSuccess(score, total, questions)}
        />
      )}

      {/* Mint Modal */}
      {showMintModal && userId && quizScore && (
        <MintModal
          domain={domainConfig.id}
          domainConfig={domainConfig}
          userId={userId}
          score={quizScore.score}
          totalQuestions={quizScore.total}
          onClose={() => {
            setShowMintModal(false);
            setQuizScore(null);
          }}
          onSuccess={handleMintSuccess}
        />
      )}
    </div>
  );
}

