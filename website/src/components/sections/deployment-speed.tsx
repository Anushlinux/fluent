"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { useInView } from "react-intersection-observer";

const AnimatedCounter = ({ value }: { value: number }) => {
  const [count, setCount] = useState(0);
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.5,
  });

  useEffect(() => {
    if (inView) {
      let start = 0;
      const end = value;
      const duration = 1500;
      const stepTime = Math.abs(Math.floor(duration / end));

      const timer = setInterval(() => {
        start += 1;
        setCount(start);
        if (start === end) {
          clearInterval(timer);
        }
      }, stepTime);

      return () => clearInterval(timer);
    }
  }, [inView, value]);

  return (
    <span ref={ref}>
      {count}M
    </span>
  );
};

const DeploymentSpeed = () => {
  return (
    <section
      id="home-deploy-speed"
      className="bg-background-primary relative z-10 px-4 py-16 md:px-0 md:py-24"
    >
      <div className="container mx-auto max-w-[1216px]">
        <div className="mb-12 flex flex-col items-center justify-center text-center md:mb-16">
          <div className="mx-auto flex max-w-[892px] flex-col items-center gap-4">
            <h3 className="text-foreground-primary/90 text-balance font-semibold -tracking-tight text-3xl md:text-5xl lg:leading-[1.1]">
              Go from{" "}
              <span className="bg-gradient-to-r from-[#ff5722] to-[#ffb347] bg-clip-text text-transparent">
                first sentence → knowledge graph
              </span>{" "}
              in seconds
            </h3>
            <p className="text-body-lg text-foreground-secondary text-balance">
              No setup. Automatic connections. AI-powered insights.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
          {/* Column 1 */}
          <div className="flex flex-col gap-2">
            <div className="bg-card border-border-light flex h-full grow flex-col justify-between rounded-lg border p-6 md:p-8">
              <div>
                <h5 className="text-[22px] font-semibold text-foreground-primary">
                  From first sentence to full knowledge graph
                </h5>
                <p className="mt-2 text-body text-foreground-secondary">
                  Capture knowledge effortlessly while browsing or start with empty knowledge 
                  — watch your graph grow with every sentence.
                </p>
              </div>
              <a
                href="#"
                className="group mt-6 flex w-fit items-center text-sm font-medium text-primary"
              >
                Install extension
                <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </a>
            </div>

            <div className="bg-card border-border-light flex grow flex-col rounded-lg border p-6 md:p-8">
              <div className="bg-code-background rounded-md p-4 font-mono text-sm text-foreground-primary">
                <div className="mb-4 flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded-full bg-[#ff5f56]"></span>
                  <span className="h-3 w-3 rounded-full bg-[#ffbd2e]"></span>
                  <span className="h-3 w-3 rounded-full bg-[#27c93f]"></span>
                </div>
                <code className="block">
                  <span className="text-foreground-secondary">
                    Ready to capture! Click to highlight a sentence...
                  </span>
                  <br />
                  <span>
                    Connected nodes: 142
                    <span className="ml-1 inline-block h-4 w-2 translate-y-0.5 animate-pulse bg-foreground-primary"></span>
                  </span>
                </code>
              </div>
              <h5 className="mt-6 text-center text-lg font-semibold text-foreground-primary md:text-xl">
                Your graph grows as you learn
              </h5>
            </div>
          </div>

          {/* Column 2 */}
          <div className="flex flex-col gap-2">
            <div className="bg-code-background text-code relative h-full min-h-[350px] w-full overflow-hidden rounded-lg p-4 font-mono">
              <div className="mb-4 flex items-end border-b border-black/5">
                <div className="flex text-xs font-sans">
                  <button className="rounded-t-md px-3 py-1.5 text-foreground-secondary">
                    multiplayer-cursors.tsx
                  </button>
                  <button className="relative -bottom-px rounded-t-lg border-b-0 bg-card px-3 py-1.5 text-foreground-primary shadow-sm">
                    text-to-image.tsx
                  </button>
                  <button className="rounded-t-md px-3 py-1.5 text-foreground-secondary">
                    hello-world.ts
                  </button>
                </div>
              </div>

               <Image
                src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/test-clones/12267d59-ceea-426a-953d-bd57056562b2-workers-cloudflare-com/assets/images/images_10.png"
                alt="Hello World overlay graphic"
                width={180}
                height={120}
                className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-15"
              />

              <pre className="text-code relative z-10 leading-6">
                <code>
                  <span className="text-orange-600">// Fluent automatically captures and connects</span>{'\n'}
                  <span className="text-purple-600">const</span> <span className="text-blue-500">sentence</span> = <span className="text-green-700">"Uniswap uses AMM for liquidity"</span>;{'\n\n'}
                  <span className="text-orange-600">// Detected terms: Uniswap, AMM, liquidity</span>{'\n'}
                  <span className="text-purple-600">const</span> <span className="text-blue-500">nodes</span> = <span className="text-blue-500">createNodes</span>(sentence);{'\n'}
                  <span className="text-purple-600">const</span> <span className="text-blue-500">edges</span> = <span className="text-blue-500">findConnections</span>(nodes);{'\n\n'}
                  <span className="text-orange-600">// Graph updated in real-time</span>{'\n'}
                  <span className="text-purple-600">return</span> {'{'} nodes, edges {'}'};
                </code>
              </pre>
            </div>

            <div className="bg-card border-border-light relative flex h-full flex-col justify-between overflow-hidden rounded-lg border p-6 md:p-8">
              <Image
                src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/test-clones/12267d59-ceea-426a-953d-bd57056562b2-workers-cloudflare-com/assets/images/images_9.png"
                alt="Scaling graph background"
                layout="fill"
                objectFit="cover"
                className="opacity-20"
              />
              <div className="relative z-10">
                <h5 className="text-[22px] font-semibold text-foreground-primary">
                  Learn freely. We capture it.
                </h5>
                <p className="mt-2 text-body text-foreground-secondary">
                  Your knowledge graph grows organically, connects concepts automatically,
                  and scales with every sentence you capture.
                </p>
              </div>
              <div className="relative z-10 mt-6">
                <p className="text-4xl font-bold text-primary">
                  <AnimatedCounter value={142} />
                </p>
                <p className="text-sm text-foreground-secondary">
                  knowledge nodes connected
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DeploymentSpeed;