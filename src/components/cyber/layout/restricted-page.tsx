'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShieldAlert, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store/app-store';
import { motion } from 'framer-motion';

interface RestrictedPageProps {
  page: string;
  role: string;
}

const pageDescriptions: Record<string, string> = {
  firewall: 'Firewall & IP Blocking',
  users: 'User Management',
  monitoring: 'User Behavior Monitoring',
  simulation: 'Attack Simulation',
  attackmap: 'Global Attack Map',
  search: 'Threat Search',
  timeline: 'SOC Timeline',
  analytics: 'Analytics',
  statistics: 'Attack Statistics',
  logs: 'Security Logs',
  alerts: 'Security Alerts',
  sessions: 'Session Monitor',
};

export function RestrictedPage({ page, role }: RestrictedPageProps) {
  const { setCurrentPage } = useAppStore();

  const goToDashboard = () => setCurrentPage('dashboard');

  return (
    <div className="flex items-center justify-center min-h-[60vh] animate-fade-in">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="max-w-md w-full"
      >
        <Card className="glass-card neon-glow-red border-neon-red/20">
          <CardContent className="p-8 text-center space-y-6">
            <div className="flex justify-center">
              <div className="p-4 rounded-2xl bg-neon-red/10">
                <ShieldAlert className="w-12 h-12 text-neon-red" />
              </div>
            </div>

            <div>
              <h2 className="text-xl font-bold text-foreground">Access Restricted</h2>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                You do not have permission to access <span className="font-semibold text-foreground">{pageDescriptions[page] || page}</span>.
                This feature requires elevated privileges.
              </p>
            </div>

            <div className="px-4 py-3 rounded-xl bg-neon-red/5 border border-neon-red/10">
              <p className="text-xs text-muted-foreground">
                Your current role: <span className={cn(
                  'font-bold uppercase',
                  role === 'Admin' ? 'text-neon-red' : role === 'Analyst' ? 'text-neon-blue' : 'text-neon-green'
                )}>{role}</span>
              </p>
              <p className="text-[10px] text-muted-foreground mt-1">
                Contact your administrator if you believe this is an error.
              </p>
            </div>

            <Button
              onClick={goToDashboard}
              className="gap-2 bg-neon-blue/20 text-neon-blue border border-neon-blue/30 hover:bg-neon-blue/30 transition-all"
            >
              Return to Dashboard
              <ArrowRight className="w-4 h-4" />
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
