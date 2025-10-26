'use client';

import { useState } from 'react';
import { GraphData } from '@/lib/graphTypes';
import {
  getTopics,
  getFrameworks,
  getSubgraph,
  filterByFramework,
  getQuizTrail,
  getHighConfidence,
  getLearningPath,
  getDateRange,
} from '@/lib/graphUtils';

interface QueryControlsProps {
  data: GraphData;
  onFilterChange: (filteredData: GraphData) => void;
}

export default function QueryControls({ data, onFilterChange }: QueryControlsProps) {
  const [selectedTopic, setSelectedTopic] = useState('All');
  const [selectedFramework, setSelectedFramework] = useState('All');
  const [activeQuery, setActiveQuery] = useState<string | null>(null);

  const topics = ['All', ...getTopics(data)];
  const frameworks = ['All', ...getFrameworks(data)];
  const dateRange = getDateRange(data);

  const handleTopicChange = (topic: string) => {
    setSelectedTopic(topic);
    setActiveQuery(null);
    const filtered = getSubgraph(topic, data);
    onFilterChange(filtered);
  };

  const handleFrameworkChange = (framework: string) => {
    setSelectedFramework(framework);
    setActiveQuery(null);
    const filtered = filterByFramework(framework, data);
    onFilterChange(filtered);
  };

  const handlePreBuiltQuery = (queryType: string) => {
    setActiveQuery(queryType);
    setSelectedTopic('All');
    setSelectedFramework('All');

    let filtered: GraphData;
    switch (queryType) {
      case 'journey':
        filtered = data; // Show all in chronological order
        break;
      case 'quiz':
        filtered = getQuizTrail(data);
        break;
      case 'confidence':
        filtered = getHighConfidence(data);
        break;
      case 'recent':
        if (dateRange) {
          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
          filtered = getLearningPath(
            sevenDaysAgo.toISOString().split('T')[0],
            dateRange.end,
            data
          );
        } else {
          filtered = data;
        }
        break;
      default:
        filtered = data;
    }

    onFilterChange(filtered);
  };

  const resetFilters = () => {
    setSelectedTopic('All');
    setSelectedFramework('All');
    setActiveQuery(null);
    onFilterChange(data);
  };

  return (
    <div className="bg-card border border-border rounded-lg p-6 h-full flex flex-col">
      <h2 className="text-lg font-semibold text-foreground-primary mb-4">Explore Your Graph</h2>

      {/* Filters */}
      <div className="grid grid-cols-1 gap-4 mb-6">
        {/* Topic Filter */}
        <div>
          <label className="block text-sm font-medium text-foreground-secondary mb-2">
            Filter by Topic
          </label>
          <select
            value={selectedTopic}
            onChange={(e) => handleTopicChange(e.target.value)}
            className="w-full px-4 py-2 bg-background-primary border border-border text-foreground-primary rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
          >
            {topics.map((topic) => (
              <option key={topic} value={topic}>
                {topic}
              </option>
            ))}
          </select>
        </div>

        {/* Framework Filter */}
        <div>
          <label className="block text-sm font-medium text-foreground-secondary mb-2">
            Filter by Framework
          </label>
          <select
            value={selectedFramework}
            onChange={(e) => handleFrameworkChange(e.target.value)}
            className="w-full px-4 py-2 bg-background-primary border border-border text-foreground-primary rounded-lg focus:ring-2 focus:ring-primary focus:border-primary disabled:opacity-50"
            disabled={frameworks.length <= 1}
          >
            {frameworks.map((framework) => (
              <option key={framework} value={framework}>
                {framework}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Pre-Built Queries */}
      <div>
        <label className="block text-sm font-medium text-foreground-secondary mb-2">
          Quick Views
        </label>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => handlePreBuiltQuery('journey')}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
              activeQuery === 'journey'
                ? 'bg-primary text-primary-foreground'
                : 'bg-background-primary border border-border text-foreground-primary hover:border-primary/30 hover:bg-primary/5'
            }`}
          >
            📚 My Journey
          </button>

          <button
            onClick={() => handlePreBuiltQuery('quiz')}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
              activeQuery === 'quiz'
                ? 'bg-primary text-primary-foreground'
                : 'bg-background-primary border border-border text-foreground-primary hover:border-primary/30 hover:bg-primary/5'
            }`}
          >
            ✅ Quiz Trail
          </button>

          <button
            onClick={() => handlePreBuiltQuery('confidence')}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
              activeQuery === 'confidence'
                ? 'bg-primary text-primary-foreground'
                : 'bg-background-primary border border-border text-foreground-primary hover:border-primary/30 hover:bg-primary/5'
            }`}
          >
            ⭐ High Confidence
          </button>

          <button
            onClick={() => handlePreBuiltQuery('recent')}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
              activeQuery === 'recent'
                ? 'bg-primary text-primary-foreground'
                : 'bg-background-primary border border-border text-foreground-primary hover:border-primary/30 hover:bg-primary/5'
            }`}
          >
            🕐 Last 7 Days
          </button>
        </div>
      </div>

      {/* Reset Button */}
      {(selectedTopic !== 'All' || selectedFramework !== 'All' || activeQuery) && (
        <div className="mt-4 pt-4 border-t border-border">
          <button
            onClick={resetFilters}
            className="text-sm text-primary hover:text-primary/80 font-medium underline"
          >
            Reset All Filters
          </button>
        </div>
      )}
    </div>
  );
}

