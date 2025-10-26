"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  Twitter,
  Linkedin,
  Share2,
  Download,
  Copy,
  Check,
  Eye,
  Download as DownloadIcon,
  Link2,
  Code,
  Globe,
  Lock,
} from "lucide-react";
import { BadgeData } from "@/lib/graphStorage";
import { DomainConfig } from "@/lib/domain-config";
import { generateBadgeImage, downloadBadgeImage, downloadCertificatePDF } from "@/lib/badgeImageGenerator";
import { generateQRCodeWithLogo, downloadQRCodePNG, generateVerificationUrl } from "@/lib/qrCodeGenerator";
import {
  shareToTwitter,
  shareToLinkedIn,
  shareViaEmail,
  copyShareLink,
  copyEmbedCode,
  trackShare,
  SharePlatform,
  toggleBadgePrivacy,
} from "@/lib/shareService";
import confetti from "canvas-confetti";

interface ShareModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  badge: BadgeData;
  domainConfig: DomainConfig;
  userId: string;
}

type ImageFormat = 'square' | 'story' | 'certificate';
type ImageSize = '512' | '1080' | '2048';

export function ShareModal({ open, onOpenChange, badge, domainConfig, userId }: ShareModalProps) {
  const [activeTab, setActiveTab] = useState<'share' | 'download' | 'link'>('share');
  const [imageFormat, setImageFormat] = useState<ImageFormat>('square');
  const [imageSize, setImageSize] = useState<ImageSize>('1080');
  const [copied, setCopied] = useState<string | null>(null);
  const [isPublic, setIsPublic] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  const verificationUrl = generateVerificationUrl(badge.token_id);

  const handleCopy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(label);
      setTimeout(() => setCopied(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleShare = async (platform: SharePlatform, url: string) => {
    await trackShare(badge.id, platform);
    window.open(url, '_blank', 'noopener,noreferrer');
    
    // Trigger confetti animation
    confetti({
      particleCount: 50,
      spread: 70,
      origin: { y: 0.6 }
    });
  };

  const handleDownload = async (type: 'png' | 'pdf') => {
    setIsGenerating(true);
    
    try {
      const options = {
        domainConfig,
        score: badge.score,
        nodeCount: badge.node_count,
        tokenId: badge.token_id,
        mintedAt: badge.minted_at,
        size: parseInt(imageSize) as any,
        format: imageFormat,
        includeQR: true,
        qrData: verificationUrl,
      };

      if (type === 'png') {
        await downloadBadgeImage(options, `fluent-${domainConfig.name.toLowerCase()}-badge-${imageSize}x${imageSize}.png`);
      } else {
        await downloadCertificatePDF(options, `fluent-${domainConfig.name.toLowerCase()}-certificate.pdf`);
      }

      // Trigger confetti
      confetti({
        particleCount: 30,
        spread: 50,
        origin: { y: 0.8 }
      });
    } catch (error) {
      console.error('Failed to download badge:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleTogglePrivacy = async () => {
    try {
      await toggleBadgePrivacy(badge.id, !isPublic);
      setIsPublic(!isPublic);
    } catch (error) {
      console.error('Failed to toggle privacy:', error);
    }
  };

  const handleSocialShare = async (platform: SharePlatform) => {
    let url = '';
    
    switch (platform) {
      case 'twitter':
        url = shareToTwitter({ badge, domainConfig, platform: 'twitter' });
        break;
      case 'linkedin':
        url = shareToLinkedIn({ badge, domainConfig, platform: 'linkedin' });
        break;
      case 'email':
        url = shareViaEmail({ badge, domainConfig, platform: 'email' });
        break;
      default:
        return;
    }

    await handleShare(platform, url);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-[900px] max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Share Badge
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="share">Social Media</TabsTrigger>
            <TabsTrigger value="download">Download</TabsTrigger>
            <TabsTrigger value="link">Link & Embed</TabsTrigger>
          </TabsList>

          {/* Share Tab */}
          <TabsContent value="share" className="space-y-4 mt-6">
            <div className="grid grid-cols-2 gap-4">
              <Button
                onClick={() => handleSocialShare('twitter')}
                className="h-16 flex-col gap-2 bg-black hover:bg-gray-800 text-white"
              >
                <Twitter className="h-6 w-6" />
                <span>Share on X</span>
              </Button>

              <Button
                onClick={() => handleSocialShare('linkedin')}
                className="h-16 flex-col gap-2 bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Linkedin className="h-6 w-6" />
                <span>Share on LinkedIn</span>
              </Button>

              <Button
                onClick={() => handleSocialShare('email')}
                className="h-16 flex-col gap-2"
                variant="outline"
              >
                <Link2 className="h-6 w-6" />
                <span>Share via Email</span>
              </Button>

              <Button
                onClick={() => handleSocialShare('link')}
                className="h-16 flex-col gap-2"
                variant="outline"
              >
                <Globe className="h-6 w-6" />
                <span>Copy Link</span>
              </Button>
            </div>

            <Separator />

            {/* Privacy Toggle */}
            <div className="flex items-center justify-between p-4 rounded-lg border">
              <div className="flex items-center gap-3">
                {isPublic ? <Globe className="h-5 w-5 text-green-500" /> : <Lock className="h-5 w-5 text-gray-500" />}
                <div>
                  <p className="font-medium">Badge Visibility</p>
                  <p className="text-sm text-muted-foreground">
                    {isPublic ? 'Public - Anyone can view this badge' : 'Private - Only you can view this badge'}
                  </p>
                </div>
              </div>
              <Button onClick={handleTogglePrivacy} variant="outline" size="sm">
                {isPublic ? 'Make Private' : 'Make Public'}
              </Button>
            </div>
          </TabsContent>

          {/* Download Tab */}
          <TabsContent value="download" className="space-y-4 mt-6">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Image Format</label>
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    variant={imageFormat === 'square' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setImageFormat('square')}
                  >
                    Square
                  </Button>
                  <Button
                    variant={imageFormat === 'story' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setImageFormat('story')}
                  >
                    Story
                  </Button>
                  <Button
                    variant={imageFormat === 'certificate' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setImageFormat('certificate')}
                  >
                    Certificate
                  </Button>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Image Size</label>
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    variant={imageSize === '512' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setImageSize('512')}
                  >
                    512x512
                  </Button>
                  <Button
                    variant={imageSize === '1080' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setImageSize('1080')}
                  >
                    1080x1080
                  </Button>
                  <Button
                    variant={imageSize === '2048' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setImageSize('2048')}
                  >
                    2048x2048
                  </Button>
                </div>
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-4">
              <Button
                onClick={() => handleDownload('png')}
                disabled={isGenerating}
                className="h-16 flex-col gap-2"
              >
                <Download className="h-6 w-6" />
                <span>Download PNG</span>
              </Button>

              <Button
                onClick={() => handleDownload('pdf')}
                disabled={isGenerating}
                className="h-16 flex-col gap-2"
                variant="outline"
              >
                <DownloadIcon className="h-6 w-6" />
                <span>Download Certificate</span>
              </Button>
            </div>

            {isGenerating && (
              <p className="text-sm text-center text-muted-foreground">
                Generating image...
              </p>
            )}
          </TabsContent>

          {/* Link & Embed Tab */}
          <TabsContent value="link" className="space-y-4 mt-6">
            {/* Public URL */}
            <div className="p-4 rounded-lg border space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Public Badge URL</label>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleCopy(verificationUrl, 'url')}
                >
                  {copied === 'url' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <code className="block text-xs bg-muted p-2 rounded break-all">
                {verificationUrl}
              </code>
            </div>

            {/* Embed Code */}
            <div className="p-4 rounded-lg border space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Embed Code</label>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    const embedCode = `<iframe src="${verificationUrl}" width="300" height="300" frameborder="0"></iframe>`;
                    handleCopy(embedCode, 'embed');
                  }}
                >
                  {copied === 'embed' ? <Check className="h-4 w-4" /> : <Code className="h-4 w-4" />}
                </Button>
              </div>
              <code className="block text-xs bg-muted p-2 rounded break-all">
                {`<iframe src="${verificationUrl}" width="300" height="300" frameborder="0"></iframe>`}
              </code>
            </div>

            {/* QR Code Download */}
            <div className="p-4 rounded-lg border">
              <Button
                onClick={async () => {
                  const qrDataUrl = await generateQRCodeWithLogo({
                    data: verificationUrl,
                    size: 200,
                  });
                  
                  const link = document.createElement('a');
                  link.download = 'fluent-badge-qr.png';
                  link.href = qrDataUrl;
                  link.click();
                }}
                className="w-full"
                variant="outline"
              >
                <Download className="h-4 w-4 mr-2" />
                Download QR Code
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

