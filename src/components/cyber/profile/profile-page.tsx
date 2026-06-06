'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  User as UserIcon,
  Mail,
  Shield,
  ShieldCheck,
  LogIn,
  LogOut,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Camera,
  Edit3,
  Save,
  X,
  Lock,
  Globe,
  Monitor,
  Clock,
  Activity,
  FileText,
  Users,
  ShieldBan,
  Eye,
  RefreshCw,
  TrendingUp,
  Fingerprint,
  ChevronRight,
  KeyRound,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth-store';
import { isAdmin, isAnalystOrAbove } from '@/lib/rbac';

// ===== Types =====
interface ProfileUser {
  id: string;
  email: string;
  name: string;
  role: string;
  status: string;
  createdAt: string;
  lastLogin: string | null;
}

interface LoginEntry {
  id: string;
  type: string;
  ipAddress: string;
  details: string;
  severity: string;
  createdAt: string;
}

interface ActivityEntry {
  id: string;
  action: string;
  userId: string;
  details: string;
  ipAddress: string | null;
  createdAt: string;
}

interface ProfileData {
  user: ProfileUser;
  loginHistory: LoginEntry[];
  failedLoginCount: number;
  successfulLoginCount: number;
  activeSessionsCount: number;
  recentActivity: ActivityEntry[];
  alertsResolved: number;
  totalAlerts?: number;
  totalUsers?: number;
  blockedIPs?: number;
  logsReviewed?: number;
}

// ===== Animated Counter Component =====
function AnimatedCounter({ value, duration = 1500 }: { value: number; duration?: number }) {
  const [count, setCount] = useState(0);
  const hasAnimatedRef = useRef(false);

  useEffect(() => {
    if (hasAnimatedRef.current) return;
    hasAnimatedRef.current = true;
    const startTime = Date.now();
    const startValue = 0;
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(startValue + (value - startValue) * eased));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [value, duration]);

  return <span className="font-bold tabular-nums">{count}</span>;
}

// ===== Role Gradient Config =====
const roleGradients: Record<string, string> = {
  Admin: 'from-red-500 to-orange-500',
  Analyst: 'from-blue-500 to-purple-500',
  User: 'from-green-500 to-cyan-500',
};

const roleBadgeClasses: Record<string, string> = {
  Admin: 'bg-neon-red/15 text-neon-red border-neon-red/30',
  Analyst: 'bg-neon-blue/15 text-neon-blue border-neon-blue/30',
  User: 'bg-neon-green/15 text-neon-green border-neon-green/30',
};

// ===== Toast Helper =====
function useToast() {
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  return { toast, showToast };
}

// ===== Main Profile Page =====
export function ProfilePage() {
  const { user } = useAuthStore();
  const { toast, showToast } = useToast();
  const role = user?.role || 'User';

  // Data state
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingProfile, setEditingProfile] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  // Edit profile form state
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  // Change password form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [loggingOutAll, setLoggingOutAll] = useState(false);

  // Fetch profile data
  const fetchProfile = useCallback(async () => {
    try {
      const res = await fetch('/api/profile');
      if (res.ok) {
        const data = await res.json();
        setProfileData(data);
        setEditName(data.user.name);
        setEditEmail(data.user.email);
      }
    } catch {
      showToast('Failed to load profile data', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(fetchProfile, 30000);
    return () => clearInterval(interval);
  }, [fetchProfile]);

  // Handlers
  const handleSaveProfile = async () => {
    setSavingProfile(true);
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName !== profileData?.user.name ? editName : undefined,
          email: editEmail !== profileData?.user.email ? editEmail : undefined,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        showToast('Profile updated successfully', 'success');
        setEditingProfile(false);
        fetchProfile();
      } else {
        const err = await res.json();
        showToast(err.error || 'Failed to update profile', 'error');
      }
    } catch {
      showToast('Network error', 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      showToast('New passwords do not match', 'error');
      return;
    }
    if (newPassword.length < 6) {
      showToast('Password must be at least 6 characters', 'error');
      return;
    }
    setSavingPassword(true);
    try {
      const res = await fetch('/api/profile/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      if (res.ok) {
        showToast('Password changed successfully', 'success');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setChangingPassword(false);
      } else {
        const err = await res.json();
        showToast(err.error || 'Failed to change password', 'error');
      }
    } catch {
      showToast('Network error', 'error');
    } finally {
      setSavingPassword(false);
    }
  };

  const handleLogoutAll = async () => {
    setLoggingOutAll(true);
    try {
      const res = await fetch('/api/profile/logout-all', { method: 'POST' });
      if (res.ok) {
        showToast('Logged out from all devices', 'success');
        // Will redirect on next auth check
        setTimeout(() => window.location.reload(), 1500);
      } else {
        showToast('Failed to logout from all devices', 'error');
      }
    } catch {
      showToast('Network error', 'error');
    } finally {
      setLoggingOutAll(false);
    }
  };

  // Format date helper
  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'Unknown';
    }
  };

  // Activity icon helper
  const getActivityIcon = (action: string) => {
    if (action.includes('LOGIN')) return <LogIn className="w-3.5 h-3.5 text-neon-green" />;
    if (action.includes('LOGOUT')) return <LogOut className="w-3.5 h-3.5 text-neon-orange" />;
    if (action.includes('PASSWORD')) return <KeyRound className="w-3.5 h-3.5 text-neon-red" />;
    if (action.includes('ALERT') || action.includes('THREAT')) return <AlertTriangle className="w-3.5 h-3.5 text-neon-yellow" />;
    if (action.includes('PROFILE') || action.includes('USER')) return <UserIcon className="w-3.5 h-3.5 text-neon-blue" />;
    if (action.includes('LOG_VIEWED') || action.includes('REVIEWED')) return <Eye className="w-3.5 h-3.5 text-neon-purple" />;
    return <Activity className="w-3.5 h-3.5 text-muted-foreground" />;
  };

  // Skeleton loader
  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="glass-card p-6 rounded-xl h-48 animate-pulse bg-cyber-card" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="glass-card p-6 rounded-xl h-28 animate-pulse bg-cyber-card" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="glass-card p-6 rounded-xl h-80 animate-pulse bg-cyber-card" />
          <div className="glass-card p-6 rounded-xl h-80 animate-pulse bg-cyber-card" />
        </div>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Unable to load profile data.</p>
      </div>
    );
  }

  const pd = profileData;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -20, x: '-50%' }}
            className={cn(
              'fixed top-4 left-1/2 z-50 px-5 py-3 rounded-lg border shadow-lg flex items-center gap-2 text-sm font-medium',
              toast.type === 'success'
                ? 'bg-neon-green/15 text-neon-green border-neon-green/30 neon-glow-green'
                : 'bg-neon-red/15 text-neon-red border-neon-red/30 neon-glow-red'
            )}
          >
            {toast.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== A. Profile Header Card ===== */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="glass-card card-3d parallax-header overflow-hidden">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              {/* Avatar with camera overlay */}
              <div className="relative group flex-shrink-0">
                <div
                  className={cn(
                    'w-24 h-24 rounded-2xl flex items-center justify-center text-white text-3xl font-bold',
                    'bg-gradient-to-br avatar-3d shadow-lg',
                    roleGradients[role] || roleGradients.User
                  )}
                >
                  {pd.user.name.charAt(0).toUpperCase()}
                </div>
                {/* Camera overlay */}
                <div className="absolute inset-0 rounded-2xl bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer" title="Upload coming soon">
                  <Camera className="w-6 h-6 text-white" />
                </div>
                {/* Online indicator */}
                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-neon-green border-2 border-cyber-dark flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-neon-green live-pulse" />
                </div>
              </div>

              {/* User Info */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-foreground truncate">{pd.user.name}</h2>
                    <Badge variant="outline" className={cn('text-[10px] font-bold tracking-wider border', roleBadgeClasses[role])}>
                      {role.toUpperCase()}
                    </Badge>
                  </div>
                  {!editingProfile && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingProfile(true)}
                      className="text-muted-foreground hover:text-neon-blue h-8 px-3"
                    >
                      <Edit3 className="w-3.5 h-3.5 mr-1.5" />
                      Edit Profile
                    </Button>
                  )}
                </div>

                <div className="flex items-center gap-2 mt-1.5">
                  <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground truncate">{pd.user.email}</span>
                </div>

                <div className="flex flex-wrap items-center gap-4 mt-3">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Shield className="w-3 h-3" />
                    <span>Account: </span>
                    <span className={cn(
                      'font-medium',
                      pd.user.status === 'Active' ? 'text-neon-green' : 'text-neon-red'
                    )}>
                      {pd.user.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    <span>Joined: {formatDate(pd.user.createdAt)}</span>
                  </div>
                  {pd.user.lastLogin && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <LogIn className="w-3 h-3" />
                      <span>Last login: {formatDate(pd.user.lastLogin)}</span>
                    </div>
                  )}
                </div>

                {/* Inline edit form */}
                <AnimatePresence>
                  {editingProfile && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-4 p-4 rounded-lg bg-cyber-dark/50 border border-cyber-border space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <Label className="text-xs text-muted-foreground">Name</Label>
                            <Input
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              className="mt-1 h-9 bg-cyber-dark border-cyber-border focus:border-neon-blue text-foreground text-sm"
                            />
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">Email</Label>
                            <Input
                              value={editEmail}
                              onChange={(e) => setEditEmail(e.target.value)}
                              className="mt-1 h-9 bg-cyber-dark border-cyber-border focus:border-neon-blue text-foreground text-sm"
                            />
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={handleSaveProfile}
                            disabled={savingProfile}
                            className="h-8 px-4 bg-neon-blue/20 text-neon-blue hover:bg-neon-blue/30 border border-neon-blue/30"
                          >
                            {savingProfile ? <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Save className="w-3.5 h-3.5 mr-1.5" />}
                            Save Changes
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setEditingProfile(false);
                              setEditName(pd.user.name);
                              setEditEmail(pd.user.email);
                            }}
                            className="h-8 px-4 text-muted-foreground hover:text-foreground"
                          >
                            <X className="w-3.5 h-3.5 mr-1.5" />
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ===== B. Quick Stats Row ===== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'Total Logins',
            value: pd.successfulLoginCount,
            icon: LogIn,
            color: 'text-neon-blue',
            glow: 'neon-glow-blue',
            bg: 'bg-neon-blue/10',
          },
          {
            label: 'Failed Attempts',
            value: pd.failedLoginCount,
            icon: AlertTriangle,
            color: 'text-neon-red',
            glow: 'neon-glow-red',
            bg: 'bg-neon-red/10',
          },
          {
            label: 'Active Sessions',
            value: pd.activeSessionsCount,
            icon: Monitor,
            color: 'text-neon-green',
            glow: 'neon-glow-green',
            bg: 'bg-neon-green/10',
          },
          {
            label: 'Alerts Handled',
            value: pd.alertsResolved,
            icon: ShieldCheck,
            color: 'text-neon-purple',
            glow: 'neon-glow-purple',
            bg: 'bg-neon-purple/10',
          },
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + index * 0.05 }}
          >
            <Card className={cn('glass-card card-3d-hover', stat.glow)}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className={cn('p-2 rounded-lg', stat.bg)}>
                    <stat.icon className={cn('w-4 h-4', stat.color)} />
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/40" />
                </div>
                <div className={cn('text-2xl', stat.color)}>
                  <AnimatedCounter value={stat.value} />
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5">{stat.label}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* ===== C. Security Information Section ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Login History */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="glass-card alert-layered">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <Fingerprint className="w-4 h-4 text-neon-blue" />
                Login History
                <Badge variant="outline" className="ml-auto text-[10px] border-cyber-border text-muted-foreground">
                  Last 15
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="max-h-96 overflow-y-auto space-y-2 pr-1">
                {pd.loginHistory.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">No login history found</p>
                ) : (
                  pd.loginHistory.map((entry) => {
                    const isSuccess = entry.type === 'LOGIN_SUCCESS';
                    return (
                      <motion.div
                        key={entry.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={cn(
                          'flex items-start gap-3 p-3 rounded-lg border transition-colors',
                          isSuccess
                            ? 'bg-neon-green/5 border-neon-green/10 hover:bg-neon-green/10'
                            : 'bg-neon-red/5 border-neon-red/10 hover:bg-neon-red/10'
                        )}
                      >
                        <div className={cn(
                          'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5',
                          isSuccess ? 'bg-neon-green/15' : 'bg-neon-red/15'
                        )}>
                          {isSuccess ? (
                            <CheckCircle2 className="w-4 h-4 text-neon-green" />
                          ) : (
                            <XCircle className="w-4 h-4 text-neon-red" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className={cn('text-xs font-medium', isSuccess ? 'text-neon-green' : 'text-neon-red')}>
                              {isSuccess ? 'Success' : 'Failed'}
                            </span>
                            <span className="text-[10px] text-muted-foreground">{formatDate(entry.createdAt)}</span>
                          </div>
                          <div className="flex items-center gap-3 mt-1">
                            <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                              <Globe className="w-3 h-3" />
                              <span className="font-mono">{entry.ipAddress}</span>
                            </div>
                          </div>
                          <p className="text-[10px] text-muted-foreground/70 mt-1 truncate">{entry.details}</p>
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Right: Active Sessions */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <Card className="glass-card alert-layered">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <Monitor className="w-4 h-4 text-neon-green" />
                Active Sessions
                <Badge variant="outline" className="ml-auto text-[10px] border-neon-green/30 text-neon-green">
                  {pd.activeSessionsCount}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-4">
              {/* Session list (simulated from login history - recent successful logins) */}
              <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
                {pd.loginHistory
                  .filter((e) => e.type === 'LOGIN_SUCCESS')
                  .slice(0, 5)
                  .map((entry, idx) => (
                    <div
                      key={entry.id}
                      className="flex items-center gap-3 p-3 rounded-lg bg-white/3 border border-cyber-border/50"
                    >
                      <div className="w-8 h-8 rounded-lg bg-neon-green/10 flex items-center justify-center flex-shrink-0">
                        <Monitor className="w-4 h-4 text-neon-green" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-foreground font-medium">
                            Session {idx + 1}
                          </span>
                          <Badge
                            variant="outline"
                            className={cn(
                              'text-[9px] font-bold px-2 py-0.5',
                              idx === 0
                                ? 'border-neon-green/30 text-neon-green bg-neon-green/10'
                                : 'border-cyber-border text-muted-foreground'
                            )}
                          >
                            {idx === 0 ? 'Active' : 'Expired'}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-[11px] text-muted-foreground">
                          <Globe className="w-3 h-3" />
                          <span className="font-mono">{entry.ipAddress}</span>
                        </div>
                        <span className="text-[10px] text-muted-foreground/60 mt-0.5 block">
                          {formatDate(entry.createdAt)}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>

              <Separator className="bg-cyber-border" />

              {/* Logout all button */}
              <Button
                variant="outline"
                onClick={handleLogoutAll}
                disabled={loggingOutAll}
                className="w-full h-9 border-neon-red/30 bg-neon-red/5 text-neon-red hover:bg-neon-red/10 hover:text-neon-red"
              >
                {loggingOutAll ? (
                  <RefreshCw className="w-3.5 h-3.5 mr-2 animate-spin" />
                ) : (
                  <LogOut className="w-3.5 h-3.5 mr-2" />
                )}
                Logout All Devices
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* ===== D. Activity Overview Section ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Recent Activity */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="glass-card alert-layered">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <Activity className="w-4 h-4 text-neon-purple" />
                Recent Activity
                <Badge variant="outline" className="ml-auto text-[10px] border-cyber-border text-muted-foreground">
                  Last 10
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="max-h-96 overflow-y-auto space-y-2 pr-1">
                {pd.recentActivity.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">No recent activity</p>
                ) : (
                  pd.recentActivity.map((entry) => (
                    <div
                      key={entry.id}
                      className="flex items-start gap-3 p-3 rounded-lg bg-white/3 border border-cyber-border/30 hover:bg-white/5 transition-colors"
                    >
                      <div className="w-7 h-7 rounded-lg bg-cyber-dark flex items-center justify-center flex-shrink-0 mt-0.5">
                        {getActivityIcon(entry.action)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-foreground">
                            {entry.action.replace(/_/g, ' ')}
                          </span>
                          <span className="text-[10px] text-muted-foreground">{formatDate(entry.createdAt)}</span>
                        </div>
                        <p className="text-[10px] text-muted-foreground/70 mt-0.5 truncate">{entry.details}</p>
                        {entry.ipAddress && (
                          <span className="text-[9px] text-muted-foreground/50 font-mono mt-0.5 block">
                            IP: {entry.ipAddress}
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Right: Security Summary (role-based) */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
          <Card className="glass-card alert-layered">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-neon-blue" />
                {isAdmin(role) ? 'System Overview' : isAnalystOrAbove(role) ? 'Analyst Summary' : 'Personal Summary'}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="space-y-3">
                {isAdmin(role) ? (
                  <>
                    <StatRow icon={Users} label="Total Users" value={pd.totalUsers ?? 0} color="text-neon-blue" />
                    <StatRow icon={ShieldBan} label="Blocked IPs" value={pd.blockedIPs ?? 0} color="text-neon-red" />
                    <StatRow icon={AlertTriangle} label="System Alerts" value={pd.totalAlerts ?? 0} color="text-neon-yellow" />
                    <StatRow icon={ShieldCheck} label="Alerts Resolved" value={pd.alertsResolved} color="text-neon-green" />
                    <StatRow icon={LogIn} label="Successful Logins" value={pd.successfulLoginCount} color="text-neon-blue" />
                    <StatRow icon={XCircle} label="Failed Attempts" value={pd.failedLoginCount} color="text-neon-red" />
                  </>
                ) : isAnalystOrAbove(role) ? (
                  <>
                    <StatRow icon={Eye} label="Logs Reviewed" value={pd.logsReviewed ?? 0} color="text-neon-purple" />
                    <StatRow icon={ShieldCheck} label="Alerts Handled" value={pd.alertsResolved} color="text-neon-green" />
                    <StatRow icon={AlertTriangle} label="System Alerts" value={pd.totalAlerts ?? 0} color="text-neon-yellow" />
                    <StatRow icon={LogIn} label="Successful Logins" value={pd.successfulLoginCount} color="text-neon-blue" />
                    <StatRow icon={XCircle} label="Failed Attempts" value={pd.failedLoginCount} color="text-neon-red" />
                    <StatRow icon={Monitor} label="Active Sessions" value={pd.activeSessionsCount} color="text-neon-green" />
                  </>
                ) : (
                  <>
                    <StatRow icon={LogIn} label="Personal Logins" value={pd.successfulLoginCount} color="text-neon-blue" />
                    <StatRow icon={XCircle} label="Failed Attempts" value={pd.failedLoginCount} color="text-neon-red" />
                    <StatRow icon={ShieldCheck} label="Alerts Resolved" value={pd.alertsResolved} color="text-neon-green" />
                    <StatRow icon={Monitor} label="Active Sessions" value={pd.activeSessionsCount} color="text-neon-purple" />
                    <StatRow icon={Activity} label="Total Activities" value={pd.recentActivity.length} color="text-neon-orange" />
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* ===== E. Profile Actions Section ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Change Password */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card className="glass-card border-neon-red/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-neon-red uppercase tracking-wider flex items-center gap-2">
                <KeyRound className="w-4 h-4" />
                Change Password
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-4">
              <AnimatePresence mode="wait">
                {!changingPassword ? (
                  <motion.div
                    key="btn"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <Button
                      variant="outline"
                      onClick={() => setChangingPassword(true)}
                      className="w-full h-9 border-neon-red/30 bg-neon-red/5 text-neon-red hover:bg-neon-red/10"
                    >
                      <Lock className="w-3.5 h-3.5 mr-2" />
                      Change Password
                    </Button>
                  </motion.div>
                ) : (
                  <motion.div
                    key="form"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-3 overflow-hidden"
                  >
                    <div>
                      <Label className="text-xs text-muted-foreground">Current Password</Label>
                      <Input
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="mt-1 h-9 bg-cyber-dark border-cyber-border focus:border-neon-blue text-foreground text-sm"
                        placeholder="Enter current password"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">New Password</Label>
                      <Input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="mt-1 h-9 bg-cyber-dark border-cyber-border focus:border-neon-blue text-foreground text-sm"
                        placeholder="Enter new password (min 6 chars)"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Confirm New Password</Label>
                      <Input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="mt-1 h-9 bg-cyber-dark border-cyber-border focus:border-neon-blue text-foreground text-sm"
                        placeholder="Confirm new password"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={handleChangePassword}
                        disabled={savingPassword || !currentPassword || !newPassword || !confirmPassword}
                        className="h-8 px-4 bg-neon-red/20 text-neon-red hover:bg-neon-red/30 border border-neon-red/30"
                      >
                        {savingPassword ? <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Save className="w-3.5 h-3.5 mr-1.5" />}
                        Update Password
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setChangingPassword(false);
                          setCurrentPassword('');
                          setNewPassword('');
                          setConfirmPassword('');
                        }}
                        className="h-8 px-4 text-muted-foreground hover:text-foreground"
                      >
                        Cancel
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </motion.div>

        {/* Account Information */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>
          <Card className="glass-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-4 h-4 text-neon-blue" />
                Account Information
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-3">
              <InfoRow label="User ID" value={pd.user.id} mono />
              <InfoRow label="Full Name" value={pd.user.name} />
              <InfoRow label="Email" value={pd.user.email} />
              <InfoRow label="Role" value={role} />
              <InfoRow label="Status" value={pd.user.status} />
              <InfoRow label="Member Since" value={formatDate(pd.user.createdAt)} />
              <InfoRow label="Last Login" value={pd.user.lastLogin ? formatDate(pd.user.lastLogin) : 'Never'} />
              <Separator className="bg-cyber-border my-2" />
              <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                <TrendingUp className="w-3.5 h-3.5 text-neon-green" />
                <span>Auto-refreshing every 30 seconds</span>
                <span className="ml-auto status-dot online" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

// ===== Helper Sub-Components =====

function StatRow({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: number; color: string }) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-white/3 border border-cyber-border/30 hover:bg-white/5 transition-colors">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-cyber-dark flex items-center justify-center flex-shrink-0">
          <Icon className={cn('w-4 h-4', color)} />
        </div>
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <span className={cn('text-sm font-bold tabular-nums', color)}>{value.toLocaleString()}</span>
    </div>
  );
}

function InfoRow({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={cn('text-xs text-foreground max-w-[200px] truncate', mono && 'font-mono text-[10px]')}>
        {value}
      </span>
    </div>
  );
}
