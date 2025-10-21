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
- ☁️ **Manual Sync** - Upload captured data to cloud on demand

### Web Application

- 🕸️ **Interactive Graph** - Force-directed graph visualization
- 🔐 **User Authentication** - Secure login with Supabase
- ⚡ **Real-Time Updates** - Graph updates automatically after sync
- 🔍 **Smart Filtering** - Filter by topic, framework, date
- 📈 **Analytics** - View learning stats and insights
- 🎨 **Beautiful UI** - Modern, responsive design
- 💾 **Cloud Storage** - All data safely stored in Supabase

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Chrome/Brave browser
- Supabase account (free tier works!)

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
│  - Stores locally   │
│  - Manual sync      │
└──────────┬──────────┘
           │
           │ HTTP (Manual Sync)
           ↓
┌─────────────────────┐
│     Supabase        │
│  - PostgreSQL DB    │
│  - Authentication   │
│  - Real-time subs   │
│  - Row Level        │
│    Security (RLS)   │
└──────────┬──────────┘
           │
           │ HTTP + WebSocket
           ↓
┌─────────────────────┐
│   Web Application   │
│  (Next.js + React)  │
│  - Authentication   │
│  - Graph viz        │
│  - Analytics        │
│  - Real-time        │
└─────────────────────┘
```

### Data Flow

1. **Capture**: Extension stores sentences locally in Chrome storage
2. **Sync**: User clicks "Sync" → Extension uploads to Supabase
3. **Process**: Extension generates graph nodes/edges and uploads
4. **Display**: Website fetches and visualizes graph data
5. **Update**: Real-time subscriptions keep graph in sync

### Database Schema

```sql
profiles            -- User profiles (linked to auth.users)
├── id (UUID, PK)
├── email
└── created_at

captured_sentences  -- Raw captured sentences
├── id (UUID, PK)
├── user_id (FK → profiles)
├── sentence
├── terms[]
├── context
└── timestamp

graph_nodes        -- Processed nodes for visualization
├── id (TEXT, PK)
├── user_id (FK → profiles)
├── type (topic | sentence)
├── label
└── metadata

graph_edges        -- Relationships between nodes
├── id (TEXT, PK)
├── user_id (FK → profiles)
├── source_id (FK → graph_nodes)
├── target_id (FK → graph_nodes)
└── weight
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
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth with SSR
- **Real-time**: Supabase Realtime subscriptions
- **Deployment**: Vercel-ready

## 📁 Project Structure

```
fluent/
├── extension/              # Browser extension
│   ├── components/         # React components
│   ├── entrypoints/        # Extension entry points
│   │   ├── background.ts   # Background service worker
│   │   ├── content/        # Content script
│   │   └── popup/          # Extension popup
│   ├── utils/              # Utility functions
│   │   ├── auth.ts         # Authentication
│   │   ├── supabase.ts     # Supabase client
│   │   ├── syncService.ts  # Sync logic
│   │   └── graphExport.ts  # Graph generation
│   ├── public/             # Static assets
│   └── wxt.config.ts       # WXT configuration
│
├── website/                # Web application
│   ├── app/                # Next.js app directory
│   │   ├── login/          # Login page
│   │   ├── signup/         # Signup page
│   │   ├── auth/           # Auth callback
│   │   └── page.tsx        # Main graph page
│   ├── components/         # React components
│   │   ├── GraphViewer.tsx # Graph visualization
│   │   ├── QueryControls.tsx
│   │   └── StatsPanel.tsx
│   ├── lib/                # Utilities
│   │   ├── supabase.ts     # Supabase client
│   │   ├── graphStorage.ts # Data access layer
│   │   └── graphTypes.ts   # TypeScript types
│   └── next.config.ts      # Next.js config
│
├── SETUP_GUIDE.md          # Complete setup guide
├── SUPABASE_SETUP.md       # Database schema & setup
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
