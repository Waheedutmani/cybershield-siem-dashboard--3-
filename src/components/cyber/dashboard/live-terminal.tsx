'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Pause, Play, Terminal, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface TerminalLine {
  id: number;
  timestamp: string;
  level: 'INFO' | 'WARNING' | 'CRITICAL';
  message: string;
}

const EVENT_POOL: { level: TerminalLine['level']; message: string }[] = [
  { level: 'INFO', message: 'Monitoring network traffic on eth0...' },
  { level: 'INFO', message: 'Firewall rules updated - 847 rules active' },
  { level: 'WARNING', message: 'Multiple failed login attempts from 192.168.1.105' },
  { level: 'CRITICAL', message: 'SQL Injection attempt blocked - IP: 203.45.67.89' },
  { level: 'INFO', message: 'Scanning port 443... secure' },
  { level: 'WARNING', message: 'Unusual outbound traffic detected on port 8080' },
  { level: 'CRITICAL', message: 'DDoS mitigation activated - filtering 12,847 packets/sec' },
  { level: 'INFO', message: 'SSL certificate check: VALID (expires in 247 days)' },
  { level: 'WARNING', message: 'Brute force protection triggered for user admin' },
  { level: 'INFO', message: 'Intrusion Detection System scan complete - 3 threats found' },
  { level: 'CRITICAL', message: 'Malware signature detected: Win32.Trojan.Agent' },
  { level: 'INFO', message: 'Database backup completed successfully (2.3 GB)' },
  { level: 'WARNING', message: 'Failed SSH login from 45.33.32.156 (23 attempts)' },
  { level: 'INFO', message: 'Network latency: avg 12ms, peak 45ms' },
  { level: 'CRITICAL', message: 'Unauthorized access attempt on /admin/api/users' },
  { level: 'INFO', message: 'Running vulnerability scan on 192.168.1.0/24...' },
  { level: 'WARNING', message: 'Outdated TLS 1.1 connection from legacy client' },
  { level: 'INFO', message: 'User session cleanup: removed 12 expired sessions' },
  { level: 'CRITICAL', message: 'XSS payload detected in request parameter' },
  { level: 'INFO', message: 'Content Security Policy: 47 violations today' },
  { level: 'WARNING', message: 'DNS query spike detected (+340% above baseline)' },
  { level: 'CRITICAL', message: 'Port scan detected from 185.220.101.35 (1024 ports)' },
  { level: 'INFO', message: 'Memory usage: 67% - within normal range' },
  { level: 'WARNING', message: 'Certificate for cdn.example.com expires in 7 days' },
];

function getTimestamp(): string {
  const now = new Date();
  return [now.getHours(), now.getMinutes(), now.getSeconds()]
    .map((v) => v.toString().padStart(2, '0'))
    .join(':');
}

function getLevelStyle(level: TerminalLine['level']) {
  switch (level) {
    case 'INFO':
      return { text: 'text-cyan-400', bracket: 'text-cyan-300' };
    case 'WARNING':
      return { text: 'text-yellow-400', bracket: 'text-yellow-300' };
    case 'CRITICAL':
      return { text: 'text-red-400', bracket: 'text-red-300' };
  }
}

export function LiveTerminal() {
  const [lines, setLines] = useState<TerminalLine[]>([]);
  const [paused, setPaused] = useState(false);
  const lineIdRef = useRef(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const addRandomLine = useCallback(() => {
    if (paused) return;

    const event = EVENT_POOL[Math.floor(Math.random() * EVENT_POOL.length)];
    const newLine: TerminalLine = {
      id: lineIdRef.current++,
      timestamp: getTimestamp(),
      level: event.level,
      message: event.message,
    };

    setLines((prev) => {
      const updated = [...prev, newLine];
      // Max 50 lines visible
      if (updated.length > 50) {
        return updated.slice(updated.length - 50);
      }
      return updated;
    });
  }, [paused]);

  useEffect(() => {
    // Add initial boot lines
    const bootLines: { level: TerminalLine['level']; message: string }[] = [
      { level: 'INFO', message: 'CyberShield SOC Terminal v3.2.1 initialized' },
      { level: 'INFO', message: 'Connecting to security monitoring services...' },
      { level: 'INFO', message: 'Loading threat intelligence feeds (3 sources)...' },
      { level: 'INFO', message: 'Establishing secure tunnel to SIEM backend...' },
      { level: 'INFO', message: 'All subsystems operational. Monitoring active.' },
    ];

    bootLines.forEach((item, i) => {
      setTimeout(() => {
        const newLine: TerminalLine = {
          id: lineIdRef.current++,
          timestamp: getTimestamp(),
          level: item.level,
          message: item.message,
        };
        setLines((prev) => [...prev, newLine]);
      }, i * 300);
    });

    // Schedule random events every 2-4 seconds
    const scheduleNext = () => {
      const delay = 2000 + Math.random() * 2000;
      return setTimeout(() => {
        addRandomLine();
        timerRef.current = scheduleNext();
      }, delay);
    };

    // Start after boot sequence completes
    const bootDuration = bootLines.length * 300 + 1000;
    const bootTimer = setTimeout(() => {
      timerRef.current = scheduleNext();
    }, bootDuration);

    const timerRef = { current: bootTimer as unknown as NodeJS.Timeout };

    return () => {
      clearTimeout(bootTimer);
      clearTimeout(timerRef.current);
    };
  }, []);

  // Update addRandomLine ref when paused changes
  useEffect(() => {
    if (!paused) return;

    // When paused, clear any pending events
  }, [paused]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [lines]);

  const handleClear = useCallback(() => {
    setLines([]);
  }, []);

  const togglePause = useCallback(() => {
    setPaused((prev) => !prev);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 }}
    >
      <Card className="glass-card-3d neon-glow-blue overflow-hidden terminal-neon-frame terminal-neon-edge corner-frame">
        {/* Terminal Header */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-cyber-border terminal-header-gradient" style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0.8) 0%, rgba(0,10,20,0.9) 100%)' }}>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500/80" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
              <div className="w-3 h-3 rounded-full bg-green-500/80" />
            </div>
            <Terminal className="w-3.5 h-3.5 text-cyan-500/70" />
            <span className="text-xs text-cyan-400 font-mono tracking-wide">
              root@cybershield-soc:~#
            </span>
          </div>
          <div className="flex items-center gap-2">
            {!paused && (
              <span className="flex items-center gap-1.5 text-[10px] text-neon-green mr-1">
                <span className="w-1.5 h-1.5 rounded-full bg-neon-green live-pulse" />
                LIVE
              </span>
            )}
            {paused && (
              <span className="flex items-center gap-1.5 text-[10px] text-neon-yellow mr-1">
                <span className="w-1.5 h-1.5 rounded-full bg-neon-yellow" />
                PAUSED
              </span>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={togglePause}
              className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground hover:bg-white/5"
            >
              {paused ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClear}
              className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground hover:bg-white/5"
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        </div>

        {/* Terminal Body */}
        <div
          ref={scrollRef}
          className="terminal-window bg-black/90 p-4 max-h-[360px] overflow-y-auto terminal-scan-line"
        >
          {lines.map((line) => {
            const style = getLevelStyle(line.level);
            return (
              <div
                key={line.id}
                className="flex items-start gap-2 animate-slide-in"
              >
                <span className="text-gray-500 shrink-0 select-none">
                  {line.timestamp}
                </span>
                <span className={cn('font-bold shrink-0 select-none', style.bracket)}>
                  [{line.level}]
                </span>
                <span className={cn(style.text)}>
                  {line.message}
                </span>
              </div>
            );
          })}
          {/* Blinking Cursor */}
          <div className="flex items-center gap-1 mt-0.5">
            <span className="text-cyan-400/70 terminal-cursor select-none">
              ▊
            </span>
          </div>
        </div>
        {/* Vignette depth overlay */}
        <div 
          className="absolute inset-0 pointer-events-none z-10 rounded-b-[15px]"
          style={{
            background: 'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.4) 100%)',
          }}
        />
      </Card>
    </motion.div>
  );
}
