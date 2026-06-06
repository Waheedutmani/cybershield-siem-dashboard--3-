'use client';

import { useAppStore } from '@/store/app-store';
import { cn } from '@/lib/utils';
import { X, ShieldAlert, AlertTriangle, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useRef } from 'react';

const NOTIFICATION_LIFETIME = 8000; // 8 seconds

export function NotificationPopup() {
  const { notifications, removeNotification } = useAppStore();
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  // Auto-remove notifications after 8 seconds
  useEffect(() => {
    notifications.forEach((notif) => {
      if (!timersRef.current.has(notif.id)) {
        const timer = setTimeout(() => {
          removeNotification(notif.id);
          timersRef.current.delete(notif.id);
        }, NOTIFICATION_LIFETIME);
        timersRef.current.set(notif.id, timer);
      }
    });

    // Cleanup timers for removed notifications
    const currentIds = new Set(notifications.map((n) => n.id));
    timersRef.current.forEach((timer, id) => {
      if (!currentIds.has(id)) {
        clearTimeout(timer);
        timersRef.current.delete(id);
      }
    });

    return () => {
      timersRef.current.forEach((timer) => clearTimeout(timer));
      timersRef.current.clear();
    };
  }, [notifications, removeNotification]);

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 pointer-events-none" style={{ maxWidth: '400px' }}>
      <AnimatePresence>
        {notifications.slice(0, 8).map((notif) => {
          const isNew = Date.now() - notif.timestamp.getTime() < 5000;
          const remaining = Math.max(0, NOTIFICATION_LIFETIME - (Date.now() - notif.timestamp.getTime()));
          const progressPct = (remaining / NOTIFICATION_LIFETIME) * 100;

          const config = {
            critical: { icon: ShieldAlert, color: 'text-neon-red', bg: 'bg-neon-red/10', border: 'border-neon-red/30', progressColor: 'bg-neon-red' },
            high: { icon: AlertTriangle, color: 'text-neon-orange', bg: 'bg-neon-orange/10', border: 'border-neon-orange/30', progressColor: 'bg-neon-orange' },
            medium: { icon: AlertTriangle, color: 'text-neon-yellow', bg: 'bg-neon-yellow/10', border: 'border-neon-yellow/30', progressColor: 'bg-neon-yellow' },
            low: { icon: Info, color: 'text-neon-green', bg: 'bg-neon-green/10', border: 'border-neon-green/30', progressColor: 'bg-neon-green' },
          }[notif.severity] || { icon: Info, color: 'text-neon-blue', bg: 'bg-neon-blue/10', border: 'border-neon-blue/30', progressColor: 'bg-neon-blue' };

          const Icon = config.icon;

          return (
            <motion.div
              key={notif.id}
              initial={{ opacity: 0, x: 100, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 100, scale: 0.9 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className={cn(
                'glass-card pointer-events-auto min-w-[300px] max-w-[400px] border overflow-hidden',
                config.border,
                isNew && 'threat-pulse'
              )}
              style={{
                boxShadow: notif.severity === 'critical'
                  ? '0 0 20px rgba(255, 51, 102, 0.2)'
                  : '0 0 20px rgba(0, 0, 0, 0.3)',
              }}
              onMouseEnter={() => {
                // Pause auto-remove on hover
                const timer = timersRef.current.get(notif.id);
                if (timer) {
                  clearTimeout(timer);
                  timersRef.current.delete(notif.id);
                }
              }}
              onMouseLeave={() => {
                // Resume auto-remove on mouse leave
                if (!timersRef.current.has(notif.id)) {
                  const timer = setTimeout(() => {
                    removeNotification(notif.id);
                    timersRef.current.delete(notif.id);
                  }, 3000);
                  timersRef.current.set(notif.id, timer);
                }
              }}
            >
              <div className="flex items-start gap-2 p-3">
                <div className={cn('p-1.5 rounded-lg flex-shrink-0', config.bg)}>
                  <Icon className={cn('w-3.5 h-3.5', config.color)} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-foreground truncate">{notif.title}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{notif.message}</p>
                  <p className="text-[9px] text-muted-foreground/60 mt-1">
                    {notif.timestamp.toLocaleTimeString()}
                  </p>
                </div>
                <button
                  onClick={() => {
                    const timer = timersRef.current.get(notif.id);
                    if (timer) clearTimeout(timer);
                    timersRef.current.delete(notif.id);
                    removeNotification(notif.id);
                  }}
                  className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              {/* Progress bar */}
              <div className="h-0.5 bg-cyber-dark">
                <motion.div
                  className={cn('h-full', config.progressColor)}
                  initial={{ width: '100%' }}
                  animate={{ width: `${progressPct}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
