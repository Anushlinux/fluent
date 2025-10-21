'use client';

import { Handle, Position, NodeProps } from '@xyflow/react';
import { GraphNode } from '@/lib/graphTypes';

export default function SentenceNode({ data }: NodeProps) {
  const nodeData = data as GraphNode;
  const truncatedLabel =
    nodeData.label.length > 60 ? `${nodeData.label.slice(0, 57)}...` : nodeData.label;
  
  const confidenceColor =
    nodeData.metadata.confidence >= 70
      ? 'bg-green-100 border-green-300'
      : nodeData.metadata.confidence >= 50
      ? 'bg-yellow-100 border-yellow-300'
      : 'bg-red-100 border-red-300';

  return (
    <div className={`${confidenceColor} border-2 rounded-lg shadow-md p-3 min-w-[300px] max-w-[300px]`}>
      <Handle type="target" position={Position.Top} className="w-3 h-3" />
      
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="text-sm text-gray-900 leading-snug flex-1">
            {truncatedLabel}
          </div>
          {nodeData.metadata.quizCompleted && (
            <span className="text-lg flex-shrink-0">✅</span>
          )}
        </div>

        {nodeData.terms && nodeData.terms.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {nodeData.terms.slice(0, 3).map((term) => (
              <span
                key={term}
                className="px-2 py-0.5 bg-indigo-600 text-white rounded-full text-xs font-medium"
              >
                {term}
              </span>
            ))}
            {nodeData.terms.length > 3 && (
              <span className="px-2 py-0.5 bg-gray-600 text-white rounded-full text-xs font-medium">
                +{nodeData.terms.length - 3}
              </span>
            )}
          </div>
        )}

        <div className="flex items-center gap-2 text-xs text-gray-600">
          {nodeData.context && (
            <span className="font-medium">{nodeData.context}</span>
          )}
          <span className="text-gray-400">•</span>
          <span>{nodeData.metadata.confidence}%</span>
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
    </div>
  );
}

