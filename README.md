# Fluent - Web3 Knowledge Graph Platform

An intelligent learning platform that automatically captures your Web3 learning journey through a browser extension and visualizes it as an interactive knowledge graph.

## 🌟 Overview

Fluent consists of two integrated components:

1. **Browser Extension** - Captures sentences while you browse and learn
2. **Web Application** - Visualizes your captured knowledge as an interactive graph

All data is securely stored in Supabase and synchronized via manual sync, giving you control over when your data is uploaded.

## ✨ Features

### Browser Extension

- 🔍 **Smart Term Detection** - Automatically highlights 20+ Web3/AI terms
- 📝 **Sentence Capture** - Select and tag sentences with detected terms
- 🎭 **Shadow Mode** - Toggle term highlighting on/off
- 🌍 **Context-Aware** - Different definitions based on page context
- 📊 **Dashboard** - Track XP, streaks, and learning stats
- 📚 **Pokédex** - Collect and master terms like Pokémon
- 🎯 **Interactive Quizzes** - Test knowledge and earn XP
- ☁️ **Auto-Sync** - Immediate synchronization to Supabase
- 💡 **Knowledge Gap Detection** - AI-powered gap analysis every 5 minutes
- 🧩 **Adaptive Quizzes** - Personalized quizzes based on weak clusters
- 🔔 **Proactive Nudges** - Badge notifications for learning opportunities

### Web Application

- 🕸️ **Interactive Graph** - Force-directed graph visualization
- 🔐 **User Authentication** - Secure login with Supabase
- ⚡ **Real-Time Updates** - Graph updates automatically after sync
- 🔍 **Smart Filtering** - Filter by topic, framework, date
- 📈 **Analytics** - View learning stats and insights
- 🎨 **Beautiful UI** - Modern, responsive design
- 💾 **Cloud Storage** - All data safely stored in Supabase
- 🔔 **Real-Time Insights** - Live toast notifications for knowledge gaps
- 💬 **AI Chat Assistant** - Query your graph with ASI:One + MeTTa reasoning
- 🧠 **MeTTa Integration** - Symbolic reasoning for deeper knowledge connections

### AI-Powered Agent (New!)

- 🤖 **ASI:One Integration** - Intelligent extraction and reasoning
  - `asi1-mini`: Concept extraction and explanations
  - `asi1-graph`: Knowledge graph analysis and reasoning
- 🧠 **MeTTa Reasoning Engine** - Symbolic logic for Web3 concepts
- 🔍 **Automatic Gap Detection** - Identifies weak knowledge clusters
- 📝 **Adaptive Quiz Generation** - Creates personalized quizzes
- 💡 **Proactive Insights** - Real-time learning recommendations
- 📊 **Graph Analysis** - Advanced reasoning over your knowledge graph

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Python 3.12+ (for AI agent)
- Chrome/Brave browser
- Supabase account (free tier works!)
- ASI:One API key (for agent features)

### Setup

**For detailed setup instructions, see [SETUP_GUIDE.md](./SETUP_GUIDE.md)**

Quick summary:

1. **Create Supabase project** and set up database (see [SUPABASE_SETUP.md](./SUPABASE_SETUP.md))
2. **Website**: Install deps, configure env vars, run dev server
3. **Extension**: Install deps, configure env vars, build, and load in Chrome
4. **Use**: Capture sentences → Sync → View graph

## 📖 Usage Flow

```
1. Browse web pages
   ↓
2. Extension highlights terms
   ↓
3. Select & capture sentences
   ↓
4. Click "Sync" in extension
   ↓
5. View on website (auto-updates!)
```

## 🏗️ Architecture

### System Components

```
┌─────────────────────┐
│  Browser Extension  │
│  (React + WXT)      │
│  - Captures data    │
│  - Auto sync        │
│  - Gap detection    │
│  - Adaptive quizzes │
└──────────┬──────────┘
           │
           │ HTTP (Auto Sync)
           ├────────────────────┐
           ↓                    ↓
┌─────────────────────┐  ┌──────────────────────┐
│     Supabase        │  │   Python AI Agent    │
│  - PostgreSQL DB    │  │  (uAgents)           │
│  - Authentication   │  │  - ASI:One API       │
│  - Real-time subs   │  │  - MeTTa reasoning   │
│  - Row Level        │  │  - Gap detection     │
│    Security (RLS)   │  │  - Quiz generation   │
│  - Vector storage   │  │  - Graph analysis    │
└──────────┬──────────┘  └──────────┬───────────┘
           │                        │
           │ HTTP + WebSocket       │ REST API
           ↓                        ↓
┌─────────────────────────────────────────┐
│         Web Application                 │
│        (Next.js + React)                │
│  - Authentication                       │
│  - Graph visualization (React Flow)     │
│  - Real-time toast notifications        │
│  - AI Chat Assistant                    │
│  - Analytics & Insights                 │
└─────────────────────────────────────────┘
```

### Data Flow

1. **Capture**: User highlights text → Extension captures sentence
2. **AI Processing**: Optional agent call for instant explanation (ASI:One + MeTTa)
3. **Auto-Sync**: Sentence immediately synced to Supabase
4. **Graph Generation**: Website processes sentences into graph nodes/edges
5. **Real-Time Updates**: WebSocket subscriptions update graph live
6. **Gap Detection**: Background agent analyzes graph every 5 minutes
7. **Proactive Nudges**: Insights stored → Real-time notifications displayed
8. **Adaptive Learning**: User takes quiz → XP updated → Graph strengthened

### Database Schema

```sql
profiles            -- User profiles (linked to auth.users)
├── id (UUID, PK)
├── email
├── xp
├── streak_days
└── created_at

captured_sentences  -- Raw captured sentences
├── id (UUID, PK)
├── user_id (FK → profiles)
├── sentence
├── terms[]
├── context
├── asi_extract (JSONB)
├── embedding (vector(1536))  -- For future RAG
└── timestamp

graph_nodes        -- Processed nodes for visualization
├── id (TEXT, PK)
├── user_id (FK → profiles)
├── type (topic | sentence)
├── label
├── quiz_completed (BOOLEAN)
└── metadata

graph_edges        -- Relationships between nodes
├── id (TEXT, PK)
├── user_id (FK → profiles)
├── source_id (FK → graph_nodes)
├── target_id (FK → graph_nodes)
├── weight
└── type

user_sessions      -- Multi-turn chat sessions
├── id (UUID, PK)
├── user_id (FK → profiles)
├── session_data (JSONB)
└── created_at

insights           -- Proactive nudges & knowledge gaps
├── id (UUID, PK)
├── user_id (FK → profiles)
├── insight_type (gap_detected | quiz_suggested | etc.)
├── content
├── metadata (JSONB)
├── is_read
└── created_at
```

## 🛠️ Technology Stack

### Extension

- **Framework**: WXT 0.18.x (Manifest V3)
- **UI**: React 18 + TypeScript
- **NLP**: compromise.js for term detection
- **Storage**: Chrome Storage API
- **Auth**: Supabase JS Client
- **Build**: Vite

### Website

- **Framework**: Next.js 14 (App Router)
- **UI**: React 18 + TypeScript + Tailwind CSS
- **Graph**: React Flow for visualization
- **Database**: Supabase (PostgreSQL + pgvector)
- **Auth**: Supabase Auth with SSR
- **Real-time**: Supabase Realtime subscriptions
- **Deployment**: Vercel-ready

### AI Agent

- **Framework**: uAgents (Python)
- **AI**: ASI:One API (asi1-mini, asi1-graph)
- **Reasoning**: MeTTa (Hyperon)
- **Database**: Supabase Python Client
- **REST API**: Built-in uAgents REST endpoints

## 📁 Project Structure

```
fluent/
├── agent/                  # AI Agent (Python)
│   ├── mailbox_agent.py    # Main agent with REST endpoints
│   ├── requirements.txt    # Python dependencies
│   ├── .env                # Environment variables (ASI:One API key)
│   └── README.md           # Agent documentation
│
├── extension/              # Browser Extension
│   ├── components/         # React components
│   │   ├── Popover.tsx     # Term definition popover
│   │   └── QuizModal.tsx   # Adaptive quiz modal (NEW!)
│   ├── entrypoints/        # Extension entry points
│   │   ├── background.ts   # Background worker + gap detection (UPDATED!)
│   │   ├── content/        # Content script
│   │   └── popup/          # Extension popup + insights (UPDATED!)
│   ├── utils/              # Utility functions
│   │   ├── auth.ts         # Authentication
│   │   ├── supabase.ts     # Supabase client
│   │   ├── syncService.ts  # Auto-sync logic (UPDATED!)
│   │   └── graphExport.ts  # Graph generation
│   └── wxt.config.ts       # WXT configuration
│
├── website/                # Web Application
│   ├── app/                # Next.js app directory
│   │   ├── login/          # Login page
│   │   ├── signup/         # Signup page
│   │   ├── auth/           # Auth callback
│   │   └── page.tsx        # Main graph page
│   ├── components/         # React components
│   │   ├── GraphViewer.tsx # Graph viz + real-time subs (UPDATED!)
│   │   ├── ToastNotification.tsx  # Real-time nudges (NEW!)
│   │   ├── GraphChat.tsx   # AI chat assistant (NEW!)
│   │   ├── TopicNode.tsx   # Graph node components
│   │   └── SentenceNode.tsx
│   ├── lib/                # Utilities
│   │   ├── supabase.ts     # Supabase client
│   │   ├── graphStorage.ts # Data access layer
│   │   └── graphTypes.ts   # TypeScript types
│   └── next.config.ts      # Next.js config
│
├── supabase/               # Supabase Configuration (NEW!)
│   └── migrations/
│       └── 001_initial_schema.sql  # Database schema
│
├── SETUP_GUIDE.md          # Complete setup guide
├── SUPABASE_SETUP.md       # Database schema & setup (NEW!)
├── VECTOR_RAG_TODO.md      # Future RAG implementation (NEW!)
└── README.md               # This file
```

## 🔐 Security

- **Authentication**: Supabase Auth with email/password
- **Authorization**: Row Level Security (RLS) policies
- **Data Isolation**: Users can only access their own data
- **API Keys**: Client-safe `anon` key with RLS protection
- **HTTPS**: Required for production

## 🚢 Deployment

### Website (Vercel)

```bash
cd website
vercel
```

Add environment variables in Vercel dashboard.

### Extension (Chrome Web Store)

```bash
cd extension
pnpm run build
pnpm run zip
```

Upload to Chrome Web Store Developer Dashboard.

## 🧪 Development

### Run Locally

Terminal 1 (Website):
```bash
cd website
npm run dev
```

Terminal 2 (Extension):
```bash
cd extension
pnpm run dev
```

Terminal 3 (Optional - Supabase local):
```bash
npx supabase start
```

### Environment Variables

**Website** (`.env.local`):
```env
NEXT_PUBLIC_SUPABASE_URL=your-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key
```

**Extension** (`.env`):
```env
VITE_SUPABASE_URL=your-url
VITE_SUPABASE_ANON_KEY=your-key
VITE_WEBSITE_URL=http://localhost:3001
```

## 📚 Documentation

- [Complete Setup Guide](./SETUP_GUIDE.md) - Step-by-step setup instructions
- [Supabase Setup](./SUPABASE_SETUP.md) - Database schema and configuration
- [Extension README](./extension/README.md) - Extension-specific documentation
- [Website README](./website/README.md) - Website-specific documentation

## 🗺️ Roadmap

### ✅ Completed (v0.3.0)

- [x] Supabase authentication
- [x] Manual sync from extension to cloud
- [x] Real-time graph updates
- [x] User-specific data isolation
- [x] Interactive graph visualization
- [x] Sentence capture and tagging
- [x] Context-aware term detection

### 🚀 Next (v0.4.0)

- [ ] AI-powered insights and summaries
- [ ] Collaborative features (share graphs)
- [ ] Mobile app (React Native)
- [ ] Export formats (PDF, PNG, JSON)
- [ ] Advanced filtering and search
- [ ] Spaced repetition system
- [ ] Browser history integration

### 🔮 Future

- [ ] Multi-language support
- [ ] Custom glossaries
- [ ] Social features
- [ ] API for third-party integrations
- [ ] Desktop app (Electron)
- [ ] Voice capture

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

MIT License - See [LICENSE](./LICENSE) for details

## 🐛 Troubleshooting

See [SETUP_GUIDE.md - Part 6: Troubleshooting](./SETUP_GUIDE.md#part-6-troubleshooting) for common issues and solutions.

## 💬 Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/fluent/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/fluent/discussions)
- **Email**: support@fluent.example.com

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/), [React](https://react.dev/), and [Supabase](https://supabase.com/)
- Graph visualization powered by [React Flow](https://reactflow.dev/)
- Extension framework by [WXT](https://wxt.dev/)
- NLP by [compromise.js](https://compromise.cool/)

---

**Start building your knowledge graph today!** 🚀

[Get Started →](./SETUP_GUIDE.md)
