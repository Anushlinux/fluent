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
    <div className="bg-black border border-white/20 rounded-lg p-6">
      <h2 className="text-lg font-semibold text-white mb-4">Learning Statistics</h2>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Sentences */}
        <div className="bg-black border border-white/20 rounded-lg p-4">
          <div className="text-3xl font-bold text-white">
            {data.stats.totalSentences}
          </div>
          <div className="text-sm text-white/70 mt-1">
            Sentences Captured
          </div>
        </div>

        {/* Topics */}
        <div className="bg-black border border-white/20 rounded-lg p-4">
          <div className="text-3xl font-bold text-white">
            {data.stats.topicCount}
          </div>
          <div className="text-sm text-white/70 mt-1">
            Topics Explored
          </div>
        </div>

        {/* Link Strength */}
        <div className="bg-black border border-white/20 rounded-lg p-4">
          <div className="text-3xl font-bold text-white">
            {Math.round(data.stats.avgLinkStrength * 100)}%
          </div>
          <div className="text-sm text-white/70 mt-1">
            Avg Link Strength
          </div>
        </div>

        {/* Knowledge Density */}
        <div className="bg-black border border-white/20 rounded-lg p-4">
          <div className="text-3xl font-bold text-white">
            {linkDensity}
          </div>
          <div className="text-sm text-white/70 mt-1">
            Links per Node
          </div>
        </div>
      </div>

      {/* Date Range */}
      {dateRange && (
        <div className="mt-4 p-4 bg-white/5 border border-white/10 rounded-lg">
          <div className="text-sm text-white/70">
            <span className="font-medium text-white">Learning Period:</span>{' '}
            {new Date(dateRange.start).toLocaleDateString()} -{' '}
            {new Date(dateRange.end).toLocaleDateString()}
          </div>
        </div>
      )}

      {/* Journey Insights */}
      {data.stats.totalSentences > 0 && (
        <div className="mt-4 p-4 bg-white/10 border border-white/20 rounded-lg text-white">
          <div className="font-medium">
            🎯 Your Learning Journey
          </div>
          <div className="text-sm mt-1 opacity-90">
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

