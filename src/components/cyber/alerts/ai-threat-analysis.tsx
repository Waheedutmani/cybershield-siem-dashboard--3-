'use client';

import { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain,
  ShieldCheck,
  AlertTriangle,
  ShieldAlert,
  Globe,
  Activity,
  Zap,
  ChevronRight,
} from 'lucide-react';
import { getGeoInfo, isHighRiskCountry } from '@/lib/geo-data';

interface AIThreatAnalysisProps {
  alert: {
    severity: string;
    sourceIp: string | null;
    title: string;
    description: string;
  } | null;
}

interface AnalysisResult {
  summary: string;
  confidence: number;
  indicators: Array<{ label: string; severity: 'critical' | 'warning' | 'info' }>;
  recommendedActions: string[];
}

function generateAnalysis(alert: NonNullable<AIThreatAnalysisProps['alert']>): AnalysisResult {
  const combined = `${alert.title} ${alert.description}`.toLowerCase();
  const geo = alert.sourceIp ? getGeoInfo(alert.sourceIp) : null;
  const isHighRisk = geo ? isHighRiskCountry(geo.country) : false;
  const isCritical = alert.severity === 'Critical';
  const isHigh = alert.severity === 'High' || isCritical;

  let summary = '';
  const indicators: AnalysisResult['indicators'] = [];
  const recommendedActions: string[] = [];
  let confidence = 75 + Math.floor(Math.random() * 20); // 75-94

  // Determine analysis pattern
  const isBruteForce = combined.includes('brute_force') || combined.includes('brute force') || combined.includes('failed login');
  const isSqlInjection = combined.includes('sql_injection') || combined.includes('sql injection') || combined.includes('injection');
  const isXss = combined.includes('xss') || combined.includes('cross-site scripting');
  const isDdos = combined.includes('ddos') || combined.includes('denial of service');
  const isMalware = combined.includes('malware') || combined.includes('trojan') || combined.includes('ransomware');
  const isPhishing = combined.includes('phishing') || combined.includes('credential');

  if (isBruteForce) {
    summary = 'Possible brute-force attack pattern detected. Multiple authentication failure events observed from a single source within a short time window. The attacker appears to be systematically testing credential combinations against available user accounts.';
    indicators.push({ label: 'Repeated failed login attempts detected', severity: 'critical' });
    indicators.push({ label: 'Credential stuffing pattern identified', severity: 'warning' });
    indicators.push({ label: 'Single source IP attempting multiple accounts', severity: 'critical' });
    recommendedActions.push('Enable account lockout after 5 failed attempts');
    recommendedActions.push('Implement CAPTCHA after 3 failed attempts');
    recommendedActions.push('Block originating IP at firewall level');
    recommendedActions.push('Notify affected account holders');
    confidence = Math.min(99, confidence + 5);
  } else if (isSqlInjection) {
    summary = 'Sophisticated injection attempt targeting application database layer. The payload contains SQL meta-characters consistent with data exfiltration or authentication bypass techniques. This attack vector could compromise sensitive stored data.';
    indicators.push({ label: 'SQL meta-characters in request payload', severity: 'critical' });
    indicators.push({ label: 'Union-based or boolean-blind injection pattern', severity: 'warning' });
    indicators.push({ label: 'Database error responses observed', severity: 'warning' });
    recommendedActions.push('Block the originating IP immediately');
    recommendedActions.push('Review database access logs for unauthorized queries');
    recommendedActions.push('Update WAF rules to block similar payloads');
    recommendedActions.push('Conduct data integrity check');
    confidence = Math.min(99, confidence + 3);
  } else if (isXss) {
    summary = 'Cross-site scripting attack attempt detected. Malicious script payloads were injected into user-facing input fields. If successful, this could enable session hijacking, credential theft, or malware distribution to other users.';
    indicators.push({ label: 'JavaScript injection in input parameters', severity: 'critical' });
    indicators.push({ label: 'Event handler manipulation detected', severity: 'warning' });
    indicators.push({ label: 'Potential DOM-based XSS vector identified', severity: 'warning' });
    recommendedActions.push('Sanitize all user inputs immediately');
    recommendedActions.push('Update Content Security Policy headers');
    recommendedActions.push('Review stored data for injected payloads');
    recommendedActions.push('Enable output encoding on all templates');
    confidence = Math.min(98, confidence + 4);
  } else if (isDdos) {
    summary = 'Distributed denial of service attack signature detected. Abnormal traffic volume spike observed, exceeding baseline thresholds significantly. The attack pattern suggests a volumetric flood targeting available bandwidth and server resources.';
    indicators.push({ label: 'Traffic volume spike detected (>500% baseline)', severity: 'critical' });
    indicators.push({ label: 'Multiple source IPs coordinating attack', severity: 'critical' });
    indicators.push({ label: 'SYN flood pattern identified', severity: 'warning' });
    recommendedActions.push('Activate DDoS mitigation service');
    recommendedActions.push('Enable rate limiting on edge routers');
    recommendedActions.push('Notify upstream ISP for traffic filtering');
    recommendedActions.push('Activate CDN-based traffic absorption');
    confidence = Math.min(97, confidence + 2);
  } else if (isMalware) {
    summary = 'Malicious software detection event triggered. The system identified suspicious code signatures or behavioral patterns consistent with known malware families. Immediate containment is recommended to prevent lateral movement.';
    indicators.push({ label: 'Known malware signature matched', severity: 'critical' });
    indicators.push({ label: 'Suspicious file system activity detected', severity: 'critical' });
    indicators.push({ label: 'Network beacon activity observed', severity: 'warning' });
    recommendedActions.push('Isolate affected system from network');
    recommendedActions.push('Perform full malware scan across all endpoints');
    recommendedActions.push('Quarantine suspicious files');
    recommendedActions.push('Update antivirus signatures');
    confidence = Math.min(99, confidence + 6);
  } else if (isPhishing) {
    summary = 'Phishing campaign activity detected. Malicious emails or deceptive web pages targeting organizational credentials have been identified. This vector is commonly used as an initial access method for more advanced attacks.';
    indicators.push({ label: 'Suspicious URL patterns detected', severity: 'warning' });
    indicators.push({ label: 'Credential harvesting page identified', severity: 'critical' });
    indicators.push({ label: 'Social engineering techniques detected', severity: 'warning' });
    recommendedActions.push('Block sender domain at email gateway');
    recommendedActions.push('Alert all potentially affected users');
    recommendedActions.push('Reset credentials of compromised accounts');
    recommendedActions.push('Update email filtering rules');
    confidence = Math.min(96, confidence + 3);
  } else if (isCritical) {
    summary = 'Critical threat detected, immediate action recommended. The alert has been classified at the highest severity level based on multiple risk indicators. Rapid response is essential to prevent potential system compromise or data breach.';
    indicators.push({ label: 'Critical severity classification', severity: 'critical' });
    indicators.push({ label: 'Multiple threat indicators correlated', severity: 'critical' });
    indicators.push({ label: 'Potential for significant system impact', severity: 'warning' });
    recommendedActions.push('Escalate to senior security team');
    recommendedActions.push('Initiate incident response procedures');
    recommendedActions.push('Review all recent security events');
    recommendedActions.push('Prepare containment strategy');
    confidence = Math.min(98, confidence + 4);
  } else {
    summary = 'Automated threat analysis complete. The detected activity has been correlated with known attack patterns and threat intelligence feeds. Continuous monitoring is recommended for this alert classification.';
    indicators.push({ label: 'Anomalous activity pattern detected', severity: 'warning' });
    indicators.push({ label: 'Threat intelligence correlation complete', severity: 'info' });
    indicators.push({ label: 'Behavioral baseline deviation noted', severity: 'info' });
    recommendedActions.push('Monitor for escalation');
    recommendedActions.push('Review related log entries');
    recommendedActions.push('Update detection rules if confirmed');
  }

  // High-risk country bonus analysis
  if (isHighRisk) {
    summary += ` Additionally, the attack originates from a high-risk region (${geo!.country}), which significantly increases the threat credibility score.`;
    indicators.push({ label: `Origin from high-risk country: ${geo!.country} ${geo!.flag}`, severity: 'warning' });
    confidence = Math.min(99, confidence + 5);
  }

  if (isHigh) {
    confidence = Math.min(99, confidence + 3);
  }

  return { summary, confidence, indicators, recommendedActions };
}

export function AIThreatAnalysis({ alert }: AIThreatAnalysisProps) {
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const animationRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const charIndexRef = useRef(0);

  const analysis = useMemo(() => {
    if (!alert) return null;
    return generateAnalysis(alert);
  }, [alert]);

  const startTyping = useCallback((text: string) => {
    setIsTyping(true);
    setIsComplete(false);
    setDisplayedText('');
    charIndexRef.current = 0;

    const type = () => {
      if (charIndexRef.current < text.length) {
        setDisplayedText(text.slice(0, charIndexRef.current + 1));
        charIndexRef.current += 1;
        // Vary typing speed for natural effect
        const delay = 15 + Math.random() * 25;
        animationRef.current = setTimeout(type, delay);
      } else {
        setIsTyping(false);
        setIsComplete(true);
      }
    };

    type();
  }, []);

  useEffect(() => {
    if (analysis && alert) {
      // Small delay before starting the analysis
      const startDelay = setTimeout(() => {
        setIsVisible(true);
        startTyping(analysis.summary);
      }, 600);

      return () => {
        clearTimeout(startDelay);
        if (animationRef.current) clearTimeout(animationRef.current);
      };
    } else {
      setIsVisible(false);
      setIsTyping(false);
      setIsComplete(false);
      setDisplayedText('');
    }
  }, [analysis, alert, startTyping]);

  if (!alert) {
    return (
      <Card className="glass-card border-cyber-border">
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground py-8">
            <Brain className="w-8 h-8 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Select an alert to begin AI threat analysis</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!analysis) return null;

  const indicatorSeverityConfig = {
    critical: { color: 'text-neon-red', bg: 'bg-neon-red/10', border: 'border-neon-red/20' },
    warning: { color: 'text-neon-yellow', bg: 'bg-neon-yellow/10', border: 'border-neon-yellow/20' },
    info: { color: 'text-neon-blue', bg: 'bg-neon-blue/10', border: 'border-neon-blue/20' },
  };

  return (
    <AnimatePresence mode="wait">
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.4 }}
        >
          <Card className="glass-card border-cyber-border">
            {/* Header */}
            <CardHeader className="pb-3 px-5 pt-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Brain className="w-4 h-4 text-neon-purple" />
                  AI Threat Analysis
                </CardTitle>
                <div className="flex items-center gap-2">
                  {isTyping && (
                    <span className="flex items-center gap-1.5 text-[10px] text-neon-green">
                      <span className="status-dot online live-pulse" />
                      AI Analyzing...
                    </span>
                  )}
                  {isComplete && (
                    <span className="flex items-center gap-1.5 text-[10px] text-neon-green">
                      <ShieldCheck className="w-3 h-3" />
                      Analysis Complete
                    </span>
                  )}
                </div>
              </div>
            </CardHeader>

            <CardContent className="px-5 pb-5 space-y-4">
              {/* Confidence Score */}
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                      Confidence Score
                    </span>
                    <span className={cn(
                      'text-xs font-bold',
                      analysis.confidence >= 90 ? 'text-neon-green' :
                      analysis.confidence >= 80 ? 'text-neon-blue' :
                      'text-neon-yellow'
                    )}>
                      {analysis.confidence}%
                    </span>
                  </div>
                  <div className="h-1.5 bg-cyber-dark rounded-full overflow-hidden">
                    <motion.div
                      className={cn(
                        'h-full rounded-full',
                        analysis.confidence >= 90 ? 'bg-neon-green' :
                        analysis.confidence >= 80 ? 'bg-neon-blue' :
                        'bg-neon-yellow'
                      )}
                      initial={{ width: 0 }}
                      animate={{ width: `${analysis.confidence}%` }}
                      transition={{ duration: 1.5, ease: 'easeOut' }}
                    />
                  </div>
                </div>
              </div>

              <Separator className="bg-cyber-border/50" />

              {/* Analysis Summary with typing effect */}
              <div>
                <h4 className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2 font-semibold">
                  Analysis Summary
                </h4>
                <p className={cn(
                  'text-xs text-foreground/90 leading-relaxed min-h-[48px]',
                  isTyping && 'typing-cursor'
                )}>
                  {displayedText}
                  {isTyping && (
                    <span className="inline-block w-1.5 h-3.5 bg-neon-blue ml-0.5 animate-pulse rounded-sm" />
                  )}
                </p>
              </div>

              {/* Threat Indicators */}
              <AnimatePresence>
                {isComplete && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    transition={{ duration: 0.4 }}
                  >
                    <Separator className="bg-cyber-border/50 mb-4" />
                    <h4 className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2.5 font-semibold flex items-center gap-1.5">
                      <AlertTriangle className="w-3 h-3 text-neon-orange" />
                      Threat Indicators
                    </h4>
                    <div className="space-y-2">
                      {analysis.indicators.map((indicator, idx) => {
                        const config = indicatorSeverityConfig[indicator.severity];
                        return (
                          <motion.div
                            key={idx}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.1, duration: 0.3 }}
                            className={cn(
                              'flex items-center gap-2 text-xs p-2 rounded-lg border',
                              config.bg,
                              config.border
                            )}
                          >
                            <div className={cn(
                              'w-1.5 h-1.5 rounded-full shrink-0',
                              indicator.severity === 'critical' && 'bg-neon-red',
                              indicator.severity === 'warning' && 'bg-neon-yellow',
                              indicator.severity === 'info' && 'bg-neon-blue',
                            )} />
                            <span className={cn('text-xs', config.color)}>
                              {indicator.label}
                            </span>
                          </motion.div>
                        );
                      })}
                    </div>

                    {/* AI Recommended Actions */}
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.4, duration: 0.4 }}
                      className="mt-4"
                    >
                      <h4 className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2.5 font-semibold flex items-center gap-1.5">
                        <Zap className="w-3 h-3 text-neon-green" />
                        AI Recommended Actions
                      </h4>
                      <div className="space-y-1.5">
                        {analysis.recommendedActions.map((action, idx) => (
                          <motion.div
                            key={idx}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.5 + idx * 0.08, duration: 0.3 }}
                            className="flex items-start gap-2 text-xs"
                          >
                            <ChevronRight className="w-3 h-3 text-neon-green mt-0.5 shrink-0" />
                            <span className="text-muted-foreground">{action}</span>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
