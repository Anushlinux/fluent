'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  ReactFlow,
  Node,
  Edge,
  Background,
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
import { GraphChat } from './GraphChat';
import { getSupabaseBrowserClient } from '@/lib/supabase';

const elk = new ELK();

// Custom node types
const nodeTypes = {
  topic: TopicNode,
  sentence: SentenceNode,
};

interface GraphViewerProps {
  data: GraphData;
}

export default function GraphViewer({ data }: GraphViewerProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState<GraphNodeType | null>(null);
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const [userId, setUserId] = useState<string | null>(null);

  // Get current user ID
  useEffect(() => {
    const fetchUserId = async () => {
      try {
        const supabase = getSupabaseBrowserClient();
        const { data: { user } } = await supabase.auth.getUser();
        setUserId(user?.id || null);
      } catch (error) {
        console.error('[Graph Viewer] Failed to get user ID:', error);
      }
    };
    fetchUserId();
  }, []);

  // Subscribe to real-time insights
  useEffect(() => {
    if (!userId) return;

    const supabase = getSupabaseBrowserClient();

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
          data: node,
        };
      });

      // Convert to React Flow edges
      const flowEdges: Edge[] = graphData.edges.map((edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        type: 'default',
        animated: edge.type === 'both',
        style: {
          strokeWidth: Math.max(1, edge.weight * 3),
          stroke: getEdgeColor(edge.type),
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: getEdgeColor(edge.type),
        },
        label: edge.weight >= 0.7 ? `${Math.round(edge.weight * 100)}%` : undefined,
        labelStyle: {
          fontSize: 10,
          fill: '#666',
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
      <div className="h-[600px] bg-black border border-white/20 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white/80">Building graph layout...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="bg-black border border-white/20 rounded-lg overflow-hidden" style={{ height: '600px' }}>
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
          style={{ background: '#000000' }}
        >
          <Background color="#ffffff" gap={16} style={{ opacity: 0.1 }} />
          <Controls style={{ button: { backgroundColor: '#000000', color: '#ffffff', border: '1px solid rgba(255,255,255,0.2)' } }} />
          <MiniMap
            nodeColor={(node) => {
              if (node.type === 'topic') return '#ffffff';
              return '#666666';
            }}
            maskColor="rgba(255, 255, 255, 0.1)"
            style={{ backgroundColor: '#000000', border: '1px solid rgba(255,255,255,0.2)' }}
          />
        </ReactFlow>
      </div>

      {/* Node Details Sidebar */}
      {selectedNode && (
        <div className="mt-4 bg-black border border-white/20 rounded-lg p-6">
          <div className="flex items-start justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">
              {selectedNode.type === 'topic' ? '📁 Topic' : '📝 Sentence'}
            </h3>
            <button
              onClick={() => setSelectedNode(null)}
              className="text-white/60 hover:text-white"
            >
              ✕
            </button>
          </div>

          {selectedNode.type === 'topic' ? (
            <div>
              <div className="text-xl font-bold text-white mb-2">
                {selectedNode.label}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <div className="text-sm font-medium text-white/70 mb-1">Sentence</div>
                <div className="text-white">{selectedNode.label}</div>
              </div>

              {selectedNode.terms && selectedNode.terms.length > 0 && (
                <div>
                  <div className="text-sm font-medium text-white/70 mb-2">Terms</div>
                  <div className="flex flex-wrap gap-2">
                    {selectedNode.terms.map((term) => (
                      <span
                        key={term}
                        className="px-3 py-1 bg-white/10 border border-white/30 text-white rounded-full text-sm font-medium"
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
                    <span className="text-white/70">Context:</span>{' '}
                    <span className="font-medium text-white">{selectedNode.context}</span>
                  </div>
                )}
                {selectedNode.framework && (
                  <div>
                    <span className="text-white/70">Framework:</span>{' '}
                    <span className="font-medium text-white">{selectedNode.framework}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-4">
                <div className="text-sm">
                  <span className="text-white/70">Confidence:</span>{' '}
                  <span
                    className={`font-medium ${
                      selectedNode.metadata.confidence >= 70
                        ? 'text-green-400'
                        : selectedNode.metadata.confidence >= 50
                        ? 'text-yellow-400'
                        : 'text-red-400'
                    }`}
                  >
                    {selectedNode.metadata.confidence}%
                  </span>
                </div>
                {selectedNode.metadata.quizCompleted && (
                  <div className="text-sm text-green-400 font-medium">✅ Quiz Completed</div>
                )}
              </div>

              <div className="text-xs text-white/60">
                Captured: {new Date(selectedNode.timestamp).toLocaleString()}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={handleDismissToast} />

      {/* Graph Chat */}
      <GraphChat userId={userId} onInsightNode={handleInsightNode} />
    </div>
  );
}

function getEdgeColor(type: 'term-match' | 'context-match' | 'both'): string {
  switch (type) {
    case 'both':
      return '#ffffff'; // White (high opacity for strongest connections)
    case 'term-match':
      return 'rgba(255, 255, 255, 0.6)'; // White with 60% opacity
    case 'context-match':
      return 'rgba(255, 255, 255, 0.4)'; // White with 40% opacity
    default:
      return 'rgba(255, 255, 255, 0.2)'; // White with 20% opacity
  }
}

