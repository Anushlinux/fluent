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

  // Initial badge update
  updateBadge();
  },
});

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

