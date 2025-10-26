'use client';

import React, { useState } from 'react';
import { X, ExternalLink, Loader2, CheckCircle } from 'lucide-react';
import { connectMetaMask, switchToBaseSepolia, mintBadge } from '@/lib/walletConnect';
import { generateBadgeMetadata, uploadToPinata } from '@/lib/badgeMetadata';
import { insertOwnedNFT } from '@/lib/graphStorage';
import { DomainConfig } from '@/lib/domain-config';
import type { BadgeMetadata } from '@/lib/badgeMetadata';

interface MintModalProps {
  domain: string;
  domainConfig: DomainConfig;
  userId: string;
  score: number;
  totalQuestions: number;
  onClose: () => void;
  onSuccess: (txHash: string) => void;
}

type MintState = 'confirmation' | 'connecting' | 'generating' | 'uploading' | 'minting' | 'success' | 'error';

export function MintModal({
  domain,
  domainConfig,
  userId,
  score,
  totalQuestions,
  onClose,
  onSuccess,
}: MintModalProps) {
  const [state, setState] = useState<MintState>('confirmation');
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [account, setAccount] = useState<string | null>(null);
  const [tokenURI, setTokenURI] = useState<string | null>(null);
  const [badgeMetadata, setBadgeMetadata] = useState<BadgeMetadata | null>(null);

  const handleConnectWallet = async () => {
    setState('connecting');
    setError(null);

    try {
      const signer = await connectMetaMask();
      const address = await signer.getAddress();
      setAccount(address);

      await switchToBaseSepolia();
      setState('confirmation');
    } catch (err: any) {
      console.error('[Mint] Failed to connect:', err);
      setError(err.message || 'Failed to connect wallet');
      setState('error');
    }
  };

  const handleMint = async () => {
    setState('generating');
    setError(null);

    try {
      // Generate metadata
      const metadata = await generateBadgeMetadata(domain, (score / totalQuestions) * 100, userId, domainConfig);
      setBadgeMetadata(metadata);

      setState('uploading');
      // Upload to Pinata
      const uri = await uploadToPinata(metadata);
      setTokenURI(uri);

      setState('minting');
      // Mint the badge
      const contractAddress = process.env.NEXT_PUBLIC_BADGE_CONTRACT_ADDRESS;
      if (!contractAddress) {
        throw new Error('Contract address not configured');
      }

      if (!account) {
        throw new Error('No account connected');
      }

      const hash = await mintBadge(contractAddress, account, uri, domain);
      setTxHash(hash);

      // Insert into database
      await insertOwnedNFT(
        userId,
        0, // Token ID will be updated by contract
        domain,
        uri,
        hash,
        score,
        totalQuestions
      );

      setState('success');
      onSuccess(hash);
    } catch (err: any) {
      console.error('[Mint] Failed to mint:', err);
      setError(err.message || 'Failed to mint badge');
      setState('error');
    }
  };

  const isLoading = state === 'connecting' || state === 'generating' || state === 'uploading' || state === 'minting';
  const contractAddress = process.env.NEXT_PUBLIC_BADGE_CONTRACT_ADDRESS;
  const etherscanUrl = `${process.env.NEXT_PUBLIC_ETHERSCAN_BASE_URL}/tx/${txHash}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-card border border-border rounded-lg p-6 md:max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="mb-6 flex items-center justify-between border-b border-border pb-4">
          <div>
            <h2 className="text-xl font-bold text-foreground-primary">Mint {domainConfig.name} Badge</h2>
            <p className="text-sm text-foreground-secondary">
              Score: {score}/{totalQuestions} ({Math.round((score / totalQuestions) * 100)}%)
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-foreground-secondary hover:text-foreground-primary"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* State Content */}
        {state === 'confirmation' && (
          <div className="space-y-6">
            <div className="text-center">
              <div className="mb-4 text-6xl">🎓</div>
              <p className="text-foreground-secondary">
                Ready to mint your {domainConfig.name} badge? This will be a permanent proof of your knowledge!
              </p>
            </div>

            {!account ? (
              <button
                onClick={handleConnectWallet}
                className="w-full rounded-lg bg-primary px-6 py-3 text-white hover:bg-primary/90"
              >
                Connect Wallet
              </button>
            ) : (
              <div className="space-y-4">
                <div className="rounded-lg border border-border p-4">
                  <p className="text-sm text-foreground-secondary mb-2">Connected Address:</p>
                  <p className="font-mono text-sm text-foreground-primary break-all">{account}</p>
                </div>
                <button
                  onClick={handleMint}
                  className="w-full rounded-lg bg-primary px-6 py-3 text-white hover:bg-primary/90"
                >
                  Mint Badge
                </button>
              </div>
            )}
          </div>
        )}

        {isLoading && (
          <div className="space-y-6">
            <div className="flex items-center justify-center">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
            <div className="text-center">
              {state === 'connecting' && <p className="text-foreground-secondary">Connecting to MetaMask...</p>}
              {state === 'generating' && <p className="text-foreground-secondary">Generating badge metadata...</p>}
              {state === 'uploading' && <p className="text-foreground-secondary">Uploading to IPFS...</p>}
              {state === 'minting' && <p className="text-foreground-secondary">Minting badge on Base Sepolia...</p>}
            </div>
          </div>
        )}

        {state === 'success' && (
          <div className="space-y-6">
            <div className="flex flex-col items-center">
              <CheckCircle className="mb-4 h-16 w-16 text-green-500" />
              <h3 className="mb-2 text-2xl font-bold text-foreground-primary">Badge Minted!</h3>
              <p className="text-center text-foreground-secondary">
                Your {domainConfig.name} badge has been successfully minted on Base Sepolia.
              </p>
            </div>

            {txHash && (
              <div className="rounded-lg border border-green-500 bg-green-500/10 p-4">
                <div className="mb-2 flex items-center gap-2">
                  <span className="font-bold text-green-500">Transaction Hash:</span>
                  <a
                    href={etherscanUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-green-500 hover:underline"
                  >
                    View on Etherscan <ExternalLink className="inline h-3 w-3" />
                  </a>
                </div>
                <p className="break-all font-mono text-xs text-foreground-primary">{txHash}</p>
              </div>
            )}

            <button
              onClick={onClose}
              className="w-full rounded-lg bg-primary px-6 py-3 text-white hover:bg-primary/90"
            >
              Close
            </button>
          </div>
        )}

        {state === 'error' && (
          <div className="space-y-6">
            <div className="rounded-lg border border-red-500 bg-red-500/10 p-4">
              <h3 className="mb-2 font-bold text-red-500">Error</h3>
              <p className="text-sm text-foreground-primary">{error}</p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setState('confirmation')}
                className="flex-1 rounded-lg border border-border px-6 py-3 hover:bg-primary/10"
              >
                Retry
              </button>
              <button
                onClick={onClose}
                className="flex-1 rounded-lg bg-primary px-6 py-3 text-white hover:bg-primary/90"
              >
                Close
              </button>
            </div>
          </div>
        )}

        {badgeMetadata && state === 'confirmation' && (
          <div className="mt-6 rounded-lg border border-border bg-background-primary p-4">
            <p className="mb-2 text-sm font-bold text-foreground-primary">Badge Preview:</p>
            <pre className="max-h-48 overflow-auto rounded bg-background p-2 text-xs text-foreground-secondary">
              {JSON.stringify(badgeMetadata, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}

