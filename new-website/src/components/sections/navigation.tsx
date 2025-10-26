"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronDown, Menu, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getSupabaseBrowserClient } from '@/lib/supabase';

// A representative SVG for the This project of fluent logo, preserving original dimensions.
const FluentLogo = ({ className }: { className?: string }) => (
  <svg
    width="66"
    height="30"
    viewBox="0 0 66 30"
    className={cn("shrink-0", className)}
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
    aria-label="This project of fluent Logo"
  >
    <path
      d="M41.4855 2.1333C40.4055 0.816698 38.8355 0 37.1655 0H28.8355C27.1655 0 25.5955 0.816698 24.5155 2.1333L15.4855 13.8667C14.7355 14.7833 14.7355 16.0833 15.4855 17L24.5155 28.7333C25.5955 30.05 27.1655 30.8667 28.8355 30.8667H37.1655C38.8355 30.8667 40.4055 30.05 41.4855 28.7333L50.5155 17C51.2655 16.0833 51.2655 14.7833 50.5155 13.8667L41.4855 2.1333ZM5.875 15L13.125 6.125L20.375 15L13.125 23.875L5.875 15ZM24.625 26.425V3.575L32.875 13.5V16.5L24.625 26.425ZM44.575 23.875L37.325 15L44.575 6.125L51.825 15L44.575 23.875Z"
    />
  </svg>
);


export default function Navigation() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    handleScroll(); // Set initial state
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (!supabase) return;

    // Check auth state
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };

    checkAuth();

    // Listen to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  const handleSignOut = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    router.refresh();
  };

  const textClass = scrolled ? 'text-foreground-primary' : 'text-background-secondary';
  const logoColorClass = scrolled ? 'text-primary' : 'text-background-secondary';

  const navItems = [
    { name: 'Products', dropdown: true },
    { name: 'Solutions', dropdown: true },
    { name: 'Pricing', href: '/pricing' },
    { name: 'Documentation', href: '#' },
    { name: 'Blog', href: '#' }
  ];

  const NavItem = ({ item }: { item: typeof navItems[0] }) => {
    const commonClasses = "relative z-10 flex items-center rounded-md py-2 px-4 font-medium text-inherit transition-opacity duration-400 ease-out hover:opacity-80";
    if (item.href) {
      const isExternal = item.href.startsWith('http');
      if (isExternal) {
        return <a href={item.href} target="_blank" rel="noopener noreferrer" className={commonClasses}>{item.name}</a>;
      }
      return <Link href={item.href} className={commonClasses}>{item.name}</Link>;
    }
    return (
      <button className={cn(commonClasses, "pr-2")}>
        {item.name}
        <ChevronDown className="ml-1 h-4 w-auto shrink-0" />
      </button>
    );
  };
  
  return (
    <header
      className={cn(
        "fixed top-0 right-0 left-0 z-50 mx-auto w-full transition-all duration-300 ease-out pointer-events-none",
        scrolled
          ? "bg-background-secondary/90 backdrop-blur-md border-b border-border-light shadow-sm md:top-0"
          : "bg-background-secondary md:bg-transparent border-b border-border-light md:border-none md:top-1"
      )}
    >
      <div className="mx-auto flex h-[54px] w-full max-w-[1480px] items-center justify-between px-2 md:h-[72px] md:pr-3 md:pl-5 2xl:pr-1">
        
        <Link href="/" className="pointer-events-auto flex flex-shrink-0 cursor-pointer items-center p-0 transition-opacity duration-200 hover:opacity-80" aria-label="Go to homepage">
          <FluentLogo className={cn("transition-colors duration-200 ease-out", logoColorClass)} />
          <div className={cn("-mb-1 hidden md:flex ml-2 flex-col items-start justify-start transition-colors duration-200 ease-out", textClass)}>
            <div className="text-[9px] leading-none font-medium text-inherit uppercase">This project of fluent</div>
            <div className="text-[23px] leading-none font-medium tracking-[-0.02em] whitespace-nowrap text-inherit">Knowledge Platform</div>
          </div>
        </Link>
        
        <div className="pointer-events-auto absolute left-1/2 -translate-x-1/2 hidden min-[1140px]:block">
          <nav className={cn("relative flex h-full items-center", textClass)}>
            <div className="relative flex items-center rounded-md border bg-black/5 p-px transition-colors duration-300" 
                 style={{ 
                   backgroundColor: scrolled ? 'hsla(0,0%,7%,.05)' : 'hsla(0,0%,100%,.1)',
                   borderColor: scrolled ? 'hsla(0,0%,7%,.1)' : 'hsla(0,0%,100%,.2)' 
                 }}>
              {navItems.map((item) => <NavItem key={item.name} item={item} />)}
            </div>
          </nav>
        </div>

        <div className="flex flex-1 items-center justify-end space-x-1">
          {user ? (
            <>
              <span className={cn(
                "pointer-events-auto relative hidden shrink-0 font-medium md:flex",
                scrolled ? "text-foreground-primary" : "text-background-secondary"
              )}>
                {user.email}
              </span>
              <button 
                onClick={handleSignOut}
                className={cn(
                  "pointer-events-auto relative hidden shrink-0 items-center justify-center whitespace-nowrap font-medium transition-all ease-out duration-200 rounded-full px-4 py-2 text-sm border md:flex",
                  "hover:border-dashed active:scale-[0.98]",
                  scrolled ? "text-foreground-primary border-black/20 hover:border-foreground-primary" : "text-background-secondary border-white/20 hover:border-white",
                )}
              >
                Sign Out
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className={cn(
                  "pointer-events-auto relative hidden shrink-0 items-center justify-center whitespace-nowrap font-medium transition-all ease-out duration-200 rounded-full px-4 py-2 text-sm border md:flex",
                  "hover:border-dashed active:scale-[0.98]",
                  scrolled ? "text-foreground-primary border-black/20 hover:border-foreground-primary" : "text-background-secondary border-white/20 hover:border-white",
              )}>
                Sign In
              </Link>

              <Link href="/signup" className={cn(
                "pointer-events-auto relative hidden shrink-0 items-center justify-center whitespace-nowrap font-medium transition-all ease-out duration-200 rounded-full px-4 py-2 text-sm border border-transparent md:flex",
                "active:scale-[0.98] bg-background-secondary text-primary hover:bg-primary hover:text-background-secondary"
              )}>
                Start building
              </Link>
            </>
          )}

          <button
            aria-label="Open menu"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="pointer-events-auto flex items-center justify-center rounded-full p-2 text-foreground-primary md:hidden"
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>
      </div>
      
      {mobileMenuOpen && (
        <div className="pointer-events-auto w-full border-t border-border-light bg-background-secondary md:hidden">
          <nav className="flex flex-col space-y-1 p-4 text-foreground-primary">
            {navItems.map((item) => (
              item.href 
              ? <NavItem key={item.name} item={item} />
              : <button key={item.name} className="flex w-full items-center justify-between rounded-md p-2 text-left hover:bg-black/5">{item.name} <ChevronDown className="h-4 w-4 shrink-0"/></button>
            ))}
            <div className="!mt-4 space-y-2 border-t border-border-light pt-4">
               {user ? (
                 <>
                   <div className="px-4 py-2 text-sm text-foreground-primary/70">{user.email}</div>
                   <button 
                     onClick={handleSignOut}
                     className="flex w-full items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-medium border border-foreground-primary"
                   >
                     Sign Out
                   </button>
                 </>
               ) : (
                 <>
                   <Link href="/login" className="flex w-full items-center justify-center rounded-full px-4 py-2 text-sm font-medium border border-foreground-primary">Sign In</Link>
                   <Link href="/signup" className="flex w-full items-center justify-center rounded-full px-4 py-2 text-sm font-medium bg-primary text-background-secondary">Start building</Link>
                 </>
               )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}