/**
 * Supabase Client Configuration
 * Provides browser and server-side Supabase clients
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

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
  }

  browserClient = createBrowserClient(supabaseUrl, supabaseAnonKey);

  return browserClient;
}

// Export a convenience instance
export const supabase = typeof window !== 'undefined' ? getSupabaseBrowserClient() : null;

