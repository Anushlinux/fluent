/**
 * Authentication Utilities for Extension
 * Manages user authentication state and Supabase session
 */

import { getSupabaseClient } from './supabase';
import type { User, Session } from '@supabase/supabase-js';

export interface StoredAuthSession {
  access_token: string;
  refresh_token: string;
  user: User;
  timestamp: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  session: Session | null;
}

/**
 * Check if user is authenticated
 */
export async function checkAuthState(): Promise<AuthState> {
  try {
    const supabase = getSupabaseClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (session) {
      return {
        isAuthenticated: true,
        user: session.user,
        session,
      };
    }

    return {
      isAuthenticated: false,
      user: null,
      session: null,
    };
  } catch (error) {
    console.error('[Fluent Auth] Failed to check auth state:', error);
    return {
      isAuthenticated: false,
      user: null,
      session: null,
    };
  }
}

/**
 * Get current session
 */
export async function getSession(): Promise<Session | null> {
  try {
    const supabase = getSupabaseClient();
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  } catch (error) {
    console.error('[Fluent Auth] Failed to get session:', error);
    return null;
  }
}

/**
 * Get current user
 */
export async function getUser(): Promise<User | null> {
  try {
    const supabase = getSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  } catch (error) {
    console.error('[Fluent Auth] Failed to get user:', error);
    return null;
  }
}

/**
 * Sign out user
 */
export async function signOut(): Promise<void> {
  try {
    const supabase = getSupabaseClient();
    await supabase.auth.signOut();
    console.log('[Fluent Auth] User signed out');
  } catch (error) {
    console.error('[Fluent Auth] Failed to sign out:', error);
    throw error;
  }
}

/**
 * Set session from website login
 */
export async function setSessionFromWebsite(session: {
  access_token: string;
  refresh_token: string;
  user: User;
}): Promise<void> {
  try {
    const supabase = getSupabaseClient();
    
    const { error } = await supabase.auth.setSession({
      access_token: session.access_token,
      refresh_token: session.refresh_token,
    });

    if (error) throw error;

    console.log('[Fluent Auth] Session set from website:', session.user.email);
  } catch (error) {
    console.error('[Fluent Auth] Failed to set session:', error);
    throw error;
  }
}

/**
 * Restore session from chrome.storage on startup
 */
export async function restoreSession(): Promise<boolean> {
  try {
    const result = await chrome.storage.local.get('fluentAuthSession');
    const storedSession = result.fluentAuthSession;
    
    if (!storedSession) {
      console.log('[Fluent Auth] No stored session found');
      return false;
    }
    
    // Check if session is not too old (e.g., 30 days)
    const sessionAge = Date.now() - new Date(storedSession.timestamp).getTime();
    const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
    
    if (sessionAge > maxAge) {
      console.log('[Fluent Auth] Stored session expired');
      await chrome.storage.local.remove('fluentAuthSession');
      return false;
    }
    
    // Restore the session
    await setSessionFromWebsite(storedSession);
    console.log('[Fluent Auth] Session restored from storage');
    return true;
  } catch (error) {
    console.error('[Fluent Auth] Failed to restore session:', error);
    return false;
  }
}

/**
 * Open login page in browser
 */
export function openLoginPage(): void {
  const loginUrl = import.meta.env.VITE_WEBSITE_URL 
    ? `${import.meta.env.VITE_WEBSITE_URL}/login`
    : 'http://localhost:3001/login';
  
  chrome.tabs.create({ url: loginUrl });
}


