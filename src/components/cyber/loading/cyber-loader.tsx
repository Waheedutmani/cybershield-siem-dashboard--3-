'use client';

import { cn } from '@/lib/utils';

type LoaderVariant = 'scanner' | 'grid' | 'shield' | 'radar';

interface CyberLoaderProps {
  variant?: LoaderVariant;
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  className?: string;
}

export function CyberLoader({ variant = 'shield', size = 'md', label, className }: CyberLoaderProps) {
  const sizeMap = { sm: 'w-10 h-10', md: 'w-16 h-16', lg: 'w-24 h-24' };
  const iconSize = { sm: 'w-5 h-5', md: 'w-8 h-8', lg: 'w-12 h-12' };

  if (variant === 'shield') {
    return (
      <div className={cn('flex flex-col items-center gap-4', className)}>
        <div className={cn('relative', sizeMap[size])}>
          <div className={cn('absolute inset-0 rounded-2xl border-2 border-neon-blue/20 loader-ring-spin')} />
          <div className={cn('absolute inset-1 rounded-xl bg-gradient-to-br from-neon-blue/20 to-neon-purple/20 flex items-center justify-center loader-pulse-glow')}>
            <svg className={cn(iconSize[size], 'text-neon-blue/70')} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <div className={cn('absolute inset-0 rounded-2xl loader-corner-spin')} />
        </div>
        {label && <p className="text-xs text-muted-foreground tracking-wider">{label}</p>}
      </div>
    );
  }

  if (variant === 'radar') {
    return (
      <div className={cn('flex flex-col items-center gap-4', className)}>
        <div className={cn('relative', sizeMap[size])}>
          <div className="absolute inset-0 rounded-full border border-neon-blue/10" />
          <div className="absolute inset-2 rounded-full border border-neon-blue/15" />
          <div className="absolute inset-4 rounded-full border border-neon-blue/20" />
          <div className="absolute inset-0 rounded-full overflow-hidden">
            <div className="w-1/2 h-full bg-gradient-to-r from-neon-blue/20 to-transparent origin-left loader-radar-sweep" />
          </div>
          <div className="absolute inset-[40%] rounded-full bg-neon-blue/40 loader-ping-dot" />
        </div>
        {label && <p className="text-xs text-muted-foreground tracking-wider">{label}</p>}
      </div>
    );
  }

  if (variant === 'scanner') {
    return (
      <div className={cn('flex flex-col items-center gap-4', className)}>
        <div className={cn('relative', sizeMap[size])}>
          <div className={cn('w-full h-full rounded-xl bg-white/5 border border-cyber-border/30 overflow-hidden')}>
            <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-neon-blue/60 to-transparent loader-scan-vertical" />
            <div className="absolute inset-2 border border-neon-blue/5 rounded" />
            <div className="absolute inset-4 border border-neon-blue/5 rounded" />
          </div>
        </div>
        {label && <p className="text-xs text-muted-foreground tracking-wider">{label}</p>}
      </div>
    );
  }

  // Default: grid loader
  return (
    <div className={cn('flex flex-col items-center gap-4', className)}>
      <div className="relative w-12 h-12">
        <div className="absolute inset-0 grid grid-cols-3 gap-1">
          {Array.from({ length: 9 }).map((_, i) => (
            <div
              key={i}
              className="rounded-sm bg-neon-blue/20 loader-grid-cell"
              style={{ animationDelay: `${i * 80}ms` }}
            />
          ))}
        </div>
      </div>
      {label && <p className="text-xs text-muted-foreground tracking-wider">{label}</p>}
    </div>
  );
}

// Skeleton loader for content cards
export function CyberSkeleton({ className, lines = 3 }: { className?: string; lines?: number }) {
  return (
    <div className={cn('glass-card rounded-xl p-4 space-y-3', className)}>
      <div className="h-4 bg-white/5 rounded w-1/3 skeleton-pulse" />
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="h-3 bg-white/3 rounded skeleton-pulse" style={{ width: `${60 + Math.random() * 40}%`, animationDelay: `${i * 150}ms` }} />
      ))}
    </div>
  );
}
