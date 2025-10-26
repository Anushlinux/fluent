'use client';

import { GraphData } from '@/lib/graphTypes';
import { getDateRange } from '@/lib/graphUtils';

interface StatsPanelProps {
  data: GraphData;
}

export default function StatsPanel({ data }: StatsPanelProps) {
  const dateRange = getDateRange(data);
  const linkDensity = data.stats.totalSentences > 0
    ? (data.edges.length / data.stats.totalSentences).toFixed(2)
    : '0';

  return (
    <div className="bg-card border border-border rounded-lg p-4 h-full flex flex-col overflow-auto">
      <h2 className="text-base font-semibold text-foreground-primary mb-3">Learning Statistics</h2>
      
      <div className="flex flex-col gap-2 flex-shrink-0">
        {/* Stats Grid - 2x2 */}
        <div className="grid grid-cols-2 gap-2">
          {/* Total Sentences */}
          <div className="bg-background-primary border border-border rounded-lg p-3">
            <div className="text-2xl font-bold text-foreground-primary">
              {data.stats.totalSentences}
            </div>
            <div className="text-xs text-foreground-secondary mt-0.5">
              Sentences
            </div>
          </div>

          {/* Topics */}
          <div className="bg-background-primary border border-border rounded-lg p-3">
            <div className="text-2xl font-bold text-foreground-primary">
              {data.stats.topicCount}
            </div>
            <div className="text-xs text-foreground-secondary mt-0.5">
              Topics
            </div>
          </div>

          {/* Link Strength */}
          <div className="bg-background-primary border border-border rounded-lg p-3">
            <div className="text-2xl font-bold text-foreground-primary">
              {Math.round(data.stats.avgLinkStrength * 100)}%
            </div>
            <div className="text-xs text-foreground-secondary mt-0.5">
              Link Strength
            </div>
          </div>

          {/* Knowledge Density */}
          <div className="bg-background-primary border border-border rounded-lg p-3">
            <div className="text-2xl font-bold text-foreground-primary">
              {linkDensity}
            </div>
            <div className="text-xs text-foreground-secondary mt-0.5">
              Links/Node
            </div>
          </div>
        </div>
      </div>

      {/* Date Range */}
      {dateRange && (
        <div className="mt-3 p-3 bg-accent/30 border border-border rounded-lg flex-shrink-0">
          <div className="text-xs text-foreground-secondary">
            <span className="font-medium text-foreground-primary">Period:</span>{' '}
            {new Date(dateRange.start).toLocaleDateString()} -{' '}
            {new Date(dateRange.end).toLocaleDateString()}
          </div>
        </div>
      )}

      {/* Journey Insights */}
      {data.stats.totalSentences > 0 && (
        <div className="mt-3 p-3 bg-accent/20 border border-border rounded-lg flex-shrink-0">
          <div className="text-sm font-medium text-foreground-primary mb-1">
            🎯 Journey
          </div>
          <div className="text-xs text-foreground-secondary">
            {generateInsight(data)}
          </div>
        </div>
      )}
    </div>
  );
}

function generateInsight(data: GraphData): string {
  const { totalSentences, topicCount, avgLinkStrength } = data.stats;
  const linkPercentage = Math.round(avgLinkStrength * 100);

  if (linkPercentage >= 70) {
    return `Amazing! You've captured ${totalSentences} sentences across ${topicCount} topics with ${linkPercentage}% connection strength. Your knowledge is highly interconnected! 🌟`;
  } else if (linkPercentage >= 50) {
    return `Great progress! ${totalSentences} sentences spanning ${topicCount} topics. Your concepts are ${linkPercentage}% linked - keep building connections! 💡`;
  } else {
    return `You've captured ${totalSentences} sentences across ${topicCount} different topics. Explore more to discover connections between your learnings! 🚀`;
  }
}

