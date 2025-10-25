'use client';

import { Handle, Position, NodeProps } from '@xyflow/react';
import { GraphNode } from '@/lib/graphTypes';

export default function SentenceNode({ data }: NodeProps) {
  const nodeData = data as GraphNode;
  const truncatedLabel =
    nodeData.label.length > 60 ? `${nodeData.label.slice(0, 57)}...` : nodeData.label;
  
  const confidenceBorder =
    nodeData.metadata.confidence >= 70
      ? 'border-green-400'
      : nodeData.metadata.confidence >= 50
      ? 'border-yellow-400'
      : 'border-red-400';
  
  const hasExplanation = nodeData.metadata.explanation && nodeData.metadata.explanation.trim().length > 0;

  return (
    <div className={`bg-black ${confidenceBorder} border-2 rounded-lg shadow-md p-3 min-w-[300px] max-w-[300px]`}>
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-white" />
      
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="text-sm text-white leading-snug flex-1">
            {truncatedLabel}
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            {hasExplanation && (
              <span 
                className="text-lg cursor-help" 
                title={nodeData.metadata.explanation || undefined}
              >
                💡
              </span>
            )}
            {nodeData.metadata.quizCompleted && (
              <span className="text-lg">✅</span>
            )}
          </div>
        </div>

        {nodeData.terms && nodeData.terms.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {nodeData.terms.slice(0, 3).map((term) => (
              <span
                key={term}
                className="px-2 py-0.5 bg-white/20 border border-white/40 text-white rounded-full text-xs font-medium"
              >
                {term}
              </span>
            ))}
            {nodeData.terms.length > 3 && (
              <span className="px-2 py-0.5 bg-white/10 border border-white/30 text-white rounded-full text-xs font-medium">
                +{nodeData.terms.length - 3}
              </span>
            )}
          </div>
        )}

        <div className="flex items-center gap-2 text-xs text-white/70">
          {nodeData.context && (
            <span className="font-medium">{nodeData.context}</span>
          )}
          <span className="text-white/40">•</span>
          <span>{nodeData.metadata.confidence}%</span>
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-white" />
    </div>
  );
}

