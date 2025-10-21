/**
 * Graph Export Utilities
 * Transforms captured sentences into graph-ready format for visualization
 */

export interface GraphNode {
  id: string;
  type: 'topic' | 'sentence';
  label: string;
  terms?: string[];
  context?: string;
  framework?: string;
  timestamp: string;
  metadata: {
    confidence: number;
    quizCompleted?: boolean;
  };
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  weight: number; // 0-1 based on overlap strength
  type: 'term-match' | 'context-match' | 'both';
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
  stats: {
    totalSentences: number;
    topicCount: number;
    avgLinkStrength: number;
  };
}

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
 * Cluster sentences by topic/context
 */
export function clusterByTopic(sentences: CapturedSentence[]): Map<string, string[]> {
  const clusters = new Map<string, string[]>();
  
  sentences.forEach(sentence => {
    const topic = sentence.context || 'General';
    
    if (!clusters.has(topic)) {
      clusters.set(topic, []);
    }
    
    clusters.get(topic)!.push(sentence.id);
  });
  
  return clusters;
}

/**
 * Calculate edge weight between two sentences
 * Formula: (sharedTerms/totalTerms) * 0.5 + contextMatch * 0.3 + frameworkMatch * 0.2
 */
export function calculateEdgeWeight(
  sent1: CapturedSentence,
  sent2: CapturedSentence
): { weight: number; type: 'term-match' | 'context-match' | 'both' } {
  // Calculate shared terms
  const terms1 = new Set(sent1.terms.map(t => t.toLowerCase()));
  const terms2 = new Set(sent2.terms.map(t => t.toLowerCase()));
  
  const sharedTerms = new Set([...terms1].filter(t => terms2.has(t)));
  const totalUniqueTerms = new Set([...terms1, ...terms2]).size;
  
  const termScore = totalUniqueTerms > 0 
    ? (sharedTerms.size / totalUniqueTerms) * 0.5 
    : 0;
  
  // Context match bonus
  const contextMatch = sent1.context === sent2.context ? 0.3 : 0;
  
  // Framework match bonus
  const frameworkMatch = 
    sent1.framework && sent2.framework && sent1.framework === sent2.framework 
      ? 0.2 
      : 0;
  
  const weight = termScore + contextMatch + frameworkMatch;
  
  // Determine edge type
  let type: 'term-match' | 'context-match' | 'both';
  if (sharedTerms.size > 0 && (contextMatch > 0 || frameworkMatch > 0)) {
    type = 'both';
  } else if (sharedTerms.size > 0) {
    type = 'term-match';
  } else {
    type = 'context-match';
  }
  
  return { weight, type };
}

/**
 * Create edges between sentences based on shared terms and context
 */
function createEdges(sentences: CapturedSentence[]): GraphEdge[] {
  const edges: GraphEdge[] = [];
  const WEIGHT_THRESHOLD = 0.3;
  
  // Create edges between sentence pairs
  for (let i = 0; i < sentences.length; i++) {
    for (let j = i + 1; j < sentences.length; j++) {
      const { weight, type } = calculateEdgeWeight(sentences[i], sentences[j]);
      
      if (weight >= WEIGHT_THRESHOLD) {
        edges.push({
          id: `edge-${sentences[i].id}-${sentences[j].id}`,
          source: sentences[i].id,
          target: sentences[j].id,
          weight: Math.min(weight, 1), // Cap at 1
          type,
        });
      }
    }
  }
  
  return edges;
}

/**
 * Create topic nodes and edges from clusters
 */
function createTopicNodes(
  clusters: Map<string, string[]>,
  sentences: CapturedSentence[]
): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const topicNodes: GraphNode[] = [];
  const topicEdges: GraphEdge[] = [];
  
  clusters.forEach((sentenceIds, topic) => {
    // Create topic node
    const topicId = `topic-${topic.toLowerCase().replace(/\s+/g, '-')}`;
    topicNodes.push({
      id: topicId,
      type: 'topic',
      label: topic,
      timestamp: new Date().toISOString(),
      metadata: {
        confidence: 100,
      },
    });
    
    // Create edges from topic to sentences
    sentenceIds.forEach(sentenceId => {
      topicEdges.push({
        id: `edge-${topicId}-${sentenceId}`,
        source: topicId,
        target: sentenceId,
        weight: 1,
        type: 'context-match',
      });
    });
  });
  
  return { nodes: topicNodes, edges: topicEdges };
}

/**
 * Export graph data from captured sentences
 */
export async function exportGraphData(): Promise<GraphData> {
  try {
    // Get captured sentences from storage
    const result = await chrome.storage.local.get('fluentSentenceLog');
    const sentences: CapturedSentence[] = result.fluentSentenceLog || [];
    
    if (sentences.length === 0) {
      return {
        nodes: [],
        edges: [],
        stats: {
          totalSentences: 0,
          topicCount: 0,
          avgLinkStrength: 0,
        },
      };
    }
    
    // Create sentence nodes
    const sentenceNodes: GraphNode[] = sentences.map(sentence => ({
      id: sentence.id,
      type: 'sentence',
      label: sentence.sentence,
      terms: sentence.terms,
      context: sentence.context,
      framework: sentence.framework,
      timestamp: sentence.timestamp,
      metadata: {
        confidence: sentence.confidence,
        quizCompleted: false, // TODO: Link with quiz completion data
      },
    }));
    
    // Create edges between sentences
    const sentenceEdges = createEdges(sentences);
    
    // Cluster by topic and create topic nodes
    const clusters = clusterByTopic(sentences);
    const { nodes: topicNodes, edges: topicEdges } = createTopicNodes(clusters, sentences);
    
    // Combine all nodes and edges
    const allNodes = [...topicNodes, ...sentenceNodes];
    const allEdges = [...topicEdges, ...sentenceEdges];
    
    // Calculate stats
    const avgLinkStrength = allEdges.length > 0
      ? allEdges.reduce((sum, edge) => sum + edge.weight, 0) / allEdges.length
      : 0;
    
    return {
      nodes: allNodes,
      edges: allEdges,
      stats: {
        totalSentences: sentences.length,
        topicCount: clusters.size,
        avgLinkStrength: Math.round(avgLinkStrength * 100) / 100,
      },
    };
  } catch (error) {
    console.error('[Fluent] Failed to export graph data:', error);
    throw error;
  }
}

/**
 * Download graph data as JSON file
 */
export function downloadGraphData(data: GraphData): void {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `fluent-graph-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  
  URL.revokeObjectURL(url);
}

