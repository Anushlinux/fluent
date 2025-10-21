# Fluent - Web3 Learning Extension

An educational browser extension that automatically detects Web3 jargon on any webpage, provides context-aware explanations, and helps you learn through a gamified Pokédex-style collection system.

> **✅ Status**: Pokédex v0.2.0 Complete! Full context-aware glossary with Shadow Mode and collection tracking.

## ✨ Features

### Core Features
- 🔍 **Smart Term Detection** - Detects 20+ Web3/AI terms on any webpage using NLP
- 🎭 **Shadow Mode** - Toggle term highlighting on/off with floating indicator
- 🌍 **Context-Aware Definitions** - Different definitions based on page context (DeFi, L2, ERC-4337, etc.)
- 📖 **Smart Popovers** - Hover for quick definitions, click for full explanations + sources
- 🎯 **Interactive Quizzes** - Test your knowledge and earn XP for correct answers

### Pokédex Collection System
- 📚 **Pokédex View** - Browse all terms in a card-based collection
- 🔓 **Term Unlocking** - Terms unlock as you encounter them on webpages
- 📝 **Quiz Tracking** - See which terms you've mastered with quizzes
- 📊 **Progress Tracking** - Visual progress bar and statistics by category
- 🔍 **Smart Filters** - Filter by status (locked/unlocked), category, or search

### Dashboard & Analytics
- 📊 **Learning Dashboard** - Track your XP, streak, and accuracy
- 📈 **Statistics** - View unique terms seen, quizzes taken, and more
- 💾 **Export Data** - Download your learning history as JSON or Markdown
- 🔔 **Badge Counter** - Shows unique terms learned today

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Chrome, Brave, or any Chromium-based browser

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd fluent
   ```

2. **Install dependencies**
   ```bash
   # Using pnpm (recommended)
   pnpm install
   
   # Or using npm
   npm install
   
   # Or using yarn
   yarn install
   ```

3. **Build the extension**
   
   For development (with hot reload):
   ```bash
   npm run dev
   ```
   
   For production:
   ```bash
   npm run build
   ```

4. **Load extension in Chrome/Brave**
   - Open your browser and navigate to `chrome://extensions/`
   - Enable **"Developer mode"** (toggle in top-right corner)
   - Click **"Load unpacked"**
   - Select the `.output/chrome-mv3` directory from the project folder
   - The Fluent extension should now appear in your extensions list!

### For Firefox

```bash
npm run dev:firefox
```

Then load from `.output/firefox-mv3` directory.

## 📖 Usage

### Shadow Mode

1. **Toggle Highlighting** - Click the Shadow Mode toggle (👁️/🔒) in the popup header
2. **Webpage Indicator** - See the floating indicator showing current mode status
3. **On-Demand Scanning** - Enable only when you want to learn, disable for distraction-free browsing
4. **Persistent** - Your preference is saved across sessions

### Learning Terms

1. **Browse any webpage** - When Shadow Mode is ON, the extension automatically scans for terms
2. **Hover over highlighted terms** - See a quick definition preview
3. **Click a term** - Open full popover with:
   - Context-aware definition (adapts to DeFi, L2, ERC-4337, etc.)
   - Example usage in the detected context
   - Interactive quiz question
   - Source attribution
4. **Answer the quiz** - Earn 10 XP for correct answers and mark the term as mastered
5. **Track your progress** - Click the extension icon to see your dashboard

### Pokédex Collection

1. **Browse the Collection** - Click the "Pokédex" tab in the popup
2. **View All Terms** - See all available terms in a card-based grid
3. **Filter & Search** - Use filters to find terms by:
   - Status (All, Unlocked, Locked, Quiz Completed)
   - Category (Infrastructure, DeFi, Development, NFT, etc.)
   - Search query
4. **Track Progress** - View overall completion percentage and category statistics
5. **Unlock Terms** - Terms unlock automatically when you encounter them on webpages

### Dashboard Features

- **XP & Streak** - Monitor your learning progress
- **Terms Today** - See how many unique terms you've encountered
- **Learning History** - Review all terms you've learned, organized by date
- **Export Options** - Download your learning data as JSON or Markdown
- **Tab Navigation** - Switch between Dashboard and Pokédex views

### Context-Aware Definitions

The extension detects the context of the page you're viewing and shows the most relevant definition:
- **DeFi contexts**: Uniswap, Aave, lending protocols
- **L2 contexts**: Arbitrum, Optimism, zkSync
- **ERC-4337 contexts**: Account abstraction, bundlers, paymasters
- **General contexts**: Fallback for non-specific pages

### Badge Counter

The extension icon badge shows the number of unique terms you've learned today. It resets every day to encourage daily learning!

## 🧪 Testing the Extension

### Quick Test with Included Test Page

1. **Open the test page** - After loading the extension, open `test.html` (included in the project) in your browser
2. **Look for highlighted terms** - Terms like "blockchain", "smart contract", "DeFi" will be underlined
3. **Hover for preview** - Hover over any highlighted term to see a quick definition
4. **Click for quiz** - Click a term to see full explanation and take an interactive quiz
5. **Check your progress** - Click the extension icon to see your dashboard with XP and streak

### Test on Real Websites

Visit Web3-related websites to see Fluent in action:
- [ethereum.org](https://ethereum.org) - Ethereum's official site
- [uniswap.org](https://uniswap.org) - DeFi exchange
- [opensea.io](https://opensea.io) - NFT marketplace
- Any crypto news site or Web3 documentation

## 🛠️ Tech Stack

- **WXT 0.18.x** - Modern web extension framework (Manifest V3)
- **React 18** - UI components for popup and popovers
- **TypeScript 5** - Type-safe code
- **compromise.js** - Natural language processing for term detection
- **Chrome Storage API** - Persistent data storage
- **CSS** - Clean, minimal styling

**Note:** We use WXT 0.18.x instead of the latest version to avoid workspace dependency issues.

## 📁 Project Structure

```
fluent/
├── components/           # Shared React components
│   ├── Popover.tsx      # Popover component for term explanations
│   └── Popover.css      # Popover styles
├── entrypoints/         # Extension entry points
│   ├── background.ts    # Background service worker
│   ├── content/         # Content script
│   │   ├── index.tsx    # Term detection and highlighting
│   │   └── content.css  # Content script styles
│   └── popup/           # Extension popup
│       ├── App.tsx      # Main dashboard component
│       ├── App.css      # Dashboard styles
│       ├── index.html   # Popup HTML
│       └── main.tsx     # Popup entry point
├── utils/               # Utility functions
│   ├── logger.ts        # Logging utilities
│   └── stats.ts         # Statistics calculation
├── public/              # Static assets
│   ├── icon.svg         # Extension icon
│   ├── icon/            # Icon variants
│   └── glossary.json    # Web3 terms database
├── wxt.config.ts        # WXT configuration
├── package.json         # Dependencies
└── tsconfig.json        # TypeScript config
```

## 📚 Glossary Terms

The extension currently recognizes 22 Web3 and AI terms with context-aware definitions:

### Infrastructure
1. Blockchain
2. Consensus
3. Mining
4. Staking
5. Gas Fee
6. Wallet
7. MetaMask
8. Oracle
9. Relayer

### Development
10. Smart Contract
11. dApp
12. Solidity
13. ERC-20
14. Account Abstraction

### DeFi
15. DeFi
16. Yield Farming
17. Liquidity Pool

### Categories
18. NFT
19. DAO
20. Layer 2

### General
21. Token
22. Web3

> **Note**: Working towards 50+ terms. See `public/glossary-template.md` for guidelines on adding new terms.

## 🔧 Development

### Available Scripts

```bash
# Development (with hot reload)
pnpm run dev              # Chrome/Brave
pnpm run dev:firefox      # Firefox

# Production build
pnpm run build            # Chrome/Brave
pnpm run build:firefox    # Firefox

# Create distribution packages
pnpm run zip              # Chrome/Brave
pnpm run zip:firefox      # Firefox

# Generate types
pnpm run prepare          # Run after adding new files
```

Replace `pnpm` with `npm` or `yarn` if you're using those instead.

### Adding New Terms

See `public/glossary-template.md` for comprehensive guidelines. Quick reference:

**Context-Aware Format (Recommended):**
```json
{
  "term": "Your Term",
  "definitions": {
    "Context1": "Definition for this context",
    "General": "Fallback definition"
  },
  "examples": {
    "Context1": "Example in context",
    "General": "General example"
  },
  "sources": ["source1.com", "source2.org"],
  "category": "Category",
  "quiz": { /* quiz object */ }
}
```

**Legacy Format (Still Supported):**
```json
{
  "term": "Your Term",
  "definition": "Single definition",
  "usage": "Example sentence",
  "category": "Category",
  "quiz": { /* quiz object */ }
}
```

**Supported Contexts**: General, ERC-4337, DeFi, NFT, L2, DAO, Infrastructure, Development, Security, AI

**Categories**: Infrastructure, Development, DeFi, NFT, DAO, L2, Security, AI, General

### Customizing Styles

- **Highlight color**: Edit `.fluent-highlight` in `entrypoints/content/content.css`
- **Popover design**: Modify `components/Popover.css`
- **Dashboard theme**: Update `entrypoints/popup/App.css`

## 🎯 Roadmap

### ✅ Completed (v0.2.0 - Pokédex Release)

- [x] Shadow Mode toggle with webpage indicator
- [x] Context-aware definitions (9 contexts)
- [x] Pokédex collection view
- [x] Term unlock tracking
- [x] Quiz completion badges
- [x] Category-based organization
- [x] Filter and search functionality
- [x] Source attribution
- [x] Progress statistics

### 🚀 Next Up (v0.3.0)

- [ ] Expand glossary to 50+ terms
- [ ] Add 30+ high-quality Web3/AI terms
- [ ] More granular contexts (zkProofs, MEV, Consensus types)
- [ ] AI/ML terms (Transformer, LLM, RAG, Vector DB, etc.)
- [ ] Performance optimizations for 50+ terms

### Future Enhancements (v0.4.0+)

- [ ] XP for unlocking terms (not just quizzes)
- [ ] Category completion badges
- [ ] Streak bonuses for daily discoveries
- [ ] Custom glossaries (user-submitted terms)
- [ ] Spaced repetition system
- [ ] Social features (share Pokédex, compete)
- [ ] AI-powered context detection
- [ ] Multi-language support
- [ ] Mobile browser support

## 🐛 Troubleshooting

### Terms not highlighting

- **Check Shadow Mode**: Make sure Shadow Mode is enabled (👁️) in the popup
- Look for the floating indicator at bottom-right of page
- Verify the page has finished loading
- Check the browser console for errors (F12)
- Try refreshing the page

### Extension not detecting terms

- Make sure you've loaded the extension properly
- Enable Shadow Mode if it's disabled
- Check the browser console for errors (F12)
- Verify the page has finished loading
- Try refreshing the page

### Popover not showing

- Check if the term is in the glossary
- Ensure JavaScript is enabled
- Look for console errors
- Try clicking the term instead of hovering

### Badge not updating

- The badge updates based on storage changes
- Wait a few seconds after interacting with terms
- Check if the extension has storage permissions

## 📄 License

MIT License - feel free to use this project for learning and development!

## 🤝 Contributing

This is an MVP for educational purposes. Contributions, suggestions, and feedback are welcome!

## 📧 Support

If you encounter any issues or have questions:
1. Check the troubleshooting section
2. Review the browser console for errors
3. Open an issue on GitHub

---

**Happy Learning! 🚀**

Build your Web3 knowledge one term at a time with Fluent.

