'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TiltCard } from '@/components/ui/tilt-card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Users,
  Shield,
  ShieldAlert,
  ShieldCheck,
  UserPlus,
  Pencil,
  Trash2,
  Search,
  UserCheck,
  UserX,
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth-store';
import { motion, AnimatePresence } from 'framer-motion';

// ===== Types =====
interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  status: string;
  lastLogin: string | null;
  createdAt: string;
}

// ===== Role Colors Config =====
const roleColors: Record<string, { text: string; bg: string; border: string; icon: React.ElementType }> = {
  Admin: { text: 'text-neon-red', bg: 'bg-neon-red/10', border: 'border-neon-red/30', icon: Shield },
  Analyst: { text: 'text-neon-blue', bg: 'bg-neon-blue/10', border: 'border-neon-blue/30', icon: ShieldAlert },
  User: { text: 'text-neon-green', bg: 'bg-neon-green/10', border: 'border-neon-green/30', icon: ShieldCheck },
};

// ===== Animated Counter =====
function AnimatedCounter({ target, duration = 1500 }: { target: number; duration?: number }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration]);
  return <span>{count.toLocaleString()}</span>;
}

// ===== Toast Helper =====
function useToast() {
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  return { toast, showToast };
}

// ===== Main UsersPage =====
export function UsersPage() {
  const { user: currentUser } = useAuthStore();
  const { toast, showToast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Dialog states
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Add form state
  const [addForm, setAddForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'User',
    status: 'Active',
  });
  const [addErrors, setAddErrors] = useState<Record<string, string>>({});

  // Edit form state
  const [editForm, setEditForm] = useState({
    name: '',
    role: '',
    status: '',
  });
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});

  // Fetch users
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users);
      } else {
        setUsers([]);
      }
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Filtered users
  const filteredUsers = users.filter((u) => {
    const q = searchQuery.toLowerCase();
    return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
  });

  // Stats
  const totalUsers = users.length;
  const activeUsers = users.filter((u) => u.status === 'Active').length;
  const suspendedUsers = users.filter((u) => u.status === 'Suspended').length;

  // ===== Validation =====
  const validateAddForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!addForm.name.trim()) errors.name = 'Full name is required';
    if (!addForm.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(addForm.email)) {
      errors.email = 'Invalid email format';
    }
    if (!addForm.password) {
      errors.password = 'Password is required';
    } else if (addForm.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }
    if (!addForm.role) errors.role = 'Role is required';
    if (!addForm.status) errors.status = 'Status is required';

    setAddErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateEditForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!editForm.name.trim()) errors.name = 'Full name is required';
    if (!editForm.role) errors.role = 'Role is required';
    if (!editForm.status) errors.status = 'Status is required';
    setEditErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // ===== Add User =====
  const handleAddUser = async () => {
    if (!validateAddForm()) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addForm),
      });
      if (res.ok) {
        const data = await res.json();
        setUsers((prev) => [...prev, data.user]);
        setShowAddDialog(false);
        resetAddForm();
        showToast('User created successfully', 'success');
      } else {
        const err = await res.json();
        showToast(err.error || 'Failed to create user', 'error');
      }
    } catch {
      showToast('Network error', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const resetAddForm = () => {
    setAddForm({ name: '', email: '', password: '', role: 'User', status: 'Active' });
    setAddErrors({});
  };

  // ===== Edit User =====
  const openEditDialog = (user: User) => {
    setSelectedUser(user);
    setEditForm({ name: user.name, role: user.role, status: user.status });
    setEditErrors({});
    setShowEditDialog(true);
  };

  const handleEditUser = async () => {
    if (!selectedUser || !validateEditForm()) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUser.id,
          name: editForm.name,
          role: editForm.role,
          status: editForm.status,
        }),
      });
      if (res.ok) {
        setUsers((prev) =>
          prev.map((u) =>
            u.id === selectedUser.id
              ? { ...u, name: editForm.name, role: editForm.role, status: editForm.status }
              : u
          )
        );
        setShowEditDialog(false);
        setSelectedUser(null);
        showToast('User updated successfully', 'success');
      } else {
        const err = await res.json();
        showToast(err.error || 'Failed to update user', 'error');
      }
    } catch {
      showToast('Network error', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // ===== Delete User =====
  const openDeleteDialog = (user: User) => {
    setSelectedUser(user);
    setShowDeleteDialog(true);
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/users', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: selectedUser.id }),
      });
      if (res.ok) {
        setUsers((prev) => prev.filter((u) => u.id !== selectedUser.id));
        setShowDeleteDialog(false);
        setSelectedUser(null);
        showToast('User deleted successfully', 'success');
      } else {
        const err = await res.json();
        showToast(err.error || 'Failed to delete user', 'error');
      }
    } catch {
      showToast('Network error', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // ===== Access Denied =====
  if (currentUser?.role !== 'Admin') {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
        <ShieldAlert className="w-16 h-16 text-neon-red mb-4 opacity-30" />
        <h2 className="text-xl font-semibold text-foreground">Access Denied</h2>
        <p className="text-sm text-muted-foreground mt-1">This page is restricted to Admin users only.</p>
      </div>
    );
  }

  const isSelf = (userId: string) => userId === currentUser?.id;

  return (
    <div className="space-y-6 animate-fade-in relative">
      {/* Floating Toast */}
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

      {/* ===== Header ===== */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-neon-blue/10">
            <Users className="w-5 h-5 text-neon-blue" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              User Management
              <span className="text-xs text-muted-foreground bg-white/5 border border-cyber-border px-2.5 py-0.5 rounded-full font-medium">
                {users.length} user{users.length !== 1 ? 's' : ''}
              </span>
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">Manage system access, roles, and permissions</p>
          </div>
        </div>
        <Button
          onClick={() => {
            resetAddForm();
            setShowAddDialog(true);
          }}
          className="btn-3d-press press-3d gap-2 bg-neon-blue/20 text-neon-blue border border-neon-blue/30 hover:bg-neon-blue/30 hover:text-neon-blue transition-all"
        >
          <UserPlus className="w-4 h-4" />
          Add New User
        </Button>
      </motion.div>

      {/* ===== Stat Cards ===== */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            title: 'Total Users',
            value: totalUsers,
            icon: Users,
            color: 'text-neon-blue',
            bgColor: 'bg-neon-blue/10',
            borderColor: 'border-neon-blue/20',
            glowColor: 'rgba(0,180,255,0.12)',
          },
          {
            title: 'Active Users',
            value: activeUsers,
            icon: UserCheck,
            color: 'text-neon-green',
            bgColor: 'bg-neon-green/10',
            borderColor: 'border-neon-green/20',
            glowColor: 'rgba(0,255,136,0.12)',
          },
          {
            title: 'Suspended Users',
            value: suspendedUsers,
            icon: UserX,
            color: 'text-neon-red',
            bgColor: 'bg-neon-red/10',
            borderColor: 'border-neon-red/20',
            glowColor: 'rgba(255,51,102,0.12)',
          },
        ].map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
              <TiltCard className="glass-card group cursor-default" glowColor={stat.glowColor}>
                <Card
                  className="bg-transparent border-0 shadow-none"
                  style={{ background: 'transparent', boxShadow: 'none', border: 'none' }}
                >
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                          {stat.title}
                        </p>
                        <p className="text-3xl font-bold text-foreground">
                          <AnimatedCounter target={stat.value} />
                        </p>
                      </div>
                      <div className={cn('p-2.5 rounded-xl', stat.bgColor)}>
                        <Icon className={cn('w-5 h-5', stat.color)} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TiltCard>
            </motion.div>
          );
        })}
      </div>

      {/* ===== Users Table ===== */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <Card className="glass-card-3d card-float-3d corner-frame analytics-panel-3d">
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <Shield className="w-4 h-4 text-neon-blue" />
                System Users
              </CardTitle>
              {/* Search */}
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9 text-sm bg-white/[0.03] border-cyber-border focus:border-neon-blue/50 focus:ring-neon-blue/20"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="space-y-2 p-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-14 bg-white/[0.02] rounded-lg animate-pulse" />
                ))}
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p className="text-sm font-medium">No users found</p>
                <p className="text-xs mt-1 opacity-60">
                  {searchQuery ? 'Try adjusting your search query' : 'Click "Add New User" to get started'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-cyber-border">
                      <th className="text-left py-3 px-4 text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
                        User
                      </th>
                      <th className="text-left py-3 px-4 text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
                        Role
                      </th>
                      <th className="text-left py-3 px-4 text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
                        Status
                      </th>
                      <th className="text-left py-3 px-4 text-[10px] text-muted-foreground uppercase tracking-wider font-medium hidden md:table-cell">
                        Last Login
                      </th>
                      <th className="text-left py-3 px-4 text-[10px] text-muted-foreground uppercase tracking-wider font-medium hidden lg:table-cell">
                        Created
                      </th>
                      <th className="text-right py-3 px-4 text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user, idx) => {
                      const roleConfig = roleColors[user.role] || roleColors.User;
                      const RoleIcon = roleConfig.icon;

                      return (
                        <motion.tr
                          key={user.id}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.04 }}
                          className="user-row-3d border-b border-cyber-border/30 transition-colors"
                        >
                          {/* User Info */}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <div
                                className={cn(
                                  'w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0',
                                  user.role === 'Admin'
                                    ? 'bg-gradient-to-br from-neon-red to-neon-orange'
                                    : user.role === 'Analyst'
                                      ? 'bg-gradient-to-br from-neon-blue to-neon-purple'
                                      : 'bg-gradient-to-br from-neon-green to-neon-blue'
                                )}
                              >
                                {user.name.charAt(0).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-foreground truncate">
                                  {user.name}
                                  {isSelf(user.id) && (
                                    <span className="text-[10px] ml-2 px-1.5 py-0.5 rounded bg-neon-blue/10 text-neon-blue border border-neon-blue/20 font-medium">
                                      You
                                    </span>
                                  )}
                                </p>
                                <p className="text-[11px] text-muted-foreground truncate">{user.email}</p>
                              </div>
                            </div>
                          </td>

                          {/* Role Badge */}
                          <td className="py-3 px-4">
                            <span
                              className={cn(
                                'inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full font-medium border',
                                roleConfig.text,
                                roleConfig.bg,
                                roleConfig.border
                              )}
                            >
                              <RoleIcon className="w-3 h-3" />
                              {user.role}
                            </span>
                          </td>

                          {/* Status Badge */}
                          <td className="py-3 px-4">
                            <span
                              className={cn(
                                'inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full font-medium border',
                                user.status === 'Active'
                                  ? 'bg-neon-green/10 text-neon-green border-neon-green/30'
                                  : 'bg-neon-red/10 text-neon-red border-neon-red/30'
                              )}
                            >
                              <span
                                className={cn(
                                  'w-1.5 h-1.5 rounded-full',
                                  user.status === 'Active'
                                    ? 'bg-neon-green live-pulse'
                                    : 'bg-neon-red'
                                )}
                              />
                              {user.status}
                            </span>
                          </td>

                          {/* Last Login */}
                          <td className="py-3 px-4 text-xs text-muted-foreground hidden md:table-cell">
                            {user.lastLogin ? (
                              <div className="flex items-center gap-1.5">
                                <Clock className="w-3 h-3 opacity-50" />
                                <span>{new Date(user.lastLogin).toLocaleString()}</span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground/50">Never</span>
                            )}
                          </td>

                          {/* Created */}
                          <td className="py-3 px-4 text-xs text-muted-foreground hidden lg:table-cell">
                            {new Date(user.createdAt).toLocaleDateString()}
                          </td>

                          {/* Actions */}
                          <td className="py-3 px-4">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => openEditDialog(user)}
                                className="press-3d h-8 w-8 p-0 text-muted-foreground hover:text-neon-blue hover:bg-neon-blue/10 transition-all"
                                title={isSelf(user.id) ? 'View profile' : 'Edit user'}
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </Button>
                              {!isSelf(user.id) && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => openDeleteDialog(user)}
                                  className="press-3d h-8 w-8 p-0 text-muted-foreground hover:text-neon-red hover:bg-neon-red/10 transition-all"
                                  title="Delete user"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              )}
                            </div>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* ===== Add User Dialog ===== */}
      <Dialog open={showAddDialog} onOpenChange={(open) => { if (!open) { setShowAddDialog(false); resetAddForm(); } }}>
        <DialogContent className="glass-card-3d floating-panel sm:max-w-md border-cyber-border bg-cyber-card/95 backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <div className="p-2 rounded-lg bg-neon-blue/10">
                <UserPlus className="w-4 h-4 text-neon-blue" />
              </div>
              Add New User
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-xs">
              Create a new user account with role-based access permissions.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            {/* Full Name */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                Full Name <span className="text-neon-red">*</span>
              </Label>
              <Input
                placeholder="Enter full name"
                value={addForm.name}
                onChange={(e) => {
                  setAddForm((prev) => ({ ...prev, name: e.target.value }));
                  if (addErrors.name) setAddErrors((prev) => ({ ...prev, name: '' }));
                }}
                className={cn(
                  'h-9 bg-white/[0.03] border-cyber-border text-sm',
                  addErrors.name && 'border-neon-red/50 focus:border-neon-red focus:ring-neon-red/20'
                )}
              />
              {addErrors.name && <p className="text-[11px] text-neon-red">{addErrors.name}</p>}
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                Email <span className="text-neon-red">*</span>
              </Label>
              <Input
                type="email"
                placeholder="user@example.com"
                value={addForm.email}
                onChange={(e) => {
                  setAddForm((prev) => ({ ...prev, email: e.target.value }));
                  if (addErrors.email) setAddErrors((prev) => ({ ...prev, email: '' }));
                }}
                className={cn(
                  'h-9 bg-white/[0.03] border-cyber-border text-sm',
                  addErrors.email && 'border-neon-red/50 focus:border-neon-red focus:ring-neon-red/20'
                )}
              />
              {addErrors.email && <p className="text-[11px] text-neon-red">{addErrors.email}</p>}
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                Password <span className="text-neon-red">*</span>
              </Label>
              <Input
                type="password"
                placeholder="Min. 6 characters"
                value={addForm.password}
                onChange={(e) => {
                  setAddForm((prev) => ({ ...prev, password: e.target.value }));
                  if (addErrors.password) setAddErrors((prev) => ({ ...prev, password: '' }));
                }}
                className={cn(
                  'h-9 bg-white/[0.03] border-cyber-border text-sm',
                  addErrors.password && 'border-neon-red/50 focus:border-neon-red focus:ring-neon-red/20'
                )}
              />
              {addErrors.password && <p className="text-[11px] text-neon-red">{addErrors.password}</p>}
            </div>

            {/* Role + Status row */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                  Role <span className="text-neon-red">*</span>
                </Label>
                <Select
                  value={addForm.role}
                  onValueChange={(v) => setAddForm((prev) => ({ ...prev, role: v }))}
                >
                  <SelectTrigger className="h-9 bg-white/[0.03] border-cyber-border text-sm">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent className="bg-cyber-card border-cyber-border">
                    <SelectItem value="Admin">
                      <span className="flex items-center gap-2">
                        <Shield className="w-3 h-3 text-neon-red" /> Admin
                      </span>
                    </SelectItem>
                    <SelectItem value="Analyst">
                      <span className="flex items-center gap-2">
                        <ShieldAlert className="w-3 h-3 text-neon-blue" /> Analyst
                      </span>
                    </SelectItem>
                    <SelectItem value="User">
                      <span className="flex items-center gap-2">
                        <ShieldCheck className="w-3 h-3 text-neon-green" /> User
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                  Status <span className="text-neon-red">*</span>
                </Label>
                <Select
                  value={addForm.status}
                  onValueChange={(v) => setAddForm((prev) => ({ ...prev, status: v }))}
                >
                  <SelectTrigger className="h-9 bg-white/[0.03] border-cyber-border text-sm">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent className="bg-cyber-card border-cyber-border">
                    <SelectItem value="Active">
                      <span className="flex items-center gap-2">
                        <UserCheck className="w-3 h-3 text-neon-green" /> Active
                      </span>
                    </SelectItem>
                    <SelectItem value="Suspended">
                      <span className="flex items-center gap-2">
                        <UserX className="w-3 h-3 text-neon-red" /> Suspended
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="ghost"
              onClick={() => {
                setShowAddDialog(false);
                resetAddForm();
              }}
              className="text-muted-foreground hover:text-foreground hover:bg-white/5"
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddUser}
              disabled={submitting}
              className="btn-3d-press press-3d gap-2 bg-neon-blue/20 text-neon-blue border border-neon-blue/30 hover:bg-neon-blue/30"
            >
              {submitting ? (
                <span className="w-4 h-4 border-2 border-neon-blue border-t-transparent rounded-full animate-spin" />
              ) : (
                <UserPlus className="w-4 h-4" />
              )}
              {submitting ? 'Creating...' : 'Create User'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== Edit User Dialog ===== */}
      <Dialog open={showEditDialog} onOpenChange={(open) => { if (!open) { setShowEditDialog(false); setSelectedUser(null); } }}>
        <DialogContent className="glass-card-3d floating-panel sm:max-w-md border-cyber-border bg-cyber-card/95 backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <div className="p-2 rounded-lg bg-neon-blue/10">
                <Pencil className="w-4 h-4 text-neon-blue" />
              </div>
              Edit User
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-xs">
              {isSelf(selectedUser?.id || '')
                ? 'You can update your display name. Role and status cannot be changed for your own account.'
                : 'Update user information, role, and account status.'}
            </DialogDescription>
          </DialogHeader>

          {selectedUser && (
            <div className="space-y-4 py-2">
              {/* User avatar preview */}
              <div className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.02] border border-cyber-border/50">
                <div
                  className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold',
                    selectedUser.role === 'Admin'
                      ? 'bg-gradient-to-br from-neon-red to-neon-orange'
                      : selectedUser.role === 'Analyst'
                        ? 'bg-gradient-to-br from-neon-blue to-neon-purple'
                        : 'bg-gradient-to-br from-neon-green to-neon-blue'
                  )}
                >
                  {selectedUser.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground truncate">{selectedUser.name}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{selectedUser.email}</p>
                </div>
              </div>

              {/* Full Name */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                  Full Name <span className="text-neon-red">*</span>
                </Label>
                <Input
                  value={editForm.name}
                  onChange={(e) => {
                    setEditForm((prev) => ({ ...prev, name: e.target.value }));
                    if (editErrors.name) setEditErrors((prev) => ({ ...prev, name: '' }));
                  }}
                  className={cn(
                    'h-9 bg-white/[0.03] border-cyber-border text-sm',
                    editErrors.name && 'border-neon-red/50 focus:border-neon-red focus:ring-neon-red/20'
                  )}
                />
                {editErrors.name && <p className="text-[11px] text-neon-red">{editErrors.name}</p>}
              </div>

              {/* Email (readonly) */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                  Email
                </Label>
                <Input
                  value={selectedUser.email}
                  disabled
                  className="h-9 bg-white/[0.02] border-cyber-border/50 text-sm text-muted-foreground cursor-not-allowed"
                />
              </div>

              {/* Role + Status */}
              {!isSelf(selectedUser.id) && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                      Role <span className="text-neon-red">*</span>
                    </Label>
                    <Select
                      value={editForm.role}
                      onValueChange={(v) => setEditForm((prev) => ({ ...prev, role: v }))}
                    >
                      <SelectTrigger className="h-9 bg-white/[0.03] border-cyber-border text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-cyber-card border-cyber-border">
                        <SelectItem value="Admin">
                          <span className="flex items-center gap-2">
                            <Shield className="w-3 h-3 text-neon-red" /> Admin
                          </span>
                        </SelectItem>
                        <SelectItem value="Analyst">
                          <span className="flex items-center gap-2">
                            <ShieldAlert className="w-3 h-3 text-neon-blue" /> Analyst
                          </span>
                        </SelectItem>
                        <SelectItem value="User">
                          <span className="flex items-center gap-2">
                            <ShieldCheck className="w-3 h-3 text-neon-green" /> User
                          </span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                      Status <span className="text-neon-red">*</span>
                    </Label>
                    <Select
                      value={editForm.status}
                      onValueChange={(v) => setEditForm((prev) => ({ ...prev, status: v }))}
                    >
                      <SelectTrigger className="h-9 bg-white/[0.03] border-cyber-border text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-cyber-card border-cyber-border">
                        <SelectItem value="Active">
                          <span className="flex items-center gap-2">
                            <UserCheck className="w-3 h-3 text-neon-green" /> Active
                          </span>
                        </SelectItem>
                        <SelectItem value="Suspended">
                          <span className="flex items-center gap-2">
                            <UserX className="w-3 h-3 text-neon-red" /> Suspended
                          </span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {isSelf(selectedUser.id) && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                      Role
                    </Label>
                    <div className="flex items-center gap-2 h-9 px-3 rounded-md bg-white/[0.02] border border-cyber-border/50">
                      {(() => {
                        const rc = roleColors[selectedUser.role] || roleColors.User;
                        const RI = rc.icon;
                        return (
                          <span className={cn('inline-flex items-center gap-1.5 text-xs font-medium', rc.text)}>
                            <RI className="w-3 h-3" />
                            {selectedUser.role}
                          </span>
                        );
                      })()}
                    </div>
                    <p className="text-[10px] text-muted-foreground/60">Cannot change your own role</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                      Status
                    </Label>
                    <div className="flex items-center gap-2 h-9 px-3 rounded-md bg-white/[0.02] border border-cyber-border/50">
                      <span
                        className={cn(
                          'inline-flex items-center gap-1.5 text-xs font-medium',
                          selectedUser.status === 'Active'
                            ? 'text-neon-green'
                            : 'text-neon-red'
                        )}
                      >
                        <span
                          className={cn(
                            'w-1.5 h-1.5 rounded-full',
                            selectedUser.status === 'Active' ? 'bg-neon-green live-pulse' : 'bg-neon-red'
                          )}
                        />
                        {selectedUser.status}
                      </span>
                    </div>
                    <p className="text-[10px] text-muted-foreground/60">Cannot change your own status</p>
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-2 pt-2">
            <Button
              variant="ghost"
              onClick={() => {
                setShowEditDialog(false);
                setSelectedUser(null);
              }}
              className="text-muted-foreground hover:text-foreground hover:bg-white/5"
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleEditUser}
              disabled={submitting}
              className="press-3d gap-2 bg-neon-blue/20 text-neon-blue border border-neon-blue/30 hover:bg-neon-blue/30"
            >
              {submitting ? (
                <span className="w-4 h-4 border-2 border-neon-blue border-t-transparent rounded-full animate-spin" />
              ) : (
                <Pencil className="w-4 h-4" />
              )}
              {submitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== Delete Confirmation Dialog ===== */}
      <Dialog open={showDeleteDialog} onOpenChange={(open) => { if (!open) { setShowDeleteDialog(false); setSelectedUser(null); } }}>
        <DialogContent className="glass-card-3d floating-panel sm:max-w-md border-neon-red/20 bg-cyber-card/95 backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <div className="p-2 rounded-lg bg-neon-red/10">
                <AlertTriangle className="w-4 h-4 text-neon-red" />
              </div>
              Delete User
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-xs">
              This action cannot be undone. Please confirm the deletion.
            </DialogDescription>
          </DialogHeader>

          {selectedUser && (
            <div className="space-y-4 py-2">
              {/* User preview */}
              <div className="flex items-center gap-3 p-4 rounded-lg bg-neon-red/5 border border-neon-red/20">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-neon-red to-neon-orange flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                  {selectedUser.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{selectedUser.name}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{selectedUser.email}</p>
                </div>
              </div>

              {/* Warning */}
              <div className="flex items-start gap-3 p-3 rounded-lg bg-neon-red/5 border border-neon-red/15">
                <AlertTriangle className="w-4 h-4 text-neon-red mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-medium text-neon-red">Warning: Permanent Deletion</p>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    This will permanently remove <strong className="text-foreground">{selectedUser.name}</strong> and
                    all associated data from the system. This action cannot be reversed.
                  </p>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 pt-2">
            <Button
              variant="ghost"
              onClick={() => {
                setShowDeleteDialog(false);
                setSelectedUser(null);
              }}
              className="text-muted-foreground hover:text-foreground hover:bg-white/5"
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeleteUser}
              disabled={submitting}
              className="press-3d gap-2 bg-neon-red/20 text-neon-red border border-neon-red/30 hover:bg-neon-red/30"
            >
              {submitting ? (
                <span className="w-4 h-4 border-2 border-neon-red border-t-transparent rounded-full animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
              {submitting ? 'Deleting...' : 'Delete User'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
