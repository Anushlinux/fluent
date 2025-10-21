/**
 * Graph Storage Layer
 * Uses Supabase for persistent cloud storage with real-time sync
 */

import { getSupabaseBrowserClient } from './supabase';
import type { GraphData, GraphNode, GraphEdge } from './graphTypes';

/**
 * Save graph data to Supabase
 */
export async function saveGraphData(data: GraphData): Promise<void> {
  try {
    // Check environment variables
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      throw new Error('Supabase environment variables not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local');
    }

    const supabase = getSupabaseBrowserClient();
    
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

    console.log('[Graph Storage] Saved graph data to Supabase:', data.stats);
  } catch (error) {
    console.error('[Graph Storage] Failed to save:', error);
    throw error;
  }
}

/**
 * Get graph data from Supabase
 */
export async function getGraphData(): Promise<GraphData | null> {
  try {
    // Check environment variables
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.warn('[Graph Storage] Supabase not configured. Please set up environment variables.');
      return null;
    }

    const supabase = getSupabaseBrowserClient();
    
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
    const nodes: GraphNode[] = nodesData.map((node: { id: any; type: string; label: any; terms: any; context: any; framework: any; timestamp: any; confidence: any; quiz_completed: any; }) => ({
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

    const edges: GraphEdge[] = (edgesData || []).map((edge: { id: any; source_id: any; target_id: any; weight: string; type: string; }) => ({
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
    console.error('[Graph Storage] Failed to load:', error);
    return null;
  }
}

/**
 * Merge new graph data with existing data (append mode)
 */
export async function mergeGraphData(newData: GraphData): Promise<void> {
  try {
    const supabase = getSupabaseBrowserClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    const existingData = await getGraphData();
    
    if (!existingData) {
      // No existing data, just save new data
      await saveGraphData(newData);
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
  } catch (error) {
    console.error('[Graph Storage] Failed to merge:', error);
    throw error;
  }
}

/**
 * Clear all stored graph data
 */
export async function clearGraphData(): Promise<void> {
  try {
    const supabase = getSupabaseBrowserClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    await supabase.from('graph_nodes').delete().eq('user_id', user.id);
    await supabase.from('graph_edges').delete().eq('user_id', user.id);
    
    console.log('[Graph Storage] Cleared graph data');
  } catch (error) {
    console.error('[Graph Storage] Failed to clear:', error);
    throw error;
  }
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
 * Subscribe to real-time graph updates
 */
export function subscribeToGraphUpdates(callback: (data: GraphData) => void) {
  const supabase = getSupabaseBrowserClient();
  
  // Subscribe to node changes
  const nodesChannel = supabase
    .channel('graph_nodes_changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'graph_nodes',
      },
      async () => {
        // Reload graph data when changes occur
        const data = await getGraphData();
        if (data) {
          callback(data);
        }
      }
    )
    .subscribe();

  // Return unsubscribe function
  return () => {
    supabase.removeChannel(nodesChannel);
  };
}

