# Fluent Mailbox Agent

![tag:innovationlab](https://img.shields.io/badge/innovationlab-3D8BD3)
![tag:hackathon](https://img.shields.io/badge/hackathon-5F43F1)

A Python-based Mailbox Agent that uses **ASI:One** (Fetch.ai's agentic AI platform) to extract Web3 concepts, terms, and relationships from text input. This agent runs locally with mailbox functionality enabled for Agentverse connectivity.

## Agent Information

- **Agent Name**: FluentAgent
- **Agent Address**: See output when starting the agent (e.g., `agent1q...`)
- **Port**: 8010
- **REST Endpoint**: `http://localhost:8010`
- **Categorization**: Innovation Lab

## Features

- 🤖 **ASI:One Integration** - Uses Fetch.ai's asi1-mini and asi1-graph models for intelligent concept extraction and graph reasoning
- 📧 **Mailbox Agent** - Runs locally but discoverable through Agentverse
- 🔍 **Web3 Focus** - Specialized in extracting blockchain, DeFi, NFT, and Web3 concepts
- 🧠 **MeTTa Knowledge Graph** - Symbolic reasoning engine for concept relationships
- 📊 **Graph Analysis** - Advanced graph reasoning with asi1-graph model
- 🛡️ **Error Handling** - Robust error handling for API calls
- 📋 **Structured Output** - Returns JSON with terms, context, and relationships
- 🔄 **Real-time Chat** - Supports chat protocol for interactive communication
- 💾 **Supabase Integration** - Optional cloud storage for captured sentences

## Prerequisites

- Python 3.8 or higher
- ASI:One API key (from Fetch.ai)
- Internet connection for API calls
- (Optional) Supabase account for cloud storage

## Additional Resources

### Required Services

- **[Fetch.ai Innovation Lab](https://innovationlab.ai/)** - Innovation Lab platform for ASI:One
- **[ASI:One Dashboard](https://fetch.ai/asi-one)** - Get your API key and manage credits
- **[Agentverse](https://agentverse.ai)** - Agent discovery and messaging platform
- **[MeTTa Documentation](https://github.com/trueagi-io/hyperon-experimental)** - Hyperon symbolic reasoning engine

### Optional Services

- **[Supabase](https://supabase.com)** - PostgreSQL database with real-time capabilities (optional for cloud storage)
- **[Pinata](https://www.pinata.cloud/)** - IPFS pinning service for metadata storage

## Setup Instructions

### 1. Navigate to Agent Directory

```bash
cd agent
```

### 2. Create Python Virtual Environment

```bash
python -m venv venv
```

### 3. Activate Virtual Environment

**On macOS/Linux:**
```bash
source venv/bin/activate
```

**On Windows:**
```bash
venv\Scripts\activate
```

### 4. Install Dependencies

```bash
pip install -r requirements.txt
```

### 5. Configure Environment Variables

1. Create a `.env` file in the agent directory:
   ```bash
   touch .env
   ```

2. Edit `.env` and add your ASI:One API key:
   ```
   ASI_ONE_API_KEY=your_asi_one_api_key_here
   SUPABASE_URL=your_supabase_url  # Optional
   SUPABASE_ANON_KEY=your_supabase_key  # Optional
   ```

### 6. Get ASI:One API Key

1. Visit [Fetch.ai Innovation Lab](https://innovationlab.ai/) or [ASI:One Dashboard](https://fetch.ai/asi-one)
2. Sign up or log in to your account
3. Navigate to API Keys section
4. Create a new API key
5. Copy the generated key
6. Add it to your `.env` file

**Note:** ASI:One provides free tier credits for hackathons and development through the Innovation Lab!

## Running the Agent

### Start the Agent

```bash
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

## Connecting to Agentverse

### 1. Get Inspector Link

When the agent starts, look for an "Inspector" link in the terminal output. It will look like:
```
Inspector: https://agentverse.ai/inspector?agent=agent1q...
```

### 2. Open Inspector Link

1. Copy the Inspector link from the terminal
2. Open it in your web browser
3. Click **"Connect"** in the Agentverse interface
4. Follow the walkthrough to complete the Mailbox connection

### 3. Test the Connection

Once connected, you can:
- Send messages to the agent through Agentverse
- Receive structured Web3 concept analysis
- Test the agent's concept extraction capabilities

## Testing the Agent

### Test Messages

Try sending these sample messages to test the agent:

**DeFi Concepts:**
```
"Uniswap is a decentralized exchange that uses automated market makers and liquidity pools to enable token swaps without intermediaries."
```

**Smart Contract Concepts:**
```
"ERC-4337 introduces account abstraction to Ethereum, allowing smart contract wallets to initiate transactions without requiring externally owned accounts."
```

**NFT Concepts:**
```
"NFTs represent unique digital assets on the blockchain, enabling ownership verification and transfer of digital collectibles, art, and virtual real estate."
```

### Expected Response Format

The agent will respond with structured analysis:

```json
{
  "terms": ["Uniswap", "DEX", "AMM", "Liquidity Pool", "Token Swap"],
  "context": "DeFi",
  "relations": [
    ["Uniswap", "enables", "Token Swap"],
    ["AMM", "powers", "Liquidity Pool"]
  ]
}
```

## Agent Capabilities

### ASI:One Models

The agent leverages two specialized ASI:One models:

- **asi1-mini**: Fast concept extraction and personalized explanations
- **asi1-graph**: Advanced graph analysis and learning path recommendations

### Concept Extraction (asi1-mini)

The agent specializes in extracting:

- **Blockchain Terms**: consensus, mining, staking, nodes
- **DeFi Concepts**: yield farming, liquidity, governance tokens
- **Smart Contracts**: protocols, dApps, oracles
- **NFTs**: digital assets, metadata, royalties
- **Web3**: decentralization, ownership, interoperability

### Context Detection

Automatically categorizes content into contexts:
- **DeFi**: Decentralized finance applications
- **NFTs**: Non-fungible tokens and digital assets
- **Smart Contracts**: Protocol and dApp development
- **Web3**: General blockchain and decentralized technologies

### Relationship Mapping

Identifies causal relationships between concepts:
- Enables/Disables relationships
- Part-of/Contains relationships
- Causes/Results relationships

### Graph Analysis (asi1-graph)

Advanced knowledge graph reasoning capabilities:
- **Overview**: Identify key clusters and central concepts
- **Learning Path**: Suggest optimal learning sequences
- **Clusters**: Identify topic clusters and interconnections
- **Gaps**: Find missing connections in the knowledge graph

## REST API Endpoints

The agent exposes the following REST endpoints:

### POST /explain-sentence

Processes a sentence for Web3 concept extraction and explanation.

**Request:**
```json
{
  "sentence": "Uniswap uses AMM for decentralized token swaps",
  "url": "https://example.com",
  "user_id": "user123"
}
```

**Response:**
```json
{
  "explanation": "Uniswap is a decentralized exchange...",
  "concepts": ["Uniswap", "AMM", "token swap"],
  "relations": [["Uniswap", "uses", "AMM"]],
  "context": "DeFi",
  "captured": true,
  "timestamp": 1234567890
}
```

### POST /graph-analysis

Analyzes the MeTTa knowledge graph using ASI:One asi1-graph model.

**Request:**
```json
{
  "query_type": "overview",
  "user_context": "beginner learning Web3"
}
```

**Query Types:**
- `overview`: General graph analysis
- `learning_path`: Optimal learning sequences
- `clusters`: Topic clustering
- `gaps`: Missing connections

**Response:**
```json
{
  "analysis": "Your knowledge graph contains...",
  "insights": [
    "Strong cluster around DeFi concepts",
    "Account abstraction is a central topic"
  ],
  "suggestions": [
    "Explore the connection between oracles and DeFi"
  ],
  "timestamp": 1234567890
}
```

### POST /generate-badge-image

Generates AI-powered badge images using ASI:One's text-to-image model. Creates unique badge visuals based on domain, score, and user's captured concepts.

**Request:**
```json
{
  "domain": "DeFi",
  "score": 85,
  "node_count": 15,
  "concepts": ["Uniswap", "Liquidity Pool", "AMM"],
  "format": "square"
}
```

**Format Options:**
- `square` - Standard badge image (1024x1024)
- `story` - Vertical social media format (1080x1920)
- `certificate` - Formal certificate layout (2048x1536)
- `poster` - Promotional poster (2048x1024)
- `banner` - Profile banner (2048x512)

**Response:**
```json
{
  "image_data": "base64_encoded_image_data",
  "prompt_used": "Professional achievement badge for DeFi mastery...",
  "generation_time": 5.23,
  "timestamp": 1234567890
}
```

**Timeout:** 30 seconds  
**Fallback:** Frontend will use canvas/SVG generation if ASI generation fails

### GET /health

Health check endpoint.

**Response:**
```json
{
  "status": "healthy",
  "agent": "FluentAgent",
  "timestamp": 1234567890,
  "metta_initialized": true,
  "supabase_connected": true
}
```

## Chat Protocol Commands

Send these commands via chat protocol:

- **`metta: <query>`** - Direct MeTTa knowledge graph query
  - Example: `metta: (match &self (concept $x defi) $x)`
- **`show unexplored`** - List all concepts in the knowledge graph
- **`graph analysis`** - Trigger ASI:One asi1-graph analysis

## Troubleshooting

### Common Issues

**"ASI_ONE_API_KEY environment variable is not set"**
- Make sure you've created a `.env` file
- Verify the API key is correctly set in `.env`
- Restart the agent after adding the key

**"ASI:One API Error"**
- Check your internet connection
- Verify your API key is valid and has credits
- Check if you've exceeded API rate limits
- The agent will return error messages in responses

**"Agent failed to start"**
- Ensure all dependencies are installed: `pip install -r requirements.txt`
- Check if port 8010 is available
- Verify Python version is 3.8+

**"MeTTa Error"**
- Verify hyperon package is installed
- Check MeTTa query syntax
- Review agent logs for specific error details

**Connection Issues with Agentverse**
- Ensure the agent is running and shows the Inspector link
- Check your internet connection
- Try refreshing the Inspector page

**Supabase Connection Issues (Optional)**
- Verify SUPABASE_URL and SUPABASE_ANON_KEY are set
- Check your Supabase project is active
- Agent will work without Supabase (just won't sync to cloud)

### Debug Mode

To see detailed logs, run with debug output:
```bash
python mailbox_agent.py
```

Look for:
- ASI:One API responses
- MeTTa query results
- Error messages
- Connection status updates

## File Structure

```
agent/
├── mailbox_agent.py      # Main agent implementation
├── requirements.txt      # Python dependencies
├── .env.example         # Environment variable template
├── .env                 # Your environment variables (create this)
├── .gitignore          # Git ignore rules
├── README.md           # This file
└── venv/               # Virtual environment (created during setup)
```

## Dependencies

- **uagents**: Agent framework for mailbox functionality
- **requests**: HTTP client for ASI:One API calls
- **hyperon**: MeTTa symbolic reasoning engine
- **supabase**: Optional cloud storage integration
- **python-dotenv**: Environment variable management

## Security Notes

- Never commit your `.env` file to version control
- Keep your ASI:One API key secure
- Store Supabase credentials safely
- The agent runs locally but communicates through Agentverse
- All API calls are made from your local machine

## ASI:One Integration Benefits

- ✅ **OpenAI-compatible API** - Easy drop-in replacement
- ✅ **Free hackathon credits** - Perfect for ETHOnline/ASI hackathons
- ✅ **Specialized models** - asi1-mini for extraction, asi1-graph for reasoning
- ✅ **Web3-optimized** - Better performance on blockchain content
- ✅ **Graph reasoning** - Advanced analysis with asi1-graph model
- ✅ **Structured output** - JSON-formatted responses with response_format
- ✅ **Concise responses** - Token limits and optimized prompts prevent verbosity

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Verify your setup follows all steps
3. Check the agent logs for error messages
4. Ensure your Gemini API key is valid and has sufficient quota

## Next Steps

Once the agent is running and connected to Agentverse:
1. Test with various Web3-related messages
2. Integrate with your Fluent knowledge graph system
3. Extend the agent with additional Web3 concept extraction
4. Deploy for production use

---

**Happy Concept Extracting! 🚀**

Transform your Web3 learning into structured knowledge graphs.