'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MonitorDot,
  Globe,
  Clock,
  Smartphone,
  Monitor,
  Laptop,
  Trash2,
  Users,
  Wifi,
  WifiOff,
  Shield,
  Eye,
} from 'lucide-react';

interface SessionData {
  id: string;
  userId: string;
  userName: string;
  email: string;
  role: string;
  ipAddress: string;
  browser: string;
  os: string;
  device: string;
  loginTime: string;
  lastActivity: string;
  duration: number;
  isActive: boolean;
}

function getDeviceIcon(device: string) {
  switch (device.toLowerCase()) {
    case 'desktop': return Monitor;
    case 'laptop': return Laptop;
    case 'mobile': return Smartphone;
    default: return Monitor;
  }
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
}

function formatRelativeTime(isoStr: string): string {
  const diff = Date.now() - new Date(isoStr).getTime();
  if (diff < 60000) return 'just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
}

export function SessionsPage() {
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ activeCount: 0, totalSessions: 0 });

  const fetchSessions = useCallback(async () => {
    try {
      const res = await fetch('/api/sessions');
      if (res.ok) {
        const data = await res.json();
        setSessions(data.sessions);
        setStats({ activeCount: data.activeCount, totalSessions: data.totalSessions });
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
    const interval = setInterval(fetchSessions, 15000);
    return () => clearInterval(interval);
  }, [fetchSessions]);

  const killSession = async (sessionId: string) => {
    try {
      const res = await fetch(`/api/sessions?id=${sessionId}`, { method: 'DELETE' });
      if (res.ok) {
        setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      }
    } catch {
      // silent
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="glass-card animate-pulse h-24" />
          ))}
        </div>
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="glass-card animate-pulse h-28" />
          ))}
        </div>
      </div>
    );
  }

  const activeSessions = sessions.filter((s) => s.isActive);
  const inactiveSessions = sessions.filter((s) => !s.isActive);

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <Card className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-neon-green/10">
                  <Users className="w-5 h-5 text-neon-green" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Total Sessions</p>
                  <p className="text-2xl font-bold text-foreground">{stats.totalSessions}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="glass-card neon-glow-green">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-neon-green/10">
                  <Wifi className="w-5 h-5 text-neon-green" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Active Now</p>
                  <p className="text-2xl font-bold text-neon-green">{stats.activeCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Card className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-neon-red/10">
                  <WifiOff className="w-5 h-5 text-neon-red" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Inactive</p>
                  <p className="text-2xl font-bold text-neon-red">{stats.totalSessions - stats.activeCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Active Sessions */}
      <Card className="glass-card neon-glow-green">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <Wifi className="w-4 h-4 text-neon-green" />
            Active Sessions
            <span className="ml-auto flex items-center gap-1.5 text-neon-green text-[10px]">
              <span className="w-2 h-2 rounded-full bg-neon-green live-pulse" />
              LIVE
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <AnimatePresence mode="popLayout">
            {activeSessions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <MonitorDot className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p className="text-sm">No active sessions</p>
              </div>
            ) : (
              <div className="space-y-3">
                {activeSessions.map((session, idx) => {
                  const DeviceIcon = getDeviceIcon(session.device);
                  return (
                    <motion.div
                      key={session.id}
                      layout
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05, duration: 0.3 }}
                      className="flex items-center gap-4 p-4 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] transition-colors border border-neon-green/10"
                    >
                      <div className="p-2.5 rounded-xl bg-neon-green/10">
                        <DeviceIcon className="w-5 h-5 text-neon-green" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold text-foreground">{session.userName}</p>
                          <Badge className="text-[9px] h-4 bg-neon-blue/10 text-neon-blue border-neon-blue/20">{session.role}</Badge>
                          <span className="flex items-center gap-1 text-[10px] text-neon-green">
                            <span className="w-1.5 h-1.5 rounded-full bg-neon-green live-pulse" />
                            Online
                          </span>
                        </div>
                        <div className="flex items-center gap-4 mt-1.5 text-[11px] text-muted-foreground flex-wrap">
                          <span className="flex items-center gap-1">
                            <Globe className="w-3 h-3" />
                            <span className="font-mono">{session.ipAddress}</span>
                          </span>
                          <span>{session.browser}</span>
                          <span>{session.os}</span>
                          <span>{session.device}</span>
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-[10px] text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Duration: <span className="font-mono">{formatDuration(session.duration)}</span>
                          </span>
                          <span>Last activity: {formatRelativeTime(session.lastActivity)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-muted-foreground hidden lg:block">{session.email}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => killSession(session.id)}
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-neon-red hover:bg-neon-red/10"
                          title="Terminate session"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>

      {/* Inactive Sessions */}
      {inactiveSessions.length > 0 && (
        <Card className="glass-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <WifiOff className="w-4 h-4 text-muted-foreground" />
              Inactive Sessions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {inactiveSessions.map((session, idx) => {
                const DeviceIcon = getDeviceIcon(session.device);
                return (
                  <motion.div
                    key={session.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05, duration: 0.2 }}
                    className="flex items-center gap-4 p-3.5 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] transition-colors border border-cyber-border/50 opacity-70"
                  >
                    <div className="p-2 rounded-xl bg-white/5">
                      <DeviceIcon className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm text-muted-foreground">{session.userName}</p>
                        <Badge variant="outline" className="text-[9px] h-4 border-cyber-border text-muted-foreground">{session.role}</Badge>
                        <span className="text-[10px] text-muted-foreground/60">Offline</span>
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-[10px] text-muted-foreground/60">
                        <span className="font-mono">{session.ipAddress}</span>
                        <span>{session.browser}</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatRelativeTime(session.lastActivity)}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Session Info Footer */}
      <Card className="glass-card">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Eye className="w-4 h-4" />
            <span>Session data refreshes every 15 seconds. Click the terminate button to end a session.</span>
            <Shield className="w-4 h-4 ml-auto" />
            <span>Admins can terminate any session</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
