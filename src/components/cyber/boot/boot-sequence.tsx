'use client';

import { useState, useEffect } from 'react';

interface BootStep {
  label: string;
  status: 'pending' | 'running' | 'done';
  delay: number;
}

const bootSteps: Omit<BootStep, 'status'>[] = [
  { label: 'Initializing CyberShield Core...', delay: 400 },
  { label: 'Loading firewall rules engine...', delay: 350 },
  { label: 'Connecting to threat intelligence...', delay: 500 },
  { label: 'Activating intrusion detection...', delay: 300 },
  { label: 'Loading vulnerability database...', delay: 400 },
  { label: 'Starting AI assistant (ARIA)...', delay: 450 },
  { label: 'Establishing secure tunnels...', delay: 350 },
  { label: 'Synchronizing security modules...', delay: 300 },
  { label: 'All systems operational.', delay: 200 },
];

interface BootSequenceProps {
  onComplete: () => void;
  userName?: string;
  userRole?: string;
}

export function BootSequence({ onComplete, userName, userRole }: BootSequenceProps) {
  const [steps, setSteps] = useState<BootStep[]>(
    bootSteps.map(s => ({ ...s, status: 'pending' }))
  );
  const [progress, setProgress] = useState(0);
  const [fadeOut, setFadeOut] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    let stepIndex = 0;
    const interval = setInterval(() => {
      if (stepIndex >= steps.length) {
        clearInterval(interval);
        // Show welcome, then fade out
        setTimeout(() => setShowWelcome(true), 300);
        setTimeout(() => setFadeOut(true), 1800);
        setTimeout(() => onComplete(), 2400);
        return;
      }

      setSteps(prev => prev.map((s, i) => {
        if (i === stepIndex) return { ...s, status: 'running' };
        if (i < stepIndex) return { ...s, status: 'done' };
        return s;
      }));

      // Mark as done after a beat
      setTimeout(() => {
        setSteps(prev => prev.map((s, i) => {
          if (i === stepIndex) return { ...s, status: 'done' };
          return s;
        }));
      }, bootSteps[stepIndex].delay);

      setProgress(((stepIndex + 1) / steps.length) * 100);
      stepIndex++;
    }, 500);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center relative z-10 transition-opacity duration-500 ${fadeOut ? 'opacity-0' : 'opacity-100'}`}>
      {/* Background grid */}
      <div className="absolute inset-0 cyber-grid-bg opacity-30" />

      {/* Scan line */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-neon-blue/30 to-transparent absolute" style={{ animation: 'scan-line 4s linear infinite' }} />
      </div>

      {/* Logo */}
      <div className="relative mb-10">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-neon-blue to-neon-purple flex items-center justify-center boot-logo-pulse">
          <svg className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <path d="M9 12l2 2 4-4" />
          </svg>
        </div>
        {/* Glow rings */}
        <div className="absolute inset-0 rounded-2xl boot-ring-1" />
        <div className="absolute inset-0 rounded-2xl boot-ring-2" />
      </div>

      <h1 className="text-2xl font-bold tracking-[0.3em] text-foreground mb-1 boot-title-glow">
        CYBERSHIELD
      </h1>
      <p className="text-xs text-muted-foreground tracking-[0.5em] mb-10">
        SIEM PLATFORM v2.0
      </p>

      {/* Boot log */}
      <div className="w-[460px] max-w-[90vw] glass-card rounded-xl p-4 mb-6 boot-terminal">
        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-cyber-border/50">
          <span className="w-2.5 h-2.5 rounded-full bg-neon-red/60" />
          <span className="w-2.5 h-2.5 rounded-full bg-neon-orange/60" />
          <span className="w-2.5 h-2.5 rounded-full bg-neon-green/60" />
          <span className="text-[10px] text-muted-foreground ml-2 font-mono">cybershield@soc:~$ boot --init</span>
        </div>
        <div className="space-y-1 font-mono text-xs">
          {steps.map((step, i) => (
            <div
              key={i}
              className={`boot-line flex items-center gap-2 transition-all duration-300 ${
                step.status === 'running' ? 'text-neon-blue' :
                step.status === 'done' ? 'text-neon-green/80' :
                'text-muted-foreground/30'
              }`}
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <span className="w-16 flex-shrink-0">
                {step.status === 'done' && (
                  <span className="text-neon-green font-bold">[OK]</span>
                )}
                {step.status === 'running' && (
                  <span className="text-neon-blue">{'···'}</span>
                )}
                {step.status === 'pending' && (
                  <span className="text-muted-foreground/20">[  ]</span>
                )}
              </span>
              <span>{step.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-[460px] max-w-[90vw]">
        <div className="h-1 bg-white/5 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-neon-blue to-neon-purple rounded-full transition-all duration-500 ease-out boot-progress-bar"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between mt-1.5">
          <span className="text-[9px] text-muted-foreground/40 font-mono">
            {steps.filter(s => s.status === 'done').length}/{steps.length} modules loaded
          </span>
          <span className="text-[9px] text-muted-foreground/40 font-mono">
            {Math.round(progress)}%
          </span>
        </div>
      </div>

      {/* Welcome overlay (appears after boot) */}
      {showWelcome && (
        <div className="boot-welcome-overlay">
          <div className="text-center">
            <p className="text-lg font-semibold text-foreground mb-2">
              Welcome back, <span className="text-neon-blue">{userName || 'Operator'}</span>.
            </p>
            <p className="text-sm text-muted-foreground boot-welcome-sub">
              {userRole === 'Admin' ? 'Full SOC command access granted.' :
               userRole === 'Analyst' ? 'Analyst workstation ready.' :
               'Personal dashboard loaded.'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
