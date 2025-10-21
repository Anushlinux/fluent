import nlp from 'compromise';

/**
 * Tags a sentence by extracting key terms and estimating its context.
 * @param sentence - The input sentence to be analyzed.
 * @param glossary - An array of terms to match against noun phrases.
 * @returns An object containing the extracted terms and the estimated context.
 */
export function tagSentence(sentence: string, glossary: string[]): { terms: string[], context: string } {
  // Parse the sentence using compromise.js
  const doc = nlp(sentence);

  // Extract noun phrases
  const nounPhrases = doc.nouns().out('array');

  // Filter noun phrases that match the glossary terms (case-insensitive)
  const terms = nounPhrases.filter((phrase: string) =>
    glossary.some(term => term.toLowerCase() === phrase.toLowerCase())
  );

  // Define context labels and associated keywords
  const contextKeywords: { [key: string]: string[] } = {
    'DeFi': ['decentralized finance', 'defi', 'yield farming', 'liquidity pool', 'lending protocol', 'dex', 'amm'],
    'L2': ['layer 2', 'layer2', 'scaling solution', 'rollup', 'sidechain', 'optimism', 'arbitrum', 'polygon'],
    'AI': ['artificial intelligence', 'machine learning', 'neural network', 'deep learning', 'ai', 'ml'],
    'NFT': ['nft', 'non-fungible token', 'digital art', 'collectible', 'opensea', 'rarible'],
    'DAO': ['dao', 'decentralized autonomous organization', 'governance', 'voting', 'proposal'],
    'Infrastructure': ['node', 'validator', 'consensus', 'mining', 'staking', 'validator'],
    'Development': ['smart contract', 'solidity', 'web3', 'dapp', 'erc-20', 'token standard'],
    'Security': ['audit', 'vulnerability', 'exploit', 'hack', 'security', 'oracle'],
  };

  // Determine the context based on the presence of keywords
  let context = 'General';
  for (const [label, keywords] of Object.entries(contextKeywords)) {
    if (keywords.some(keyword => sentence.toLowerCase().includes(keyword))) {
      context = label;
      break;
    }
  }

  return { terms, context };
}
