# Fluent Badges Smart Contract

This directory contains the Solidity smart contract for the Fluent Badge NFT system.

## Contract Overview

**FluentBadges.sol** - Soulbound ERC-721 NFT contract
- Contract Name: "FluentBadges"
- Token Symbol: "FLNT"
- Network: Base Sepolia Testnet
- Soulbound: Tokens cannot be transferred after minting

## Deployment Instructions

### Prerequisites

1. Install dependencies:
```bash
npm install --save-dev hardhat @openzeppelin/contracts
npm install --save-dev @nomicfoundation/hardhat-toolbox
```

2. Get test ETH from Base Sepolia faucet:
- Visit: https://www.coinbase.com/faucets/base-ethereum-goerli-faucet
- Connect your MetaMask wallet
- Request test tokens

### Deployment via Remix IDE (Recommended)

1. Go to [Remix IDE](https://remix.ethereum.org)
2. Create a new file `FluentBadges.sol` in the contracts folder
3. Copy the contents of `FluentBadges.sol` into the file
4. Import OpenZeppelin contracts:
   - Click "File Explorer" tab
   - Right-click "contracts" folder → "New Folder" → name it "openzeppelin"
   - In your browser, go to `@openzeppelin/contracts` NPM page
   - Copy OpenZeppelin contracts manually or use Remix's auto-import

5. Compile the contract:
   - Click "Solidity Compiler" tab
   - Select compiler version 0.8.20 or higher
   - Click "Compile FluentBadges.sol"

6. Deploy the contract:
   - Click "Deploy & Run Transactions" tab
   - Select "Injected Provider - MetaMask"
   - Make sure you're on Base Sepolia network
   - No constructor parameters needed (public minting enabled)
   - Click "Deploy"
   - Confirm transaction in MetaMask

7. After deployment:
   - Copy the contract address
   - Update `.env.local`:
     ```
     NEXT_PUBLIC_BADGE_CONTRACT_ADDRESS=0x...
     ```

### Deployment via Hardhat (Alternative)

1. Create `hardhat.config.js`:

```javascript
require("@nomicfoundation/hardhat-toolbox");
require("@nomicfoundation/hardhat-ethers");

module.exports = {
  solidity: "0.8.20",
  networks: {
    baseSepolia: {
      url: "https://sepolia.base.org",
      accounts: [process.env.PRIVATE_KEY],
      chainId: 84532
    }
  }
};
```

2. Create `scripts/deploy.js`:

```javascript
const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contract with account:", deployer.address);

  const FluentBadges = await ethers.getContractFactory("FluentBadges");
  const badges = await FluentBadges.deploy();
  
  await badges.waitForDeployment();
  console.log("Contract deployed to:", await badges.getAddress());
}

main().catch(console.error);
```

3. Deploy:

```bash
npx hardhat run scripts/deploy.js --network baseSepolia
```

## Contract Features

### Minting
- Public minting enabled (anyone can mint)
- Each mint emits a `BadgeMinted` event
- Token URI set to IPFS metadata

### Soulbound Mechanism
- Overrides `_update` to block transfers between non-zero addresses
- Tokens can only be:
  - Minted (from address(0))
  - Burned (to address(0))
  - Never transferred between users

### Role Management
- DEFAULT_ADMIN_ROLE: Full control (reserved for contract owner)
- Public minting: No role restriction on minting
- Uses OpenZeppelin AccessControl (framework ready for future role-based access)

## Security Considerations

1. **Soulbound Enforcement**: Transfers will revert with custom error message
2. **Public Minting**: Anyone can mint badges (testnet deployment)
3. **Reentrancy**: Not applicable (no external calls during transfers)
4. **Overflow**: Using OpenZeppelin's SafeMath patterns (Solidity 0.8.20+)

⚠️ **Note**: This contract has public minting enabled for easy testing. For production, you should implement access control or use a backend minting service.

## Testing

Use Remix IDE's "Deploy & Run Transactions" to test:

1. Mint a badge:
   - Select contract
   - Use `mint` function
   - Params: `to` (address), `uri` ("ipfs://Qm..."), `domain` ("DeFi")
   - Should succeed

2. Try to transfer:
   - Use `transferFrom(from, to, tokenId)`
   - Should revert with "Soulbound: token cannot be transferred"

## Verifying on Etherscan

1. Go to [Base Sepolia Etherscan](https://sepolia.basescan.org)
2. Enter your contract address
3. Click "Contract" → "Verify and Publish"
4. Select "Solidity (Single file)"
5. Copy contract source code
6. Enter compiler version (0.8.20)
7. Paste constructor arguments (your deployer address)
8. Click "Verify and Publish"

## Environment Variables

Add to `.env.local`:

```
NEXT_PUBLIC_BADGE_CONTRACT_ADDRESS=0x...your_contract_address
NEXT_PUBLIC_BASE_SEPOLIA_RPC=https://sepolia.base.org
NEXT_PUBLIC_ETHERSCAN_BASE_URL=https://sepolia.basescan.org
```

## Next Steps

After deployment:
1. Test minting via Remix
2. Copy contract address to `.env.local`
3. Generate ABI: `npx hardhat compile` → `artifacts/contracts/FluentBadges.sol/FluentBadges.json`
4. Save ABI to `new-website/src/contracts/FluentBadges.json`

