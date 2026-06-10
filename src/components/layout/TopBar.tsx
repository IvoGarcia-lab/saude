'use client';

import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

export function TopBar() {
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const isAuthOrOnboarding = ['/login', '/register', '/onboarding'].some(
    (path) => pathname === path || pathname?.startsWith(`${path}/`)
  );

  if (isAuthOrOnboarding) return null;

  return (
    <header
      className={cn(
        'fixed top-0 w-full z-50 glass-nav border-b transition-shadow duration-300',
        scrolled ? 'shadow-md border-outline-variant/30' : 'shadow-sm border-transparent'
      )}
    >
      <div className="flex justify-between items-center px-4 md:px-10 h-16 w-full max-w-[1280px] mx-auto">
        <h1 className="font-display text-xl font-bold text-primary tracking-tight">
          O Meu Coach Inteligente
        </h1>
        <button
          className="p-2 rounded-full hover:bg-surface-container-high transition-colors active:scale-95"
          aria-label="Perfil"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-primary">
            <circle cx="12" cy="8" r="4" />
            <path d="M20 21a8 8 0 1 0-16 0" />
          </svg>
        </button>
      </div>
    </header>
  );
}
