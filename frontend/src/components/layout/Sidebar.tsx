'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useConfigStore } from '@/store/configStore';
import { useUIStore } from '@/store/uiStore';
import { UserRole } from '@/lib/types';
import { FleetOSLockup, FleetOSMark } from './FleetOSMark';
import { getInitials, getRoleLabel } from '@/lib/auth';
import { ThemeSwitcher } from './ThemeSwitcher';

// ── Static deny-list per role (fallback / baseline) ───────────────────────────
const RESTRICTED: Record<string, string[]> = {
  viewer: [
    'subscription','resellers','devices','integrations','tenants','branding',
    'global-monitor','health','sys-config','ref-data','tenant-mgmt','global-alerts',
    'auth-rbac','auth-mfa','auth-sessions',
    'unauthorized','maintenance','routes','map','playback','alerts',
    'analytics','reports','cost-savings','customers','isolation',
    'nav-config','module-config','password-policy',
    'tenant-users','tenant-roles','tenant-nav','branches','tenant-config',
  ],
  dispatcher: [
    'subscription','resellers','tenants','branding',
    'global-monitor','health','sys-config','ref-data','tenant-mgmt','global-alerts',
    'auth-rbac','auth-mfa','auth-sessions',
    'cost-savings','reports','analytics','unauthorized','maintenance',
    'devices','integrations','isolation',
    'nav-config','module-config','password-policy',
    'tenant-users','tenant-roles','tenant-nav','branches','tenant-config',
  ],
  partner: [
    'global-monitor','health','sys-config','ref-data','tenant-mgmt','global-alerts',
    'vehicles','drivers','routes','geofences','unauthorized','maintenance',
    'devices','cost-savings','analytics','reports','auth-rbac','auth-mfa',
    'isolation','tenants',
    'nav-config','module-config','password-policy',
    'tenant-users','tenant-roles','tenant-nav','branches','tenant-config',
  ],
  billing_admin: [
    'map','playback','alerts','vehicles','drivers','routes','geofences',
    'unauthorized','maintenance','cost-savings','analytics','reports',
    'resellers','devices','integrations','tenants','branding','auth-rbac','auth-mfa',
    'auth-sessions','global-monitor','health',
    'sys-config','ref-data','tenant-mgmt','global-alerts','isolation',
    'nav-config','module-config','password-policy',
    'tenant-users','tenant-roles','tenant-nav','branches','tenant-config',
  ],
  fleet_manager: [
    'subscription','resellers','tenants',
    'global-monitor','health','sys-config','ref-data','tenant-mgmt','global-alerts',
    'auth-rbac','auth-mfa','auth-sessions','devices','integrations',
    'analytics','reports',
    'nav-config','module-config','password-policy',
    'tenant-users','tenant-roles','tenant-nav','branches','tenant-config',
  ],
  tenant_admin: [
    'resellers','tenants',
    'global-monitor','health','sys-config','ref-data','tenant-mgmt','global-alerts','isolation',
    'nav-config','module-config','password-policy',
  ],
  fleet_admin: [
    'tenants','global-monitor','health','sys-config','ref-data','tenant-mgmt',
    'global-alerts','isolation','auth-mfa',
    'nav-config','module-config','password-policy',
  ],
  platform_admin: [
    'subscription','resellers','tenants','global-monitor','health','sys-config',
    'tenant-mgmt','global-alerts','isolation','auth-rbac','auth-mfa',
    'nav-config','tenant-users','tenant-roles','tenant-nav','branches','tenant-config',
  ],
  super_admin: [],
  vehicle_owner: [
    'real-time','customers','vehicles','devices','cost-savings',
    'resellers','integrations','tenants','branding',
    'auth-rbac','auth-mfa','auth-sessions',
    'global-monitor','health','sys-config','ref-data','tenant-mgmt','global-alerts','isolation',
    'analytics','reports',
    'nav-config','module-config','password-policy',
    'tenant-users','tenant-roles','tenant-nav','branches','tenant-config',
  ],
};

interface NavItem {
  id: string;
  href: string;
  icon: string;
  label: string;
  badge?: { text: string; color: 'r' | 'g' | 'a' };
}

interface NavSection {
  label: string;
  accent?: boolean;
  items: NavItem[];
}

const NAV: NavSection[] = [
  {
    label: 'Real-time ops',
    items: [
      { id: 'real-time',   href: '/dashboard',   icon: 'ti-layout-dashboard',     label: 'Live dashboard' },
      { id: 'my-vehicle',  href: '/my-vehicle',  icon: 'ti-car',                  label: 'My Vehicle' },
      { id: 'map',         href: '/map',          icon: 'ti-map-pin',              label: 'Live map' },
      { id: 'playback',    href: '/playback',     icon: 'ti-player-play',          label: 'Route playback' },
      { id: 'alerts',      href: '/alerts',       icon: 'ti-bell',                 label: 'Alerts', badge: { text: '3', color: 'r' } },
    ],
  },
  {
    label: 'Fleet management',
    items: [
      { id: 'customers',    href: '/customers',    icon: 'ti-building-store',   label: 'Customers' },
      { id: 'vehicles',     href: '/vehicles',     icon: 'ti-truck',            label: 'Vehicles' },
      { id: 'devices',      href: '/devices',      icon: 'ti-device-analytics', label: 'Devices and IoT' },
      { id: 'drivers',      href: '/drivers',      icon: 'ti-user',             label: 'Driver Performance' },
      { id: 'routes',       href: '/routes',       icon: 'ti-route',            label: 'Route optimisation' },
      { id: 'geofences',    href: '/geofences',    icon: 'ti-polygon',          label: 'Geofences' },
      { id: 'unauthorized', href: '/unauthorized', icon: 'ti-shield-off',       label: 'Unauthorized usage' },
      { id: 'maintenance',  href: '/maintenance',  icon: 'ti-tool',             label: 'Maintenance' },
    ],
  },
  {
    label: 'Analytics',
    items: [
      { id: 'analytics', href: '/analytics', icon: 'ti-chart-bar',      label: 'Analytics' },
      { id: 'reports',   href: '/reports',   icon: 'ti-file-analytics', label: 'Reports' },
    ],
  },
  {
    label: 'Security and auth',
    items: [
      { id: 'auth-rbac',       href: '/auth-rbac',       icon: 'ti-shield-lock',   label: 'RBAC' },
      { id: 'auth-mfa',        href: '/auth-mfa',        icon: 'ti-device-mobile', label: 'MFA settings' },
      { id: 'auth-sessions',   href: '/auth-sessions',   icon: 'ti-lock-access',   label: 'Session management' },
      { id: 'password-policy', href: '/password-policy', icon: 'ti-lock',          label: 'Password policy' },
    ],
  },
  {
    label: 'Org admin',
    items: [
      { id: 'tenant-users',  href: '/tenant-users',  icon: 'ti-users',                  label: 'User management' },
      { id: 'tenant-roles',  href: '/tenant-roles',  icon: 'ti-users-group',            label: 'Custom roles' },

      { id: 'tenant-nav',    href: '/tenant-nav',    icon: 'ti-layout-navbar',          label: 'Nav visibility' },
      { id: 'tenant-config', href: '/tenant-config', icon: 'ti-adjustments-horizontal', label: 'System config' },
      { id: 'module-config', href: '/module-config', icon: 'ti-package',                label: 'Module config' },
      { id: 'nav-config',    href: '/nav-config',    icon: 'ti-layout-navbar-expand',   label: 'System Role Config' },
    ],
  },
  {
    label: 'Enterprise',
    items: [
      { id: 'integrations', href: '/integrations', icon: 'ti-plug',     label: 'Integrations' },
      { id: 'tenants',      href: '/tenants',      icon: 'ti-building', label: 'Tenants' },
      { id: 'branding',     href: '/branding',     icon: 'ti-palette',  label: 'Portal branding' },
    ],
  },
  {
    label: 'SaaS and billing',
    items: [
      { id: 'subscription', href: '/subscription', icon: 'ti-credit-card',    label: 'Subscription' },
      { id: 'resellers',    href: '/resellers',    icon: 'ti-building-store', label: 'Resellers and partners', badge: { text: '2', color: 'a' } },
    ],
  },
  {
    label: 'Platform ops',
    accent: true,
    items: [
      { id: 'global-monitor', href: '/global-monitor', icon: 'ti-world',              label: 'Global monitoring' },
      { id: 'health',         href: '/health',          icon: 'ti-heart-rate-monitor', label: 'Health dashboards' },
      { id: 'sys-config',     href: '/sys-config',      icon: 'ti-settings',           label: 'Platform config' },
      { id: 'ref-data',       href: '/ref-data',        icon: 'ti-database',           label: 'Reference data' },
      { id: 'tenant-mgmt',    href: '/tenant-mgmt',     icon: 'ti-users-group',        label: 'Tenant suspension' },
      { id: 'global-alerts',  href: '/global-alerts',   icon: 'ti-alert-octagon',      label: 'Global alerting', badge: { text: '2', color: 'r' } },
      { id: 'isolation',      href: '/isolation',       icon: 'ti-shield-check',       label: 'Isolation center' },
    ],
  },
];

/* ── Per-page accent themes ──────────────────────────────────────────────── */
const THEMES = {
  teal: {
    accent: '#2dd4bf',
    activeBg: 'rgba(45,212,191,0.18)',
    activeBorder: '#2dd4bf',
  },
  blue: {
    accent: '#38bdf8',
    activeBg: 'rgba(56,189,248,0.18)',
    activeBorder: '#38bdf8',
  },
  green: {
    accent: '#34d399',
    activeBg: 'rgba(52,211,153,0.18)',
    activeBorder: '#34d399',
  },
} as const;

type ThemeKey = keyof typeof THEMES;

function getTheme(pathname: string): typeof THEMES[ThemeKey] {
  if (pathname === '/dashboard' || pathname.startsWith('/my-vehicle')) return THEMES.blue;
  if (
    pathname.startsWith('/customers')    || pathname.startsWith('/vehicles')     ||
    pathname.startsWith('/devices')      || pathname.startsWith('/drivers')      ||
    pathname.startsWith('/routes')       || pathname.startsWith('/geofences')    ||
    pathname.startsWith('/unauthorized') || pathname.startsWith('/maintenance')  ||
    pathname.startsWith('/reports')
  ) return THEMES.green;
  return THEMES.teal;
}

/* ── Badge colours (adapted for dark bg) ───────────────────────────────── */
const BADGE_STYLES: Record<string, React.CSSProperties> = {
  r: { background: 'rgba(239,68,68,0.18)',  color: '#f87171' },
  g: { background: 'rgba(52,211,153,0.15)', color: '#34d399' },
  a: { background: 'rgba(251,191,36,0.15)', color: '#fbbf24' },
};

/* ── Design tokens — dark navy matching TopBar ──────────────────────────── */
const SB  = 'var(--chrome)';             // sidebar bg — matches TopBar base
const SB2 = 'rgba(255,255,255,0.09)';   // hover bg
const DIM = 'rgba(255,255,255,0.78)';   // inactive text — bright & readable
const SEP = 'rgba(255,255,255,0.10)';   // divider / border

const COLLAPSED_KEY = 'fleet:sidebar:collapsed';
const SCROLL_KEY    = 'fleet:sidebar:scroll';

export function Sidebar() {
  const pathname    = usePathname();
  const { user }    = useAuthStore();
  const config      = useConfigStore();
  const { sidebarCollapsed, toggleSidebar } = useUIStore();
  const role        = (user?.role ?? 'viewer') as UserRole;
  const tenantId    = user?.tenantId;
  const isSA        = role === 'super_admin';
  const sectionOrder = useConfigStore(s => s.sectionOrder);
  const theme = getTheme(pathname);

  const orderedNav = sectionOrder.length > 0
    ? [...NAV].sort((a, b) => {
        const ai = sectionOrder.indexOf(a.label);
        const bi = sectionOrder.indexOf(b.label);
        if (ai === -1 && bi === -1) return 0;
        if (ai === -1) return 1;
        if (bi === -1) return -1;
        return ai - bi;
      })
    : NAV;

  const navRef = useRef<HTMLElement>(null);

  const [collapsed, setCollapsed] = useState<Set<string>>(() => {
    if (typeof window === 'undefined') return new Set<string>();
    try {
      const raw = localStorage.getItem(COLLAPSED_KEY);
      if (raw) return new Set<string>(JSON.parse(raw) as string[]);
      return new Set<string>(NAV.filter(s => s.label !== 'Real-time ops').map(s => s.label));
    } catch { return new Set<string>(); }
  });

  useEffect(() => {
    try { localStorage.setItem(COLLAPSED_KEY, JSON.stringify([...collapsed])); }
    catch { /* quota / private mode */ }
  }, [collapsed]);

  useEffect(() => {
    const activeSection = NAV.find(s =>
      s.items.some(i => pathname === i.href || pathname.startsWith(i.href + '/'))
    );
    if (!activeSection) return;
    setCollapsed(prev => {
      if (!prev.has(activeSection.label)) return prev;
      const next = new Set(prev);
      next.delete(activeSection.label);
      return next;
    });
  }, [pathname]);

  const toggleSection = useCallback((label: string) => {
    setCollapsed(prev => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label); else next.add(label);
      return next;
    });
  }, []);

  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    try {
      const stored = sessionStorage.getItem(SCROLL_KEY);
      if (stored) nav.scrollTop = Number(stored);
    } catch { /* blocked */ }
    const save = () => {
      try { sessionStorage.setItem(SCROLL_KEY, String(nav.scrollTop)); }
      catch { /* blocked */ }
    };
    nav.addEventListener('scroll', save, { passive: true });
    return () => nav.removeEventListener('scroll', save);
  }, []);

  function isNavVisible(pageId: string): boolean {
    if (isSA) return true;
    if (config.globalDisabledModules.includes(pageId)) return false;
    if (tenantId) {
      const tenantKey = `${tenantId}:${role}:${pageId}`;
      if (tenantKey in config.tenantNavOverrides) return config.tenantNavOverrides[tenantKey];
    }
    if (role in config.rbacAllowedModules) {
      if (!config.rbacAllowedModules[role].includes(pageId)) return false;
    }
    const globalKey = `${role}:${pageId}`;
    if (globalKey in config.globalNavDefaults) return config.globalNavDefaults[globalKey];
    const denied = RESTRICTED[role] ?? [];
    return !denied.includes(pageId);
  }

  /* ── Mini (icon-rail) mode ──────────────────────────────────────────── */
  if (sidebarCollapsed) {
    const allVisible = orderedNav.flatMap(s => s.items.filter(i => isNavVisible(i.id)));
    return (
      <nav style={{
        background: SB,
        borderRight: `1px solid ${SEP}`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        overflowY: 'auto',
        overflowX: 'hidden',
        paddingTop: 8,
        paddingBottom: 8,
      }}>
        <style>{`
          .sb-tip { position: relative; }
          .sb-tip::after {
            content: attr(data-tooltip);
            position: fixed; left: 60px;
            background: #1e293b; color: #e2e8f0;
            font-size: 11px; font-weight: 500; font-family: inherit;
            padding: 5px 11px; border-radius: 7px; white-space: nowrap;
            pointer-events: none; opacity: 0; transition: opacity 0.14s;
            z-index: 9999; box-shadow: 0 4px 16px rgba(0,0,0,0.45);
            border: 1px solid rgba(255,255,255,0.09);
          }
          .sb-tip::before {
            content: ''; position: fixed; left: 54px;
            border: 5px solid transparent; border-right-color: #1e293b;
            pointer-events: none; opacity: 0; transition: opacity 0.14s; z-index: 9999;
          }
          .sb-tip:hover::after, .sb-tip:hover::before { opacity: 1; }
        `}</style>

        {/* Brand mark — click to expand */}
        <button
          onClick={toggleSidebar}
          title="Expand menu"
          style={{
            width: 40, height: 40,
            border: '1px solid rgba(255,255,255,0.07)',
            background: 'rgba(255,255,255,0.04)',
            borderRadius: 10,
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 8, flexShrink: 0,
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => {
            const el = e.currentTarget as HTMLElement;
            el.style.background = 'rgba(255,255,255,0.09)';
            el.style.borderColor = 'rgba(255,255,255,0.14)';
          }}
          onMouseLeave={e => {
            const el = e.currentTarget as HTMLElement;
            el.style.background = 'rgba(255,255,255,0.04)';
            el.style.borderColor = 'rgba(255,255,255,0.07)';
          }}
        >
          <FleetOSMark size={26} accent="#c4912a" />
        </button>

        <div style={{ width: 26, height: 1, background: SEP, marginBottom: 6 }} />

        {allVisible.map(item => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className="sb-tip"
              data-tooltip={item.label}
              style={{
                width: 38, height: 38, borderRadius: 9,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: active ? theme.activeBg : 'transparent',
                color: active ? theme.accent : DIM,
                textDecoration: 'none',
                position: 'relative',
                flexShrink: 0,
                margin: '1px 0',
                border: `1px solid ${active ? theme.accent + '35' : 'transparent'}`,
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => {
                if (!active) {
                  (e.currentTarget as HTMLElement).style.background = SB2;
                  (e.currentTarget as HTMLElement).style.color = '#fff';
                }
              }}
              onMouseLeave={e => {
                if (!active) {
                  (e.currentTarget as HTMLElement).style.background = 'transparent';
                  (e.currentTarget as HTMLElement).style.color = DIM;
                }
              }}
            >
              <i className={`ti ${item.icon}`} style={{ fontSize: 16 }} />
              {item.badge && (
                <span style={{
                  position: 'absolute', top: 6, right: 6,
                  width: 5, height: 5, borderRadius: '50%',
                  background: item.badge.color === 'r' ? '#f87171' : item.badge.color === 'a' ? '#fbbf24' : '#34d399',
                  boxShadow: `0 0 4px ${item.badge.color === 'r' ? '#f8717199' : item.badge.color === 'a' ? '#fbbf2499' : '#34d39999'}`,
                }} />
              )}
            </Link>
          );
        })}

        {/* Theme switcher + user avatar at bottom */}
        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, paddingBottom: 10 }}>
          <div style={{ width: 28, height: 1, background: SEP }} />
          <ThemeSwitcher collapsed={true} />
          <div style={{ width: 28, height: 1, background: SEP }} />
          <div
            title={`${user?.fullName ?? ''} · ${getRoleLabel(role)}`}
            style={{
              width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
              background: `${theme.accent}20`,
              border: `1.5px solid ${theme.accent}45`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 10, fontWeight: 700, color: theme.accent,
              cursor: 'default',
            }}
          >
            {getInitials(user?.fullName ?? '')}
          </div>
        </div>
      </nav>
    );
  }

  /* ── Full sidebar ────────────────────────────────────────────────────── */
  return (
    <>
      <style>{`
        .fleet-sidebar::-webkit-scrollbar { width: 3px; }
        .fleet-sidebar::-webkit-scrollbar-track { background: transparent; }
        .fleet-sidebar::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.12); border-radius: 2px;
        }
        .fleet-sidebar::-webkit-scrollbar-thumb:hover {
          background: rgba(255,255,255,0.22);
        }
        .sb-item {
          display: flex; align-items: center; gap: 10px;
          padding: 8px 12px 8px 13px; margin: 1px 6px;
          border-radius: 8px; font-size: 12.5px;
          text-decoration: none; font-weight: 400;
          transition: background 0.15s, color 0.15s, border-color 0.15s;
          border-left: 2px solid transparent;
        }
        .sb-item:hover { background: rgba(255,255,255,0.05); }
      `}</style>

      <nav
        ref={navRef}
        className="fleet-sidebar"
        style={{
          background: SB,
          borderRight: `1px solid ${SEP}`,
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto',
          overflowX: 'hidden',
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(255,255,255,0.12) transparent',
        }}
      >
        {/* ── Brand header ─────────────────────────────────────────────── */}
        <div style={{
          background: 'linear-gradient(180deg, var(--chrome-lt) 0%, var(--chrome) 100%)',
          borderBottom: `1px solid ${SEP}`,
          padding: '14px 13px 12px 16px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexShrink: 0,
        }}>
          <FleetOSLockup size={22} />
          <button
            onClick={toggleSidebar}
            title="Collapse menu"
            style={{
              width: 26, height: 26, borderRadius: 7, flexShrink: 0,
              border: `1px solid ${SEP}`,
              background: 'rgba(255,255,255,0.05)',
              color: 'rgba(255,255,255,0.38)',
              cursor: 'pointer', fontSize: 13,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => {
              const el = e.currentTarget as HTMLElement;
              el.style.background = 'rgba(255,255,255,0.11)';
              el.style.color = 'rgba(255,255,255,0.7)';
              el.style.borderColor = 'rgba(255,255,255,0.16)';
            }}
            onMouseLeave={e => {
              const el = e.currentTarget as HTMLElement;
              el.style.background = 'rgba(255,255,255,0.05)';
              el.style.color = 'rgba(255,255,255,0.38)';
              el.style.borderColor = SEP;
            }}
          >
            <i className="ti ti-layout-sidebar-left-collapse" style={{ fontSize: 13 }} />
          </button>
        </div>

        {/* ── Nav sections ─────────────────────────────────────────────── */}
        <div style={{ flex: 1, paddingTop: 6, paddingBottom: 6 }}>
          {orderedNav.map((section) => {
            const visibleItems = section.items.filter(item => isNavVisible(item.id));
            if (visibleItems.length === 0) return null;

            const isCollapsed = collapsed.has(section.label);
            const isPlatform  = !!section.accent;

            return (
              <div key={section.label} style={{ marginTop: 4 }}>
                {/* Section header */}
                <button
                  onClick={() => toggleSection(section.label)}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    width: '100%', padding: '6px 14px 4px 16px',
                    border: 'none', background: 'transparent',
                    cursor: 'pointer', fontFamily: 'inherit',
                  }}
                >
                  <span style={{
                    fontSize: 9.5, fontWeight: 700, letterSpacing: '1.4px',
                    textTransform: 'uppercase',
                    color: isPlatform ? '#e8b84b' : '#c4912a',
                    display: 'flex', alignItems: 'center', gap: 6,
                  }}>
                    <span style={{
                      width: 4, height: 4, borderRadius: '50%', flexShrink: 0,
                      background: isPlatform ? '#e8b84b' : '#c4912a',
                      display: 'inline-block',
                    }} />
                    {section.label}
                  </span>
                  <i
                    className="ti ti-chevron-right"
                    style={{
                      fontSize: 10, color: 'rgba(255,255,255,0.50)', flexShrink: 0,
                      transition: 'transform 0.18s ease',
                      transform: isCollapsed ? 'rotate(0deg)' : 'rotate(90deg)',
                    }}
                  />
                </button>

                {/* Items */}
                {!isCollapsed && visibleItems.map((item) => {
                  const active = pathname === item.href || pathname.startsWith(item.href + '/');
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="sb-item"
                      style={{
                        background: active ? theme.activeBg : 'transparent',
                        color: active ? 'rgba(255,255,255,0.92)' : DIM,
                        fontWeight: active ? 500 : 400,
                        borderLeft: `2px solid ${active ? theme.accent : 'transparent'}`,
                      }}
                    >
                      <i
                        className={`ti ${item.icon}`}
                        style={{
                          fontSize: 15, width: 17, flexShrink: 0,
                          color: active ? theme.accent : DIM,
                          transition: 'color 0.2s',
                        }}
                      />
                      <span style={{ flex: 1, lineHeight: 1.3 }}>{item.label}</span>
                      {item.badge && (
                        <span style={{
                          fontSize: 9, fontWeight: 700, padding: '2px 7px',
                          borderRadius: 20,
                          letterSpacing: '0.2px',
                          ...BADGE_STYLES[item.badge.color],
                        }}>
                          {item.badge.text}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* ── Theme switcher ───────────────────────────────────────────── */}
        <div style={{ borderTop: `1px solid ${SEP}` }}>
          <ThemeSwitcher collapsed={false} />
        </div>

        {/* ── Footer — user card + fleet health ───────────────────────── */}
        <div style={{
          borderTop: `1px solid ${SEP}`,
          background: 'rgba(0,0,0,0.18)',
          flexShrink: 0,
        }}>
          {/* User card */}
          <div style={{ padding: '11px 14px 8px', display: 'flex', alignItems: 'center', gap: 9 }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
              background: `${theme.accent}20`,
              border: `1.5px solid ${theme.accent}45`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 10, fontWeight: 700, color: theme.accent,
            }}>
              {getInitials(user?.fullName ?? '')}
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{
                fontSize: 11.5, fontWeight: 600, color: 'rgba(255,255,255,0.78)',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {user?.fullName}
              </div>
              <div style={{
                fontSize: 9, color: theme.accent, fontWeight: 600, marginTop: 2,
                textTransform: 'uppercase', letterSpacing: '0.5px',
              }}>
                {getRoleLabel(role)}
              </div>
            </div>
          </div>

          {/* Fleet health bar */}
          <div style={{ padding: '0 14px 12px' }}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5,
            }}>
              <span style={{ fontSize: 8.5, letterSpacing: '1.3px', color: 'rgba(255,255,255,0.22)', textTransform: 'uppercase', fontWeight: 600 }}>
                Fleet health
              </span>
              <span style={{ fontSize: 10, color: theme.accent, fontWeight: 700, transition: 'color 0.25s' }}>
                96.4%
              </span>
            </div>
            <div style={{ height: 3, background: 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{
                width: '96.4%', height: '100%',
                background: `linear-gradient(90deg, ${theme.accent}80 0%, ${theme.accent} 100%)`,
                borderRadius: 2,
                transition: 'background 0.25s',
              }} />
            </div>
            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)', marginTop: 5, display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#22c55e', display: 'inline-block', flexShrink: 0 }} />
              Operational · All systems go
            </div>
          </div>
        </div>
      </nav>
    </>
  );
}
