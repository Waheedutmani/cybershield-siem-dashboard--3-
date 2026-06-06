'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShieldAlert, Shield, ArrowLeft, Lock } from 'lucide-react';
import { useAppStore } from '@/store/app-store';
import { useAuthStore } from '@/store/auth-store';
import { getRestrictionInfo, type UserRole } from '@/lib/rbac';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface RestrictedPageProps {
  page: string;
}

const roleLabels: Record<UserRole, { color: string; bg: string }> = {
  Admin: { color: 'text-neon-red', bg: 'bg-neon-red/10' },
  Analyst: { color: 'text-neon-blue', bg: 'bg-neon-blue/10' },
  User: { color: 'text-neon-green', bg: 'bg-neon-green/10' },
};

export function RestrictedPage({ page }: RestrictedPageProps) {
  const { setCurrentPage } = useAppStore();
  const { user } = useAuthStore();
  const restriction = getRestrictionInfo(page);
  const userRole = user?.role || 'User';

  // If user is Admin, they should have access to everything - show generic error
  if (userRole === 'Admin') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-center min-h-[60vh]"
      >
        <Card className="glass-card border-neon-yellow/30 max-w-md">
          <CardContent className="p-8 text-center">
            <ShieldAlert className="w-16 h-16 text-neon-yellow mx-auto mb-4" />
            <h2 className="text-xl font-bold text-foreground mb-2">Access Error</h2>
            <p className="text-sm text-muted-foreground mb-6">
              An unexpected access error occurred. Please try again or contact your system administrator.
            </p>
            <Button
              onClick={() => setCurrentPage('dashboard')}
              className="gap-2 bg-neon-blue/20 text-neon-blue border border-neon-blue/30 hover:bg-neon-blue/30"
            >
              <ArrowLeft className="w-4 h-4" />
              Return to Dashboard
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center justify-center min-h-[60vh]"
    >
      <Card className="glass-card border-neon-red/30 max-w-md">
        <CardContent className="p-8 text-center">
          {/* Icon */}
          <div className="w-20 h-20 mx-auto mb-5 rounded-2xl bg-neon-red/10 border border-neon-red/20 flex items-center justify-center">
            <Lock className="w-10 h-10 text-neon-red" />
          </div>

          {/* Title */}
          <h2 className="text-xl font-bold text-foreground mb-2">Access Restricted</h2>

          {/* Description */}
          <p className="text-sm text-muted-foreground mb-5">
            {restriction
              ? `The "${restriction.label}" page requires elevated privileges. Your current role (${userRole}) does not have sufficient permissions to access this resource.`
              : `This page requires elevated privileges that your current role (${userRole}) does not possess.`
            }
          </p>

          {/* Required Roles */}
          {restriction && (
            <div className="mb-6">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Required Role</p>
              <div className="flex items-center justify-center gap-2">
                {restriction.requiredRoles.map((role) => {
                  const config = roleLabels[role];
                  return (
                    <span
                      key={role}
                      className={cn(
                        'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold tracking-wider border',
                        config.bg, config.color,
                        role === 'Admin' ? 'border-neon-red/30' : role === 'Analyst' ? 'border-neon-blue/30' : 'border-neon-green/30'
                      )}
                    >
                      <Shield className="w-3.5 h-3.5" />
                      {role.toUpperCase()}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {/* Info */}
          <p className="text-[11px] text-muted-foreground/70 mb-5">
            Contact your system administrator if you believe you should have access to this page.
          </p>

          {/* Actions */}
          <div className="flex items-center justify-center gap-3">
            <Button
              onClick={() => setCurrentPage('dashboard')}
              className="gap-2 bg-neon-blue/20 text-neon-blue border border-neon-blue/30 hover:bg-neon-blue/30"
            >
              <ArrowLeft className="w-4 h-4" />
              Return to Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
