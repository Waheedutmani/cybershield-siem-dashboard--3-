'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, ShieldAlert, CheckCircle2, Clock, Eye, Filter, Download, Brain } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AttackDetailModal } from '@/components/cyber/alerts/attack-detail-modal';

interface Alert {
  id: string;
  title: string;
  description: string;
  severity: string;
  status: string;
  sourceIp: string | null;
  createdAt: string;
}

const severityConfig: Record<string, { color: string; bg: string; border: string; icon: React.ElementType }> = {
  Critical: { color: 'text-neon-red', bg: 'bg-neon-red/10', border: 'border-neon-red/30', icon: ShieldAlert },
  High: { color: 'text-neon-orange', bg: 'bg-neon-orange/10', border: 'border-neon-orange/30', icon: AlertTriangle },
  Medium: { color: 'text-neon-yellow', bg: 'bg-neon-yellow/10', border: 'border-neon-yellow/30', icon: AlertTriangle },
  Low: { color: 'text-neon-green', bg: 'bg-neon-green/10', border: 'border-neon-green/30', icon: CheckCircle2 },
};

const statusConfig: Record<string, { color: string; bg: string; icon: React.ElementType }> = {
  New: { color: 'text-neon-blue', bg: 'bg-neon-blue/10', icon: Clock },
  Investigating: { color: 'text-neon-yellow', bg: 'bg-neon-yellow/10', icon: Eye },
  Resolved: { color: 'text-neon-green', bg: 'bg-neon-green/10', icon: CheckCircle2 },
};

export function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [severityFilter, setSeverityFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [exporting, setExporting] = useState(false);

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (severityFilter && severityFilter !== 'all') params.set('severity', severityFilter);
      if (statusFilter && statusFilter !== 'all') params.set('status', statusFilter);

      const res = await fetch(`/api/alerts?${params}`);
      if (res.ok) {
        const data = await res.json();
        setAlerts(data.alerts);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [severityFilter, statusFilter]);

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 8000);
    return () => clearInterval(interval);
  }, [fetchAlerts]);

  const updateAlertStatus = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/alerts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        setAlerts((prev) =>
          prev.map((a) => (a.id === id ? { ...a, status } : a))
        );
      }
    } catch {
      // silent
    }
  };

  const handleAlertClick = (alert: Alert) => {
    setSelectedAlert(alert);
    setDetailOpen(true);
  };

  const handleStatusChange = (id: string, status: string) => {
    updateAlertStatus(id, status);
    if (selectedAlert && selectedAlert.id === id) {
      setSelectedAlert({ ...selectedAlert, status });
    }
  };

  const handleExport = async (type: string) => {
    setExporting(true);
    try {
      const params = new URLSearchParams({ type, format: 'csv' });
      if (severityFilter && severityFilter !== 'all') params.set('severity', severityFilter);
      if (statusFilter && statusFilter !== 'all') params.set('status', statusFilter);
      const res = await fetch(`/api/export?${params}`);
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `cybershield-${type}-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch {
      // silent
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Filters + Export */}
      <Card className="glass-card-3d analytics-panel-3d corner-frame">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger className="w-full sm:w-36 bg-cyber-dark border-cyber-border text-foreground">
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent className="bg-cyber-card border-cyber-border">
                <SelectItem value="all">All Severity</SelectItem>
                <SelectItem value="Critical">Critical</SelectItem>
                <SelectItem value="High">High</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="Low">Low</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-40 bg-cyber-dark border-cyber-border text-foreground">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="bg-cyber-card border-cyber-border">
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="New">New</SelectItem>
                <SelectItem value="Investigating">Investigating</SelectItem>
                <SelectItem value="Resolved">Resolved</SelectItem>
              </SelectContent>
            </Select>
            <span className="ml-auto text-xs text-muted-foreground">
              {alerts.length} alert(s)
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport('alerts')}
                disabled={exporting}
                className="gap-1.5 border-cyber-border bg-cyber-dark text-foreground hover:bg-white/5 text-xs h-8"
              >
                <Download className="w-3 h-3" />
                CSV
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport('report')}
                disabled={exporting}
                className="gap-1.5 border-neon-blue/30 bg-neon-blue/5 text-neon-blue hover:bg-neon-blue/10 text-xs h-8"
              >
                <Brain className="w-3 h-3" />
                Full Report
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alert Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <AnimatePresence mode="popLayout">
          {loading ? (
            [...Array(4)].map((_, i) => (
              <Card key={i} className="glass-card animate-pulse h-40" />
            ))
          ) : alerts.length === 0 ? (
            <div className="col-span-full text-center py-16 text-muted-foreground">
              <ShieldAlert className="w-16 h-16 mx-auto mb-4 opacity-20" />
              <p className="text-lg">No alerts found</p>
              <p className="text-sm mt-1">All clear for now. Stay vigilant!</p>
            </div>
          ) : (
            alerts.map((alert, idx) => {
              const sev = severityConfig[alert.severity] || severityConfig.Low;
              const stat = statusConfig[alert.status] || statusConfig.New;
              const SevIcon = sev.icon;
              const StatIcon = stat.icon;

              return (
                <motion.div
                  key={alert.id}
                  layout
                  initial={{ opacity: 0, y: 30, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: idx * 0.05, duration: 0.3 }}
                >
                  <Card
                    className={cn('glass-card-3d alert-float-3d press-3d cursor-pointer alert-severity-border-' + alert.severity.toLowerCase(), {
                      'neon-glow-red': alert.severity === 'Critical' && alert.status !== 'Resolved',
                      'neon-glow-blue': alert.severity === 'High' && alert.status !== 'Resolved',
                    })}
                    onClick={() => handleAlertClick(alert)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <div className={cn('p-2 rounded-lg mt-0.5', sev.bg)}>
                            <SevIcon className={cn('w-4 h-4', sev.color)} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-semibold text-foreground truncate">{alert.title}</h3>
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{alert.description}</p>
                            <div className="flex items-center gap-3 mt-2 flex-wrap">
                              <span className={cn('text-[10px] px-2 py-0.5 rounded-full font-medium', sev.bg, sev.color)}>
                                {alert.severity}
                              </span>
                              <span className={cn('text-[10px] px-2 py-0.5 rounded-full font-medium flex items-center gap-1', stat.bg, stat.color)}>
                                <StatIcon className="w-3 h-3" />
                                {alert.status}
                              </span>
                              {alert.sourceIp && (
                                <span className="text-[10px] font-mono text-muted-foreground">{alert.sourceIp}</span>
                              )}
                              <span className="text-[10px] text-muted-foreground">
                                {new Date(alert.createdAt).toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      {alert.status !== 'Resolved' && (
                        <div className="flex gap-2 mt-3 pt-3 border-t border-cyber-border/50" onClick={(e) => e.stopPropagation()}>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateAlertStatus(alert.id, 'Investigating')}
                            disabled={alert.status === 'Investigating'}
                            className="text-[10px] h-7 border-cyber-border bg-cyber-dark text-foreground hover:bg-white/5 btn-3d-press"
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            Investigate
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateAlertStatus(alert.id, 'Resolved')}
                            className="text-[10px] h-7 border-neon-green/30 bg-neon-green/5 text-neon-green hover:bg-neon-green/10 btn-3d-press"
                          >
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Resolve
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>

      {/* Attack Detail Modal */}
      <AttackDetailModal
        alert={selectedAlert}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onStatusChange={handleStatusChange}
      />
    </div>
  );
}
