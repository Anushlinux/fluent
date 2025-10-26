/**
 * Graph Utilities
 * Core logic for graph manipulation, filtering, and subgraph extraction
 */

import type { GraphData, GraphNode, GraphEdge } from './graphTypes';

/**
 * Get all unique topics from the graph
 */
export function getTopics(data: GraphData): string[] {
  const topics = new Set<string>();
  
  data.nodes.forEach(node => {
    if (node.type === 'topic') {
      topics.add(node.label);
    } else if (node.context) {
      topics.add(node.context);
    }
  });
  
  return Array.from(topics).sort();
}

/**
 * Get all unique frameworks from the graph
 */
export function getFrameworks(data: GraphData): string[] {
  const frameworks = new Set<string>();
  
  data.nodes.forEach(node => {
    if (node.framework) {
      frameworks.add(node.framework);
    }
  });
  
  return Array.from(frameworks).sort();
}

/**
 * Filter graph by topic
 */
export function getSubgraph(topic: string, data: GraphData): GraphData {
  if (topic === 'All') {
    return data;
  }
  
  // Find topic node
  const topicNode = data.nodes.find(
    n => n.type === 'topic' && n.label === topic
  );
  
  // Get sentence nodes that match the topic
  const sentenceNodes = data.nodes.filter(
    n => (n.type === 'sentence' && n.context === topic) ||
         (n.type === 'topic' && n.label === topic)
  );
  
  const nodeIds = new Set(sentenceNodes.map(n => n.id));
  if (topicNode) {
    nodeIds.add(topicNode.id);
  }
  
  // Filter edges to only those connecting filtered nodes
  const filteredEdges = data.edges.filter(
    e => nodeIds.has(e.source) && nodeIds.has(e.target)
  );
  
  // Calculate new stats
  const sentenceCount = sentenceNodes.filter(n => n.type === 'sentence').length;
  const avgLinkStrength = filteredEdges.length > 0
    ? filteredEdges.reduce((sum, e) => sum + e.weight, 0) / filteredEdges.length
    : 0;
  
  return {
    nodes: sentenceNodes,
    edges: filteredEdges,
    stats: {
      totalSentences: sentenceCount,
      topicCount: topicNode ? 1 : 0,
      avgLinkStrength: Math.round(avgLinkStrength * 100) / 100,
    },
  };
}

/**
 * Filter graph by framework
 */
export function filterByFramework(framework: string, data: GraphData): GraphData {
  if (framework === 'All') {
    return data;
  }
  
  const filteredNodes = data.nodes.filter(
    n => n.type === 'topic' || n.framework === framework
  );
  
  const nodeIds = new Set(filteredNodes.map(n => n.id));
  
  const filteredEdges = data.edges.filter(
    e => nodeIds.has(e.source) && nodeIds.has(e.target)
  );
  
  const sentenceCount = filteredNodes.filter(n => n.type === 'sentence').length;
  const topicCount = filteredNodes.filter(n => n.type === 'topic').length;
  const avgLinkStrength = filteredEdges.length > 0
    ? filteredEdges.reduce((sum, e) => sum + e.weight, 0) / filteredEdges.length
    : 0;
  
  return {
    nodes: filteredNodes,
    edges: filteredEdges,
    stats: {
      totalSentences: sentenceCount,
      topicCount,
      avgLinkStrength: Math.round(avgLinkStrength * 100) / 100,
    },
  };
}

/**
 * Get learning path (time-based subgraph)
 */
export function getLearningPath(startDate: string, endDate: string, data: GraphData): GraphData {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  const filteredNodes = data.nodes.filter(node => {
    if (node.type === 'topic') return true;
    
    const nodeDate = new Date(node.timestamp);
    return nodeDate >= start && nodeDate <= end;
  });
  
  const nodeIds = new Set(filteredNodes.map(n => n.id));
  
  const filteredEdges = data.edges.filter(
    e => nodeIds.has(e.source) && nodeIds.has(e.target)
  );
  
  const sentenceCount = filteredNodes.filter(n => n.type === 'sentence').length;
  const topicCount = filteredNodes.filter(n => n.type === 'topic').length;
  const avgLinkStrength = filteredEdges.length > 0
    ? filteredEdges.reduce((sum, e) => sum + e.weight, 0) / filteredEdges.length
    : 0;
  
  return {
    nodes: filteredNodes,
    edges: filteredEdges,
    stats: {
      totalSentences: sentenceCount,
      topicCount,
      avgLinkStrength: Math.round(avgLinkStrength * 100) / 100,
    },
  };
}

/**
 * Filter by quiz completion
 */
export function getQuizTrail(data: GraphData): GraphData {
  const filteredNodes = data.nodes.filter(
    n => n.type === 'topic' || n.metadata.quizCompleted
  );
  
  const nodeIds = new Set(filteredNodes.map(n => n.id));
  
  const filteredEdges = data.edges.filter(
    e => nodeIds.has(e.source) && nodeIds.has(e.target)
  );
  
  const sentenceCount = filteredNodes.filter(n => n.type === 'sentence').length;
  const topicCount = filteredNodes.filter(n => n.type === 'topic').length;
  const avgLinkStrength = filteredEdges.length > 0
    ? filteredEdges.reduce((sum, e) => sum + e.weight, 0) / filteredEdges.length
    : 0;
  
  return {
    nodes: filteredNodes,
    edges: filteredEdges,
    stats: {
      totalSentences: sentenceCount,
      topicCount,
      avgLinkStrength: Math.round(avgLinkStrength * 100) / 100,
    },
  };
}

/**
 * Filter by high confidence (>= 70%)
 */
export function getHighConfidence(data: GraphData): GraphData {
  const filteredNodes = data.nodes.filter(
    n => n.type === 'topic' || n.metadata.confidence >= 70
  );
  
  const nodeIds = new Set(filteredNodes.map(n => n.id));
  
  const filteredEdges = data.edges.filter(
    e => nodeIds.has(e.source) && nodeIds.has(e.target)
  );
  
  const sentenceCount = filteredNodes.filter(n => n.type === 'sentence').length;
  const topicCount = filteredNodes.filter(n => n.type === 'topic').length;
  const avgLinkStrength = filteredEdges.length > 0
    ? filteredEdges.reduce((sum, e) => sum + e.weight, 0) / filteredEdges.length
    : 0;
  
  return {
    nodes: filteredNodes,
    edges: filteredEdges,
    stats: {
      totalSentences: sentenceCount,
      topicCount,
      avgLinkStrength: Math.round(avgLinkStrength * 100) / 100,
    },
  };
}

/**
 * Get date range from graph data
 */
export function getDateRange(data: GraphData): { start: string; end: string } | null {
  const sentenceNodes = data.nodes.filter(n => n.type === 'sentence');
  
  if (sentenceNodes.length === 0) {
    return null;
  }
  
  const timestamps = sentenceNodes.map(n => new Date(n.timestamp));
  const start = new Date(Math.min(...timestamps.map(d => d.getTime())));
  const end = new Date(Math.max(...timestamps.map(d => d.getTime())));
  
  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0],
  };
}

