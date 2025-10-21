# Fluent Knowledge Graph

An interactive visualization tool for exploring your learning journey captured by the Fluent browser extension.

## Overview

This standalone Next.js application visualizes your captured sentences as an interactive knowledge graph, showing:
- **Topic-level clustering** - Related sentences grouped by context (DeFi, L2, ERC-4337, etc.)
- **Weighted connections** - Edges show relationship strength between sentences
- **Learning insights** - Stats and analytics about your knowledge journey
- **Queryable views** - Filter by topic, framework, confidence, or time range

## Features

- 📊 **Interactive Graph Visualization** - Built with React Flow and ELK.js auto-layout
- 🔍 **Smart Filtering** - Filter by topics, frameworks, quiz completion, confidence levels
- 📈 **Learning Analytics** - Track sentences captured, topics explored, link strength
- 💾 **Local Storage** - Data persists in browser using localForage
- 🎯 **Journey Insights** - Contextual messages based on your learning patterns
- 🕐 **Time-based Views** - Explore learning paths by date range

## Getting Started

### Prerequisites

- Node.js 18+ and npm/pnpm/yarn
- Fluent browser extension installed and configured

### Installation

1. **Install dependencies**:
   ```bash
   npm install
   # or
   pnpm install
   # or
   yarn install
   ```

2. **Run development server**:
   ```bash
   npm run dev
   # or
   pnpm dev
   # or
   yarn dev
   ```

3. **Open your browser**:
   Navigate to [http://localhost:3001](http://localhost:3001)

### Production Build

```bash
npm run build
npm start
```

## Usage

### 1. Export Data from Fluent Extension

1. Open the Fluent browser extension
2. Go to the Dashboard tab
3. Scroll to "Export Data" section
4. Click "🕸️ Export for Graph" button
5. Save the JSON file (e.g., `fluent-graph-2025-01-20.json`)

### 2. Load Data in Graph Viewer

**Option A: Upload Your Data**
1. Open the Fluent Knowledge Graph website
2. Click or drag your exported JSON file to the upload area
3. The graph will automatically load and display

**Option B: Try Demo Data**
1. Click "Load Demo Data" button on the landing page
2. Explore the sample graph to understand features

### 3. Explore Your Graph

**Filters**:
- **Filter by Topic** - View sentences related to specific contexts (DeFi, L2, etc.)
- **Filter by Framework** - Show only Ethereum, Solana, or other framework sentences

**Quick Views**:
- **📚 My Journey** - Full chronological view of all captured sentences
- **✅ Quiz Trail** - Only sentences with completed quizzes
- **⭐ High Confidence** - Sentences with ≥70% confidence
- **🕐 Last 7 Days** - Recent learning activity

**Graph Interaction**:
- **Click nodes** - View full sentence details in sidebar
- **Zoom/Pan** - Navigate large graphs
- **MiniMap** - Overview of entire graph structure

## Project Structure

```
fluent-graph/
├── app/
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Main app page
│   └── globals.css         # Global styles
├── components/
│   ├── GraphViewer.tsx     # React Flow graph component
│   ├── TopicNode.tsx       # Custom topic node
│   ├── SentenceNode.tsx    # Custom sentence node
│   ├── QueryControls.tsx   # Filter and query UI
│   └── StatsPanel.tsx      # Analytics dashboard
├── lib/
│   ├── graphTypes.ts       # TypeScript interfaces
│   ├── graphStorage.ts     # LocalForage storage layer
│   └── graphUtils.ts       # Graph manipulation utilities
└── public/
    └── sample-graph.json   # Demo data
```

## Graph Data Format

The extension exports JSON in this format:

```json
{
  "nodes": [
    {
      "id": "unique-id",
      "type": "topic" | "sentence",
      "label": "Topic name or sentence text",
      "terms": ["Term1", "Term2"],
      "context": "ERC-4337",
      "framework": "Ethereum",
      "timestamp": "2025-01-20T10:00:00.000Z",
      "metadata": {
        "confidence": 85,
        "quizCompleted": false
      }
    }
  ],
  "edges": [
    {
      "id": "edge-id",
      "source": "source-node-id",
      "target": "target-node-id",
      "weight": 0.75,
      "type": "term-match" | "context-match" | "both"
    }
  ],
  "stats": {
    "totalSentences": 15,
    "topicCount": 4,
    "avgLinkStrength": 0.68
  }
}
```

## Edge Weight Calculation

Edges between sentences are weighted based on:
- **Shared Terms** (0-0.5): Number of common terms normalized
- **Context Match** (+0.3): Both sentences have same context
- **Framework Match** (+0.2): Both sentences use same framework

Formula: `weight = (sharedTerms/totalTerms) * 0.5 + contextMatch * 0.3 + frameworkMatch * 0.2`

Edges with weight < 0.3 are filtered out.

## Technologies

- **Next.js 15** - React framework
- **React Flow** (@xyflow/react) - Graph visualization
- **ELK.js** - Automatic graph layout
- **localForage** - Client-side storage
- **TailwindCSS** - Styling
- **TypeScript** - Type safety

## Separation from Extension

This project is **completely separate** from the Fluent browser extension:
- ✅ Independent codebase
- ✅ Separate dependencies
- ✅ No shared code or imports
- ✅ Communication via exported JSON only
- ✅ Can be deployed independently

## Future Enhancements

- [ ] Export graph as PNG/SVG
- [ ] Share graph via URL (hosted mode)
- [ ] Collaborative graphs
- [ ] AI-powered insights
- [ ] Spaced repetition integration
- [ ] Multiple graph comparison

## License

MIT License - Same as Fluent extension

## Support

For issues or questions:
1. Check the [Fluent extension documentation](../fluent/README.md)
2. Review this README
3. Open an issue on GitHub

---

**Happy Exploring! 🚀**

Visualize your Web3 knowledge one connection at a time.
