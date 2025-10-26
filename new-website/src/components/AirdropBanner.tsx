"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Gift, X, Sparkles } from "lucide-react";
import { getUserBadges, type BadgeData } from "@/lib/graphStorage";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";

export function AirdropBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [badgeCount, setBadgeCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkBadges = async () => {
      try {
        const supabase = getSupabaseBrowserClient();
        if (!supabase) {
          setLoading(false);
          return;
        }

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setLoading(false);
          return;
        }

        // Check if dismissed
        const dismissed = localStorage.getItem('airdrop-banner-dismissed');
        if (dismissed === 'true') {
          setLoading(false);
          return;
        }

        // Get badge count
        const badges = await getUserBadges(user.id);
        setBadgeCount(badges.length);

        // Show if user has at least one badge
        if (badges.length > 0) {
          setIsVisible(true);
        }
      } catch (error) {
        console.error("[AirdropBanner] Failed to check badges:", error);
      } finally {
        setLoading(false);
      }
    };

    checkBadges();
  }, []);

  const handleDismiss = () => {
    localStorage.setItem('airdrop-banner-dismissed', 'true');
    setIsVisible(false);
  };

  if (loading || !isVisible || badgeCount === 0) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          transition={{ duration: 0.3 }}
          className="fixed top-20 left-0 right-0 z-50 px-4 md:px-8"
        >
          <div className="relative max-w-4xl mx-auto">
            {/* Background gradient with glass effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-primary/30 to-primary/20 backdrop-blur-lg rounded-2xl border-2 border-primary/30 shadow-2xl" />
            
            {/* Sparkle effects */}
            <div className="absolute top-4 left-8">
              <Sparkles className="h-5 w-5 text-yellow-400 animate-pulse" />
            </div>
            <div className="absolute top-4 right-8">
              <Sparkles className="h-5 w-5 text-yellow-400 animate-pulse" style={{ animationDelay: '1s' }} />
            </div>

            {/* Content */}
            <div className="relative flex items-center justify-between p-4 md:p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 shadow-lg">
                  <Gift className="h-6 w-6 text-white" />
                </div>
                
                <div>
                  <h3 className="text-lg font-bold text-foreground-primary mb-1">
                    You're eligible for airdrops!
                  </h3>
                  <p className="text-sm text-foreground-secondary">
                    {badgeCount} {badgeCount === 1 ? 'badge' : 'badges'} minted • Stay tuned for exclusive rewards
                  </p>
                </div>
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={handleDismiss}
                className="ml-4 hover:bg-white/20"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Bottom border glow */}
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent" />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
