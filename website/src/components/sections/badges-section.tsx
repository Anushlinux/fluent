'use client';

import { useState, useEffect } from 'react';
import BadgeGrid from '@/components/sections/badge-grid';
import { getSupabaseBrowserClient } from '@/lib/supabase';
import { Trophy } from 'lucide-react';

export default function BadgesSection() {
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = getSupabaseBrowserClient();

  useEffect(() => {
    const checkAuth = async () => {
      if (supabase) {
        const { data: { user } } = await supabase.auth.getUser();
        setUserId(user?.id || null);
      }
      setLoading(false);
    };

    checkAuth();

    if (supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        setUserId(session?.user?.id || null);
      });

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [supabase]);

  if (loading || !userId) {
    return (
      <section id="badges" className="relative bg-background-primary py-16 md:py-24">
        <div className="container relative z-10 mx-auto flex max-w-[1216px] flex-col items-center gap-12 px-4 md:gap-20 xl:px-0">
          <div className="mx-auto flex max-w-[640px] flex-col items-center text-center">
            <h3 className="text-4xl font-semibold -tracking-[0.01em] text-foreground-primary md:text-5xl">
              Your Mastery Badges
            </h3>
            <p className="mt-4 max-w-[500px] text-lg text-foreground-secondary md:text-xl">
              Showcase your domain expertise through soulbound NFT badges
            </p>
          </div>
          {!userId && (
            <div className="w-full max-w-md">
              <div className="bg-background border border-border rounded-lg p-12 text-center">
                <Trophy className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h4 className="text-lg font-semibold text-foreground-primary mb-2">
                  Sign In to View Your Badges
                </h4>
                <p className="text-body text-foreground-primary/70">
                  Sign in to see your earned mastery badges
                </p>
              </div>
            </div>
          )}
        </div>
      </section>
    );
  }

  return (
    <section id="badges" className="relative bg-background-primary py-16 md:py-24">
      <div className="container relative z-10 mx-auto flex max-w-[1216px] flex-col gap-12 px-4 md:gap-20 xl:px-0">
        <div className="mx-auto flex max-w-[640px] flex-col items-center text-center">
          <h3 className="text-4xl font-semibold -tracking-[0.01em] text-foreground-primary md:text-5xl">
            Your Mastery Badges
          </h3>
          <p className="mt-4 max-w-[500px] text-lg text-foreground-secondary md:text-xl">
            Showcase your domain expertise through soulbound NFT badges earned by passing quizzes
          </p>
        </div>
        <BadgeGrid userId={userId} />
      </div>
    </section>
  );
}

