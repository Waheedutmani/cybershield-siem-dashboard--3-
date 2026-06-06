'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import {
  Database,
  Shield,
  Globe,
  Cpu,
  HardDrive,
  ArrowDownToLine,
  ArrowUpFromLine,
  Activity,
} from 'lucide-react';

interface StatusCardData {
  id: string;
  title: string;
  status: 'online' | 'offline' | 'warning';
  statusText: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  value: string;
  subValue?: string;
  progress?: number;
  progressColor?: string;
  netIn?: number;
  netOut?: number;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function getProgressColor(value: number): string {
  if (value >= 80) return 'bg-neon-red';
  if (value >= 60) return 'bg-neon-yellow';
  return 'bg-neon-green';
}

export function SystemStatus() {
  const [cards, setCards] = useState<StatusCardData[]>([]);
  const cpuRef = useRef(52);
  const memRef = useRef(62);
  const respRef = useRef(23);
  const reqRef = useRef(14832);
  const rulesRef = useRef(847);
  const netInRef = useRef(342);
  const netOutRef = useRef(187);
  const isFirstRender = useRef(true);

  const buildCards = useCallback(() => {
    const cpu = cpuRef.current;
    const mem = memRef.current;
    const resp = respRef.current;
    const req = reqRef.current;
    const rules = rulesRef.current;
    const netIn = netInRef.current;
    const netOut = netOutRef.current;

    const memTotal = 16;
    const memUsed = ((mem / 100) * memTotal).toFixed(1);

    const statusCards: StatusCardData[] = [
      {
        id: 'database',
        title: 'Database Status',
        status: resp < 100 ? 'online' : 'warning',
        statusText: resp < 100 ? 'Online' : 'Degraded',
        icon: Database,
        color: 'text-neon-green',
        bgColor: 'bg-neon-green/10',
        value: `${Math.round(resp)}ms`,
        subValue: 'response time',
        progress: undefined,
      },
      {
        id: 'firewall',
        title: 'Firewall Status',
        status: 'online',
        statusText: 'Active',
        icon: Shield,
        color: 'text-neon-blue',
        bgColor: 'bg-neon-blue/10',
        value: `${rules}`,
        subValue: 'rules active',
        progress: undefined,
      },
      {
        id: 'api',
        title: 'API Status',
        status: 'online',
        statusText: 'Online',
        icon: Globe,
        color: 'text-neon-purple',
        bgColor: 'bg-neon-purple/10',
        value: req.toLocaleString(),
        subValue: 'requests/min',
        progress: undefined,
      },
      {
        id: 'server',
        title: 'Server Health',
        status: cpu < 75 ? 'online' : cpu < 90 ? 'warning' : 'offline',
        statusText: cpu < 75 ? 'Healthy' : cpu < 90 ? 'Warning' : 'Critical',
        icon: Cpu,
        color: cpu < 75 ? 'text-neon-green' : cpu < 90 ? 'text-neon-yellow' : 'text-neon-red',
        bgColor: cpu < 75 ? 'bg-neon-green/10' : cpu < 90 ? 'bg-neon-yellow/10' : 'bg-neon-red/10',
        value: `${Math.round(cpu)}%`,
        subValue: 'CPU usage',
        progress: cpu,
        progressColor: getProgressColor(cpu),
      },
      {
        id: 'memory',
        title: 'Memory Usage',
        status: mem < 80 ? 'online' : mem < 90 ? 'warning' : 'offline',
        statusText: mem < 80 ? 'Normal' : mem < 90 ? 'High' : 'Critical',
        icon: HardDrive,
        color: mem < 80 ? 'text-neon-green' : mem < 90 ? 'text-neon-yellow' : 'text-neon-red',
        bgColor: mem < 80 ? 'bg-neon-green/10' : mem < 90 ? 'bg-neon-yellow/10' : 'bg-neon-red/10',
        value: `${memUsed} / ${memTotal} GB`,
        subValue: `${Math.round(mem)}% utilized`,
        progress: mem,
        progressColor: getProgressColor(mem),
      },
      {
        id: 'network',
        title: 'Network',
        status: 'online',
        statusText: 'Connected',
        icon: Activity,
        color: 'text-neon-orange',
        bgColor: 'bg-neon-orange/10',
        value: `${netIn} MB/s`,
        subValue: `${netOut} MB/s out`,
        progress: undefined,
        netIn: netIn,
        netOut: netOut,
      },
    ];

    return statusCards;
  }, []);

  // Initial values
  useEffect(() => {
    setCards(buildCards());
    isFirstRender.current = false;
  }, [buildCards]);

  // Fluctuate values every 3-5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      // CPU: 30-75%, fluctuate ±2-5%
      const cpuDelta = (Math.random() - 0.5) * 10; // -5 to +5
      cpuRef.current = clamp(cpuRef.current + cpuDelta, 30, 75);

      // Memory: 45-80%, fluctuate ±1-3%
      const memDelta = (Math.random() - 0.5) * 6; // -3 to +3
      memRef.current = clamp(memRef.current + memDelta, 45, 80);

      // Response time: 5-50ms, fluctuate ±2-8ms
      const respDelta = (Math.random() - 0.5) * 16; // -8 to +8
      respRef.current = clamp(respRef.current + respDelta, 5, 50);

      // Request count: incrementing slowly
      reqRef.current += Math.floor(Math.random() * 50) + 10;

      // Rules count: 840-860, changes rarely
      if (Math.random() < 0.1) {
        const rulesDelta = Math.floor(Math.random() * 5) - 2;
        rulesRef.current = clamp(rulesRef.current + rulesDelta, 840, 860);
      }

      // Network: fluctuating traffic
      const netInDelta = (Math.random() - 0.5) * 100;
      netInRef.current = clamp(netInRef.current + netInDelta, 100, 800);
      const netOutDelta = (Math.random() - 0.5) * 60;
      netOutRef.current = clamp(netOutRef.current + netOutDelta, 50, 500);

      setCards(buildCards());
    }, 3000 + Math.random() * 2000);

    return () => clearInterval(interval);
  }, [buildCards]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.55 }}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.55 + idx * 0.06 }}
            >
              <Card className="glass-card hover:neon-glow-blue transition-all duration-300 group cursor-default h-full">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className={cn('p-2 rounded-lg', card.bgColor)}>
                        <Icon className={cn('w-4 h-4', card.color)} />
                      </div>
                      <div>
                        <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium leading-none">
                          {card.title}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className={cn('status-dot', card.status)} />
                      <span className={cn(
                        'text-[10px] font-medium',
                        card.status === 'online' && 'text-neon-green',
                        card.status === 'warning' && 'text-neon-yellow',
                        card.status === 'offline' && 'text-neon-red',
                      )}>
                        {card.statusText}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className={cn(
                      'text-2xl font-bold tabular-nums number-flash',
                      card.color,
                    )}>
                      {card.value}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {card.subValue}
                    </p>
                  </div>

                  {/* Progress bar for CPU / Memory */}
                  {card.progress !== undefined && card.progressColor && (
                    <div className="mt-3">
                      <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <motion.div
                          className={cn('h-full rounded-full', card.progressColor)}
                          initial={isFirstRender.current ? { width: 0 } : false}
                          animate={{ width: `${card.progress}%` }}
                          transition={{ duration: 0.8, ease: 'easeOut' }}
                          style={{
                            boxShadow: `0 0 8px ${card.progressColor.includes('red') ? 'rgba(255,51,102,0.4)' : card.progressColor.includes('yellow') ? 'rgba(234,179,8,0.4)' : 'rgba(0,255,136,0.4)'}`,
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Network indicators */}
                  {card.id === 'network' && card.netIn != null && card.netOut != null && (
                    <div className="mt-3 flex items-center gap-4 text-[10px]">
                      <div className="flex items-center gap-1 text-neon-green">
                        <ArrowDownToLine className="w-3 h-3" />
                        <span className="text-muted-foreground">In:</span>
                        <span className="font-mono">{Math.round(card.netIn)} MB/s</span>
                      </div>
                      <div className="flex items-center gap-1 text-neon-orange">
                        <ArrowUpFromLine className="w-3 h-3" />
                        <span className="text-muted-foreground">Out:</span>
                        <span className="font-mono">{Math.round(card.netOut)} MB/s</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
