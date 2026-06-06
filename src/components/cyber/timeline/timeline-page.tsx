'use client';

import { useEffect, useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import {
  Clock,
  ShieldAlert,
  ShieldCheck,
  FileText,
  Ban,
  AlertTriangle,
  Bug,
  Database,
  Code,
  Wifi,
  Fish,
  UserX,
  Search,
  Filter,
} from 'lucide-react';
import { useAppStore } from '@/store/app-store';

interface TimelineEvent {
  id: string;
  timestamp: string;
  type: 'log' | 'alert' | 'blocked_ip';
  eventType: string;
  description: string;
  severity: string;
  sourceIp?: string;
  title?: string;
  status?: string;
  threatScore?: number;
  autoBlocked?: boolean;
}

function getEventIcon(eventType: string) {
  if (eventType === 'BLOCKED_IP') return Ban;
  if (eventType === 'ALERT') return ShieldAlert;
  if (eventType.includes('BRUTE_FORCE') || eventType.includes('LOGIN_FAILED')) return UserX;
  if (eventType.includes('SQL')) return Database;
  if (eventType.includes('XSS')) return Code;
  if (eventType.includes('PORT_SCAN') || eventType.includes('DDOS')) return Wifi;
  if (eventType.includes('MALWARE')) return Bug;
  if (eventType.includes('PHISHING')) return Fish;
  if (eventType.includes('LOGIN_SUCCESS') || eventType.includes('LOGIN')) return ShieldCheck;
  return FileText;
}

function getEventColor(severity: string) {
  switch (severity) {
    case 'Critical': return { line: 'bg-neon-red', dot: 'bg-neon-red', glow: 'shadow-[0_0_8px_rgba(255,51,102,0.5)]' };
    case 'High': return { line: 'bg-neon-orange', dot: 'bg-neon-orange', glow: 'shadow-[0_0_8px_rgba(249,115,22,0.4)]' };
    case 'Medium': return { line: 'bg-neon-yellow', dot: 'bg-neon-yellow', glow: 'shadow-[0_0_8px_rgba(234,179,8,0.4)]' };
    default: return { line: 'bg-neon-green', dot: 'bg-neon-green', glow: 'shadow-[0_0_8px_rgba(0,255,136,0.4)]' };
  }
}

function getTypeColor(type: string) {
  switch (type) {
    case 'alert': return 'text-neon-red bg-neon-red/10 border-neon-red/30';
    case 'blocked_ip': return 'text-neon-purple bg-neon-purple/10 border-neon-purple/30';
    default: return 'text-neon-blue bg-neon-blue/10 border-neon-blue/30';
  }
}

const filterOptions = [
  { value: '', label: 'All Events' },
  { value: 'alert', label: 'Alerts' },
  { value: 'log', label: 'Logs' },
  { value: 'blocked_ip', label: 'Blocked IPs' },
];

export function TimelinePage() {
  const { simulationActive } = useAppStore();
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [autoScroll, setAutoScroll] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const fetchEvents = async () => {
    try {
      const params = new URLSearchParams({ limit: '100' });
      if (filter) params.set('type', filter);
      const res = await fetch(`/api/timeline?${params}`);
      if (res.ok) {
        const data = await res.json();
        setEvents(data.events);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [filter]);

  useEffect(() => {
    if (!simulationActive) return;
    const interval = setInterval(fetchEvents, 5000);
    return () => clearInterval(interval);
  }, [simulationActive, filter]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (autoScroll && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [events, autoScroll]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Clock className="w-6 h-6 text-neon-blue" />
            SOC Timeline
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Chronological view of all security events
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {filterOptions.map((opt) => (
            <Button
              key={opt.value}
              variant="outline"
              size="sm"
              onClick={() => setFilter(opt.value)}
              className={cn(
                'text-xs gap-1.5',
                filter === opt.value
                  ? 'bg-neon-blue/10 text-neon-blue border-neon-blue/30'
                  : 'border-cyber-border text-muted-foreground hover:text-foreground'
              )}
            >
              <Filter className="w-3 h-3" />
              {opt.label}
            </Button>
          ))}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoScroll(!autoScroll)}
            className={cn(
              'text-xs',
              autoScroll
                ? 'bg-neon-green/10 text-neon-green border-neon-green/30'
                : 'border-cyber-border text-muted-foreground'
            )}
          >
            {autoScroll ? 'Auto-scroll ON' : 'Auto-scroll OFF'}
          </Button>
        </div>
      </div>

      {/* Timeline */}
      <Card className="glass-card neon-glow-blue">
        <CardContent className="p-0">
          <div
            ref={containerRef}
            className="max-h-[600px] overflow-y-auto p-6"
          >
            {loading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex gap-4 animate-pulse">
                    <div className="w-8 h-8 rounded-full bg-cyber-dark" />
                    <div className="flex-1 h-16 bg-cyber-dark rounded-lg" />
                  </div>
                ))}
              </div>
            ) : events.length === 0 ? (
              <div className="text-center py-16">
                <Search className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-sm text-muted-foreground">No events found</p>
              </div>
            ) : (
              <div className="relative">
                {/* Vertical line */}
                <div className="absolute left-4 top-0 bottom-0 w-px bg-cyber-border" />

                <div className="space-y-4">
                  {events.map((event, idx) => {
                    const Icon = getEventIcon(event.eventType);
                    const colors = getEventColor(event.severity);
                    const typeColor = getTypeColor(event.type);
                    const time = new Date(event.timestamp);

                    return (
                      <motion.div
                        key={event.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: Math.min(idx * 0.02, 0.5) }}
                        className="relative flex gap-4 pl-2"
                      >
                        {/* Timeline dot */}
                        <div className="relative z-10 flex-shrink-0 mt-1">
                          <div
                            className={cn(
                              'w-5 h-5 rounded-full flex items-center justify-center',
                              colors.dot,
                              colors.glow
                            )}
                          >
                            <Icon className="w-2.5 h-2.5 text-cyber-dark" />
                          </div>
                        </div>

                        {/* Content card */}
                        <div className={cn(
                          'flex-1 p-3 rounded-lg border bg-white/[0.02] hover:bg-white/[0.04] transition-colors',
                          'border-cyber-border'
                        )}>
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                {event.title && (
                                  <span className="text-xs font-semibold text-foreground">
                                    {event.title}
                                  </span>
                                )}
                                <Badge variant="outline" className={cn('text-[9px] px-1.5 py-0 border', typeColor)}>
                                  {event.type === 'alert' ? 'Alert' : event.type === 'blocked_ip' ? 'Blocked' : 'Log'}
                                </Badge>
                                <Badge
                                  variant="outline"
                                  className={cn('text-[9px] px-1.5 py-0', {
                                    'border-neon-red/30 text-neon-red': event.severity === 'Critical',
                                    'border-neon-orange/30 text-neon-orange': event.severity === 'High',
                                    'border-neon-yellow/30 text-neon-yellow': event.severity === 'Medium',
                                    'border-neon-green/30 text-neon-green': event.severity === 'Low',
                                  })}
                                >
                                  {event.severity}
                                </Badge>
                                {event.autoBlocked && (
                                  <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-neon-purple/30 text-neon-purple">
                                    AUTO-BLOCKED
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">
                                {event.description}
                              </p>
                              <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground/60">
                                {event.sourceIp && (
                                  <span className="font-mono">{event.sourceIp}</span>
                                )}
                                <span>{time.toLocaleTimeString()}</span>
                                <span>{time.toLocaleDateString()}</span>
                                {event.threatScore !== undefined && event.threatScore > 0 && (
                                  <span className={cn('font-semibold', {
                                    'text-neon-red': event.threatScore >= 75,
                                    'text-neon-orange': event.threatScore >= 50,
                                    'text-neon-yellow': event.threatScore >= 25,
                                    'text-neon-green': event.threatScore < 25,
                                  })}>
                                    Score: {event.threatScore}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                <div ref={bottomRef} />
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
