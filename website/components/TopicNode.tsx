'use client';

import { Handle, Position, NodeProps } from '@xyflow/react';
import { GraphNode } from '@/lib/graphTypes';

export default function TopicNode({ data }: NodeProps) {
  const nodeData = data as GraphNode;
  return (
    <div className="bg-black border-2 border-white rounded-lg shadow-lg p-4 min-w-[200px]">
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-white" />
      
      <div className="flex items-center gap-2">
        <span className="text-2xl">📁</span>
        <div className="text-white">
          <div className="font-bold text-lg">{nodeData.label}</div>
          <div className="text-xs opacity-70">Topic</div>
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-white" />
    </div>
  );
}

