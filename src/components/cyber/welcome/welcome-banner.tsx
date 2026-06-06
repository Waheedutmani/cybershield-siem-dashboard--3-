'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { useAppStore } from '@/store/app-store';
import { Shield, AlertTriangle, Activity, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WelcomeData {
  criticalCount: number;
  highCount: number;
  sessionCount: number;
}

export function WelcomeBanner() {
  const { user } = useAuthStore();
  const { theme } = useAppStore();
  const [dismissed, setDismissed] = useState(false);
  const [data, setData] = useState<WelcomeData>({ criticalCount: 0, highCount: 0, sessionCount: 0 });
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Don't show if previously dismissed in this session
    if (sessionStorage.getItem('cs_welcome_dismissed')) {
      setDismissed(true);
      return;
    }

    // Fetch dashboard data for welcome context
    fetch('/api/dashboard')
      .then(r => r.json())
      .then(d => {
        if (d?.stats) {
          setData({
            criticalCount: d.stats.critical ?? 0,
            highCount: d.stats.high ?? 0,
            sessionCount: d.stats.activeSessions ?? d.stats.sessions ?? 0,
          });
        }
      })
      .catch(() => {})
      .finally(() => setVisible(true));
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem('cs_welcome_dismissed', '1');
  };

  if (dismissed || !visible) return null;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const role = user?.role || 'User';

  return (
    <div className="welcome-banner mb-6 rounded-xl p-4 border border-cyber-border/50 overflow-hidden relative">
      {/* Gradient background */}
      <div className="absolute inset-0 welcome-banner-bg" />

      <div className="relative flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-neon-blue/20 to-neon-purple/20 flex items-center justify-center flex-shrink-0 border border-neon-blue/20 mt-0.5">
            <Shield className="w-5 h-5 text-neon-blue" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">
              {greeting}, <span className="text-neon-blue">{user?.name || 'Operator'}</span>.
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {role === 'Admin' ? (
                <>SOC command interface is active. You have full system access.</>
              ) : role === 'Analyst' ? (
                <>Analyst workstation ready. Monitoring systems are online.</>
              ) : (
                <>Your security dashboard is ready. All systems nominal.</>
              )}
            </p>

            {/* Quick stats */}
            <div className="flex items-center gap-4 mt-3">
              {data.criticalCount > 0 && (
                <div className="flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-neon-red" />
                  <span className="text-xs text-neon-red font-medium">{data.criticalCount} critical</span>
                </div>
              )}
              {data.highCount > 0 && (
                <div className="flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-neon-orange" />
                  <span className="text-xs text-neon-orange font-medium">{data.highCount} high severity</span>
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-neon-green" />
                <span className="text-xs text-muted-foreground">{data.sessionCount} active sessions</span>
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={handleDismiss}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all flex-shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
