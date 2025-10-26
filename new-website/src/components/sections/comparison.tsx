import { AlertTriangle, CheckCircle } from "lucide-react";

const ComparisonSection = () => {
  const highLatencyCards = [
    {
      p: "P0",
      title: "High Latency!!!!!!",
      details: "~150–250ms RTT per request",
    },
    {
      p: "P0",
      title: "High Latency!!!!!!",
      details: "~150–250ms RTT per request",
    },
    {
      p: "P0",
      title: "High Latency!!!!!!",
      details: "~150–250ms RTT per request",
    },
  ];

  const bandwidthAlerts = [
    {
      title: "Bandwidth usage alert",
      details: "You have exceeded your bandwidth limit for the month.",
    },
    {
      title: "Bandwidth usage alert",
      details: "You have exceeded your bandwidth limit for the month.",
    },
  ];

  return (
    <section
      id="home-developer-choice"
      className="relative z-10 mx-auto w-full max-w-[1216px] px-4 py-16 md:py-24"
    >
      <div className="mb-12 flex flex-col items-center justify-center text-center md:mb-16">
        <h3 className="text-4xl font-semibold text-foreground-primary/50 md:text-5xl">
          Why learners choose Fluent
        </h3>
        <p className="text-body-lg mt-4 text-balance text-foreground-secondary">
          Everything needed to master Web3 knowledge efficiently.
        </p>
      </div>

      <div className="grid grid-cols-1 overflow-hidden rounded-2xl border border-border-light md:grid-cols-2">
        {/* Left Panel: Fighting infra */}
        <div className="relative flex flex-col items-start gap-4 bg-background-secondary p-6 md:p-8">
          <h3 className="text-4xl font-semibold leading-tight text-foreground-primary">
            Learning the <br /> old way
          </h3>

          <div className="w-full rotate-[-1deg] rounded-lg border border-destructive/10 bg-destructive/5 p-3 text-sm text-foreground-primary">
            "I read this article weeks ago about Uniswap... where did I save it? And how did it relate to that other concept?"
          </div>

          <div className="relative z-0 w-full rounded-lg border border-destructive/20 bg-background-primary p-3">
            <h5 className="flex items-center gap-2 font-bold text-destructive">
              <AlertTriangle className="size-4" />
              STATUS: KNOWLEDGE LOST
            </h5>
            <div className="mt-1 flex flex-wrap gap-x-2 gap-y-0 text-sm leading-none text-foreground-primary/50">
              <span>48 Open browser tabs</span>
              <span>200+ bookmarks</span>
            </div>
          </div>

          <div className="grid w-full grid-cols-2 gap-2 md:grid-cols-3">
            {highLatencyCards.map((card, i) => (
              <div
                key={i}
                className="space-y-1 rounded-lg border border-destructive/20 bg-background-primary p-3 text-sm"
              >
                <span className="inline-block rounded bg-destructive px-1 text-xs font-bold text-destructive-foreground">
                  {card.p}
                </span>
                <p className="font-semibold text-foreground-primary">{card.title}</p>
                <p className="text-foreground-primary/50">{card.details}</p>
              </div>
            ))}
          </div>

          <div className="w-full rotate-[0.5deg] rounded-lg border border-destructive/10 bg-destructive/5 p-3 text-sm text-foreground-primary">
            "Wait, did I understand this correctly? Let me search through my notes... which document was it in?"
          </div>

          <div className="grid w-full grid-cols-2 gap-2">
            {bandwidthAlerts.map((alert, i) => (
              <div
                key={i}
                className="flex items-start gap-2 rounded-lg border border-destructive/10 bg-destructive/5 p-3 text-sm leading-tight"
              >
                <AlertTriangle
                  className="size-5 flex-shrink-0 text-orange-400"
                  fill="currentColor"
                  aria-hidden="true"
                />
                <span className="text-foreground-primary">
                  <span className="font-bold">{alert.title}</span>
                  <br />
                  {alert.details}
                </span>
              </div>
            ))}
          </div>

          <div className="w-full rotate-[-0.75deg] rounded-lg border border-destructive/10 bg-destructive/5 p-3 text-sm">
            <span className="font-medium text-foreground-secondary">Manual Notes</span>
            <br />
            <span className="text-foreground-primary">"I know I learned about this somewhere, but I can't find it now."</span>
          </div>
        </div>

        {/* Right Panel: Learning with Fluent */}
        <div className="relative flex flex-col bg-primary p-6 text-primary-foreground md:p-8">
          <h3 className="text-4xl font-semibold leading-tight text-primary-foreground">
            Learning with<br />Fluent
          </h3>
          <svg
            className="absolute left-[-1px] top-[68%] z-0 h-px w-1/2"
            aria-hidden="true"
          >
            <line
              x1="0"
              y1="0.5"
              x2="100%"
              y2="0.5"
              strokeWidth="1"
              strokeDasharray="2 2"
              className="stroke-primary-foreground/30"
            />
          </svg>
          <div className="mt-auto ml-auto w-fit rotate-[-1deg] rounded-xl bg-white/10 p-3 text-sm font-medium backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <CheckCircle className="size-5 text-green-400" aria-hidden="true" />
              Pushed 15 new updates today
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ComparisonSection;