'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Settings, Shield, Bell, Eye, RefreshCw, Monitor, Trash2, ShieldAlert, ShieldBan, Users, Activity, Database } from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import { useAppStore } from '@/store/app-store';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

export function SettingsPage() {
  const { user } = useAuthStore();
  const { clearNotifications } = useAppStore();
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [emailNotif, setEmailNotif] = useState(true);
  const [pushNotif, setPushNotif] = useState(false);
  const [soundAlerts, setSoundAlerts] = useState(true);
  const role = user?.role || 'User';
  const isAdmin = role === 'Admin';
  const isAnalyst = role === 'Analyst';

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      {/* Profile Settings */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="glass-card neon-glow-blue">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Profile Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className={cn(
                'w-16 h-16 rounded-2xl flex items-center justify-center text-white text-2xl font-bold flex-shrink-0',
                'bg-gradient-to-br',
                isAdmin ? 'from-neon-red to-neon-orange' : isAnalyst ? 'from-neon-blue to-neon-purple' : 'from-neon-green to-neon-blue'
              )}>
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">{user?.name}</h3>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
                <span className={cn(
                  'text-[10px] px-2 py-0.5 rounded-full font-bold mt-1 inline-block border',
                  isAdmin ? 'bg-neon-red/10 text-neon-red border-neon-red/20' : isAnalyst ? 'bg-neon-blue/10 text-neon-blue border-neon-blue/20' : 'bg-neon-green/10 text-neon-green border-neon-green/20'
                )}>
                  {role.toUpperCase()}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Notification Settings */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card className="glass-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <Bell className="w-4 h-4" />
              Notification Preferences
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">Auto Refresh Dashboard</p>
                <p className="text-xs text-muted-foreground">Automatically refresh dashboard data every 10 seconds</p>
              </div>
              <Switch checked={autoRefresh} onCheckedChange={setAutoRefresh} />
            </div>
            <Separator className="bg-cyber-border" />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">Email Notifications</p>
                <p className="text-xs text-muted-foreground">Receive email alerts for critical security events</p>
              </div>
              <Switch checked={emailNotif} onCheckedChange={setEmailNotif} />
            </div>
            <Separator className="bg-cyber-border" />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">Push Notifications</p>
                <p className="text-xs text-muted-foreground">Browser push notifications for real-time alerts</p>
              </div>
              <Switch checked={pushNotif} onCheckedChange={setPushNotif} />
            </div>
            <Separator className="bg-cyber-border" />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">Sound Alerts</p>
                <p className="text-xs text-muted-foreground">Play audio alerts for critical threats</p>
              </div>
              <Switch checked={soundAlerts} onCheckedChange={setSoundAlerts} />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Security Settings - Different per role */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Card className="glass-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <Eye className="w-4 h-4" />
              {isAdmin ? 'System Security Configuration' : 'Personal Security Settings'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isAdmin ? (
              <>
                {/* Admin: Full system security config */}
                <div>
                  <Label className="text-sm text-muted-foreground">Session Timeout (minutes)</Label>
                  <Input type="number" defaultValue="1440" className="mt-1.5 bg-cyber-dark border-cyber-border focus:border-neon-blue text-foreground" />
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Max Login Attempts Before Lockout</Label>
                  <Input type="number" defaultValue="5" className="mt-1.5 bg-cyber-dark border-cyber-border focus:border-neon-blue text-foreground" />
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Password Minimum Length</Label>
                  <Input type="number" defaultValue="12" className="mt-1.5 bg-cyber-dark border-cyber-border focus:border-neon-blue text-foreground" />
                </div>
                <Separator className="bg-cyber-border" />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">Two-Factor Authentication</p>
                    <p className="text-xs text-muted-foreground">Require 2FA for all users</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">IP Whitelisting</p>
                    <p className="text-xs text-muted-foreground">Restrict access to whitelisted IPs only</p>
                  </div>
                  <Switch />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">Auto-Block Suspicious IPs</p>
                    <p className="text-xs text-muted-foreground">Automatically block IPs with repeated failed attempts</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator className="bg-cyber-border" />
                <div className="flex gap-2">
                  <Button variant="outline" className="border-cyber-border bg-cyber-dark text-foreground hover:bg-white/5">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Change Password
                  </Button>
                  <Button variant="outline" className="border-neon-red/30 bg-neon-red/5 text-neon-red hover:bg-neon-red/10">
                    <ShieldBan className="w-4 h-4 mr-2" />
                    Reset All Sessions
                  </Button>
                </div>
              </>
            ) : (
              <>
                {/* User/Analyst: Personal security settings only */}
                <div>
                  <Label className="text-sm text-muted-foreground">Session Timeout (minutes)</Label>
                  <Input type="number" defaultValue="1440" className="mt-1.5 bg-cyber-dark border-cyber-border focus:border-neon-blue text-foreground" />
                </div>
                <Separator className="bg-cyber-border" />
                <Button variant="outline" className="border-cyber-border bg-cyber-dark text-foreground hover:bg-white/5">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Change Password
                </Button>
                {!isAnalyst && (
                  <p className="text-[11px] text-muted-foreground mt-2">
                    Contact your administrator for advanced security configuration changes.
                  </p>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* System Configuration - Admin Only */}
      {isAdmin && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="glass-card border-neon-red/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-neon-red uppercase tracking-wider flex items-center gap-2">
                <ShieldAlert className="w-4 h-4" />
                System Administration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium text-foreground">User Management</p>
                    <p className="text-xs text-muted-foreground">Manage users, roles, and permissions</p>
                  </div>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-neon-green/10 text-neon-green font-medium">Active</span>
              </div>
              <Separator className="bg-cyber-border" />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <ShieldBan className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Firewall Configuration</p>
                    <p className="text-xs text-muted-foreground">Manage IP blocking rules and firewall policies</p>
                  </div>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-neon-green/10 text-neon-green font-medium">Enabled</span>
              </div>
              <Separator className="bg-cyber-border" />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Activity className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Attack Simulation Engine</p>
                    <p className="text-xs text-muted-foreground">Control simulated attack generation for testing</p>
                  </div>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-neon-yellow/10 text-neon-yellow font-medium">Configurable</span>
              </div>
              <Separator className="bg-cyber-border" />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Database className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Database Management</p>
                    <p className="text-xs text-muted-foreground">Backup, restore, and maintenance operations</p>
                  </div>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-neon-green/10 text-neon-green font-medium">Healthy</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* System Info */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <Card className="glass-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <Monitor className="w-4 h-4" />
              System Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-sm py-1">
              <span className="text-muted-foreground">Version</span>
              <span className="font-mono text-neon-blue">v2.4.1</span>
            </div>
            <div className="flex justify-between text-sm py-1">
              <span className="text-muted-foreground">License</span>
              <span className="font-mono text-neon-green">Enterprise</span>
            </div>
            <div className="flex justify-between text-sm py-1">
              <span className="text-muted-foreground">Last Updated</span>
              <span className="text-muted-foreground">2026-05-13</span>
            </div>
            <div className="flex justify-between text-sm py-1">
              <span className="text-muted-foreground">Status</span>
              <span className="flex items-center gap-1 text-neon-green">
                <span className="status-dot online" /> Operational
              </span>
            </div>
            <div className="flex justify-between text-sm py-1">
              <span className="text-muted-foreground">Your Role</span>
              <span className={cn('font-bold', isAdmin ? 'text-neon-red' : isAnalyst ? 'text-neon-blue' : 'text-neon-green')}>
                {role}
              </span>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Danger Zone */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
        <Card className="glass-card border-neon-red/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-neon-red uppercase tracking-wider flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Danger Zone
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              variant="outline"
              onClick={clearNotifications}
              className="w-full border-cyber-border bg-cyber-dark text-muted-foreground hover:bg-white/5 justify-start"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Clear All Notifications
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
