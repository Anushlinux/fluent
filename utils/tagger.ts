import nlp from 'compromise';

export interface ContextResult {
  terms: string[];
  context: string;
  framework?: string;          // Blockchain framework (EVM, Solana, Cosmos, etc.)
  secondaryContext?: string;
  confidence: number;
}

/**
 * Tags a sentence by extracting key terms and estimating its context.
 * @param sentence - The input sentence to be analyzed.
 * @param glossary - An array of terms to match against noun phrases.
 * @returns An object containing the extracted terms, primary context, and confidence score.
 */
export function tagSentence(sentence: string, glossary: string[]): ContextResult {
  // Parse the sentence using compromise.js
  const doc = nlp(sentence);

  // Extract noun phrases
  const nounPhrases = doc.nouns().out('array');

  // Filter noun phrases that match the glossary terms (case-insensitive)
  const terms = nounPhrases.filter((phrase: string) =>
    glossary.some(term => term.toLowerCase() === phrase.toLowerCase())
  );

  // Define context labels and associated keywords with weights
  const contextKeywords: { [key: string]: string[] } = {
    'ERC-4337': ['erc-4337', 'erc4337', 'account abstraction', 'user operation', 'bundler', 'paymaster', 'entry point'],
    'DeFi': ['decentralized finance', 'defi', 'yield farming', 'liquidity pool', 'lending protocol', 'dex', 'amm', 'swap', 'trade', 'borrow', 'lend', 'uniswap', 'aave', 'compound'],
    'L2': ['layer 2', 'layer2', 'layer-2', 'scaling solution', 'rollup', 'sidechain', 'optimism', 'arbitrum', 'polygon', 'zk', 'optimistic rollup', 'zkrollup'],
    'AI': ['artificial intelligence', 'machine learning', 'neural network', 'deep learning', 'ai', 'ml', 'llm', 'large language model', 'transformer', 'training', 'inference', 'prompt', 'embedding'],
    'NFT': ['nft', 'non-fungible token', 'digital art', 'collectible', 'opensea', 'rarible', 'erc-721', 'erc-1155', 'metadata', 'mint', 'minting'],
    'DAO': ['dao', 'decentralized autonomous organization', 'governance', 'voting', 'proposal', 'token holder', 'governance token'],
    'Infrastructure': ['node', 'validator', 'consensus', 'mining', 'staking', 'proof of work', 'proof of stake', 'pow', 'pos', 'beacon chain', 'shard'],
    'Development': ['smart contract', 'solidity', 'web3', 'dapp', 'erc-20', 'token standard', 'deploy', 'compile', 'vyper', 'hardhat', 'truffle'],
    'Security': ['audit', 'vulnerability', 'exploit', 'hack', 'security', 'oracle', 'attack', 'reentrancy', 'overflow', 'private key'],
  };

  // Define blockchain framework keywords
  const frameworkKeywords: { [key: string]: string[] } = {
    'EVM': ['ethereum', 'evm', 'ethereum virtual machine', 'evm-compatible', 'solidity', 'vyper', 'web3.js', 'ethers.js'],
    'Solana': ['solana', 'spl', 'solana program library', 'rust solana', 'anchor framework', 'phantom wallet'],
    'Cosmos': ['cosmos', 'cosmos sdk', 'tendermint', 'ibc', 'inter-blockchain communication', 'atom'],
    'Bitcoin': ['bitcoin', 'btc', 'lightning network', 'taproot', 'segwit', 'utxo'],
    'Polkadot': ['polkadot', 'substrate', 'parachain', 'relay chain', 'dot', 'kusama'],
    'Cardano': ['cardano', 'ada', 'plutus', 'haskell cardano', 'ouroboros'],
    'Avalanche': ['avalanche', 'avax', 'subnet', 'avalanche consensus'],
    'Near': ['near', 'near protocol', 'aurora', 'nightshade'],
    'Aptos': ['aptos', 'move language', 'aptos blockchain'],
    'Sui': ['sui', 'sui blockchain', 'move sui'],
  };

  // Calculate context scores based on keyword matches
  const contextScores: { [key: string]: number } = {};
  const sentenceLower = sentence.toLowerCase();
  
  for (const [label, keywords] of Object.entries(contextKeywords)) {
    let score = 0;
    keywords.forEach(keyword => {
      if (sentenceLower.includes(keyword)) {
        // More specific keywords (longer) get higher weight
        score += keyword.split(' ').length;
      }
    });
    if (score > 0) {
      contextScores[label] = score;
    }
  }

  // Sort contexts by score
  const sortedContexts = Object.entries(contextScores)
    .sort(([, a], [, b]) => b - a);

  // Determine primary and secondary context
  const context = sortedContexts.length > 0 ? sortedContexts[0][0] : 'General';
  const secondaryContext = sortedContexts.length > 1 ? sortedContexts[1][0] : undefined;
  
  // Calculate framework scores based on keyword matches
  const frameworkScores: { [key: string]: number } = {};
  
  for (const [label, keywords] of Object.entries(frameworkKeywords)) {
    let score = 0;
    keywords.forEach(keyword => {
      if (sentenceLower.includes(keyword)) {
        // More specific keywords (longer) get higher weight
        score += keyword.split(' ').length;
      }
    });
    if (score > 0) {
      frameworkScores[label] = score;
    }
  }

  // Sort frameworks by score and pick the top one
  const sortedFrameworks = Object.entries(frameworkScores)
    .sort(([, a], [, b]) => b - a);
  const framework = sortedFrameworks.length > 0 ? sortedFrameworks[0][0] : undefined;
  
  // Calculate confidence (0-100)
  const maxPossibleScore = 10; // Approximate max for normalization
  const confidence = sortedContexts.length > 0 
    ? Math.min(100, Math.round((sortedContexts[0][1] / maxPossibleScore) * 100))
    : 0;

  return { 
    terms, 
    context,
    framework,
    secondaryContext,
    confidence
  };
}

/**
 * Detect page-level context by analyzing larger text content
 */
export function detectPageContext(pageText: string): ContextResult {
  // Sample the page text (first 2000 chars for performance)
  const sample = pageText.slice(0, 2000).toLowerCase();
  
  return tagSentence(sample, []);
}

/**
 * AI Enrichment Hook - Placeholder for future Grok/Claude API integration
 * @param result - The rule-based tagging result to be enriched
 * @param sentence - The original sentence for context
 * @returns Enhanced ContextResult with AI-powered insights
 */
export async function enrichWithAI(result: ContextResult, sentence: string): Promise<ContextResult> {
  // TODO: Phase 3 - Integrate Grok/Claude API
  // Example implementation:
  // const apiResponse = await fetch('https://api.x.ai/v1/chat/completions', {
  //   method: 'POST',
  //   headers: {
  //     'Content-Type': 'application/json',
  //     'Authorization': 'Bearer YOUR_API_KEY'
  //   },
  //   body: JSON.stringify({
  //     model: 'grok-4',
  //     messages: [{
  //       role: 'user',
  //       content: `Classify this Web3 sentence's context and framework: "${sentence}"`
  //     }]
  //   })
  // });
  // const aiData = await apiResponse.json();
  // return { ...result, ...aiData.enhancements };
  
  // For now, just return the rule-based result unchanged
  console.log('[Fluent] AI enrichment called (stub) for:', sentence.slice(0, 50) + '...');
  return result;
}
