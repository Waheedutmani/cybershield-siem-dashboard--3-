'use client';

import { useState } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { useAppStore, type PageType, type ThemeType } from '@/store/app-store';
import { canAccessPage, type UserRole } from '@/lib/rbac';
import { cn } from '@/lib/utils';
import {
  Shield,
  LayoutDashboard,
  FileText,
  AlertTriangle,
  BarChart3,
  Swords,
  Users,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Bell,
  Zap,
  Globe,
  Clock,
  ShieldBan,
  Activity,
  Search,
  MonitorDot,
  Palette,
  TrendingUp,
  Lock,
  UserCircle,
  Monitor,
  Volume2,
  VolumeX,
  Download,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

interface NavItem {
  icon: React.ElementType;
  label: string;
  page: PageType;
  requiredRole?: UserRole[];
}

const navItems: NavItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard', page: 'dashboard' },
  { icon: Globe, label: 'Attack Map', page: 'attackmap', requiredRole: ['Admin', 'Analyst'] },
  { icon: Search, label: 'Threat Search', page: 'search', requiredRole: ['Admin', 'Analyst'] },
  { icon: Clock, label: 'Timeline', page: 'timeline', requiredRole: ['Admin', 'Analyst'] },
  { icon: BarChart3, label: 'Analytics', page: 'analytics', requiredRole: ['Admin', 'Analyst'] },
  { icon: TrendingUp, label: 'Attack Stats', page: 'statistics', requiredRole: ['Admin', 'Analyst'] },
  { icon: FileText, label: 'Security Logs', page: 'logs' },
  { icon: AlertTriangle, label: 'Alerts', page: 'alerts' },
  { icon: MonitorDot, label: 'Sessions', page: 'sessions' },
  { icon: ShieldBan, label: 'Firewall', page: 'firewall', requiredRole: ['Admin'] },
  { icon: Activity, label: 'Monitoring', page: 'monitoring', requiredRole: ['Admin', 'Analyst'] },
  { icon: Swords, label: 'Attack Sim', page: 'simulation', requiredRole: ['Admin', 'Analyst'] },
  { icon: Users, label: 'Users', page: 'users', requiredRole: ['Admin'] },
  { icon: Settings, label: 'Settings', page: 'settings' },
  { icon: UserCircle, label: 'Profile', page: 'profile' },
];

const themeOptions: { value: ThemeType; label: string; icon: React.ElementType; color: string }[] = [
  { value: 'soc-dark', label: 'SOC Dark', icon: Shield, color: '#00d4ff' },
  { value: 'neon-blue', label: 'Neon Blue', icon: Globe, color: '#22d3ee' },
  { value: 'matrix-green', label: 'Matrix Green', icon: Activity, color: '#00ff88' },
];

const roleConfig: Record<string, { color: string; bg: string; border: string; label: string }> = {
  Admin: { color: 'text-neon-red', bg: 'bg-neon-red/15', border: 'border-neon-red/30', label: 'ADMIN' },
  Analyst: { color: 'text-neon-blue', bg: 'bg-neon-blue/15', border: 'border-neon-blue/30', label: 'ANALYST' },
  User: { color: 'text-neon-green', bg: 'bg-neon-green/15', border: 'border-neon-green/30', label: 'USER' },
};

export function Sidebar() {
  const { currentPage, setCurrentPage, sidebarOpen, toggleSidebar, theme, setTheme } = useAppStore();
  const { user, logout } = useAuthStore();
  const notifications = useAppStore((s) => s.notifications);

  const unreadCount = notifications.filter((n) => {
    const diff = Date.now() - n.timestamp.getTime();
    return diff < 10000;
  }).length;

  const currentTheme = themeOptions.find((t) => t.value === theme) || themeOptions[0];
  const userRole = user?.role || 'User';
  const roleConf = roleConfig[userRole] || roleConfig.User;

  // Filter nav items based on RBAC
  const visibleNavItems = navItems.filter((item) => {
    if (!item.requiredRole) return true;
    return item.requiredRole.includes(userRole as UserRole);
  });

  return (
    <aside
      className={cn(
        'flex-shrink-0 h-screen transition-all duration-300 ease-in-out flex flex-col sticky top-0 z-40',
        'border-r border-cyber-border backdrop-blur-xl sidebar-glow sidebar-3d-layered',
        sidebarOpen ? 'w-64' : 'w-[72px]'
      )}
      style={{ background: 'var(--theme-sidebar-bg, rgba(15, 22, 41, 0.9))' }}
    >
      {/* Logo */}
      <div className="flex items-center h-16 px-4 border-b border-cyber-border">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: `linear-gradient(135deg, ${currentTheme.color}, ${currentTheme.color}88)` }}
          >
            <Shield className="w-5 h-5 text-white" />
          </div>
          {sidebarOpen && (
            <div className="animate-fade-in">
              <h1 className="text-sm font-bold tracking-wider" style={{ color: currentTheme.color }}>
                CYBERSHIELD
              </h1>
              <p className="text-[10px] text-muted-foreground tracking-widest">SIEM DASHBOARD</p>
            </div>
          )}
        </div>
      </div>

      {/* Role Badge Banner */}
      {sidebarOpen && (
        <div className={cn(
          'mx-3 mt-3 px-3 py-2 rounded-lg border text-center',
          roleConf.bg, roleConf.border
        )}>
          <div className="flex items-center justify-center gap-2">
            {userRole === 'Admin' ? (
              <Shield className={cn('w-3.5 h-3.5', roleConf.color)} />
            ) : userRole === 'Analyst' ? (
              <Activity className={cn('w-3.5 h-3.5', roleConf.color)} />
            ) : (
              <Lock className={cn('w-3.5 h-3.5', roleConf.color)} />
            )}
            <span className={cn('text-[10px] font-bold tracking-widest', roleConf.color)}>
              {roleConf.label} ACCESS
            </span>
          </div>
          <p className="text-[9px] text-muted-foreground mt-0.5">
            {userRole === 'Admin' ? 'Full system control' : userRole === 'Analyst' ? 'Monitoring & analysis' : 'Personal dashboard'}
          </p>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 overflow-y-auto">
        <div className="space-y-1">
          {visibleNavItems.map((item) => {
            const isActive = currentPage === item.page;
            const Icon = item.icon;
            const isRestricted = item.requiredRole && !item.requiredRole.includes(userRole as UserRole);
            return (
              <button
                key={item.page}
                onClick={() => !isRestricted && setCurrentPage(item.page)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                  'hover:bg-white/5 group nav-item-3d btn-3d-press',
                  isRestricted
                    ? 'opacity-40 cursor-not-allowed'
                    : isActive
                      ? 'bg-neon-blue/10 text-neon-blue neon-glow-blue nav-item-3d-active'
                      : 'text-muted-foreground hover:text-foreground'
                )}
                title={!sidebarOpen ? item.label : undefined}
                disabled={isRestricted}
              >
                <Icon
                  className={cn(
                    'w-5 h-5 flex-shrink-0 transition-all duration-300',
                    isActive ? 'text-neon-blue drop-shadow-[0_0_6px_rgba(0,212,255,0.5)]' : 'text-muted-foreground group-hover:text-foreground'
                  )}
                />
                {sidebarOpen && <span>{item.label}</span>}
                {isActive && sidebarOpen && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-neon-blue" />
                )}
                {/* Admin lock indicator for admin-only items (visible in expanded mode) */}
                {sidebarOpen && item.requiredRole?.length === 1 && item.requiredRole[0] === 'Admin' && (
                  <span className="ml-auto text-[9px] text-neon-red/60">
                    <Shield className="w-3 h-3" />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Bottom section */}
      <div className="border-t border-cyber-border p-3 space-y-2">
        {/* Theme Switcher */}
        {sidebarOpen && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all h-auto btn-3d-press"
              >
                <Palette className="w-4 h-4" />
                <span className="flex-1 text-left">{currentTheme.label}</span>
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ background: currentTheme.color, boxShadow: `0 0 6px ${currentTheme.color}60` }}
                />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-cyber-card border-cyber-border">
              {themeOptions.map((t) => (
                <DropdownMenuItem
                  key={t.value}
                  onClick={() => setTheme(t.value)}
                  className={cn(
                    'flex items-center gap-2 cursor-pointer',
                    theme === t.value && 'bg-white/5'
                  )}
                >
                  <t.icon className="w-4 h-4" style={{ color: t.color }} />
                  <span>{t.label}</span>
                  {theme === t.value && (
                    <div className="ml-auto w-2 h-2 rounded-full" style={{ background: t.color }} />
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* Download Source Code */}
        <a
          href="/api/download"
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-neon-green hover:bg-neon-green/5 transition-all btn-3d-press"
          title="Download Source Code"
        >
          <Download className="w-5 h-5" />
          {sidebarOpen && <span>Download Code</span>}
        </a>

        {/* Notifications */}
        <button
          onClick={() => setCurrentPage('alerts')}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all relative btn-3d-press"
        >
          <div className="relative">
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-neon-red rounded-full text-[8px] text-white flex items-center justify-center font-bold">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </div>
          {sidebarOpen && <span>Notifications</span>}
        </button>

        {/* User info & logout */}
        {sidebarOpen && user && (
          <div className="px-3 py-2 rounded-lg bg-white/5">
            <p className="text-xs font-medium text-foreground truncate">{user.name}</p>
            <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
            <div className="flex items-center justify-between mt-1.5">
              <span className={cn('text-[10px] px-1.5 py-0.5 rounded font-bold tracking-wider', roleConf.bg, roleConf.color, 'border', roleConf.border)}>
                {roleConf.label}
              </span>
              <button
                onClick={logout}
                className="text-muted-foreground hover:text-neon-red transition-colors btn-3d-press"
                title="Logout"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Collapsed user avatar */}
        {!sidebarOpen && user && (
          <button
            onClick={logout}
            className="w-full flex items-center justify-center py-2 rounded-lg text-muted-foreground hover:text-neon-red hover:bg-white/5 transition-all btn-3d-press"
            title={`Logout (${user.name})`}
          >
            <div className={cn(
              'w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold border',
              roleConf.bg, roleConf.color, roleConf.border
            )}>
              {user.name.charAt(0).toUpperCase()}
            </div>
          </button>
        )}

        {/* Collapse toggle */}
        <button
          onClick={toggleSidebar}
          className="w-full flex items-center justify-center py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all btn-3d-press"
        >
          {sidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
      </div>
    </aside>
  );
}

export function Header() {
  const { currentPage, socMode, soundsEnabled, toggleSocMode, toggleSounds } = useAppStore();
  const { user } = useAuthStore();

  const pageTitles: Record<PageType, string> = {
    dashboard: 'SOC Dashboard',
    logs: 'Security Logs',
    alerts: 'Security Alerts',
    analytics: 'Analytics',
    statistics: 'Attack Statistics Center',
    simulation: 'Attack Simulation',
    users: 'User Management',
    settings: 'Settings',
    attackmap: 'Global Attack Map',
    timeline: 'SOC Timeline',
    firewall: 'Firewall & IP Blocking',
    monitoring: 'User Behavior Monitoring',
    search: 'Threat Search',
    sessions: 'Session Monitor',
    profile: 'My Profile',
  };

  return (
    <header className="h-16 border-b border-cyber-border backdrop-blur-sm flex items-center justify-between px-6 sticky top-0 z-30 header-depth"
      style={{ background: 'var(--theme-navy, #0f1629)' }}
    >
      <div className="flex items-center gap-3">
        <Zap className="w-4 h-4 text-neon-green" />
        <h2 className="text-lg font-semibold text-foreground">{pageTitles[currentPage]}</h2>
        <span className="flex items-center gap-1.5 text-[10px] px-2.5 py-1 rounded-full bg-neon-green/10 text-neon-green font-bold tracking-wider border border-neon-green/20">
          <span className="w-2 h-2 rounded-full bg-neon-green live-pulse" />
          LIVE
        </span>
      </div>
      <div className="flex items-center gap-2">
        {/* Feature 2: Sound toggle */}
        <button
          onClick={toggleSounds}
          className={cn(
            'w-8 h-8 rounded-lg flex items-center justify-center transition-all',
            soundsEnabled
              ? 'text-neon-blue bg-neon-blue/10 hover:bg-neon-blue/15'
              : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
          )}
          title={soundsEnabled ? 'Mute sounds' : 'Enable sounds'}
        >
          {soundsEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        </button>

        {/* Feature 8: SOC Mode toggle */}
        <button
          onClick={() => {
            toggleSocMode();
            if (!socMode) {
              document.documentElement.requestFullscreen?.().catch(() => {});
            } else {
              document.exitFullscreen?.().catch(() => {});
            }
          }}
          className={cn(
            'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-300',
            socMode
              ? 'bg-neon-blue/15 text-neon-blue border border-neon-blue/30 shadow-[0_0_12px_rgba(0,212,255,0.15)]'
              : 'text-muted-foreground hover:text-foreground hover:bg-white/5 border border-transparent'
          )}
          title={socMode ? 'Exit SOC Mode' : 'Enter SOC Mode'}
        >
          <Monitor className="w-3.5 h-3.5" />
          <span className="hidden md:inline">{socMode ? 'Exit SOC' : 'SOC Mode'}</span>
        </button>

        {user && (
          <div className="flex items-center gap-2 text-sm ml-1">
            <span className="status-dot online" />
            <span className="text-muted-foreground hidden sm:inline">{user.name}</span>
            <span className={cn(
              'text-[10px] px-2 py-0.5 rounded-full font-bold tracking-wider border',
              roleConfig[user.role]?.bg, roleConfig[user.role]?.color, roleConfig[user.role]?.border
            )}>
              {(roleConfig[user.role]?.label) || user.role}
            </span>
          </div>
        )}
      </div>
    </header>
  );
}
