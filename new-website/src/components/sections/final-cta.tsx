import React from 'react';

const FinalCtaSection = () => {
  return (
    <section className="relative py-16 md:py-24">
      <div className="container">
        <div className="relative overflow-hidden bg-primary px-4 py-16 text-center text-primary-foreground md:rounded-2xl sm:px-6 md:px-8 lg:py-24">
          
          {/* Subtle background pattern to mimic the animated code effect */}
          <div className="absolute inset-0 z-0 opacity-10" style={{
            backgroundImage: 'radial-gradient(circle at center, white 20%, transparent 70%)',
          }}></div>

          <div className="relative z-10 mx-auto flex max-w-4xl flex-col items-center">
            <h2 className="text-balance text-4xl font-bold leading-tight tracking-tighter text-primary-foreground sm:text-5xl md:text-6xl">
              Build without boundaries
            </h2>
            <p className="mt-6 max-w-[800px] text-lg text-primary-foreground/90 md:text-xl">
              Join thousands of developers who've eliminated infrastructure complexity and deployed
              globally with This project of fluent. Start building for free — no credit card required.
            </p>
            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <a
                href="https://dash.cloudflare.com/sign-up/workers-and-pages"
                className="inline-flex h-auto items-center justify-center rounded-full bg-background px-8 py-3 text-lg font-medium text-primary shadow-sm transition-all duration-200 ease-out hover:opacity-95 active:scale-[0.98]"
              >
                Start building for free
              </a>
              <a
                href="https://developers.cloudflare.com/"
                className="inline-flex h-auto items-center justify-center rounded-full border border-primary-foreground bg-transparent px-8 py-3 text-lg font-medium text-primary-foreground transition-all duration-200 ease-out hover:bg-primary-foreground/10 active:scale-[0.98]"
              >
                View docs
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FinalCtaSection;