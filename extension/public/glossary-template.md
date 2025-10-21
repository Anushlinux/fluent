# Fluent Glossary Template & Guidelines

## Overview

This document provides guidelines for adding new terms to the Fluent glossary. The glossary supports both legacy single-definition format and new context-aware definitions.

## JSON Structure

### New Format (Recommended - Context-Aware)

```json
{
  "term": "TermName",
  "definitions": {
    "ContextName1": "Definition specific to this context",
    "ContextName2": "Definition for another context",
    "General": "Default/fallback definition"
  },
  "examples": {
    "ContextName1": "Example usage in this context",
    "ContextName2": "Example for another context",
    "General": "General example"
  },
  "sources": ["source1.com", "source2.org"],
  "category": "CategoryName",
  "quiz": {
    "question": "Quiz question about the term?",
    "answers": [
      "Wrong answer option",
      "Correct answer",
      "Wrong answer option",
      "Wrong answer option"
    ],
    "correct": 1,
    "hint": "Helpful hint for incorrect answers"
  }
}
```

### Legacy Format (Backward Compatible)

```json
{
  "term": "TermName",
  "definition": "Single definition text",
  "usage": "Example usage",
  "sources": ["source.com"],
  "category": "CategoryName",
  "quiz": {
    "question": "Quiz question?",
    "answers": ["Option 1", "Option 2", "Option 3", "Option 4"],
    "correct": 1,
    "hint": "Optional hint"
  }
}
```

## Field Descriptions

### Required Fields

- **term** (string): The term name (e.g., "Blockchain", "Smart Contract")
- **definition** OR **definitions** (string | object): Term definition(s)
- **usage** OR **examples** (string | object): Usage examples
- **quiz** (object): Interactive quiz for the term
  - **question** (string): Quiz question
  - **answers** (array): Exactly 4 answer options
  - **correct** (number): Index of correct answer (0-3)
  - **hint** (string, optional): Hint shown on wrong answer

### Optional Fields

- **sources** (array): URLs or source names for attribution
- **category** (string): Term category for filtering and organization

## Context Types

Use these standard context identifiers for consistency:

- **General**: Default/fallback definition
- **ERC-4337**: Account abstraction specific
- **DeFi**: Decentralized Finance context
- **NFT**: NFT/digital collectibles context
- **L2**: Layer 2 scaling solutions
- **DAO**: Decentralized governance
- **Infrastructure**: Blockchain infrastructure
- **Development**: Smart contract development
- **Security**: Security and auditing
- **AI**: Artificial Intelligence context

## Categories

Standard categories for organization:

- **General**: Cross-cutting terms
- **Infrastructure**: Core blockchain tech
- **Development**: Programming and tools
- **DeFi**: Decentralized finance
- **NFT**: Non-fungible tokens
- **DAO**: Governance and DAOs
- **L2**: Layer 2 solutions
- **Security**: Security topics
- **AI**: Artificial Intelligence

## Writing Guidelines

### Definitions

1. **Be Concise**: 1-2 sentences for each definition
2. **Context-Specific**: Tailor definitions to the context
3. **Avoid Jargon**: Or explain technical terms
4. **Progressive Disclosure**: General → Specific
5. **Accuracy**: Verify facts with authoritative sources

### Examples

1. **Real-World**: Use actual protocols/projects when possible
2. **Clear**: Should illustrate the definition
3. **Varied**: Different examples for different contexts
4. **Current**: Reference active projects, not deprecated ones

### Quiz Questions

1. **Test Understanding**: Not just memorization
2. **Clear Wording**: Unambiguous questions
3. **Plausible Distractors**: Wrong answers should be tempting
4. **Difficulty**: Medium difficulty for general audience
5. **Helpful Hints**: Guide thinking without giving answer

### Sources

1. **Authoritative**: Official docs, standards, reputable sites
2. **Accessible**: Publicly available resources
3. **Current**: Active and maintained sources
4. **Relevant**: Directly related to the term

## Examples

### Example 1: Context-Aware Term

```json
{
  "term": "Gas",
  "definitions": {
    "Infrastructure": "A unit of measurement for computational work required to execute operations on the Ethereum network.",
    "DeFi": "The transaction cost users pay to interact with DeFi protocols, calculated based on network congestion.",
    "General": "The fee paid to process transactions and smart contracts on blockchain networks."
  },
  "examples": {
    "Infrastructure": "Each EVM opcode consumes a specific amount of gas based on its computational complexity.",
    "DeFi": "Swapping tokens on Uniswap costs gas, which varies based on network demand.",
    "General": "You need to have ETH in your wallet to pay for gas when sending tokens."
  },
  "sources": ["ethereum.org", "docs.soliditylang.org"],
  "category": "Infrastructure",
  "quiz": {
    "question": "What determines gas prices on Ethereum?",
    "answers": [
      "A fixed rate set by Ethereum Foundation",
      "Supply and demand based on network congestion",
      "The amount of ETH you have",
      "The time of day"
    ],
    "correct": 1,
    "hint": "Think about how prices work in a market with limited capacity."
  }
}
```

### Example 2: Simple Legacy Term

```json
{
  "term": "Airdrop",
  "definition": "The distribution of free tokens to wallet addresses, often used for marketing or rewarding early users.",
  "usage": "Uniswap airdropped 400 UNI tokens to early users who had used the protocol before a certain date.",
  "sources": ["coindesk.com"],
  "category": "DeFi",
  "quiz": {
    "question": "What is the primary purpose of an airdrop?",
    "answers": [
      "To test wallets",
      "To distribute tokens to users or promote a project",
      "To steal private keys",
      "To validate transactions"
    ],
    "correct": 1,
    "hint": "Consider why projects would give away free tokens."
  }
}
```

## Quality Checklist

Before adding a term, verify:

- [ ] Term is relevant to Web3 or AI domains
- [ ] Definition is accurate and cited
- [ ] Examples are clear and current
- [ ] Quiz has exactly 4 answers with 1 correct
- [ ] Quiz tests understanding, not just memory
- [ ] Sources are authoritative and accessible
- [ ] Category is assigned appropriately
- [ ] JSON is valid (no syntax errors)
- [ ] Spelling and grammar are correct
- [ ] Term doesn't duplicate existing entries

## Adding New Terms

1. Choose appropriate format (context-aware vs. legacy)
2. Research term from multiple authoritative sources
3. Write clear, concise definitions for each relevant context
4. Create helpful examples
5. Design thoughtful quiz question with plausible distractors
6. Add sources and category
7. Validate JSON syntax
8. Test term appears correctly in extension

## CSV to JSON Conversion

For bulk additions, you can use this structure in CSV:

```csv
term,definition,usage,category,quizQuestion,answer1,answer2,answer3,answer4,correctIndex,hint,sources
```

Then convert using a script or tool to JSON format.

## Maintenance

- **Review**: Periodically review terms for accuracy
- **Update**: Update definitions as technology evolves
- **Deprecate**: Mark outdated terms or update to current terminology
- **Community**: Accept contributions with proper review

## Resources

- Ethereum.org Documentation
- EIP Standards (eips.ethereum.org)
- Protocol Documentation (Uniswap, Aave, etc.)
- Technical Whitepapers
- Reputable News Sources (CoinDesk, The Block)
- Academic Papers

---

**Version**: 1.0  
**Last Updated**: 2025-10-21  
**Maintainer**: Fluent Team

