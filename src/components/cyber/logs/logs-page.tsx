'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FileText, Search, ChevronLeft, ChevronRight, ShieldAlert, ShieldCheck, AlertTriangle, Download } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LogEntry {
  id: string;
  type: string;
  ipAddress: string;
  details: string;
  severity: string;
  createdAt: string;
}

export function LogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [severity, setSeverity] = useState('');
  const [type, setType] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [exporting, setExporting] = useState(false);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: page.toString(), limit: '15' });
      if (search) params.set('search', search);
      if (severity && severity !== 'all') params.set('severity', severity);
      if (type && type !== 'all') params.set('type', type);

      const res = await fetch(`/api/logs?${params}`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs);
        setTotalPages(data.pagination.totalPages);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [page, search, severity, type]);

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 10000);
    return () => clearInterval(interval);
  }, [fetchLogs]);

  const getLogIcon = (log: LogEntry) => {
    if (log.type.includes('FAIL') || log.type.includes('ATTACK') || log.type.includes('BRUTE') || log.type.includes('SQL') || log.type.includes('XSS')) {
      return <ShieldAlert className="w-4 h-4" />;
    }
    if (log.severity === 'Medium') return <AlertTriangle className="w-4 h-4" />;
    return <ShieldCheck className="w-4 h-4" />;
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Filters */}
      <Card className="glass-card">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search logs by IP, details..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="pl-10 bg-cyber-dark border-cyber-border focus:border-neon-blue text-foreground placeholder:text-muted-foreground/50"
              />
            </div>
            <Select value={severity} onValueChange={(v) => { setSeverity(v); setPage(1); }}>
              <SelectTrigger className="w-full sm:w-36 bg-cyber-dark border-cyber-border text-foreground">
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent className="bg-cyber-card border-cyber-border">
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="Critical">Critical</SelectItem>
                <SelectItem value="High">High</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="Low">Low</SelectItem>
              </SelectContent>
            </Select>
            <Select value={type} onValueChange={(v) => { setType(v); setPage(1); }}>
              <SelectTrigger className="w-full sm:w-40 bg-cyber-dark border-cyber-border text-foreground">
                <SelectValue placeholder="Activity Type" />
              </SelectTrigger>
              <SelectContent className="bg-cyber-card border-cyber-border">
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="LOGIN_SUCCESS">Login Success</SelectItem>
                <SelectItem value="LOGIN_FAILED">Login Failed</SelectItem>
                <SelectItem value="BRUTE_FORCE">Brute Force</SelectItem>
                <SelectItem value="SQL_INJECTION">SQL Injection</SelectItem>
                <SelectItem value="XSS_ATTACK">XSS Attack</SelectItem>
                <SelectItem value="LOGOUT">Logout</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card className="glass-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Security Logs
            <span className="ml-auto flex items-center gap-2">
              <span className="text-[10px] text-muted-foreground font-normal">
                {totalPages} page(s) available
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  setExporting(true);
                  try {
                    const params = new URLSearchParams({ type: 'logs', format: 'csv' });
                    if (severity && severity !== 'all') params.set('severity', severity);
                    if (type && type !== 'all') params.set('type', type);
                    if (search) params.set('search', search);
                    const res = await fetch(`/api/export?${params}`);
                    if (res.ok) {
                      const blob = await res.blob();
                      const url = window.URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `cybershield-logs-${new Date().toISOString().slice(0, 10)}.csv`;
                      a.click();
                      window.URL.revokeObjectURL(url);
                    }
                  } catch {}
                  finally { setExporting(false); }
                }}
                disabled={exporting}
                className="gap-1.5 border-cyber-border bg-cyber-dark text-foreground hover:bg-white/5 text-xs h-7"
              >
                <Download className="w-3 h-3" />
                Export CSV
              </Button>
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-12 bg-white/[0.02] rounded-lg animate-pulse" />
              ))}
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p>No logs found</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-cyber-border">
                      <th className="text-left py-3 px-2 text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Type</th>
                      <th className="text-left py-3 px-2 text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Details</th>
                      <th className="text-left py-3 px-2 text-[10px] text-muted-foreground uppercase tracking-wider font-medium hidden md:table-cell">IP Address</th>
                      <th className="text-left py-3 px-2 text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Severity</th>
                      <th className="text-left py-3 px-2 text-[10px] text-muted-foreground uppercase tracking-wider font-medium hidden sm:table-cell">Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log, idx) => (
                      <tr
                        key={log.id}
                        className="border-b border-cyber-border/50 hover:bg-white/[0.02] transition-colors"
                        style={{ animationDelay: `${idx * 30}ms` }}
                      >
                        <td className="py-3 px-2">
                          <div className="flex items-center gap-2">
                            <span className={cn({
                              'text-neon-red': log.severity === 'Critical' || log.severity === 'High',
                              'text-neon-yellow': log.severity === 'Medium',
                              'text-neon-green': log.severity === 'Low',
                            })}>
                              {getLogIcon(log)}
                            </span>
                            <span className="font-mono text-xs text-muted-foreground">{log.type}</span>
                          </div>
                        </td>
                        <td className="py-3 px-2 max-w-xs truncate text-foreground">{log.details}</td>
                        <td className="py-3 px-2 font-mono text-xs text-muted-foreground hidden md:table-cell">{log.ipAddress}</td>
                        <td className="py-3 px-2">
                          <span className={cn('text-[10px] px-2 py-0.5 rounded-full font-medium', {
                            'bg-neon-red/10 text-neon-red': log.severity === 'Critical',
                            'bg-neon-orange/10 text-neon-orange': log.severity === 'High',
                            'bg-neon-yellow/10 text-neon-yellow': log.severity === 'Medium',
                            'bg-neon-green/10 text-neon-green': log.severity === 'Low',
                          })}>
                            {log.severity}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-xs text-muted-foreground hidden sm:table-cell whitespace-nowrap">
                          {new Date(log.createdAt).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-cyber-border">
                <p className="text-xs text-muted-foreground">
                  Page {page} of {totalPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="border-cyber-border bg-cyber-dark text-foreground hover:bg-white/5"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                    className="border-cyber-border bg-cyber-dark text-foreground hover:bg-white/5"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
