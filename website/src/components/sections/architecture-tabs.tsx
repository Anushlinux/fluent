"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import {
  Sparkles,
  Network,
  Trophy,
  Database,
  Globe,
  Brain,
  Zap,
  Lock,
  Shield,
  Award,
  Wallet,
  Rocket,
} from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { id: "ai-agents", label: "AI Agents", icon: Sparkles },
  { id: "knowledge-capture", label: "Knowledge Capture", icon: Network },
  { id: "badge-system", label: "Badge System", icon: Trophy },
  { id: "data-architecture", label: "Data Layer", icon: Database },
];

const AIAgentsDiagram = () => (
  <div className="relative w-full h-full p-4 md:py-8 flex flex-col items-center justify-between">
    <div className="w-full flex justify-center mb-8">
      <div className="relative w-[1090px] h-[300px] scale-[0.7] md:scale-100 flex-shrink-0">
      {/* Browser Extension */}
      <div className="absolute top-[40px] left-[80px] w-[160px] h-[100px] border-2 border-dashed border-blue-300/70 rounded-xl bg-blue-300/5">
        <span className="absolute -top-6 left-2 text-sm font-medium text-foreground-primary">Browser Extension</span>
        <Globe className="absolute top-[30px] left-[50px] w-12 h-12 text-blue-500" />
      </div>

      {/* uAgents Framework */}
      <div className="absolute top-[40px] left-[270px] w-[180px] h-[140px] border-2 border-dashed border-purple-300/70 rounded-xl bg-purple-300/5">
        <span className="absolute -top-6 left-2 text-sm font-medium text-foreground-primary">uAgents</span>
        <Brain className="absolute top-[40px] left-[50px] w-12 h-12 text-purple-500" />
        <span className="absolute bottom-2 left-2 text-xs text-foreground-secondary">Python AI Agent</span>
      </div>

      {/* ASI:One API */}
      <div className="absolute top-[40px] left-[480px] w-[180px] h-[140px] border-2 border-dashed border-green-300/70 rounded-xl bg-green-300/5">
        <span className="absolute -top-6 left-2 text-sm font-medium text-foreground-primary">ASI:One API</span>
        <Zap className="absolute top-[40px] left-[50px] w-12 h-12 text-green-500" />
        <span className="absolute bottom-2 left-2 text-xs text-foreground-secondary">Extraction & Reasoning</span>
      </div>

      {/* MeTTa Engine */}
      <div className="absolute top-[40px] left-[690px] w-[180px] h-[140px] border-2 border-dashed border-orange-300/70 rounded-xl bg-orange-300/5">
        <span className="absolute -top-6 left-2 text-sm font-medium text-foreground-primary">MeTTa</span>
        <Sparkles className="absolute top-[40px] left-[50px] w-12 h-12 text-orange-500" />
        <span className="absolute bottom-2 left-2 text-xs text-foreground-secondary">Symbolic Reasoning</span>
      </div>

      {/* Supabase */}
      <div className="absolute top-[40px] left-[900px] w-[160px] h-[100px] border-2 border-dashed border-pink-300/70 rounded-xl bg-pink-300/5">
        <span className="absolute -top-6 left-2 text-sm font-medium text-foreground-primary">Supabase</span>
        <Database className="absolute top-[30px] left-[50px] w-12 h-12 text-pink-500" />
      </div>

      {/* Arrows */}
      <svg className="absolute top-[89px] left-[240px] w-[30px]">
        <path d="M 0 0 L 30 0" stroke="rgba(44,44,44,0.4)" strokeWidth="1" fill="none" strokeDasharray="4 4" />
        <polygon points="25,-4 25,4 30,0" fill="rgba(44,44,44,0.4)" />
      </svg>
      <svg className="absolute top-[89px] left-[450px] w-[30px]">
        <path d="M 0 0 L 30 0" stroke="rgba(44,44,44,0.4)" strokeWidth="1" fill="none" strokeDasharray="4 4" />
        <polygon points="25,-4 25,4 30,0" fill="rgba(44,44,44,0.4)" />
      </svg>
      <svg className="absolute top-[89px] left-[660px] w-[30px]">
        <path d="M 0 0 L 30 0" stroke="rgba(44,44,44,0.4)" strokeWidth="1" fill="none" strokeDasharray="4 4" />
        <polygon points="25,-4 25,4 30,0" fill="rgba(44,44,44,0.4)" />
      </svg>
      <svg className="absolute top-[89px] left-[870px] w-[30px]">
        <path d="M 0 0 L 30 0" stroke="rgba(44,44,44,0.4)" strokeWidth="1" fill="none" strokeDasharray="4 4" />
        <polygon points="25,-4 25,4 30,0" fill="rgba(44,44,44,0.4)" />
      </svg>
      </div>
    </div>

    <div className="w-full max-w-3xl mx-auto px-4 md:px-0">
      <p className="text-foreground-secondary text-base lg:text-lg mb-4 text-balance">
        AI-powered gap detection, adaptive quiz generation, and symbolic reasoning to accelerate your Web3 learning journey.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-green-500" />
          <span className="text-foreground-secondary">Smart gap detection every 5 minutes</span>
        </div>
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-purple-500" />
          <span className="text-foreground-secondary">Adaptive quiz generation</span>
        </div>
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-orange-500" />
          <span className="text-foreground-secondary">MeTTa reasoning for deep insights</span>
        </div>
      </div>
    </div>
  </div>
);

const KnowledgeCaptureDiagram = () => (
  <div className="relative w-full h-full p-4 md:py-8 flex flex-col items-center justify-between">
    <div className="w-full flex justify-center mb-8">
      <div className="relative w-[1090px] h-[300px] scale-[0.7] md:scale-100 flex-shrink-0">
      {/* Browser */}
      <div className="absolute top-[40px] left-[50px] w-[140px] h-[100px] border-2 border-dashed border-blue-300/70 rounded-xl bg-blue-300/5">
        <span className="absolute -top-6 left-2 text-sm font-medium text-foreground-primary">Browser</span>
        <Globe className="absolute top-[30px] left-[35px] w-12 h-12 text-blue-500" />
      </div>

      {/* Extension */}
      <div className="absolute top-[40px] left-[220px] w-[140px] h-[100px] border-2 border-dashed border-purple-300/70 rounded-xl bg-purple-300/5">
        <span className="absolute -top-6 left-2 text-sm font-medium text-foreground-primary">Extension</span>
        <Zap className="absolute top-[30px] left-[35px] w-12 h-12 text-purple-500" />
      </div>

      {/* Capture */}
      <div className="absolute top-[40px] left-[390px] w-[140px] h-[100px] border-2 border-dashed border-green-300/70 rounded-xl bg-green-300/5">
        <span className="absolute -top-6 left-2 text-sm font-medium text-foreground-primary">Capture</span>
        <Network className="absolute top-[30px] left-[35px] w-12 h-12 text-green-500" />
      </div>

      {/* Auto-Sync */}
      <div className="absolute top-[40px] left-[560px] w-[140px] h-[100px] border-2 border-dashed border-orange-300/70 rounded-xl bg-orange-300/5">
        <span className="absolute -top-6 left-2 text-sm font-medium text-foreground-primary">Auto-Sync</span>
        <Rocket className="absolute top-[30px] left-[35px] w-12 h-12 text-orange-500" />
      </div>

      {/* Supabase */}
      <div className="absolute top-[40px] left-[730px] w-[140px] h-[100px] border-2 border-dashed border-pink-300/70 rounded-xl bg-pink-300/5">
        <span className="absolute -top-6 left-2 text-sm font-medium text-foreground-primary">Supabase</span>
        <Database className="absolute top-[30px] left-[35px] w-12 h-12 text-pink-500" />
      </div>

      {/* Graph Visualization */}
      <div className="absolute top-[40px] left-[900px] w-[140px] h-[100px] border-2 border-dashed border-cyan-300/70 rounded-xl bg-cyan-300/5">
        <span className="absolute -top-6 left-2 text-sm font-medium text-foreground-primary">Graph</span>
        <Brain className="absolute top-[30px] left-[35px] w-12 h-12 text-cyan-500" />
      </div>

      {/* Arrows */}
      <svg className="absolute top-[89px] left-[190px] w-[30px]">
        <path d="M 0 0 L 30 0" stroke="rgba(44,44,44,0.4)" strokeWidth="1" fill="none" strokeDasharray="4 4" />
        <polygon points="25,-4 25,4 30,0" fill="rgba(44,44,44,0.4)" />
      </svg>
      <svg className="absolute top-[89px] left-[360px] w-[30px]">
        <path d="M 0 0 L 30 0" stroke="rgba(44,44,44,0.4)" strokeWidth="1" fill="none" strokeDasharray="4 4" />
        <polygon points="25,-4 25,4 30,0" fill="rgba(44,44,44,0.4)" />
      </svg>
      <svg className="absolute top-[89px] left-[530px] w-[30px]">
        <path d="M 0 0 L 30 0" stroke="rgba(44,44,44,0.4)" strokeWidth="1" fill="none" strokeDasharray="4 4" />
        <polygon points="25,-4 25,4 30,0" fill="rgba(44,44,44,0.4)" />
      </svg>
      <svg className="absolute top-[89px] left-[700px] w-[30px]">
        <path d="M 0 0 L 30 0" stroke="rgba(44,44,44,0.4)" strokeWidth="1" fill="none" strokeDasharray="4 4" />
        <polygon points="25,-4 25,4 30,0" fill="rgba(44,44,44,0.4)" />
      </svg>
      <svg className="absolute top-[89px] left-[870px] w-[30px]">
        <path d="M 0 0 L 30 0" stroke="rgba(44,44,44,0.4)" strokeWidth="1" fill="none" strokeDasharray="4 4" />
        <polygon points="25,-4 25,4 30,0" fill="rgba(44,44,44,0.4)" />
      </svg>
      </div>
    </div>

    <div className="w-full max-w-3xl mx-auto px-4 md:px-0">
      <p className="text-foreground-secondary text-base lg:text-lg mb-4 text-balance">
        Seamlessly capture knowledge while browsing. Automatic term detection, sentence capture, and real-time graph visualization.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-purple-500" />
          <span className="text-foreground-secondary">20+ Web3 terms auto-detected</span>
        </div>
        <div className="flex items-center gap-2">
          <Rocket className="w-5 h-5 text-orange-500" />
          <span className="text-foreground-secondary">Instant auto-sync to cloud</span>
        </div>
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-cyan-500" />
          <span className="text-foreground-secondary">Real-time graph updates</span>
        </div>
      </div>
    </div>
  </div>
);

const BadgeSystemDiagram = () => (
  <div className="relative w-full h-full p-4 md:py-8 flex flex-col items-center justify-between">
    <div className="w-full flex justify-center mb-8">
      <div className="relative w-[1090px] h-[300px] scale-[0.7] md:scale-100 flex-shrink-0">
      {/* Knowledge Graph */}
      <div className="absolute top-[40px] left-[60px] w-[140px] h-[100px] border-2 border-dashed border-blue-300/70 rounded-xl bg-blue-300/5">
        <span className="absolute -top-6 left-2 text-sm font-medium text-foreground-primary">Graph</span>
        <Network className="absolute top-[30px] left-[35px] w-12 h-12 text-blue-500" />
      </div>

      {/* Quiz System */}
      <div className="absolute top-[40px] left-[230px] w-[140px] h-[100px] border-2 border-dashed border-purple-300/70 rounded-xl bg-purple-300/5">
        <span className="absolute -top-6 left-2 text-sm font-medium text-foreground-primary">Quiz</span>
        <Brain className="absolute top-[30px] left-[35px] w-12 h-12 text-purple-500" />
      </div>

      {/* Wallet */}
      <div className="absolute top-[40px] left-[400px] w-[140px] h-[100px] border-2 border-dashed border-green-300/70 rounded-xl bg-green-300/5">
        <span className="absolute -top-6 left-2 text-sm font-medium text-foreground-primary">Wallet</span>
        <Wallet className="absolute top-[30px] left-[35px] w-12 h-12 text-green-500" />
      </div>

      {/* Smart Contract */}
      <div className="absolute top-[40px] left-[570px] w-[140px] h-[100px] border-2 border-dashed border-orange-300/70 rounded-xl bg-orange-300/5">
        <span className="absolute -top-6 left-2 text-sm font-medium text-foreground-primary">Contract</span>
        <Shield className="absolute top-[30px] left-[35px] w-12 h-12 text-orange-500" />
      </div>

      {/* IPFS */}
      <div className="absolute top-[40px] left-[740px] w-[140px] h-[100px] border-2 border-dashed border-pink-300/70 rounded-xl bg-pink-300/5">
        <span className="absolute -top-6 left-2 text-sm font-medium text-foreground-primary">IPFS</span>
        <Database className="absolute top-[30px] left-[35px] w-12 h-12 text-pink-500" />
      </div>

      {/* Badge NFT */}
      <div className="absolute top-[40px] left-[910px] w-[140px] h-[100px] border-2 border-dashed border-cyan-300/70 rounded-xl bg-cyan-300/5">
        <span className="absolute -top-6 left-2 text-sm font-medium text-foreground-primary">Badge</span>
        <Trophy className="absolute top-[30px] left-[35px] w-12 h-12 text-cyan-500" />
      </div>

      {/* Arrows */}
      <svg className="absolute top-[89px] left-[200px] w-[30px]">
        <path d="M 0 0 L 30 0" stroke="rgba(44,44,44,0.4)" strokeWidth="1" fill="none" strokeDasharray="4 4" />
        <polygon points="25,-4 25,4 30,0" fill="rgba(44,44,44,0.4)" />
      </svg>
      <svg className="absolute top-[89px] left-[370px] w-[30px]">
        <path d="M 0 0 L 30 0" stroke="rgba(44,44,44,0.4)" strokeWidth="1" fill="none" strokeDasharray="4 4" />
        <polygon points="25,-4 25,4 30,0" fill="rgba(44,44,44,0.4)" />
      </svg>
      <svg className="absolute top-[89px] left-[540px] w-[30px]">
        <path d="M 0 0 L 30 0" stroke="rgba(44,44,44,0.4)" strokeWidth="1" fill="none" strokeDasharray="4 4" />
        <polygon points="25,-4 25,4 30,0" fill="rgba(44,44,44,0.4)" />
      </svg>
      <svg className="absolute top-[89px] left-[710px] w-[30px]">
        <path d="M 0 0 L 30 0" stroke="rgba(44,44,44,0.4)" strokeWidth="1" fill="none" strokeDasharray="4 4" />
        <polygon points="25,-4 25,4 30,0" fill="rgba(44,44,44,0.4)" />
      </svg>
      <svg className="absolute top-[89px] left-[880px] w-[30px]">
        <path d="M 0 0 L 30 0" stroke="rgba(44,44,44,0.4)" strokeWidth="1" fill="none" strokeDasharray="4 4" />
        <polygon points="25,-4 25,4 30,0" fill="rgba(44,44,44,0.4)" />
      </svg>
      </div>
    </div>

    <div className="w-full max-w-3xl mx-auto px-4 md:px-0">
      <p className="text-foreground-secondary text-base lg:text-lg mb-4 text-balance">
        Prove your Web3 mastery with soulbound NFT badges. Mint non-transferable tokens as proof of domain expertise.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-purple-500" />
          <span className="text-foreground-secondary">80% quiz pass threshold</span>
        </div>
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-orange-500" />
          <span className="text-foreground-secondary">Soulbound ERC-721 on Base</span>
        </div>
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-cyan-500" />
          <span className="text-foreground-secondary">Perpetual proof of mastery</span>
        </div>
      </div>
    </div>
  </div>
);

const DataArchitectureDiagram = () => (
  <div className="relative w-full h-full p-4 md:py-8 flex flex-col items-center justify-between">
    <div className="w-full flex justify-center mb-8">
      <div className="relative w-[1090px] h-[300px] scale-[0.7] md:scale-100 flex-shrink-0">
      {/* Supabase Core */}
      <div className="absolute top-[40px] left-[80px] w-[200px] h-[140px] border-2 border-dashed border-blue-300/70 rounded-xl bg-blue-300/5">
        <span className="absolute -top-6 left-2 text-sm font-medium text-foreground-primary">Supabase</span>
        <Database className="absolute top-[30px] left-[60px] w-12 h-12 text-blue-500" />
        <span className="absolute bottom-2 left-2 text-xs text-foreground-secondary text-center w-full">PostgreSQL + pgvector</span>
      </div>

      {/* Tables */}
      <div className="absolute top-[40px] left-[310px] w-[320px] h-[140px] border-2 border-dashed border-purple-300/70 rounded-xl bg-purple-300/5">
        <span className="absolute -top-6 left-2 text-sm font-medium text-foreground-primary">Key Tables</span>
        <div className="absolute top-[25px] left-4 text-xs text-foreground-secondary space-y-1">
          <div>• profiles (user data)</div>
          <div>• captured_sentences</div>
          <div>• graph_nodes & graph_edges</div>
          <div>• owned_nfts (badges)</div>
          <div>• insights (gaps)</div>
        </div>
      </div>

      {/* RLS */}
      <div className="absolute top-[40px] left-[660px] w-[140px] h-[100px] border-2 border-dashed border-green-300/70 rounded-xl bg-green-300/5">
        <span className="absolute -top-6 left-2 text-sm font-medium text-foreground-primary">Security</span>
        <Lock className="absolute top-[30px] left-[35px] w-12 h-12 text-green-500" />
      </div>

      {/* Real-time */}
      <div className="absolute top-[40px] left-[830px] w-[140px] h-[100px] border-2 border-dashed border-orange-300/70 rounded-xl bg-orange-300/5">
        <span className="absolute -top-6 left-2 text-sm font-medium text-foreground-primary">Realtime</span>
        <Zap className="absolute top-[30px] left-[35px] w-12 h-12 text-orange-500" />
      </div>

      {/* Arrows */}
      <svg className="absolute top-[89px] left-[280px] w-[30px]">
        <path d="M 0 0 L 30 0" stroke="rgba(44,44,44,0.4)" strokeWidth="1" fill="none" strokeDasharray="4 4" />
        <polygon points="25,-4 25,4 30,0" fill="rgba(44,44,44,0.4)" />
      </svg>
      <svg className="absolute top-[89px] left-[630px] w-[30px]">
        <path d="M 0 0 L 30 0" stroke="rgba(44,44,44,0.4)" strokeWidth="1" fill="none" strokeDasharray="4 4" />
        <polygon points="25,-4 25,4 30,0" fill="rgba(44,44,44,0.4)" />
      </svg>
      <svg className="absolute top-[89px] left-[800px] w-[30px]">
        <path d="M 0 0 L 30 0" stroke="rgba(44,44,44,0.4)" strokeWidth="1" fill="none" strokeDasharray="4 4" />
        <polygon points="25,-4 25,4 30,0" fill="rgba(44,44,44,0.4)" />
      </svg>
      </div>
    </div>

    <div className="w-full max-w-3xl mx-auto px-4 md:px-0">
      <p className="text-foreground-secondary text-base lg:text-lg mb-4 text-balance">
        Secure, real-time database with Row Level Security and automatic graph processing.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
        <div className="flex items-center gap-2">
          <Database className="w-5 h-5 text-blue-500" />
          <span className="text-foreground-secondary">PostgreSQL with pgvector</span>
        </div>
        <div className="flex items-center gap-2">
          <Lock className="w-5 h-5 text-green-500" />
          <span className="text-foreground-secondary">Row Level Security (RLS)</span>
        </div>
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-orange-500" />
          <span className="text-foreground-secondary">Real-time subscriptions</span>
        </div>
      </div>
    </div>
  </div>
);

const PlaceholderDiagram = ({ tabName }: { tabName: string }) => (
  <div className="flex items-center justify-center min-h-[440px] md:min-h-[500px] text-foreground-secondary text-lg font-mono">
    {tabName} Architecture Diagram
  </div>
);

const ArchitectureTabs = () => {
  const [activeTab, setActiveTab] = useState(tabs[0].id);
  const tabsRef = useRef<(HTMLButtonElement | null)[]>([]);
  const indicatorRef = useRef<HTMLDivElement | null>(null);
  const tabsContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const activeTabIndex = tabs.findIndex(tab => tab.id === activeTab);
    const activeButton = tabsRef.current[activeTabIndex];
    const container = tabsContainerRef.current;

    if (activeButton && indicatorRef.current && container) {
      const containerRect = container.getBoundingClientRect();
      const buttonRect = activeButton.getBoundingClientRect();

      indicatorRef.current.style.width = `${buttonRect.width}px`;
      indicatorRef.current.style.left = `${buttonRect.left - containerRect.left}px`;
    }
  }, [activeTab]);

  return (
    <section className="relative mx-auto flex min-h-[440px] w-full max-w-[1216px] flex-col items-center gap-10 pt-2 pb-2.5 md:min-h-[600px] md:px-2 2xl:max-w-[1504px]">
      <div
        ref={tabsContainerRef}
        role="tablist"
        aria-label="Architecture diagrams"
        className="bg-secondary scrollbar-hide relative z-20 -mb-[26px] flex max-w-[calc(100%-1rem)] shrink-0 items-center gap-1 overflow-x-auto rounded-full border border-border p-1 md:max-w-none md:overflow-x-visible"
      >
        <div
          ref={indicatorRef}
          className="bg-primary absolute top-1 h-[calc(100%-8px)] rounded-full transition-all duration-300 ease-out"
          style={{ width: '133px' }}
        />
        {tabs.map((tab, index) => (
          <button
            key={tab.id}
            ref={(el) => {
              tabsRef.current[index] = el;
            }}
            onClick={() => setActiveTab(tab.id)}
            role="tab"
            aria-selected={activeTab === tab.id}
            className={cn(
              "relative z-10 flex cursor-pointer items-center gap-2 whitespace-nowrap rounded-full px-3.5 py-2.5 text-sm font-medium tracking-[-0.01em] transition-colors duration-300 ease-out focus:outline-none",
              activeTab === tab.id
                ? "text-primary-foreground"
                : "text-foreground-secondary hover:bg-black/5"
            )}
          >
            <tab.icon className="h-5 w-5" />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="relative h-full w-full max-w-[1200px]" role="tabpanel">
        <div className="hidden md:block pointer-events-none absolute inset-0 z-10 select-none">
          <div className="absolute top-0 left-0 w-24 h-24 bg-[radial-gradient(circle_at_top_left,var(--background)_50%,transparent)]"></div>
          <div className="absolute top-0 right-0 w-24 h-24 bg-[radial-gradient(circle_at_top_right,var(--background)_50%,transparent)]"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-[radial-gradient(circle_at_bottom_left,var(--background)_50%,transparent)]"></div>
          <div className="absolute bottom-0 right-0 w-24 h-24 bg-[radial-gradient(circle_at_bottom_right,var(--background)_50%,transparent)]"></div>
        </div>

        <div className="relative h-full w-full font-mono flex flex-col justify-center overflow-hidden bg-[rgba(255,78,0,0.025)] border-t md:border border-border md:rounded-xl">
          <div className="transition-opacity duration-200 ease-out">
            {activeTab === 'ai-agents' && <AIAgentsDiagram />}
            {activeTab === 'knowledge-capture' && <KnowledgeCaptureDiagram />}
            {activeTab === 'badge-system' && <BadgeSystemDiagram />}
            {activeTab === 'data-architecture' && <DataArchitectureDiagram />}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ArchitectureTabs;