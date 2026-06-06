'use client';

import { useState, useCallback, useEffect } from 'react';
import { Monitor, MonitorOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { playSound } from '@/lib/sounds';

export function useSocMode() {
  const [socMode, setSocMode] = useState(false);

  const toggleSocMode = useCallback(() => {
    setSocMode(prev => {
      const next = !prev;
      playSound(next ? 'success' : 'click');
      if (next) {
        document.documentElement.requestFullscreen?.().catch(() => {});
      } else {
        document.exitFullscreen?.().catch(() => {});
      }
      return next;
    });
  }, []);

  // Listen for fullscreen exit (user presses ESC in browser)
  useEffect(() => {
    const handler = () => {
      if (!document.fullscreenElement) {
        setSocMode(false);
      }
    };
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  return { socMode, toggleSocMode };
}

export function SocModeToggle({ socMode, onToggle }: { socMode: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className={cn(
        'flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-300',
        socMode
          ? 'bg-neon-blue/15 text-neon-blue border border-neon-blue/30 shadow-[0_0_12px_rgba(0,212,255,0.15)]'
          : 'text-muted-foreground hover:text-foreground hover:bg-white/5 border border-transparent'
      )}
      title={socMode ? 'Exit SOC Mode' : 'Enter SOC Mode'}
    >
      {socMode ? (
        <MonitorOff className="w-3.5 h-3.5" />
      ) : (
        <Monitor className="w-3.5 h-3.5" />
      )}
      <span className="hidden sm:inline">
        {socMode ? 'Exit SOC' : 'SOC Mode'}
      </span>
    </button>
  );
}
