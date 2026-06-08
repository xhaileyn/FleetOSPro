'use client';

/**
 * Central dynamic configuration store — persisted to localStorage.
 *
 * Sidebar visibility resolution (three layers, in order):
 *  1. globalDisabledModules  — Super Admin disables a module for every tenant
 *  2. tenantNavOverrides     — Tenant Admin customises per-role nav visibility
 *  3. RESTRICTED deny-list   — Static fallback (hardcoded in Sidebar.tsx)
 *
 * Plus an extra layer written by the Nav Config tab in RBAC:
 *  2.5 globalNavDefaults — Super Admin sets default per-role visibility
 *       (between tenantNavOverrides and RESTRICTED; checked in Sidebar.isNavVisible)
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { TenantCustomRole } from '@/lib/tenantRoles';

// ── RBAC custom role definition (created in the auth-rbac page) ───────────────
export interface RbacCustomRole {
  id:          string;
  label:       string;
  color:       string;
  description: string;
  userCount:   number;
}

// ── Tenant-level System Config ────────────────────────────────────────────────

export interface TenantConfig {
  timezone: string;
  language: string;
  dateFormat: string;
  speedUnit: 'km/h' | 'mph';
  currency: string;
  speedAlertThreshold: number;
  idleTimeoutMinutes: number;
  harshBrakingSensitivity: 'low' | 'medium' | 'high';
  fuelThreshold: number;
  alertEmailRecipients: string;
  reportEmailRecipients: string;
  smsEnabled: boolean;
  afterHoursAlerts: boolean;
  exportFormat: 'csv' | 'excel' | 'pdf';
  reportSchedule: 'daily' | 'weekly' | 'monthly';
  reportTime: string;
}

export const DEFAULT_TENANT_CONFIG: TenantConfig = {
  timezone: 'America/New_York',
  language: 'en',
  dateFormat: 'DD MMM YYYY',
  speedUnit: 'km/h',
  currency: 'USD',
  speedAlertThreshold: 110,
  idleTimeoutMinutes: 10,
  harshBrakingSensitivity: 'medium',
  fuelThreshold: 12,
  alertEmailRecipients: '',
  reportEmailRecipients: '',
  smsEnabled: false,
  afterHoursAlerts: true,
  exportFormat: 'excel',
  reportSchedule: 'weekly',
  reportTime: '07:00',
};

// ── Password Policy ───────────────────────────────────────────────────────────

export interface PasswordPolicy {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecial: boolean;
  maxAgeDays: number;           // 0 = never expires
  preventReuseCount: number;    // how many previous passwords to remember
  lockoutAttempts: number;
  lockoutDurationMinutes: number;
  sessionTimeoutMinutes: number;
  mfaRequiredForAdmins: boolean;
  mfaRequiredForAll: boolean;
}

export const DEFAULT_PASSWORD_POLICY: PasswordPolicy = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecial: false,
  maxAgeDays: 90,
  preventReuseCount: 5,
  lockoutAttempts: 5,
  lockoutDurationMinutes: 30,
  sessionTimeoutMinutes: 60,
  mfaRequiredForAdmins: true,
  mfaRequiredForAll: false,
};

// ── Store ─────────────────────────────────────────────────────────────────────

interface ConfigState {
  // ── Super Admin: globally disabled nav/module IDs ──────────────────────────
  globalDisabledModules: string[];

  // ── RBAC module permissions (from API) ─────────────────────────────────────
  // Key = roleId, Value = allowedModules[]
  // Loaded by the app layout on mount; updated by the RBAC page on save.
  // Used by Sidebar as a hard gate: if a role has data here and a navId is
  // NOT in its allowedModules, that nav item is hidden.
  rbacAllowedModules: Record<string, string[]>;

  // ── RBAC custom role definitions ──────────────────────────────────────────
  // Roles created via the auth-rbac page (non-system, isSystem:false).
  // Persisted here so they survive page refresh and are available in
  // tenant-users for assignment.
  rbacCustomRoles: RbacCustomRole[];

  // ── Super Admin: global per-role nav defaults ──────────────────────────────
  // Key = `${role}:${navItemId}`, Value = true (visible) | false (hidden)
  // Applied by the Nav Config tab in RBAC; checked in Sidebar between
  // tenantNavOverrides (layer 2) and RESTRICTED (layer 3).
  globalNavDefaults: Record<string, boolean>;

  // ── Super Admin: password policy ───────────────────────────────────────────
  passwordPolicy: PasswordPolicy;

  // ── Tenant: custom roles ───────────────────────────────────────────────────
  customRoles: TenantCustomRole[];

  // ── Tenant: custom role active/inactive state ──────────────────────────────
  tenantRoleActive: Record<string, boolean>;

  // ── Tenant: per-tenant system config ──────────────────────────────────────
  // Key = tenantId
  tenantConfigs: Record<string, TenantConfig>;

  // ── Tenant: per-role nav overrides ─────────────────────────────────────────
  // Key = `${tenantId}:${systemRole}:${navItemId}`
  tenantNavOverrides: Record<string, boolean>;

  // ── Report access rights ────────────────────────────────────────────────────
  // Key = reportId (string), Value = array of roles that can access it.
  // Empty array = inherits default. super_admin always has access.
  reportRights: Record<string, string[]>;

  // ── Color theme ──────────────────────────────────────────────────────────────
  colorTheme: 'gold' | 'slate' | 'forest';
  setColorTheme: (t: 'gold' | 'slate' | 'forest') => void;

  // ── Command access rights ────────────────────────────────────────────────────
  // Key = command key (e.g. 'REQ_LOC'), Value = array of roles that may execute it.
  // Empty entry = use component default. super_admin / platform_admin always allowed.
  commandRights: Record<string, string[]>;

  // ── Section display order (empty = sidebar default) ───────────────────────
  sectionOrder: string[];

  // ── Actions ────────────────────────────────────────────────────────────────
  setSectionOrder:         (order: string[])                                                 => void;
  setGlobalModuleEnabled:  (moduleId: string, enabled: boolean)                             => void;
  /** Bulk-set RBAC permissions (called once by layout on app load) */
  setRbacPermissions:      (perms: { roleId: string; allowedModules: string[] }[])          => void;
  /** Update a single role's allowed modules (called by RBAC page on save) */
  updateRbacRole:          (roleId: string, allowedModules: string[])                       => void;
  /** Persist a custom role definition created/edited in the RBAC page */
  upsertRbacCustomRole:    (role: RbacCustomRole)                                           => void;
  /** Remove a custom role definition deleted in the RBAC page */
  deleteRbacCustomRole:    (roleId: string)                                                 => void;
  setGlobalNavDefaults:    (defaults: Record<string, boolean>)                              => void;
  resetGlobalNavRole:      (role: string)                                                    => void;
  updatePasswordPolicy:    (patch: Partial<PasswordPolicy>)                                 => void;
  upsertCustomRole:        (role: TenantCustomRole)                                         => void;
  deleteCustomRole:        (id: string)                                                     => void;
  setTenantRoleActive:     (roleId: string, active: boolean)                                => void;
  setTenantNavVisible:     (tenantId: string, role: string, navId: string, visible: boolean)=> void;
  resetTenantNavRole:      (tenantId: string, role: string)                                 => void;
  setTenantConfig:         (tenantId: string, config: Partial<TenantConfig>)               => void;
  setReportRights:         (reportId: string, roles: string[])                             => void;
  setCommandRights:        (cmdKey: string,  roles: string[])                              => void;

  // ── Helpers ────────────────────────────────────────────────────────────────
  getTenantNavOverride: (tenantId: string, role: string, navId: string) => boolean | null;
  isModuleEnabled:      (moduleId: string, isSuperAdmin: boolean)        => boolean;
}

export const useConfigStore = create<ConfigState>()(
  persist(
    (set, get) => ({
      globalDisabledModules: [],
      sectionOrder: [],
      rbacAllowedModules: {},
      rbacCustomRoles: [],
      globalNavDefaults: {},
      passwordPolicy: DEFAULT_PASSWORD_POLICY,

      // Custom roles are now loaded from DB via the tenant-roles page
      customRoles: [] as TenantCustomRole[],

      // Active state for custom roles
      tenantRoleActive: {} as Record<string, boolean>,

      tenantConfigs: {},

      tenantNavOverrides: {},
      reportRights: {},
      commandRights: {},
      colorTheme: 'gold' as const,

      // ── Setters ──────────────────────────────────────────────────────────

      setSectionOrder: (order) => set(() => ({ sectionOrder: order })),

      setGlobalModuleEnabled: (moduleId, enabled) =>
        set(s => ({
          globalDisabledModules: enabled
            ? s.globalDisabledModules.filter(id => id !== moduleId)
            : [...new Set([...s.globalDisabledModules, moduleId])],
        })),

      setRbacPermissions: (perms) =>
        set(() => ({
          rbacAllowedModules: Object.fromEntries(perms.map(p => [p.roleId, p.allowedModules])),
        })),

      updateRbacRole: (roleId, allowedModules) =>
        set(s => ({
          rbacAllowedModules: { ...s.rbacAllowedModules, [roleId]: allowedModules },
        })),

      upsertRbacCustomRole: (role) =>
        set(s => ({
          rbacCustomRoles: s.rbacCustomRoles.some(r => r.id === role.id)
            ? s.rbacCustomRoles.map(r => r.id === role.id ? role : r)
            : [...s.rbacCustomRoles, role],
        })),

      deleteRbacCustomRole: (roleId) =>
        set(s => ({
          rbacCustomRoles: s.rbacCustomRoles.filter(r => r.id !== roleId),
          // Also purge its allowed-modules entry
          rbacAllowedModules: Object.fromEntries(
            Object.entries(s.rbacAllowedModules).filter(([k]) => k !== roleId),
          ),
        })),

      // Full replace — called by Nav Config "Apply changes"
      setGlobalNavDefaults: (defaults) =>
        set(() => ({ globalNavDefaults: defaults })),

      // Clear all defaults for a single role (reset to RESTRICTED fallback)
      resetGlobalNavRole: (role) =>
        set(s => {
          const prefix = `${role}:`;
          const next: Record<string, boolean> = {};
          for (const [k, v] of Object.entries(s.globalNavDefaults)) {
            if (!k.startsWith(prefix)) next[k] = v;
          }
          return { globalNavDefaults: next };
        }),

      updatePasswordPolicy: (patch) =>
        set(s => ({ passwordPolicy: { ...s.passwordPolicy, ...patch } })),

      upsertCustomRole: (role) =>
        set(s => {
          const exists = s.customRoles.some(r => r.id === role.id);
          return {
            customRoles: exists
              ? s.customRoles.map(r => r.id === role.id ? role : r)
              : [role, ...s.customRoles],
            // Ensure new roles default to active
            tenantRoleActive: exists
              ? s.tenantRoleActive
              : { ...s.tenantRoleActive, [role.id]: true },
          };
        }),

      deleteCustomRole: (id) =>
        set(s => {
          const { [id]: _, ...rest } = s.tenantRoleActive;
          return { customRoles: s.customRoles.filter(r => r.id !== id), tenantRoleActive: rest };
        }),

      setTenantRoleActive: (roleId, active) =>
        set(s => ({ tenantRoleActive: { ...s.tenantRoleActive, [roleId]: active } })),

      setTenantNavVisible: (tenantId, role, navId, visible) => {
        const key = `${tenantId}:${role}:${navId}`;
        set(s => ({ tenantNavOverrides: { ...s.tenantNavOverrides, [key]: visible } }));
      },

      resetTenantNavRole: (tenantId, role) =>
        set(s => {
          const prefix = `${tenantId}:${role}:`;
          const next: Record<string, boolean> = {};
          for (const [k, v] of Object.entries(s.tenantNavOverrides)) {
            if (!k.startsWith(prefix)) next[k] = v;
          }
          return { tenantNavOverrides: next };
        }),

      setTenantConfig: (tenantId, patch) =>
        set(s => ({
          tenantConfigs: {
            ...s.tenantConfigs,
            [tenantId]: { ...DEFAULT_TENANT_CONFIG, ...s.tenantConfigs[tenantId], ...patch },
          },
        })),

      setReportRights: (reportId, roles) =>
        set(s => ({ reportRights: { ...s.reportRights, [reportId]: roles } })),

      setCommandRights: (cmdKey, roles) =>
        set(s => ({ commandRights: { ...s.commandRights, [cmdKey]: roles } })),

      setColorTheme: (t) => set(() => ({ colorTheme: t })),

      // ── Helpers ──────────────────────────────────────────────────────────

      getTenantNavOverride: (tenantId, role, navId) => {
        const key = `${tenantId}:${role}:${navId}`;
        const val = get().tenantNavOverrides[key];
        return val === undefined ? null : val;
      },

      isModuleEnabled: (moduleId, isSuperAdmin) => {
        if (isSuperAdmin) return true;
        return !get().globalDisabledModules.includes(moduleId);
      },
    }),
    {
      name: 'fleet:config',
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
