# Agent-Extension Integration - Testing Guide

## Quick Start

### 1. Set Up Agent

```bash
cd agent

# Install dependencies (including new supabase library)
pip install -r requirements.txt

# Create .env file with your credentials
cp .env.example .env
# Edit .env and add your GEMINI_API_KEY and Supabase credentials (optional)

# Start the agent
python mailbox_agent.py
```

**Expected Output:**
```
✅ Supabase client initialized (or ⚠️ Supabase not configured)
🚀 Fluent Advanced Agent Starting...
📧 Agent address: agent1...
🌐 Available at: http://0.0.0.0:8010
🔑 Gemini API: ✅ Set
🧠 MeTTa Knowledge Graph: Initialized
```

### 2. Test Agent Health Endpoint

In a new terminal:
```bash
curl http://localhost:8010/health
```

**Expected Response:**
```json
{
  "status": "healthy",
  "agent": "FluentAgent",
  "timestamp": 1234567890,
  "metta_initialized": true,
  "supabase_connected": true
}
```

### 3. Test Agent Explanation Endpoint

```bash
curl -X POST http://localhost:8010/explain-sentence \
  -H "Content-Type: application/json" \
  -d '{
    "sentence": "Account abstraction allows smart contracts to pay for gas fees.",
    "url": "https://example.com",
    "user_id": "test-user"
  }'
```

**Expected Response:**
```json
{
  "explanation": "This means...",
  "concepts": ["account abstraction", "smart contracts", "gas fees"],
  "relations": [...],
  "context": "ERC-4337",
  "captured": true,
  "timestamp": 1234567890
}
```

### 4. Set Up Extension

```bash
cd extension

# Install dependencies if needed
npm install

# Build extension in development mode
npm run dev
```

### 5. Load Extension in Browser

1. Open Chrome/Brave
2. Go to `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked"
5. Select `.output/chrome-mv3` directory

### 6. Test Extension + Agent Integration

**Test 1: With Agent Running**
1. Navigate to any webpage (e.g., https://ethereum.org)
2. Highlight a sentence (15+ characters)
3. Should see:
   - Loading spinner tooltip
   - AI explanation tooltip with concepts
   - "✅ Captured to your knowledge graph" status

**Test 2: Without Agent (Fallback)**
1. Stop the agent (Ctrl+C in agent terminal)
2. Refresh the webpage
3. Highlight a sentence
4. Should see:
   - Loading spinner (will timeout after ~5 seconds)
   - Fallback tooltip with "📝 Saved locally (agent offline)"
   - Detected terms from local processing

**Test 3: With Authentication (Supabase Storage)**
1. Ensure agent is running with Supabase configured
2. Sign in to extension (click extension icon → Sign In)
3. Highlight a sentence
4. Check Supabase `captured_sentences` table for new entry

### 7. Verify MeTTa Knowledge Graph

The agent adds concepts to MeTTa automatically. To verify:

1. In agent terminal, you should see:
   ```
   [MeTTa] Added: (concept account_abstraction erc_4337)
   [MeTTa] Added: (relation enables smart_contracts gas_fees)
   ```

2. You can query via Agentverse chat or add a query to the agent code.

## Troubleshooting

### Agent Issues

**"Module 'supabase' not found"**
```bash
pip install supabase
```

**"GEMINI_API_KEY not set"**
- Create `.env` file in `agent/` directory
- Add: `GEMINI_API_KEY=your_key_here`

**Agent not responding**
- Check if agent is running: `curl http://localhost:8010/health`
- Check firewall settings
- Verify port 8010 is not in use

### Extension Issues

**Tooltip not appearing**
- Check browser console (F12) for errors
- Ensure selection is 15+ characters
- Try refreshing the page

**"Agent call failed"**
- Verify agent is running
- Check agent terminal for error logs
- Ensure no CORS issues (background script handles this)

**Fallback always shows**
- Agent may not be running
- Check `http://localhost:8010/health` in browser
- Verify network connectivity

### Supabase Issues

**"Failed to insert"**
- Verify Supabase credentials in agent `.env`
- Ensure `captured_sentences` table exists
- Check Supabase RLS policies allow inserts
- User must be authenticated in extension

## Features Demonstrated

✅ **Real-time AI explanations** - Gemini LLM generates beginner-friendly explanations  
✅ **Concept extraction** - LLM identifies key Web3/blockchain terms  
✅ **MeTTa knowledge graph** - Concepts and relations stored for reasoning  
✅ **Supabase persistence** - Sentences stored with metadata for timeline  
✅ **Graceful fallback** - Extension works even if agent is offline  
✅ **CORS handling** - Background script bypasses CORS restrictions  
✅ **Auto-capture** - No manual "Capture" button needed  
✅ **Beautiful UI** - Floating tooltip with gradient header and concept tags  

## Architecture Flow

```
User highlights text
    ↓
Extension content script detects selection
    ↓
Sends message to background script (CORS bypass)
    ↓
Background script calls agent REST endpoint
    ↓
Agent processes with Gemini LLM
    ↓
Agent extracts concepts & generates explanation
    ↓
Agent stores in MeTTa knowledge graph
    ↓
Agent stores in Supabase (if authenticated)
    ↓
Agent returns response to background script
    ↓
Background script forwards to content script
    ↓
Content script shows AI tooltip with explanation
    ↓
Auto-hide after 8 seconds (or user closes)
```

## Next Steps

- Add more LLM prompts for different contexts (DeFi, L2, NFT)
- Implement MeTTa reasoning queries
- Add spaced repetition based on captured sentences
- Visualize knowledge graph in extension popup
- Add batch processing for multiple selections
- Implement WebSocket for real-time updates

## Support

If you encounter issues:
1. Check agent terminal for error logs
2. Check browser console (F12) for extension errors
3. Verify all dependencies are installed
4. Ensure Supabase tables exist (if using persistence)
5. Test with simple sentences first

**Happy Testing! 🚀**

