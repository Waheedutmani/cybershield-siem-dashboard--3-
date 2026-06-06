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
import {
  Search,
  ShieldAlert,
  ShieldCheck,
  FileText,
  AlertTriangle,
  Globe,
  Clock,
  Filter,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { getGeoInfo } from '@/lib/geo-data';

interface SearchResult {
  id: string;
  source: 'log' | 'alert';
  type: string;
  severity: string;
  ipAddress: string;
  details: string;
  title: string;
  description: string;
  threatScore: number;
  status: string | null;
  createdAt: string;
}

export function SearchPage() {
  const [query, setQuery] = useState('');
  const [type, setType] = useState('');
  const [severity, setSeverity] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });

  const performSearch = useCallback(async (page = 1) => {
    if (!query.trim() && !type && !severity) return;
    setLoading(true);
    setSearched(true);
    try {
      const params = new URLSearchParams({ page: page.toString(), limit: '25' });
      if (query.trim()) params.set('q', query.trim());
      if (type && type !== 'all') params.set('type', type);
      if (severity && severity !== 'all') params.set('severity', severity);

      const res = await fetch(`/api/search?${params}`);
      if (res.ok) {
        const data = await res.json();
        setResults(data.results);
        setPagination(data.pagination);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [query, type, severity]);

  // Auto-search with debounce when filters change
  useEffect(() => {
    if (query.trim() || type || severity) {
      const timer = setTimeout(() => performSearch(1), 300);
      return () => clearTimeout(timer);
    }
  }, [query, type, severity, performSearch]);

  const handleSearch = () => performSearch(1);

  const getIcon = (result: SearchResult) => {
    if (result.source === 'alert') return <ShieldAlert className="w-4 h-4" />;
    if (result.type.includes('FAIL') || result.type.includes('ATTACK') || result.type.includes('BRUTE') || result.type.includes('SQL') || result.type.includes('XSS')) {
      return <ShieldAlert className="w-4 h-4" />;
    }
    if (result.severity === 'Medium') return <AlertTriangle className="w-4 h-4" />;
    return <ShieldCheck className="w-4 h-4" />;
  };

  const getSeverityStyle = (sev: string) => {
    switch (sev) {
      case 'Critical': return 'bg-neon-red/10 text-neon-red border-neon-red/20';
      case 'High': return 'bg-neon-orange/10 text-neon-orange border-neon-orange/20';
      case 'Medium': return 'bg-neon-yellow/10 text-neon-yellow border-neon-yellow/20';
      default: return 'bg-neon-green/10 text-neon-green border-neon-green/20';
    }
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Search Bar */}
      <Card className="glass-card neon-glow-blue">
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-neon-blue/10">
                <Search className="w-5 h-5 text-neon-blue" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">Threat Search Engine</h3>
                <p className="text-xs text-muted-foreground">Search across logs, alerts, IP addresses, attack types, and more</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search IP addresses, attack types, usernames, details..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-10 bg-cyber-dark border-cyber-border focus:border-neon-blue text-foreground placeholder:text-muted-foreground/50 h-11"
                />
              </div>
              <Select value={severity} onValueChange={setSeverity}>
                <SelectTrigger className="w-full sm:w-36 bg-cyber-dark border-cyber-border text-foreground h-11">
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
              <Select value={type} onValueChange={setType}>
                <SelectTrigger className="w-full sm:w-40 bg-cyber-dark border-cyber-border text-foreground h-11">
                  <SelectValue placeholder="Event Type" />
                </SelectTrigger>
                <SelectContent className="bg-cyber-card border-cyber-border">
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="LOGIN_SUCCESS">Login Success</SelectItem>
                  <SelectItem value="LOGIN_FAILED">Login Failed</SelectItem>
                  <SelectItem value="BRUTE_FORCE">Brute Force</SelectItem>
                  <SelectItem value="SQL_INJECTION">SQL Injection</SelectItem>
                  <SelectItem value="XSS_ATTACK">XSS Attack</SelectItem>
                  <SelectItem value="DDOS_ATTEMPT">DDoS</SelectItem>
                  <SelectItem value="PORT_SCAN">Port Scan</SelectItem>
                  <SelectItem value="MALWARE_DETECTION">Malware</SelectItem>
                </SelectContent>
              </Select>
              <Button
                onClick={handleSearch}
                className="h-11 bg-neon-blue/20 text-neon-blue border border-neon-blue/30 hover:bg-neon-blue/30 gap-2"
              >
                <Zap className="w-4 h-4" />
                Search
              </Button>
            </div>

            {/* Quick Filters */}
            <div className="flex flex-wrap gap-2">
              {['Critical', 'High', 'Medium', 'Low'].map((sev) => (
                <button
                  key={sev}
                  onClick={() => setSeverity(severity === sev ? '' : sev)}
                  className={cn(
                    'text-[10px] px-2.5 py-1 rounded-full font-medium border transition-all',
                    severity === sev
                      ? getSeverityStyle(sev) + ' border'
                      : 'border-cyber-border text-muted-foreground hover:text-foreground hover:bg-white/5'
                  )}
                >
                  {sev}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <Card className="glass-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Search Results
            {searched && (
              <span className="ml-auto text-[10px] text-muted-foreground font-normal">
                {pagination.total} result(s) found
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!searched ? (
            <div className="text-center py-16 text-muted-foreground">
              <Search className="w-16 h-16 mx-auto mb-4 opacity-20" />
              <p className="text-lg">Enter a search query to begin</p>
              <p className="text-sm mt-1">Search by IP address, attack type, username, or severity level</p>
            </div>
          ) : loading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-white/[0.02] rounded-lg animate-pulse" />
              ))}
            </div>
          ) : results.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Filter className="w-16 h-16 mx-auto mb-4 opacity-20" />
              <p className="text-lg">No results found</p>
              <p className="text-sm mt-1">Try adjusting your search criteria</p>
            </div>
          ) : (
            <div className="space-y-2">
              <AnimatePresence mode="popLayout">
                {results.map((result, idx) => {
                  const geo = result.ipAddress && result.ipAddress !== 'unknown' ? getGeoInfo(result.ipAddress) : null;
                  return (
                    <motion.div
                      key={`${result.source}-${result.id}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ delay: idx * 0.03, duration: 0.2 }}
                      className="flex items-start gap-3 p-3.5 rounded-lg bg-white/[0.02] hover:bg-white/[0.05] transition-colors border border-transparent hover:border-cyber-border group cursor-pointer"
                    >
                      <div className={cn('mt-0.5', {
                        'text-neon-red': result.severity === 'Critical' || result.severity === 'High',
                        'text-neon-yellow': result.severity === 'Medium',
                        'text-neon-green': result.severity === 'Low',
                      })}>
                        {getIcon(result)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={cn(
                            'text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider',
                            result.source === 'alert'
                              ? 'bg-neon-purple/10 text-neon-purple'
                              : 'bg-neon-blue/10 text-neon-blue'
                          )}>
                            {result.source}
                          </span>
                          <span className="text-[10px] font-mono text-muted-foreground">{result.type}</span>
                          <span className={cn('text-[10px] px-1.5 py-0.5 rounded-full font-medium', getSeverityStyle(result.severity))}>
                            {result.severity}
                          </span>
                          {result.status && (
                            <span className={cn('text-[10px] px-1.5 py-0.5 rounded-full font-medium', {
                              'bg-neon-blue/10 text-neon-blue': result.status === 'New',
                              'bg-neon-yellow/10 text-neon-yellow': result.status === 'Investigating',
                              'bg-neon-green/10 text-neon-green': result.status === 'Resolved',
                            })}>
                              {result.status}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-foreground mt-1 truncate">{result.details || result.title}</p>
                        <div className="flex items-center gap-3 mt-1.5">
                          <span className="text-[10px] font-mono text-muted-foreground flex items-center gap-1">
                            <Globe className="w-3 h-3" />
                            {result.ipAddress}
                            {geo && (
                              <span className="ml-1">({geo.country})</span>
                            )}
                          </span>
                          {result.threatScore > 0 && (
                            <span className="text-[10px] text-muted-foreground">
                              Score: <span className={cn('font-bold', result.threatScore >= 70 ? 'text-neon-red' : result.threatScore >= 40 ? 'text-neon-yellow' : 'text-neon-green')}>
                                {result.threatScore}
                              </span>
                            </span>
                          )}
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(result.createdAt).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-cyber-border">
                  <p className="text-xs text-muted-foreground">
                    Page {pagination.page} of {pagination.totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => performSearch(Math.max(1, pagination.page - 1))}
                      disabled={pagination.page <= 1}
                      className="border-cyber-border bg-cyber-dark text-foreground hover:bg-white/5"
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => performSearch(Math.min(pagination.totalPages, pagination.page + 1))}
                      disabled={pagination.page >= pagination.totalPages}
                      className="border-cyber-border bg-cyber-dark text-foreground hover:bg-white/5"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
