import React from 'react';
import Dither from '../Dither';

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
            <div className="bg-primary flex items-center justify-center relative overflow-hidden border-b border-border md:rounded-2xl md:border-0 min-h-[640px] md:min-h-[720px]">
              {/* Dither Animation Overlay */}
              <div className="absolute inset-0 w-full h-full z-0">
                <Dither
                  waveColor={[1.0, 0.5, 0.2]}
                  disableAnimation={false}
                  enableMouseInteraction={true}
                  mouseRadius={0.3}
                  colorNum={4}
                  waveAmplitude={0.3}
                  waveFrequency={3}
                  waveSpeed={0.05}
                />
              </div>

              {/* Content Overlay */}
              <div className="relative z-10 flex h-full w-full flex-col items-center justify-center gap-10 overflow-hidden px-2 py-6 text-center pt-12 md:p-8 lg:p-12 xl:p-16">
                <div className="relative flex h-full flex-col items-center justify-center gap-10">
                  <h1 className="text-primary-foreground max-w-[1080px] text-balance">
                    Transform your Web3 learning into a powerful knowledge graph
                  </h1>
                  <div className="flex flex-col items-center">
                    <h5 className="text-primary-foreground opacity-90 max-w-[700px] leading-[1.2em] font-semibold">
                      Capture what you learn, visualize connections, and master concepts with AI-powered insights and adaptive quizzes.
                    </h5>
                  </div>
                  <a
                    href="#"
                    className="relative inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap font-medium transition-all ease-out duration-200 rounded-full bg-background text-accent-foreground active:scale-[0.98] px-6 py-3 mt-4 text-lg"
                  >
                    Start building your graph
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