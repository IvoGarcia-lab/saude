'use client';

import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

interface MacroCardProps {
  icon: ReactNode;
  label: string;
  value: number;
  unit: string;
  progress: number; // 0 to 100
  color: string; // Tailwind color class for the progress bar
  className?: string;
}

export function MacroCard({
  icon,
  label,
  value,
  unit,
  progress,
  color,
  className,
}: MacroCardProps) {
  return (
    <div
      className={cn(
        'bg-white border border-outline-variant/30 rounded-xl p-6 metric-card flex flex-col justify-between',
        className
      )}
    >
      <div>
        <div className="mb-4">{icon}</div>
        <h3 className="text-on-surface text-[13px] font-semibold tracking-[0.05em] mb-1">
          {label}
        </h3>
        <p className="font-display text-[32px] font-light leading-8 text-on-surface">
          {value}
          <span className="text-base text-on-surface-variant ml-0.5">{unit}</span>
        </p>
      </div>
      <div className="w-full bg-surface-container-highest h-1.5 rounded-full mt-4">
        <div
          className={cn('h-full rounded-full transition-all duration-700 ease-out', color)}
          style={{ width: `${Math.min(progress, 100)}%` }}
        />
      </div>
    </div>
  );
}
