'use client';

import { useState, useEffect } from 'react';
import { Link as LinkIcon, Check } from 'lucide-react';
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

// cn utility function (typically in src/lib/utils.ts)
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const CopyLinkButton = () => {
    const [copied, setCopied] = useState(false);
    const [url, setUrl] = useState('');

    useEffect(() => {
        // This runs only on the client, avoiding SSR issues with `window` object.
        setUrl(`${window.location.origin}${window.location.pathname}#home-title-1`);
    }, []);

    const handleCopy = () => {
        if (!url) return;
        navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => {
            setCopied(false);
        }, 2000); // Reset icon after 2 seconds
    };

    return (
        <button
            onClick={handleCopy}
            className={cn(
                "relative -ml-10 inline-flex translate-x-8 cursor-pointer items-center justify-center px-2 py-3 shrink-0",
                "text-foreground-primary/40 opacity-0 transition-all duration-200 ease-out",
                "group-hover:opacity-100 hover:text-foreground-primary/70 active:scale-90"
            )}
            aria-label="Copy link to clipboard"
        >
            <LinkIcon
                className={cn(
                    "size-[1.625rem] select-none transition-all",
                    copied && "scale-0 opacity-0"
                )}
                aria-hidden="true"
            />
            <Check
                className={cn(
                    "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-[1.625rem] select-none transition-all",
                    copied ? "scale-100 opacity-100" : "scale-0 opacity-0"
                )}
                aria-hidden="true"
            />
        </button>
    );
};


const ValueProposition = () => {
    return (
        <section id="home-title-1" className="relative px-4 py-16 md:py-24">
            <div className="flex flex-col items-center justify-center">
                <div className="mx-auto flex max-w-[1080px] flex-col items-center text-center">
                    <h3 className="group text-balance text-foreground-primary">
                        Learning that works for you, not the other way around
                        <CopyLinkButton />
                    </h3>
                    <p className="mt-4 text-balance whitespace-pre-line text-body-lg text-foreground-primary/70">
                        Capture knowledge effortlessly while browsing, build connections automatically with AI, and see your entire learning journey visualized in one powerful graph.
                    </p>
                </div>
            </div>
        </section>
    );
};

export default ValueProposition;