/**
 * Supabase Client Configuration
 * Provides browser and server-side Supabase clients
 * Gracefully handles missing configuration for initial setup
 */

import { createBrowserClient } from '@supabase/ssr';

// Create a singleton browser client
let browserClient: ReturnType<typeof createBrowserClient> | null = null;

export function getSupabaseBrowserClient() {
  if (browserClient) {
    return browserClient;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Check if Supabase is configured
  if (!supabaseUrl || !supabaseAnonKey || 
      supabaseUrl === 'https://your-project.supabase.co' ||
      supabaseUrl === 'your_supabase_url_here' ||
      supabaseUrl.includes('your-') ||
      supabaseUrl.includes('your_') ||
      supabaseAnonKey === 'your-anon-key' ||
      supabaseAnonKey === 'your_supabase_anon_key_here' ||
      supabaseAnonKey.includes('your-') ||
      supabaseAnonKey.includes('your_')) {
    console.warn('[Supabase] Not configured. Graph features will use local storage only.');
    return null;
  }

  try {
    browserClient = createBrowserClient(supabaseUrl, supabaseAnonKey);
    return browserClient;
  } catch (error) {
    console.error('[Supabase] Failed to initialize:', error);
    return null;
  }
}

// Export a convenience instance
export const supabase = typeof window !== 'undefined' ? getSupabaseBrowserClient() : null;

// Helper to check if Supabase is available
export function isSupabaseConfigured(): boolean {
  return getSupabaseBrowserClient() !== null;
}

