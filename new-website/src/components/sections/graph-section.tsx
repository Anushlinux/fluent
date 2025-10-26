'use client';

import React, { useState, useCallback } from 'react';
import { RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import GraphViewer from '../GraphViewer';
import QueryControls from '../QueryControls';
import StatsPanel from '../StatsPanel';
import { GraphData } from '@/lib/graphTypes';
import { getGraphData } from '@/lib/graphStorage';
import { getSupabaseBrowserClient } from '@/lib/supabase';
import { Button } from '@/components/ui/button';

const GraphSection = () => {
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [filteredData, setFilteredData] = useState<GraphData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();

  // Load initial data
  React.useEffect(() => {
    checkAuthAndLoadData();
  }, []);

  const checkAuthAndLoadData = async () => {
    setLoading(true);
    
    // Check authentication
    if (supabase) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setIsAuthenticated(true);
        await loadGraphData();
      } else {
        setIsAuthenticated(false);
        setGraphData({
          nodes: [],
          edges: [],
          stats: {
            totalSentences: 0,
            topicCount: 0,
            avgLinkStrength: 0,
          },
        });
      }
    } else {
      // Supabase not configured, allow local access
      setIsAuthenticated(true);
      await loadGraphData();
    }
    
    setLoading(false);
  };

  const loadGraphData = async () => {
    try {
      setLoading(true);
      
      // Try to load existing graph data
      const data = await getGraphData();
      
      if (data && data.nodes.length > 0) {
        setGraphData(data);
        setFilteredData(data);
      } else {
        // Create empty graph data for demo
        const emptyData: GraphData = {
          nodes: [],
          edges: [],
          stats: {
            totalSentences: 0,
            topicCount: 0,
            avgLinkStrength: 0,
          },
        };
        setGraphData(emptyData);
        setFilteredData(emptyData);
      }
    } catch (error) {
      console.error('[Graph Section] Failed to load data:', error);
      
      // Fallback to empty data
      const emptyData: GraphData = {
        nodes: [],
        edges: [],
        stats: {
          totalSentences: 0,
          topicCount: 0,
          avgLinkStrength: 0,
        },
      };
      setGraphData(emptyData);
      setFilteredData(emptyData);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await loadGraphData();
    } finally {
      setRefreshing(false);
    }
  };

  const handleFilterChange = useCallback((newData: GraphData) => {
    setFilteredData(newData);
  }, []);

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
              <p className="text-foreground-primary/80">Loading knowledge graph...</p>
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
                Interactive Knowledge Graph
              </h3>
              <p className="mt-4 text-balance whitespace-pre-line text-body-lg text-foreground-primary/70">
                Explore your learning journey through an interactive visualization of captured knowledge and connections.
              </p>
            </div>
          </div>

          {/* Login Prompt */}
          <div className="bg-background border border-border rounded-lg p-12 text-center max-w-md mx-auto">
            <div className="text-5xl mb-6">📊</div>
            <h4 className="text-lg font-semibold text-foreground-primary mb-2">
              Sign In to View Your Graph
            </h4>
            <p className="text-body text-foreground-primary/70 mb-6">
              Sign in to access your personalized knowledge graph and start visualizing your learning journey.
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
              Interactive Knowledge Graph
            </h3>
            <p className="mt-4 text-balance whitespace-pre-line text-body-lg text-foreground-primary/70">
              Explore your learning journey through an interactive visualization of captured knowledge and connections.
            </p>
          </div>
        </div>

        {/* Graph Container */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Main Graph Area */}
          <div className="lg:col-span-4">
            <div className="relative">
              {/* Refresh Button Overlay */}
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="absolute top-4 right-4 z-10 inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-all ease-out duration-200 rounded-full bg-white/80 backdrop-blur-sm text-accent-foreground hover:bg-white active:scale-[0.98] px-4 py-2 text-sm border border-primary/20"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Refreshing...' : 'Refresh Graph'}
              </button>

              {/* Graph Viewer */}
              {filteredData && (
                <GraphViewer data={filteredData} />
              )}
            </div>
          </div>

          {/* Sidebar Controls */}
          <div className="lg:col-span-1 space-y-6">
            {/* Query Controls */}
            {graphData && graphData.nodes.length > 0 && (
              <QueryControls 
                data={graphData} 
                onFilterChange={handleFilterChange} 
              />
            )}

            {/* Stats Panel */}
            {filteredData && (
              <StatsPanel data={filteredData} />
            )}
          </div>
        </div>

        {/* Empty State */}
        {graphData && graphData.nodes.length === 0 && (
          <div className="mt-12 text-center">
            <div className="bg-background/50 border border-border rounded-lg p-8 max-w-md mx-auto">
              <div className="text-4xl mb-4">📊</div>
              <h4 className="text-lg font-semibold text-foreground-primary mb-2">
                No Knowledge Data Yet
              </h4>
              <p className="text-body text-foreground-primary/70 mb-4">
                Start capturing sentences and building your knowledge graph to see it visualized here.
              </p>
              <button
                onClick={handleRefresh}
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-all ease-out duration-200 rounded-full bg-background text-accent-foreground hover:bg-background/90 active:scale-[0.98] px-4 py-2 text-sm"
              >
                <RefreshCw className="h-4 w-4" />
                Check for Data
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default GraphSection;

