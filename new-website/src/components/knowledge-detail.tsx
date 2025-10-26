"use client";

import React, { useState } from 'react';
import { KnowledgeNode, getConnectedNodes } from '@/lib/knowledge-data';
import { getIconComponent } from '@/lib/icon-mapper';
import { DetailedGraph } from '@/components/detailed-graph';
import { ArrowLeft, Sparkles, Check } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface KnowledgeDetailProps {
  node: KnowledgeNode;
}

export const KnowledgeDetail: React.FC<KnowledgeDetailProps> = ({ node }) => {
  const router = useRouter();
  const [isMinting, setIsMinting] = useState(false);
  const [isMinted, setIsMinted] = useState(false);
  const IconComponent = getIconComponent(node.icon);
  const connectedNodes = getConnectedNodes(node.id);

  const handleMint = async () => {
    setIsMinting(true);
    // Simulate minting process
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsMinting(false);
    setIsMinted(true);
  };

  return (
    <div className="relative bg-background-primary">
      {/* Dotted background */}
      <div
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          backgroundImage: 'radial-gradient(var(--color-map-dots) 1px, transparent 1px)',
          backgroundSize: '12px 12px',
          opacity: 0.1,
        }}
      />

      <div className="container relative z-10 mx-auto max-w-[1216px] px-4 py-12 md:py-20 xl:px-0">
        {/* Back Button */}
        <button
          onClick={() => router.push('/')}
          className="group mb-8 flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-foreground-secondary transition-all hover:border-primary/30 hover:bg-primary/5"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          Back to Network
        </button>

        {/* Header Section */}
        <div className="mb-12 flex flex-col items-center text-center">
          {/* Icon */}
          <div
            className="mb-6 flex h-24 w-24 items-center justify-center rounded-full shadow-2xl"
            style={{
              background: `radial-gradient(circle at 30% 30%, ${node.color}80, ${node.color}40)`,
              border: `2px solid ${node.color}60`,
            }}
          >
            <IconComponent className="h-12 w-12 text-white" strokeWidth={1.5} />
          </div>

          {/* Title */}
          <h1 className="mb-4 text-4xl font-semibold -tracking-[0.01em] text-foreground-primary md:text-5xl lg:text-6xl">
            {node.label}
          </h1>

          {/* Description */}
          <p className="max-w-[800px] text-lg text-foreground-secondary md:text-xl">
            {node.description}
          </p>
        </div>

        {/* Main Content: Graph + Details Side by Side */}
        <div className="mb-12 grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Enhanced Graph Visualization */}
          <div className="flex flex-col">
            <h3 className="mb-4 text-2xl font-semibold text-foreground-primary">
              Network Connections
            </h3>
            <DetailedGraph centerNode={node} connectedNodes={connectedNodes} />
          </div>

          {/* Details Panel */}
          <div className="flex flex-col gap-6">
            <h3 className="text-2xl font-semibold text-foreground-primary">
              Details
            </h3>

            {/* Overview Card */}
            <div className="rounded-2xl border border-border bg-card p-6">
              <h4 className="mb-3 text-lg font-semibold text-foreground-primary">
                Overview
              </h4>
              <p className="text-base leading-relaxed text-foreground-secondary">
                {node.details.overview}
              </p>
            </div>

            {/* Key Features Card */}
            <div className="rounded-2xl border border-border bg-card p-6">
              <h4 className="mb-3 text-lg font-semibold text-foreground-primary">
                Key Features
              </h4>
              <ul className="space-y-2">
                {node.details.keyFeatures.map((feature, index) => (
                  <li
                    key={index}
                    className="flex items-start gap-2 text-base text-foreground-secondary"
                  >
                    <span
                      className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full"
                      style={{ backgroundColor: node.color }}
                    />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            {/* Technical Specs Card */}
            <div className="rounded-2xl border border-border bg-card p-6">
              <h4 className="mb-3 text-lg font-semibold text-foreground-primary">
                Technical Specifications
              </h4>
              <div className="space-y-3">
                {node.details.technicalSpecs.map((spec, index) => (
                  <div key={index} className="flex justify-between">
                    <span className="text-sm font-medium text-foreground-secondary">
                      {spec.label}
                    </span>
                    <span
                      className="text-sm font-semibold"
                      style={{ color: node.color }}
                    >
                      {spec.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Use Cases Section */}
        <div className="mb-12 rounded-2xl border border-border bg-card p-6 md:p-10">
          <h3 className="mb-6 text-2xl font-semibold text-foreground-primary">
            Use Cases
          </h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {node.details.useCases.map((useCase, index) => (
              <div
                key={index}
                className="rounded-xl border border-border bg-background-primary p-4 transition-all hover:border-primary/30"
              >
                <p className="text-base text-foreground-secondary">{useCase}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Connected Nodes Section */}
        <div className="mb-12 rounded-2xl border border-border bg-card p-6 md:p-10">
          <h3 className="mb-6 text-2xl font-semibold text-foreground-primary">
            Connected Knowledge Nodes
          </h3>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {connectedNodes.map((connectedNode) => {
              const ConnectedIcon = getIconComponent(connectedNode.icon);
              return (
                <button
                  key={connectedNode.id}
                  onClick={() => router.push(`/knowledge/${connectedNode.id}`)}
                  className="group flex flex-col items-center gap-3 rounded-xl border border-border bg-background-primary p-4 transition-all hover:border-primary/30 hover:shadow-lg"
                >
                  <div
                    className="flex h-16 w-16 items-center justify-center rounded-full transition-transform group-hover:scale-110"
                    style={{
                      background: `radial-gradient(circle at 30% 30%, ${connectedNode.color}80, ${connectedNode.color}40)`,
                      border: `2px solid ${connectedNode.color}60`,
                    }}
                  >
                    <ConnectedIcon className="h-8 w-8 text-white" />
                  </div>
                  <span className="text-center text-sm font-medium text-foreground-secondary">
                    {connectedNode.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Mint Button Section */}
        <div className="flex justify-center">
          <button
            onClick={handleMint}
            disabled={isMinting || isMinted}
            className="group relative overflow-hidden rounded-full px-8 py-4 text-lg font-semibold text-white shadow-2xl transition-all hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-80"
            style={{
              background: isMinted
                ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                : `linear-gradient(135deg, ${node.color} 0%, ${node.color}dd 100%)`,
            }}
          >
            {/* Animated gradient overlay on hover */}
            <div
              className="absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100"
              style={{
                background: `linear-gradient(135deg, ${node.color}dd 0%, ${node.color} 100%)`,
              }}
            />

            {/* Button content */}
            <span className="relative flex items-center gap-3">
              {isMinting ? (
                <>
                  <Sparkles className="h-5 w-5 animate-spin" />
                  Minting Knowledge...
                </>
              ) : isMinted ? (
                <>
                  <Check className="h-5 w-5" />
                  Knowledge Minted!
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5 transition-transform group-hover:rotate-12" />
                  Mint This Knowledge
                </>
              )}
            </span>

            {/* Shimmer effect */}
            {!isMinted && (
              <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent"
                style={{
                  animation: 'shimmer 2s infinite',
                }}
              />
            )}
          </button>
        </div>

        {isMinted && (
          <p className="mt-4 text-center text-sm text-foreground-secondary">
            This knowledge has been added to your collection! 🎉
          </p>
        )}
      </div>

      <style>{`
        @keyframes shimmer {
          100% {
            transform: translateX(200%);
          }
        }
      `}</style>
    </div>
  );
};