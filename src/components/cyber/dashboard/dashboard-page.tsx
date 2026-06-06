'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TiltCard } from '@/components/ui/tilt-card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth-store';
import {
  ShieldAlert,
  ShieldCheck,
  Users,
  Activity,
  TrendingUp,
  TrendingDown,
  Wifi,
  Lock,
  Unlock,
  ShieldBan,
  Play,
  Square,
  Zap,
  Clock,
  LogIn,
  UserCheck,
  AlertTriangle,
  Eye,
  BarChart3,
  FileText,
  MonitorDot,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useAppStore } from '@/store/app-store';
import { LiveTerminal } from '@/components/cyber/dashboard/live-terminal';
import { SystemStatus } from '@/components/cyber/dashboard/system-status';

interface DashboardData {
  totalAlerts: number;
  failedLogins: number;
  activeUsers: number;
  threatLevel: string;
  recentLogs: Array<{
    id: string;
    type: string;
    ipAddress: string;
    details: string;
    severity: string;
    createdAt: string;
  }>;
  threatBreakdown: { critical: number; high: number; medium: number; low: number };
  recentFailedLogins: number;
  recentAttacks: number;
  blockedIPs: number;
  threatScore: number;
  simulationStatus: boolean;
}

interface PersonalData {
  loginHistory: Array<{ id: string; type: string; ipAddress: string; details: string; severity: string; createdAt: string }>;
  personalAlerts: number;
  totalAlerts: number;
  activityLogs: Array<{ id: string; action: string; details: string; createdAt: string }>;
  sessionCount: number;
  recentSecurityLogs: Array<{ id: string; type: string; ipAddress: string; details: string; severity: string; createdAt: string }>;
  failedLogins: number;
  successfulLogins: number;
  user: { name: string; email: string; role: string; lastLogin: string | null };
}

function AnimatedCounter({ target, duration = 1500 }: { target: number; duration?: number }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration]);
  return <span>{count.toLocaleString()}</span>;
}

function ThreatGauge({ score, level }: { score: number; level: string }) {
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;
  const offset = circumference - progress;

  const colorMap: Record<string, { stroke: string; glow: string; text: string }> = {
    Low: { stroke: '#00ff88', glow: 'rgba(0,255,136,0.4)', text: 'text-neon-green' },
    Medium: { stroke: '#eab308', glow: 'rgba(234,179,8,0.4)', text: 'text-neon-yellow' },
    High: { stroke: '#f97316', glow: 'rgba(249,115,22,0.4)', text: 'text-neon-orange' },
    Critical: { stroke: '#ff3366', glow: 'rgba(255,51,102,0.5)', text: 'text-neon-red' },
  };

  const config = colorMap[level] || colorMap.Low;

  return (
    <div className="flex justify-center">
      <div className="relative w-36 h-36">
        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
          <circle cx="50" cy="50" r={radius} fill="none" stroke="rgba(30,41,59,0.5)" strokeWidth="8" strokeLinecap="round" />
          <motion.circle
            cx="50" cy="50" r={radius} fill="none" stroke={config.stroke} strokeWidth="8" strokeLinecap="round"
            strokeDasharray={circumference} initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }} transition={{ duration: 1.5, ease: 'easeOut' }}
            style={{ filter: `drop-shadow(0 0 6px ${config.glow})` }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center rotate-0">
          <motion.span className={cn('text-3xl font-bold', config.text)} key={score} initial={{ scale: 0.8 }} animate={{ scale: 1 }}>
            {score}
          </motion.span>
          <span className="text-[10px] text-muted-foreground mt-0.5">THREAT SCORE</span>
        </div>
      </div>
    </div>
  );
}

const threatLevelConfig: Record<string, { color: string; bg: string; glow: string; icon: React.ElementType }> = {
  Low: { color: 'text-neon-green', bg: 'bg-neon-green/10', glow: '', icon: ShieldCheck },
  Medium: { color: 'text-neon-yellow', bg: 'bg-neon-yellow/10', glow: '', icon: ShieldAlert },
  High: { color: 'text-neon-orange', bg: 'bg-neon-orange/10', glow: 'neon-glow-red', icon: ShieldAlert },
  Critical: { color: 'text-neon-red', bg: 'bg-neon-red/10', glow: 'neon-glow-red', icon: ShieldAlert },
};

// User Dashboard - Simplified personal view
function UserDashboard() {
  const [data, setData] = useState<PersonalData | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthStore();

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/my/activity');
      if (res.ok) setData(await res.json());
    } catch { /* silent */ } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, [fetchData]);

  if (loading || !data) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Card key={i} className="glass-card animate-pulse h-32" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome Banner */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <TiltCard className="glass-card-3d card-float-3d neon-glow-blue">
          <Card className="bg-transparent border-0 shadow-none" style={{ background: 'transparent', boxShadow: 'none', border: 'none' }}>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-neon-blue to-neon-purple flex items-center justify-center text-white text-2xl font-bold">
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground">Welcome back, {user?.name || 'User'}</h2>
                  <p className="text-sm text-muted-foreground">Here is your personal security overview</p>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-neon-green/10 text-neon-green border border-neon-green/20 mt-1 inline-block">
                    USER ACCESS
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TiltCard>
      </motion.div>

      {/* Personal Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: 'Total Logins', value: data.successfulLogins, icon: LogIn, color: 'text-neon-green', bgColor: 'bg-neon-green/10' },
          { title: 'Failed Logins', value: data.failedLogins, icon: AlertTriangle, color: 'text-neon-red', bgColor: 'bg-neon-red/10' },
          { title: 'Sessions', value: data.sessionCount, icon: MonitorDot, color: 'text-neon-blue', bgColor: 'bg-neon-blue/10' },
          { title: 'My Resolved Alerts', value: data.personalAlerts, icon: ShieldCheck, color: 'text-neon-purple', bgColor: 'bg-neon-purple/10' },
        ].map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <motion.div key={stat.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.08 }}>
              <TiltCard className="glass-card group cursor-default" glowColor="rgba(0,212,255,0.15)">
                <Card className="bg-transparent border-0 shadow-none" style={{ background: 'transparent', boxShadow: 'none', border: 'none' }}>
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">{stat.title}</p>
                        <p className="text-3xl font-bold text-foreground"><AnimatedCounter target={stat.value} /></p>
                      </div>
                      <div className={cn('p-2.5 rounded-xl', stat.bgColor)}>
                        <Icon className={cn('w-5 h-5', stat.color)} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TiltCard>
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Login History */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="glass-card-3d card-float-3d h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <LogIn className="w-4 h-4" />
                Login History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
                {data.loginHistory.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">No login history yet</p>
                ) : (
                  data.loginHistory.map((log) => (
                    <div key={log.id} className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.02] hover:bg-white/[0.05] transition-colors">
                      <div className={log.type === 'LOGIN_SUCCESS' ? 'text-neon-green' : 'text-neon-red'}>
                        {log.type === 'LOGIN_SUCCESS' ? <UserCheck className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-foreground">{log.type === 'LOGIN_SUCCESS' ? 'Successful login' : 'Failed login attempt'}</p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-[10px] font-mono text-muted-foreground">{log.ipAddress}</span>
                          <span className="text-[10px] text-muted-foreground">{new Date(log.createdAt).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Activity */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card className="glass-card-3d card-float-3d h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
                {data.activityLogs.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">No recent activity</p>
                ) : (
                  data.activityLogs.map((log) => (
                    <div key={log.id} className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.02] hover:bg-white/[0.05] transition-colors">
                      <Eye className="w-4 h-4 text-neon-blue" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-foreground truncate">{log.details}</p>
                        <span className="text-[10px] text-muted-foreground">{new Date(log.createdAt).toLocaleString()}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* System Health (read-only for User) */}
      <SystemStatus />
    </div>
  );
}

// Analyst Dashboard - Monitoring-focused view
function AnalystDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const { simulationActive, setSimulationActive, addNotification } = useAppStore();

  const fetchDashboard = useCallback(async () => {
    try {
      const res = await fetch('/api/dashboard');
      if (res.ok) {
        const json = await res.json();
        setData(json);
        if (json.simulationStatus !== simulationActive) setSimulationActive(json.simulationStatus);
      }
    } catch { /* silent */ } finally { setLoading(false); }
  }, [simulationActive, setSimulationActive]);

  useEffect(() => {
    fetchDashboard();
    const interval = setInterval(fetchDashboard, 10000);
    return () => clearInterval(interval);
  }, [fetchDashboard]);

  const toggleSimulation = useCallback(async () => {
    try {
      if (simulationActive) {
        await fetch('/api/simulation/engine', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'stop' }) });
        setSimulationActive(false);
        addNotification({ title: 'Simulation Stopped', message: 'Live threat simulation has been stopped', severity: 'low' });
      } else {
        await fetch('/api/simulation/engine', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'start' }) });
        setSimulationActive(true);
        addNotification({ title: 'Simulation Started', message: 'Live threat simulation is now active', severity: 'medium' });
      }
      setTimeout(fetchDashboard, 500);
    } catch { /* silent */ }
  }, [simulationActive, setSimulationActive, addNotification, fetchDashboard]);

  if (loading || !data) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => <Card key={i} className="glass-card animate-pulse h-32" />)}
        </div>
      </div>
    );
  }

  const threatConfig = threatLevelConfig[data.threatLevel] || threatLevelConfig.Low;
  const ThreatIcon = threatConfig.icon;

  const stats = [
    { title: 'Total Alerts', value: data.totalAlerts, icon: ShieldAlert, color: 'text-neon-red', bgColor: 'bg-neon-red/10', change: '+12%', up: true },
    { title: 'Failed Logins', value: data.failedLogins, icon: Unlock, color: 'text-neon-orange', bgColor: 'bg-neon-orange/10', change: '+5%', up: true },
    { title: 'Active Users', value: data.activeUsers, icon: Users, color: 'text-neon-green', bgColor: 'bg-neon-green/10', change: '100%', up: false },
    { title: 'Recent Attacks', value: data.recentAttacks, icon: Activity, color: 'text-neon-purple', bgColor: 'bg-neon-purple/10', change: '-3%', up: false },
    { title: 'Blocked IPs', value: data.blockedIPs, icon: ShieldBan, color: 'text-neon-yellow', bgColor: 'bg-neon-yellow/10', change: `${data.blockedIPs}`, up: data.blockedIPs > 0 },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Analyst Badge */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <TiltCard className="glass-card-3d card-float-3d border-neon-blue/30">
          <Card className="bg-transparent border-0 shadow-none" style={{ background: 'transparent', boxShadow: 'none', border: 'none' }}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-neon-blue/10">
                  <BarChart3 className="w-5 h-5 text-neon-blue" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Analyst Monitoring View</h3>
                  <p className="text-xs text-muted-foreground">Security monitoring dashboard with simulation controls and threat analysis</p>
                </div>
                <span className="ml-auto text-[10px] px-2.5 py-1 rounded-full font-bold bg-neon-blue/10 text-neon-blue border border-neon-blue/20 tracking-wider">
                  ANALYST
                </span>
              </div>
            </CardContent>
          </Card>
        </TiltCard>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <motion.div key={stat.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.08 }}>
              <TiltCard className="glass-card group cursor-default" glowColor="rgba(0,212,255,0.15)">
                <Card className="bg-transparent border-0 shadow-none" style={{background:'transparent',boxShadow:'none',border:'none'}}>
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">{stat.title}</p>
                        <p className="text-3xl font-bold text-foreground"><AnimatedCounter target={stat.value} /></p>
                      </div>
                      <div className={cn('p-2.5 rounded-xl', stat.bgColor)}>
                        <Icon className={cn('w-5 h-5', stat.color)} />
                      </div>
                    </div>
                    <div className="flex items-center gap-1 mt-3 text-xs">
                      {stat.up ? <TrendingUp className="w-3 h-3 text-neon-red" /> : <TrendingDown className="w-3 h-3 text-neon-green" />}
                      <span className={stat.up ? 'text-neon-red' : 'text-neon-green'}>{stat.change}</span>
                      <span className="text-muted-foreground">from last hour</span>
                    </div>
                  </CardContent>
                </Card>
              </TiltCard>
            </motion.div>
          );
        })}
      </div>

      {/* Threat Gauge + Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className={cn('glass-card-3d card-float-3d', threatConfig.glow, data.threatLevel === 'Critical' && 'threat-pulse')}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <Wifi className="w-4 h-4" />
                Threat Level
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ThreatGauge score={data.threatScore} level={data.threatLevel} />
              <div className={cn('flex items-center justify-center gap-3 p-3 rounded-xl', threatConfig.bgColor)}>
                <ThreatIcon className={cn('w-6 h-6', threatConfig.color)} />
                <div>
                  <p className={cn('text-xl font-bold', threatConfig.color)}>{data.threatLevel}</p>
                  <p className="text-[10px] text-muted-foreground">Current threat status</p>
                </div>
              </div>
              <div className="space-y-2 pt-2">
                {Object.entries(data.threatBreakdown).map(([level, count]) => (
                  <div key={level} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className={cn('status-dot', { danger: level === 'Critical', warning: level === 'High', online: level === 'Low', idle: level === 'Medium' })} />
                      <span className="text-muted-foreground">{level}</span>
                    </div>
                    <span className="font-semibold">{count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="lg:col-span-2">
          <Card className="glass-card-3d card-float-3d neon-glow-blue h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Real-Time Activity Feed
                <span className="ml-auto flex items-center gap-1 text-neon-green text-[10px]">
                  <span className="status-dot online" /> LIVE
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
                {data.recentLogs.map((log, idx) => (
                  <motion.div key={log.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05 }}
                    className="flex items-start gap-3 p-3 rounded-lg bg-white/[0.02] hover:bg-white/[0.05] transition-colors border border-transparent hover:border-cyber-border"
                  >
                    <div className={cn('mt-0.5', {
                      'text-neon-red': log.severity === 'Critical' || log.severity === 'High',
                      'text-neon-yellow': log.severity === 'Medium',
                      'text-neon-green': log.severity === 'Low',
                    })}>
                      {log.type.includes('FAIL') || log.type.includes('ATTACK') || log.type.includes('BRUTE') || log.type.includes('SQL') || log.type.includes('XSS') || log.type.includes('PORT_SCAN') || log.type.includes('DDOS') || log.type.includes('MALWARE') || log.type.includes('PHISHING')
                        ? <ShieldAlert className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-foreground truncate">{log.details}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-[10px] text-muted-foreground font-mono">{log.ipAddress}</span>
                        <span className={cn('text-[10px] px-1.5 py-0.5 rounded font-medium', {
                          'bg-neon-red/10 text-neon-red': log.severity === 'Critical',
                          'bg-neon-orange/10 text-neon-orange': log.severity === 'High',
                          'bg-neon-yellow/10 text-neon-yellow': log.severity === 'Medium',
                          'bg-neon-green/10 text-neon-green': log.severity === 'Low',
                        })}>{log.severity}</span>
                        <span className="text-[10px] text-muted-foreground">{new Date(log.createdAt).toLocaleTimeString()}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Live Terminal + System Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <LiveTerminal />
        <div className="space-y-4"><SystemStatus /></div>
      </div>

      {/* Simulation Control */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
        <Card className={cn('glass-card-3d card-float-3d transition-all duration-300', simulationActive ? 'neon-glow-red' : 'neon-glow-green')}>
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className={cn('p-3 rounded-xl', simulationActive ? 'bg-neon-red/10' : 'bg-neon-green/10')}>
                  {simulationActive ? <Zap className="w-6 h-6 text-neon-red" /> : <Lock className="w-6 h-6 text-neon-green" />}
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">{simulationActive ? 'Simulation Active' : 'Live Threat Simulation'}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {simulationActive ? 'Real-time security events are being generated' : 'Start generating simulated security events across all systems'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {simulationActive && (
                  <span className="flex items-center gap-1.5 text-xs text-neon-red">
                    <span className="w-2 h-2 rounded-full bg-neon-red animate-pulse" /> RUNNING
                  </span>
                )}
                <Button onClick={toggleSimulation} className={cn('gap-2 transition-all',
                  simulationActive ? 'bg-neon-red/20 text-neon-red border border-neon-red/30 hover:bg-neon-red/30' : 'bg-neon-green/20 text-neon-green border border-neon-green/30 hover:bg-neon-green/30'
                )}>
                  {simulationActive ? <><Square className="w-4 h-4" /> Stop Simulation</> : <><Play className="w-4 h-4" /> Start Live Simulation</>}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

// Admin Dashboard - Full control view (original dashboard)
function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const { simulationActive, setSimulationActive, addNotification } = useAppStore();

  const fetchDashboard = useCallback(async () => {
    try {
      const res = await fetch('/api/dashboard');
      if (res.ok) {
        const json = await res.json();
        setData(json);
        if (json.simulationStatus !== simulationActive) setSimulationActive(json.simulationStatus);
      }
    } catch { /* silent */ } finally { setLoading(false); }
  }, [simulationActive, setSimulationActive]);

  useEffect(() => {
    fetchDashboard();
    const interval = setInterval(fetchDashboard, 10000);
    return () => clearInterval(interval);
  }, [fetchDashboard]);

  const toggleSimulation = useCallback(async () => {
    try {
      if (simulationActive) {
        await fetch('/api/simulation/engine', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'stop' }) });
        setSimulationActive(false);
        addNotification({ title: 'Simulation Stopped', message: 'Live threat simulation has been stopped', severity: 'low' });
      } else {
        await fetch('/api/simulation/engine', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'start' }) });
        setSimulationActive(true);
        addNotification({ title: 'Simulation Started', message: 'Live threat simulation is now active', severity: 'medium' });
      }
      setTimeout(fetchDashboard, 500);
    } catch { /* silent */ }
  }, [simulationActive, setSimulationActive, addNotification, fetchDashboard]);

  if (loading || !data) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => <Card key={i} className="glass-card animate-pulse h-32" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <Card key={i} className="glass-card animate-pulse h-64" />)}
        </div>
      </div>
    );
  }

  const threatConfig = threatLevelConfig[data.threatLevel] || threatLevelConfig.Low;
  const ThreatIcon = threatConfig.icon;

  const stats = [
    { title: 'Total Alerts', value: data.totalAlerts, icon: ShieldAlert, color: 'text-neon-red', bgColor: 'bg-neon-red/10', change: '+12%', up: true },
    { title: 'Failed Logins', value: data.failedLogins, icon: Unlock, color: 'text-neon-orange', bgColor: 'bg-neon-orange/10', change: '+5%', up: true },
    { title: 'Active Users', value: data.activeUsers, icon: Users, color: 'text-neon-green', bgColor: 'bg-neon-green/10', change: '100%', up: false },
    { title: 'Recent Attacks', value: data.recentAttacks, icon: Activity, color: 'text-neon-purple', bgColor: 'bg-neon-purple/10', change: '-3%', up: false },
    { title: 'Blocked IPs', value: data.blockedIPs, icon: ShieldBan, color: 'text-neon-yellow', bgColor: 'bg-neon-yellow/10', change: `${data.blockedIPs}`, up: data.blockedIPs > 0 },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Admin Badge */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="glass-card-3d card-float-3d border-neon-red/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-neon-red/10">
                <ShieldBan className="w-5 h-5 text-neon-red" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">System Administrator View</h3>
                <p className="text-xs text-muted-foreground">Full SOC control with simulation, firewall, and user management access</p>
              </div>
              <span className="ml-auto text-[10px] px-2.5 py-1 rounded-full font-bold bg-neon-red/10 text-neon-red border border-neon-red/20 tracking-wider">
                ADMIN
              </span>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <motion.div key={stat.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.08 }}>
              <TiltCard className="glass-card group cursor-default" glowColor="rgba(0,212,255,0.15)">
                <Card className="bg-transparent border-0 shadow-none" style={{background:'transparent',boxShadow:'none',border:'none'}}>
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">{stat.title}</p>
                        <p className="text-3xl font-bold text-foreground"><AnimatedCounter target={stat.value} /></p>
                      </div>
                      <div className={cn('p-2.5 rounded-xl', stat.bgColor)}>
                        <Icon className={cn('w-5 h-5', stat.color)} />
                      </div>
                    </div>
                    <div className="flex items-center gap-1 mt-3 text-xs">
                      {stat.up ? <TrendingUp className="w-3 h-3 text-neon-red" /> : <TrendingDown className="w-3 h-3 text-neon-green" />}
                      <span className={stat.up ? 'text-neon-red' : 'text-neon-green'}>{stat.change}</span>
                      <span className="text-muted-foreground">from last hour</span>
                    </div>
                  </CardContent>
                </Card>
              </TiltCard>
            </motion.div>
          );
        })}
      </div>

      {/* Threat Gauge + Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className={cn('glass-card-3d card-float-3d', threatConfig.glow, data.threatLevel === 'Critical' && 'threat-pulse')}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <Wifi className="w-4 h-4" /> Threat Level
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ThreatGauge score={data.threatScore} level={data.threatLevel} />
              <div className={cn('flex items-center justify-center gap-3 p-3 rounded-xl', threatConfig.bgColor)}>
                <ThreatIcon className={cn('w-6 h-6', threatConfig.color)} />
                <div>
                  <p className={cn('text-xl font-bold', threatConfig.color)}>{data.threatLevel}</p>
                  <p className="text-[10px] text-muted-foreground">Current threat status</p>
                </div>
              </div>
              <div className="space-y-2 pt-2">
                {Object.entries(data.threatBreakdown).map(([level, count]) => (
                  <div key={level} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className={cn('status-dot', { danger: level === 'Critical', warning: level === 'High', online: level === 'Low', idle: level === 'Medium' })} />
                      <span className="text-muted-foreground">{level}</span>
                    </div>
                    <span className="font-semibold">{count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="lg:col-span-2">
          <Card className="glass-card-3d card-float-3d neon-glow-blue h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <Activity className="w-4 h-4" /> Real-Time Activity Feed
                <span className="ml-auto flex items-center gap-1 text-neon-green text-[10px]">
                  <span className="status-dot online" /> LIVE
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
                {data.recentLogs.map((log, idx) => (
                  <motion.div key={log.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05 }}
                    className="flex items-start gap-3 p-3 rounded-lg bg-white/[0.02] hover:bg-white/[0.05] transition-colors border border-transparent hover:border-cyber-border"
                  >
                    <div className={cn('mt-0.5', {
                      'text-neon-red': log.severity === 'Critical' || log.severity === 'High',
                      'text-neon-yellow': log.severity === 'Medium',
                      'text-neon-green': log.severity === 'Low',
                    })}>
                      {log.type.includes('FAIL') || log.type.includes('ATTACK') || log.type.includes('BRUTE') || log.type.includes('SQL') || log.type.includes('XSS') || log.type.includes('PORT_SCAN') || log.type.includes('DDOS') || log.type.includes('MALWARE') || log.type.includes('PHISHING')
                        ? <ShieldAlert className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-foreground truncate">{log.details}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-[10px] text-muted-foreground font-mono">{log.ipAddress}</span>
                        <span className={cn('text-[10px] px-1.5 py-0.5 rounded font-medium', {
                          'bg-neon-red/10 text-neon-red': log.severity === 'Critical',
                          'bg-neon-orange/10 text-neon-orange': log.severity === 'High',
                          'bg-neon-yellow/10 text-neon-yellow': log.severity === 'Medium',
                          'bg-neon-green/10 text-neon-green': log.severity === 'Low',
                        })}>{log.severity}</span>
                        <span className="text-[10px] text-muted-foreground">{new Date(log.createdAt).toLocaleTimeString()}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Live Terminal + System Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <LiveTerminal />
        <div className="space-y-4"><SystemStatus /></div>
      </div>

      {/* Simulation Control */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
        <Card className={cn('glass-card-3d card-float-3d transition-all duration-300', simulationActive ? 'neon-glow-red' : 'neon-glow-green')}>
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className={cn('p-3 rounded-xl', simulationActive ? 'bg-neon-red/10' : 'bg-neon-green/10')}>
                  {simulationActive ? <Zap className="w-6 h-6 text-neon-red" /> : <Lock className="w-6 h-6 text-neon-green" />}
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">{simulationActive ? 'Simulation Active' : 'Live Threat Simulation'}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {simulationActive ? 'Real-time security events are being generated' : 'Start generating simulated security events across all systems'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {simulationActive && (
                  <span className="flex items-center gap-1.5 text-xs text-neon-red">
                    <span className="w-2 h-2 rounded-full bg-neon-red animate-pulse" /> RUNNING
                  </span>
                )}
                <Button onClick={toggleSimulation} className={cn('gap-2 transition-all',
                  simulationActive ? 'bg-neon-red/20 text-neon-red border border-neon-red/30 hover:bg-neon-red/30' : 'bg-neon-green/20 text-neon-green border border-neon-green/30 hover:bg-neon-green/30'
                )}>
                  {simulationActive ? <><Square className="w-4 h-4" /> Stop Simulation</> : <><Play className="w-4 h-4" /> Start Live Simulation</>}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

// Main DashboardPage - Routes to role-specific dashboard
export function DashboardPage() {
  const { user } = useAuthStore();
  const role = user?.role;

  switch (role) {
    case 'Admin':
      return <AdminDashboard />;
    case 'Analyst':
      return <AnalystDashboard />;
    default:
      return <UserDashboard />;
  }
}
