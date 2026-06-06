'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { CyberLoader } from '@/components/cyber/loading/cyber-loader';

interface HeatmapCell {
  name: string;
  threats: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

const severityColors = {
  low: 'bg-neon-green/40 hover:bg-neon-green/60 border-neon-green/30',
  medium: 'bg-neon-yellow/40 hover:bg-neon-yellow/60 border-neon-yellow/30',
  high: 'bg-neon-orange/40 hover:bg-neon-orange/60 border-neon-orange/30',
  critical: 'bg-neon-red/40 hover:bg-neon-red/60 border-neon-red/30',
};

const severityGlow = {
  low: 'shadow-[0_0_8px_rgba(0,255,136,0.15)]',
  medium: 'shadow-[0_0_8px_rgba(234,179,8,0.15)]',
  high: 'shadow-[0_0_8px_rgba(249,115,22,0.15)]',
  critical: 'shadow-[0_0_8px_rgba(255,51,102,0.15)]',
};

// Simulated system threat data
const generateHeatmapData = (): HeatmapCell[] => {
  const systems = [
    'Web Server', 'DB Cluster', 'Auth Service', 'API Gateway', 'Load Balancer',
    'Mail Server', 'DNS Server', 'Firewall', 'VPN Gateway', 'File Storage',
    'CDN Edge', 'Container Host', 'CI/CD Pipeline', 'Backup Server', 'Log Aggregator',
    'IAM Service', 'DNS Resolver', 'Proxy Server', 'Scheduler', 'Queue Service',
  ];
  return systems.map(name => {
    const threats = Math.floor(Math.random() * 50);
    const severity: HeatmapCell['severity'] = threats > 35 ? 'critical' : threats > 25 ? 'high' : threats > 12 ? 'medium' : 'low';
    return { name, threats, severity };
  });
};

export function ThreatHeatmap({ className }: { className?: string }) {
  const [data, setData] = useState<HeatmapCell[]>([]);
  const [hoveredCell, setHoveredCell] = useState<HeatmapCell | null>(null);

  useEffect(() => {
    setData(generateHeatmapData());
    // Refresh every 30 seconds
    const interval = setInterval(() => {
      setData(generateHeatmapData());
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  if (data.length === 0) {
    return <CyberLoader variant="grid" size="sm" label="Loading heatmap..." className={className} />;
  }

  const maxThreats = Math.max(...data.map(d => d.threats), 1);

  return (
    <div className={cn('glass-card rounded-xl p-4', className)}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Threat Severity Heatmap</h3>
          <p className="text-[10px] text-muted-foreground mt-0.5">System attack density visualization</p>
        </div>
        <div className="flex items-center gap-2">
          {(['low', 'medium', 'high', 'critical'] as const).map(sev => (
            <div key={sev} className="flex items-center gap-1">
              <div className={cn('w-2 h-2 rounded-sm border', severityColors[sev].split(' ')[0])} />
              <span className="text-[9px] text-muted-foreground capitalize">{sev}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Heatmap grid */}
      <div className="grid grid-cols-5 gap-1.5">
        {data.map((cell, i) => {
          const intensity = Math.max(0.15, cell.threats / maxThreats);
          return (
            <div
              key={i}
              className={cn(
                'relative rounded-md border cursor-pointer transition-all duration-300',
                'heatmap-cell',
                severityColors[cell.severity]
              )}
              style={{ opacity: 0.3 + intensity * 0.7 }}
              onMouseEnter={() => setHoveredCell(cell)}
              onMouseLeave={() => setHoveredCell(null)}
              title={`${cell.name}: ${cell.threats} threats (${cell.severity})`}
            >
              <div className="p-1.5 h-full flex flex-col justify-between min-h-[48px]">
                <span className="text-[8px] font-medium text-foreground/80 truncate leading-tight">{cell.name}</span>
                <span className="text-[10px] font-bold text-foreground/90">{cell.threats}</span>
              </div>

              {/* Pulse for critical cells */}
              {cell.severity === 'critical' && (
                <div className="absolute inset-0 rounded-md animate-ping opacity-10 bg-neon-red" style={{ animationDuration: '3s' }} />
              )}
            </div>
          );
        })}
      </div>

      {/* Tooltip */}
      {hoveredCell && (
        <div className="mt-3 p-2 rounded-lg bg-white/5 border border-cyber-border text-xs">
          <span className="text-foreground font-medium">{hoveredCell.name}</span>
          <span className="text-muted-foreground ml-2">— {hoveredCell.threats} threats detected</span>
          <span className={cn('ml-2 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase',
            hoveredCell.severity === 'critical' ? 'bg-neon-red/15 text-neon-red' :
            hoveredCell.severity === 'high' ? 'bg-neon-orange/15 text-neon-orange' :
            hoveredCell.severity === 'medium' ? 'bg-neon-yellow/15 text-neon-yellow' :
            'bg-neon-green/15 text-neon-green'
          )}>{hoveredCell.severity}</span>
        </div>
      )}
    </div>
  );
}
