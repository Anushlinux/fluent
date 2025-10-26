import { Server, Users, Database, Cloud, Brain, Zap, Globe, Network, LucideIcon } from 'lucide-react';

export interface KnowledgeNode {
  id: string;
  label: string;
  icon: string;
  color: string;
  description: string;
  details: {
    overview: string;
    keyFeatures: string[];
    technicalSpecs: {
      label: string;
      value: string;
    }[];
    useCases: string[];
    connectedNodes: string[];
  };
}

export const knowledgeNodes: Record<string, KnowledgeNode> = {
  'compute-layer': {
    id: 'compute-layer',
    label: 'Compute Layer',
    icon: 'Server',
    color: '#ff4e00',
    description: 'Distributed computing infrastructure that powers serverless execution across the globe',
    details: {
      overview: 'The Compute Layer is the backbone of our distributed architecture, providing instant code execution at the edge. Built on V8 isolates, it ensures lightning-fast cold starts and seamless scaling from zero to millions of requests.',
      keyFeatures: [
        'Millisecond cold start times',
        'Automatic global distribution',
        'Zero-config scaling',
        'Built-in load balancing',
        'Edge-optimized runtime',
      ],
      technicalSpecs: [
        { label: 'Execution Time', value: '< 1ms startup' },
        { label: 'Memory', value: 'Up to 128MB per request' },
        { label: 'CPU Time', value: '50ms free tier' },
        { label: 'Concurrent Requests', value: 'Unlimited' },
      ],
      useCases: [
        'API endpoints and microservices',
        'Serverless functions',
        'Edge computing applications',
        'Real-time data processing',
      ],
      connectedNodes: ['global-users', 'data-storage', 'ai-processing', 'real-time-sync'],
    },
  },
  'global-users': {
    id: 'global-users',
    label: 'Global Users',
    icon: 'Users',
    color: '#ff6633',
    description: 'Worldwide user base accessing services with ultra-low latency from 330+ cities',
    details: {
      overview: 'Global Users represents our distributed user base spanning every continent. By deploying code to 330+ cities worldwide, we ensure that 95% of the Internet-connected population experiences sub-50ms latency.',
      keyFeatures: [
        'Sub-50ms latency worldwide',
        '330+ city network',
        'Automatic geo-routing',
        'DDoS protection included',
        'WebSocket support',
      ],
      technicalSpecs: [
        { label: 'Global Coverage', value: '95% of population' },
        { label: 'Network Locations', value: '330+ cities' },
        { label: 'Latency', value: '< 50ms p95' },
        { label: 'Uptime', value: '99.99% SLA' },
      ],
      useCases: [
        'Consumer-facing web applications',
        'Mobile app backends',
        'Real-time collaboration tools',
        'Gaming platforms',
      ],
      connectedNodes: ['compute-layer', 'edge-network', 'global-cdn', 'ai-processing'],
    },
  },
  'data-storage': {
    id: 'data-storage',
    label: 'Data Storage',
    icon: 'Database',
    color: '#ff8c00',
    description: 'Globally distributed data storage with automatic replication and consistency',
    details: {
      overview: 'Our Data Storage layer provides multiple storage primitives optimized for different use cases: KV for low-latency key-value access, R2 for object storage, D1 for SQL databases, and Durable Objects for stateful coordination.',
      keyFeatures: [
        'Multiple storage options (KV, R2, D1, Durable Objects)',
        'Global replication',
        'Strong consistency options',
        'Zero egress fees',
        'SQL and NoSQL support',
      ],
      technicalSpecs: [
        { label: 'KV Read Latency', value: '< 10ms globally' },
        { label: 'Storage Capacity', value: 'Unlimited' },
        { label: 'Replication', value: 'Multi-region automatic' },
        { label: 'Egress Fees', value: '$0' },
      ],
      useCases: [
        'Session management',
        'Content delivery',
        'User preferences storage',
        'Application state management',
      ],
      connectedNodes: ['compute-layer', 'edge-network', 'real-time-sync', 'p2p-network'],
    },
  },
  'edge-network': {
    id: 'edge-network',
    label: 'Edge Network',
    icon: 'Cloud',
    color: '#ff5722',
    description: 'Intelligent routing layer that optimizes traffic flow across the global network',
    details: {
      overview: 'The Edge Network intelligently routes requests to the optimal location based on user proximity, server load, and network conditions. It provides built-in security, caching, and performance optimization.',
      keyFeatures: [
        'Smart traffic routing',
        'Built-in WAF and DDoS protection',
        'Automatic SSL/TLS',
        'HTTP/3 and QUIC support',
        'Load balancing',
      ],
      technicalSpecs: [
        { label: 'Network Capacity', value: '405 Tbps' },
        { label: 'Requests/Second', value: '84 million+' },
        { label: 'Edge Locations', value: '330+' },
        { label: 'SSL Overhead', value: 'Zero' },
      ],
      useCases: [
        'Content delivery networks',
        'Web application firewalls',
        'Load balancers',
        'API gateways',
      ],
      connectedNodes: ['compute-layer', 'global-users', 'data-storage', 'global-cdn', 'p2p-network'],
    },
  },
  'ai-processing': {
    id: 'ai-processing',
    label: 'AI Processing',
    icon: 'Brain',
    color: '#ff3d00',
    description: 'Edge-based AI inference with support for popular models and frameworks',
    details: {
      overview: 'AI Processing brings machine learning models to the edge, enabling real-time AI inference with minimal latency. Run popular models from Hugging Face, OpenAI, and custom models directly at the edge.',
      keyFeatures: [
        'Pre-trained model library',
        'Custom model support',
        'GPU acceleration',
        'Streaming responses',
        'Vector similarity search',
      ],
      technicalSpecs: [
        { label: 'Inference Latency', value: '< 100ms' },
        { label: 'Model Size', value: 'Up to 2GB' },
        { label: 'GPU Access', value: 'Shared pool' },
        { label: 'Frameworks', value: 'TensorFlow, PyTorch, ONNX' },
      ],
      useCases: [
        'Text generation and summarization',
        'Image classification',
        'Sentiment analysis',
        'Recommendation systems',
      ],
      connectedNodes: ['compute-layer', 'global-users', 'real-time-sync'],
    },
  },
  'real-time-sync': {
    id: 'real-time-sync',
    label: 'Real-time Sync',
    icon: 'Zap',
    color: '#ff6f00',
    description: 'WebSocket and server-sent events for real-time bidirectional communication',
    details: {
      overview: 'Real-time Sync enables instant bidirectional communication between clients and servers using WebSockets, Server-Sent Events, and Durable Objects for coordination. Perfect for collaborative apps and live updates.',
      keyFeatures: [
        'WebSocket support',
        'Server-Sent Events (SSE)',
        'Durable Objects for coordination',
        'Automatic reconnection',
        'Message ordering guarantees',
      ],
      technicalSpecs: [
        { label: 'Connection Duration', value: 'Unlimited' },
        { label: 'Message Latency', value: '< 50ms p95' },
        { label: 'Concurrent Connections', value: 'Millions per worker' },
        { label: 'Hibernation', value: 'Automatic for idle' },
      ],
      useCases: [
        'Collaborative editing tools',
        'Live chat applications',
        'Real-time dashboards',
        'Multiplayer games',
      ],
      connectedNodes: ['compute-layer', 'data-storage', 'ai-processing'],
    },
  },
  'global-cdn': {
    id: 'global-cdn',
    label: 'Global CDN',
    icon: 'Globe',
    color: '#ff4500',
    description: 'Content delivery network with intelligent caching and asset optimization',
    details: {
      overview: 'The Global CDN caches and delivers static and dynamic content from the nearest edge location. With smart purging, cache analytics, and automatic image optimization, it ensures the fastest possible content delivery.',
      keyFeatures: [
        'Automatic image optimization',
        'Smart caching rules',
        'Cache purging API',
        'Streaming media support',
        'Brotli/Gzip compression',
      ],
      technicalSpecs: [
        { label: 'Cache Hit Ratio', value: '> 95%' },
        { label: 'Bandwidth', value: 'Unlimited' },
        { label: 'File Size', value: 'Up to 5TB' },
        { label: 'Cache TTL', value: 'Configurable' },
      ],
      useCases: [
        'Static website hosting',
        'Media streaming',
        'Large file downloads',
        'Asset delivery',
      ],
      connectedNodes: ['edge-network', 'global-users', 'p2p-network'],
    },
  },
  'p2p-network': {
    id: 'p2p-network',
    label: 'P2P Network',
    icon: 'Network',
    color: '#ff7700',
    description: 'Peer-to-peer networking layer for distributed communication and coordination',
    details: {
      overview: 'The P2P Network enables direct communication between edge nodes and clients, facilitating distributed architectures. Using WebRTC and custom protocols, it creates mesh networks for optimal data flow.',
      keyFeatures: [
        'WebRTC data channels',
        'TURN/STUN servers',
        'Mesh networking',
        'NAT traversal',
        'Encrypted peer connections',
      ],
      technicalSpecs: [
        { label: 'Connection Setup', value: '< 500ms' },
        { label: 'Max Peers', value: 'Unlimited' },
        { label: 'Bandwidth', value: 'Peer-dependent' },
        { label: 'Protocols', value: 'WebRTC, WebSocket' },
      ],
      useCases: [
        'Video conferencing',
        'File sharing',
        'Distributed computing',
        'IoT device communication',
      ],
      connectedNodes: ['edge-network', 'data-storage', 'global-cdn'],
    },
  },
};

export const getConnectedNodes = (nodeId: string): KnowledgeNode[] => {
  const node = knowledgeNodes[nodeId];
  if (!node) return [];
  
  return node.details.connectedNodes
    .map(id => knowledgeNodes[id])
    .filter(Boolean);
};