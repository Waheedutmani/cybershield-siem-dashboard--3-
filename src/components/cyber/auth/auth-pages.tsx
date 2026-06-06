'use client';

import { useState } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { useAppStore } from '@/store/app-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Shield, Eye, EyeOff, AlertCircle, Lock, User, ShieldCheck, Download } from 'lucide-react';
import { motion } from 'framer-motion';

export function LoginPage() {
  const { setUser } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const res = await fetch('/api/download');
      if (!res.ok) throw new Error('Download failed');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'cybershield-siem-dashboard.zip';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch {
      setError('Source code download failed. Try again later.');
    } finally {
      setDownloading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setUser(data.user);
      // Navigate to dashboard after successful login
      useAppStore.getState().setBootComplete(true);
      sessionStorage.setItem('cs_boot_done', '1');
      useAppStore.getState().setCurrentPage('dashboard');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Login failed';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = (quickEmail: string, quickPassword: string) => {
    setEmail(quickEmail);
    setPassword(quickPassword);
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative z-10">
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
        className="w-full max-w-md mx-4"
      >
        <Card className="glass-card-3d neon-glow-blue border-cyber-border/60">
          <CardHeader className="text-center pb-2">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
              className="mx-auto mb-4 w-16 h-16 rounded-2xl bg-gradient-to-br from-neon-blue to-neon-purple flex items-center justify-center shadow-lg shadow-neon-blue/20"
            >
              <Shield className="w-8 h-8 text-white" />
            </motion.div>
            <CardTitle className="text-2xl font-bold text-foreground">
              CyberShield <span className="text-neon-blue">SIEM</span>
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">Security Operations Center</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              {error && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-2 p-3 rounded-lg bg-neon-red/10 border border-neon-red/20 text-neon-red text-sm"
                >
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </motion.div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-muted-foreground text-sm">Email</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@cybershield.io"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-cyber-dark/80 border-cyber-border focus:border-neon-blue text-foreground placeholder:text-muted-foreground/50 pl-10"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-muted-foreground text-sm">Password</Label>
                <div className="relative">
                  <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-cyber-dark/80 border-cyber-border focus:border-neon-blue text-foreground placeholder:text-muted-foreground/50 pl-10 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-neon-blue to-neon-purple hover:opacity-90 text-white font-semibold h-11 transition-all shadow-lg shadow-neon-blue/20"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Authenticating...
                  </span>
                ) : (
                  'Access Dashboard'
                )}
              </Button>

              {/* Quick Login Buttons */}
              <div className="space-y-2 pt-1">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium text-center">Quick Access</p>
                <div className="grid grid-cols-1 gap-2">
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.02, x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => quickLogin('admin@cybershield.io', 'Admin@2024')}
                    className="flex items-center gap-3 p-2.5 rounded-lg bg-white/[0.03] border border-cyber-border/60 hover:bg-neon-red/5 hover:border-neon-red/30 transition-all text-left group"
                  >
                    <div className="p-1.5 rounded-md bg-neon-red/10">
                      <Shield className="w-3.5 h-3.5 text-neon-red" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-foreground">Admin Access</p>
                      <p className="text-[10px] text-muted-foreground">admin@cybershield.io</p>
                    </div>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-neon-red/10 text-neon-red font-medium">Admin</span>
                  </motion.button>
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.02, x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => quickLogin('analyst@cybershield.io', 'Analyst@2024')}
                    className="flex items-center gap-3 p-2.5 rounded-lg bg-white/[0.03] border border-cyber-border/60 hover:bg-neon-blue/5 hover:border-neon-blue/30 transition-all text-left group"
                  >
                    <div className="p-1.5 rounded-md bg-neon-blue/10">
                      <User className="w-3.5 h-3.5 text-neon-blue" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-foreground">Analyst Access</p>
                      <p className="text-[10px] text-muted-foreground">analyst@cybershield.io</p>
                    </div>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-neon-blue/10 text-neon-blue font-medium">Analyst</span>
                  </motion.button>
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.02, x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => quickLogin('user@cybershield.io', 'User@2024')}
                    className="flex items-center gap-3 p-2.5 rounded-lg bg-white/[0.03] border border-cyber-border/60 hover:bg-neon-green/5 hover:border-neon-green/30 transition-all text-left group"
                  >
                    <div className="p-1.5 rounded-md bg-neon-green/10">
                      <ShieldCheck className="w-3.5 h-3.5 text-neon-green" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-foreground">User Access</p>
                      <p className="text-[10px] text-muted-foreground">user@cybershield.io</p>
                    </div>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-neon-green/10 text-neon-green font-medium">User</span>
                  </motion.button>
                </div>
              </div>

              {/* Download Source Code */}
              <div className="pt-2">
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={handleDownload}
                  disabled={downloading}
                  className="w-full flex items-center justify-center gap-2 p-3 rounded-lg bg-white/[0.03] border border-cyber-border/60 hover:bg-neon-purple/5 hover:border-neon-purple/30 transition-all text-sm"
                >
                  {downloading ? (
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <span className="w-3.5 h-3.5 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin" />
                      Packaging source code...
                    </span>
                  ) : (
                    <>
                      <Download className="w-4 h-4 text-neon-purple" />
                      <span className="text-muted-foreground">Download Source Code</span>
                    </>
                  )}
                </motion.button>
                <p className="text-[9px] text-muted-foreground/50 text-center mt-1">Next.js 16 + TypeScript + Tailwind CSS 4 + Prisma</p>
              </div>

              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => useAppStore.getState().setCurrentPage('register')}
                  className="text-sm text-muted-foreground hover:text-neon-blue transition-colors"
                >
                  Create new account
                </button>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

export function RegisterPage() {
  const { setUser } = useAuthStore();
  const setCurrentPage = useAppStore((s) => s.setCurrentPage);
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '', role: 'User' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setUser(data.user);
      // Navigate to dashboard after successful registration
      useAppStore.getState().setBootComplete(true);
      sessionStorage.setItem('cs_boot_done', '1');
      useAppStore.getState().setCurrentPage('dashboard');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Registration failed';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const update = (field: string, value: string) => setForm((f) => ({ ...f, [field]: value }));

  return (
    <div className="min-h-screen flex items-center justify-center relative z-10">
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
        className="w-full max-w-md mx-4"
      >
        <Card className="glass-card-3d neon-glow-green border-cyber-border/60">
          <CardHeader className="text-center pb-2">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
              className="mx-auto mb-4 w-16 h-16 rounded-2xl bg-gradient-to-br from-neon-green to-neon-blue flex items-center justify-center shadow-lg shadow-neon-green/20"
            >
              <Shield className="w-8 h-8 text-white" />
            </motion.div>
            <CardTitle className="text-2xl font-bold text-foreground">Create Account</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">Join the Security Operations Center</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleRegister} className="space-y-4">
              {error && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-2 p-3 rounded-lg bg-neon-red/10 border border-neon-red/20 text-neon-red text-sm"
                >
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </motion.div>
              )}
              <div className="space-y-2">
                <Label className="text-muted-foreground text-sm">Full Name</Label>
                <Input
                  placeholder="John Doe"
                  value={form.name}
                  onChange={(e) => update('name', e.target.value)}
                  className="bg-cyber-dark/80 border-cyber-border focus:border-neon-green text-foreground placeholder:text-muted-foreground/50"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground text-sm">Email</Label>
                <Input
                  type="email"
                  placeholder="analyst@cybershield.io"
                  value={form.email}
                  onChange={(e) => update('email', e.target.value)}
                  className="bg-cyber-dark/80 border-cyber-border focus:border-neon-green text-foreground placeholder:text-muted-foreground/50"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground text-sm">Password</Label>
                <Input
                  type="password"
                  placeholder="Min. 6 characters"
                  value={form.password}
                  onChange={(e) => update('password', e.target.value)}
                  className="bg-cyber-dark/80 border-cyber-border focus:border-neon-green text-foreground placeholder:text-muted-foreground/50"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground text-sm">Confirm Password</Label>
                <Input
                  type="password"
                  placeholder="Confirm password"
                  value={form.confirmPassword}
                  onChange={(e) => update('confirmPassword', e.target.value)}
                  className="bg-cyber-dark/80 border-cyber-border focus:border-neon-green text-foreground placeholder:text-muted-foreground/50"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground text-sm">Role</Label>
                <select
                  value={form.role}
                  onChange={(e) => update('role', e.target.value)}
                  className="w-full h-10 rounded-md bg-cyber-dark/80 border border-cyber-border text-foreground px-3 text-sm focus:outline-none focus:border-neon-green"
                >
                  <option value="User">User</option>
                  <option value="Analyst">Analyst</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-neon-green to-neon-blue hover:opacity-90 text-cyber-dark font-semibold h-11 shadow-lg shadow-neon-green/20"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                    Creating Account...
                  </span>
                ) : (
                  'Create Account'
                )}
              </Button>
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setCurrentPage('login')}
                  className="text-sm text-muted-foreground hover:text-neon-green transition-colors"
                >
                  Already have an account? Sign in
                </button>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
