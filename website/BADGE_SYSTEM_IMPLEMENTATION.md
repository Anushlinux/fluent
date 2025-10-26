# Soulbound Badge NFT Implementation

## Overview

This document describes the implementation of the Soulbound Badge NFT minting system for Fluent, enabling users to mint non-transferable NFT badges as proof of domain mastery.

## Architecture

### Components Created

1. **Smart Contract** (`contracts/FluentBadges.sol`)
   - Soulbound ERC-721 implementation using OpenZeppelin
   - Prevents transfers between users (true soulbound tokens)
   - Minting restricted to minter role

2. **Database Schema** (`supabase/migrations/002_badge_system.sql`)
   - `quizzes` table: Tracks quiz attempts and scores
   - `owned_nfts` table: Records minted badges
   - `quiz_questions_cache` table: Pre-cached quiz questions for performance
   - Added `mastery_level` and `badges_minted` to profiles table

3. **Wallet Integration** (`src/lib/walletConnect.ts`)
   - MetaMask connection utilities
   - Base Sepolia network switching
   - Badge minting transaction execution

4. **Metadata Generation** (`src/lib/badgeMetadata.ts`)
   - Generates NFT metadata from user's graph data
   - Uploads metadata to Pinata IPFS
   - Creates placeholder badge images

5. **Quiz Modal** (`src/components/QuizModal.tsx`)
   - Displays adaptive quiz questions
   - Fetches questions from ASI:One agent API
   - Real-time scoring with 80% threshold

6. **Mint Modal** (`src/components/MintModal.tsx`)
   - Handles complete minting flow
   - Wallet connection
   - Metadata generation and IPFS upload
   - Transaction execution and confirmation

7. **Domain Graph Viewer Updates** (`src/components/domain-graph-viewer.tsx`)
   - Added mint button with state management
   - Quiz success handler
   - Mint success handler with database updates

## Flow

### User Journey

1. **Data Collection**: User captures sentences in a domain
2. **Threshold Check**: System verifies user has at least 5 captured sentences
3. **Quiz Button**: "Take Quiz to Mint" button appears (yellow)
4. **Quiz Completion**: User takes quiz, needs 80%+ to proceed
5. **Mint Flow**: If passed, green "Mint Badge" button appears
6. **Wallet Connect**: User connects MetaMask wallet
7. **Metadata Generation**: System generates badge metadata from graph
8. **IPFS Upload**: Metadata uploaded to Pinata
9. **Minting**: Transaction executed on Base Sepolia
10. **Confirmation**: Badge saved to database, button shows "Badge Minted" (blue)

### Button States

- **Disabled (Gray)**: User has < 5 sentences
- **Pending (Yellow)**: User eligible, needs to take quiz
- **Ready (Green pulse)**: Quiz passed with 80%+, ready to mint
- **Minted (Blue)**: Badge already minted for this domain

## Database Tables

### quizzes
- Tracks quiz attempts per user and domain
- Stores score, total questions, difficulty
- Marks if quiz was passed (80%+)

### owned_nfts
- Records minted badges
- Links to token ID, transaction hash, metadata URI
- One badge per domain per user (enforced by UNIQUE constraint)

### quiz_questions_cache
- Pre-caches quiz questions for performance
- Stores questions as JSONB
- Prevents repeated API calls

## Environment Variables Required

Add to `.env.local`:

```bash
# Supabase (existing)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# Note: Google OAuth is configured in Supabase Dashboard
# See GOOGLE_OAUTH_SETUP.md for setup instructions

# Badge System
NEXT_PUBLIC_BADGE_CONTRACT_ADDRESS=0x... # After deployment
NEXT_PUBLIC_BASE_SEPOLIA_RPC=https://sepolia.base.org
NEXT_PUBLIC_ETHERSCAN_BASE_URL=https://sepolia.basescan.org

# Pinata
NEXT_PUBLIC_PINATA_API_KEY=your_pinata_api_key
PINATA_SECRET_KEY=your_pinata_secret_key

# Agent
NEXT_PUBLIC_AGENT_URL=http://localhost:8042

# Website
NEXT_PUBLIC_WEBSITE_URL=https://fluent.xyz
```

## Deployment Steps

### 1. Deploy Smart Contract

1. Go to [Remix IDE](https://remix.ethereum.org)
2. Create new file `contracts/FluentBadges.sol`
3. Copy contract code from `new-website/contracts/FluentBadges.sol`
4. Import OpenZeppelin contracts (see README in contracts folder)
5. Compile contract (Solidity 0.8.20+)
6. Deploy to Base Sepolia testnet
7. Copy contract address and update `.env.local`

### 2. Run Database Migration

```bash
# In supabase directory
supabase db push
```

Or manually run `supabase/migrations/002_badge_system.sql` in your Supabase dashboard.

### 3. Install Dependencies

```bash
cd new-website
npm install ethers canvas-confetti pinata-sdk --legacy-peer-deps
```

### 4. Configure Environment

Create `.env.local` from `.env.example` and fill in your values.

### 5. Test the System

1. Start the dev server: `npm run dev`
2. Navigate to a domain page (e.g., `/domain/defi`)
3. Capture at least 5 sentences in that domain
4. Click "Take Quiz to Mint"
5. Complete quiz with 80%+
6. Click "Mint Badge"
7. Connect MetaMask wallet
8. Approve transaction
9. View minted badge

## API Integration

### ASI:One Agent

The quiz system expects an agent API running at `NEXT_PUBLIC_AGENT_URL` with endpoint:

```
POST /generate-quiz
Body: { user_id, gap_cluster, difficulty }
Response: { questions: [ { question, options, correct, explanation } ] }
```

See `agent/mailbox_agent.py` for reference implementation.

## Security Considerations

1. **Soulbound Mechanism**: Tokens cannot be transferred between users
2. **Access Control**: Only minter role can mint (set in constructor)
3. **Rate Limiting**: Database UNIQUE constraints prevent duplicate mints per domain
4. **Quiz Validation**: ASI:One validates questions before serving to users
5. **Wallet Security**: User must explicitly approve each transaction

## Future Enhancements

### Phase 2: Badge Gallery

- Create `/badges` page with masonry grid layout
- Filter badges by domain
- Badge detail view with subgraph snippet
- Share functionality (QR code, tweet template)
- Real-time updates via Supabase subscriptions

### Additional Features

- Canvas-generated badge images instead of placeholders
- Badge rarity system based on score percentiles
- Progressive badge upgrades (bronze → silver → gold)
- Badge achievements and milestones
- Community leaderboards

## Troubleshooting

### Minting Fails

- Check wallet has ETH on Base Sepolia
- Verify contract address is correct
- Ensure network is switched to Base Sepolia
- Check gas prices aren't too high

### Quiz Questions Not Loading

- **Start the agent**: `cd agent && source venv/bin/activate && python mailbox_agent.py`
- Verify agent API is running on `http://localhost:8042`
- Check `NEXT_PUBLIC_AGENT_URL` in environment variables
- Look for CORS errors in browser console
- If agent is unavailable, the system will use fallback demo questions
- See `agent/START_AGENT.md` for detailed instructions

### Database Errors

- Verify migration was applied successfully
- Check Supabase RLS policies allow insert
- Ensure user is authenticated
- Look for foreign key constraint violations

## Support

For issues or questions:
1. Check browser console for errors
2. Review Supabase logs
3. Verify environment variables
4. Test with Base Sepolia testnet faucet

