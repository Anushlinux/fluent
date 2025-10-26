'use client';

import { Handle, Position, NodeProps } from '@xyflow/react';
import { GraphNode } from '@/lib/graphTypes';

export default function SentenceNode({ data }: NodeProps) {
  const nodeData = data as GraphNode;
  const truncatedLabel =
    nodeData.label.length > 60 ? `${nodeData.label.slice(0, 57)}...` : nodeData.label;
  
  // Confidence-based gradient borders using orange palette
  const getConfidenceBorder = () => {
    if (nodeData.metadata.confidence >= 70) {
      return 'linear-gradient(135deg, #ff4e00, #ff6633)';
    } else if (nodeData.metadata.confidence >= 50) {
      return 'linear-gradient(135deg, #ff6633, #ff8c00)';
    } else {
      return 'linear-gradient(135deg, #ff8c00, #ffb347)';
    }
  };
  
  const hasExplanation = nodeData.metadata.explanation && nodeData.metadata.explanation.trim().length > 0;

  return (
    <div className="relative group min-w-[300px] max-w-[300px]">
      {/* Glassmorphism Card with gradient border */}
      <div 
        className="rounded-xl p-3 transition-all duration-300 hover:scale-[1.02] cursor-pointer"
        style={{
          background: 'rgba(255, 255, 255, 0.7)',
          backdropFilter: 'blur(12px)',
          border: `2px solid transparent`,
          boxShadow: '0 8px 32px rgba(255, 78, 0, 0.1)',
          backgroundImage: `linear-gradient(white, white), ${getConfidenceBorder()}`,
          backgroundOrigin: 'border-box',
          backgroundClip: 'padding-box, border-box',
        }}
      >
        <Handle type="target" position={Position.Top} />
        
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="text-sm text-foreground-primary leading-snug flex-1">
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
                  className="px-2 py-0.5 rounded-full text-xs font-medium"
                  style={{
                    background: 'rgba(255, 78, 0, 0.1)',
                    border: '1px solid rgba(255, 78, 0, 0.3)',
                    color: '#ff4e00',
                  }}
                >
                  {term}
                </span>
              ))}
              {nodeData.terms.length > 3 && (
                <span 
                  className="px-2 py-0.5 rounded-full text-xs font-medium"
                  style={{
                    background: 'rgba(255, 78, 0, 0.05)',
                    border: '1px solid rgba(255, 78, 0, 0.15)',
                    color: '#ff6633',
                  }}
                >
                  +{nodeData.terms.length - 3}
                </span>
              )}
            </div>
          )}

          <div className="flex items-center gap-2 text-xs text-foreground-secondary">
            {nodeData.context && (
              <span className="font-medium">{nodeData.context}</span>
            )}
            <span className="opacity-40">•</span>
            <span>{nodeData.metadata.confidence}%</span>
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

