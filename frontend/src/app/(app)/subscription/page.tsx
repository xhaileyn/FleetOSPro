'use client';
import { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { hasMinRole } from '@/lib/auth';
import {
  SERVICES, PLANS, PLAN_ORDER, PlanName, CustomPlanDef, ServiceLimits,
  getCustomPlans, getAllCustomPlans, saveCustomPlan, deleteCustomPlan,
  getSubscription, getAllSubscriptions, currencySymbol,
  setTenantPlanAccess, isPlanEnabledForTenant,
} from '@/lib/subscriptions';
import { getVehiclesByTenant } from '@/lib/vehiclesMaster';
import { TENANTS } from '@/lib/isolationData';
import { PlanBuilderModal } from '@/components/subscription/PlanBuilderModal';

/* ── constants ───────────────────────────────────────────────────────── */
type Tab = 'billing' | 'plans' | 'reports';

const CARD_SHADOW = '0 1px 4px rgba(0,0,0,0.07), 0 1px 2px rgba(0,0,0,0.04)';

/* ── Platform subscription tiers (billed per vehicle/device per month) ── */
interface PlatformTier {
  id:              string;
  name:            string;
  tagline:         string;
  ratePerVehicle:  number;   // USD
  color:           string;
  highlight:       boolean;
  maxVehicles:     number | null;   // null = unlimited
  maxUsers:        number | null;
  sla:             string;
  support:         string;
  dataRetentionDays: number | null; // null = unlimited
  features: {
    liveTracking:    boolean;
    reports:         boolean;
    geofence:        boolean;
    routePlayback:   boolean;
    driverBehaviour: boolean;
    fuelMonitoring:  boolean;
    customRoles:     boolean;
    apiAccess:       boolean;
    whiteLabel:      boolean;
    ssoSaml:         boolean;
    dedicatedInfra:  boolean;
    multiRegion:     boolean;
  };
}

const PLATFORM_TIERS: PlatformTier[] = [
  {
    id: 'starter', name: 'Starter', tagline: 'Essential visibility for small fleets',
    ratePerVehicle: 8, color: '#6b7280', highlight: false,
    maxVehicles: 25, maxUsers: 5,
    sla: '99.9%', support: 'Community portal', dataRetentionDays: 30,
    features: {
      liveTracking: true,  reports: false, geofence: false, routePlayback: false,
      driverBehaviour: false, fuelMonitoring: false, customRoles: false, apiAccess: false,
      whiteLabel: false, ssoSaml: false, dedicatedInfra: false, multiRegion: false,
    },
  },
  {
    id: 'growth', name: 'Growth', tagline: 'Live tracking + alerts for growing fleets',
    ratePerVehicle: 15, color: '#2563eb', highlight: false,
    maxVehicles: 100, maxUsers: 25,
    sla: '99.9%', support: 'Email · 24 h', dataRetentionDays: 90,
    features: {
      liveTracking: true,  reports: true,  geofence: true,  routePlayback: true,
      driverBehaviour: false, fuelMonitoring: false, customRoles: false, apiAccess: false,
      whiteLabel: false, ssoSaml: false, dedicatedInfra: false, multiRegion: false,
    },
  },
  {
    id: 'business', name: 'Business', tagline: 'Full operations suite · analytics · API',
    ratePerVehicle: 25, color: '#7c3aed', highlight: true,
    maxVehicles: 500, maxUsers: null,
    sla: '99.95%', support: 'Priority · 4 h', dataRetentionDays: 365,
    features: {
      liveTracking: true,  reports: true,  geofence: true,  routePlayback: true,
      driverBehaviour: true,  fuelMonitoring: true,  customRoles: true,  apiAccess: true,
      whiteLabel: false, ssoSaml: false, dedicatedInfra: false, multiRegion: false,
    },
  },
  {
    id: 'enterprise', name: 'Enterprise', tagline: 'Unlimited scale · white-label · dedicated SLA',
    ratePerVehicle: 40, color: '#c4912a', highlight: false,
    maxVehicles: null, maxUsers: null,
    sla: '99.99%', support: '24/7 Dedicated', dataRetentionDays: null,
    features: {
      liveTracking: true,  reports: true,  geofence: true,  routePlayback: true,
      driverBehaviour: true,  fuelMonitoring: true,  customRoles: true,  apiAccess: true,
      whiteLabel: true,  ssoSaml: true,  dedicatedInfra: true,  multiRegion: true,
    },
  },
];

const TIER_FEATURES: { key: keyof PlatformTier['features']; label: string; icon: string }[] = [
  { key: 'liveTracking',    label: 'Live tracking',       icon: '📍' },
  { key: 'reports',         label: 'Reports',             icon: '📊' },
  { key: 'geofence',        label: 'Geofence alerts',     icon: '📐' },
  { key: 'routePlayback',   label: 'Route playback',      icon: '▶️' },
  { key: 'driverBehaviour', label: 'Driver behaviour',    icon: '🎯' },
  { key: 'fuelMonitoring',  label: 'Fuel monitoring',     icon: '⛽' },
  { key: 'customRoles',     label: 'Custom roles',        icon: '🔑' },
  { key: 'apiAccess',       label: 'REST API & webhooks', icon: '⚙️' },
  { key: 'whiteLabel',      label: 'White-label',         icon: '🏷️' },
  { key: 'ssoSaml',         label: 'SSO / SAML',          icon: '🔐' },
  { key: 'dedicatedInfra',  label: 'Dedicated infra',     icon: '🖥️' },
  { key: 'multiRegion',     label: 'Multi-region',        icon: '🌍' },
];

/* ── helpers ─────────────────────────────────────────────────────────── */
function fmtLimit(val: number | 'unlimited', unit = ''): string {
  if (val === 'unlimited') return 'Unlimited';
  if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}M${unit}`;
  if (val >= 1000) return `${(val / 1000).toFixed(0)}k${unit}`;
  return `${val}${unit}`;
}

function LimitChips({ limits, services }: { limits: ServiceLimits; services: string[] }) {
  const chips: { label: string; icon: string }[] = [];
  if (services.includes('sms_alert') && limits.smsPerMonth !== undefined)
    chips.push({ icon: '💬', label: `${fmtLimit(limits.smsPerMonth)} SMS/mo` });
  if (services.includes('live_tracking') && limits.gpsRefreshSec !== undefined)
    chips.push({ icon: '📍', label: `${limits.gpsRefreshSec}s GPS refresh` });
  if (services.includes('route_playback') && limits.routeHistoryDays !== undefined)
    chips.push({ icon: '▶', label: limits.routeHistoryDays >= 365 ? `${limits.routeHistoryDays / 365}yr history` : `${limits.routeHistoryDays}d history` });
  if (services.includes('api_access') && limits.apiCallsPerMonth !== undefined)
    chips.push({ icon: '⚙', label: `${fmtLimit(limits.apiCallsPerMonth)} API/mo` });
  if (services.includes('reports') && limits.reportsPerMonth !== undefined)
    chips.push({ icon: '📊', label: `${fmtLimit(limits.reportsPerMonth)} reports/mo` });
  if (!chips.length) return null;
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 8 }}>
      {chips.map(c => (
        <span key={c.label} style={{
          display: 'inline-flex', alignItems: 'center', gap: 3,
          fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 12,
          background: '#f0f4f8', color: '#4b5f7c', border: '1px solid #dde4ee',
        }}>
          {c.icon} {c.label}
        </span>
      ))}
    </div>
  );
}

/* ── UsageBar ────────────────────────────────────────────────────────── */
function UsageBar({
  label, used, limit, unit, color = '#c4912a',
}: {
  label: string; used: number; limit: number | null; unit: string; color?: string;
}) {
  const pct = limit ? Math.min(100, Math.round((used / limit) * 100)) : null;
  const barColor = pct === null ? color : pct >= 90 ? 'var(--red)' : pct >= 70 ? '#f59e0b' : color;
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
        <span style={{ fontSize: 12, color: 'var(--ink2)', fontWeight: 500 }}>{label}</span>
        <span style={{ fontSize: 11, color: pct !== null && pct >= 80 ? barColor : 'var(--ink3)', fontWeight: pct !== null && pct >= 80 ? 600 : 400 }}>
          {limit
            ? `${used.toLocaleString()} / ${limit.toLocaleString()}${unit}`
            : `${used}${unit}`}
          {pct !== null && <span style={{ marginLeft: 4, opacity: 0.75 }}>({pct}%)</span>}
        </span>
      </div>
      {pct !== null && (
        <div style={{ height: 6, background: '#eee9e2', borderRadius: 4, overflow: 'hidden' }}>
          <div style={{ width: `${pct}%`, height: '100%', background: barColor, borderRadius: 4, transition: 'width 0.5s ease' }} />
        </div>
      )}
      {pct !== null && pct >= 80 && (
        <div style={{ fontSize: 10, color: barColor, marginTop: 4, fontWeight: 600 }}>
          {pct >= 90 ? '⚠ Approaching limit — consider upgrading' : `${100 - pct}% remaining`}
        </div>
      )}
    </div>
  );
}

/* ── Standard package card (tenant enable / disable) ─────────────────── */
function StandardPackageCard({
  name, tenantId, canToggle, onToggle,
}: {
  name: PlanName; tenantId: string; canToggle: boolean; onToggle: () => void;
}) {
  const plan    = PLANS[name];
  const enabled = isPlanEnabledForTenant(tenantId, name);
  const accentColor = enabled ? plan.color : '#9ca3af';

  return (
    <div style={{
      background: '#fff', borderRadius: 14,
      border: `1px solid ${enabled ? '#e8e3dc' : '#e5e7eb'}`,
      boxShadow: CARD_SHADOW,
      overflow: 'hidden',
      display: 'flex', flexDirection: 'column',
      opacity: enabled ? 1 : 0.65,
      transition: 'opacity 0.2s',
    }}>
      {/* Accent bar */}
      <div style={{ height: 4, background: accentColor, flexShrink: 0 }} />

      {/* Header */}
      <div style={{ padding: '18px 20px 14px', borderBottom: '1px solid #f0ece6' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
          <div style={{ flex: 1 }}>
            {plan.highlight && enabled && (
              <div style={{ marginBottom: 8 }}>
                <span style={{
                  fontSize: 9, fontWeight: 700, letterSpacing: 1,
                  padding: '3px 10px', borderRadius: 20,
                  background: plan.color, color: '#fff',
                }}>★ MOST POPULAR</span>
              </div>
            )}
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)', marginBottom: 4 }}>{plan.name}</div>
            <div style={{ fontSize: 11, color: 'var(--ink3)', lineHeight: 1.5 }}>{plan.tagline}</div>
            {!enabled && (
              <div style={{ marginTop: 7 }}>
                <span style={{
                  fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 10,
                  background: '#f3f4f6', color: '#9ca3af', border: '1px solid #e5e7eb',
                  letterSpacing: 0.5,
                }}>DISABLED</span>
              </div>
            )}
          </div>
          {canToggle && (
            <button
              onClick={onToggle}
              title={`${enabled ? 'Disable' : 'Enable'} ${plan.name}`}
              style={{
                width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer',
                background: enabled ? plan.color : '#d1d5db',
                position: 'relative', flexShrink: 0, marginTop: 2,
                transition: 'background 0.2s',
                boxShadow: enabled ? `0 2px 6px ${plan.color}55` : 'none',
              }}>
              <div style={{
                position: 'absolute', top: 4, left: enabled ? 24 : 4,
                width: 16, height: 16, borderRadius: '50%', background: '#fff',
                transition: 'left 0.18s ease',
                boxShadow: '0 1px 3px rgba(0,0,0,0.25)',
              }} />
            </button>
          )}
        </div>
      </div>

      {/* Price */}
      <div style={{ padding: '16px 20px', borderBottom: '1px solid #f0ece6', background: accentColor + '07' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
          <span style={{ fontSize: 13, color: accentColor, fontWeight: 600, lineHeight: 1, paddingBottom: 6 }}>$</span>
          <span style={{ fontSize: 34, fontWeight: 800, color: accentColor, letterSpacing: '-1.5px', lineHeight: 1 }}>{plan.price}</span>
          <span style={{ fontSize: 11, color: 'var(--ink3)', marginLeft: 4 }}>/vehicle/mo</span>
        </div>
      </div>

      {/* Service checklist */}
      <div style={{ padding: '14px 20px', flex: 1 }}>
        <div style={{
          fontSize: 10, fontWeight: 700, color: 'var(--ink3)',
          textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12,
        }}>
          {plan.services.length} of {SERVICES.length} services included
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          {SERVICES.map(svc => {
            const on = plan.services.includes(svc.key);
            return (
              <div key={svc.key} style={{
                display: 'flex', alignItems: 'center', gap: 8,
                opacity: on ? 1 : 0.32,
              }}>
                <span style={{
                  flexShrink: 0, width: 16, height: 16, borderRadius: '50%',
                  background: on ? accentColor + '18' : '#f3f4f6',
                  border: `1.5px solid ${on ? accentColor + '50' : '#ddd8d0'}`,
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 8, fontWeight: 800,
                  color: on ? accentColor : '#9ca3af',
                }}>
                  {on ? '✓' : ''}
                </span>
                <span style={{
                  fontSize: 11, lineHeight: 1.3,
                  color: on ? 'var(--ink2)' : 'var(--ink3)',
                  fontWeight: on ? 500 : 400,
                }}>
                  {svc.icon} {svc.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div style={{ padding: '10px 20px 16px' }}>
        {canToggle ? (
          <button
            onClick={onToggle}
            style={{
              width: '100%', padding: '8px 12px',
              background: enabled ? '#fff0f0' : 'rgba(196,145,42,0.12)',
              border: `1px solid ${enabled ? '#fecaca' : '#a7e3d8'}`,
              borderRadius: 7, fontSize: 11, fontWeight: 600,
              cursor: 'pointer',
              color: enabled ? '#dc2626' : '#c4912a',
              transition: 'all 0.15s',
            }}>
            {enabled ? 'Disable package' : 'Enable package'}
          </button>
        ) : (
          <div style={{
            fontSize: 10, color: 'var(--ink3)', padding: '7px 12px',
            background: '#f8f9fb', border: '1px solid #eaecef',
            borderRadius: 7, textAlign: 'center', letterSpacing: 0.2,
          }}>
            🔒 Platform plan · read only
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Custom plan card ────────────────────────────────────────────────── */
function CustomPlanCard({
  plan, canEdit, onEdit, onDuplicate, onArchive, onDelete, onSetDefault,
}: {
  plan: CustomPlanDef; canEdit: boolean;
  onEdit: () => void; onDuplicate: () => void;
  onArchive: () => void; onDelete: () => void; onSetDefault: () => void;
}) {
  const [menuOpen, setMenu] = useState(false);
  const isActive   = plan.status === 'active';
  const isDraft    = plan.status === 'draft';
  const isArchived = plan.status === 'archived';

  const statusBadge = isActive
    ? { bg: '#ecfdf5', color: '#065f46', border: '#a7f3d0', dot: '#10b981', label: 'Active' }
    : isDraft
    ? { bg: '#fffbeb', color: '#92400e', border: '#fde68a', dot: '#f59e0b', label: 'Draft' }
    : { bg: '#f9fafb', color: '#6b7280', border: '#d1d5db', dot: '#9ca3af', label: 'Archived' };

  return (
    <div style={{
      background: '#fff', borderRadius: 14,
      border: `1px solid ${isActive ? plan.color + '35' : '#e5e7eb'}`,
      boxShadow: CARD_SHADOW,
      overflow: 'hidden', position: 'relative',
      opacity: isArchived ? 0.65 : 1,
      display: 'flex', flexDirection: 'column',
      transition: 'box-shadow 0.15s ease',
    }}>
      {/* Color top bar */}
      <div style={{ height: 4, background: plan.color, flexShrink: 0 }} />

      <div style={{ padding: '16px 18px', flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>

        {/* Title row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap', marginBottom: 3 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>{plan.name}</span>
              {plan.highlight && (
                <span style={{
                  fontSize: 8, fontWeight: 700, padding: '2px 7px', borderRadius: 10,
                  background: plan.color, color: '#fff', letterSpacing: 0.6,
                }}>POPULAR</span>
              )}
              {plan.isDefault && (
                <span style={{
                  fontSize: 8, fontWeight: 700, padding: '2px 7px', borderRadius: 10,
                  background: '#dbeafe', color: '#1d4ed8', letterSpacing: 0.6,
                }}>DEFAULT</span>
              )}
            </div>
            <div style={{ fontSize: 11, color: 'var(--ink3)', lineHeight: 1.45 }}>{plan.tagline}</div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
            {/* Status badge */}
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              fontSize: 10, fontWeight: 600, padding: '3px 9px', borderRadius: 20,
              background: statusBadge.bg, color: statusBadge.color,
              border: `1px solid ${statusBadge.border}`,
              whiteSpace: 'nowrap',
            }}>
              <span style={{
                width: 5, height: 5, borderRadius: '50%',
                background: statusBadge.dot, flexShrink: 0,
              }} />
              {statusBadge.label}
            </span>

            {canEdit && (
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => setMenu(m => !m)}
                  style={{
                    background: '#f8fafc', border: '1px solid #e2e8f0',
                    borderRadius: 7, padding: '4px 9px', cursor: 'pointer',
                    fontSize: 15, color: 'var(--ink3)', lineHeight: 1,
                  }}>
                  ⋯
                </button>
                {menuOpen && (
                  <div
                    style={{
                      position: 'absolute', top: '110%', right: 0, background: '#fff',
                      border: '1px solid #e5e7eb', borderRadius: 10, padding: '5px 0',
                      zIndex: 100, minWidth: 175,
                      boxShadow: '0 8px 24px rgba(0,0,0,0.12), 0 2px 6px rgba(0,0,0,0.06)',
                    }}
                    onClick={e => e.stopPropagation()}>
                    {[
                      { label: '✏️  Edit plan',        action: () => { onEdit(); setMenu(false); } },
                      { label: '📋  Duplicate',         action: () => { onDuplicate(); setMenu(false); } },
                      ...(!plan.isDefault ? [{ label: '⭐  Set as default',  action: () => { onSetDefault(); setMenu(false); } }] : []),
                      ...(isActive        ? [{ label: '🗂  Archive',          action: () => { onArchive(); setMenu(false); } }] : []),
                      ...(isDraft         ? [{ label: '🗑  Delete',           action: () => { onDelete(); setMenu(false); } }] : []),
                    ].map((item, i, arr) => (
                      <button
                        key={item.label}
                        onClick={item.action}
                        style={{
                          display: 'block', width: '100%', textAlign: 'left',
                          padding: '8px 16px', background: 'none', border: 'none',
                          fontSize: 12, cursor: 'pointer', color: 'var(--ink)',
                          borderBottom: i < arr.length - 1 ? '1px solid #f3f4f6' : 'none',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.background = '#f8f9fa')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
                        {item.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Price + vehicle stat */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 14px', background: plan.color + '09',
          borderRadius: 10, border: `1px solid ${plan.color}20`,
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
              <span style={{ fontSize: 11, color: plan.color, fontWeight: 600, lineHeight: 1, paddingBottom: 4 }}>{currencySymbol(plan.currency)}</span>
              <span style={{ fontSize: 28, fontWeight: 800, color: plan.color, letterSpacing: '-0.8px', lineHeight: 1 }}>{plan.price.toLocaleString()}</span>
              <span style={{ fontSize: 10, color: 'var(--ink3)', marginLeft: 3 }}>/vehicle/mo</span>
            </div>
          </div>
          <div style={{ textAlign: 'right', paddingLeft: 12, borderLeft: `1px solid ${plan.color}20` }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--ink)', lineHeight: 1 }}>{plan.vehicleCount}</div>
            <div style={{ fontSize: 10, color: 'var(--ink3)', marginTop: 2 }}>vehicles</div>
          </div>
        </div>

        {/* Service chips */}
        <div>
          <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--ink3)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 7 }}>
            {plan.services.length} services
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {plan.services.slice(0, 5).map(sk => {
              const svc = SERVICES.find(s => s.key === sk);
              return svc ? (
                <span key={sk} style={{
                  fontSize: 10, padding: '3px 8px', borderRadius: 5, fontWeight: 500,
                  background: plan.color + '11', color: plan.color,
                  border: `1px solid ${plan.color}28`,
                }}>
                  {svc.icon} {svc.label}
                </span>
              ) : null;
            })}
            {plan.services.length > 5 && (
              <span style={{
                fontSize: 10, padding: '3px 8px', borderRadius: 5, fontWeight: 500,
                background: '#f1f5f9', color: '#64748b', border: '1px solid #e2e8f0',
              }}>
                +{plan.services.length - 5} more
              </span>
            )}
          </div>
          <LimitChips limits={plan.limits} services={plan.services} />
        </div>

        {/* Footer */}
        <div style={{
          paddingTop: 10, borderTop: '1px solid #f0ece6',
          display: 'flex', justifyContent: 'space-between',
          fontSize: 10, color: 'var(--ink3)', marginTop: 'auto',
        }}>
          <span>Created {new Date(plan.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
          <span>Updated {new Date(plan.updatedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
        </div>
      </div>
    </div>
  );
}

/* ── Vehicle-owner read-only view ────────────────────────────────────── */
function VehicleOwnerSubscription() {
  const { user } = useAuthStore();
  const vehicleId = user?.vehicleId ?? user?.vehicleIds?.[0] ?? 'v1';
  const sub       = getSubscription(vehicleId);
  const planName  = sub?.plan ?? 'Enterprise';
  const plan      = PLANS[planName];
  const tierIdx   = PLAN_ORDER.indexOf(planName);

  const daysLeft = sub ? Math.max(0, Math.ceil(
    (new Date(sub.expiryDate).getTime() - Date.now()) / 86400000
  )) : null;

  const expiryColor = !daysLeft ? 'var(--ink3)'
    : daysLeft <= 7  ? 'var(--red)'
    : daysLeft <= 30 ? '#d97706'
    : '#16a34a';

  const USAGE = [
    { label: 'GPS live tracking',     used: 1,    limit: null,  unit: ' vehicle'       },
    { label: 'Route history',         used: 18,   limit: sub?.plan === 'Starter' ? 7 : sub?.plan === 'Basic' ? 30 : 90, unit: ' days retained' },
    { label: 'SMS alerts this month', used: 24,   limit: sub?.plan === 'Basic' ? 100 : sub?.plan === 'Professional' ? 300 : 1000, unit: '' },
    { label: 'Reports generated',     used: 3,    limit: sub?.plan === 'Basic' ? 5 : null, unit: '' },
  ];

  return (
    <div className="page-in" style={{ padding: '14px 18px' }}>
      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <div style={{ background:'linear-gradient(135deg,#0d1b2a 0%,#162033 55%,#1c2b44 100%)', border:'1px solid rgba(196,145,42,0.18)', borderRadius:14, padding:'20px 24px', marginBottom:20, boxShadow:'0 4px 24px rgba(13,27,42,0.50),inset 0 1px 0 rgba(196,145,42,0.15)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div style={{ display:'flex', alignItems:'center', gap:14 }}>
          <div style={{ width:44, height:44, borderRadius:10, background:'rgba(196,145,42,0.15)', border:'1px solid rgba(196,145,42,0.25)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <i className="ti ti-credit-card" style={{ fontSize:22, color:'#f5d07a' }} />
          </div>
          <div>
            <div style={{ fontSize:10, fontWeight:700, letterSpacing:1.2, textTransform:'uppercase', color:'rgba(245,208,122,0.7)', marginBottom:2 }}>SaaS &amp; Billing</div>
            <h1 style={{ fontSize:22, fontWeight:800, color:'#fff', margin:0 }}>My Subscription</h1>
            <div style={{ fontSize:12, color:'rgba(255,255,255,0.45)', marginTop:2 }}>Your active plan and usage — contact your fleet administrator to make changes</div>
          </div>
        </div>
        <div style={{ textAlign:'center', padding:'0 18px' }}>
          <div style={{ fontSize:20, fontWeight:700, color:'#f5d07a' }}>{plan.name}</div>
          <div style={{ fontSize:9, color:'rgba(245,208,122,0.55)', fontWeight:500, textTransform:'uppercase', letterSpacing:0.5 }}>Active Plan</div>
        </div>
      </div>

      {/* Plan hero */}
      <div style={{
        background: `linear-gradient(135deg, ${plan.color} 0%, ${plan.color}cc 100%)`,
        borderRadius: 16, padding: '28px 32px', color: '#fff',
        marginBottom: 24, position: 'relative', overflow: 'hidden',
        boxShadow: `0 8px 28px ${plan.color}50`,
      }}>
        <div style={{ position: 'absolute', right: -40, top: -40, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
        <div style={{ position: 'absolute', right: 60, bottom: -60, width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: 10, opacity: 0.7, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8, fontWeight: 600 }}>Active plan</div>
              <div style={{ fontSize: 36, fontWeight: 800, letterSpacing: '-1px', lineHeight: 1 }}>{plan.name}</div>
              <div style={{ fontSize: 13, opacity: 0.8, marginTop: 6 }}>{plan.tagline}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 10, opacity: 0.7, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Monthly rate</div>
              <div style={{ fontSize: 38, fontWeight: 800, letterSpacing: '-1px', lineHeight: 1 }}>
                ${plan.price}<span style={{ fontSize: 15, fontWeight: 400, opacity: 0.7, letterSpacing: 0 }}>/mo</span>
              </div>
              <div style={{ fontSize: 11, opacity: 0.6, marginTop: 4 }}>per vehicle · billed monthly</div>
            </div>
          </div>

          {/* Tier ladder */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            {PLAN_ORDER.map((t, i) => (
              <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{
                  padding: '4px 14px', borderRadius: 20, fontSize: 10, fontWeight: 700,
                  background: i === tierIdx ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.15)',
                  color:      i === tierIdx ? plan.color               : 'rgba(255,255,255,0.75)',
                  border:     i === tierIdx ? 'none' : '1px solid rgba(255,255,255,0.2)',
                }}>
                  {t}
                </div>
                {i < PLAN_ORDER.length - 1 && (
                  <span style={{ fontSize: 10, opacity: 0.35 }}>›</span>
                )}
              </div>
            ))}
          </div>

          {/* Renewal strip */}
          {sub && (
            <div style={{
              marginTop: 18, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.15)',
              display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap', fontSize: 12,
            }}>
              <span style={{ opacity: 0.85 }}>📅 Renews {sub.expiryDate}</span>
              <span style={{
                fontSize: 11, fontWeight: 700, padding: '3px 12px', borderRadius: 20,
                background: daysLeft !== null && daysLeft <= 30 ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.18)',
                color: daysLeft !== null && daysLeft <= 30 ? expiryColor : '#fff',
                border: daysLeft !== null && daysLeft <= 30 ? 'none' : '1px solid rgba(255,255,255,0.25)',
              }}>
                {daysLeft !== null ? `${daysLeft} days left` : 'No expiry'}
              </span>
              {sub.autoRenew && (
                <span style={{ opacity: 0.85, display: 'flex', alignItems: 'center', gap: 4 }}>
                  🔄 Auto-renew on
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Two-column: services + usage */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginBottom: 20 }}>

        {/* Included services */}
        <div style={{
          background: '#fff', border: '1px solid var(--border)',
          borderRadius: 14, padding: '20px 22px',
          boxShadow: CARD_SHADOW,
        }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            Services
            <span style={{
              fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 10,
              background: 'rgba(196,145,42,0.12)', color: '#c4912a',
            }}>
              {plan.services.length} included
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            {SERVICES.map(svc => {
              const active = plan.services.includes(svc.key);
              return (
                <div key={svc.key} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '7px 10px', borderRadius: 8,
                  background: active ? 'rgba(196,145,42,0.12)' : '#f8f9fb',
                  border: `1px solid ${active ? '#a7e3d8' : 'transparent'}`,
                  opacity: active ? 1 : 0.45,
                }}>
                  <span style={{ fontSize: 14 }}>{svc.icon}</span>
                  <span style={{
                    flex: 1, fontSize: 12,
                    fontWeight: active ? 600 : 400,
                    color: active ? '#c4912a' : 'var(--ink3)',
                  }}>{svc.label}</span>
                  <span style={{
                    fontSize: 10, fontWeight: 700,
                    color: active ? '#c4912a' : 'var(--ink3)',
                  }}>
                    {active ? '✓' : '—'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Usage */}
        <div style={{
          background: '#fff', border: '1px solid var(--border)',
          borderRadius: 14, padding: '20px 22px',
          boxShadow: CARD_SHADOW,
        }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)', marginBottom: 18 }}>
            Usage this period
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {USAGE.map(u => (
              <UsageBar key={u.label} label={u.label} used={u.used} limit={u.limit} unit={u.unit} />
            ))}
          </div>
        </div>
      </div>

      {/* Read-only notice */}
      <div style={{
        padding: '14px 18px', borderRadius: 10,
        background: '#f8fafc', border: '1px solid #e8edf2',
        display: 'flex', alignItems: 'center', gap: 12,
        fontSize: 12, color: 'var(--ink3)',
        boxShadow: CARD_SHADOW,
      }}>
        <span style={{ fontSize: 18, flexShrink: 0 }}>🔒</span>
        <span>Plan changes, upgrades, and billing are managed by your fleet administrator. Contact them to request a plan change or upgrade.</span>
      </div>
    </div>
  );
}

/* ── Super-admin Plans tab ───────────────────────────────────────────── */
function SuperAdminPlansTab() {
  const [, setTick] = useState(0);

  function toggle(tenantId: string, planName: PlanName) {
    setTenantPlanAccess(tenantId, planName, !isPlanEnabledForTenant(tenantId, planName));
    setTick(t => t + 1);
  }

  const allPlans = getAllCustomPlans();
  const byTenant: Record<string, CustomPlanDef[]> = {};
  for (const p of allPlans) (byTenant[p.tenantId] ??= []).push(p);
  const tenantsWithPlans = TENANTS.filter(t => byTenant[t.id]?.length);

  function initials(name: string) {
    return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  }

  return (
    <>
      {/* ── Section 1: Platform Plan Access Matrix ─────────────────────── */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)', marginBottom: 4 }}>
            Platform Plan Access
          </div>
          <div style={{ fontSize: 11, color: 'var(--ink3)' }}>
            Control which standard plans each tenant can assign to vehicles. Changes apply immediately.
          </div>
        </div>

        <div style={{
          background: '#fff', border: '1px solid var(--border)',
          borderRadius: 14, overflow: 'hidden', boxShadow: CARD_SHADOW,
        }}>
          {/* Column headers */}
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr repeat(4, 150px)',
            background: '#fafaf9', borderBottom: '1.5px solid var(--border)',
          }}>
            <div style={{ padding: '12px 18px', fontSize: 10, fontWeight: 700, color: 'var(--ink3)', textTransform: 'uppercase', letterSpacing: 0.8 }}>
              Tenant
            </div>
            {PLAN_ORDER.map(name => (
              <div key={name} style={{ padding: '12px 16px', textAlign: 'center', borderLeft: '1px solid #f0ece6' }}>
                <div style={{
                  display: 'inline-block', width: 10, height: 10, borderRadius: '50%',
                  background: PLANS[name].color, marginBottom: 4,
                }} />
                <div style={{ fontSize: 11, fontWeight: 700, color: PLANS[name].color }}>{name}</div>
                <div style={{ fontSize: 10, color: 'var(--ink3)', marginTop: 1 }}>${PLANS[name].price}/mo</div>
              </div>
            ))}
          </div>

          {/* Tenant rows */}
          {TENANTS.map((tenant, i) => (
            <div
              key={tenant.id}
              style={{
                display: 'grid', gridTemplateColumns: '1fr repeat(4, 150px)',
                borderBottom: i < TENANTS.length - 1 ? '1px solid #f5f2ee' : 'none',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = '#fafaf9')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>

              {/* Tenant identity */}
              <div style={{ padding: '13px 18px', display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 34, height: 34, borderRadius: 9, flexShrink: 0,
                  background: 'rgba(196,145,42,0.12)', color: '#c4912a',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 800, letterSpacing: 0.3,
                }}>
                  {initials(tenant.name)}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)', lineHeight: 1.3 }}>{tenant.name}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
                    <span style={{ fontSize: 10, color: 'var(--ink3)' }}>{tenant.country}</span>
                    <span style={{
                      fontSize: 9, fontWeight: 700, padding: '1px 6px', borderRadius: 4,
                      background: tenant.status === 'Active'    ? '#ecfdf5'
                                : tenant.status === 'Trial'     ? '#fffbeb'
                                : '#f9fafb',
                      color:      tenant.status === 'Active'    ? '#065f46'
                                : tenant.status === 'Trial'     ? '#92400e'
                                : '#6b7280',
                    }}>
                      {tenant.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Toggle per plan */}
              {PLAN_ORDER.map(planName => {
                const enabled = isPlanEnabledForTenant(tenant.id, planName);
                return (
                  <div key={planName} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: '13px 16px', borderLeft: '1px solid #f5f2ee',
                  }}>
                    <button
                      onClick={() => toggle(tenant.id, planName)}
                      title={`${enabled ? 'Disable' : 'Enable'} ${planName} for ${tenant.name}`}
                      style={{
                        width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer',
                        background: enabled ? PLANS[planName].color : '#d1d5db',
                        position: 'relative', flexShrink: 0,
                        transition: 'background 0.2s',
                        boxShadow: enabled ? `0 2px 6px ${PLANS[planName].color}55` : 'none',
                      }}>
                      <div style={{
                        position: 'absolute', top: 4, left: enabled ? 24 : 4,
                        width: 16, height: 16, borderRadius: '50%', background: '#fff',
                        transition: 'left 0.18s ease',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.25)',
                      }} />
                    </button>
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        <div style={{ marginTop: 10, fontSize: 11, color: 'var(--ink3)', display: 'flex', alignItems: 'center', gap: 6 }}>
          <span>💡</span>
          Disabling a plan prevents that tenant's admins from assigning it to vehicles. Existing assignments are unaffected.
        </div>
      </div>

      {/* ── Divider ────────────────────────────────────────────────────── */}
      <div style={{ height: 1, background: 'var(--border)', marginBottom: 28 }} />

      {/* ── Section 2: All Custom Plans across tenants ──────────────────── */}
      <div>
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)' }}>All Custom Plans</div>
            <span style={{
              fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10,
              background: 'rgba(196,145,42,0.12)', color: '#c4912a',
            }}>
              {allPlans.length} total across {tenantsWithPlans.length} tenant{tenantsWithPlans.length !== 1 ? 's' : ''}
            </span>
          </div>
          <div style={{ fontSize: 11, color: 'var(--ink3)' }}>
            Custom plans configured by tenant admins · read-only
          </div>
        </div>

        {tenantsWithPlans.length === 0 ? (
          <div style={{
            padding: '60px 24px', textAlign: 'center', background: '#fff',
            borderRadius: 14, border: '1.5px dashed var(--border2)', boxShadow: CARD_SHADOW,
          }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>📦</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink)', marginBottom: 4 }}>No custom plans yet</div>
            <div style={{ fontSize: 12, color: 'var(--ink3)' }}>
              Tenant admins can create custom plans from their subscription settings.
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
            {tenantsWithPlans.map(tenant => {
              const tenantPlans = byTenant[tenant.id] ?? [];
              const activeCnt  = tenantPlans.filter(p => p.status === 'active').length;
              const draftCnt   = tenantPlans.filter(p => p.status === 'draft').length;
              return (
                <div key={tenant.id}>
                  {/* Tenant section header */}
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    marginBottom: 14, paddingBottom: 12,
                    borderBottom: '1.5px solid var(--border)',
                  }}>
                    <div style={{
                      width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                      background: 'rgba(196,145,42,0.12)', color: '#c4912a',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 13, fontWeight: 800,
                    }}>
                      {initials(tenant.name)}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)', marginBottom: 3 }}>
                        {tenant.name}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: 'var(--ink3)' }}>
                        <span>{tenant.country}</span>
                        <span>·</span>
                        <span>{tenant.vehicles} vehicles</span>
                        <span>·</span>
                        <span>{tenant.users} users</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {activeCnt > 0 && (
                        <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 10, background: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0' }}>
                          {activeCnt} active
                        </span>
                      )}
                      {draftCnt > 0 && (
                        <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 10, background: '#fffbeb', color: '#92400e', border: '1px solid #fde68a' }}>
                          {draftCnt} draft
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Read-only plan cards */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))', gap: 14 }}>
                    {tenantPlans.map(plan => (
                      <CustomPlanCard
                        key={plan.id}
                        plan={plan}
                        canEdit={false}
                        onEdit={() => {}}
                        onDuplicate={() => {}}
                        onArchive={() => {}}
                        onDelete={() => {}}
                        onSetDefault={() => {}}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}

/* ── Main page ───────────────────────────────────────────────────────── */
export default function SubscriptionPage() {
  const { user } = useAuthStore();

  if (user?.role === 'vehicle_owner') return <VehicleOwnerSubscription />;

  const isSuperAdmin = user?.role === 'super_admin' || user?.role === 'platform_admin';
  const canEdit      = !isSuperAdmin && (user ? hasMinRole(user, 'fleet_manager') : false);
  const tenantId     = user?.tenantId ?? '1';

  const [activeTab, setActiveTab] = useState<Tab>('billing');
  const [plans,     setPlans]     = useState<CustomPlanDef[]>(() => getCustomPlans(tenantId));
  const [, setPlanTick]           = useState(0);
  const [builder,   setBuilder]   = useState<
    { mode: 'create'; base?: CustomPlanDef } | { mode: 'edit'; plan: CustomPlanDef } | null
  >(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'draft' | 'archived'>('all');

  const canTogglePackages = !isSuperAdmin && (user ? hasMinRole(user, 'fleet_admin') : false);

  function refresh() { setPlans(getCustomPlans(tenantId)); }

  function handleToggleStandardPlan(planName: PlanName) {
    setTenantPlanAccess(tenantId, planName, !isPlanEnabledForTenant(tenantId, planName));
    setPlanTick(t => t + 1);
  }

  function handleDuplicate(plan: CustomPlanDef) {
    const dup: CustomPlanDef = {
      ...plan,
      id: `cp-dup-${Date.now().toString(36)}`,
      name: `${plan.name} (copy)`,
      status: 'draft',
      isDefault: false,
      vehicleCount: 0,
      createdAt: '2026-05-28',
      updatedAt: '2026-05-28',
    };
    saveCustomPlan(dup);
    refresh();
  }

  function handleArchive(id: string) {
    const plan = plans.find(p => p.id === id);
    if (!plan) return;
    saveCustomPlan({ ...plan, status: 'archived', updatedAt: '2026-05-28' });
    refresh();
  }

  function handleDelete(id: string) {
    deleteCustomPlan(id);
    refresh();
  }

  function handleSetDefault(id: string) {
    plans.forEach(p => saveCustomPlan({ ...p, isDefault: p.id === id, updatedAt: '2026-05-28' }));
    refresh();
  }

  const filteredPlans = plans.filter(p => filter === 'all' || p.status === filter);

  /* platform billing — derived from real tenant data */
  const activeTenant   = TENANTS.find(t => t.id === tenantId);
  const vehicleCount   = activeTenant?.vehicles  ?? 0;
  const userCount      = activeTenant?.users     ?? 0;
  const tenantPlanName = activeTenant?.plan      ?? 'Business';
  const currentTier    = PLATFORM_TIERS.find(t => t.name.toLowerCase() === tenantPlanName.toLowerCase())
                         ?? PLATFORM_TIERS[2];
  const monthlyBill    = vehicleCount * currentTier.ratePerVehicle;
  const currentTierIdx = PLATFORM_TIERS.indexOf(currentTier);

  return (
    <div className="page-in" style={{ padding: '14px 18px' }}>

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <div style={{ background:'linear-gradient(135deg,#0d1b2a 0%,#162033 55%,#1c2b44 100%)', border:'1px solid rgba(196,145,42,0.18)', borderRadius:14, padding:'20px 24px', marginBottom:20, boxShadow:'0 4px 24px rgba(13,27,42,0.50),inset 0 1px 0 rgba(196,145,42,0.15)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div style={{ display:'flex', alignItems:'center', gap:14 }}>
          <div style={{ width:44, height:44, borderRadius:10, background:'rgba(196,145,42,0.15)', border:'1px solid rgba(196,145,42,0.25)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <i className="ti ti-credit-card" style={{ fontSize:22, color:'#f5d07a' }} />
          </div>
          <div>
            <div style={{ fontSize:10, fontWeight:700, letterSpacing:1.2, textTransform:'uppercase', color:'rgba(245,208,122,0.7)', marginBottom:2 }}>SaaS &amp; Billing</div>
            <h1 style={{ fontSize:22, fontWeight:800, color:'#fff', margin:0 }}>Subscription</h1>
            <div style={{ fontSize:12, color:'rgba(255,255,255,0.45)', marginTop:2 }}>Manage tenant subscriptions, custom plans, and billing history</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, borderBottom: '1.5px solid var(--border)', marginBottom: 28 }}>
        {([
          { key: 'billing' as Tab, label: 'Billing',  icon: '💳' },
          { key: 'plans'   as Tab, label: 'Plans',    icon: '📦',
            badge: plans.filter(p => p.status !== 'archived').length },
          { key: 'reports' as Tab, label: 'Reports',  icon: '📋' },
        ]).map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: '10px 20px', border: 'none', cursor: 'pointer',
              background: 'none', fontSize: 13, fontWeight: activeTab === tab.key ? 700 : 500,
              color: activeTab === tab.key ? '#c4912a' : 'var(--ink3)',
              borderBottom: `2px solid ${activeTab === tab.key ? '#c4912a' : 'transparent'}`,
              marginBottom: -1.5,
              display: 'inline-flex', alignItems: 'center', gap: 7,
              transition: 'color 0.15s',
            }}>
            {tab.icon} {tab.label}
            {'badge' in tab && (tab as { badge: number }).badge > 0 && (
              <span style={{
                fontSize: 9, fontWeight: 700, padding: '1px 6px', borderRadius: 10,
                background: activeTab === tab.key ? 'rgba(196,145,42,0.12)' : '#f0ece6',
                color: activeTab === tab.key ? '#c4912a' : 'var(--ink3)',
              }}>
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── BILLING TAB ────────────────────────────────────────────────── */}
      {activeTab === 'billing' && (() => {
        const INVOICES_GEN = [0,1,2,3].map(i => {
          const d = new Date('2026-06-01');
          d.setMonth(d.getMonth() - i);
          const yr = d.getFullYear();
          const mo = String(d.getMonth() + 1).padStart(2, '0');
          return {
            id: `INV-${yr}-${mo}`,
            date: d.toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' }),
            vehicles: vehicleCount,
            rate: currentTier.ratePerVehicle,
            amount: monthlyBill,
            status: 'Paid' as const,
          };
        });

        const USAGE_METERS = [
          { label: 'Vehicles / devices', used: vehicleCount, limit: currentTier.maxVehicles, unit: '' },
          { label: 'Users',              used: userCount,    limit: currentTier.maxUsers,    unit: '' },
          { label: 'API calls this mo.', used: currentTier.features.apiAccess ? 148200 : 0, limit: currentTier.features.apiAccess ? 5000000 : null, unit: '' },
          { label: 'Data retention',     used: currentTier.dataRetentionDays ?? 999, limit: currentTier.dataRetentionDays, unit: ' days' },
        ];

        const nextTier = PLATFORM_TIERS[currentTierIdx + 1] ?? null;

        return (
          <>
            {/* KPI stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 22 }}>
              {([
                { label: 'Monthly bill',    value: `$${monthlyBill.toLocaleString()}`, sub: `${vehicleCount} vehicles × $${currentTier.ratePerVehicle}/mo`, icon: '💳' },
                { label: 'Active vehicles', value: vehicleCount.toLocaleString(),  sub: currentTier.maxVehicles ? `of ${currentTier.maxVehicles} seat limit` : 'unlimited seats', icon: '🚛' },
                { label: 'Active users',    value: userCount.toLocaleString(),     sub: currentTier.maxUsers    ? `of ${currentTier.maxUsers} user limit`    : 'unlimited users',  icon: '👤' },
                { label: 'Next billing',    value: '01 Jul',                        sub: '2026 · auto-renews',    icon: '📅' },
              ] as const).map(s => (
                <div key={s.label} style={{ background: '#fff', borderRadius: 12, border: '1px solid var(--border)', padding: '16px 18px', boxShadow: CARD_SHADOW }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--ink3)', textTransform: 'uppercase', letterSpacing: 0.8 }}>{s.label}</span>
                    <span style={{ fontSize: 16 }}>{s.icon}</span>
                  </div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--ink)', letterSpacing: '-0.5px', lineHeight: 1 }}>{s.value}</div>
                  <div style={{ fontSize: 11, color: 'var(--ink3)', marginTop: 4 }}>{s.sub}</div>
                </div>
              ))}
            </div>

            {/* Current plan hero + payment */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 18, marginBottom: 18 }}>
              {/* Hero */}
              <div style={{ background: `linear-gradient(135deg, ${currentTier.color} 0%, ${currentTier.color}cc 100%)`, borderRadius: 16, padding: '26px 28px', color: '#fff', position: 'relative', overflow: 'hidden', boxShadow: `0 8px 28px ${currentTier.color}55` }}>
                <div style={{ position: 'absolute', right: -30, top: -30, width: 180, height: 180, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
                <div style={{ position: 'absolute', right: 50, bottom: -50, width: 140, height: 140, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />
                <div style={{ position: 'relative', zIndex: 1 }}>
                  <div style={{ fontSize: 9, opacity: 0.7, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 6, fontWeight: 600 }}>Platform subscription</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                    <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.8px', lineHeight: 1 }}>{currentTier.name}</div>
                    {currentTier.highlight && <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: 'rgba(255,255,255,0.25)', border: '1px solid rgba(255,255,255,0.4)', letterSpacing: 0.5 }}>★ MOST POPULAR</span>}
                  </div>
                  <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 18 }}>{currentTier.tagline}</div>

                  {/* Billing formula */}
                  <div style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 10, padding: '12px 16px', marginBottom: 18 }}>
                    <div style={{ fontSize: 9, opacity: 0.7, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, fontWeight: 600 }}>Monthly billing formula</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 24, fontWeight: 800, lineHeight: 1 }}>{vehicleCount}</div>
                        <div style={{ fontSize: 9, opacity: 0.7, marginTop: 2 }}>vehicles</div>
                      </div>
                      <div style={{ fontSize: 18, opacity: 0.5 }}>×</div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 24, fontWeight: 800, lineHeight: 1 }}>${currentTier.ratePerVehicle}</div>
                        <div style={{ fontSize: 9, opacity: 0.7, marginTop: 2 }}>per vehicle/mo</div>
                      </div>
                      <div style={{ fontSize: 18, opacity: 0.5 }}>=</div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 30, fontWeight: 900, lineHeight: 1, letterSpacing: '-0.5px' }}>${monthlyBill.toLocaleString()}</div>
                        <div style={{ fontSize: 9, opacity: 0.7, marginTop: 2 }}>/ month</div>
                      </div>
                    </div>
                  </div>

                  {/* Tier ladder */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 18 }}>
                    {PLATFORM_TIERS.map((t, i) => (
                      <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 10, fontWeight: 700, background: i === currentTierIdx ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.15)', color: i === currentTierIdx ? currentTier.color : 'rgba(255,255,255,0.8)', border: i === currentTierIdx ? 'none' : '1px solid rgba(255,255,255,0.2)' }}>{t.name}</span>
                        {i < PLATFORM_TIERS.length - 1 && <span style={{ fontSize: 10, opacity: 0.35 }}>›</span>}
                      </div>
                    ))}
                  </div>

                  <div style={{ display: 'flex', gap: 10 }}>
                    <button style={{ padding: '8px 18px', background: 'rgba(255,255,255,0.18)', color: '#fff', border: '1px solid rgba(255,255,255,0.35)', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Manage subscription</button>
                    {nextTier && <button style={{ padding: '8px 18px', background: 'rgba(255,255,255,0.95)', color: currentTier.color, border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Upgrade to {nextTier.name} ›</button>}
                  </div>
                </div>
              </div>

              {/* Payment + SLA */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ background: '#fff', borderRadius: 14, padding: '20px 22px', border: '1px solid var(--border)', boxShadow: CARD_SHADOW, flex: 1, display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink)' }}>Payment method</div>
                  <div style={{ background: 'linear-gradient(135deg, #1e3a5f 0%, #2d5a8e 100%)', borderRadius: 10, padding: '14px 18px', color: '#fff' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                      <span style={{ fontSize: 10, opacity: 0.7, fontWeight: 600 }}>VISA</span>
                      <span style={{ fontSize: 10, opacity: 0.6 }}>Expires 09/27</span>
                    </div>
                    <div style={{ fontSize: 13, letterSpacing: 3, fontWeight: 600, marginBottom: 6 }}>•••• •••• •••• 4242</div>
                    <div style={{ fontSize: 10, opacity: 0.7 }}>Fleet Operations</div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button style={{ flex: 1, padding: '8px 12px', background: '#f8fafc', border: '1px solid var(--border)', borderRadius: 7, fontSize: 11, fontWeight: 600, cursor: 'pointer', color: 'var(--ink2)' }}>Update card</button>
                    <button style={{ flex: 1, padding: '8px 12px', background: '#f8fafc', border: '1px solid var(--border)', borderRadius: 7, fontSize: 11, fontWeight: 600, cursor: 'pointer', color: 'var(--ink2)' }}>Billing info</button>
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--ink3)', display: 'flex', alignItems: 'center', gap: 5 }}>🔒 Payments secured by Stripe</div>
                </div>
                <div style={{ background: '#fff', borderRadius: 12, padding: '14px 18px', border: '1px solid var(--border)', boxShadow: CARD_SHADOW, display: 'flex', gap: 14 }}>
                  <div style={{ flex: 1, borderRight: '1px solid var(--border)', paddingRight: 14 }}>
                    <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--ink3)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 }}>Uptime SLA</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: currentTier.color }}>{currentTier.sla}</div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--ink3)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 }}>Support</div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink)', lineHeight: 1.3 }}>{currentTier.support}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Platform tier comparison */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)', marginBottom: 2 }}>Platform Subscription Tiers</div>
                <div style={{ fontSize: 11, color: 'var(--ink3)' }}>Billed monthly per active vehicle · switch anytime</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                {PLATFORM_TIERS.map((tier, idx) => {
                  const isCurrent = tier.id === currentTier.id;
                  const isUpgrade = idx > currentTierIdx;
                  return (
                    <div key={tier.id} style={{ background: '#fff', borderRadius: 14, border: isCurrent ? `2px solid ${tier.color}` : '1px solid var(--border)', boxShadow: isCurrent ? `0 4px 16px ${tier.color}28` : CARD_SHADOW, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                      <div style={{ height: 3, background: tier.color }} />
                      <div style={{ padding: '16px 16px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
                          <div>
                            {tier.highlight && <div style={{ marginBottom: 5 }}><span style={{ fontSize: 8, fontWeight: 700, padding: '2px 7px', borderRadius: 10, background: tier.color, color: '#fff', letterSpacing: 0.5 }}>★ POPULAR</span></div>}
                            <div style={{ fontSize: 13, fontWeight: 700, color: isCurrent ? tier.color : 'var(--ink)' }}>{tier.name}</div>
                            <div style={{ fontSize: 10, color: 'var(--ink3)', marginTop: 2, lineHeight: 1.4 }}>{tier.tagline}</div>
                          </div>
                          {isCurrent && <span style={{ fontSize: 8, fontWeight: 700, padding: '2px 7px', borderRadius: 10, background: tier.color + '18', color: tier.color, border: `1px solid ${tier.color}40`, whiteSpace: 'nowrap' }}>CURRENT</span>}
                        </div>
                        {/* price block */}
                        <div style={{ padding: '10px 12px', background: tier.color + '08', borderRadius: 8, border: `1px solid ${tier.color}18`, marginBottom: 12 }}>
                          <div style={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
                            <span style={{ fontSize: 11, color: tier.color, fontWeight: 600, paddingBottom: 4 }}>$</span>
                            <span style={{ fontSize: 28, fontWeight: 900, color: tier.color, letterSpacing: '-1px', lineHeight: 1 }}>{tier.ratePerVehicle}</span>
                            <span style={{ fontSize: 10, color: 'var(--ink3)', marginLeft: 3 }}>/vehicle/mo</span>
                          </div>
                          {isCurrent && <div style={{ fontSize: 10, color: tier.color, marginTop: 4, fontWeight: 600 }}>{vehicleCount} vehicles = ${monthlyBill.toLocaleString()}/mo</div>}
                        </div>
                        {/* limits */}
                        <div style={{ display: 'flex', gap: 5, marginBottom: 12, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 9, padding: '2px 7px', borderRadius: 5, background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0', fontWeight: 600 }}>
                            {tier.maxVehicles ? `≤ ${tier.maxVehicles} vehicles` : '∞ vehicles'}
                          </span>
                          <span style={{ fontSize: 9, padding: '2px 7px', borderRadius: 5, background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0', fontWeight: 600 }}>
                            {tier.maxUsers ? `≤ ${tier.maxUsers} users` : '∞ users'}
                          </span>
                        </div>
                        {/* features */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 12 }}>
                          {TIER_FEATURES.slice(0, 8).map(f => {
                            const on = tier.features[f.key];
                            return (
                              <div key={f.key} style={{ display: 'flex', alignItems: 'center', gap: 6, opacity: on ? 1 : 0.28 }}>
                                <span style={{ fontSize: 9, width: 14, textAlign: 'center', flexShrink: 0, color: on ? tier.color : '#9ca3af', fontWeight: 700 }}>{on ? '✓' : '—'}</span>
                                <span style={{ fontSize: 10, color: on ? 'var(--ink2)' : 'var(--ink3)', fontWeight: on ? 500 : 400 }}>{f.icon} {f.label}</span>
                              </div>
                            );
                          })}
                          {TIER_FEATURES.slice(8).some(f => tier.features[f.key]) && (
                            <div style={{ fontSize: 9, color: tier.color, fontWeight: 700, marginTop: 2 }}>
                              + {TIER_FEATURES.slice(8).filter(f => tier.features[f.key]).map(f => f.label).join(', ')}
                            </div>
                          )}
                        </div>
                        {/* SLA / retention badges */}
                        <div style={{ display: 'flex', gap: 5, marginBottom: 14, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 9, padding: '2px 7px', borderRadius: 5, background: tier.color + '10', color: tier.color, border: `1px solid ${tier.color}25`, fontWeight: 700 }}>SLA {tier.sla}</span>
                          <span style={{ fontSize: 9, padding: '2px 7px', borderRadius: 5, background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0', fontWeight: 500 }}>{tier.dataRetentionDays ? `${tier.dataRetentionDays}d data` : '∞ data'}</span>
                          <span style={{ fontSize: 9, padding: '2px 7px', borderRadius: 5, background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0', fontWeight: 500 }}>{tier.support}</span>
                        </div>
                        <button style={{ width: '100%', padding: '8px 12px', borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: isCurrent ? 'default' : 'pointer', background: isCurrent ? tier.color + '12' : isUpgrade ? tier.color : 'transparent', color: isCurrent ? tier.color : isUpgrade ? '#fff' : 'var(--ink3)', border: isCurrent ? `1px solid ${tier.color}30` : isUpgrade ? 'none' : '1px solid var(--border)', transition: 'all 0.15s' }}>
                          {isCurrent ? 'Current plan' : isUpgrade ? `Upgrade to ${tier.name}` : `Downgrade to ${tier.name}`}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Usage meters */}
            <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 14, padding: '20px 24px', boxShadow: CARD_SHADOW, marginBottom: 18 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)', marginBottom: 18 }}>Usage · this billing period</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                {USAGE_METERS.map(u => (
                  <UsageBar key={u.label} label={u.label} used={u.used} limit={u.limit} unit={u.unit} color={currentTier.color} />
                ))}
              </div>
            </div>

            {/* Invoice history */}
            <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden', boxShadow: CARD_SHADOW }}>
              <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>Invoice history</div>
                <button style={{ padding: '5px 12px', background: '#f8fafc', border: '1px solid var(--border)', borderRadius: 7, fontSize: 11, fontWeight: 600, cursor: 'pointer', color: 'var(--ink2)' }}>Download all</button>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#fafaf9' }}>
                    {['Invoice', 'Date', 'Vehicles billed', 'Rate', 'Amount', 'Status', ''].map(h => (
                      <th key={h} style={{ padding: '9px 14px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: 'var(--ink3)', textTransform: 'uppercase', letterSpacing: 0.7, borderBottom: '1px solid var(--border)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {INVOICES_GEN.map((inv, i) => (
                    <tr key={inv.id} style={{ borderBottom: i < INVOICES_GEN.length - 1 ? '1px solid #f5f2ee' : 'none' }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#fafaf9')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                      <td style={{ padding: '11px 14px', fontSize: 11, color: 'var(--ink3)', fontFamily: 'monospace', fontWeight: 600 }}>{inv.id}</td>
                      <td style={{ padding: '11px 14px', fontSize: 12, color: 'var(--ink2)' }}>{inv.date}</td>
                      <td style={{ padding: '11px 14px', fontSize: 12, color: 'var(--ink)' }}>{inv.vehicles} vehicles</td>
                      <td style={{ padding: '11px 14px', fontSize: 12, color: 'var(--ink3)' }}>${inv.rate}/vehicle/mo</td>
                      <td style={{ padding: '11px 14px', fontSize: 13, color: 'var(--ink)', fontWeight: 700 }}>${inv.amount.toLocaleString()}</td>
                      <td style={{ padding: '11px 14px' }}>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 10, background: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0' }}>✓ Paid</span>
                      </td>
                      <td style={{ padding: '11px 14px' }}>
                        <button style={{ padding: '4px 10px', fontSize: 11, borderRadius: 6, cursor: 'pointer', border: '1px solid var(--border)', background: 'transparent', color: 'var(--ink2)', fontWeight: 500 }}>PDF</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        );
      })()}

      {/* ── PLANS TAB ──────────────────────────────────────────────────── */}
      {activeTab === 'plans' && isSuperAdmin && <SuperAdminPlansTab />}

      {activeTab === 'plans' && !isSuperAdmin && (
        <>
          {/* Standard packages */}
          <div style={{ marginBottom: 36 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)', marginBottom: 3 }}>
                  Standard Packages
                </div>
                <div style={{ fontSize: 11, color: 'var(--ink3)' }}>
                  {canTogglePackages
                    ? 'Enable or disable platform packages available to your fleet'
                    : 'Built-in plans available to all tenants · read-only reference'}
                </div>
              </div>
              {canTogglePackages && (
                <div style={{ fontSize: 10, color: 'var(--ink3)', display: 'flex', alignItems: 'center', gap: 5 }}>
                  💡 Disabled packages cannot be assigned to vehicles
                </div>
              )}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
              {PLAN_ORDER.map(name => (
                <StandardPackageCard
                  key={name}
                  name={name}
                  tenantId={tenantId}
                  canToggle={canTogglePackages}
                  onToggle={() => handleToggleStandardPlan(name)}
                />
              ))}
            </div>
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: 'var(--border)', marginBottom: 28 }} />

          {/* Custom plans */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 16, gap: 12, flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)', marginBottom: 3 }}>
                  Custom Plans
                </div>
                <div style={{ fontSize: 11, color: 'var(--ink3)' }}>
                  Tenant-specific plans with configurable services and pricing
                </div>
              </div>

              <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                {/* Filter pills */}
                <div style={{
                  display: 'flex', gap: 4, background: '#f0ece6',
                  borderRadius: 10, padding: '3px 4px',
                }}>
                  {(['all', 'active', 'draft', 'archived'] as const).map(f => (
                    <button key={f} onClick={() => setFilter(f)} style={{
                      padding: '5px 12px', borderRadius: 7, fontSize: 11,
                      fontWeight: filter === f ? 700 : 500, cursor: 'pointer',
                      background: filter === f ? '#fff' : 'transparent',
                      color: filter === f ? 'var(--ink)' : 'var(--ink3)',
                      border: 'none',
                      boxShadow: filter === f ? CARD_SHADOW : 'none',
                      transition: 'all 0.15s',
                    }}>
                      {f.charAt(0).toUpperCase() + f.slice(1)}
                      <span style={{ marginLeft: 4, fontSize: 9, opacity: 0.75 }}>
                        {f === 'all' ? plans.length : plans.filter(p => p.status === f).length}
                      </span>
                    </button>
                  ))}
                </div>

                {canEdit && (
                  <button onClick={() => setBuilder({ mode: 'create' })} style={{
                    padding: '8px 18px', background: '#c4912a', color: '#fff',
                    border: 'none', borderRadius: 9, fontSize: 12, fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    boxShadow: '0 2px 8px rgba(13,110,94,0.25)',
                  }}>
                    + Create plan
                  </button>
                )}
              </div>
            </div>

            {filteredPlans.length === 0 ? (
              <div style={{
                padding: '60px 24px', textAlign: 'center',
                background: '#fff', borderRadius: 14,
                border: '1.5px dashed var(--border2)',
                boxShadow: CARD_SHADOW,
              }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>📦</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)', marginBottom: 6 }}>
                  {filter === 'all' ? 'No custom plans yet' : `No ${filter} plans`}
                </div>
                <div style={{ fontSize: 12, color: 'var(--ink3)', marginBottom: 20, maxWidth: 340, margin: '0 auto 20px' }}>
                  Create a custom plan tailored to your fleet's specific needs and pricing structure.
                </div>
                {canEdit && filter === 'all' && (
                  <button onClick={() => setBuilder({ mode: 'create' })} style={{
                    padding: '10px 24px', background: '#c4912a', color: '#fff',
                    border: 'none', borderRadius: 9, fontSize: 13, fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(13,110,94,0.25)',
                  }}>
                    + Create your first plan
                  </button>
                )}
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))', gap: 16 }}>
                {filteredPlans.map(plan => (
                  <CustomPlanCard
                    key={plan.id}
                    plan={plan}
                    canEdit={canEdit}
                    onEdit={() => setBuilder({ mode: 'edit', plan })}
                    onDuplicate={() => handleDuplicate(plan)}
                    onArchive={() => handleArchive(plan.id)}
                    onDelete={() => handleDelete(plan.id)}
                    onSetDefault={() => handleSetDefault(plan.id)}
                  />
                ))}
                {canEdit && (
                  <button onClick={() => setBuilder({ mode: 'create' })} style={{
                    borderRadius: 14, border: '1.5px dashed var(--border2)',
                    background: 'transparent', cursor: 'pointer',
                    padding: '28px 24px', textAlign: 'center',
                    color: 'var(--ink3)',
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center', gap: 10,
                    minHeight: 160,
                    transition: 'background 0.15s, border-color 0.15s',
                  }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = '#faf8f5';
                      e.currentTarget.style.borderColor = '#c4912a';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.borderColor = 'var(--border2)';
                    }}>
                    <span style={{
                      width: 36, height: 36, borderRadius: '50%',
                      background: 'rgba(196,145,42,0.12)', color: '#c4912a',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 20, fontWeight: 700,
                    }}>+</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink3)' }}>
                      Create custom plan
                    </span>
                  </button>
                )}
              </div>
            )}
          </div>
        </>
      )}

      {/* ── REPORTS TAB ────────────────────────────────────────────────── */}
      {activeTab === 'reports' && (() => {
        const vehicles     = getVehiclesByTenant(tenantId);
        const customPlans  = getCustomPlans(tenantId);
        const allSubs      = getAllSubscriptions();

        /* Build rows: one per vehicle that belongs to this tenant and has a sub */
        interface ReportRow {
          vehicleId:   string;
          plate:       string;
          planLabel:   string;
          planColor:   string;
          price:       number;
          currency:    string;
          expiryDate:  string;   // YYYY-MM-DD
          expiryMonth: string;   // YYYY-MM
          autoRenew:   boolean;
          daysLeft:    number;
          status:      'expired' | 'expiring' | 'active';
        }

        const vehicleIds = new Set(vehicles.map(v => v.id));
        const rows: ReportRow[] = [];

        for (const sub of allSubs) {
          if (!vehicleIds.has(sub.vehicleId)) continue;
          const v = vehicles.find(v => v.id === sub.vehicleId);
          if (!v) continue;

          const cp        = sub.customPlanId ? (customPlans.find(p => p.id === sub.customPlanId) ?? null) : null;
          const planLabel = cp ? cp.name : sub.plan;
          const planColor = cp ? cp.color : PLANS[sub.plan].color;
          const price     = cp ? cp.price : PLANS[sub.plan].price;
          const currency  = cp ? cp.currency : 'USD';

          const today     = new Date('2026-05-28');
          const expiry    = new Date(sub.expiryDate);
          const daysLeft  = Math.ceil((expiry.getTime() - today.getTime()) / 86_400_000);
          const status: ReportRow['status'] = daysLeft < 0 ? 'expired' : daysLeft <= 30 ? 'expiring' : 'active';

          rows.push({
            vehicleId:   sub.vehicleId,
            plate:       v.plate,
            planLabel, planColor, price, currency,
            expiryDate:  sub.expiryDate,
            expiryMonth: sub.expiryDate.slice(0, 7),
            autoRenew:   sub.autoRenew,
            daysLeft, status,
          });
        }

        /* Group by expiry month — build a full Jan-Dec 2026 calendar */
        const MONTHS_2026 = Array.from({ length: 12 }, (_, i) => {
          const m = String(i + 1).padStart(2, '0');
          return `2026-${m}`;
        });

        const byMonth: Record<string, ReportRow[]> = {};
        for (const r of rows) {
          if (!byMonth[r.expiryMonth]) byMonth[r.expiryMonth] = [];
          byMonth[r.expiryMonth].push(r);
        }

        /* Annual summary totals */
        const totalExpiring = rows.filter(r => r.status !== 'active').length;
        const totalRows     = rows.length;

        /* Helper: display currency symbol */
        function sym(code: string) { return currencySymbol(code); }

        /* Month label helper */
        function monthLabel(ym: string) {
          const [y, m] = ym.split('-');
          return new Date(Number(y), Number(m) - 1).toLocaleString('en-GB', { month: 'long', year: 'numeric' });
        }

        return (
          <div>
            {/* Summary header */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 24 }}>
              {([
                { label: 'Total subscriptions',    value: String(totalRows),                    sub: 'vehicles with active subs',                icon: '📋' },
                { label: 'Expiring / Expired',     value: String(totalExpiring),                sub: 'requiring attention',                      icon: '⚠️' },
                { label: 'Active auto-renewals',   value: String(rows.filter(r => r.autoRenew).length), sub: 'will renew automatically',          icon: '🔄' },
              ] as const).map(s => (
                <div key={s.label} style={{ background: '#fff', borderRadius: 12, border: '1px solid var(--border)', padding: '16px 18px', boxShadow: CARD_SHADOW }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--ink3)', textTransform: 'uppercase', letterSpacing: 0.8 }}>{s.label}</span>
                    <span style={{ fontSize: 16 }}>{s.icon}</span>
                  </div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--ink)', letterSpacing: '-0.5px', lineHeight: 1 }}>{s.value}</div>
                  <div style={{ fontSize: 11, color: 'var(--ink3)', marginTop: 4 }}>{s.sub}</div>
                </div>
              ))}
            </div>

            {/* Month-by-month calendar */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {MONTHS_2026.map(ym => {
                const monthRows = byMonth[ym] ?? [];
                const expCnt    = monthRows.filter(r => r.status !== 'active').length;
                const hasAlert  = expCnt > 0;

                return (
                  <div key={ym} style={{
                    background: '#fff', border: `1px solid ${hasAlert ? '#fde68a' : 'var(--border)'}`,
                    borderRadius: 12, overflow: 'hidden', boxShadow: CARD_SHADOW,
                  }}>
                    {/* Month header */}
                    <div style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '13px 18px',
                      background: hasAlert ? '#fffbeb' : '#fafaf9',
                      borderBottom: monthRows.length > 0 ? '1px solid #f0ece6' : 'none',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>{monthLabel(ym)}</span>
                        {monthRows.length > 0 && (
                          <span style={{
                            fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10,
                            background: hasAlert ? '#fef3c7' : '#f0f4f8',
                            color: hasAlert ? '#92400e' : '#4b5f7c',
                            border: `1px solid ${hasAlert ? '#fde68a' : '#dde4ee'}`,
                          }}>
                            {monthRows.length} subscription{monthRows.length !== 1 ? 's' : ''} expiring
                          </span>
                        )}
                        {expCnt > 0 && (
                          <span style={{
                            fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10,
                            background: '#fef2f2', color: '#991b1b', border: '1px solid #fca5a5',
                          }}>
                            {expCnt} urgent
                          </span>
                        )}
                      </div>
                      {monthRows.length === 0 && (
                        <span style={{ fontSize: 11, color: 'var(--ink3)' }}>No expirations</span>
                      )}
                    </div>

                    {/* Table rows */}
                    {monthRows.length > 0 && (
                      <div>
                        {/* Column headers */}
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: '2fr 2fr 80px 90px 80px 80px',
                          padding: '8px 18px',
                          background: '#f9f9f8',
                          borderBottom: '1px solid #f0ece6',
                        }}>
                          {['Vehicle', 'Plan', 'Price/mo', 'Expiry', 'Auto-renew', 'Status'].map(h => (
                            <span key={h} style={{ fontSize: 9, fontWeight: 700, color: 'var(--ink3)', textTransform: 'uppercase', letterSpacing: 0.7 }}>{h}</span>
                          ))}
                        </div>

                        {monthRows.map((r, ri) => {
                          const statusChip =
                            r.status === 'expired'  ? { bg: '#fef2f2', fg: '#991b1b', border: '#fca5a5', dot: '#ef4444', label: 'Expired' } :
                            r.status === 'expiring' ? { bg: '#fffbeb', fg: '#92400e', border: '#fde68a', dot: '#f59e0b', label: 'Expiring' } :
                                                      { bg: '#ecfdf5', fg: '#065f46', border: '#a7f3d0', dot: '#10b981', label: 'Active' };
                          return (
                            <div
                              key={r.vehicleId}
                              style={{
                                display: 'grid',
                                gridTemplateColumns: '2fr 2fr 80px 90px 80px 80px',
                                padding: '10px 18px',
                                borderBottom: ri < monthRows.length - 1 ? '1px solid #f5f2ee' : 'none',
                                alignItems: 'center',
                              }}
                              onMouseEnter={e => (e.currentTarget.style.background = '#fafaf9')}
                              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>

                              {/* Vehicle plate */}
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{
                                  fontSize: 11, fontWeight: 700, letterSpacing: 0.5,
                                  padding: '3px 8px', borderRadius: 6,
                                  background: '#f0f4f8', color: 'var(--ink)',
                                  border: '1px solid #dde4ee',
                                  fontFamily: 'monospace',
                                }}>{r.plate}</span>
                              </div>

                              {/* Plan */}
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <span style={{ width: 8, height: 8, borderRadius: '50%', background: r.planColor, flexShrink: 0 }} />
                                <span style={{ fontSize: 12, color: 'var(--ink)', fontWeight: 500 }}>{r.planLabel}</span>
                              </div>

                              {/* Price */}
                              <span style={{ fontSize: 12, color: 'var(--ink)', fontWeight: 600 }}>
                                {sym(r.currency)}{r.price.toLocaleString()}
                                <span style={{ fontSize: 9, color: 'var(--ink3)', fontWeight: 400, marginLeft: 2 }}>{r.currency !== 'USD' ? r.currency : ''}</span>
                              </span>

                              {/* Expiry */}
                              <span style={{ fontSize: 11, color: r.status !== 'active' ? '#b45309' : 'var(--ink3)' }}>
                                {r.expiryDate}
                                {r.daysLeft >= 0 && (
                                  <span style={{ display: 'block', fontSize: 9, color: r.daysLeft <= 30 ? '#b45309' : 'var(--ink3)', marginTop: 1 }}>
                                    {r.daysLeft}d left
                                  </span>
                                )}
                              </span>

                              {/* Auto-renew */}
                              <span style={{ fontSize: 11, color: r.autoRenew ? '#059669' : 'var(--ink3)' }}>
                                {r.autoRenew ? '🔄 On' : '— Off'}
                              </span>

                              {/* Status chip */}
                              <span style={{
                                display: 'inline-flex', alignItems: 'center', gap: 4,
                                fontSize: 9, fontWeight: 700, padding: '3px 8px', borderRadius: 20,
                                background: statusChip.bg, color: statusChip.fg,
                                border: `1px solid ${statusChip.border}`,
                                whiteSpace: 'nowrap',
                              }}>
                                <span style={{ width: 5, height: 5, borderRadius: '50%', background: statusChip.dot }} />
                                {statusChip.label}
                              </span>
                            </div>
                          );
                        })}

                        {/* Monthly subtotal */}
                        <div style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
                          padding: '8px 18px',
                          background: '#f9f9f8',
                          borderTop: '1px solid #f0ece6',
                          gap: 16,
                        }}>
                          <span style={{ fontSize: 10, color: 'var(--ink3)', fontWeight: 600 }}>
                            {monthRows.length} subscription{monthRows.length !== 1 ? 's' : ''} expiring this month
                          </span>
                          {(() => {
                            /* Group subtotals by currency */
                            const byCurrency: Record<string, number> = {};
                            for (const r of monthRows) {
                              byCurrency[r.currency] = (byCurrency[r.currency] ?? 0) + r.price;
                            }
                            return Object.entries(byCurrency).map(([code, total]) => (
                              <span key={code} style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink)' }}>
                                {sym(code)}{total.toLocaleString()} {code !== 'USD' ? code : ''}
                              </span>
                            ));
                          })()}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {rows.length === 0 && (
              <div style={{
                padding: '80px 24px', textAlign: 'center',
                background: '#fff', borderRadius: 14,
                border: '1.5px dashed var(--border2)', boxShadow: CARD_SHADOW,
                marginTop: 24,
              }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)', marginBottom: 6 }}>No subscription data</div>
                <div style={{ fontSize: 12, color: 'var(--ink3)' }}>
                  Assign subscriptions to vehicles to see the annual billing report.
                </div>
              </div>
            )}
          </div>
        );
      })()}

      {/* Plan builder modal */}
      {builder && (
        <PlanBuilderModal
          tenantId={tenantId}
          existing={builder.mode === 'edit' ? builder.plan : builder.base}
          onClose={() => setBuilder(null)}
          onSaved={() => { refresh(); setBuilder(null); }}
        />
      )}
    </div>
  );
}
