import React from 'react';

const HeroSection = () => {
  return (
    <>
      <section id="home-hero" className="relative z-10 bg-background md:px-2">
        <div className="relative h-full w-full md:pb-3">
          {/* Desktop Corner Line */}
          <div className="corner-lines-container">
            <svg
              className="absolute bottom-0 left-1/2 h-px w-[200dvw] -translate-x-1/2 hidden md:block"
              style={{ stroke: 'rgba(255, 255, 255, 0.1)', opacity: 1, transition: 'opacity 2000ms ease-out' }}
            >
              <line x1="0" y1="0" x2="100%" y2="0" strokeWidth="1" />
            </svg>
          </div>
          <div className="mx-auto w-full max-w-[1480px] pt-2">
            <div className="bg-primary flex items-center justify-center relative overflow-hidden border-b border-border md:rounded-2xl md:border-0 min-h-[640px] md:min-h-[720px] pt-12">
              <div
                data-id="canvas"
                data-us-project="hKMQx3xwg1G1DMk0IUfA"
                data-us-production="true"
                className="absolute inset-0 w-full h-full min-h-[800px] min-w-[1080px] m-auto z-0"
                style={{
                  maskImage: 'radial-gradient(ellipse at 50% 100%, black 80%, transparent)',
                }}
              >
                <canvas
                  width="2220"
                  height="1200"
                  aria-label="Unicorn Studio Scene"
                  role="img"
                  className="w-full h-full"
                ></canvas>
              </div>

              <div className="relative z-10 flex h-full flex-col items-center justify-center gap-10 overflow-hidden px-2 py-6 text-center md:p-8 lg:p-12 xl:p-16">
                <div className="relative flex h-full flex-col items-center justify-center gap-10">
                  <h1 className="text-primary-foreground max-w-[1080px] text-balance">
                    Everything we learned from powering 20% of the Internet—yours by default
                  </h1>
                  <div className="flex flex-col items-center">
                    <h5 className="text-primary-foreground opacity-90 max-w-[700px] leading-[1.2em] font-semibold">
                      This project of fluent is your AI Cloud with compute, AI inference, and storage — letting you ship applications instead of managing infrastructure.
                    </h5>
                  </div>
                  <a
                    href="#"
                    className="relative inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap font-medium transition-all ease-out duration-200 rounded-full bg-background text-accent-foreground active:scale-[0.98] px-6 py-3 mt-4 text-lg"
                  >
                    Start building
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-0 -mt-0.5 flex w-full max-w-screen flex-col overflow-hidden md:hidden">
        <svg className="absolute top-0 left-1/2 h-px w-[200dvw] -translate-x-1/2 stroke-border opacity-5">
          <line x1="0" y1="0" x2="100%" y2="0" />
        </svg>
        <div className="relative mb-2 h-20 w-full"></div>
        <svg className="absolute -bottom-0 left-1/2 h-px w-[200dvw] -translate-x-1/2 stroke-border opacity-5">
          <line x1="0" y1="0" x2="100%" y2="0" />
        </svg>
      </section>
    </>
  );
};

export default HeroSection;