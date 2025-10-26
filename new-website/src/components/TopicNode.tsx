'use client';

import { Handle, Position, NodeProps } from '@xyflow/react';
import { GraphNode } from '@/lib/graphTypes';

export default function TopicNode({ data }: NodeProps) {
  const nodeData = data as GraphNode;
  return (
    <div className="relative group min-w-[200px]">
      {/* Glassmorphism Card */}
      <div 
        className="rounded-xl p-4 transition-all duration-300 hover:scale-105 cursor-pointer"
        style={{
          background: 'rgba(255, 255, 255, 0.7)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 78, 0, 0.2)',
          boxShadow: '0 8px 32px rgba(255, 78, 0, 0.1)',
        }}
      >
        <Handle type="target" position={Position.Top} />
        
        <div className="flex items-center gap-3">
          {/* Icon with gradient background */}
          <div 
            className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl transition-transform group-hover:rotate-12"
            style={{
              background: 'linear-gradient(135deg, #ff4e00, #ff6633)',
            }}
          >
            📁
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="font-bold text-lg text-foreground-primary truncate">
              {nodeData.label}
            </div>
            <div className="text-xs opacity-60 text-foreground-secondary">Topic</div>
          </div>
        </div>

        {/* Hover gradient accent */}
        <div 
          className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
          style={{
            background: 'linear-gradient(135deg, rgba(255, 78, 0, 0.05), transparent)',
          }}
        />

        <Handle type="source" position={Position.Bottom} />
      </div>
    </div>
  );
}

