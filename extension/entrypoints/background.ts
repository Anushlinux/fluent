/**
 * Background service worker for Fluent extension
 * Handles badge updates and storage changes
 */

import { defineBackground } from 'wxt/sandbox';
import { getUniqueTermsToday } from '../utils/stats';

export default defineBackground({
  main() {
  console.log('[Fluent] Background script loaded');

  // Update badge on extension install
  chrome.runtime.onInstalled.addListener(() => {
    console.log('[Fluent] Extension installed');
    updateBadge();
    createContextMenu();
  });

  // Update badge when storage changes
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'local' && changes.logs) {
      console.log('[Fluent] Logs updated, updating badge');
      updateBadge();
    }
  });

  // Update badge periodically (every minute) to handle day changes
  setInterval(() => {
    updateBadge();
  }, 60000);

  // Initial badge update and context menu creation
  updateBadge();
  createContextMenu();

  // Restore session on startup
  restoreAuthSession();

  // Start periodic gap detection (every 5 minutes)
  startGapDetection();

  // Listen for auth messages from content script
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'setAuthSession') {
      handleAuthSession(message.session, sender.tab?.id)
        .then(() => {
          sendResponse({ success: true });
        })
        .catch((error) => {
          console.error('[Fluent] Failed to set auth session:', error);
          sendResponse({ success: false, error: error.message });
        });
      return true; // Required for async response
    }
    
    // Handle agent API calls from content script
    if (message.action === 'callAgent') {
      callAgentAPI(message.data)
        .then(data => sendResponse({ success: true, data }))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true; // Keep channel open for async response
    }
  });
  },
});

/**
 * Call agent API endpoint
 */
async function callAgentAPI(data: {
  sentence: string;
  url: string;
  user_id: string;
}): Promise<any> {
  const response = await fetch('http://localhost:8010/explain-sentence', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    throw new Error(`Agent returned ${response.status}`);
  }

  return await response.json();
}

/**
 * Restore auth session on startup
 */
async function restoreAuthSession(): Promise<void> {
  try {
    const { restoreSession } = await import('../utils/auth');
    const restored = await restoreSession();
    if (restored) {
      console.log('[Fluent] Auth session restored on startup');
    }
  } catch (error) {
    console.error('[Fluent] Failed to restore auth session:', error);
  }
}

/**
 * Handle auth session from content script
 */
async function handleAuthSession(session: any, tabId?: number): Promise<void> {
  try {
    console.log('[Fluent Background] Setting auth session');
    
    // Import setSessionFromWebsite dynamically
    const { setSessionFromWebsite } = await import('../utils/auth');
    
    // Set the session in Supabase
    await setSessionFromWebsite(session);
    
    // Store session in chrome.storage for persistence
    await chrome.storage.local.set({
      fluentAuthSession: {
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        user: session.user,
        timestamp: new Date().toISOString(),
      },
    });
    
    console.log('[Fluent Background] Auth session set successfully');
    
    // Close the login tab if it exists
    if (tabId) {
      await chrome.tabs.remove(tabId);
      console.log('[Fluent Background] Login tab closed');
    }
    
    // Notify all extension pages to refresh auth state
    chrome.runtime.sendMessage({ action: 'authStateChanged' });
  } catch (error) {
    console.error('[Fluent Background] Error handling auth session:', error);
    throw error;
  }
}

/**
 * Create context menu for sentence capture
 */
function createContextMenu(): void {
  try {
    // Remove existing menu items first
    chrome.contextMenus.removeAll(() => {
      // Create new context menu item
      chrome.contextMenus.create({
        id: 'fluent-capture-sentence',
        title: 'Capture with Fluent',
        contexts: ['selection'],
      });
      
      console.log('[Fluent] Context menu created');
    });
    
    // Handle context menu clicks
    chrome.contextMenus.onClicked.addListener((info, tab) => {
      if (info.menuItemId === 'fluent-capture-sentence' && tab?.id) {
        // Send message to content script to show capture popover
        chrome.tabs.sendMessage(tab.id, { 
          action: 'captureSentence'
        }, () => {
          if (chrome.runtime.lastError) {
            console.error('[Fluent] Error sending capture message:', chrome.runtime.lastError);
          } else {
            console.log('[Fluent] Capture message sent successfully');
          }
        });
      }
    });
  } catch (error) {
    console.error('[Fluent] Failed to create context menu:', error);
  }
}

/**
 * Update the extension badge with today's unique terms count
 */
async function updateBadge(): Promise<void> {
  try {
    const count = await getUniqueTermsToday();
    
    // Set badge text
    if (count > 0) {
      await chrome.action.setBadgeText({ text: count.toString() });
      await chrome.action.setBadgeBackgroundColor({ color: '#667eea' });
    } else {
      await chrome.action.setBadgeText({ text: '' });
    }
    
    console.log(`[Fluent] Badge updated: ${count} terms today`);
  } catch (error) {
    console.error('[Fluent] Failed to update badge:', error);
  }
}

/**
 * Start periodic gap detection
 */
function startGapDetection(): void {
  console.log('[Fluent] Starting periodic gap detection (every 5 minutes)');
  
  // Run immediately on startup
  checkForGaps();
  
  // Then every 5 minutes
  setInterval(() => {
    checkForGaps();
  }, 5 * 60 * 1000); // 5 minutes
}

/**
 * Check for knowledge gaps via agent
 */
async function checkForGaps(): Promise<void> {
  try {
    // Get authenticated user
    const authData = await chrome.storage.local.get('fluentAuthSession');
    const userId = authData?.fluentAuthSession?.user?.id;
    
    if (!userId) {
      console.log('[Fluent] Gap check skipped: Not authenticated');
      return;
    }
    
    // Get user XP
    const statsData = await chrome.storage.local.get('fluentStats');
    const userXp = statsData?.fluentStats?.xp || 0;
    
    // Call agent detect-gaps endpoint
    const response = await fetch('http://localhost:8010/detect-gaps', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: userId,
        user_xp: userXp,
        history_context: ''
      })
    });
    
    if (!response.ok) {
      console.warn('[Fluent] Gap detection failed:', response.status);
      return;
    }
    
    const data = await response.json();
    
    if (data.gaps && data.gaps.length > 0) {
      console.log(`[Fluent] Detected ${data.gaps.length} knowledge gaps`);
      
      // Store gaps for popup to display
      await chrome.storage.local.set({ fluentGaps: data });
      
      // Update badge with '!' indicator
      await chrome.action.setBadgeText({ text: '!' });
      await chrome.action.setBadgeBackgroundColor({ color: '#f59e0b' }); // Orange for attention
    } else {
      console.log('[Fluent] No knowledge gaps detected');
      // Clear any existing gaps
      await chrome.storage.local.remove('fluentGaps');
    }
  } catch (error) {
    // Silently fail - agent might be offline
    console.debug('[Fluent] Gap check skipped (agent offline):', error);
  }
}

