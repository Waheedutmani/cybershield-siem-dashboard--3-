'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import {
  Activity,
  Users,
  LogIn,
  XCircle,
  Clock,
  Globe,
  ShieldAlert,
  ShieldCheck,
  TrendingUp,
  ArrowUpDown,
  User,
} from 'lucide-react';

interface MonitoringUser {
  userId: string;
  name: string;
  email: string;
  role: string;
  status: string;
  loginCount: number;
  failedLoginCount: number;
  lastLogin: string | null;
  ipHistory: string[];
  recentLogins: number;
  recentFailed: number;
  riskScore: number;
  riskLevel: string;
}

type SortField = 'name' | 'loginCount' | 'failedLoginCount' | 'riskScore';
type SortDir = 'asc' | 'desc';

function getRiskConfig(riskLevel: string, riskScore: number) {
  if (riskLevel === 'High') {
    return {
      color: 'text-neon-red',
      bg: 'bg-neon-red/10',
      border: 'border-neon-red/30',
      barColor: 'bg-neon-red',
      glow: 'neon-glow-red',
      icon: ShieldAlert,
    };
  }
  if (riskLevel === 'Medium') {
    return {
      color: 'text-neon-yellow',
      bg: 'bg-neon-yellow/10',
      border: 'border-neon-yellow/30',
      barColor: 'bg-neon-yellow',
      glow: '',
      icon: Activity,
    };
  }
  return {
    color: 'text-neon-green',
    bg: 'bg-neon-green/10',
    border: 'border-neon-green/30',
    barColor: 'bg-neon-green',
    glow: 'neon-glow-green',
    icon: ShieldCheck,
  };
}

export function MonitoringPage() {
  const [users, setUsers] = useState<MonitoringUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortField, setSortField] = useState<SortField>('riskScore');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [view, setView] = useState<'cards' | 'table'>('cards');

  const fetchMonitoring = useCallback(async () => {
    try {
      const res = await fetch('/api/monitoring');
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMonitoring();
    const interval = setInterval(fetchMonitoring, 15000);
    return () => clearInterval(interval);
  }, [fetchMonitoring]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  const sortedUsers = [...users].sort((a, b) => {
    const aVal = a[sortField];
    const bVal = b[sortField];
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
    }
    return sortDir === 'asc'
      ? String(aVal).localeCompare(String(bVal))
      : String(bVal).localeCompare(String(aVal));
  });

  // Aggregate stats
  const totalUsers = users.length;
  const highRiskCount = users.filter((u) => u.riskLevel === 'High').length;
  const avgRisk = users.length > 0
    ? Math.round(users.reduce((s, u) => s + u.riskScore, 0) / users.length)
    : 0;
  const totalFailed = users.reduce((s, u) => s + u.failedLoginCount, 0);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="glass-card animate-pulse h-28" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(2)].map((_, i) => (
            <Card key={i} className="glass-card animate-pulse h-48" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Activity className="w-6 h-6 text-neon-green" />
            User Behavior Monitoring
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Track user activity, login patterns, and risk indicators
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setView('cards')}
            className={cn(
              'text-xs',
              view === 'cards' ? 'bg-neon-blue/10 text-neon-blue border-neon-blue/30' : 'border-cyber-border text-muted-foreground'
            )}
          >
            Cards
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setView('table')}
            className={cn(
              'text-xs',
              view === 'table' ? 'bg-neon-blue/10 text-neon-blue border-neon-blue/30' : 'border-cyber-border text-muted-foreground'
            )}
          >
            Table
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Users', value: totalUsers, icon: Users, color: 'text-neon-blue', bg: 'bg-neon-blue/10' },
          { label: 'High Risk', value: highRiskCount, icon: ShieldAlert, color: 'text-neon-red', bg: 'bg-neon-red/10' },
          { label: 'Avg Risk Score', value: avgRisk, icon: Activity, color: 'text-neon-yellow', bg: 'bg-neon-yellow/10' },
          { label: 'Total Failed Logins', value: totalFailed, icon: XCircle, color: 'text-neon-orange', bg: 'bg-neon-orange/10' },
        ].map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <Card className="glass-card hover:neon-glow-blue transition-all duration-300">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{stat.label}</p>
                      <p className={cn('text-2xl font-bold mt-1', stat.color)}>{stat.value}</p>
                    </div>
                    <div className={cn('p-2 rounded-lg', stat.bg)}>
                      <Icon className={cn('w-4 h-4', stat.color)} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Cards View */}
      {view === 'cards' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sortedUsers.map((user, idx) => {
            const risk = getRiskConfig(user.riskLevel, user.riskScore);
            const RiskIcon = risk.icon;

            return (
              <motion.div
                key={user.userId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Card className={cn('glass-card hover:neon-glow-blue transition-all duration-300', risk.glow && user.riskLevel === 'High' && risk.glow)}>
                  <CardContent className="p-5 space-y-4">
                    {/* User Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', risk.bg)}>
                          <User className={cn('w-5 h-5', risk.color)} />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-foreground">{user.name}</p>
                          <p className="text-[10px] text-muted-foreground">{user.email}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-cyber-border text-muted-foreground">
                              {user.role}
                            </Badge>
                            <Badge variant="outline" className={cn('text-[9px] px-1.5 py-0 border', risk.border, risk.color)}>
                              {user.status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1">
                          <RiskIcon className={cn('w-3.5 h-3.5', risk.color)} />
                          <span className={cn('text-lg font-bold', risk.color)}>{user.riskScore}</span>
                        </div>
                        <p className="text-[9px] text-muted-foreground">Risk Score</p>
                      </div>
                    </div>

                    {/* Risk Bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] text-muted-foreground">
                        <span>Risk Level</span>
                        <span className={risk.color}>{user.riskLevel}</span>
                      </div>
                      <div className="h-1.5 bg-cyber-dark rounded-full overflow-hidden">
                        <motion.div
                          className={cn('h-full rounded-full', risk.barColor)}
                          initial={{ width: 0 }}
                          animate={{ width: `${user.riskScore}%` }}
                          transition={{ duration: 1 }}
                        />
                      </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-2.5 rounded-lg bg-white/[0.02]">
                        <div className="flex items-center gap-1.5">
                          <LogIn className="w-3 h-3 text-neon-green" />
                          <span className="text-[10px] text-muted-foreground">Logins</span>
                        </div>
                        <p className="text-sm font-semibold mt-0.5">{user.loginCount}</p>
                        {user.recentLogins > 0 && (
                          <p className="text-[9px] text-neon-green">+{user.recentLogins} recent</p>
                        )}
                      </div>
                      <div className="p-2.5 rounded-lg bg-white/[0.02]">
                        <div className="flex items-center gap-1.5">
                          <XCircle className="w-3 h-3 text-neon-red" />
                          <span className="text-[10px] text-muted-foreground">Failed</span>
                        </div>
                        <p className="text-sm font-semibold mt-0.5">{user.failedLoginCount}</p>
                        {user.recentFailed > 0 && (
                          <p className="text-[9px] text-neon-red">+{user.recentFailed} recent</p>
                        )}
                      </div>
                    </div>

                    {/* Last Login + IPs */}
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never'}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Globe className="w-3 h-3" />
                        <span>{user.ipHistory.length} IPs</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="glass-card">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-cyber-border">
                      {[
                        { field: 'name' as SortField, label: 'User' },
                        { field: 'loginCount' as SortField, label: 'Logins' },
                        { field: 'failedLoginCount' as SortField, label: 'Failed' },
                        { field: 'riskScore' as SortField, label: 'Risk' },
                      ].map((col) => (
                        <th
                          key={col.field}
                          className="text-left text-xs text-muted-foreground uppercase tracking-wider px-4 py-3 cursor-pointer hover:text-foreground transition-colors"
                          onClick={() => toggleSort(col.field)}
                        >
                          <div className="flex items-center gap-1">
                            {col.label}
                            <ArrowUpDown className={cn('w-3 h-3', sortField === col.field ? 'text-neon-blue' : 'opacity-30')} />
                          </div>
                        </th>
                      ))}
                      <th className="text-left text-xs text-muted-foreground uppercase tracking-wider px-4 py-3">Last Login</th>
                      <th className="text-left text-xs text-muted-foreground uppercase tracking-wider px-4 py-3">IPs</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedUsers.map((user) => {
                      const risk = getRiskConfig(user.riskLevel, user.riskScore);
                      return (
                        <tr key={user.userId} className="border-b border-cyber-border/50 hover:bg-white/[0.02]">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className={cn('w-7 h-7 rounded-md flex items-center justify-center', risk.bg)}>
                                <User className={cn('w-3.5 h-3.5', risk.color)} />
                              </div>
                              <div>
                                <p className="text-xs font-medium text-foreground">{user.name}</p>
                                <p className="text-[10px] text-muted-foreground">{user.role}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-xs">{user.loginCount}</td>
                          <td className="px-4 py-3">
                            <span className={cn('text-xs', user.failedLoginCount > 5 ? 'text-neon-red' : user.failedLoginCount > 0 ? 'text-neon-yellow' : 'text-neon-green')}>
                              {user.failedLoginCount}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-16 h-1.5 bg-cyber-dark rounded-full overflow-hidden">
                                <div
                                  className={cn('h-full rounded-full', risk.barColor)}
                                  style={{ width: `${user.riskScore}%` }}
                                />
                              </div>
                              <span className={cn('text-xs font-semibold', risk.color)}>{user.riskScore}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-[10px] text-muted-foreground">
                            {user.lastLogin ? new Date(user.lastLogin).toLocaleString() : '-'}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-1 flex-wrap">
                              {user.ipHistory.slice(0, 2).map((ip) => (
                                <Badge key={ip} variant="outline" className="text-[9px] px-1 py-0 border-cyber-border text-muted-foreground font-mono">
                                  {ip}
                                </Badge>
                              ))}
                              {user.ipHistory.length > 2 && (
                                <Badge variant="outline" className="text-[9px] px-1 py-0 border-cyber-border text-muted-foreground">
                                  +{user.ipHistory.length - 2}
                                </Badge>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
