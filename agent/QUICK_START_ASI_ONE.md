# 🚀 Quick Start: ASI:One Integration

## Get Running in 3 Minutes

### Step 1: Get API Key (1 min)
Visit: https://fetch.ai/asi-one or Innovation Lab
- Sign up / Log in
- Create API key
- Copy the key

### Step 2: Configure (30 seconds)
```bash
cd agent
nano .env  # Create this file
```

Add:
```
ASI_ONE_API_KEY=your_key_here
```

Save and exit.

### Step 3: Install & Run (1 min)
```bash
pip install -r requirements.txt
python mailbox_agent.py
```

### Expected Output
```
🚀 Fluent Advanced Agent Starting...
📧 Agent address: agent1q...
🌐 Available at: http://0.0.0.0:8010
🔑 ASI:One API: ✅ Set
🧠 MeTTa Knowledge Graph: Initialized
📊 ASI:One Models: asi1-mini (extraction), asi1-graph (reasoning)
```

---

## Test It Works

### Test 1: Health Check
```bash
curl http://localhost:8010/health
```

Expected:
```json
{
  "status": "healthy",
  "agent": "FluentAgent",
  "timestamp": 1234567890,
  "metta_initialized": true,
  "supabase_connected": false
}
```

### Test 2: Extract Web3 Concepts
```bash
curl -X POST http://localhost:8010/explain-sentence \
  -H "Content-Type: application/json" \
  -d '{
    "sentence": "Uniswap uses automated market makers for decentralized token swaps",
    "url": "https://example.com"
  }'
```

Expected: JSON with explanation, concepts, relations

### Test 3: Graph Analysis
```bash
curl -X POST http://localhost:8010/graph-analysis \
  -H "Content-Type: application/json" \
  -d '{
    "query_type": "overview"
  }'
```

Expected: Analysis, insights, suggestions

---

## Key Differences from Gemini

| Feature | Gemini | ASI:One |
|---------|--------|---------|
| Model | gemini-2.5-flash | asi1-mini + asi1-graph |
| API Format | Google AI SDK | OpenAI-compatible |
| Graph Reasoning | ❌ | ✅ asi1-graph |
| Web3 Optimized | ❌ | ✅ |
| Hackathon Credits | ❌ | ✅ Free tier |

---

## What's New?

### New Endpoint: `/graph-analysis`
```bash
# Get learning path recommendations
curl -X POST http://localhost:8010/graph-analysis \
  -d '{"query_type": "learning_path"}'

# Find knowledge gaps
curl -X POST http://localhost:8010/graph-analysis \
  -d '{"query_type": "gaps"}'

# Identify concept clusters
curl -X POST http://localhost:8010/graph-analysis \
  -d '{"query_type": "clusters"}'
```

### New Chat Command
Send via chat protocol:
```
graph analysis
```

Returns: ASI:One asi1-graph analysis of your knowledge base

---

## Model Usage

### asi1-mini (Fast)
- Concept extraction
- Sentence explanations
- Term detection
- Context classification

### asi1-graph (Advanced)
- Graph analysis
- Learning paths
- Cluster detection
- Gap identification

---

## Troubleshooting

**Agent won't start?**
- Check `.env` file exists
- Verify `ASI_ONE_API_KEY` is set
- Run: `pip install -r requirements.txt`

**API errors?**
- Check API key is valid
- Verify internet connection
- Check Fetch.ai dashboard for credits

**No graph insights?**
- Send some sentences first to populate graph
- Graph needs 3+ concepts for meaningful analysis

---

## Next Steps

1. ✅ Test basic endpoints
2. ✅ Send sample Web3 sentences
3. ✅ Try graph analysis
4. ✅ Test chat commands
5. ✅ Review logs for ASI:One responses

---

## Demo Script

For presentations/demos:

```bash
# 1. Start agent
python mailbox_agent.py

# 2. Send Web3 sentences
curl -X POST http://localhost:8010/explain-sentence \
  -H "Content-Type: application/json" \
  -d '{"sentence": "ERC-4337 enables account abstraction through bundlers and paymasters"}'

# 3. Analyze graph
curl -X POST http://localhost:8010/graph-analysis \
  -H "Content-Type: application/json" \
  -d '{"query_type": "overview"}'

# 4. Get learning path
curl -X POST http://localhost:8010/graph-analysis \
  -H "Content-Type: application/json" \
  -d '{"query_type": "learning_path"}'
```

---

## 🎯 You're Ready!

Your agent is now powered by ASI:One and ready for:
- ✅ ETHOnline hackathon
- ✅ ASI hackathon
- ✅ Live demos
- ✅ Production use

**Need help?** Check `ASI_ONE_INTEGRATION_SUMMARY.md` for full details!

