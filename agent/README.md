# Fluent Mailbox Agent

A Python-based Mailbox Agent that uses Google's Gemini LLM to extract Web3 concepts, terms, and relationships from text input. This agent runs locally with mailbox functionality enabled for Agentverse connectivity.

## Features

- 🤖 **Gemini LLM Integration** - Uses Google's Gemini Pro model for intelligent concept extraction
- 📧 **Mailbox Agent** - Runs locally but discoverable through Agentverse
- 🔍 **Web3 Focus** - Specialized in extracting blockchain, DeFi, NFT, and Web3 concepts
- 🛡️ **Error Handling** - Fallback extraction when API fails
- 📊 **Structured Output** - Returns JSON with terms, context, and relationships
- 🔄 **Real-time Chat** - Supports chat protocol for interactive communication

## Prerequisites

- Python 3.8 or higher
- Google Gemini API key
- Internet connection for API calls

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

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and add your Gemini API key:
   ```
   GEMINI_API_KEY=your_actual_gemini_api_key_here
   ```

### 6. Get Gemini API Key

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the generated key
5. Add it to your `.env` file

## Running the Agent

### Start the Agent

```bash
python mailbox_agent.py
```

### Expected Output

```
🚀 Fluent Mailbox Agent Starting...
📧 Your agent's address is: agent1q...
🌐 Agent will be available at: http://0.0.0.0:8000
📋 Inspector link will be provided in the logs
🔑 Using Gemini API key: ✅ Set
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

### Concept Extraction

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

## Troubleshooting

### Common Issues

**"GEMINI_API_KEY environment variable is not set"**
- Make sure you've created a `.env` file
- Verify the API key is correctly set in `.env`
- Restart the agent after adding the key

**"Gemini exception: ..."**
- Check your internet connection
- Verify your API key is valid
- Check if you've exceeded API rate limits
- The agent will fall back to keyword extraction

**"Agent failed to start"**
- Ensure all dependencies are installed: `pip install -r requirements.txt`
- Check if port 8000 is available
- Verify Python version is 3.8+

**Connection Issues with Agentverse**
- Ensure the agent is running and shows the Inspector link
- Check your internet connection
- Try refreshing the Inspector page

### Debug Mode

To see detailed logs, run with debug output:
```bash
python mailbox_agent.py
```

Look for:
- Gemini API responses
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
- **google-generativeai**: Gemini LLM integration
- **python-dotenv**: Environment variable management

## Security Notes

- Never commit your `.env` file to version control
- Keep your Gemini API key secure
- The agent runs locally but communicates through Agentverse
- All API calls are made from your local machine

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