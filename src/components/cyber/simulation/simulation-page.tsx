'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/store/app-store';
import { Swords, ShieldAlert, Database, Code2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface AttackType {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  glowClass: string;
  riskLevel: string;
}

const attackTypes: AttackType[] = [
  {
    id: 'brute_force',
    name: 'Brute Force Attack',
    description: 'Simulates multiple rapid login attempts with random credentials to test password strength and rate limiting mechanisms.',
    icon: ShieldAlert,
    color: 'text-neon-red',
    bgColor: 'bg-neon-red/10',
    glowClass: 'neon-glow-red',
    riskLevel: 'Critical',
  },
  {
    id: 'sql_injection',
    name: 'SQL Injection',
    description: 'Simulates malicious SQL query injection attempts targeting database endpoints to test input sanitization.',
    icon: Database,
    color: 'text-neon-orange',
    bgColor: 'bg-neon-orange/10',
    glowClass: 'neon-glow-red',
    riskLevel: 'Critical',
  },
  {
    id: 'xss',
    name: 'XSS Attack',
    description: 'Simulates cross-site scripting attacks by injecting malicious scripts to test output encoding and CSP policies.',
    icon: Code2,
    color: 'text-neon-yellow',
    bgColor: 'bg-neon-yellow/10',
    glowClass: 'neon-glow-blue',
    riskLevel: 'High',
  },
];

export function SimulationPage() {
  const { addNotification } = useAppStore();
  const [simulating, setSimulating] = useState<string | null>(null);
  const [results, setResults] = useState<Array<{
    id: string;
    attackType: string;
    alert: { title: string; severity: string; sourceIp: string };
    timestamp: string;
  }>>([]);

  const simulateAttack = async (attack: AttackType) => {
    setSimulating(attack.id);
    try {
      const res = await fetch('/api/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attackType: attack.id }),
      });
      const data = await res.json();
      if (res.ok) {
        addNotification({
          title: `Attack Simulated: ${attack.name}`,
          message: `From IP: ${data.ip} | Severity: ${attack.riskLevel}`,
          severity: attack.riskLevel.toLowerCase(),
        });
        setResults((prev) => [
          {
            id: Math.random().toString(36).slice(2),
            attackType: attack.name,
            alert: data.alert,
            timestamp: new Date().toISOString(),
          },
          ...prev,
        ].slice(0, 20));
      }
    } catch {
      addNotification({
        title: 'Simulation Failed',
        message: 'Failed to simulate attack. Please try again.',
        severity: 'medium',
      });
    } finally {
      setSimulating(null);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Warning Banner */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 p-4 rounded-xl bg-neon-yellow/5 border border-neon-yellow/20"
      >
        <AlertTriangle className="w-5 h-5 text-neon-yellow flex-shrink-0" />
        <p className="text-sm text-neon-yellow">
          <strong>Simulation Zone</strong> — These are simulated attacks for testing purposes only.
          All generated logs and alerts are part of the SIEM training environment.
        </p>
      </motion.div>

      {/* Attack Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {attackTypes.map((attack, idx) => {
          const Icon = attack.icon;
          const isActive = simulating === attack.id;
          return (
            <motion.div
              key={attack.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
              <Card className={cn('glass-card hover:scale-[1.02] transition-all duration-300', {
                [attack.glowClass]: isActive,
              })}>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className={cn('p-3 rounded-xl', attack.bgColor)}>
                      <Icon className={cn('w-6 h-6', attack.color)} />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-base font-semibold text-foreground">{attack.name}</h3>
                      <p className="text-xs text-muted-foreground mt-1">{attack.description}</p>
                      <div className="flex items-center gap-3 mt-3">
                        <span className={cn('text-[10px] px-2 py-0.5 rounded-full font-medium', {
                          'bg-neon-red/10 text-neon-red': attack.riskLevel === 'Critical',
                          'bg-neon-orange/10 text-neon-orange': attack.riskLevel === 'High',
                        })}>
                          {attack.riskLevel}
                        </span>
                      </div>
                      <Button
                        onClick={() => simulateAttack(attack)}
                        disabled={!!isActive}
                        className={cn('mt-4 w-full text-white font-medium transition-all', {
                          'bg-gradient-to-r from-neon-red to-neon-orange hover:opacity-90': attack.id === 'brute_force',
                          'bg-gradient-to-r from-neon-orange to-neon-yellow hover:opacity-90': attack.id === 'sql_injection',
                          'bg-gradient-to-r from-neon-yellow to-neon-green hover:opacity-90': attack.id === 'xss',
                        })}
                      >
                        {isActive ? (
                          <span className="flex items-center gap-2">
                            <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Launching...
                          </span>
                        ) : (
                          <span className="flex items-center gap-2">
                            <Swords className="w-4 h-4" />
                            Launch Attack
                          </span>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Simulation Results */}
      {results.length > 0 && (
        <Card className="glass-card neon-glow-blue">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <Swords className="w-4 h-4" />
              Simulation Results
              <span className="ml-auto text-[10px] text-muted-foreground font-normal">
                {results.length} attack(s) simulated
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-96 overflow-y-auto space-y-2 pr-1">
              {results.map((result) => (
                <motion.div
                  key={result.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.02] border border-cyber-border/50"
                >
                  <CheckCircle2 className="w-4 h-4 text-neon-green flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground">{result.attackType}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      Alert: {result.alert.title} | IP: {result.alert.sourceIp} | Severity: {result.alert.severity}
                    </p>
                  </div>
                  <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                    {new Date(result.timestamp).toLocaleTimeString()}
                  </span>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
