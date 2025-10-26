# What to Do After Minting Your Badge

## 🎉 Congratulations! Your Badge Has Been Minted

Your badge has been successfully minted and is now stored on the blockchain!

## What Happens Next?

### Current Status ✅

1. **Badge stored in blockchain**: Your badge is now a permanent NFT on Base Sepolia
2. **Badge recorded in database**: Stored in the `owned_nfts` table in Supabase
3. **Button state updated**: The mint button now shows "Badge Minted"
4. **Metadata uploaded to IPFS**: Your badge metadata (description, image, subgraph) is on Pinata IPFS

### Where is Your Badge Now?

1. **On the Domain Page**:
   - The mint button shows "Badge Minted" (blue button)
   - You can view your knowledge graph for that domain
   - The badge proves your mastery of that domain

2. **On the Blockchain**:
   - Check on Base Sepolia Etherscan: https://sepolia.basescan.org
   - Search for your transaction hash to see your badge

3. **In Your Database**:
   - All badge info is stored in Supabase `owned_nfts` table
   - Includes: domain, token ID, metadata URI, transaction hash, score

## 🚀 Next Features to Build

Since you've successfully minted your first badge, here are the recommended next features to implement:

### 1. Badge Gallery Page ⭐ (RECOMMENDED)

Create a `/badges` page to showcase all user badges:

```bash
new-website/src/app/badges/page.tsx
```

**Features**:
- Display all minted badges in a grid layout
- Show badge image, domain, score, and mint date
- Filter by domain
- Search functionality
- Share button (QR code or social media)
- View detailed badge with subgraph

### 2. Badge Detail View

Show detailed information about each badge:
- Badge metadata (name, description, attributes)
- Knowledge subgraph visualization
- Quiz scores history
- Transaction details
- Export as image

### 3. Profile Badge Showcase

Add a badges section to user profile:
- Total badges count
- Latest badges
- Achievement progress
- Domain mastery levels

### 4. Leaderboard

- Users with most badges
- Top scores by domain
- Community achievements

### 5. Badge Sharing

- Generate badge image
- Share on Twitter/X
- Embed badge in other sites
- QR code for badge verification

### 6. Advanced Badge Features

- **Progressive badges**: Bronze → Silver → Gold based on knowledge depth
- **Badge collections**: Collect all badges in a domain
- **Badge rarity**: Based on score percentiles
- **Time-based achievements**: "First mint", "Early adopter", etc.

## 📊 Current Badge Data Structure

Your badge includes:

```typescript
{
  name: "Fluent DeFi Badge #1234",
  description: "Mastered 15 concepts with 85% quiz accuracy",
  image: "Generated SVG badge image",
  attributes: [
    { trait_type: "Domain", value: "DeFi" },
    { trait_type: "Score", value: 85 },
    { trait_type: "Nodes", value: 15 },
    { trait_type: "Inferences", value: 8 },
    { trait_type: "Minted", value: "2025-01-14" }
  ],
  subgraph: {
    sentences: [...], // Top 3 captured sentences
    edges: [...] // Knowledge connections
  },
  external_url: "https://fluent.xyz/badges/1234"
}
```

## 🔍 How to Verify Your Badge

### Option 1: Check Database

```sql
SELECT * FROM owned_nfts 
WHERE user_id = 'your-user-id';
```

### Option 2: Check Etherscan

1. Go to https://sepolia.basescan.org
2. Search for your transaction hash
3. View the transaction details
4. Check the contract events (BadgeMinted event)

### Option 3: Check Browser Console

After minting, the transaction hash was logged to console.

### Option 4: View on MetaMask

1. Open MetaMask
2. Go to "NFTs" tab (if available)
3. Add custom network to view NFT on Base Sepolia

## 🎯 What You Can Do Right Now

### 1. View Badge on Etherscan

Find your transaction hash in the browser console after minting, then:
- Visit: `https://sepolia.basescan.org/tx/YOUR_TX_HASH`
- View transaction details
- See the BadgeMinted event

### 2. Mint More Badges

- Navigate to other domains
- Capture sentences in those domains
- Take quizzes
- Mint additional badges

### 3. Export Badge Image

The badge SVG is generated in `badgeMetadata.ts` - you can:
- View the SVG data URI
- Convert to PNG/PDF
- Use as a profile picture

### 4. Build Badge Gallery

Start building the `/badges` page using the existing badge data:
- Query `owned_nfts` table
- Display badge grid
- Add filtering/sorting

## 📝 Quick Start: Build Badge Gallery

Here's a starting template for a badge gallery page:

```typescript
// new-website/src/app/badges/page.tsx

import { getSupabaseBrowserClient } from '@/lib/supabase';

export default async function BadgesPage() {
  const supabase = getSupabaseBrowserClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return <div>Please login to view badges</div>;
  }

  const { data: badges } = await supabase
    .from('owned_nfts')
    .select('*')
    .eq('user_id', user.id)
    .order('minted_at', { ascending: false });

  return (
    <div>
      <h1>My Badges ({badges?.length || 0})</h1>
      {/* Display badge grid */}
    </div>
  );
}
```

## 🎨 Design Ideas

### Badge Card Design
- Badge icon/emoji
- Domain name
- Score percentage
- Node count
- Mint date
- View details button

### Grid Layout
```css
.badge-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
}
```

### Badge Categories
- Sort by: Date minted, Score, Domain, Node count
- Filter by: Domain type
- Search by: Domain name

## 🚨 Important Reminders

1. **Testnet only**: This is on Base Sepolia testnet, not mainnet
2. **Pinata required**: Badge images use IPFS via Pinata
3. **Wallet needed**: MetaMask connection required for minting
4. **One badge per domain**: UNIQUE constraint prevents duplicate badges

## 🎓 Learning Points

After minting your first badge, you've learned:
- How to deploy Solidity smart contracts
- How to connect Web3 wallets
- How to mint NFT badges
- How to store metadata on IPFS
- How to track blockchain events

## 📚 Resources

- [Base Sepolia Explorer](https://sepolia.basescan.org)
- [Pinata Dashboard](https://app.pinata.cloud)
- [Remix IDE](https://remix.ethereum.org)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts/4.x/)

## 🎉 Next Steps

1. ✅ Deploy contract → DONE
2. ✅ Mint first badge → DONE
3. ⏳ Build badge gallery page
4. ⏳ Add badge sharing features
5. ⏳ Create profile badge showcase
6. ⏳ Implement leaderboard

---

**Want to build the badge gallery next?** Let me know and I can help you create the complete badge showcase page!

