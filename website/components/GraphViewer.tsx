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

  if (loading) {
    return (
      <div className="h-[600px] bg-white rounded-lg shadow-md flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Building graph layout...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="bg-white rounded-lg shadow-md overflow-hidden" style={{ height: '600px' }}>
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
        >
          <Background color="#f3f4f6" gap={16} />
          <Controls />
          <MiniMap
            nodeColor={(node) => {
              if (node.type === 'topic') return '#667eea';
              return '#e0e7ff';
            }}
            maskColor="rgba(0, 0, 0, 0.1)"
          />
        </ReactFlow>
      </div>

      {/* Node Details Sidebar */}
      {selectedNode && (
        <div className="mt-4 bg-white rounded-lg shadow-md p-6">
          <div className="flex items-start justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              {selectedNode.type === 'topic' ? '📁 Topic' : '📝 Sentence'}
            </h3>
            <button
              onClick={() => setSelectedNode(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          {selectedNode.type === 'topic' ? (
            <div>
              <div className="text-xl font-bold text-indigo-600 mb-2">
                {selectedNode.label}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <div className="text-sm font-medium text-gray-500 mb-1">Sentence</div>
                <div className="text-gray-900">{selectedNode.label}</div>
              </div>

              {selectedNode.terms && selectedNode.terms.length > 0 && (
                <div>
                  <div className="text-sm font-medium text-gray-500 mb-2">Terms</div>
                  <div className="flex flex-wrap gap-2">
                    {selectedNode.terms.map((term) => (
                      <span
                        key={term}
                        className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium"
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
                    <span className="text-gray-500">Context:</span>{' '}
                    <span className="font-medium text-gray-900">{selectedNode.context}</span>
                  </div>
                )}
                {selectedNode.framework && (
                  <div>
                    <span className="text-gray-500">Framework:</span>{' '}
                    <span className="font-medium text-gray-900">{selectedNode.framework}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-4">
                <div className="text-sm">
                  <span className="text-gray-500">Confidence:</span>{' '}
                  <span
                    className={`font-medium ${
                      selectedNode.metadata.confidence >= 70
                        ? 'text-green-600'
                        : selectedNode.metadata.confidence >= 50
                        ? 'text-yellow-600'
                        : 'text-red-600'
                    }`}
                  >
                    {selectedNode.metadata.confidence}%
                  </span>
                </div>
                {selectedNode.metadata.quizCompleted && (
                  <div className="text-sm text-green-600 font-medium">✅ Quiz Completed</div>
                )}
              </div>

              <div className="text-xs text-gray-500">
                Captured: {new Date(selectedNode.timestamp).toLocaleString()}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function getEdgeColor(type: 'term-match' | 'context-match' | 'both'): string {
  switch (type) {
    case 'both':
      return '#667eea'; // Indigo
    case 'term-match':
      return '#a78bfa'; // Purple
    case 'context-match':
      return '#c4b5fd'; // Light purple
    default:
      return '#d1d5db'; // Gray
  }
}

