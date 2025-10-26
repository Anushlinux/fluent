/**
 * Graph Storage Layer
 * Uses Supabase for persistent cloud storage with real-time sync
 * Falls back to local storage when Supabase is not configured
 */

import { getSupabaseBrowserClient, isSupabaseConfigured } from './supabase';
import type { GraphData, GraphNode, GraphEdge, CapturedSentence } from './graphTypes';
import { processSentencesIntoGraph, processNewSentencesIncremental } from './graphProcessor';

const GRAPH_DATA_KEY = 'fluent_graph_data';
const SENTENCES_KEY = 'fluent_captured_sentences';
const LAST_PROCESSED_KEY = 'fluent_last_processed';

/**
 * Save graph data to Supabase or local storage
 */
export async function saveGraphData(data: GraphData): Promise<void> {
  try {
    if (isSupabaseConfigured()) {
      await saveToSupabase(data);
    } else {
      await saveToLocalStorage(data);
    }
    console.log('[Graph Storage] Saved graph data:', data.stats);
  } catch (error) {
    console.error('[Graph Storage] Failed to save:', error);
    throw error;
  }
}

/**
 * Save to Supabase
 */
async function saveToSupabase(data: GraphData): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) throw new Error('Supabase not configured');
  
  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError) {
    throw new Error(`Authentication error: ${userError.message}`);
  }
  if (!user) {
    throw new Error('User not authenticated. Please sign in first.');
  }

  // Delete existing nodes and edges for this user
  const { error: deleteNodesError } = await supabase.from('graph_nodes').delete().eq('user_id', user.id);
  if (deleteNodesError) {
    throw new Error(`Failed to clear existing nodes: ${deleteNodesError.message}`);
  }

  const { error: deleteEdgesError } = await supabase.from('graph_edges').delete().eq('user_id', user.id);
  if (deleteEdgesError) {
    throw new Error(`Failed to clear existing edges: ${deleteEdgesError.message}`);
  }

  // Insert nodes
  if (data.nodes.length > 0) {
    const nodes = data.nodes.map(node => ({
      id: node.id,
      user_id: user.id,
      type: node.type,
      label: node.label,
      terms: node.terms || [],
      context: node.context,
      framework: node.framework,
      timestamp: node.timestamp,
      confidence: node.metadata.confidence,
      quiz_completed: node.metadata.quizCompleted || false,
    }));

    const { error: nodesError } = await supabase
      .from('graph_nodes')
      .insert(nodes);

    if (nodesError) throw new Error(`Failed to insert nodes: ${nodesError.message}`);
  }

  // Insert edges
  if (data.edges.length > 0) {
    const edges = data.edges.map(edge => ({
      id: edge.id,
      user_id: user.id,
      source_id: edge.source,
      target_id: edge.target,
      weight: edge.weight,
      type: edge.type,
    }));

    const { error: edgesError } = await supabase
      .from('graph_edges')
      .insert(edges);

    if (edgesError) throw new Error(`Failed to insert edges: ${edgesError.message}`);
  }
}

/**
 * Save to local storage
 */
async function saveToLocalStorage(data: GraphData): Promise<void> {
  if (typeof window === 'undefined') return;
  
  localStorage.setItem(GRAPH_DATA_KEY, JSON.stringify(data));
}

/**
 * Get graph data from Supabase or local storage
 */
export async function getGraphData(): Promise<GraphData | null> {
  try {
    if (isSupabaseConfigured()) {
      return await getFromSupabase();
    } else {
      return await getFromLocalStorage();
    }
  } catch (error) {
    console.error('[Graph Storage] Failed to load:', error);
    return null;
  }
}

/**
 * Get from Supabase
 */
async function getFromSupabase(): Promise<GraphData | null> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return null;
  
  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError) {
    console.error('[Graph Storage] Auth error:', userError.message);
    return null;
  }
  if (!user) {
    return null;
  }

  // Fetch nodes
  const { data: nodesData, error: nodesError } = await supabase
    .from('graph_nodes')
    .select('*')
    .eq('user_id', user.id);

  if (nodesError) {
    console.error('[Graph Storage] Failed to fetch nodes:', nodesError.message);
    throw new Error(`Failed to fetch nodes: ${nodesError.message}`);
  }

  // Fetch edges
  const { data: edgesData, error: edgesError } = await supabase
    .from('graph_edges')
    .select('*')
    .eq('user_id', user.id);

  if (edgesError) {
    console.error('[Graph Storage] Failed to fetch edges:', edgesError.message);
    throw new Error(`Failed to fetch edges: ${edgesError.message}`);
  }

  if (!nodesData || nodesData.length === 0) {
    return null;
  }

  // Transform to GraphData format
  const nodes: GraphNode[] = nodesData.map((node: any) => ({
    id: node.id,
    type: node.type as 'topic' | 'sentence',
    label: node.label,
    terms: node.terms || [],
    context: node.context,
    framework: node.framework,
    timestamp: node.timestamp,
    metadata: {
      confidence: node.confidence || 0,
      quizCompleted: node.quiz_completed || false,
    },
  }));

  const edges: GraphEdge[] = (edgesData || []).map((edge: any) => ({
    id: edge.id,
    source: edge.source_id,
    target: edge.target_id,
    weight: parseFloat(edge.weight),
    type: edge.type as 'term-match' | 'context-match' | 'both',
  }));

  // Calculate stats
  const sentenceCount = nodes.filter(n => n.type === 'sentence').length;
  const topicCount = nodes.filter(n => n.type === 'topic').length;
  const avgLinkStrength = edges.length > 0
    ? edges.reduce((sum, e) => sum + e.weight, 0) / edges.length
    : 0;

  return {
    nodes,
    edges,
    stats: {
      totalSentences: sentenceCount,
      topicCount,
      avgLinkStrength: Math.round(avgLinkStrength * 100) / 100,
    },
  };
}

/**
 * Get from local storage
 */
async function getFromLocalStorage(): Promise<GraphData | null> {
  if (typeof window === 'undefined') return null;
  
  const data = localStorage.getItem(GRAPH_DATA_KEY);
  if (!data) return null;
  
  try {
    return JSON.parse(data);
  } catch (error) {
    console.error('[Graph Storage] Failed to parse local data:', error);
    return null;
  }
}

/**
 * Merge new graph data with existing data (append mode)
 */
export async function mergeGraphData(newData: GraphData): Promise<void> {
  try {
    if (isSupabaseConfigured()) {
      await mergeToSupabase(newData);
    } else {
      await mergeToLocalStorage(newData);
    }
  } catch (error) {
    console.error('[Graph Storage] Failed to merge:', error);
    throw error;
  }
}

/**
 * Merge to Supabase
 */
async function mergeToSupabase(newData: GraphData): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) throw new Error('Supabase not configured');
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  const existingData = await getFromSupabase();
  
  if (!existingData) {
    // No existing data, just save new data
    await saveToSupabase(newData);
    return;
  }
  
  // Merge nodes (avoid duplicates by ID)
  const existingNodeIds = new Set(existingData.nodes.map(n => n.id));
  const newNodes = newData.nodes.filter(n => !existingNodeIds.has(n.id));
  
  // Insert only new nodes
  if (newNodes.length > 0) {
    const nodes = newNodes.map(node => ({
      id: node.id,
      user_id: user.id,
      type: node.type,
      label: node.label,
      terms: node.terms || [],
      context: node.context,
      framework: node.framework,
      timestamp: node.timestamp,
      confidence: node.metadata.confidence,
      quiz_completed: node.metadata.quizCompleted || false,
    }));

    const { error: nodesError } = await supabase
      .from('graph_nodes')
      .insert(nodes);

    if (nodesError) throw nodesError;
  }
  
  // Merge edges (avoid duplicates by ID)
  const existingEdgeIds = new Set(existingData.edges.map(e => e.id));
  const newEdges = newData.edges.filter(e => !existingEdgeIds.has(e.id));
  
  // Insert only new edges
  if (newEdges.length > 0) {
    const edges = newEdges.map(edge => ({
      id: edge.id,
      user_id: user.id,
      source_id: edge.source,
      target_id: edge.target,
      weight: edge.weight,
      type: edge.type,
    }));

    const { error: edgesError } = await supabase
      .from('graph_edges')
      .insert(edges);

    if (edgesError) throw edgesError;
  }
  
  console.log('[Graph Storage] Merged data. New nodes:', newNodes.length, 'New edges:', newEdges.length);
}

/**
 * Merge to local storage
 */
async function mergeToLocalStorage(newData: GraphData): Promise<void> {
  if (typeof window === 'undefined') return;
  
  const existingData = await getFromLocalStorage();
  
  if (!existingData) {
    // No existing data, just save new data
    await saveToLocalStorage(newData);
    return;
  }
  
  // Merge nodes (avoid duplicates by ID)
  const existingNodeIds = new Set(existingData.nodes.map(n => n.id));
  const newNodes = newData.nodes.filter(n => !existingNodeIds.has(n.id));
  
  // Merge edges (avoid duplicates by ID)
  const existingEdgeIds = new Set(existingData.edges.map(e => e.id));
  const newEdges = newData.edges.filter(e => !existingEdgeIds.has(e.id));
  
  // Create merged data
  const mergedData: GraphData = {
    nodes: [...existingData.nodes, ...newNodes],
    edges: [...existingData.edges, ...newEdges],
    stats: {
      totalSentences: existingData.stats.totalSentences + newData.stats.totalSentences,
      topicCount: existingData.stats.topicCount + newData.stats.topicCount,
      avgLinkStrength: (existingData.stats.avgLinkStrength + newData.stats.avgLinkStrength) / 2,
    },
  };
  
  await saveToLocalStorage(mergedData);
  console.log('[Graph Storage] Merged data. New nodes:', newNodes.length, 'New edges:', newEdges.length);
}

/**
 * Clear all stored graph data
 */
export async function clearGraphData(): Promise<void> {
  try {
    if (isSupabaseConfigured()) {
      await clearFromSupabase();
    } else {
      await clearFromLocalStorage();
    }
    console.log('[Graph Storage] Cleared graph data');
  } catch (error) {
    console.error('[Graph Storage] Failed to clear:', error);
    throw error;
  }
}

/**
 * Clear from Supabase
 */
async function clearFromSupabase(): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) throw new Error('Supabase not configured');
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  await supabase.from('graph_nodes').delete().eq('user_id', user.id);
  await supabase.from('graph_edges').delete().eq('user_id', user.id);
}

/**
 * Clear from local storage
 */
async function clearFromLocalStorage(): Promise<void> {
  if (typeof window === 'undefined') return;
  
  localStorage.removeItem(GRAPH_DATA_KEY);
  localStorage.removeItem(SENTENCES_KEY);
  localStorage.removeItem(LAST_PROCESSED_KEY);
}

/**
 * Check if graph data exists
 */
export async function hasGraphData(): Promise<boolean> {
  try {
    const data = await getGraphData();
    return data !== null && data.nodes.length > 0;
  } catch (error) {
    return false;
  }
}

/**
 * Fetch all captured sentences for current user
 */
export async function getCapturedSentences(): Promise<CapturedSentence[]> {
  try {
    if (isSupabaseConfigured()) {
      return await getSentencesFromSupabase();
    } else {
      return await getSentencesFromLocalStorage();
    }
  } catch (error) {
    console.error('[Graph Storage] Failed to get sentences:', error);
    return [];
  }
}

/**
 * Get sentences from Supabase
 */
async function getSentencesFromSupabase(): Promise<CapturedSentence[]> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return [];
  
  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return [];
  }

  // Fetch sentences
  const { data, error } = await supabase
    .from('captured_sentences')
    .select('*')
    .eq('user_id', user.id)
    .order('timestamp', { ascending: true });

  if (error) {
    console.error('[Graph Storage] Failed to fetch sentences:', error.message);
    throw new Error(`Failed to fetch sentences: ${error.message}`);
  }

  // Transform to CapturedSentence format
  return (data || []).map((row: any) => ({
    id: row.id,
    sentence: row.sentence,
    terms: row.terms || [],
    context: row.context,
    framework: row.framework,
    secondaryContext: row.secondary_context,
    confidence: row.confidence || 0,
    timestamp: row.timestamp,
  }));
}

/**
 * Get sentences from local storage
 */
async function getSentencesFromLocalStorage(): Promise<CapturedSentence[]> {
  if (typeof window === 'undefined') return [];
  
  const data = localStorage.getItem(SENTENCES_KEY);
  if (!data) return [];
  
  try {
    return JSON.parse(data);
  } catch (error) {
    console.error('[Graph Storage] Failed to parse local sentences:', error);
    return [];
  }
}

/**
 * Fetch sentences newer than a specific timestamp (for incremental updates)
 */
export async function getNewCapturedSentences(since: string): Promise<CapturedSentence[]> {
  try {
    const allSentences = await getCapturedSentences();
    const sinceDate = new Date(since);
    
    return allSentences.filter(sentence => 
      new Date(sentence.timestamp) > sinceDate
    );
  } catch (error) {
    console.error('[Graph Storage] Failed to get new sentences:', error);
    return [];
  }
}

/**
 * Get timestamp of last processed sentence
 * Stores in browser localStorage for persistence
 */
export async function getLastProcessedTimestamp(): Promise<string | null> {
  try {
    if (isSupabaseConfigured()) {
      const supabase = getSupabaseBrowserClient();
      if (!supabase) return null;
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      
      // Use localStorage with user-specific key
      const key = `fluent_last_processed_${user.id}`;
      return localStorage.getItem(key);
    } else {
      return localStorage.getItem(LAST_PROCESSED_KEY);
    }
  } catch (error) {
    console.error('[Graph Storage] Failed to get last processed timestamp:', error);
    return null;
  }
}

/**
 * Update last processed timestamp
 */
export async function setLastProcessedTimestamp(timestamp: string): Promise<void> {
  try {
    if (isSupabaseConfigured()) {
      const supabase = getSupabaseBrowserClient();
      if (!supabase) return;
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      // Store in localStorage with user-specific key
      const key = `fluent_last_processed_${user.id}`;
      localStorage.setItem(key, timestamp);
    } else {
      localStorage.setItem(LAST_PROCESSED_KEY, timestamp);
    }
    
    console.log('[Graph Storage] Updated last processed timestamp:', timestamp);
  } catch (error) {
    console.error('[Graph Storage] Failed to set last processed timestamp:', error);
  }
}

/**
 * Process and save new sentences to graph
 * This is the main function that orchestrates incremental updates
 */
export async function processAndSaveNewSentences(): Promise<void> {
  try {
    console.log('[Graph Storage] Starting incremental processing...');
    
    // Get last processed timestamp
    const lastProcessed = await getLastProcessedTimestamp();
    
    // Fetch new sentences
    const newSentences = lastProcessed
      ? await getNewCapturedSentences(lastProcessed)
      : await getCapturedSentences(); // First time: process all
    
    if (newSentences.length === 0) {
      console.log('[Graph Storage] No new sentences to process');
      return;
    }
    
    console.log(`[Graph Storage] Processing ${newSentences.length} new sentences`);
    
    // Check if this is first-time processing or incremental
    const existingData = await getGraphData();
    
    if (!existingData || !lastProcessed) {
      // First-time processing: process all sentences and save
      const graphData = processSentencesIntoGraph(newSentences);
      await saveGraphData(graphData);
      
      // Update last processed timestamp to the latest sentence
      const latestTimestamp = newSentences[newSentences.length - 1].timestamp;
      await setLastProcessedTimestamp(latestTimestamp);
      
      console.log('[Graph Storage] Initial processing complete');
    } else {
      // Incremental processing: fetch existing sentences for edge calculation
      const allSentences = await getCapturedSentences();
      const existingSentences = allSentences.filter(
        s => !newSentences.find(ns => ns.id === s.id)
      );
      
      // Process only new sentences with edges to existing ones
      const newGraphData = processNewSentencesIncremental(newSentences, existingSentences);
      
      // Merge with existing graph data
      await mergeGraphData(newGraphData);
      
      // Update last processed timestamp to the latest new sentence
      const latestTimestamp = newSentences[newSentences.length - 1].timestamp;
      await setLastProcessedTimestamp(latestTimestamp);
      
      console.log('[Graph Storage] Incremental processing complete');
    }
  } catch (error) {
    console.error('[Graph Storage] Failed to process new sentences:', error);
    
    // Fallback: try full rebuild
    try {
      console.log('[Graph Storage] Attempting full rebuild...');
      const allSentences = await getCapturedSentences();
      const graphData = processSentencesIntoGraph(allSentences);
      await saveGraphData(graphData);
      
      if (allSentences.length > 0) {
        const latestTimestamp = allSentences[allSentences.length - 1].timestamp;
        await setLastProcessedTimestamp(latestTimestamp);
      }
      
      console.log('[Graph Storage] Full rebuild successful');
    } catch (rebuildError) {
      console.error('[Graph Storage] Full rebuild also failed:', rebuildError);
      throw rebuildError;
    }
  }
}

/**
 * Subscribe to real-time graph updates
 * Listens to captured_sentences table and processes new sentences automatically
 * Only works when Supabase is configured
 */
export function subscribeToGraphUpdates(callback: (data: GraphData) => void) {
  if (!isSupabaseConfigured()) {
    console.warn('[Graph Storage] Real-time updates not available without Supabase');
    return () => {}; // Return no-op unsubscribe function
  }
  
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return () => {};
  
  // Subscribe to captured_sentences changes
  const sentencesChannel = supabase
    .channel('captured_sentences_changes')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'captured_sentences',
      },
      async () => {
        console.log('[Graph Storage] New sentence detected, processing...');
        
        // Process new sentences and update graph
        await processAndSaveNewSentences();
        
        // Reload and callback with updated graph data
        const data = await getGraphData();
        if (data) {
          callback(data);
        }
      }
    )
    .subscribe();

  // Return unsubscribe function
  return () => {
    supabase.removeChannel(sentencesChannel);
  };
}

/**
 * Get available domains for a user with sentence counts
 */
export async function getAvailableDomains(userId: string): Promise<{ context: string; count: number }[]> {
  try {
    if (!isSupabaseConfigured()) {
      // Fallback to all domains with 0 count
      return [];
    }

    const supabase = getSupabaseBrowserClient();
    if (!supabase) return [];

    const { data, error } = await supabase
      .from('captured_sentences')
      .select('context')
      .eq('user_id', userId);

    if (error) {
      console.error('[Graph Storage] Failed to fetch domains:', error.message);
      return [];
    }

    if (!data || data.length === 0) return [];

    // Count sentences per context
    const counts: Record<string, number> = {};
    data.forEach((sentence: any) => {
      const context = sentence.context || 'General';
      counts[context] = (counts[context] || 0) + 1;
    });

    return Object.entries(counts).map(([context, count]) => ({ context, count }));
  } catch (error) {
    console.error('[Graph Storage] Error getting available domains:', error);
    return [];
  }
}

/**
 * Get graph data filtered by a specific context
 */
export async function getGraphDataByContext(context: string, userId: string): Promise<GraphData | null> {
  try {
    if (!isSupabaseConfigured()) {
      return await getFromLocalStorage();
    }

    const supabase = getSupabaseBrowserClient();
    if (!supabase) return null;

    // Fetch nodes filtered by context
    const { data: nodesData, error: nodesError } = await supabase
      .from('graph_nodes')
      .select('*')
      .eq('user_id', userId)
      .eq('context', context);

    if (nodesError) {
      console.error('[Graph Storage] Failed to fetch nodes:', nodesError.message);
      throw new Error(`Failed to fetch nodes: ${nodesError.message}`);
    }

    if (!nodesData || nodesData.length === 0) {
      return null;
    }

    const nodeIds = new Set(nodesData.map((n: any) => n.id));

    // Fetch edges where both source and target are in the filtered nodes
    const { data: edgesData, error: edgesError } = await supabase
      .from('graph_edges')
      .select('*')
      .eq('user_id', userId);

    if (edgesError) {
      console.error('[Graph Storage] Failed to fetch edges:', edgesError.message);
      throw new Error(`Failed to fetch edges: ${edgesError.message}`);
    }

    // Filter edges to only include those within the context
    const filteredEdges = (edgesData || []).filter((edge: any) => 
      nodeIds.has(edge.source_id) && nodeIds.has(edge.target_id)
    );

    // Transform to GraphData format
    const nodes: GraphNode[] = nodesData.map((node: any) => ({
      id: node.id,
      type: node.type as 'topic' | 'sentence',
      label: node.label,
      terms: node.terms || [],
      context: node.context,
      framework: node.framework,
      timestamp: node.timestamp,
      metadata: {
        confidence: node.confidence || 0,
        quizCompleted: node.quiz_completed || false,
      },
    }));

    const edges: GraphEdge[] = filteredEdges.map((edge: any) => ({
      id: edge.id,
      source: edge.source_id,
      target: edge.target_id,
      weight: parseFloat(edge.weight),
      type: edge.type as 'term-match' | 'context-match' | 'both',
    }));

    // Calculate stats
    const sentenceCount = nodes.filter(n => n.type === 'sentence').length;
    const topicCount = nodes.filter(n => n.type === 'topic').length;
    const avgLinkStrength = edges.length > 0
      ? edges.reduce((sum, e) => sum + e.weight, 0) / edges.length
      : 0;

    return {
      nodes,
      edges,
      stats: {
        totalSentences: sentenceCount,
        topicCount,
        avgLinkStrength: Math.round(avgLinkStrength * 100) / 100,
      },
    };
  } catch (error) {
    console.error('[Graph Storage] Error getting graph data by context:', error);
    return null;
  }
}

/**
 * Get captured sentences for a specific context
 */
export async function getSentencesByContext(context: string, userId: string): Promise<CapturedSentence[]> {
  try {
    if (!isSupabaseConfigured()) {
      return [];
    }

    const supabase = getSupabaseBrowserClient();
    if (!supabase) return [];

    const { data, error } = await supabase
      .from('captured_sentences')
      .select('*')
      .eq('user_id', userId)
      .eq('context', context)
      .order('timestamp', { ascending: false });

    if (error) {
      console.error('[Graph Storage] Failed to fetch sentences:', error.message);
      return [];
    }

    if (!data || data.length === 0) return [];

    return data.map((sentence: any) => ({
      id: sentence.id,
      sentence: sentence.sentence,
      terms: sentence.terms || [],
      context: sentence.context,
      framework: sentence.framework,
      secondaryContext: sentence.secondary_context,
      confidence: sentence.confidence || 0,
      timestamp: sentence.timestamp,
      asi_extract: sentence.asi_extract,
    }));
  } catch (error) {
    console.error('[Graph Storage] Error getting sentences by context:', error);
    return [];
  }
}

/**
 * Refresh and rebuild graph for a specific context
 * Processes all sentences for the context and updates the graph
 */
export async function refreshGraphForContext(context: string, userId: string): Promise<boolean> {
  try {
    console.log(`[Graph Storage] Refreshing graph for context: ${context}`);
    
    if (!isSupabaseConfigured()) {
      console.warn('[Graph Storage] Refresh not supported without Supabase');
      return false;
    }

    const supabase = getSupabaseBrowserClient();
    if (!supabase) return false;

    // Get all sentences for this context
    const sentences = await getSentencesByContext(context, userId);
    
    if (sentences.length === 0) {
      console.log(`[Graph Storage] No sentences found for context: ${context}`);
      
      // Get existing nodes for this context first
      const { data: existingNodes } = await supabase
        .from('graph_nodes')
        .select('id')
        .eq('user_id', userId)
        .eq('context', context);
      
      const existingNodeIds = existingNodes?.map(n => n.id) || [];
      
      if (existingNodeIds.length > 0) {
        // Delete edges that reference these nodes
        // Delete edges where source is in the list
        const sourceResults = await supabase
          .from('graph_edges')
          .delete()
          .eq('user_id', userId)
          .in('source_id', existingNodeIds);
        
        if (sourceResults.error) {
          console.error('[Graph Storage] Failed to delete source edges:', sourceResults.error);
        }
        
        // Delete edges where target is in the list
        const targetResults = await supabase
          .from('graph_edges')
          .delete()
          .eq('user_id', userId)
          .in('target_id', existingNodeIds);
        
        if (targetResults.error) {
          console.error('[Graph Storage] Failed to delete target edges:', targetResults.error);
        }
      }
      
      // Now delete the nodes
      const { error: deleteNodesError } = await supabase
        .from('graph_nodes')
        .delete()
        .eq('user_id', userId)
        .eq('context', context);
      
      if (deleteNodesError) {
        console.error('[Graph Storage] Failed to delete nodes:', deleteNodesError);
        throw deleteNodesError;
      }

      return true;
    }

    // Process sentences into graph
    const graphData = processSentencesIntoGraph(sentences);
    
    // Upsert nodes (insert new or update existing)
    const nodesToUpsert = graphData.nodes.map(node => ({
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

    if (nodesToUpsert.length > 0) {
      const { error: upsertNodesError } = await supabase
        .from('graph_nodes')
        .upsert(nodesToUpsert, { 
          onConflict: 'id',
          ignoreDuplicates: false 
        });

      if (upsertNodesError) {
        console.error('[Graph Storage] Failed to upsert nodes:', upsertNodesError);
        throw upsertNodesError;
      }
    }

    // Get all existing nodes to check if source/target exist
    const { data: allNodes } = await supabase
      .from('graph_nodes')
      .select('id')
      .eq('user_id', userId);

    const nodeIds = new Set(allNodes?.map(n => n.id) || []);

    // Delete existing edges for nodes in this context
    const contextNodeIds = new Set(graphData.nodes.map(n => n.id));
    
    // Delete edges where source is in context or target is in context
    // This ensures we clean up all edges before re-inserting
    if (contextNodeIds.size > 0) {
      const { error: deleteSourceEdgesError } = await supabase
        .from('graph_edges')
        .delete()
        .eq('user_id', userId)
        .in('source_id', Array.from(contextNodeIds));
      
      if (deleteSourceEdgesError) {
        console.error('[Graph Storage] Failed to delete source edges:', deleteSourceEdgesError);
      }

      const { error: deleteTargetEdgesError } = await supabase
        .from('graph_edges')
        .delete()
        .eq('user_id', userId)
        .in('target_id', Array.from(contextNodeIds));
      
      if (deleteTargetEdgesError) {
        console.error('[Graph Storage] Failed to delete target edges:', deleteTargetEdgesError);
      }
    }

    // Insert edges (no need for upsert since we deleted first)
    const edgesToInsert = graphData.edges
      .filter(edge => nodeIds.has(edge.source) && nodeIds.has(edge.target))
      .map(edge => ({
        id: edge.id,
        user_id: userId,
        source_id: edge.source,
        target_id: edge.target,
        weight: edge.weight,
        type: edge.type,
      }));

    if (edgesToInsert.length > 0) {
      const { error: insertEdgesError } = await supabase
        .from('graph_edges')
        .insert(edgesToInsert);

      if (insertEdgesError) {
        console.error('[Graph Storage] Failed to insert edges:', insertEdgesError);
        throw insertEdgesError;
      }
    }

    // Clean up orphaned nodes (nodes in this context that are no longer in the graph)
    const newNodeIds = new Set(graphData.nodes.map(n => n.id));
    const { data: existingContextNodes } = await supabase
      .from('graph_nodes')
      .select('id')
      .eq('user_id', userId)
      .eq('context', context);
    
    const orphanedNodeIds = (existingContextNodes || [])
      .map(n => n.id)
      .filter(id => !newNodeIds.has(id));
    
    if (orphanedNodeIds.length > 0) {
      // Delete orphaned edges first (CASCADE will handle this, but being explicit)
      await supabase
        .from('graph_edges')
        .delete()
        .eq('user_id', userId)
        .in('source_id', orphanedNodeIds);
      
      await supabase
        .from('graph_edges')
        .delete()
        .eq('user_id', userId)
        .in('target_id', orphanedNodeIds);
      
      // Delete orphaned nodes
      await supabase
        .from('graph_nodes')
        .delete()
        .eq('user_id', userId)
        .in('id', orphanedNodeIds);
    }

    console.log(`[Graph Storage] Successfully refreshed graph for context: ${context}`);
    return true;
  } catch (error) {
    console.error(`[Graph Storage] Error refreshing graph for context ${context}:`, error);
    return false;
  }
}

/**
 * Insert owned NFT into database
 */
export async function insertOwnedNFT(
  userId: string,
  tokenId: number,
  domain: string,
  metadataUri: string,
  txHash: string,
  score: number,
  nodeCount: number
): Promise<void> {
  try {
    if (isSupabaseConfigured()) {
      const supabase = getSupabaseBrowserClient();
      if (!supabase) throw new Error('Supabase not configured');

      // Check if badge already exists for this domain
      const { data: existingBadge } = await supabase
        .from('owned_nfts')
        .select('id')
        .eq('user_id', userId)
        .eq('domain', domain)
        .maybeSingle();

      if (existingBadge) {
        // Update existing badge
        const { error } = await supabase
          .from('owned_nfts')
          .update({
            token_id: tokenId,
            metadata_uri: metadataUri,
            tx_hash: txHash,
            score,
            node_count: nodeCount,
            minted_at: new Date().toISOString(),
          })
          .eq('user_id', userId)
          .eq('domain', domain);

        if (error) throw new Error(`Failed to update NFT: ${error.message}`);
        console.log('[Graph Storage] NFT updated successfully');
      } else {
        // Insert new badge
        const { error } = await supabase.from('owned_nfts').insert({
          user_id: userId,
          token_id: tokenId,
          domain,
          metadata_uri: metadataUri,
          tx_hash: txHash,
          score,
          node_count: nodeCount,
        });

        if (error) throw new Error(`Failed to insert NFT: ${error.message}`);
        console.log('[Graph Storage] NFT inserted successfully');
      }
    } else {
      console.warn('[Graph Storage] Supabase not configured, skipping NFT insert');
    }
  } catch (error) {
    console.error('[Graph Storage] Failed to insert NFT:', error);
    throw error;
  }
}

/**
 * Check if user has minted a badge for a domain
 */
export async function checkBadgeMinted(userId: string, domain: string): Promise<boolean> {
  try {
    if (!isSupabaseConfigured()) return false;

    const supabase = getSupabaseBrowserClient();
    if (!supabase) return false;

    const { data, error } = await supabase
      .from('owned_nfts')
      .select('id')
      .eq('user_id', userId)
      .eq('domain', domain)
      .maybeSingle();

    if (error) {
      console.error('[Graph Storage] Error checking badge:', error);
      return false;
    }

    return !!data;
  } catch (error) {
    console.error('[Graph Storage] Failed to check badge:', error);
    return false;
  }
}

export interface BadgeData {
  id: string;
  domain: string;
  token_id: number;
  metadata_uri: string;
  tx_hash: string | null;
  score: number;
  node_count: number;
  minted_at: string;
}

/**
 * Get all badges for a user
 */
export async function getUserBadges(userId: string): Promise<BadgeData[]> {
  try {
    if (!isSupabaseConfigured()) {
      console.warn('[Graph Storage] Supabase not configured');
      return [];
    }

    const supabase = getSupabaseBrowserClient();
    if (!supabase) return [];

    const { data, error } = await supabase
      .from('owned_nfts')
      .select('*')
      .eq('user_id', userId)
      .order('minted_at', { ascending: false });

    if (error) {
      console.error('[Graph Storage] Error fetching badges:', error);
      return [];
    }

    if (!data || data.length === 0) {
      return [];
    }

    return data.map((badge: any) => ({
      id: badge.id,
      domain: badge.domain,
      token_id: badge.token_id,
      metadata_uri: badge.metadata_uri,
      tx_hash: badge.tx_hash,
      score: badge.score,
      node_count: badge.node_count || 0,
      minted_at: badge.minted_at,
    }));
  } catch (error) {
    console.error('[Graph Storage] Failed to fetch badges:', error);
    return [];
  }
}

/**
 * Get public badges for a user by slug
 */
export async function getPublicBadgesBySlug(profileSlug: string): Promise<BadgeData[]> {
  try {
    if (!isSupabaseConfigured()) {
      return [];
    }

    const supabase = getSupabaseBrowserClient();
    if (!supabase) return [];

    // First get user by slug
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('profile_slug', profileSlug)
      .single();

    if (profileError || !profile) {
      console.error('[Graph Storage] Profile not found:', profileError);
      return [];
    }

    // Then get public badges
    const { data, error } = await supabase
      .from('owned_nfts')
      .select('*')
      .eq('user_id', profile.id)
      .eq('is_public', true)
      .order('minted_at', { ascending: false });

    if (error) {
      console.error('[Graph Storage] Error fetching public badges:', error);
      return [];
    }

    return (data || []).map((badge: any) => ({
      id: badge.id,
      domain: badge.domain,
      token_id: badge.token_id,
      metadata_uri: badge.metadata_uri,
      tx_hash: badge.tx_hash,
      score: badge.score,
      node_count: badge.node_count || 0,
      minted_at: badge.minted_at,
    }));
  } catch (error) {
    console.error('[Graph Storage] Failed to fetch public badges:', error);
    return [];
  }
}

/**
 * Get badge by token ID
 */
export async function getBadgeByTokenId(tokenId: string | number): Promise<BadgeData | null> {
  try {
    if (!isSupabaseConfigured()) {
      return null;
    }

    const supabase = getSupabaseBrowserClient();
    if (!supabase) return null;

    const { data, error } = await supabase
      .from('owned_nfts')
      .select('*')
      .eq('token_id', tokenId)
      .single();

    if (error || !data) {
      console.error('[Graph Storage] Badge not found:', error);
      return null;
    }

    return {
      id: data.id,
      domain: data.domain,
      token_id: data.token_id,
      metadata_uri: data.metadata_uri,
      tx_hash: data.tx_hash,
      score: data.score,
      node_count: data.node_count || 0,
      minted_at: data.minted_at,
    };
  } catch (error) {
    console.error('[Graph Storage] Failed to fetch badge:', error);
    return null;
  }
}

/**
 * Get user profile by slug
 */
export async function getUserProfileBySlug(profileSlug: string) {
  try {
    if (!isSupabaseConfigured()) {
      return null;
    }

    const supabase = getSupabaseBrowserClient();
    if (!supabase) return null;

    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, badges_minted, mastery_level, profile_slug, public_profile')
      .eq('profile_slug', profileSlug)
      .single();

    if (error || !data) {
      console.error('[Graph Storage] Profile not found:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('[Graph Storage] Failed to fetch profile:', error);
    return null;
  }
}

