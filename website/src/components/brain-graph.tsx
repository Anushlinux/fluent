"use client";

import React, { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
import { getIconComponent } from '@/lib/icon-mapper';

// Custom Node Component
const CustomNode = ({ data }: { data: any }) => {
  const router = useRouter();
  const [pulse, setPulse] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setPulse(p => (p + 1) % 100);
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  const handleClick = () => {
    if (data.nodeId) {
      router.push(`/knowledge/${data.nodeId}`);
    }
  };

  const IconComponent = getIconComponent(data.iconName);
  
  return (
    <div className="relative" onClick={handleClick}>
      <Handle type="target" position={Position.Top} className="opacity-0" />
      <Handle type="source" position={Position.Bottom} className="opacity-0" />
      
      {/* Outer glow ring - animated */}
      <div 
        className="absolute inset-0 rounded-full blur-xl transition-all duration-[8000ms]"
        style={{
          background: `radial-gradient(circle, ${data.color}40 0%, transparent 70%)`,
          transform: `scale(${1.5 + pulse * 0.01})`,
          opacity: 0.6 - pulse * 0.003,
        }}
      />
      
      {/* Middle ring */}
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
        className="relative flex items-center justify-center w-24 h-24 rounded-full shadow-2xl transition-all duration-1000 cursor-pointer hover:scale-110 group"
        style={{
          background: `radial-gradient(circle at 30% 30%, ${data.color}80, ${data.color}40)`,
          backdropFilter: 'blur(10px)',
          border: `2px solid ${data.color}60`,
        }}
      >
        {/* Inner glow */}
        <div 
          className="absolute inset-2 rounded-full opacity-50"
          style={{
            background: `radial-gradient(circle at center, ${data.color}60, transparent)`,
          }}
        />
        
        {/* Icon */}
        <IconComponent 
          className="relative z-10 transition-all duration-1000 group-hover:rotate-12 group-hover:scale-125" 
          size={32}
          style={{ color: '#ffffff' }}
        />
        
        {/* Particles */}
        <div className="absolute inset-0 rounded-full overflow-hidden">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 rounded-full"
              style={{
                background: data.color,
                top: `${20 + i * 30}%`,
                left: `${10 + i * 25}%`,
                animation: `float ${18 + i * 4}s ease-in-out infinite`,
                animationDelay: `${i * 1.5}s`,
                opacity: 0.6,
              }}
            />
          ))}
        </div>
      </div>
      
      {/* Label */}
      <div 
        className="absolute -bottom-12 left-1/2 -translate-x-1/2 text-center whitespace-nowrap px-4 py-2 rounded-full text-sm font-semibold transition-all duration-700"
        style={{
          background: `${data.color}20`,
          color: data.color,
          border: `1px solid ${data.color}40`,
          backdropFilter: 'blur(8px)',
        }}
      >
        {data.label}
      </div>
    </div>
  );
};

// Custom Animated Edge
const AnimatedEdge = ({
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
        strokeWidth={8}
        opacity={0.2}
        className="blur-sm"
      />
      
      {/* Main path */}
      <path
        d={edgePath}
        fill="none"
        stroke={data?.color || '#ff6633'}
        strokeWidth={3}
        opacity={0.6}
        strokeDasharray="10 5"
        strokeDashoffset={offset}
        style={{
          transition: 'stroke-dashoffset 0.2s linear',
        }}
      />
      
      {/* Particles traveling along edge - VERY SLOW */}
      <circle
        r={4}
        fill={data?.color || '#ff6633'}
        opacity={0.8}
      >
        <animateMotion
          dur="25s"
          repeatCount="indefinite"
          path={edgePath}
        />
      </circle>
    </>
  );
};

const nodeTypes: NodeTypes = {
  custom: CustomNode,
};

const edgeTypes: EdgeTypes = {
  animated: AnimatedEdge,
};

const initialNodes: Node[] = [
  {
    id: '1',
    type: 'custom',
    position: { x: 400, y: 100 },
    data: { 
      label: 'Compute Layer',
      iconName: 'Server',
      color: '#ff4e00',
      nodeId: 'compute-layer',
    },
  },
  {
    id: '2',
    type: 'custom',
    position: { x: 150, y: 300 },
    data: { 
      label: 'Global Users',
      iconName: 'Users',
      color: '#ff6633',
      nodeId: 'global-users',
    },
  },
  {
    id: '3',
    type: 'custom',
    position: { x: 650, y: 300 },
    data: { 
      label: 'Data Storage',
      iconName: 'Database',
      color: '#ff8c00',
      nodeId: 'data-storage',
    },
  },
  {
    id: '4',
    type: 'custom',
    position: { x: 400, y: 500 },
    data: { 
      label: 'Edge Network',
      iconName: 'Cloud',
      color: '#ff5722',
      nodeId: 'edge-network',
    },
  },
  {
    id: '5',
    type: 'custom',
    position: { x: 50, y: 100 },
    data: { 
      label: 'AI Processing',
      iconName: 'Brain',
      color: '#ff3d00',
      nodeId: 'ai-processing',
    },
  },
  {
    id: '6',
    type: 'custom',
    position: { x: 750, y: 100 },
    data: { 
      label: 'Real-time Sync',
      iconName: 'Zap',
      color: '#ff6f00',
      nodeId: 'real-time-sync',
    },
  },
  {
    id: '7',
    type: 'custom',
    position: { x: 250, y: 500 },
    data: { 
      label: 'Global CDN',
      iconName: 'Globe',
      color: '#ff4500',
      nodeId: 'global-cdn',
    },
  },
  {
    id: '8',
    type: 'custom',
    position: { x: 550, y: 500 },
    data: { 
      label: 'P2P Network',
      iconName: 'Network',
      color: '#ff7700',
      nodeId: 'p2p-network',
    },
  },
];

const initialEdges: Edge[] = [
  { id: 'e1-2', source: '1', target: '2', type: 'animated', data: { color: '#ff4e00' }, animated: true },
  { id: 'e1-3', source: '1', target: '3', type: 'animated', data: { color: '#ff6633' }, animated: true },
  { id: 'e2-4', source: '2', target: '4', type: 'animated', data: { color: '#ff8c00' }, animated: true },
  { id: 'e3-4', source: '3', target: '4', type: 'animated', data: { color: '#ff5722' }, animated: true },
  { id: 'e5-1', source: '5', target: '1', type: 'animated', data: { color: '#ff3d00' }, animated: true },
  { id: 'e6-1', source: '6', target: '1', type: 'animated', data: { color: '#ff6f00' }, animated: true },
  { id: 'e5-2', source: '5', target: '2', type: 'animated', data: { color: '#ff4500' }, animated: true },
  { id: 'e6-3', source: '6', target: '3', type: 'animated', data: { color: '#ff7700' }, animated: true },
  { id: 'e4-7', source: '4', target: '7', type: 'animated', data: { color: '#ff4e00' }, animated: true },
  { id: 'e4-8', source: '4', target: '8', type: 'animated', data: { color: '#ff6633' }, animated: true },
  { id: 'e7-8', source: '7', target: '8', type: 'animated', data: { color: '#ff8c00' }, animated: true },
  { id: 'e2-7', source: '2', target: '7', type: 'animated', data: { color: '#ff5722' }, animated: true },
  { id: 'e3-8', source: '3', target: '8', type: 'animated', data: { color: '#ff3d00' }, animated: true },
];

export const BrainGraph = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  return (
    <div className="w-full">
      <style>{`
        @keyframes float {
          0%, 100% { transform: translate(0, 0); opacity: 0.3; }
          50% { transform: translate(10px, -10px); opacity: 0.8; }
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
      
      <div className="relative w-full h-[450px] md:h-[700px] overflow-hidden rounded-2xl border border-primary/20"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(255, 78, 0, 0.03) 0%, transparent 70%), linear-gradient(to bottom, #0a0a0a, #1a0f0a)',
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
          minZoom={0.5}
          maxZoom={1.5}
          defaultEdgeOptions={{
            animated: true,
            style: { stroke: '#ff6633', strokeWidth: 2 },
          }}
          proOptions={{ hideAttribution: true }}
        >
          <Background 
            gap={16}
            size={1}
            color="#ff4e0010"
          />
          <Controls 
            className="!bg-card/80 !backdrop-blur-sm !border-primary/20"
          />
        </ReactFlow>
      </div>

      <p className="mt-4 text-center text-sm text-foreground-secondary">
        Interactive global network • Drag nodes to reposition • Zoom and pan to explore
      </p>
    </div>
  );
};