/**
 * Sync Service
 * Handles manual synchronization of captured sentences to Supabase
 */

import { getSupabaseClient } from './supabase';
import { getUser } from './auth';
import { exportGraphData, type GraphData } from './graphExport';

export interface SyncStats {
  unsyncedCount: number;
  lastSyncTimestamp: string | null;
}

export interface SyncResult {
  success: boolean;
  sentencesSynced: number;
  nodesSynced: number;
  edgesSynced: number;
  error?: string;
}

const STORAGE_KEYS = {
  LAST_SYNC: 'lastSyncTimestamp',
  UNSYNCED_COUNT: 'unsyncedCount',
};

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
        nodesSynced: 0,
        edgesSynced: 0,
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
        nodesSynced: 0,
        edgesSynced: 0,
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

    // Generate and sync graph data
    const graphData = await exportGraphData();
    const syncGraphResult = await syncGraphData(graphData, user.id);

    // Mark as synced
    await markSentencesAsSynced();

    console.log('[Fluent Sync] Sync completed:', {
      sentences: sentences.length,
      nodes: syncGraphResult.nodesSynced,
      edges: syncGraphResult.edgesSynced,
    });

    return {
      success: true,
      sentencesSynced: sentences.length,
      nodesSynced: syncGraphResult.nodesSynced,
      edgesSynced: syncGraphResult.edgesSynced,
    };
  } catch (error: any) {
    console.error('[Fluent Sync] Sync failed:', error);
    return {
      success: false,
      sentencesSynced: 0,
      nodesSynced: 0,
      edgesSynced: 0,
      error: error.message || 'Sync failed',
    };
  }
}

/**
 * Sync graph data (nodes and edges) to Supabase
 */
async function syncGraphData(graphData: GraphData, userId: string): Promise<{ nodesSynced: number; edgesSynced: number }> {
  const supabase = getSupabaseClient();

  // Clear existing graph data for this user
  await supabase.from('graph_nodes').delete().eq('user_id', userId);
  await supabase.from('graph_edges').delete().eq('user_id', userId);

  let nodesSynced = 0;
  let edgesSynced = 0;

  // Insert nodes
  if (graphData.nodes.length > 0) {
    const nodes = graphData.nodes.map(node => ({
      id: node.id,
      user_id: userId,
      type: node.type,
      label: node.label,
      terms: node.terms || [],
      context: node.context,
      framework: node.framework,
      timestamp: node.timestamp,
      confidence: node.metadata.confidence,
      quiz_completed: node.metadata.quizCompleted || false,
    }));

    const { error, data } = await supabase
      .from('graph_nodes')
      .insert(nodes)
      .select();

    if (error) throw error;
    nodesSynced = data?.length || nodes.length;
  }

  // Insert edges
  if (graphData.edges.length > 0) {
    const edges = graphData.edges.map(edge => ({
      id: edge.id,
      user_id: userId,
      source_id: edge.source,
      target_id: edge.target,
      weight: edge.weight,
      type: edge.type,
    }));

    const { error, data } = await supabase
      .from('graph_edges')
      .insert(edges)
      .select();

    if (error) throw error;
    edgesSynced = data?.length || edges.length;
  }

  return { nodesSynced, edgesSynced };
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

