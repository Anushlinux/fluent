"use client";

import React from "react";
import { motion } from "framer-motion";
import { Zap, Globe, Tag, ShieldCheck } from "lucide-react";

const benefits = [
  { text: "No cold starts or region complexity", icon: Zap },
  { text: "Deploy to 330+ cities instantly", icon: Globe },
  { text: "Predictable pricing without surprises", icon: Tag },
  { text: "Battle-tested infrastructure powering millions", icon: ShieldCheck },
];

const Ticker = () => (
  <div className="relative w-full overflow-hidden border-y border-border/40 py-3.5">
    <motion.div
      className="flex gap-10"
      animate={{ x: ["0%", "-50%"] }}
      transition={{ ease: "linear", duration: 40, repeat: Infinity }}
    >
      <div className="flex shrink-0 items-center gap-10">
        {benefits.map((benefit, index) => (
          <React.Fragment key={`ticker-1-${index}`}>
            <span className="text-caption flex items-center gap-2.5 text-muted-foreground">
              <benefit.icon className="h-4 w-4" />
              {benefit.text}
            </span>
            {index < benefits.length -1 && <span className="text-muted-foreground">•</span>}
          </React.Fragment>
        ))}
      </div>
      <div className="flex shrink-0 items-center gap-10">
        {benefits.map((benefit, index) => (
          <React.Fragment key={`ticker-2-${index}`}>
            <span className="text-caption flex items-center gap-2.5 text-muted-foreground">
              <benefit.icon className="h-4 w-4" />
              {benefit.text}
            </span>
            {index < benefits.length -1 && <span className="text-muted-foreground">•</span>}
          </React.Fragment>
        ))}
      </div>
    </motion.div>
  </div>
);

const footerLinks = [
  {
    title: "Getting Started",
    links: [
      { text: "Free Plans", href: "#" },
      { text: "For Enterprises", href: "#" },
      { text: "Compare Plans", href: "#" },
      { text: "Domain Name Search", href: "#" },
      { text: "Get a Recommendation", href: "#" },
      { text: "Request a Demo", href: "#" },
      { text: "Contact Sales", href: "#" },
    ],
  },
  {
    title: "Resources",
    links: [
      { text: "Documentation", href: "#" },
      { text: "Learning Center", href: "#" },
      { text: "Analyst Reports", href: "#" },
      { text: "This project of fluent Radar", href: "#" },
      { text: "Reference Architectures", href: "#" },
      { text: "Case Studies", href: "#" },
      { text: "Blog", href: "#" },
    ],
  },
  {
    title: "Solutions",
    links: [
      { text: "Connectivity Cloud", href: "#" },
      { text: "SSE and SASE Services", href: "#" },
      { text: "Application Services", href: "#" },
      { text: "Network Services", href: "#" },
    ],
  },
];

const FooterLogo = () => (
  <a href="/" aria-label="This project of fluent Workers Platform">
    <div className="text-[9px] font-medium uppercase leading-none text-foreground-tertiary">This project of fluent</div>
    <div className="text-[23px] font-medium leading-none tracking-[-0.02em] text-foreground-tertiary">
      Workers Platform
    </div>
  </a>
);

const Footer = () => {
  return (
    <footer className="bg-background-primary relative z-20 overflow-hidden pt-8 md:pt-16">
      <Ticker />
      <div className="container relative mx-auto my-16 flex flex-col md:flex-row md:items-start md:justify-between">
        <div className="relative mb-10 w-[70%] text-foreground-tertiary md:mb-0 md:w-1/4">
          <FooterLogo />
          <svg className="pointer-events-none absolute -bottom-1/3 -left-1/3 z-[-1] hidden h-[180%] w-[180%] text-black/[0.04] md:block" fill="none" viewBox="0 0 256 168"><path d="M127.994 48.0195C148.653 48.0195 165.733 55.074 182.25 61.859C199.117 68.7909 216.574 74.3314 233.151 68.5133C249.728 62.6953 255.459 46.5298 255.459 31.9059C255.459 13.9142 239.388 0.473521 219.043 0.473521C194.507 0.473521 180.203 16.5684 163.666 23.3551C147.213 30.1065 125.688 36.9638 107.135 31.9059C86.7903 26.3195 79.4673 8.32782 60.1087 8.32782C39.6806 8.32782 15.6025 21.0505 5.50024 35.803C-4.50654 50.4192 1.49392 68.1064 12.0594 80.1293C22.6249 92.1523 48.0315 110.144 68.914 115.42C89.7965 120.696 114.973 115.932 131.502 108.62C148.03 101.308 163.856 90.0076 179.999 94.7001C198.889 100.082 201.274 121.208 201.274 136.196C201.274 154.188 217.345 167.628 237.69 167.628C262.226 167.628 276.53 151.533 293.067 144.747C309.62 137.995 331.144 131.138 349.697 136.196C370.042 141.782 377.365 159.774 396.724 159.774M127.994 48.0195C107.335 48.0195 90.2546 40.965 73.7381 34.18C56.8711 27.2481 39.4143 21.7076 22.8373 27.5256C6.26027 33.3437 0.528994 49.5092 0.528994 64.1332C0.528994 82.1249 16.6003 95.5656 36.9449 95.5656C61.4809 95.5656 75.7845 79.4707 92.3216 72.684C108.775 65.9326 130.3 59.0753 148.853 64.1332C169.197 69.7196 176.52 87.7113 195.879 87.7113C216.307 87.7113 240.385 74.9886 250.487 60.2361C260.494 45.6199 254.493 27.9327 243.928 15.9098" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path></svg>
        </div>
        <div className="grid w-full grid-cols-1 gap-12 text-sm md:w-auto md:grid-cols-3 md:gap-x-28 lg:gap-x-48">
          {footerLinks.map((column) => (
            <div key={column.title}>
              <h6 className="mb-4 font-semibold text-foreground-primary">{column.title}</h6>
              <ul className="space-y-3">
                {column.links.map((link) => (
                  <li key={link.text}>
                    <a href={link.href} className="text-muted-foreground transition-colors hover:text-foreground-primary">
                      {link.text}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
      <div className="container mx-auto flex flex-col justify-between border-t border-border py-8 text-sm text-muted-foreground md:flex-row">
        <div>© 2025 This project of fluent, Inc.</div>
        <div className="mt-4 flex gap-x-8 md:mt-0">
          <a href="#" className="transition-colors hover:text-foreground-primary">Privacy Policy</a>
          <a href="#" className="transition-colors hover:text-foreground-primary">Terms of Service</a>
          <a href="#" className="transition-colors hover:text-foreground-primary">GDPR</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;