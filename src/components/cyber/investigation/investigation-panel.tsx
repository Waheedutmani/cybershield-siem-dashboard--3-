'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import {
  X, Shield, AlertTriangle, Globe, Clock, FileText, Activity,
  ChevronRight, ExternalLink, Server, Wifi, Zap, Lock
} from 'lucide-react';

export interface InvestigationAlert {
  id: string;
  title: string;
  severity: string;
  timestamp: string;
  sourceIP?: string;
  targetSystem?: string;
  type?: string;
  description?: string;
}

interface InvestigationPanelProps {
  alert: InvestigationAlert;
  onClose: () => void;
}

// Simulated investigation data
function generateInvestigation(alert: InvestigationAlert) {
  const now = new Date();
  const severity = alert.severity || 'Medium';

  return {
    timeline: [
      { time: '-2h 15m', event: 'First anomaly detected in network traffic', status: 'info' },
      { time: '-1h 48m', event: `Source IP ${alert.sourceIP || '192.168.1.x'} flagged for suspicious behavior`, status: 'warning' },
      { time: '-1h 30m', event: `Attack pattern matched: ${alert.type || 'Unknown'}`, status: 'danger' },
      { time: '-1h 12m', event: 'Intrusion detection system triggered alert', status: 'danger' },
      { time: '-58m', event: `Target: ${alert.targetSystem || 'Internal Server'}`, status: 'warning' },
      { time: '-45m', event: 'Automated firewall rules applied', status: 'success' },
      { time: '-30m', event: 'Threat containment in progress', status: 'info' },
      { time: '-12m', event: 'Incident escalated to SOC team', status: 'info' },
    ],
    affectedSystems: [
      { name: alert.targetSystem || 'Web Server A', status: 'compromised', icon: Server },
      { name: 'Database Cluster', status: 'monitoring', icon: Database },
      { name: 'Auth Service', status: 'secured', icon: Lock },
      { name: 'API Gateway', status: 'monitoring', icon: Wifi },
    ] as const,
    aiAnalysis: severity === 'Critical' || severity === 'High'
      ? `This incident indicates a potential ${alert.type || 'coordinated attack'} targeting ${alert.targetSystem || 'internal infrastructure'}. The attack pattern suggests automated reconnaissance followed by exploitation attempt. Immediate recommended actions: (1) Isolate affected systems, (2) Block source IP ${alert.sourceIP || 'range'}, (3) Rotate credentials for compromised services, (4) Review recent access logs for lateral movement indicators.`
      : `This alert indicates suspicious activity from ${alert.sourceIP || 'external source'}. The threat level is ${severity?.toLowerCase() || 'moderate'}. Monitor closely for escalation. Recommended: Review access logs, verify system integrity, update firewall rules if pattern persists.`,
    recommendedActions: severity === 'Critical' || severity === 'High'
      ? [
          { action: 'Isolate affected systems immediately', priority: 'critical', icon: Shield },
          { action: `Block source IP: ${alert.sourceIP || 'Pending'}`, priority: 'critical', icon: Zap },
          { action: 'Reset credentials for compromised services', priority: 'high', icon: Lock },
          { action: 'Enable enhanced monitoring on target', priority: 'high', icon: Activity },
          { action: 'Generate forensic snapshot', priority: 'medium', icon: FileText },
          { action: 'Notify security team lead', priority: 'medium', icon: ExternalLink },
        ]
      : [
          { action: 'Monitor source IP for escalation', priority: 'medium', icon: Activity },
          { action: 'Review recent access logs', priority: 'medium', icon: FileText },
          { action: 'Update firewall rules if needed', priority: 'low', icon: Shield },
          { action: 'Document incident for audit trail', priority: 'low', icon: FileText },
        ],
  };
}

function Database(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
      <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
    </svg>
  );
}

const priorityColors = {
  critical: 'text-neon-red bg-neon-red/10 border-neon-red/20',
  high: 'text-neon-orange bg-neon-orange/10 border-neon-orange/20',
  medium: 'text-neon-yellow bg-neon-yellow/10 border-neon-yellow/20',
  low: 'text-neon-green bg-neon-green/10 border-neon-green/20',
};

const statusColors = {
  info: 'text-neon-blue',
  warning: 'text-neon-yellow',
  danger: 'text-neon-red',
  success: 'text-neon-green',
};

export function InvestigationPanel({ alert, onClose }: InvestigationPanelProps) {
  const [data, setData] = useState<ReturnType<typeof generateInvestigation> | null>(null);
  const [activeTab, setActiveTab] = useState<'timeline' | 'systems' | 'actions'>('timeline');

  useEffect(() => {
    setData(generateInvestigation(alert));
  }, [alert]);

  if (!data) return null;

  const tabs = [
    { id: 'timeline' as const, label: 'Attack Timeline', icon: Clock },
    { id: 'systems' as const, label: 'Affected Systems', icon: Server },
    { id: 'actions' as const, label: 'Actions', icon: Shield },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 investigation-overlay">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-3xl max-h-[85vh] glass-card-3d rounded-2xl overflow-hidden flex flex-col investigation-panel-enter">
        {/* Header */}
        <div className="px-5 py-4 border-b border-cyber-border/50 flex items-start justify-between flex-shrink-0" style={{ background: 'linear-gradient(135deg, rgba(0,212,255,0.05), transparent)' }}>
          <div className="flex items-start gap-3">
            <div className={cn(
              'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border',
              alert.severity === 'Critical' ? 'bg-neon-red/15 border-neon-red/30' :
              alert.severity === 'High' ? 'bg-neon-orange/15 border-neon-orange/30' :
              alert.severity === 'Medium' ? 'bg-neon-yellow/15 border-neon-yellow/30' :
              'bg-neon-green/15 border-neon-green/30'
            )}>
              <AlertTriangle className={cn(
                'w-5 h-5',
                alert.severity === 'Critical' ? 'text-neon-red' :
                alert.severity === 'High' ? 'text-neon-orange' :
                alert.severity === 'Medium' ? 'text-neon-yellow' : 'text-neon-green'
              )} />
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground">Incident Investigation</h2>
              <p className="text-sm text-muted-foreground mt-0.5">{alert.title}</p>
              <div className="flex items-center gap-3 mt-1.5">
                <span className={cn('text-[10px] px-2 py-0.5 rounded-full font-bold tracking-wider border', priorityColors[(alert.severity?.toLowerCase() || 'medium') as keyof typeof priorityColors])}>
                  {alert.severity?.toUpperCase()}
                </span>
                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {alert.timestamp}
                </span>
                {alert.sourceIP && (
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <Globe className="w-3 h-3" /> {alert.sourceIP}
                  </span>
                )}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="px-5 pt-3 flex gap-1 border-b border-cyber-border/30 flex-shrink-0">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-t-lg transition-all',
                  activeTab === tab.id
                    ? 'text-neon-blue bg-neon-blue/5 border-b-2 border-neon-blue'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* AI Analysis */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-neon-blue/5 to-neon-purple/5 border border-neon-blue/10">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-5 h-5 rounded-md bg-gradient-to-br from-neon-blue to-neon-purple flex items-center justify-center">
                <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M12 2a4 4 0 0 1 4 4v2a4 4 0 0 1-8 0V6a4 4 0 0 1 4-4z" />
                  <path d="M16 11a4 4 0 0 1 0 8H8a4 4 0 0 1 0-8" />
                </svg>
              </div>
              <span className="text-xs font-semibold text-neon-blue">ARIA AI Analysis</span>
            </div>
            <p className="text-xs text-foreground/80 leading-relaxed">{data.aiAnalysis}</p>
          </div>

          {/* Tab Content */}
          {activeTab === 'timeline' && (
            <div className="space-y-0">
              <h4 className="text-xs font-semibold text-muted-foreground mb-3 tracking-wider">ATTACK TIMELINE</h4>
              <div className="relative pl-4 border-l border-cyber-border/50 space-y-4">
                {data.timeline.map((entry, i) => (
                  <div key={i} className="relative investigation-timeline-item">
                    <div className={cn(
                      'absolute -left-[21px] w-2.5 h-2.5 rounded-full border-2 border-cyber-dark',
                      entry.status === 'danger' ? 'bg-neon-red' :
                      entry.status === 'warning' ? 'bg-neon-yellow' :
                      entry.status === 'success' ? 'bg-neon-green' : 'bg-neon-blue'
                    )} />
                    <div className="flex items-start gap-3">
                      <span className="text-[10px] text-muted-foreground font-mono w-16 flex-shrink-0 pt-0.5">{entry.time}</span>
                      <span className={cn('text-xs', statusColors[entry.status])}>{entry.event}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'systems' && (
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-muted-foreground mb-3 tracking-wider">AFFECTED SYSTEMS</h4>
              {data.affectedSystems.map((sys, i) => {
                const Icon = sys.icon;
                return (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-white/3 border border-cyber-border/30 hover:bg-white/5 transition-all">
                    <Icon className="w-4 h-4 text-muted-foreground" />
                    <span className="text-xs text-foreground flex-1">{sys.name}</span>
                    <span className={cn(
                      'text-[10px] px-2 py-0.5 rounded-full font-medium border',
                      sys.status === 'compromised' ? 'text-neon-red bg-neon-red/10 border-neon-red/20' :
                      sys.status === 'monitoring' ? 'text-neon-yellow bg-neon-yellow/10 border-neon-yellow/20' :
                      'text-neon-green bg-neon-green/10 border-neon-green/20'
                    )}>{sys.status}</span>
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === 'actions' && (
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-muted-foreground mb-3 tracking-wider">RECOMMENDED ACTIONS</h4>
              {data.recommendedActions.map((action, i) => {
                const Icon = action.icon;
                return (
                  <button key={i} className="w-full flex items-center gap-3 p-3 rounded-lg bg-white/3 border border-cyber-border/30 hover:bg-white/5 transition-all text-left group">
                    <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center border', priorityColors[action.priority])}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs text-foreground flex-1">{action.action}</span>
                    <ChevronRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
