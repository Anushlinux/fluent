/**
 * Sync Service
 * Handles manual synchronization of captured sentences to Supabase
 */

import { getSupabaseClient } from './supabase';
import { getUser } from './auth';

export interface SyncStats {
  unsyncedCount: number;
  lastSyncTimestamp: string | null;
}

export interface SyncResult {
  success: boolean;
  sentencesSynced: number;
  error?: string;
}

const STORAGE_KEYS = {
  LAST_SYNC: 'lastSyncTimestamp',
  UNSYNCED_COUNT: 'unsyncedCount',
};

interface CapturedSentence {
  id: string;
  sentence: string;
  terms: string[];
  context: string;
  framework?: string;
  secondaryContext?: string;
  confidence: number;
  timestamp: string;
}

/**
 * Sync a single sentence immediately to Supabase
 * This is called right after sentence capture for real-time sync
 */
export async function syncSentenceImmediately(sentence: CapturedSentence): Promise<{ success: boolean; error?: string }> {
  try {
    // Check authentication
    const user = await getUser();
    if (!user) {
      return {
        success: false,
        error: 'Please log in to sync sentences',
      };
    }

    const supabase = getSupabaseClient();

    // Prepare sentence data for Supabase
    const sentenceData = {
      id: sentence.id,
      user_id: user.id,
      sentence: sentence.sentence,
      terms: sentence.terms || [],
      context: sentence.context,
      framework: sentence.framework,
      secondary_context: sentence.secondaryContext,
      confidence: sentence.confidence,
      timestamp: sentence.timestamp,
      synced_at: new Date().toISOString(),
    };

    // Insert into Supabase
    const { error } = await supabase
      .from('captured_sentences')
      .upsert(sentenceData, { onConflict: 'id' });

    if (error) {
      console.error('[Fluent Sync] Failed to sync sentence:', error);
      return {
        success: false,
        error: error.message || 'Failed to sync to database',
      };
    }

    console.log('[Fluent Sync] Sentence synced successfully:', sentence.id);
    return { success: true };
  } catch (error: any) {
    console.error('[Fluent Sync] Exception during sync:', error);
    return {
      success: false,
      error: error.message || 'Network error. Please try again.',
    };
  }
}

/**
 * Sync captured sentences to Supabase
 */
export async function syncCapturedSentences(): Promise<SyncResult> {
  try {
    // Check authentication
    const user = await getUser();
    if (!user) {
      return {
        success: false,
        sentencesSynced: 0,
        error: 'User not authenticated',
      };
    }

    const supabase = getSupabaseClient();

    // Get captured sentences from local storage
    const result = await chrome.storage.local.get('fluentSentenceLog');
    const sentences = result.fluentSentenceLog || [];

    if (sentences.length === 0) {
      return {
        success: true,
        sentencesSynced: 0,
      };
    }

    // Insert sentences into Supabase
    const sentencesData = sentences.map((sentence: any) => ({
      id: sentence.id,
      user_id: user.id,
      sentence: sentence.sentence,
      terms: sentence.terms || [],
      context: sentence.context,
      framework: sentence.framework,
      secondary_context: sentence.secondaryContext,
      confidence: sentence.confidence,
      timestamp: sentence.timestamp,
      synced_at: new Date().toISOString(),
    }));

    // Insert in batches of 100 to avoid payload size limits
    const batchSize = 100;
    for (let i = 0; i < sentencesData.length; i += batchSize) {
      const batch = sentencesData.slice(i, i + batchSize);
      const { error } = await supabase
        .from('captured_sentences')
        .upsert(batch, { onConflict: 'id' });

      if (error) throw error;
    }

    // Mark as synced
    await markSentencesAsSynced();

    console.log('[Fluent Sync] Sync completed:', {
      sentences: sentences.length,
    });

    return {
      success: true,
      sentencesSynced: sentences.length,
    };
  } catch (error: any) {
    console.error('[Fluent Sync] Sync failed:', error);
    return {
      success: false,
      sentencesSynced: 0,
      error: error.message || 'Sync failed',
    };
  }
}

/**
 * Mark sentences as synced and update sync stats
 */
export async function markSentencesAsSynced(): Promise<void> {
  const now = new Date().toISOString();
  
  await chrome.storage.local.set({
    [STORAGE_KEYS.LAST_SYNC]: now,
    [STORAGE_KEYS.UNSYNCED_COUNT]: 0,
  });

  console.log('[Fluent Sync] Marked sentences as synced');
}

/**
 * Get sync statistics
 */
export async function getSyncStats(): Promise<SyncStats> {
  try {
    const result = await chrome.storage.local.get([
      'fluentSentenceLog',
      STORAGE_KEYS.LAST_SYNC,
      STORAGE_KEYS.UNSYNCED_COUNT,
    ]);

    const sentences = result.fluentSentenceLog || [];
    const lastSync = result[STORAGE_KEYS.LAST_SYNC] || null;

    return {
      unsyncedCount: sentences.length,
      lastSyncTimestamp: lastSync,
    };
  } catch (error) {
    console.error('[Fluent Sync] Failed to get sync stats:', error);
    return {
      unsyncedCount: 0,
      lastSyncTimestamp: null,
    };
  }
}

/**
 * Update unsynced count (called when new sentences are captured)
 */
export async function updateUnsyncedCount(count: number): Promise<void> {
  await chrome.storage.local.set({
    [STORAGE_KEYS.UNSYNCED_COUNT]: count,
  });
}

