'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import {
  ShieldBan,
  Plus,
  Trash2,
  Search,
  ShieldAlert,
  ShieldCheck,
  Bot,
  User,
} from 'lucide-react';
import { useAppStore } from '@/store/app-store';

interface BlockedIPItem {
  id: string;
  ipAddress: string;
  reason: string;
  severity: string;
  blockedBy: string | null;
  autoBlocked: boolean;
  createdAt: string;
}

export function FirewallPage() {
  const { addNotification } = useAppStore();
  const [blockedIPs, setBlockedIPs] = useState<BlockedIPItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [newIp, setNewIp] = useState('');
  const [newReason, setNewReason] = useState('');
  const [newSeverity, setNewSeverity] = useState('Medium');
  const [blocking, setBlocking] = useState(false);
  const [unblocking, setUnblocking] = useState<string | null>(null);

  const limit = 20;

  const fetchBlockedIPs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });
      if (search) params.set('search', search);
      if (severityFilter) params.set('severity', severityFilter);

      const res = await fetch(`/api/firewall?${params}`);
      if (res.ok) {
        const data = await res.json();
        setBlockedIPs(data.blockedIPs);
        setTotal(data.total);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [page, search, severityFilter]);

  useEffect(() => {
    fetchBlockedIPs();
  }, [fetchBlockedIPs]);

  const handleBlock = async () => {
    if (!newIp.trim()) return;
    setBlocking(true);
    try {
      const res = await fetch('/api/firewall', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ip: newIp, reason: newReason || 'Manual block', severity: newSeverity }),
      });
      if (res.ok) {
        setNewIp('');
        setNewReason('');
        setNewSeverity('Medium');
        addNotification({
          title: 'IP Blocked',
          message: `${newIp} has been blocked`,
          severity: 'medium',
        });
        fetchBlockedIPs();
      } else {
        const data = await res.json();
        addNotification({
          title: 'Block Failed',
          message: data.error || 'Failed to block IP',
          severity: 'high',
        });
      }
    } catch {
      addNotification({
        title: 'Error',
        message: 'Failed to block IP',
        severity: 'high',
      });
    } finally {
      setBlocking(false);
    }
  };

  const handleUnblock = async (ip: string) => {
    setUnblocking(ip);
    try {
      const res = await fetch('/api/firewall', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ip }),
      });
      if (res.ok) {
        addNotification({
          title: 'IP Unblocked',
          message: `${ip} has been unblocked`,
          severity: 'low',
        });
        fetchBlockedIPs();
      }
    } catch {
      // silent
    } finally {
      setUnblocking(null);
    }
  };

  const totalPages = Math.ceil(total / limit);

  const severityStats = {
    Critical: blockedIPs.filter((b) => b.severity === 'Critical').length,
    High: blockedIPs.filter((b) => b.severity === 'High').length,
    Medium: blockedIPs.filter((b) => b.severity === 'Medium').length,
    Low: blockedIPs.filter((b) => b.severity === 'Low').length,
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <ShieldBan className="w-6 h-6 text-neon-purple" />
            Firewall & IP Blocking
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage blocked IP addresses and firewall rules
          </p>
        </div>
        <Badge variant="outline" className="border-neon-purple/30 text-neon-purple">
          {total} IPs blocked
        </Badge>
      </div>

      {/* Stats + Block Form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Block IP Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="glass-card neon-glow-purple">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Block New IP
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input
                placeholder="IP Address (e.g. 192.168.1.1)"
                value={newIp}
                onChange={(e) => setNewIp(e.target.value)}
                className="bg-cyber-dark border-cyber-border text-sm"
              />
              <Input
                placeholder="Reason for blocking"
                value={newReason}
                onChange={(e) => setNewReason(e.target.value)}
                className="bg-cyber-dark border-cyber-border text-sm"
              />
              <div className="flex gap-2">
                {['Low', 'Medium', 'High', 'Critical'].map((sev) => (
                  <button
                    key={sev}
                    onClick={() => setNewSeverity(sev)}
                    className={cn(
                      'flex-1 text-[10px] py-1.5 rounded-md border transition-all',
                      newSeverity === sev
                        ? {
                            'bg-neon-red/10 border-neon-red/30 text-neon-red': sev === 'Critical',
                            'bg-neon-orange/10 border-neon-orange/30 text-neon-orange': sev === 'High',
                            'bg-neon-yellow/10 border-neon-yellow/30 text-neon-yellow': sev === 'Medium',
                            'bg-neon-green/10 border-neon-green/30 text-neon-green': sev === 'Low',
                          }
                        : 'bg-cyber-dark border-cyber-border text-muted-foreground hover:text-foreground'
                    )}
                  >
                    {sev}
                  </button>
                ))}
              </div>
              <Button
                onClick={handleBlock}
                disabled={blocking || !newIp.trim()}
                className="w-full bg-neon-purple/20 text-neon-purple border border-neon-purple/30 hover:bg-neon-purple/30 gap-2"
              >
                <ShieldBan className="w-4 h-4" />
                {blocking ? 'Blocking...' : 'Block IP'}
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Severity Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-2"
        >
          <Card className="glass-card h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <ShieldAlert className="w-4 h-4" />
                Blocked IP Severity Distribution
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(severityStats).map(([level, count]) => {
                const pct = total > 0 ? (count / total) * 100 : 0;
                const barColor = {
                  Critical: 'bg-neon-red',
                  High: 'bg-neon-orange',
                  Medium: 'bg-neon-yellow',
                  Low: 'bg-neon-green',
                }[level];
                return (
                  <div key={level} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className={cn('status-dot', {
                          danger: level === 'Critical',
                          warning: level === 'High',
                          idle: level === 'Medium',
                          online: level === 'Low',
                        })} />
                        <span className="text-muted-foreground">{level}</span>
                      </div>
                      <span className="font-semibold">{count}</span>
                    </div>
                    <div className="h-2 bg-cyber-dark rounded-full overflow-hidden">
                      <motion.div
                        className={cn('h-full rounded-full', barColor)}
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.8 }}
                      />
                    </div>
                  </div>
                );
              })}

              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-3 pt-4 border-t border-cyber-border">
                <div className="p-3 rounded-lg bg-white/[0.02]">
                  <p className="text-[10px] text-muted-foreground uppercase">Auto-blocked</p>
                  <p className="text-lg font-bold text-neon-purple mt-1">
                    {blockedIPs.filter((b) => b.autoBlocked).length}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-white/[0.02]">
                  <p className="text-[10px] text-muted-foreground uppercase">Manual</p>
                  <p className="text-lg font-bold text-neon-blue mt-1">
                    {blockedIPs.filter((b) => !b.autoBlocked).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search blocked IPs..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-9 bg-cyber-dark border-cyber-border text-sm"
          />
        </div>
        <div className="flex gap-2">
          {['', 'Critical', 'High', 'Medium', 'Low'].map((sev) => (
            <Button
              key={sev}
              variant="outline"
              size="sm"
              onClick={() => { setSeverityFilter(sev); setPage(1); }}
              className={cn(
                'text-xs',
                severityFilter === sev
                  ? 'bg-neon-blue/10 text-neon-blue border-neon-blue/30'
                  : 'border-cyber-border text-muted-foreground'
              )}
            >
              {sev || 'All'}
            </Button>
          ))}
        </div>
      </div>

      {/* Blocked IPs Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="glass-card">
          <CardContent className="p-0">
            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-pulse text-muted-foreground">Loading...</div>
              </div>
            ) : blockedIPs.length === 0 ? (
              <div className="p-8 text-center">
                <ShieldCheck className="w-12 h-12 text-neon-green/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No blocked IPs found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-cyber-border hover:bg-transparent">
                      <TableHead className="text-muted-foreground">IP Address</TableHead>
                      <TableHead className="text-muted-foreground">Reason</TableHead>
                      <TableHead className="text-muted-foreground">Severity</TableHead>
                      <TableHead className="text-muted-foreground">Blocked By</TableHead>
                      <TableHead className="text-muted-foreground">Date</TableHead>
                      <TableHead className="text-muted-foreground text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {blockedIPs.map((item) => (
                      <TableRow key={item.id} className="border-cyber-border hover:bg-white/[0.02]">
                        <TableCell className="font-mono text-xs text-neon-blue">{item.ipAddress}</TableCell>
                        <TableCell className="text-xs text-muted-foreground max-w-[250px] truncate">{item.reason}</TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={cn('text-[9px]', {
                              'border-neon-red/30 text-neon-red': item.severity === 'Critical',
                              'border-neon-orange/30 text-neon-orange': item.severity === 'High',
                              'border-neon-yellow/30 text-neon-yellow': item.severity === 'Medium',
                              'border-neon-green/30 text-neon-green': item.severity === 'Low',
                            })}
                          >
                            {item.severity}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs">
                          <div className="flex items-center gap-1.5">
                            {item.autoBlocked ? (
                              <Bot className="w-3 h-3 text-neon-purple" />
                            ) : (
                              <User className="w-3 h-3 text-neon-blue" />
                            )}
                            <span className="text-muted-foreground">
                              {item.autoBlocked ? 'Auto' : item.blockedBy || 'System'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {new Date(item.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUnblock(item.ipAddress)}
                            disabled={unblocking === item.ipAddress}
                            className="text-xs text-neon-red border-neon-red/20 hover:bg-neon-red/10 hover:text-neon-red gap-1"
                          >
                            <Trash2 className="w-3 h-3" />
                            {unblocking === item.ipAddress ? '...' : 'Unblock'}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-cyber-border">
                <p className="text-xs text-muted-foreground">
                  Showing {((page - 1) * limit) + 1}-{Math.min(page * limit, total)} of {total}
                </p>
                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className="text-xs border-cyber-border"
                  >
                    Prev
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(Math.min(totalPages, page + 1))}
                    disabled={page === totalPages}
                    className="text-xs border-cyber-border"
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
