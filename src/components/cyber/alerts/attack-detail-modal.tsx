'use client';

import { useEffect, useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import {
  ShieldAlert,
  MapPin,
  Globe,
  Building2,
  Clock,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Shield,
  Activity,
  ChevronRight,
  Zap,
} from 'lucide-react';
import { getGeoInfo, isHighRiskCountry } from '@/lib/geo-data';

interface AttackDetailModalProps {
  alert: {
    id: string;
    title: string;
    description: string;
    severity: string;
    status: string;
    sourceIp: string | null;
    createdAt: string;
  } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStatusChange?: (id: string, status: string) => void;
}

const severityConfig: Record<string, { color: string; bg: string; border: string; score: number }> = {
  Critical: { color: 'text-neon-red', bg: 'bg-neon-red/10', border: 'border-neon-red/30', score: 95 },
  High: { color: 'text-neon-orange', bg: 'bg-neon-orange/10', border: 'border-neon-orange/30', score: 75 },
  Medium: { color: 'text-neon-yellow', bg: 'bg-neon-yellow/10', border: 'border-neon-yellow/30', score: 50 },
  Low: { color: 'text-neon-green', bg: 'bg-neon-green/10', border: 'border-neon-green/30', score: 25 },
};

function getRecommendedAction(title: string, description: string): string {
  const combined = `${title} ${description}`.toLowerCase();

  if (combined.includes('sql_injection') || combined.includes('sql injection')) {
    return 'Block IP immediately, review database logs, check for data exfiltration, update WAF rules';
  }
  if (combined.includes('brute_force') || combined.includes('brute force')) {
    return 'Enable rate limiting, add CAPTCHA, block suspicious IPs, enforce MFA';
  }
  if (combined.includes('xss_attack') || combined.includes('xss attack')) {
    return 'Sanitize inputs, update CSP headers, review affected pages, check stored payloads';
  }
  if (combined.includes('ddos_attempt') || combined.includes('ddos')) {
    return 'Enable DDoS mitigation, notify ISP, activate CDN protection, rate limit traffic';
  }
  if (combined.includes('malware_detection') || combined.includes('malware')) {
    return 'Isolate affected systems, run full scan, quarantine files, update signatures';
  }
  if (combined.includes('phishing')) {
    return 'Block sender domain, alert affected users, reset compromised credentials, update filters';
  }
  return 'Investigate the incident, check related logs, update security rules if needed';
}

function getActionItems(action: string): string[] {
  return action.split(',').map((item) => item.trim());
}

function generateTimeline(alert: {
  title: string;
  description: string;
  sourceIp: string | null;
  createdAt: string;
  status: string;
}): Array<{ time: string; event: string; icon: React.ElementType; color: string }> {
  const baseDate = new Date(alert.createdAt);
  const timeline: Array<{ time: string; event: string; icon: React.ElementType; color: string }> = [];

  timeline.push({
    time: new Date(baseDate.getTime() - 30000).toISOString(),
    event: 'Anomalous traffic pattern detected by IDS',
    icon: Activity,
    color: 'text-neon-blue',
  });

  if (alert.sourceIp) {
    timeline.push({
      time: new Date(baseDate.getTime() - 15000).toISOString(),
      event: `Source IP ${alert.sourceIp} flagged for suspicious behavior`,
      icon: Globe,
      color: 'text-neon-orange',
    });
  }

  timeline.push({
    time: alert.createdAt,
    event: `Alert created: ${alert.title}`,
    icon: ShieldAlert,
    color: 'text-neon-red',
  });

  if (alert.status === 'Investigating') {
    timeline.push({
      time: new Date(baseDate.getTime() + 60000).toISOString(),
      event: 'Alert assigned to SOC analyst for investigation',
      icon: Eye,
      color: 'text-neon-yellow',
    });
  }

  if (alert.status === 'Resolved') {
    timeline.push({
      time: new Date(baseDate.getTime() + 60000).toISOString(),
      event: 'Alert assigned to SOC analyst for investigation',
      icon: Eye,
      color: 'text-neon-yellow',
    });
    timeline.push({
      time: new Date(baseDate.getTime() + 300000).toISOString(),
      event: 'Incident resolved and documented',
      icon: CheckCircle2,
      color: 'text-neon-green',
    });
  }

  return timeline;
}

function formatRelativeTime(isoStr: string): string {
  const diff = Date.now() - new Date(isoStr).getTime();
  const absDiff = Math.abs(diff);
  const prefix = diff < 0 ? '' : '';
  if (absDiff < 60000) return `${prefix}${Math.floor(absDiff / 1000)}s ago`;
  if (absDiff < 3600000) return `${prefix}${Math.floor(absDiff / 60000)}m ago`;
  return `${prefix}${Math.floor(absDiff / 3600000)}h ago`;
}

export function AttackDetailModal({
  alert,
  open,
  onOpenChange,
  onStatusChange,
}: AttackDetailModalProps) {
  const [updating, setUpdating] = useState<string | null>(null);

  const geo = useMemo(() => {
    if (!alert?.sourceIp) return null;
    return getGeoInfo(alert.sourceIp);
  }, [alert?.sourceIp]);

  const recommendedAction = useMemo(() => {
    if (!alert) return '';
    return getRecommendedAction(alert.title, alert.description);
  }, [alert]);

  const actionItems = useMemo(() => getActionItems(recommendedAction), [recommendedAction]);

  const riskScore = useMemo(() => {
    if (!alert) return 0;
    const sevScore = severityConfig[alert.severity]?.score || 25;
    let bonus = 0;
    if (geo && isHighRiskCountry(geo.country)) bonus += 15;
    if (alert.status === 'New') bonus += 5;
    return Math.min(100, sevScore + bonus);
  }, [alert, geo]);

  const riskLabel = useMemo(() => {
    if (riskScore >= 80) return { text: 'Critical Risk', color: 'text-neon-red' };
    if (riskScore >= 60) return { text: 'High Risk', color: 'text-neon-orange' };
    if (riskScore >= 40) return { text: 'Medium Risk', color: 'text-neon-yellow' };
    return { text: 'Low Risk', color: 'text-neon-green' };
  }, [riskScore]);

  const timeline = useMemo(() => {
    if (!alert) return [];
    return generateTimeline(alert);
  }, [alert]);

  const riskBarColor = useMemo(() => {
    if (riskScore >= 80) return 'bg-neon-red';
    if (riskScore >= 60) return 'bg-neon-orange';
    if (riskScore >= 40) return 'bg-neon-yellow';
    return 'bg-neon-green';
  }, [riskScore]);

  const handleStatusUpdate = async (status: string) => {
    if (!alert || updating) return;
    setUpdating(status);
    try {
      if (onStatusChange) {
        onStatusChange(alert.id, status);
      } else {
        const res = await fetch(`/api/alerts/${alert.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status }),
        });
        if (res.ok) {
          onOpenChange(false);
        }
      }
    } catch {
      // silent
    } finally {
      setUpdating(null);
    }
  };

  if (!alert) return null;

  const sev = severityConfig[alert.severity] || severityConfig.Low;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card bg-cyber-card border-cyber-border max-w-2xl max-h-[90vh] overflow-y-auto p-0 sm:max-w-2xl">
        {/* Header */}
        <div className="p-6 pb-0">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className={cn('p-2 rounded-lg', sev.bg)}>
                <ShieldAlert className={cn('w-5 h-5', sev.color)} />
              </div>
              <div className="flex-1 min-w-0">
                <DialogTitle className="text-foreground text-lg">{alert.title}</DialogTitle>
                <DialogDescription className="text-muted-foreground text-xs mt-1">
                  ID: {alert.id}
                </DialogDescription>
              </div>
              <Badge className={cn('border', sev.bg, sev.color, 'text-xs')}>
                {alert.severity}
              </Badge>
            </div>
          </DialogHeader>
        </div>

        <div className="px-6 pb-6 space-y-5">
          {/* Description */}
          <div>
            <p className="text-sm text-muted-foreground leading-relaxed">{alert.description}</p>
            <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                {new Date(alert.createdAt).toLocaleString()}
              </span>
              <Badge
                variant="outline"
                className={cn(
                  'text-[10px] h-5',
                  alert.status === 'New' && 'border-neon-blue/30 text-neon-blue',
                  alert.status === 'Investigating' && 'border-neon-yellow/30 text-neon-yellow',
                  alert.status === 'Resolved' && 'border-neon-green/30 text-neon-green',
                )}
              >
                {alert.status}
              </Badge>
            </div>
          </div>

          <Separator className="bg-cyber-border/50" />

          {/* Geolocation Info */}
          {geo && alert.sourceIp && (
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-neon-blue" />
                Geolocation Intelligence
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="glass-card p-3 rounded-lg">
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
                    Source IP
                  </div>
                  <div className="text-sm font-mono text-foreground">{alert.sourceIp}</div>
                </div>
                <div className="glass-card p-3 rounded-lg">
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
                    Country
                  </div>
                  <div className="text-sm text-foreground flex items-center gap-1.5">
                    <span>{geo.flag}</span>
                    <span>{geo.country}</span>
                  </div>
                </div>
                <div className="glass-card p-3 rounded-lg">
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
                    City
                  </div>
                  <div className="text-sm text-foreground flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                    {geo.city}
                  </div>
                </div>
                <div className="glass-card p-3 rounded-lg">
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
                    ISP
                  </div>
                  <div className="text-sm text-foreground truncate">{geo.isp}</div>
                </div>
              </div>
            </div>
          )}

          {/* Risk Assessment */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider flex items-center gap-2">
                <Shield className="w-3.5 h-3.5 text-neon-orange" />
                Risk Assessment
              </h4>
              <span className={cn('text-sm font-bold', riskLabel.color)}>
                {riskLabel.text}
              </span>
            </div>
            <div className="space-y-2">
              <Progress value={riskScore} className="h-2.5 bg-cyber-dark" />
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>0</span>
                <span className={cn('font-semibold', riskLabel.color)}>{riskScore}/100</span>
                <span>100</span>
              </div>
            </div>
          </div>

          <Separator className="bg-cyber-border/50" />

          {/* Recommended Actions */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-neon-yellow" />
              Recommended Actions
            </h4>
            <div className="space-y-2">
              {actionItems.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2.5 text-sm"
                >
                  <ChevronRight className="w-3.5 h-3.5 text-neon-blue mt-0.5 shrink-0" />
                  <span className="text-muted-foreground">{item}</span>
                </div>
              ))}
            </div>
          </div>

          <Separator className="bg-cyber-border/50" />

          {/* Event Timeline */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider flex items-center gap-2">
              <Activity className="w-3.5 h-3.5 text-neon-purple" />
              Event Timeline
            </h4>
            <div className="relative space-y-0">
              {timeline.map((event, idx) => {
                const Icon = event.icon;
                const isLast = idx === timeline.length - 1;
                return (
                  <div key={idx} className="flex gap-3">
                    {/* Line */}
                    <div className="flex flex-col items-center">
                      <div className={cn('p-1 rounded-full bg-cyber-dark', !isLast && 'mt-0.5')}>
                        <Icon className={cn('w-3 h-3', event.color)} />
                      </div>
                      {!isLast && (
                        <div className="w-px flex-1 bg-cyber-border/50 my-1" />
                      )}
                    </div>
                    {/* Content */}
                    <div className={cn('pb-4', isLast && 'pb-0')}>
                      <p className="text-xs text-foreground">{event.event}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {formatRelativeTime(event.time)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action Buttons */}
          {alert.status !== 'Resolved' && (
            <>
              <Separator className="bg-cyber-border/50" />
              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={alert.status === 'Investigating' || !!updating}
                  onClick={() => handleStatusUpdate('Investigating')}
                  className="flex-1 border-cyber-border bg-cyber-dark text-foreground hover:bg-white/5 text-xs h-9"
                >
                  <Eye className="w-3.5 h-3.5 mr-1.5" />
                  {updating === 'Investigating' ? 'Updating...' : 'Investigate'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!!updating}
                  onClick={() => handleStatusUpdate('Resolved')}
                  className="flex-1 border-neon-green/30 bg-neon-green/5 text-neon-green hover:bg-neon-green/10 text-xs h-9"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                  {updating === 'Resolved' ? 'Updating...' : 'Resolve'}
                </Button>
              </div>
            </>
          )}

          {alert.status === 'Resolved' && (
            <>
              <Separator className="bg-cyber-border/50" />
              <div className="flex items-center gap-2 text-sm text-neon-green">
                <CheckCircle2 className="w-4 h-4" />
                <span>This incident has been resolved</span>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
