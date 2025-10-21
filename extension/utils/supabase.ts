/**
 * Supabase Client for Browser Extension
 * Provides Supabase authentication and database access
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ggmpmaxiegezvfqxjknd.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdnbXBtYXhpZWdlenZmcXhqa25kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5MDA1MjIsImV4cCI6MjA3NjQ3NjUyMn0.u-6rw28gxTWkbDjKWJHB02OEbBRi_KLEx781NwrwtRw';

let supabaseClient: SupabaseClient | null = null;

/**
 * Get or create Supabase client instance
 */
export function getSupabaseClient(): SupabaseClient {
  if (supabaseClient) {
    return supabaseClient;
  }

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase credentials not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in wxt.config.ts');
  }

  supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      storage: {
        getItem: async (key: string) => {
          const result = await chrome.storage.local.get(key);
          return result[key] || null;
        },
        setItem: async (key: string, value: string) => {
          await chrome.storage.local.set({ [key]: value });
        },
        removeItem: async (key: string) => {
          await chrome.storage.local.remove(key);
        },
      },
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  });

  return supabaseClient;
}

/**
 * Initialize Supabase client and restore session
 */
export async function initializeSupabase(): Promise<void> {
  const client = getSupabaseClient();
  
  // Restore session from storage
  const { data: { session } } = await client.auth.getSession();
  
  if (session) {
    console.log('[Fluent] Supabase session restored:', session.user.email);
  } else {
    console.log('[Fluent] No active Supabase session');
  }
}

