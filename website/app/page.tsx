'use client';

import { useState, useEffect } from 'react';
import { GraphData } from '@/lib/graphTypes';
import { getGraphData, saveGraphData, hasGraphData } from '@/lib/graphStorage';
import GraphViewer from '@/components/GraphViewer';
import QueryControls from '@/components/QueryControls';
import StatsPanel from '@/components/StatsPanel';

export default function Home() {
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [filteredData, setFilteredData] = useState<GraphData | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  // Load saved graph data on mount
  useEffect(() => {
    loadSavedData();
  }, []);

  const loadSavedData = async () => {
    setLoading(true);
    const data = await getGraphData();
    if (data) {
      setGraphData(data);
      setFilteredData(data);
    }
    setLoading(false);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const text = await file.text();
      const data: GraphData = JSON.parse(text);
      
      // Validate data structure
      if (!data.nodes || !data.edges || !data.stats) {
        throw new Error('Invalid graph data format');
      }

      await saveGraphData(data);
      setGraphData(data);
      setFilteredData(data);
    } catch (error) {
      console.error('Failed to load graph data:', error);
      alert('Failed to load graph file. Please check the file format.');
    } finally {
      setUploading(false);
    }
  };

  const loadDemoData = async () => {
    setUploading(true);
    try {
      const response = await fetch('/sample-graph.json');
      const data: GraphData = await response.json();
      await saveGraphData(data);
      setGraphData(data);
      setFilteredData(data);
    } catch (error) {
      console.error('Failed to load demo data:', error);
      alert('Failed to load demo data');
    } finally {
      setUploading(false);
    }
  };

  const handleFilterChange = (newData: GraphData) => {
    setFilteredData(newData);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Landing page - no data loaded
  if (!graphData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold text-gray-900 mb-4">
              Fluent Knowledge Graph
            </h1>
            <p className="text-xl text-gray-600">
              Visualize your learning journey through an interactive knowledge graph
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Get Started</h2>
            
            {/* File Upload */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload Graph Data
              </label>
              <div className="flex items-center justify-center w-full">
                <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <svg
                      className="w-12 h-12 mb-4 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                      />
                    </svg>
                    <p className="mb-2 text-sm text-gray-500">
                      <span className="font-semibold">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-gray-500">JSON file exported from Fluent extension</p>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    accept=".json"
                    onChange={handleFileUpload}
                    disabled={uploading}
                  />
                </label>
              </div>
            </div>

            {/* Demo Button */}
            <div className="text-center pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-600 mb-4">
                Don't have data yet? Try the demo
              </p>
              <button
                onClick={loadDemoData}
                disabled={uploading}
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {uploading ? 'Loading...' : 'Load Demo Data'}
              </button>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4">How It Works</h3>
            <ol className="space-y-4 text-gray-600">
              <li className="flex items-start">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 font-bold mr-3 flex-shrink-0">
                  1
                </span>
                <span>Use the Fluent browser extension to capture sentences while browsing</span>
              </li>
              <li className="flex items-start">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 font-bold mr-3 flex-shrink-0">
                  2
                </span>
                <span>Export your data using the "Export for Graph" button in the extension</span>
              </li>
              <li className="flex items-start">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 font-bold mr-3 flex-shrink-0">
                  3
                </span>
                <span>Upload the JSON file here to visualize your knowledge graph</span>
              </li>
              <li className="flex items-start">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 font-bold mr-3 flex-shrink-0">
                  4
                </span>
                <span>Explore connections, filter by topics, and track your learning journey</span>
              </li>
            </ol>
          </div>
        </div>
      </div>
    );
  }

  // Graph view - data loaded
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">
              Fluent Knowledge Graph
            </h1>
            <button
              onClick={() => {
                if (confirm('Clear current graph and load new data?')) {
                  setGraphData(null);
                  setFilteredData(null);
                }
              }}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Load New Data
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Panel */}
        <StatsPanel data={filteredData || graphData} />

        {/* Query Controls */}
        <div className="mt-8">
          <QueryControls 
            data={graphData} 
            onFilterChange={handleFilterChange}
          />
        </div>

        {/* Graph Viewer */}
        <div className="mt-8">
          <GraphViewer data={filteredData || graphData} />
        </div>
      </div>
    </div>
  );
}
