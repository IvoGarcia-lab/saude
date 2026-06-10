'use client';

import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CoachInsightProps {
  message: string;
  className?: string;
  variant?: 'default' | 'compact';
}

export function CoachInsight({ message, className, variant = 'default' }: CoachInsightProps) {
  return (
    <div
      className={cn(
        'ai-gradient border border-ai-indigo/10 rounded-xl flex gap-4 items-start',
        variant === 'default' ? 'p-6' : 'p-4',
        className
      )}
    >
      <div className="bg-white p-2.5 rounded-full shadow-sm shrink-0">
        <Sparkles size={18} className="text-ai-indigo" fill="currentColor" />
      </div>
      <div>
        <p className="text-ai-indigo text-[13px] font-semibold tracking-[0.05em] uppercase mb-1">
          Insight do Coach
        </p>
        <p className="text-on-surface text-[15px] leading-6">
          &quot;{message}&quot;
        </p>
      </div>
    </div>
  );
}
