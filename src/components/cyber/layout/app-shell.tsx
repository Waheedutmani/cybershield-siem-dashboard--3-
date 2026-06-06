'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { useAppStore, type PageType } from '@/store/app-store';
import { canAccessPage } from '@/lib/rbac';
import { Sidebar, Header } from '@/components/cyber/layout/sidebar';
import { NotificationPopup } from '@/components/cyber/layout/notification-popup';
import { LoginPage, RegisterPage } from '@/components/cyber/auth/auth-pages';
import { DashboardPage } from '@/components/cyber/dashboard/dashboard-page';
import { AnalyticsPage } from '@/components/cyber/dashboard/analytics-page';
import { LogsPage } from '@/components/cyber/logs/logs-page';
import { AlertsPage } from '@/components/cyber/alerts/alerts-page';
import { SimulationPage } from '@/components/cyber/simulation/simulation-page';
import { UsersPage } from '@/components/cyber/users/users-page';
import { SettingsPage } from '@/components/cyber/settings/settings-page';
import { AttackMapPage } from '@/components/cyber/attackmap/attack-map-page';
import { TimelinePage } from '@/components/cyber/timeline/timeline-page';
import { FirewallPage } from '@/components/cyber/firewall/firewall-page';
import { MonitoringPage } from '@/components/cyber/monitoring/monitoring-page';
import { SearchPage } from '@/components/cyber/search/search-page';
import { SessionsPage } from '@/components/cyber/sessions/sessions-page';
import { AttackStatisticsPage } from '@/components/cyber/statistics/statistics-page';
import { ProfilePage } from '@/components/cyber/profile/profile-page';
import { RestrictedPage } from '@/components/cyber/dashboard/restricted-page';
import { SOCBackground } from '@/components/cyber/layout/soc-background';
import { AIAssistant } from '@/components/cyber/ai-assistant/ai-assistant';
import { BootSequence } from '@/components/cyber/boot/boot-sequence';
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts';
import { cn } from '@/lib/utils';

function PageContent({ page }: { page: PageType }) {
  const { user } = useAuthStore();
  const role = user?.role;

  if (!canAccessPage(role, page)) {
    return <RestrictedPage page={page} />;
  }

  switch (page) {
    case 'dashboard':
      return <DashboardPage />;
    case 'analytics':
      return <AnalyticsPage />;
    case 'logs':
      return <LogsPage />;
    case 'alerts':
      return <AlertsPage />;
    case 'simulation':
      return <SimulationPage />;
    case 'users':
      return <UsersPage />;
    case 'settings':
      return <SettingsPage />;
    case 'attackmap':
      return <AttackMapPage />;
    case 'timeline':
      return <TimelinePage />;
    case 'firewall':
      return <FirewallPage />;
    case 'monitoring':
      return <MonitoringPage />;
    case 'search':
      return <SearchPage />;
    case 'sessions':
      return <SessionsPage />;
    case 'statistics':
      return <AttackStatisticsPage />;
    case 'profile':
      return <ProfilePage />;
    default:
      return <DashboardPage />;
  }
}

export function CyberShieldApp() {
  const { user, isAuthenticated, isLoading, setUser } = useAuthStore();
  const { currentPage, setCurrentPage, theme, socMode, bootComplete, setBootComplete, toggleSocMode, setOpenAIAssistant } = useAppStore();

  // Feature 6: Keyboard shortcuts
  useKeyboardShortcuts();

  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await fetch('/api/auth/session');
        if (res.ok) {
          const data = await res.json();
          if (data.user) {
            setUser(data.user);
            // Always redirect away from auth pages if already authenticated
            if (currentPage === 'login' || currentPage === 'register') {
              setCurrentPage('dashboard');
            } else if (!canAccessPage(data.user.role, currentPage)) {
              setCurrentPage('dashboard');
            }
            // Feature 1: Trigger boot on first authenticated load per session
            if (!bootComplete && !sessionStorage.getItem('cs_boot_done')) {
              // bootComplete stays false -> boot shows
            } else if (sessionStorage.getItem('cs_boot_done')) {
              setBootComplete(true);
            }
          } else {
            setUser(null);
            setCurrentPage('login');
          }
        } else {
          setUser(null);
          setCurrentPage('login');
        }
      } catch {
        setUser(null);
        setCurrentPage('login');
      }
    };
    checkSession();
  }, [setUser, setCurrentPage, currentPage, bootComplete, setBootComplete]);

  const handleBootComplete = () => {
    setBootComplete(true);
    sessionStorage.setItem('cs_boot_done', '1');
  };

  const themeClass = `theme-${theme}`;

  // Show auth pages when not authenticated
  if (!isAuthenticated && !isLoading) {
    const authPage = currentPage === 'register' ? 'register' : 'login';
    return (
      <SOCBackground page={authPage}>
        {authPage === 'register' ? <RegisterPage /> : <LoginPage />}
      </SOCBackground>
    );
  }

  // Show loading
  if (isLoading) {
    return (
      <SOCBackground page="login">
        <div className="min-h-screen flex items-center justify-center relative z-10">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-neon-blue to-neon-purple flex items-center justify-center animate-pulse">
              <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <p className="text-sm text-muted-foreground animate-pulse">Initializing CyberShield...</p>
          </div>
        </div>
      </SOCBackground>
    );
  }

  // Feature 1: Boot sequence screen
  if (!bootComplete) {
    return (
      <SOCBackground page="login">
        <BootSequence
          onComplete={handleBootComplete}
          userName={user?.name}
          userRole={user?.role}
        />
      </SOCBackground>
    );
  }

  return (
    <SOCBackground page={socMode ? 'minimal' : currentPage}>
      <div className={cn(
        'min-h-screen relative transition-all duration-500',
        themeClass,
        socMode && 'soc-mode-active'
      )}>
        {/* Feature 8: SOC Mode overlay effects */}
        {socMode && (
          <>
            <div className="fixed inset-0 bg-black/20 pointer-events-none z-[60] soc-vignette" />
            <div className="fixed inset-0 pointer-events-none z-[61] soc-scanline" />
          </>
        )}

        <div className={cn('flex min-h-screen', socMode && 'soc-content-area')}>
          <Sidebar />
          <NotificationPopup />

          <main className="flex-1 min-w-0 transition-all duration-300 ease-in-out">
            <Header />
            <div className={cn('p-6', socMode && 'soc-content-area')}>
              <PageContent page={currentPage} />
            </div>
          </main>
        </div>

        {/* Feature 2+6: AI Assistant */}
        <AIAssistant />

        {/* Keyboard shortcuts hint */}
        <div className="fixed bottom-3 left-3 z-40 hidden lg:flex items-center gap-3 opacity-20 hover:opacity-60 transition-opacity pointer-events-none">
          <span className="text-[9px] text-muted-foreground font-mono">
            <kbd className="px-1 py-0.5 rounded bg-white/5 border border-cyber-border text-[8px]">/</kbd> Search
          </span>
          <span className="text-[9px] text-muted-foreground font-mono">
            <kbd className="px-1 py-0.5 rounded bg-white/5 border border-cyber-border text-[8px]">Ctrl+K</kbd> Quick Search
          </span>
          <span className="text-[9px] text-muted-foreground font-mono">
            <kbd className="px-1 py-0.5 rounded bg-white/5 border border-cyber-border text-[8px]">Ctrl+\</kbd> Toggle Sidebar
          </span>
        </div>
      </div>
    </SOCBackground>
  );
}
