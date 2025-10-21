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
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Explore Your Graph</h2>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Topic Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Filter by Topic
          </label>
          <select
            value={selectedTopic}
            onChange={(e) => handleTopicChange(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
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
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Filter by Framework
          </label>
          <select
            value={selectedFramework}
            onChange={(e) => handleFrameworkChange(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
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
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Quick Views
        </label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <button
            onClick={() => handlePreBuiltQuery('journey')}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
              activeQuery === 'journey'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            📚 My Journey
          </button>

          <button
            onClick={() => handlePreBuiltQuery('quiz')}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
              activeQuery === 'quiz'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            ✅ Quiz Trail
          </button>

          <button
            onClick={() => handlePreBuiltQuery('confidence')}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
              activeQuery === 'confidence'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            ⭐ High Confidence
          </button>

          <button
            onClick={() => handlePreBuiltQuery('recent')}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
              activeQuery === 'recent'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            🕐 Last 7 Days
          </button>
        </div>
      </div>

      {/* Reset Button */}
      {(selectedTopic !== 'All' || selectedFramework !== 'All' || activeQuery) && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <button
            onClick={resetFilters}
            className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
          >
            Reset All Filters
          </button>
        </div>
      )}
    </div>
  );
}

