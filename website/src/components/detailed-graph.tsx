"use client";

import React, { useState, useEffect } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  ConnectionMode,
  NodeTypes,
  EdgeTypes,
  Handle,
  Position,
  getBezierPath,
  EdgeProps,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { KnowledgeNode } from '@/lib/knowledge-data';
import { getIconComponent } from '@/lib/icon-mapper';
import { useRouter } from 'next/navigation';

// Custom Node Component for Detailed View
const DetailNode = ({ data }: { data: any }) => {
  const router = useRouter();
  const [pulse, setPulse] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setPulse(p => (p + 1) % 100);
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  const handleClick = () => {
    if (data.nodeId && !data.isCenter) {
      router.push(`/knowledge/${data.nodeId}`);
    }
  };

  const IconComponent = getIconComponent(data.iconName);
  const size = data.isCenter ? 'w-32 h-32' : 'w-20 h-20';
  const iconSize = data.isCenter ? 40 : 28;
  
  return (
    <div className="relative" onClick={handleClick}>
      <Handle type="target" position={Position.Top} className="opacity-0" />
      <Handle type="source" position={Position.Bottom} className="opacity-0" />
      
      {/* Enhanced glow for center node */}
      <div 
        className="absolute inset-0 rounded-full blur-2xl transition-all duration-[8000ms]"
        style={{
          background: `radial-gradient(circle, ${data.color}${data.isCenter ? '60' : '40'} 0%, transparent 70%)`,
          transform: `scale(${data.isCenter ? 2 : 1.5} + ${pulse * 0.01})`,
          opacity: (data.isCenter ? 0.8 : 0.6) - pulse * 0.003,
        }}
      />
      
      {/* Pulsing rings */}
      <div 
        className="absolute inset-0 rounded-full border-2 transition-all duration-[6000ms]"
        style={{
          borderColor: data.color,
          transform: `scale(${1.2 + Math.sin(pulse * 0.1) * 0.1})`,
          opacity: 0.4,
        }}
      />
      
      {/* Main node */}
      <div
        className={`relative flex items-center justify-center ${size} rounded-full shadow-2xl transition-all duration-1000 ${!data.isCenter && 'cursor-pointer hover:scale-110'} group`}
        style={{
          background: `radial-gradient(circle at 30% 30%, ${data.color}${data.isCenter ? '90' : '80'}, ${data.color}${data.isCenter ? '60' : '40'})`,
          backdropFilter: 'blur(10px)',
          border: `${data.isCenter ? '3' : '2'}px solid ${data.color}${data.isCenter ? '80' : '60'}`,
          boxShadow: data.isCenter ? `0 0 60px ${data.color}40` : undefined,
        }}
      >
        {/* Inner glow */}
        <div 
          className="absolute inset-2 rounded-full opacity-60"
          style={{
            background: `radial-gradient(circle at center, ${data.color}70, transparent)`,
          }}
        />
        
        {/* Icon */}
        <IconComponent 
          className={`relative z-10 transition-all duration-1000 ${!data.isCenter && 'group-hover:rotate-12 group-hover:scale-125'}`}
          size={iconSize}
          style={{ color: '#ffffff' }}
          strokeWidth={1.5}
        />
        
        {/* Floating particles */}
        <div className="absolute inset-0 rounded-full overflow-hidden">
          {[...Array(data.isCenter ? 5 : 3)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full"
              style={{
                width: data.isCenter ? '6px' : '4px',
                height: data.isCenter ? '6px' : '4px',
                background: data.color,
                top: `${15 + i * 20}%`,
                left: `${10 + i * 18}%`,
                animation: `float ${18 + i * 4}s ease-in-out infinite`,
                animationDelay: `${i * 1.5}s`,
                opacity: 0.7,
              }}
            />
          ))}
        </div>
      </div>
      
      {/* Label */}
      <div 
        className={`absolute ${data.isCenter ? '-bottom-16' : '-bottom-12'} left-1/2 -translate-x-1/2 text-center whitespace-nowrap px-4 py-2 rounded-full ${data.isCenter ? 'text-base' : 'text-sm'} font-semibold transition-all duration-700`}
        style={{
          background: `${data.color}${data.isCenter ? '30' : '20'}`,
          color: data.color,
          border: `1px solid ${data.color}${data.isCenter ? '60' : '40'}`,
          backdropFilter: 'blur(8px)',
          fontWeight: data.isCenter ? 700 : 600,
        }}
      >
        {data.label}
      </div>
    </div>
  );
};

// Custom Animated Edge for Detailed View
const DetailEdge = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  data,
}: EdgeProps) => {
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setOffset(prev => (prev + 0.2) % 20);
    }, 200);
    return () => clearInterval(interval);
  }, []);

  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  return (
    <>
      {/* Glow layer */}
      <path
        d={edgePath}
        fill="none"
        stroke={data?.color || '#ff6633'}
        strokeWidth={10}
        opacity={0.25}
        className="blur-sm"
      />
      
      {/* Main path */}
      <path
        d={edgePath}
        fill="none"
        stroke={data?.color || '#ff6633'}
        strokeWidth={4}
        opacity={0.7}
        strokeDasharray="12 6"
        strokeDashoffset={offset}
        style={{
          transition: 'stroke-dashoffset 0.2s linear',
        }}
      />
      
      {/* Particles traveling along edge */}
      <circle
        r={5}
        fill={data?.color || '#ff6633'}
        opacity={0.9}
      >
        <animateMotion
          dur="20s"
          repeatCount="indefinite"
          path={edgePath}
        />
      </circle>
    </>
  );
};

const nodeTypes: NodeTypes = {
  detail: DetailNode,
};

const edgeTypes: EdgeTypes = {
  detail: DetailEdge,
};

interface DetailedGraphProps {
  centerNode: KnowledgeNode;
  connectedNodes: KnowledgeNode[];
}

export const DetailedGraph: React.FC<DetailedGraphProps> = ({ centerNode, connectedNodes }) => {
  // Create nodes layout in a circle around the center node
  const createNodes = (): Node[] => {
    const nodes: Node[] = [];
    
    // Center node (larger)
    nodes.push({
      id: 'center',
      type: 'detail',
      position: { x: 400, y: 300 },
      data: {
        label: centerNode.label,
        iconName: centerNode.icon,
        color: centerNode.color,
        isCenter: true,
        nodeId: centerNode.id,
      },
    });

    // Connected nodes in a circle
    const radius = 250;
    const angleStep = (2 * Math.PI) / connectedNodes.length;
    
    connectedNodes.forEach((node, index) => {
      const angle = index * angleStep - Math.PI / 2; // Start from top
      const x = 400 + radius * Math.cos(angle);
      const y = 300 + radius * Math.sin(angle);
      
      nodes.push({
        id: node.id,
        type: 'detail',
        position: { x, y },
        data: {
          label: node.label,
          iconName: node.icon,
          color: node.color,
          isCenter: false,
          nodeId: node.id,
        },
      });
    });

    return nodes;
  };

  const createEdges = (): Edge[] => {
    return connectedNodes.map((node, index) => ({
      id: `e-center-${node.id}`,
      source: 'center',
      target: node.id,
      type: 'detail',
      data: { color: centerNode.color },
      animated: true,
    }));
  };

  const [nodes, setNodes, onNodesChange] = useNodesState(createNodes());
  const [edges, setEdges, onEdgesChange] = useEdgesState(createEdges());

  return (
    <div className="w-full">
      <style>{`
        @keyframes float {
          0%, 100% { transform: translate(0, 0); opacity: 0.4; }
          50% { transform: translate(8px, -8px); opacity: 0.9; }
        }
        
        .react-flow__node {
          background: transparent !important;
          border: none !important;
        }
        
        .react-flow__handle {
          width: 0 !important;
          height: 0 !important;
          border: none !important;
          background: transparent !important;
        }
      `}</style>
      
      <div 
        className="relative w-full h-[500px] md:h-[650px] overflow-hidden rounded-2xl border bg-white"
        style={{
          borderColor: `${centerNode.color}30`,
        }}
      >
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          connectionMode={ConnectionMode.Loose}
          fitView
          fitViewOptions={{
            padding: 0.3,
          }}
          minZoom={0.6}
          maxZoom={1.2}
          defaultEdgeOptions={{
            animated: true,
          }}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={false}
          proOptions={{ hideAttribution: true }}
        >
          <Background 
            gap={16}
            size={1}
            color={`${centerNode.color}20`}
          />
          <Controls 
            className="!bg-white/90 !backdrop-blur-sm"
            style={{
              borderColor: `${centerNode.color}30`,
            }}
          />
        </ReactFlow>
      </div>

      <p className="mt-3 text-center text-sm text-foreground-secondary">
        Click connected nodes to explore • Zoom to see details
      </p>
    </div>
  );
};