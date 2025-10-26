# Smart Contract Deployment Guide

## Problem Summary

You're getting this error because:
1. The contract hasn't been deployed yet
2. Your `.env.local` has a wallet address instead of a contract address

## Quick Deployment Steps

### Step 1: Get Test ETH

1. Go to https://www.coinbase.com/faucets/base-ethereum-goerli-faucet
2. Connect your MetaMask wallet
3. Request test tokens

### Step 2: Deploy Contract on Remix

1. Visit [Remix IDE](https://remix.ethereum.org)
2. Create file: Click "File Explorer" → "contracts" → "Create New File" → name it `FluentBadges.sol`
3. Copy content from `new-website/contracts/FluentBadges.sol`
4. Import OpenZeppelin:
   - Open File Manager
   - Right-click `contracts` folder → "New Folder" → name it "openzeppelin"
   - Download: https://github.com/OpenZeppelin/openzeppelin-contracts/archive/refs/tags/v4.9.3.zip
   - Extract and copy OpenZeppelin contracts to `contracts/openzeppelin/contracts`
5. Compile:
   - Open "Solidity Compiler" tab
   - Select version 0.8.20 or higher
   - Click "Compile FluentBadges.sol"
6. Deploy:
   - Open "Deploy & Run Transactions" tab
   - Select "Injected Provider - MetaMask"
   - Connect wallet and switch to Base Sepolia network
   - Leave constructor parameters EMPTY (no minter address needed)
   - Click "Deploy"
   - Confirm transaction in MetaMask
7. Copy contract address: After deployment, copy the deployed contract address (shown in "Deployed Contracts" section)

### Step 3: Update Environment Variables

Open `new-website/.env.local` and add/update:

```bash
NEXT_PUBLIC_BADGE_CONTRACT_ADDRESS=0xYOUR_DEPLOYED_CONTRACT_ADDRESS
```

**Important**: Replace `0xYOUR_DEPLOYED_CONTRACT_ADDRESS` with the actual contract address from Remix!

### Step 4: Restart Dev Server

```bash
# Stop the current server (Ctrl+C)
npm run dev
# or
pnpm dev
```

### Step 5: Test Minting

1. Navigate to a domain page
2. Capture 5+ sentences
3. Complete the quiz with 80%+ score
4. Click "Mint Badge"
5. Connect wallet (MetaMask)
6. Approve the transaction

## Verify Contract on Etherscan

1. Go to https://sepolia.basescan.org
2. Search for your contract address
3. You can view transactions, events, and contract code

## Need Help?

- Check browser console for detailed errors
- Verify network is Base Sepolia in MetaMask
- Ensure you have test ETH in your wallet
- Contract must be deployed before you can mint
- Pinata API keys are still required for metadata upload

## Testing Contract Directly in Remix

After deployment, you can test in Remix:

1. In "Deployed Contracts" section, find your contract
2. Expand the contract to see functions
3. Try calling `mint`:
   - `to`: Your wallet address
   - `uri`: "ipfs://QmTest123"
   - `domain`: "DeFi"
4. Click transact to execute the mint

