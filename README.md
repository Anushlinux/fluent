# Fluent - Web3 Learning Extension

An educational browser extension that automatically detects Web3 jargon on any webpage, provides interactive explanations, and helps you learn through quizzes.

> **✅ Status**: MVP Complete and ready to test! See [SETUP_COMPLETE.md](./SETUP_COMPLETE.md) for detailed setup instructions.

## ✨ Features

- 🔍 **Automatic Term Detection** - Detects 20 Web3 terms on any webpage using NLP
- 📖 **Smart Popovers** - Hover for quick definitions, click for full explanations + quizzes
- 🎯 **Interactive Quizzes** - Test your knowledge and earn XP for correct answers
- 📊 **Learning Dashboard** - Track your progress, streak, and accuracy
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

### Learning Terms

1. **Browse any webpage** - The extension automatically scans for Web3 terms
2. **Hover over highlighted terms** - See a quick definition preview
3. **Click a term** - Open full popover with:
   - Detailed definition
   - Example usage in context
   - Interactive quiz question
4. **Answer the quiz** - Earn 10 XP for correct answers
5. **Track your progress** - Click the extension icon to see your dashboard

### Dashboard Features

- **XP & Streak** - Monitor your learning progress
- **Terms Today** - See how many unique terms you've encountered
- **Learning History** - Review all terms you've learned, organized by date
- **Export Options** - Download your learning data as JSON or Markdown

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

The extension currently recognizes 20 Web3 terms:

1. Blockchain
2. Smart Contract
3. DeFi
4. NFT
5. Gas Fee
6. Wallet
7. Consensus
8. Mining
9. Staking
10. dApp
11. Token
12. DAO
13. Layer 2
14. Oracle
15. Solidity
16. Web3
17. MetaMask
18. ERC-20
19. Yield Farming
20. Liquidity Pool

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

Edit `public/glossary.json` and add new terms with this structure:

```json
{
  "term": "Your Term",
  "definition": "Clear, concise definition",
  "usage": "Example sentence using the term",
  "quiz": {
    "question": "Quiz question about the term?",
    "answers": [
      "Wrong answer",
      "Correct answer",
      "Wrong answer",
      "Wrong answer"
    ],
    "correct": 1,
    "hint": "Optional hint for wrong answers"
  }
}
```

### Customizing Styles

- **Highlight color**: Edit `.fluent-highlight` in `entrypoints/content/content.css`
- **Popover design**: Modify `components/Popover.css`
- **Dashboard theme**: Update `entrypoints/popup/App.css`

## 🎯 Roadmap

### Future Enhancements

- [ ] Custom glossaries (user can add their own terms)
- [ ] Multiple subject areas (DeFi, NFTs, DAOs, etc.)
- [ ] Spaced repetition for better retention
- [ ] Social features (share progress, compete with friends)
- [ ] AI-powered context detection
- [ ] Multi-language support
- [ ] Mobile browser support

## 🐛 Troubleshooting

### Extension not detecting terms

- Make sure you've loaded the extension properly
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

