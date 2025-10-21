/**
 * Graph Storage Layer
 * Uses localForage for persistent client-side storage
 */

import localforage from 'localforage';
import type { GraphData } from './graphTypes';

// Configure localForage
const graphStore = localforage.createInstance({
  name: 'fluent-graph',
  storeName: 'graphData',
  description: 'Knowledge graph data storage'
});

const STORAGE_KEY = 'currentGraph';

/**
 * Save graph data to local storage
 */
export async function saveGraphData(data: GraphData): Promise<void> {
  try {
    await graphStore.setItem(STORAGE_KEY, data);
    console.log('[Graph Storage] Saved graph data:', data.stats);
  } catch (error) {
    console.error('[Graph Storage] Failed to save:', error);
    throw error;
  }
}

/**
 * Get graph data from local storage
 */
export async function getGraphData(): Promise<GraphData | null> {
  try {
    const data = await graphStore.getItem<GraphData>(STORAGE_KEY);
    return data;
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
    const existingData = await getGraphData();
    
    if (!existingData) {
      // No existing data, just save new data
      await saveGraphData(newData);
      return;
    }
    
    // Merge nodes (avoid duplicates by ID)
    const existingNodeIds = new Set(existingData.nodes.map(n => n.id));
    const newNodes = newData.nodes.filter(n => !existingNodeIds.has(n.id));
    const allNodes = [...existingData.nodes, ...newNodes];
    
    // Merge edges (avoid duplicates by ID)
    const existingEdgeIds = new Set(existingData.edges.map(e => e.id));
    const newEdges = newData.edges.filter(e => !existingEdgeIds.has(e.id));
    const allEdges = [...existingData.edges, ...newEdges];
    
    // Update stats
    const sentenceCount = allNodes.filter(n => n.type === 'sentence').length;
    const topicCount = allNodes.filter(n => n.type === 'topic').length;
    const avgLinkStrength = allEdges.length > 0
      ? allEdges.reduce((sum, e) => sum + e.weight, 0) / allEdges.length
      : 0;
    
    const mergedData: GraphData = {
      nodes: allNodes,
      edges: allEdges,
      stats: {
        totalSentences: sentenceCount,
        topicCount,
        avgLinkStrength: Math.round(avgLinkStrength * 100) / 100,
      },
    };
    
    await saveGraphData(mergedData);
    console.log('[Graph Storage] Merged data. Total sentences:', sentenceCount);
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
    await graphStore.removeItem(STORAGE_KEY);
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

