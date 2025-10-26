"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { DomainConfig } from '@/lib/domain-config';
import { getDomainIcon } from '@/lib/domain-config';
import { Lock } from 'lucide-react';

interface DomainCardProps {
  domain: DomainConfig;
  sentenceCount: number;
  isEmpty: boolean;
}

export function DomainCard({ domain, sentenceCount, isEmpty }: DomainCardProps) {
  const router = useRouter();
  const Icon = getDomainIcon(domain.icon);

  const handleClick = () => {
    if (!isEmpty) {
      router.push(`/knowledge/domain/${domain.id.toLowerCase()}`);
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`group relative rounded-2xl border border-border bg-card p-6 transition-all cursor-pointer
        ${isEmpty 
          ? 'opacity-60 cursor-not-allowed' 
          : 'hover:border-primary/30 hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-1'
        }`}
    >
      {/* Gradient background overlay */}
      <div
        className={`absolute inset-0 rounded-2xl transition-opacity ${
          isEmpty ? 'opacity-10' : 'opacity-0 group-hover:opacity-5'
        }`}
        style={{
          background: `radial-gradient(circle at 30% 30%, ${domain.color}40, transparent 70%)`,
        }}
      />

      {/* Icon */}
      <div className="relative flex items-center justify-center mb-4">
        <div
          className="rounded-full p-3 transition-transform group-hover:scale-110"
          style={{
            background: isEmpty 
              ? 'rgba(128, 128, 128, 0.2)' 
              : `linear-gradient(135deg, ${domain.color}20, ${domain.color}10)`,
            color: isEmpty ? '#9ca3af' : domain.color,
          }}
        >
          <Icon 
            className={`h-8 w-8 ${isEmpty ? 'opacity-50' : ''}`} 
            strokeWidth={2}
          />
          {isEmpty && (
            <div className="absolute -top-1 -right-1 bg-gray-400 rounded-full p-1">
              <Lock className="h-3 w-3 text-white" />
            </div>
          )}
        </div>
      </div>

      {/* Domain Name */}
      <h3 className={`text-lg font-semibold mb-2 ${
        isEmpty ? 'text-gray-400' : 'text-foreground-primary'
      }`}>
        {domain.name}
      </h3>

      {/* Description */}
      <p className={`text-sm mb-4 ${
        isEmpty ? 'text-gray-400' : 'text-foreground-secondary'
      }`}>
        {domain.description}
      </p>

      {/* Stats */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`text-2xl font-bold ${
            isEmpty ? 'text-gray-400' : 'text-foreground-primary'
          }`}>
            {sentenceCount}
          </span>
          <span className={`text-sm ${
            isEmpty ? 'text-gray-400' : 'text-foreground-secondary'
          }`}>
            {sentenceCount === 1 ? 'sentence' : 'sentences'}
          </span>
        </div>

        {!isEmpty && (
          <span className="text-sm font-medium text-primary">
            Explore →
          </span>
        )}
      </div>

      {isEmpty && (
        <div className="mt-3 pt-3 border-t border-border">
          <p className="text-xs text-gray-400 text-center">
            No data yet
          </p>
        </div>
      )}
    </div>
  );
}

