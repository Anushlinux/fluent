'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { GraphData } from '@/lib/graphTypes';
import { getGraphData, saveGraphData, subscribeToGraphUpdates, getCapturedSentences, processAndSaveNewSentences } from '@/lib/graphStorage';
import { getSupabaseBrowserClient } from '@/lib/supabase';
import GraphViewer from '@/components/GraphViewer';
import QueryControls from '@/components/QueryControls';
import StatsPanel from '@/components/StatsPanel';
import { BrainScene } from '@/components/three/BrainScene';

export default function Home() {
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [filteredData, setFilteredData] = useState<GraphData | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
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
    try {
      // Try to load existing graph data
      const data = await getGraphData();
      
      if (data) {
        setGraphData(data);
        setFilteredData(data);
      } else {
        // No graph data found, check if there are captured sentences to process
        const sentences = await getCapturedSentences();
        
        if (sentences.length > 0) {
          console.log(`[Fluent] Found ${sentences.length} unprocessed sentences, processing...`);
          
          // Process sentences into graph data
          await processAndSaveNewSentences();
          
          // Load the newly created graph data
          const newData = await getGraphData();
          if (newData) {
            setGraphData(newData);
            setFilteredData(newData);
          }
        }
      }
    } catch (error) {
      console.error('[Fluent] Error loading data:', error);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      // Process any new sentences
      await processAndSaveNewSentences();
      
      // Reload graph data
      const newData = await getGraphData();
      if (newData) {
        setGraphData(newData);
        setFilteredData(newData);
      }
    } catch (error) {
      console.error('[Fluent] Error refreshing data:', error);
    } finally {
      setRefreshing(false);
    }
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
      <div className="min-h-screen bg-black p-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-5xl font-bold text-white mb-4">
              Fluent Knowledge Graph
            </h1>
            <p className="text-xl text-white/80">
              Setup Required
            </p>
          </div>

          <div className="bg-black border-2 border-yellow-500/50 rounded-2xl p-8 mb-8">
            <div className="flex items-start gap-4">
              <div className="text-4xl">⚠️</div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-white mb-4">
                  Supabase Configuration Missing
                </h2>
                <p className="text-white/80 mb-4">
                  The website requires Supabase to store and sync your knowledge graph data.
                  Please follow the setup instructions below:
                </p>
              </div>
            </div>
          </div>

          <div className="bg-black border border-white/20 rounded-2xl p-8">
            <h3 className="text-xl font-bold text-white mb-6">Quick Setup (5 minutes)</h3>
            
            <ol className="space-y-6">
              <li className="flex items-start gap-4">
                <span className="flex items-center justify-center w-10 h-10 rounded-full border border-white/30 text-white font-bold flex-shrink-0">
                  1
                </span>
                <div className="flex-1">
                  <h4 className="font-bold text-white mb-2">Create Supabase Project</h4>
                  <p className="text-white/70 mb-2">
                    Go to <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="text-white hover:underline">supabase.com</a> and create a new project
                  </p>
                </div>
              </li>

              <li className="flex items-start gap-4">
                <span className="flex items-center justify-center w-10 h-10 rounded-full border border-white/30 text-white font-bold flex-shrink-0">
                  2
                </span>
                <div className="flex-1">
                  <h4 className="font-bold text-white mb-2">Get Credentials</h4>
                  <p className="text-white/70 mb-2">
                    From your Supabase dashboard: <strong>Project Settings → API</strong>
                  </p>
                  <p className="text-white/70">
                    Copy the <strong>Project URL</strong> and <strong>anon/public key</strong>
                  </p>
                </div>
              </li>

              <li className="flex items-start gap-4">
                <span className="flex items-center justify-center w-10 h-10 rounded-full border border-white/30 text-white font-bold flex-shrink-0">
                  3
                </span>
                <div className="flex-1">
                  <h4 className="font-bold text-white mb-2">Configure Environment</h4>
                  <p className="text-white/70 mb-3">
                    Create or update <code className="bg-white/10 px-2 py-1 rounded">website/.env.local</code> with:
                  </p>
                  <pre className="bg-white/10 text-green-400 p-4 rounded-lg overflow-x-auto text-sm border border-white/20">
{`NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...your-key`}
                  </pre>
                </div>
              </li>

              <li className="flex items-start gap-4">
                <span className="flex items-center justify-center w-10 h-10 rounded-full border border-white/30 text-white font-bold flex-shrink-0">
                  4
                </span>
                <div className="flex-1">
                  <h4 className="font-bold text-white mb-2">Create Database Tables</h4>
                  <p className="text-white/70 mb-2">
                    In Supabase <strong>SQL Editor</strong>, run the SQL from:
                  </p>
                  <p className="text-white/70">
                    <code className="bg-white/10 px-2 py-1 rounded">SUPABASE_SETUP.md</code>
                  </p>
                </div>
              </li>

              <li className="flex items-start gap-4">
                <span className="flex items-center justify-center w-10 h-10 rounded-full border border-white/30 text-white font-bold flex-shrink-0">
                  5
                </span>
                <div className="flex-1">
                  <h4 className="font-bold text-white mb-2">Restart Server</h4>
                  <p className="text-white/70">
                    Stop the dev server and run <code className="bg-white/10 px-2 py-1 rounded">npm run dev</code> again
                  </p>
                </div>
              </li>
            </ol>

            <div className="mt-8 p-4 bg-white/5 border border-white/20 rounded-lg">
              <p className="text-sm text-white/80">
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
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white/80">Loading...</p>
        </div>
      </div>
    );
  }

  // Landing page - not authenticated
  if (!user) {
    return (
      <div className="relative min-h-screen bg-black">
        {/* Three.js Brain Scene - Full Screen */}
        <BrainScene className="absolute inset-0 w-full h-screen" />

        {/* Overlay Content */}
        <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-8">
          <div className="text-center max-w-4xl">
            <h1 className="text-6xl md:text-7xl font-bold text-white mb-6 tracking-tight">
              Fluent Knowledge Graph
            </h1>
            <p className="text-xl md:text-2xl text-white/80 mb-12 max-w-2xl mx-auto">
              Visualize your learning journey through an interactive knowledge graph
            </p>
            <div className="flex gap-6 justify-center">
              <button
                onClick={() => router.push('/login')}
                className="px-10 py-4 bg-white text-black font-semibold rounded-lg hover:bg-gray-200 transition-colors duration-300 text-lg"
              >
                Sign In
              </button>
              <button
                onClick={() => router.push('/signup')}
                className="px-10 py-4 bg-transparent text-white border-2 border-white font-semibold rounded-lg hover:bg-white/10 transition-colors duration-300 text-lg"
              >
                Sign Up
              </button>
            </div>
          </div>

          {/* Scroll Indicator */}
          <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2 animate-bounce">
            <div className="text-white/60 text-sm mb-2">Scroll to learn more</div>
            <svg
              className="w-6 h-6 mx-auto text-white/60"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 14l-7 7m0 0l-7-7m7 7V3"
              />
            </svg>
          </div>
        </div>

        {/* How It Works Section */}
        <div className="relative z-10 bg-black border-t border-white/10 px-8 py-24">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl font-bold text-white text-center mb-16">How It Works</h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-black border border-white/20 rounded-lg p-8 hover:border-white/40 transition-colors duration-300">
                <div className="text-5xl font-bold text-white/20 mb-4">01</div>
                <h3 className="text-xl font-semibold text-white mb-3">Create Your Account</h3>
                <p className="text-white/70">
                  Sign up or log in to start building your personalized knowledge graph
                </p>
              </div>

              <div className="bg-black border border-white/20 rounded-lg p-8 hover:border-white/40 transition-colors duration-300">
                <div className="text-5xl font-bold text-white/20 mb-4">02</div>
                <h3 className="text-xl font-semibold text-white mb-3">Capture Knowledge</h3>
                <p className="text-white/70">
                  Install the Fluent browser extension to capture sentences while browsing
                </p>
              </div>

              <div className="bg-black border border-white/20 rounded-lg p-8 hover:border-white/40 transition-colors duration-300">
                <div className="text-5xl font-bold text-white/20 mb-4">03</div>
                <h3 className="text-xl font-semibold text-white mb-3">Sync Your Data</h3>
                <p className="text-white/70">
                  Use the sync button in the extension to upload your captured knowledge
                </p>
              </div>

              <div className="bg-black border border-white/20 rounded-lg p-8 hover:border-white/40 transition-colors duration-300">
                <div className="text-5xl font-bold text-white/20 mb-4">04</div>
                <h3 className="text-xl font-semibold text-white mb-3">Explore Connections</h3>
                <p className="text-white/70">
                  View and explore your knowledge graph with real-time updates and insights
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Landing page - authenticated but no data
  if (!graphData) {
    return (
      <div className="min-h-screen bg-black p-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold text-white mb-4">
              Fluent Knowledge Graph
            </h1>
            <p className="text-xl text-white/80">
              Welcome, {user.email}
            </p>
            <button
              onClick={handleSignOut}
              className="mt-4 text-sm text-white/60 hover:text-white"
            >
              Sign Out
            </button>
          </div>

          <div className="bg-black border border-white/20 rounded-2xl p-8 mb-8">
            <h2 className="text-2xl font-bold text-white mb-6">Get Started</h2>
            
            {/* File Upload */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-white/90 mb-2">
                Upload Graph Data
              </label>
              <div className="flex items-center justify-center w-full">
                <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-white/20 border-dashed rounded-lg cursor-pointer bg-black hover:border-white/40">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <svg
                      className="w-12 h-12 mb-4 text-white/40"
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
                    <p className="mb-2 text-sm text-white/70">
                      <span className="font-semibold">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-white/60">JSON file exported from Fluent extension</p>
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
            <div className="text-center pt-6 border-t border-white/10">
              <p className="text-sm text-white/60 mb-4">
                Don't have data yet? Try the demo
              </p>
              <button
                onClick={loadDemoData}
                disabled={uploading}
                className="inline-flex items-center px-6 py-3 border border-white text-base font-medium rounded-lg text-white bg-transparent hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white disabled:opacity-50"
              >
                {uploading ? 'Loading...' : 'Load Demo Data'}
              </button>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-black border border-white/20 rounded-2xl p-8">
            <h3 className="text-xl font-bold text-white mb-4">How It Works</h3>
            <ol className="space-y-4 text-white/70">
              <li className="flex items-start">
                <span className="flex items-center justify-center w-8 h-8 rounded-full border border-white/30 text-white font-bold mr-3 flex-shrink-0">
                  1
                </span>
                <span>Use the Fluent browser extension to capture sentences while browsing</span>
              </li>
              <li className="flex items-start">
                <span className="flex items-center justify-center w-8 h-8 rounded-full border border-white/30 text-white font-bold mr-3 flex-shrink-0">
                  2
                </span>
                <span>Export your data using the "Export for Graph" button in the extension</span>
              </li>
              <li className="flex items-start">
                <span className="flex items-center justify-center w-8 h-8 rounded-full border border-white/30 text-white font-bold mr-3 flex-shrink-0">
                  3
                </span>
                <span>Upload the JSON file here to visualize your knowledge graph</span>
              </li>
              <li className="flex items-start">
                <span className="flex items-center justify-center w-8 h-8 rounded-full border border-white/30 text-white font-bold mr-3 flex-shrink-0">
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
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="bg-black border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">
                Fluent Knowledge Graph
              </h1>
              {user && (
                <p className="text-sm text-white/60 mt-1">
                  {user.email}
                </p>
              )}
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="px-4 py-2 text-sm font-medium text-black bg-white rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <svg 
                  className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {refreshing ? 'Refreshing...' : 'Refresh Graph'}
              </button>
              <button
                onClick={handleSignOut}
                className="px-4 py-2 text-sm font-medium text-white bg-transparent border border-white/30 rounded-lg hover:bg-white/10"
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
