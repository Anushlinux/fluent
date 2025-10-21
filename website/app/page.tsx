'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { GraphData } from '@/lib/graphTypes';
import { getGraphData, saveGraphData, subscribeToGraphUpdates } from '@/lib/graphStorage';
import { getSupabaseBrowserClient } from '@/lib/supabase';
import GraphViewer from '@/components/GraphViewer';
import QueryControls from '@/components/QueryControls';
import StatsPanel from '@/components/StatsPanel';

export default function Home() {
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [filteredData, setFilteredData] = useState<GraphData | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [supabaseConfigured, setSupabaseConfigured] = useState(true);
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();

  // Check authentication and load data on mount
  useEffect(() => {
    // Check if Supabase is configured
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
        process.env.NEXT_PUBLIC_SUPABASE_URL === 'https://your-project.supabase.co') {
      setSupabaseConfigured(false);
      setLoading(false);
      return;
    }
    
    checkAuthAndLoadData();

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
      if (session?.user) {
        setUser(session.user);
        loadSavedData();
      } else {
        setUser(null);
        setGraphData(null);
        setFilteredData(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Subscribe to real-time graph updates
  useEffect(() => {
    if (!user) return;

    const unsubscribe = subscribeToGraphUpdates((data) => {
      setGraphData(data);
      setFilteredData(data);
    });

    return () => {
      unsubscribe();
    };
  }, [user]);

  const checkAuthAndLoadData = async () => {
    setLoading(true);
    
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    
    if (currentUser) {
      setUser(currentUser);
      await loadSavedData();
    } else {
      setUser(null);
    }
    
    setLoading(false);
  };

  const loadSavedData = async () => {
    const data = await getGraphData();
    if (data) {
      setGraphData(data);
      setFilteredData(data);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
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
    } catch (error: any) {
      console.error('Failed to load graph data:', error);
      const errorMessage = error?.message || 'Unknown error occurred';
      
      if (errorMessage.includes('Supabase environment variables')) {
        alert(
          '⚠️ Supabase Not Configured\n\n' +
          'Please follow these steps:\n\n' +
          '1. Create a Supabase project at https://supabase.com\n' +
          '2. Copy your Project URL and anon key from Project Settings → API\n' +
          '3. Add them to website/.env.local:\n' +
          '   NEXT_PUBLIC_SUPABASE_URL=your-url\n' +
          '   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key\n' +
          '4. Follow SUPABASE_SETUP.md to create database tables\n' +
          '5. Restart the dev server\n\n' +
          'See SUPABASE_SETUP.md for detailed instructions.'
        );
      } else if (errorMessage.includes('User not authenticated')) {
        alert('Please sign in first before uploading graph data.');
      } else {
        alert(`Failed to load graph file:\n\n${errorMessage}\n\nPlease check the file format and your Supabase configuration.`);
      }
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
    } catch (error: any) {
      console.error('Failed to load demo data:', error);
      const errorMessage = error?.message || 'Unknown error occurred';
      
      if (errorMessage.includes('Supabase environment variables')) {
        alert(
          '⚠️ Supabase Not Configured\n\n' +
          'Please follow these steps:\n\n' +
          '1. Create a Supabase project at https://supabase.com\n' +
          '2. Copy your Project URL and anon key from Project Settings → API\n' +
          '3. Add them to website/.env.local:\n' +
          '   NEXT_PUBLIC_SUPABASE_URL=your-url\n' +
          '   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key\n' +
          '4. Follow SUPABASE_SETUP.md to create database tables\n' +
          '5. Restart the dev server\n\n' +
          'See SUPABASE_SETUP.md for detailed instructions.'
        );
      } else if (errorMessage.includes('User not authenticated')) {
        alert('Please sign in first before loading demo data.');
      } else {
        alert(`Failed to load demo data:\n\n${errorMessage}\n\nPlease check your Supabase configuration.`);
      }
    } finally {
      setUploading(false);
    }
  };

  const handleFilterChange = (newData: GraphData) => {
    setFilteredData(newData);
  };

  // Setup required screen
  if (!supabaseConfigured) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-5xl font-bold text-gray-900 mb-4">
              Fluent Knowledge Graph
            </h1>
            <p className="text-xl text-gray-600">
              Setup Required
            </p>
          </div>

          <div className="bg-yellow-50 border-2 border-yellow-200 rounded-2xl p-8 mb-8">
            <div className="flex items-start gap-4">
              <div className="text-4xl">⚠️</div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Supabase Configuration Missing
                </h2>
                <p className="text-gray-700 mb-4">
                  The website requires Supabase to store and sync your knowledge graph data.
                  Please follow the setup instructions below:
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Quick Setup (5 minutes)</h3>
            
            <ol className="space-y-6">
              <li className="flex items-start gap-4">
                <span className="flex items-center justify-center w-10 h-10 rounded-full bg-indigo-600 text-white font-bold flex-shrink-0">
                  1
                </span>
                <div className="flex-1">
                  <h4 className="font-bold text-gray-900 mb-2">Create Supabase Project</h4>
                  <p className="text-gray-600 mb-2">
                    Go to <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">supabase.com</a> and create a new project
                  </p>
                </div>
              </li>

              <li className="flex items-start gap-4">
                <span className="flex items-center justify-center w-10 h-10 rounded-full bg-indigo-600 text-white font-bold flex-shrink-0">
                  2
                </span>
                <div className="flex-1">
                  <h4 className="font-bold text-gray-900 mb-2">Get Credentials</h4>
                  <p className="text-gray-600 mb-2">
                    From your Supabase dashboard: <strong>Project Settings → API</strong>
                  </p>
                  <p className="text-gray-600">
                    Copy the <strong>Project URL</strong> and <strong>anon/public key</strong>
                  </p>
                </div>
              </li>

              <li className="flex items-start gap-4">
                <span className="flex items-center justify-center w-10 h-10 rounded-full bg-indigo-600 text-white font-bold flex-shrink-0">
                  3
                </span>
                <div className="flex-1">
                  <h4 className="font-bold text-gray-900 mb-2">Configure Environment</h4>
                  <p className="text-gray-600 mb-3">
                    Create or update <code className="bg-gray-100 px-2 py-1 rounded">website/.env.local</code> with:
                  </p>
                  <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto text-sm">
{`NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...your-key`}
                  </pre>
                </div>
              </li>

              <li className="flex items-start gap-4">
                <span className="flex items-center justify-center w-10 h-10 rounded-full bg-indigo-600 text-white font-bold flex-shrink-0">
                  4
                </span>
                <div className="flex-1">
                  <h4 className="font-bold text-gray-900 mb-2">Create Database Tables</h4>
                  <p className="text-gray-600 mb-2">
                    In Supabase <strong>SQL Editor</strong>, run the SQL from:
                  </p>
                  <p className="text-gray-600">
                    <code className="bg-gray-100 px-2 py-1 rounded">SUPABASE_SETUP.md</code>
                  </p>
                </div>
              </li>

              <li className="flex items-start gap-4">
                <span className="flex items-center justify-center w-10 h-10 rounded-full bg-indigo-600 text-white font-bold flex-shrink-0">
                  5
                </span>
                <div className="flex-1">
                  <h4 className="font-bold text-gray-900 mb-2">Restart Server</h4>
                  <p className="text-gray-600">
                    Stop the dev server and run <code className="bg-gray-100 px-2 py-1 rounded">npm run dev</code> again
                  </p>
                </div>
              </li>
            </ol>

            <div className="mt-8 p-4 bg-indigo-50 rounded-lg">
              <p className="text-sm text-indigo-900">
                📖 <strong>Need detailed instructions?</strong> Check <code>website/SETUP.md</code> and <code>SUPABASE_SETUP.md</code>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

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

  // Landing page - not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold text-gray-900 mb-4">
              Fluent Knowledge Graph
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Visualize your learning journey through an interactive knowledge graph
            </p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => router.push('/login')}
                className="px-8 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700"
              >
                Sign In
              </button>
              <button
                onClick={() => router.push('/signup')}
                className="px-8 py-3 bg-white text-indigo-600 border-2 border-indigo-600 font-medium rounded-lg hover:bg-indigo-50"
              >
                Sign Up
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4">How It Works</h3>
            <ol className="space-y-4 text-gray-600">
              <li className="flex items-start">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 font-bold mr-3 flex-shrink-0">
                  1
                </span>
                <span>Sign up or log in to create your account</span>
              </li>
              <li className="flex items-start">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 font-bold mr-3 flex-shrink-0">
                  2
                </span>
                <span>Install the Fluent browser extension to capture sentences while browsing</span>
              </li>
              <li className="flex items-start">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 font-bold mr-3 flex-shrink-0">
                  3
                </span>
                <span>Use the "Sync" button in the extension to upload your captured data</span>
              </li>
              <li className="flex items-start">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 font-bold mr-3 flex-shrink-0">
                  4
                </span>
                <span>View and explore your knowledge graph automatically updated in real-time</span>
              </li>
            </ol>
          </div>
        </div>
      </div>
    );
  }

  // Landing page - authenticated but no data
  if (!graphData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold text-gray-900 mb-4">
              Fluent Knowledge Graph
            </h1>
            <p className="text-xl text-gray-600">
              Welcome, {user.email}
            </p>
            <button
              onClick={handleSignOut}
              className="mt-4 text-sm text-gray-600 hover:text-gray-900"
            >
              Sign Out
            </button>
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
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Fluent Knowledge Graph
              </h1>
              {user && (
                <p className="text-sm text-gray-600 mt-1">
                  {user.email}
                </p>
              )}
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={handleSignOut}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Sign Out
              </button>
            </div>
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
