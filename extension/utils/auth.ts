/**
 * Authentication Utilities for Extension
 * Manages user authentication state and Supabase session
 */

import { getSupabaseClient } from './supabase';
import type { User, Session } from '@supabase/supabase-js';

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
 * Open login page in browser
 */
export function openLoginPage(): void {
  const loginUrl = import.meta.env.VITE_WEBSITE_URL 
    ? `${import.meta.env.VITE_WEBSITE_URL}/login`
    : 'http://localhost:3001/login';
  
  chrome.tabs.create({ url: loginUrl });
}

/**
 * Listen for auth messages from website
 */
export function initAuthListener(): void {
  // Listen for messages from website
  window.addEventListener('message', async (event) => {
    // Only accept messages from our website
    const websiteUrl = import.meta.env.VITE_WEBSITE_URL || 'http://localhost:3000';
    if (!event.origin.startsWith(websiteUrl)) {
      return;
    }

    if (event.data.type === 'FLUENT_AUTH_SUCCESS' && event.data.session) {
      try {
        await setSessionFromWebsite(event.data.session);
        console.log('[Fluent Auth] Successfully authenticated from website');
      } catch (error) {
        console.error('[Fluent Auth] Failed to set session from website:', error);
      }
    }
  });
}

