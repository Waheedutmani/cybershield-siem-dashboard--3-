'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  ShieldCheck,
  ShieldAlert,
  Lock,
  Clock,
  LogIn,
  LogOut,
  Bell,
  Settings,
  User,
  TrendingUp,
  Eye,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/store/auth-store';
import { useAppStore } from '@/store/app-store';

interface MyData {
  profile: { id: string; name: string; email: string; role: string };
  stats: { totalLogins: number; failedLogins: number; recentLogins: number };
  loginHistory: Array<{ id: string; type: string; ipAddress: string; details: string; severity: string; createdAt: string }>;
  activityLog: Array<{ id: string; action: string; details: string; createdAt: string }>;
  recentAlerts: Array<{ id: string; title: string; severity: string; status: string; createdAt: string }>;
}

function AnimatedCounter({ target, duration = 1200 }: { target: number; duration?: number }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration]);
  return <span>{count.toLocaleString()}</span>;
}

export function UserDashboardPage() {
  const { user } = useAuthStore();
  const { setCurrentPage } = useAppStore();
  const [data, setData] = useState<MyData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchMyData = useCallback(async () => {
    try {
      const res = await fetch('/api/my/activity');
      if (res.ok) setData(await res.json());
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchMyData(); const interval = setInterval(fetchMyData, 15000); return () => clearInterval(interval); }, [fetchMyData]);

  if (loading || !data) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">{[...Array(3)].map((_, i) => <Card key={i} className="glass-card animate-pulse h-28" />)}</div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">{[...Array(2)].map((_, i) => <Card key={i} className="glass-card animate-pulse h-64" />)}</div>
      </div>
    );
  }

  const stats = [
    { title: 'Total Logins', value: data.stats.totalLogins, icon: LogIn, color: 'text-neon-blue', bg: 'bg-neon-blue/10' },
    { title: 'Failed Attempts', value: data.stats.failedLogins, icon: ShieldAlert, color: 'text-neon-red', bg: 'bg-neon-red/10' },
    { title: 'Logins (7d)', value: data.stats.recentLogins, icon: TrendingUp, color: 'text-neon-green', bg: 'bg-neon-green/10' },
  ];

  const getLogIcon = (type: string) => {
    if (type === 'LOGIN_SUCCESS') return <LogIn className="w-4 h-4 text-neon-green" />;
    if (type === 'LOGIN_FAILED') return <ShieldAlert className="w-4 h-4 text-neon-red" />;
    if (type === 'LOGOUT') return <LogOut className="w-4 h-4 text-muted-foreground" />;
    return <Clock className="w-4 h-4 text-muted-foreground" />;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome Banner */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="glass-card neon-glow-green">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-neon-green to-neon-blue flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div>
                <h2 className="text-lg font-bold text-foreground">Welcome back, {user?.name}</h2>
                <p className="text-sm text-muted-foreground">Your personal security dashboard</p>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-neon-green/10 text-neon-green font-bold">{user?.role}</span>
                  <span className="text-xs text-muted-foreground">{user?.email}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <motion.div key={stat.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.08 }}>
              <Card className="glass-card hover:neon-glow-blue transition-all duration-300">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">{stat.title}</p>
                      <p className="text-3xl font-bold text-foreground mt-1"><AnimatedCounter target={stat.value} /></p>
                    </div>
                    <div className={cn('p-2.5 rounded-xl', stat.bg)}><Icon className={cn('w-5 h-5', stat.color)} /></div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Login History */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="glass-card h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <Clock className="w-4 h-4" /> Login History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
                {data.loginHistory.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">No login history yet</p>
                ) : data.loginHistory.slice(0, 15).map((log, idx) => (
                  <motion.div key={log.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.03 }}
                    className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.02] hover:bg-white/[0.05] transition-colors">
                    {getLogIcon(log.type)}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-foreground">{log.details}</p>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-[10px] font-mono text-muted-foreground">{log.ipAddress}</span>
                        <span className="text-[10px] text-muted-foreground">{new Date(log.createdAt).toLocaleString()}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Alerts */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <Card className="glass-card h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <Bell className="w-4 h-4" /> Security Notifications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {data.recentAlerts.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">No recent alerts</p>
                ) : data.recentAlerts.map((alert, idx) => (
                  <motion.div key={alert.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.04 }}
                    className="flex items-start gap-3 p-3 rounded-lg bg-white/[0.02] hover:bg-white/[0.05] transition-colors">
                    <div className={cn('mt-0.5', {
                      'text-neon-red': alert.severity === 'Critical' || alert.severity === 'High',
                      'text-neon-yellow': alert.severity === 'Medium',
                      'text-neon-green': alert.severity === 'Low',
                    })}>
                      <ShieldAlert className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-foreground truncate">{alert.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={cn('text-[9px] px-1.5 py-0.5 rounded font-medium', {
                          'bg-neon-red/10 text-neon-red': alert.severity === 'Critical',
                          'bg-neon-orange/10 text-neon-orange': alert.severity === 'High',
                          'bg-neon-yellow/10 text-neon-yellow': alert.severity === 'Medium',
                          'bg-neon-green/10 text-neon-green': alert.severity === 'Low',
                        })}>{alert.severity}</span>
                        <span className="text-[10px] text-muted-foreground">{new Date(alert.createdAt).toLocaleString()}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <Button onClick={() => setCurrentPage('settings')} variant="outline" className="gap-2 border-cyber-border bg-cyber-dark text-foreground hover:bg-white/5 flex-1">
                <Settings className="w-4 h-4" /> Account Settings
              </Button>
              <Button onClick={() => setCurrentPage('settings')} variant="outline" className="gap-2 border-cyber-border bg-cyber-dark text-foreground hover:bg-white/5 flex-1">
                <Lock className="w-4 h-4" /> Change Password
              </Button>
              <Button variant="outline" className="gap-2 border-neon-green/30 bg-neon-green/5 text-neon-green hover:bg-neon-green/10 flex-1">
                <Eye className="w-4 h-4" /> View Profile
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
