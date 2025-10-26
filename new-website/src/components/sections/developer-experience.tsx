import { Cloud, Github, InfinityIcon } from 'lucide-react';

const DeveloperExperienceSection = (): JSX.Element => {
  return (
    <section className="bg-background-primary py-16 md:py-24">
      <div className="container mx-auto px-4 xl:px-0">
        <div className="mx-auto max-w-3xl text-center mb-12 md:mb-16">
          <h3 className="text-4xl md:text-[48px] font-semibold leading-tight tracking-[-0.01em] text-foreground-primary">
            Tailored to your working style
          </h3>
          <p className="mt-4 text-lg md:text-xl text-foreground-secondary">
            Always simple, fast, and reliable.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-6xl mx-auto">
          <div className="bg-primary text-primary-foreground p-8 md:p-10 rounded-xl flex flex-col">
            <div className="relative w-12 h-12 mb-6">
              <Cloud
                className="absolute inset-0 w-full h-full text-white"
                strokeWidth={1.5}
              />
              <Github className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-foreground-primary fill-current" />
            </div>
            <h5 className="text-lg md:text-[22px] font-semibold text-white">
              Fits into your existing workflows
            </h5>
            <p className="mt-2 text-base text-white/80">
              Git, GitHub Actions, VS Code, and any framework. No proprietary
              tools or vendor lock-in.
            </p>
          </div>

          <div className="bg-background-secondary border border-border-light p-8 md:p-10 rounded-xl">
            <h5 className="text-lg md:text-[22px] font-semibold text-foreground-primary">
              Instant feedback loops
            </h5>
            <p className="mt-2 text-base text-foreground-secondary">
              Our smart network positions your workloads optimally — close to
              users, close to data.
            </p>
          </div>

          <div className="bg-background-secondary border border-border-light p-8 md:p-10 rounded-xl">
            <div className="w-12 h-12 mb-6 flex items-center justify-center rounded-lg bg-accent">
              <InfinityIcon className="w-8 h-8 text-primary" />
            </div>
            <h5 className="text-lg md:text-[22px] font-semibold text-foreground-primary">
              Observable by default
            </h5>
            <p className="mt-2 text-base text-foreground-secondary">
              Built-in logs, metrics, and tracing. Understand your application's
              performance without setting up monitoring infrastructure.
            </p>
          </div>

          <div className="bg-background-secondary border border-border-light p-8 md:p-10 rounded-xl flex flex-col">
            <div className="bg-code-background p-4 rounded-md mb-6 flex-grow text-sm">
              <div className="text-xs text-foreground-tertiary mb-3 font-mono">
                /ide.tsx
              </div>
              <pre className="text-code leading-relaxed">
                <code>
                  <span className="text-primary">import</span> {'{'} Code {'}'}{' '}
                  <span className="text-primary">from</span>{' '}
                  <span className="text-chart-1">"@/components/shared/"</span>;
                  <br />
                  <span className="text-primary">import</span> {'{'} Icon {'}'}{' '}
                  <span className="text-primary">from</span>{' '}
                  <span className="text-chart-1">"@/components/ui"</span>;
                  <br />
                  <span className="text-primary">import</span> {'{'} useDarkTheme {'}'}{' '}
                  <span className="text-primary">from</span>{' '}
                  <span className="text-chart-1">"@/themes/min"</span>;
                  <br />
                  <br />
                  <span className="text-purple-600">export const</span>{' '}
                  <span className="text-blue-500">IDE</span> = () =&gt; {'{'}
                  <br />
                  &nbsp;&nbsp;<span className="text-purple-600">const</span> [
                  <span className="text-blue-500">activeTab</span>,{' '}
                  <span className="text-blue-500">setActiveTab</span>] ={' '}
                  <span className="text-blue-500">useState</span>();
                  <br />
                  &nbsp;&nbsp;<span className="text-purple-600">const</span> [
                  <span className="text-blue-500">isHovering</span>,{' '}
                  <span className="text-blue-500">setIsHovering</span>] ={' '}
                  <span className="text-blue-500">useState</span>();
                  <br />
                  {'}'};
                </code>
              </pre>
            </div>
            <h5 className="text-lg md:text-[22px] font-semibold text-foreground-primary">
              Compatible with your stack
            </h5>
            <p className="mt-2 text-base text-foreground-secondary">
              Use the languages and frameworks you know — JS, TS, Python, Rust,
              React, and more. This project of fluent works with your existing databases,
              APIs, and services.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DeveloperExperienceSection;