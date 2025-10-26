"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import {
  Sparkles,
  Video,
  Monitor,
  Users,
  Database,
  Globe,
  Cpu,
  BotMessageSquare,
  DatabaseZap,
  Box,
} from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { id: "ai-agents", label: "AI Agents", icon: Sparkles },
  { id: "webrtc", label: "WebRTC", icon: Video },
  { id: "platforms", label: "Platforms", icon: Monitor },
  { id: "multiplayer", label: "Multiplayer", icon: Users },
  { id: "data-platform", label: "Data Platform", icon: Database },
];

const AIAgentsDiagram = () => (
  <div className="relative w-full h-full p-4 md:py-8 flex flex-col items-center justify-between">
    <div className="relative w-[1090px] h-[300px] scale-[0.7] md:scale-100 flex-shrink-0 origin-top">
      {/* Groups */}
      <div className="absolute top-[60px] left-[70px] w-[184px] h-[124px] border-2 border-dashed border-blue-300/70 rounded-xl">
        <span className="absolute -top-7 left-2 text-sm font-medium text-foreground-secondary/80">Workflow</span>
      </div>
      <div className="absolute top-[60px] left-[286px] w-[184px] h-[124px] border-2 border-dashed border-blue-300/70 rounded-xl">
        <span className="absolute -top-7 left-2 text-sm font-medium text-foreground-secondary/80">Compute</span>
      </div>
      <div className="absolute top-[60px] left-[502px] w-[184px] h-[124px] border-2 border-dashed border-pink-300/70 rounded-xl">
        <span className="absolute -top-7 left-2 text-sm font-medium text-foreground-secondary/80">Workers AI</span>
      </div>
      <div className="absolute top-[60px] left-[718px] w-[276px] h-[124px] border-2 border-dashed border-purple-300/70 rounded-xl">
        <span className="absolute -top-7 left-2 text-sm font-medium text-foreground-secondary/80">Storage</span>
      </div>

      {/* Nodes */}
      <div className="absolute top-[92px] left-[122px] w-[80px] h-[60px] bg-background-secondary border border-border rounded-md flex items-center justify-center">
        <Globe className="w-8 h-8 text-foreground-secondary" />
      </div>
      <div className="absolute top-[92px] left-[338px] w-[80px] h-[60px] bg-background-secondary border border-border rounded-md flex items-center justify-center">
        <Cpu className="w-8 h-8 text-foreground-secondary" />
      </div>
      <div className="absolute top-[92px] left-[554px] w-[80px] h-[60px] bg-background-secondary border border-border rounded-md flex items-center justify-center">
        <BotMessageSquare className="w-8 h-8 text-foreground-secondary" />
      </div>
      <div className="absolute top-[92px] left-[770px] w-[80px] h-[60px] bg-background-secondary border border-border rounded-md flex items-center justify-center">
        <DatabaseZap className="w-8 h-8 text-foreground-secondary" />
      </div>
      <div className="absolute top-[92px] left-[862px] w-[80px] h-[60px] bg-background-secondary border border-border rounded-md flex items-center justify-center">
        <Box className="w-8 h-8 text-foreground-secondary" />
      </div>
      <div className="absolute top-[102px] left-[1030px] w-10 h-10 bg-background-secondary border border-border rounded-full flex items-center justify-center">
        <Globe className="w-6 h-6 text-foreground-secondary" />
      </div>

      {/* Edges */}
      <div className="absolute top-[121px] left-[202px] w-[136px] h-px bg-[repeating-linear-gradient(to_right,rgba(44,44,44,0.4),rgba(44,44,44,0.4)_4px,transparent_4px,transparent_8px)]"></div>
      <div className="absolute top-[121px] left-[418px] w-[136px] h-px bg-[repeating-linear-gradient(to_right,rgba(44,44,44,0.4),rgba(44,44,44,0.4)_4px,transparent_4px,transparent_8px)]"></div>
      <div className="absolute top-[121px] left-[634px] w-[136px] h-px bg-[repeating-linear-gradient(to_right,rgba(44,44,44,0.4),rgba(44,44,44,0.4)_4px,transparent_4px,transparent_8px)]"></div>
      <div className="absolute top-[121px] left-[942px] w-[88px] h-px bg-[repeating-linear-gradient(to_right,rgba(44,44,44,0.4),rgba(44,44,44,0.4)_4px,transparent_4px,transparent_8px)]"></div>
      <svg className="absolute top-[121px] left-[990px] w-[100px] h-[100px] overflow-visible">
        <path d="M 40 0 C 40 60, 40 60, 0 60" stroke="rgba(44,44,44,0.4)" strokeWidth="1" fill="none" strokeDasharray="4 4" />
      </svg>
    </div>

    <div className="w-full max-w-3xl mx-auto px-4 md:px-0 mt-8 md:mt-0">
      <p className="text-foreground-secondary text-base lg:text-lg mb-4 text-balance">
        Build AI agents on durable objects with code execution, inference, AI gateway all built-in
      </p>
      <blockquote className="border-l-2 border-input pl-4">
        <p className="text-foreground-secondary text-base italic">
          "This project of fluent provided everything from OAuth to out-of-the-box remote MCP support so we could quickly build, secure, and scale a fully operational setup."
        </p>
        <footer className="mt-4 flex items-center gap-3">
          <span className="text-caption text-foreground-tertiary">Architecture inspired by</span>
          <Image
            src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/test-clones/12267d59-ceea-426a-953d-bd57056562b2-workers-cloudflare-com/assets/icons/atlassian-3.png"
            alt="Atlassian"
            width={90}
            height={24}
            className="h-auto"
          />
        </footer>
      </blockquote>
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
            ref={(el) => (tabsRef.current[index] = el)}
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
            {activeTab === 'webrtc' && <PlaceholderDiagram tabName="WebRTC" />}
            {activeTab === 'platforms' && <PlaceholderDiagram tabName="Platforms" />}
            {activeTab === 'multiplayer' && <PlaceholderDiagram tabName="Multiplayer" />}
            {activeTab === 'data-platform' && <PlaceholderDiagram tabName="Data Platform" />}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ArchitectureTabs;