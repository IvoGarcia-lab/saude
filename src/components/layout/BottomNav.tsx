'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Camera,
  Dumbbell,
  Brain,
  Calendar,
} from 'lucide-react';

const tabs = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/diary', label: 'Diário', icon: Camera },
  { href: '/calendar', label: 'Calendário', icon: Calendar },
  { href: '/workouts', label: 'Treino', icon: Dumbbell },
  { href: '/insights', label: 'Insights', icon: Brain },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  const isAuthOrOnboarding = ['/login', '/register', '/onboarding'].some(
    (path) => pathname === path || pathname?.startsWith(`${path}/`)
  );

  if (isAuthOrOnboarding) return null;

  return (
    <nav className="fixed bottom-0 left-0 w-full z-50 glass-nav border-t border-outline-variant shadow-lg pb-safe">
      <div className="flex justify-around items-center px-2 py-2 max-w-[1280px] mx-auto">
        {tabs.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || pathname?.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-col items-center justify-center gap-0.5 py-1.5 px-4 rounded-full transition-all duration-200 active:scale-95',
                isActive
                  ? 'bg-secondary-container text-on-secondary-container'
                  : 'text-on-surface-variant hover:text-primary'
              )}
            >
              <Icon
                size={20}
                strokeWidth={isActive ? 2.2 : 1.5}
                className="transition-all"
              />
              <span className="text-[11px] font-semibold tracking-wide">
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
