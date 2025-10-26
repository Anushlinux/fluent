/**
 * Graph Type Definitions
 * Shared types for knowledge graph visualization
 */

export interface GraphNode {
  [key: string]: unknown;
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
    explanation?: string | null;
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

export interface CapturedSentence {
  id: string;
  sentence: string;
  terms: string[];
  context: string;
  framework?: string;
  secondaryContext?: string;
  confidence: number;
  timestamp: string;
  asi_extract?: {
    explanation?: string;
    concepts?: string[];
    relations?: any[];
  };
}

export interface DomainStats {
  context: string;
  sentenceCount: number;
  nodeCount: number;
  lastUpdated?: string;
}

export interface DomainGraphData extends GraphData {
  context: string;
  domainStats: DomainStats;
}

