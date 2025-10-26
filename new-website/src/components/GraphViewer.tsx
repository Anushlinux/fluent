'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  ReactFlow,
  Node,
  Edge,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import ELK from 'elkjs/lib/elk.bundled.js';
import { GraphData, GraphNode as GraphNodeType, GraphEdge as GraphEdgeType } from '@/lib/graphTypes';
import TopicNode from './TopicNode';
import SentenceNode from './SentenceNode';
import { ToastContainer, ToastData } from './ToastNotification';
import { getSupabaseBrowserClient, isSupabaseConfigured } from '@/lib/supabase';

const elk = new ELK();

// Custom node types
const nodeTypes = {
  topic: TopicNode,
  sentence: SentenceNode,
};

interface GraphViewerProps {
  data: GraphData;
  hasMintedBadge?: boolean;
}

export default function GraphViewer({ data, hasMintedBadge = false }: GraphViewerProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState<GraphNodeType | null>(null);
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const [userId, setUserId] = useState<string | null>(null);

  // Get current user ID (only if Supabase is configured)
  useEffect(() => {
    const fetchUserId = async () => {
      try {
        if (isSupabaseConfigured()) {
          const supabase = getSupabaseBrowserClient();
          const { data: { user } } = await supabase.auth.getUser();
          setUserId(user?.id || null);
        }
      } catch (error) {
        console.error('[Graph Viewer] Failed to get user ID:', error);
      }
    };
    fetchUserId();
  }, []);

  // Subscribe to real-time insights (only if Supabase is configured)
  useEffect(() => {
    if (!userId || !isSupabaseConfigured()) return;

    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    // Subscribe to insights table
    const channel = supabase
      .channel('insights_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'insights',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log('[Graph Viewer] New insight received:', payload.new);
          const insight = payload.new as any;

          // Create toast notification
          const toast: ToastData = {
            id: insight.id,
            type: insight.insight_type === 'gap_detected' ? 'gap_detected' :
                  insight.insight_type === 'quiz_suggested' ? 'quiz_suggested' :
                  insight.insight_type === 'milestone_reached' ? 'milestone_reached' : 'info',
            title: insight.insight_type === 'gap_detected' ? '💡 Knowledge Gap Detected' :
                   insight.insight_type === 'quiz_suggested' ? '📝 Quiz Ready' :
                   insight.insight_type === 'milestone_reached' ? '🏆 Milestone!' : 'New Insight',
            message: insight.content,
            actions: insight.insight_type === 'gap_detected' ? [
              {
                label: 'Explore',
                onClick: () => {
                  // Filter graph to show gap cluster (if metadata has cluster)
                  const cluster = insight.metadata?.cluster;
                  if (cluster) {
                    console.log(`[Graph Viewer] Filtering to cluster: ${cluster}`);
                    // TODO: Implement cluster filtering
                  }
                },
              },
              {
                label: 'Take Quiz',
                onClick: () => {
                  const cluster = insight.metadata?.cluster || 'General';
                  console.log(`[Graph Viewer] Opening quiz for: ${cluster}`);
                  // TODO: Open quiz modal
                },
              },
            ] : undefined,
          };

          setToasts((prev) => [...prev, toast]);
        }
      )
      .subscribe();

    console.log('[Graph Viewer] Subscribed to insights');

    return () => {
      supabase.removeChannel(channel);
      console.log('[Graph Viewer] Unsubscribed from insights');
    };
  }, [userId]);

  // Convert graph data to React Flow format with ELK layout
  useEffect(() => {
    layoutGraph(data);
  }, [data]);

  const layoutGraph = async (graphData: GraphData) => {
    setLoading(true);

    try {
      // Prepare nodes and edges for ELK
      const elkNodes = graphData.nodes.map((node) => ({
        id: node.id,
        width: node.type === 'topic' ? 200 : 300,
        height: node.type === 'topic' ? 60 : 80,
      }));

      const elkEdges = graphData.edges.map((edge) => ({
        id: edge.id,
        sources: [edge.source],
        targets: [edge.target],
      }));

      // Calculate layout using ELK
      const graph = await elk.layout({
        id: 'root',
        layoutOptions: {
          'elk.algorithm': 'layered',
          'elk.direction': 'DOWN',
          'elk.spacing.nodeNode': '80',
          'elk.layered.spacing.nodeNodeBetweenLayers': '100',
        },
        children: elkNodes,
        edges: elkEdges,
      });

      // Convert to React Flow nodes
      const flowNodes: Node[] = graphData.nodes.map((node, index) => {
        const elkNode = graph.children?.[index];
        return {
          id: node.id,
          type: node.type,
          position: {
            x: elkNode?.x ?? 0,
            y: elkNode?.y ?? 0,
          },
          data: {
            ...node,
            hasMintedBadge, // Pass badge status to node
          },
        };
      });

      // Convert to React Flow edges
      const flowEdges: Edge[] = graphData.edges.map((edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        type: 'default',
        animated: true, // Animate all edges
        style: {
          strokeWidth: Math.max(1.5, edge.weight * 2),
          stroke: getEdgeColor(edge.type),
          opacity: 0.5,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: getEdgeColorHex(edge.type),
        },
      }));

      setNodes(flowNodes);
      setEdges(flowEdges);
    } catch (error) {
      console.error('Failed to layout graph:', error);
    } finally {
      setLoading(false);
    }
  };

  const onNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    setSelectedNode(node.data as GraphNodeType);
  }, []);

  const handleDismissToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  const handleInsightNode = (content: string) => {
    console.log('[Graph Viewer] Creating insight node:', content);
    // TODO: Insert insight as new node in graph
    // This would require calling the graph processing logic to add a new node
  };

  if (loading) {
    return (
      <div className="relative h-full">
        <div className="bg-gradient-to-br from-[#fefef9] to-[#f9f9f4] border border-border-light overflow-hidden shadow-lg h-full flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-foreground-secondary">Building graph layout...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full min-h-[600px] md:min-h-[720px]">
      <style>{`
        /* Custom handle styling for subtle appearance */
        .react-flow__handle {
          width: 8px !important;
          height: 8px !important;
          border: 2px solid rgba(255, 78, 0, 0.4) !important;
          background: rgba(255, 255, 255, 0.9) !important;
          transition: all 0.2s ease;
        }
        .react-flow__handle:hover {
          background: #ff4e00 !important;
          border-color: #ff4e00 !important;
        }
        .react-flow__viewport {
          min-height: 600px !important;
        }
        @media (min-width: 768px) {
          .react-flow__viewport {
            min-height: 720px !important;
          }
        }
      `}</style>
      <div className="bg-gradient-to-br from-[#fefef9] to-[#f9f9f4] border border-border-light overflow-hidden shadow-lg h-full w-full">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypes}
          fitView
          minZoom={0.1}
          maxZoom={2}
          className="bg-[#fefef9] h-full w-full"
        >
          <Background 
            variant={BackgroundVariant.Dots}
            gap={12} 
            size={1}
            color="rgba(255, 78, 0, 0.08)"
            style={{ backgroundColor: '#fefef9' }}
          />
          <Controls className="!bg-white/80 !backdrop-blur-sm !border-primary/20" />
          <MiniMap
            nodeColor={(node) => {
              if (node.type === 'topic') return '#ff4e00';
              return '#ff8c00';
            }}
            maskColor="rgba(0, 0, 0, 0.05)"
            style={{ backgroundColor: '#fefef9', border: '1px solid rgba(255, 78, 0, 0.2)' }}
            className="!bg-white/80 !backdrop-blur-sm"
          />
        </ReactFlow>
      </div>

      {/* Node Details Sidebar */}
      {selectedNode && (
        <div className="mt-4 bg-white/80 backdrop-blur-sm border border-primary/20 rounded-2xl p-6 shadow-lg transition-all duration-300">
          <div className="flex items-start justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground-primary">
              {selectedNode.type === 'topic' ? '📁 Topic' : '📝 Sentence'}
            </h3>
            <button
              onClick={() => setSelectedNode(null)}
              className="text-foreground-secondary hover:text-foreground-primary transition-colors"
            >
              ✕
            </button>
          </div>

          {selectedNode.type === 'topic' ? (
            <div>
              <div className="text-xl font-bold text-foreground-primary mb-2">
                {selectedNode.label}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <div className="text-sm font-medium text-foreground-secondary mb-1">Sentence</div>
                <div className="text-foreground-primary">{selectedNode.label}</div>
              </div>

              {selectedNode.terms && selectedNode.terms.length > 0 && (
                <div>
                  <div className="text-sm font-medium text-foreground-secondary mb-2">Terms</div>
                  <div className="flex flex-wrap gap-2">
                    {selectedNode.terms.map((term) => (
                      <span
                        key={term}
                        className="px-3 py-1 bg-primary/10 border border-primary/20 text-primary rounded-full text-sm font-medium"
                      >
                        {term}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-4 text-sm">
                {selectedNode.context && (
                  <div>
                    <span className="text-foreground-secondary">Context:</span>{' '}
                    <span className="font-medium text-foreground-primary">{selectedNode.context}</span>
                  </div>
                )}
                {selectedNode.framework && (
                  <div>
                    <span className="text-foreground-secondary">Framework:</span>{' '}
                    <span className="font-medium text-foreground-primary">{selectedNode.framework}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-4">
                <div className="text-sm">
                  <span className="text-foreground-secondary">Confidence:</span>{' '}
                  <span
                    className={`font-medium ${
                      selectedNode.metadata.confidence >= 70
                        ? 'text-primary'
                        : selectedNode.metadata.confidence >= 50
                        ? 'text-[#ff8c00]'
                        : 'text-[#ffb347]'
                    }`}
                  >
                    {selectedNode.metadata.confidence}%
                  </span>
                </div>
                {selectedNode.metadata.quizCompleted && (
                  <div className="text-sm text-primary font-medium">✅ Quiz Completed</div>
                )}
              </div>

              <div className="text-xs text-foreground-tertiary">
                Captured: {new Date(selectedNode.timestamp).toLocaleString()}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={handleDismissToast} />
    </div>
  );
}

function getEdgeColor(type: 'term-match' | 'context-match' | 'both'): string {
  switch (type) {
    case 'both':
      return '#ff6633'; // Orange for strongest connections
    case 'term-match':
      return '#ff8c00'; // Light orange
    case 'context-match':
      return '#ffb347'; // Lighter orange
    default:
      return '#ffd9b3'; // Very light orange
  }
}

function getEdgeColorHex(type: 'term-match' | 'context-match' | 'both'): string {
  return getEdgeColor(type);
}

