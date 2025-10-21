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
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Learning Statistics</h2>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Sentences */}
        <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-lg p-4">
          <div className="text-3xl font-bold text-indigo-600">
            {data.stats.totalSentences}
          </div>
          <div className="text-sm text-indigo-700 mt-1">
            Sentences Captured
          </div>
        </div>

        {/* Topics */}
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4">
          <div className="text-3xl font-bold text-purple-600">
            {data.stats.topicCount}
          </div>
          <div className="text-sm text-purple-700 mt-1">
            Topics Explored
          </div>
        </div>

        {/* Link Strength */}
        <div className="bg-gradient-to-br from-pink-50 to-pink-100 rounded-lg p-4">
          <div className="text-3xl font-bold text-pink-600">
            {Math.round(data.stats.avgLinkStrength * 100)}%
          </div>
          <div className="text-sm text-pink-700 mt-1">
            Avg Link Strength
          </div>
        </div>

        {/* Knowledge Density */}
        <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg p-4">
          <div className="text-3xl font-bold text-amber-600">
            {linkDensity}
          </div>
          <div className="text-sm text-amber-700 mt-1">
            Links per Node
          </div>
        </div>
      </div>

      {/* Date Range */}
      {dateRange && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <div className="text-sm text-gray-600">
            <span className="font-medium">Learning Period:</span>{' '}
            {new Date(dateRange.start).toLocaleDateString()} -{' '}
            {new Date(dateRange.end).toLocaleDateString()}
          </div>
        </div>
      )}

      {/* Journey Insights */}
      {data.stats.totalSentences > 0 && (
        <div className="mt-4 p-4 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg text-white">
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

