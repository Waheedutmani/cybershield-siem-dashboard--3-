'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Globe,
  Play,
  Square,
  ShieldAlert,
  Zap,
  Crosshair,
} from 'lucide-react';
import { useAppStore } from '@/store/app-store';

interface AttackPoint {
  id: string;
  x: number;
  y: number;
  severity: string;
  type: string;
  ip: string;
  region: string;
  timestamp: Date;
}

const regionNames: Record<string, string> = {
  'North America': 'North America',
  'South America': 'South America',
  'Europe': 'Europe',
  'Africa': 'Africa',
  'Asia': 'Asia',
  'Oceania': 'Oceania',
};

const regionCenters: Record<string, { x: number; y: number }> = {
  'North America': { x: 200, y: 160 },
  'South America': { x: 280, y: 340 },
  'Europe': { x: 500, y: 140 },
  'Africa': { x: 520, y: 280 },
  'Asia': { x: 720, y: 170 },
  'Oceania': { x: 830, y: 370 },
};

// Simplified world map paths (mercator-like projection)
const continentPaths = [
  // North America
  { name: 'North America', d: 'M 130 80 L 145 60 L 180 55 L 210 60 L 240 70 L 270 90 L 285 120 L 280 150 L 260 170 L 240 190 L 220 200 L 195 210 L 170 220 L 155 200 L 140 180 L 125 160 L 115 130 L 110 100 Z', color: 'rgba(0,212,255,0.08)', stroke: 'rgba(0,212,255,0.2)' },
  // South America
  { name: 'South America', d: 'M 240 240 L 260 230 L 285 235 L 300 260 L 310 290 L 315 320 L 310 350 L 295 380 L 275 400 L 260 410 L 250 395 L 245 365 L 235 335 L 228 305 L 225 275 L 230 250 Z', color: 'rgba(0,212,255,0.08)', stroke: 'rgba(0,212,255,0.2)' },
  // Europe
  { name: 'Europe', d: 'M 440 55 L 460 50 L 490 48 L 520 55 L 545 65 L 555 80 L 550 100 L 540 120 L 525 135 L 510 145 L 490 150 L 470 148 L 450 140 L 440 120 L 435 100 L 438 75 Z', color: 'rgba(0,212,255,0.08)', stroke: 'rgba(0,212,255,0.2)' },
  // Africa
  { name: 'Africa', d: 'M 450 170 L 480 160 L 510 165 L 535 175 L 550 195 L 555 225 L 555 260 L 548 295 L 535 325 L 515 345 L 495 355 L 475 350 L 460 330 L 450 300 L 445 265 L 442 230 L 443 200 Z', color: 'rgba(0,212,255,0.08)', stroke: 'rgba(0,212,255,0.2)' },
  // Asia
  { name: 'Asia', d: 'M 560 50 L 600 40 L 650 35 L 700 40 L 745 55 L 780 75 L 800 100 L 810 130 L 805 160 L 790 185 L 770 200 L 740 210 L 710 215 L 680 210 L 650 200 L 625 185 L 605 165 L 585 140 L 570 115 L 560 90 L 558 65 Z', color: 'rgba(0,212,255,0.08)', stroke: 'rgba(0,212,255,0.2)' },
  // Oceania
  { name: 'Oceania', d: 'M 770 310 L 800 300 L 835 305 L 855 320 L 860 345 L 850 370 L 835 385 L 810 390 L 785 380 L 770 360 L 765 340 Z', color: 'rgba(0,212,255,0.08)', stroke: 'rgba(0,212,255,0.2)' },
];

function randomRegion(): string {
  const regions = Object.keys(regionCenters);
  return regions[Math.floor(Math.random() * regions.length)];
}

function randomIp(): string {
  return `${Math.floor(Math.random() * 223) + 1}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}`;
}

const attackTypes = ['brute_force', 'sql_injection', 'xss', 'port_scan', 'ddos_attempt', 'malware_detection', 'phishing', 'unauthorized_access'];

function getSeverityColor(severity: string) {
  switch (severity) {
    case 'Critical': return { fill: '#ff3366', glow: 'rgba(255,51,102,0.6)' };
    case 'High': return { fill: '#f97316', glow: 'rgba(249,115,22,0.5)' };
    case 'Medium': return { fill: '#eab308', glow: 'rgba(234,179,8,0.4)' };
    default: return { fill: '#00ff88', glow: 'rgba(0,255,136,0.4)' };
  }
}

export function AttackMapPage() {
  const { simulationActive, setSimulationActive, addNotification } = useAppStore();
  const [attacks, setAttacks] = useState<AttackPoint[]>([]);
  const [regionCounts, setRegionCounts] = useState<Record<string, number>>({});
  const [totalAttacks, setTotalAttacks] = useState(0);
  const [isStarting, setIsStarting] = useState(false);

  const toggleSimulation = useCallback(async () => {
    setIsStarting(true);
    try {
      if (simulationActive) {
        await fetch('/api/simulation/engine', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'stop' }),
        });
        setSimulationActive(false);
      } else {
        const res = await fetch('/api/simulation/engine', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'start' }),
        });
        if (res.ok) {
          setSimulationActive(true);
          addNotification({
            title: 'Simulation Started',
            message: 'Live threat simulation is now active',
            severity: 'medium',
          });
        }
      }
    } catch {
      // silent
    } finally {
      setIsStarting(false);
    }
  }, [simulationActive, setSimulationActive, addNotification]);

  // Fetch recent attacks from logs
  useEffect(() => {
    const fetchAttacks = async () => {
      try {
        const res = await fetch('/api/logs?limit=30');
        if (res.ok) {
          const data = await res.json();
          const logAttacks: AttackPoint[] = data.logs
            .filter((log: { type: string }) =>
              !['LOGIN_SUCCESS', 'LOGIN_FAILED'].includes(log.type)
            )
            .slice(0, 20)
            .map((log: { id: string; ipAddress: string; type: string; severity: string; createdAt: string }) => {
              const region = randomRegion();
              const center = regionCenters[region];
              return {
                id: log.id,
                x: center.x + (Math.random() - 0.5) * 60,
                y: center.y + (Math.random() - 0.5) * 60,
                severity: log.severity,
                type: log.type,
                ip: log.ipAddress,
                region,
                timestamp: new Date(log.createdAt),
              };
            });
          setAttacks(logAttacks);

          const counts: Record<string, number> = {};
          logAttacks.forEach((a: AttackPoint) => {
            counts[a.region] = (counts[a.region] || 0) + 1;
          });
          setRegionCounts(counts);
          setTotalAttacks(logAttacks.length);
        }
      } catch {
        // silent
      }
    };
    fetchAttacks();
  }, []);

  // Poll for new data when simulation is active
  useEffect(() => {
    if (!simulationActive) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/logs?limit=5');
        if (res.ok) {
          const data = await res.json();
          const newAttacks: AttackPoint[] = data.logs
            .filter((log: { type: string }) =>
              !['LOGIN_SUCCESS', 'LOGIN_FAILED'].includes(log.type)
            )
            .slice(0, 3)
            .map((log: { id: string; ipAddress: string; type: string; severity: string; createdAt: string }) => {
              const region = randomRegion();
              const center = regionCenters[region];
              return {
                id: log.id,
                x: center.x + (Math.random() - 0.5) * 60,
                y: center.y + (Math.random() - 0.5) * 60,
                severity: log.severity,
                type: log.type,
                ip: log.ipAddress,
                region,
                timestamp: new Date(log.createdAt),
              };
            });

          if (newAttacks.length > 0) {
            setAttacks((prev) => {
              const existingIds = new Set(prev.map((a) => a.id));
              const uniqueNew = newAttacks.filter((a) => !existingIds.has(a.id));
              return [...uniqueNew, ...prev].slice(0, 50);
            });

            setRegionCounts((prev) => {
              const next = { ...prev };
              newAttacks.forEach((a) => {
                next[a.region] = (next[a.region] || 0) + 1;
              });
              return next;
            });

            setTotalAttacks((prev) => prev + newAttacks.length);
          }
        }
      } catch {
        // silent
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [simulationActive]);

  // Generate animated attack arc paths between pairs of attack points
  const attackArcs = useMemo(() => {
    const points = attacks.slice(0, 8);
    const arcs: { id: string; d: string; color: string }[] = [];
    for (let i = 0; i < points.length - 1; i += 2) {
      const from = points[i];
      const to = points[i + 1];
      if (!from || !to) continue;
      const mx = (from.x + to.x) / 2;
      const my = (from.y + to.y) / 2;
      // Offset control point perpendicular to the line for a nice arc
      const dx = to.x - from.x;
      const dy = to.y - from.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const bulge = Math.min(dist * 0.35, 80);
      const cx = mx - (dy / dist) * bulge;
      const cy = my + (dx / dist) * bulge;
      arcs.push({
        id: `arc-${from.id}-${to.id}`,
        d: `M ${from.x} ${from.y} Q ${cx} ${cy} ${to.x} ${to.y}`,
        color: getSeverityColor(from.severity).fill,
      });
    }
    return arcs;
  }, [attacks]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Globe className="w-6 h-6 text-neon-blue" />
            Global Attack Map
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time visualization of global threat activity
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="border-neon-blue/30 text-neon-blue">
            {totalAttacks} attacks tracked
          </Badge>
          <Button
            onClick={toggleSimulation}
            disabled={isStarting}
            className={cn(
              'gap-2 transition-all',
              simulationActive
                ? 'bg-neon-red/20 text-neon-red border border-neon-red/30 hover:bg-neon-red/30'
                : 'bg-neon-green/20 text-neon-green border border-neon-green/30 hover:bg-neon-green/30'
            )}
          >
            {simulationActive ? (
              <>
                <Square className="w-4 h-4" />
                Stop Simulation
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                Start Live Simulation
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Map + Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Map */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-3"
        >
          <Card className="glass-card-3d neon-glow-blue globe-3d-container overflow-hidden">
            <CardContent className="p-0">
              <svg
                viewBox="0 0 1000 500"
                className="globe-3d globe-glow w-full h-auto min-h-[300px] sm:min-h-[400px] lg:min-h-[500px]"
                style={{ background: 'linear-gradient(180deg, #0a0e1a 0%, #0f1629 100%)' }}
              >
                {/* Grid lines - enhanced 3D */}
                <defs>
                  <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse" className="map-grid-3d">
                    <path d="M 50 0 L 0 0 0 50" fill="none" stroke="rgba(0,212,255,0.07)" strokeWidth="0.8" />
                  </pattern>
                </defs>
                <rect width="1000" height="500" fill="url(#grid)" className="map-grid-3d" />

                {/* Continent paths - 3D glow */}
                {continentPaths.map((continent) => (
                  <g key={continent.name} className="map-glow continent-glow-3d">
                    <path
                      d={continent.d}
                      fill={continent.color}
                      stroke={continent.stroke}
                      strokeWidth="1"
                    />
                  </g>
                ))}

                {/* Attack points */}
                <AnimatePresence>
                  {attacks.slice(0, 30).map((attack) => {
                    const colors = getSeverityColor(attack.severity);
                    return (
                      <g key={attack.id}>
                        {/* Ping ring - primary */}
                        <circle
                          cx={attack.x}
                          cy={attack.y}
                          r="6"
                          fill="none"
                          stroke={colors.fill}
                          strokeWidth="1"
                          opacity="0.6"
                        >
                          <animate
                            attributeName="r"
                            from="4"
                            to="20"
                            dur="2s"
                            repeatCount="indefinite"
                          />
                          <animate
                            attributeName="opacity"
                            from="0.6"
                            to="0"
                            dur="2s"
                            repeatCount="indefinite"
                          />
                        </circle>
                        {/* Ping ring - secondary outer ring with delayed animation */}
                        <circle
                          cx={attack.x}
                          cy={attack.y}
                          r="6"
                          fill="none"
                          stroke={colors.fill}
                          strokeWidth="0.5"
                          opacity="0.3"
                        >
                          <animate
                            attributeName="r"
                            from="4"
                            to="28"
                            dur="2.8s"
                            begin="0.6s"
                            repeatCount="indefinite"
                          />
                          <animate
                            attributeName="opacity"
                            from="0.3"
                            to="0"
                            dur="2.8s"
                            begin="0.6s"
                            repeatCount="indefinite"
                          />
                        </circle>
                        {/* Core dot - depth pulse */}
                        <circle
                          className="threat-depth-pulse"
                          cx={attack.x}
                          cy={attack.y}
                          r="3"
                          fill={colors.fill}
                          style={{ filter: `drop-shadow(0 0 4px ${colors.glow})` }}
                        />
                      </g>
                    );
                  })}
                </AnimatePresence>

                {/* Animated attack arcs between attack point pairs */}
                <g>
                  {attackArcs.map((arc) => (
                    <path
                      key={arc.id}
                      d={arc.d}
                      fill="none"
                      stroke={arc.color}
                      strokeWidth="1"
                      opacity="0"
                      className="attack-arc-animated"
                      strokeDasharray="6 4"
                    >
                      <animate
                        attributeName="opacity"
                        values="0;0.5;0.3;0.5;0"
                        dur="3s"
                        repeatCount="indefinite"
                      />
                      <animate
                        attributeName="stroke-dashoffset"
                        from="0"
                        to="40"
                        dur="2s"
                        repeatCount="indefinite"
                      />
                    </path>
                  ))}
                </g>

                {/* Legend */}
                <g transform="translate(20, 460)">
                  <circle cx="5" cy="5" r="4" fill="#ff3366" />
                  <text x="15" y="9" fill="#94a3b8" fontSize="10">Critical</text>
                  <circle cx="85" cy="5" r="4" fill="#f97316" />
                  <text x="95" y="9" fill="#94a3b8" fontSize="10">High</text>
                  <circle cx="145" cy="5" r="4" fill="#eab308" />
                  <text x="155" y="9" fill="#94a3b8" fontSize="10">Medium</text>
                  <circle cx="220" cy="5" r="4" fill="#00ff88" />
                  <text x="230" y="9" fill="#94a3b8" fontSize="10">Low</text>
                </g>
              </svg>
            </CardContent>
          </Card>
        </motion.div>

        {/* Region Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="glass-card-3d analytics-panel-3d h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <Crosshair className="w-4 h-4" />
                Attacks by Region
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(regionCenters).map(([region, center]) => {
                const count = regionCounts[region] || 0;
                const maxCount = Math.max(...Object.values(regionCounts), 1);
                const pct = (count / maxCount) * 100;
                return (
                  <div key={region} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">{region}</span>
                      <span className={cn('font-semibold', count > 0 ? 'text-neon-blue' : 'text-muted-foreground')}>
                        {count}
                      </span>
                    </div>
                    <div className="h-1.5 bg-cyber-dark rounded-full overflow-hidden">
                      <motion.div
                        className="h-full rounded-full bg-neon-blue/60"
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.8 }}
                      />
                    </div>
                  </div>
                );
              })}

              <div className="pt-4 border-t border-cyber-border">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Active Types</span>
                  <span className="text-neon-purple font-semibold">{attackTypes.length}</span>
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {attackTypes.slice(0, 5).map((type) => (
                    <Badge key={type} variant="outline" className="text-[9px] px-1.5 py-0 border-cyber-border text-muted-foreground">
                      {type.replace('_', ' ')}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Recent Attack Feed */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="glass-card-3d">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <ShieldAlert className="w-4 h-4" />
              Recent Attack Feed
              {simulationActive && (
                <span className="ml-auto flex items-center gap-1 text-neon-green text-[10px]">
                  <Zap className="w-3 h-3" />
                  LIVE
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
              {attacks.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No attacks detected. Start simulation to generate activity.
                </p>
              ) : (
                attacks.slice(0, 15).map((attack, idx) => {
                  const colors = getSeverityColor(attack.severity);
                  return (
                    <motion.div
                      key={attack.id}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.03 }}
                      className="alert-float-3d flex items-center gap-3 p-2 rounded-lg bg-white/[0.02] hover:bg-white/[0.05] transition-colors"
                    >
                      <div
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: colors.fill, boxShadow: `0 0 6px ${colors.glow}` }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-foreground truncate">
                          {attack.type.replace(/_/g, ' ')} from {attack.ip}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {attack.region} · {attack.timestamp.toLocaleTimeString()}
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className="text-[9px] px-1.5 py-0 flex-shrink-0"
                        style={{ borderColor: colors.fill + '40', color: colors.fill }}
                      >
                        {attack.severity}
                      </Badge>
                    </motion.div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
