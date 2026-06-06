// CyberShield SIEM - Role-Based Access Control System
// Defines permissions for each role: Admin, Analyst, User

export type UserRole = 'Admin' | 'Analyst' | 'User';

export interface PagePermission {
  page: string;
  allowedRoles: UserRole[];
  label: string;
}

// Permission matrix: which roles can access which pages
export const pagePermissions: PagePermission[] = [
  // Core pages - All authenticated users
  { page: 'dashboard', allowedRoles: ['Admin', 'Analyst', 'User'], label: 'SOC Dashboard' },
  { page: 'alerts', allowedRoles: ['Admin', 'Analyst', 'User'], label: 'Security Alerts' },
  { page: 'logs', allowedRoles: ['Admin', 'Analyst', 'User'], label: 'Security Logs' },
  { page: 'settings', allowedRoles: ['Admin', 'Analyst', 'User'], label: 'Settings' },
  { page: 'sessions', allowedRoles: ['Admin', 'Analyst', 'User'], label: 'Session Monitor' },
  { page: 'profile', allowedRoles: ['Admin', 'Analyst', 'User'], label: 'Profile' },

  // Monitoring & Intelligence - Admin and Analyst only
  { page: 'attackmap', allowedRoles: ['Admin', 'Analyst'], label: 'Global Attack Map' },
  { page: 'search', allowedRoles: ['Admin', 'Analyst'], label: 'Threat Search' },
  { page: 'timeline', allowedRoles: ['Admin', 'Analyst'], label: 'SOC Timeline' },
  { page: 'analytics', allowedRoles: ['Admin', 'Analyst'], label: 'Analytics' },
  { page: 'statistics', allowedRoles: ['Admin', 'Analyst'], label: 'Attack Statistics Center' },
  { page: 'monitoring', allowedRoles: ['Admin', 'Analyst'], label: 'User Behavior Monitoring' },

  // Attack Simulation - Admin and Analyst only (sensitive operations)
  { page: 'simulation', allowedRoles: ['Admin', 'Analyst'], label: 'Attack Simulation' },

  // System Admin - Admin only
  { page: 'firewall', allowedRoles: ['Admin'], label: 'Firewall & IP Blocking' },
  { page: 'users', allowedRoles: ['Admin'], label: 'User Management' },
];

// Check if a role can access a specific page
export function canAccessPage(role: string | undefined, page: string): boolean {
  if (!role) return false;

  const permission = pagePermissions.find((p) => p.page === page);
  if (!permission) return false; // Unknown pages are restricted by default

  return permission.allowedRoles.includes(role as UserRole);
}

// Get all pages accessible by a given role
export function getAccessiblePages(role: string | undefined): PagePermission[] {
  if (!role) return [];

  return pagePermissions.filter((p) => p.allowedRoles.includes(role as UserRole));
}

// Check if a role has admin-level privileges
export function isAdmin(role: string | undefined): boolean {
  return role === 'Admin';
}

// Check if a role has analyst-level or higher privileges
export function isAnalystOrAbove(role: string | undefined): boolean {
  return role === 'Admin' || role === 'Analyst';
}

// Get the restricted page info for a given page (for displaying access denied)
export function getRestrictionInfo(page: string): { requiredRoles: UserRole[]; label: string } | null {
  const permission = pagePermissions.find((p) => p.page === page);
  if (!permission) return null;

  return {
    requiredRoles: permission.allowedRoles,
    label: permission.label,
  };
}

// API route permission checks
export const apiPermissions = {
  // Admin-only API routes
  adminOnly: [
    '/api/firewall',
    '/api/users',
  ],
  // Admin + Analyst API routes
  analystOrAbove: [
    '/api/simulation/engine',
    '/api/simulate',
    '/api/monitoring',
  ],
  // All authenticated users
  authenticated: [
    '/api/dashboard',
    '/api/logs',
    '/api/alerts',
    '/api/analytics',
    '/api/timeline',
    '/api/sessions',
    '/api/search',
    '/api/export',
  ],
};

// Check if a role can access a specific API route
export function canAccessApi(role: string | undefined, path: string): boolean {
  if (!role) return false;

  // Check admin-only routes
  if (apiPermissions.adminOnly.some((apiPath) => path.startsWith(apiPath))) {
    return role === 'Admin';
  }

  // Check analyst+ routes
  if (apiPermissions.analystOrAbove.some((apiPath) => path.startsWith(apiPath))) {
    return role === 'Admin' || role === 'Analyst';
  }

  // All authenticated users can access the rest
  return true;
}
