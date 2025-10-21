import nlp from 'compromise';

export interface ContextResult {
  terms: string[];
  context: string;
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
  
  // Calculate confidence (0-100)
  const maxPossibleScore = 10; // Approximate max for normalization
  const confidence = sortedContexts.length > 0 
    ? Math.min(100, Math.round((sortedContexts[0][1] / maxPossibleScore) * 100))
    : 0;

  return { 
    terms, 
    context,
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
