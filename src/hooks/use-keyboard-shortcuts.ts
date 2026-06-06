'use client';

import { useEffect, useCallback } from 'react';
import { useAppStore } from '@/store/app-store';
import { playSound } from '@/lib/sounds';

export function useKeyboardShortcuts() {
  const { setCurrentPage, setSidebarOpen } = useAppStore();

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Don't trigger when typing in inputs
    const tag = (e.target as HTMLElement).tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || (e.target as HTMLElement).isContentEditable) {
      return;
    }

    // / → Focus search (navigate to search page)
    if (e.key === '/') {
      e.preventDefault();
      playSound('click');
      setCurrentPage('search');
    }

    // ESC → Close modals (collapse sidebar as fallback)
    if (e.key === 'Escape') {
      playSound('click');
      setSidebarOpen(true);
    }

    // Ctrl+K → Search
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      playSound('click');
      setCurrentPage('search');
    }

    // Ctrl+D → Dashboard
    if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
      e.preventDefault();
      playSound('click');
      setCurrentPage('dashboard');
    }

    // Ctrl+A → Alerts
    if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
      e.preventDefault();
      playSound('click');
      setCurrentPage('alerts');
    }

    // Ctrl+L → Logs
    if ((e.ctrlKey || e.metaKey) && e.key === 'l') {
      e.preventDefault();
      playSound('click');
      setCurrentPage('logs');
    }

    // Ctrl+\ → Toggle sidebar
    if ((e.ctrlKey || e.metaKey) && e.key === '\\') {
      e.preventDefault();
      playSound('click');
      setSidebarOpen(useAppStore.getState().sidebarOpen ? false : true);
    }

    // ? → Show shortcuts help (navigate to settings)
    if (e.key === '?') {
      e.preventDefault();
      playSound('click');
    }
  }, [setCurrentPage, setSidebarOpen]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}
