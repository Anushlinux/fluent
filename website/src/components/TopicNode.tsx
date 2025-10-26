'use client';

import { Handle, Position, NodeProps } from '@xyflow/react';
import { GraphNode } from '@/lib/graphTypes';

export default function TopicNode({ data }: NodeProps) {
  const nodeData = data as GraphNode;
  const hasMintedBadge = (data as any).hasMintedBadge || false;
  
  return (
    <div className="relative group min-w-[200px]">
      {/* Aura glow for minted badges */}
      {hasMintedBadge && (
        <div 
          className="absolute -inset-2 rounded-xl opacity-60 animate-pulse"
          style={{
            background: 'radial-gradient(circle, rgba(255, 215, 0, 0.3), rgba(255, 140, 0, 0.2), transparent)',
            filter: 'blur(12px)',
            animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
          }}
        />
      )}

      {/* Glassmorphism Card */}
      <div 
        className="rounded-xl p-4 transition-all duration-300 hover:scale-105 cursor-pointer relative z-10"
        style={{
          background: hasMintedBadge 
            ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.9), rgba(255, 250, 200, 0.8))'
            : 'rgba(255, 255, 255, 0.7)',
          backdropFilter: 'blur(12px)',
          border: hasMintedBadge 
            ? '2px solid rgba(255, 215, 0, 0.5)'
            : '1px solid rgba(255, 78, 0, 0.2)',
          boxShadow: hasMintedBadge 
            ? '0 12px 40px rgba(255, 215, 0, 0.3), 0 8px 32px rgba(255, 78, 0, 0.1)'
            : '0 8px 32px rgba(255, 78, 0, 0.1)',
        }}
      >
        <Handle type="target" position={Position.Top} />
        
        <div className="flex items-center gap-3">
          {/* Icon with gradient background */}
          <div 
            className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl transition-transform group-hover:rotate-12 relative"
            style={{
              background: hasMintedBadge 
                ? 'linear-gradient(135deg, #FFD700, #FFA500)' 
                : 'linear-gradient(135deg, #ff4e00, #ff6633)',
            }}
          >
            {hasMintedBadge && (
              <div className="absolute -top-1 -right-1 text-lg animate-bounce">🏆</div>
            )}
            📁
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="font-bold text-lg text-foreground-primary truncate">
              {nodeData.label}
            </div>
            <div className="text-xs opacity-60 text-foreground-secondary flex items-center gap-2">
              <span>Topic</span>
              {hasMintedBadge && <span className="text-yellow-500">• Badge Earned</span>}
            </div>
          </div>
        </div>

        {/* Hover gradient accent */}
        <div 
          className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
          style={{
            background: hasMintedBadge 
              ? 'linear-gradient(135deg, rgba(255, 215, 0, 0.1), transparent)' 
              : 'linear-gradient(135deg, rgba(255, 78, 0, 0.05), transparent)',
          }}
        />

        <Handle type="source" position={Position.Bottom} />
      </div>
    </div>
  );
}

