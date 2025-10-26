'use client';

import type { FC } from 'react';
import { useState, useEffect } from 'react';
import { Globe, MapPin, Server, RefreshCw } from 'lucide-react';
import GraphViewer from '@/components/GraphViewer';
import { GraphData } from '@/lib/graphTypes';
import { getGraphData } from '@/lib/graphStorage';

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

const GlobalNetwork: FC = () => {
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Load initial data
  useEffect(() => {
    loadGraphData();
  }, []);

  const loadGraphData = async () => {
    try {
      setLoading(true);
      
      // Try to load existing graph data
      const data = await getGraphData();
      
      if (data && data.nodes.length > 0) {
        setGraphData(data);
      } else {
        // Create empty graph data
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
      }
    } catch (error) {
      console.error('[Global Network] Failed to load data:', error);
      
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
            Region: Earth
          </h3>
          <p className="mt-4 max-w-[500px] text-lg text-foreground-secondary md:text-xl">
            Our smart network positions your workloads optimally — close to users, close to data.
          </p>
        </div>

        {/* Interactive Knowledge Graph */}
        <div className="relative w-full max-w-6xl">
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
            {graphData && (
              <GraphViewer data={graphData} />
            )}

            {/* Empty State */}
            {graphData && graphData.nodes.length === 0 && !loading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center p-8 bg-white/80 backdrop-blur-sm rounded-2xl border border-primary/20">
                  <div className="text-4xl mb-4">📊</div>
                  <h4 className="text-lg font-semibold text-foreground-primary mb-2">
                    No Knowledge Data Yet</h4>
                  <p className="text-body text-foreground-secondary mb-4">
                    Start capturing sentences to build your knowledge graph.
                  </p>
                </div>
              </div>
            )}

            {/* Loading State */}
            {loading && (
              <div className="bg-gradient-to-br from-[#fefef9] to-[#f9f9f4] border border-border-light rounded-2xl overflow-hidden shadow-lg h-[500px] md:h-[700px] flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-foreground-secondary">Loading knowledge graph...</p>
                </div>
              </div>
            )}
          </div>
        </div>

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