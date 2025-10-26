"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import BadgeGrid from "./badge-grid";

const logos = [
  { name: "Block", src: "https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/test-clones/12267d59-ceea-426a-953d-bd57056562b2-workers-cloudflare-com/assets/icons/block-4.png" },
  { name: "Anthropic", src: "https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/test-clones/12267d59-ceea-426a-953d-bd57056562b2-workers-cloudflare-com/assets/icons/anthropic-1.png" },
  { name: "Asana", src: "https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/test-clones/12267d59-ceea-426a-953d-bd57056562b2-workers-cloudflare-com/assets/icons/asana-2.png" },
  { name: "Atlassian", src: "https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/test-clones/12267d59-ceea-426a-953d-bd57056562b2-workers-cloudflare-com/assets/icons/atlassian-3.png" },
  { name: "Canva", src: "https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/test-clones/12267d59-ceea-426a-953d-bd57056562b2-workers-cloudflare-com/assets/icons/canva-5.png" },
  { name: "CoreWeave", src: "https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/test-clones/12267d59-ceea-426a-953d-bd57056562b2-workers-cloudflare-com/assets/images/coreweave-1.png" },
  { name: "DoorDash", src: "https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/test-clones/12267d59-ceea-426a-953d-bd57056562b2-workers-cloudflare-com/assets/icons/doordash-6.png" },
  { name: "Intercom", src: "https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/test-clones/12267d59-ceea-426a-953d-bd57056562b2-workers-cloudflare-com/assets/icons/intercom-7.png" },
  { name: "Leonardo", src: "https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/test-clones/12267d59-ceea-426a-953d-bd57056562b2-workers-cloudflare-com/assets/images/leonardo-2.png" },
  { name: "MLB", src: "https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/test-clones/12267d59-ceea-426a-953d-bd57056562b2-workers-cloudflare-com/assets/images/mlb-3.png" },
  { name: "PayPal", src: "https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/test-clones/12267d59-ceea-426a-953d-bd57056562b2-workers-cloudflare-com/assets/images/paypal-4.png" },
  { name: "Porsche", src: "https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/test-clones/12267d59-ceea-426a-953d-bd57056562b2-workers-cloudflare-com/assets/images/porsche-5.png" },
  { name: "Shopify", src: "https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/test-clones/12267d59-ceea-426a-953d-bd57056562b2-workers-cloudflare-com/assets/images/shopify-6.png" },
  { name: "Signal", src: "https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/test-clones/12267d59-ceea-426a-953d-bd57056562b2-workers-cloudflare-com/assets/icons/signal-8.png" },
  { name: "Stripe", src: "https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/test-clones/12267d59-ceea-426a-953d-bd57056562b2-workers-cloudflare-com/assets/icons/stripe-9.png" },
  { name: "VSCO", src: "https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/test-clones/12267d59-ceea-426a-953d-bd57056562b2-workers-cloudflare-com/assets/images/vsco-7.png" },
  { name: "Wix", src: "https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/test-clones/12267d59-ceea-426a-953d-bd57056562b2-workers-cloudflare-com/assets/images/wix-8.png" },
];

const TrustedCompanies = () => {
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const supabase = getSupabaseBrowserClient();
        if (supabase) {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            setUserId(user.id);
          }
        }
      } catch (error) {
        console.error("[TrustedCompanies] Auth check failed:", error);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  return (
    <>
      <style>
        {`
          @keyframes scroll {
            from { transform: translateX(0); }
            to { transform: translateX(-50%); }
          }
           .animate-scroll {
            animation: scroll 60s linear infinite;
          }
        `}
      </style>
      <section className="bg-background-primary py-16 md:py-24">
        <div className="container mx-auto flex flex-col items-center text-center">
          <h3 className="text-4xl font-semibold leading-tight -tracking-[0.01em] text-foreground-primary text-balance md:text-5xl">
            Join learners building<br />their knowledge graphs
          </h3>
          <p className="mt-4 text-balance text-lg text-foreground-secondary md:text-xl">
            Trusted by learners worldwide. Start your journey today...
          </p>
        </div>

        {!loading && userId ? (
          <BadgeGrid userId={userId} />
        ) : (
          <div className="group relative mt-16 h-8 w-full overflow-hidden [mask-image:linear-gradient(to_right,transparent,white_10%,white_90%,transparent)]">
            <div className="flex w-max animate-scroll group-hover:[animation-play-state:paused]">
              {[...logos, ...logos].map((logo, index) => (
                <div key={index} className="mx-8 flex h-8 flex-shrink-0 items-center justify-center">
                  <Image
                    src={logo.src}
                    alt={`${logo.name} logo`}
                    width={150}
                    height={32}
                    className="max-h-full w-auto object-contain grayscale opacity-60 transition-all duration-300 hover:grayscale-0 hover:opacity-100"
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </>
  );
};

export default TrustedCompanies;