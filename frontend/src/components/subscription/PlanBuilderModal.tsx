'use client';
import { useState } from 'react';
import {
  SERVICES, PLAN_ORDER, CustomPlanDef, ServiceKey, ServiceLimits,
  saveCustomPlan, genPlanId, currencySymbol,
} from '@/lib/subscriptions';

/* ── constants ────────────────────────────────────────────────────────── */
const CATEGORY_ORDER = ['Connectivity','Tracking','Alerts','Control','Analytics','Integration'] as const;

const COLOR_SWATCHES = [
  '#2563eb','#7c3aed','#c4912a','#d97706','#dc2626',
  '#16a34a','#0891b2','#9333ea','#6b7280','#1d4ed8',
];

const SMS_OPTS:    Array<number | 'unlimited'> = [20, 50, 100, 250, 500, 'unlimited'];
const GPS_OPTS:    Array<60|30|15|5>           = [60, 30, 15, 5];
const HIST_OPTS:   Array<30|90|365|730>        = [30, 90, 365, 730];
const API_OPTS:    Array<number | 'unlimited'> = [10000, 50000, 100000, 500000, 'unlimited'];
const RPT_OPTS:    Array<number | 'unlimited'> = [5, 10, 20, 50, 'unlimited'];

function fmtNum(n: number | 'unlimited', unit = ''): string {
  if (n === 'unlimited') return 'Unlimited';
  if (n >= 1000) return `${(n/1000).toFixed(0)}k${unit}`;
  return `${n}${unit}`;
}

/* ── props ────────────────────────────────────────────────────────────── */
interface Props {
  tenantId:  string;
  existing?: CustomPlanDef;   // undefined → create mode
  onClose:   () => void;
  onSaved:   (plan: CustomPlanDef) => void;
}

/* ── component ────────────────────────────────────────────────────────── */
export function PlanBuilderModal({ tenantId, existing, onClose, onSaved }: Props) {
  const isEdit = !!existing;

  /* ── form state ────────────────────────────────────────────────────── */
  const [name,      setName]      = useState(existing?.name      ?? '');
  const [tagline,   setTagline]   = useState(existing?.tagline   ?? '');
  const [price,     setPrice]     = useState(String(existing?.price ?? 49));
  const [currency,  setCurrency]  = useState(existing?.currency  ?? 'USD');
  const [color,     setColor]     = useState(existing?.color     ?? '#2563eb');
  const [highlight, setHighlight] = useState(existing?.highlight ?? false);
  const [isDefault, setDefault]   = useState(existing?.isDefault ?? false);
  const [status,    setStatus]    = useState<'draft'|'active'>(existing?.status === 'active' ? 'active' : 'draft');
  const [services,  setServices]  = useState<Set<ServiceKey>>(new Set(existing?.services ?? []));
  const [limits,    setLimits]    = useState<ServiceLimits>(existing?.limits ?? {
    smsPerMonth: 100, gpsRefreshSec: 30, routeHistoryDays: 90,
    apiCallsPerMonth: 'unlimited', reportsPerMonth: 20,
  });
  const [saving,    setSaving]    = useState(false);
  const [errors,    setErrors]    = useState<string[]>([]);

  /* ── helpers ────────────────────────────────────────────────────────── */
  function toggleService(key: ServiceKey) {
    setServices(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }

  function setLimit<K extends keyof ServiceLimits>(k: K, v: ServiceLimits[K]) {
    setLimits(prev => ({ ...prev, [k]: v }));
  }

  function validate(): string[] {
    const errs: string[] = [];
    if (!name.trim())            errs.push('Plan name is required.');
    if (!tagline.trim())         errs.push('Tagline is required.');
    const p = parseFloat(price);
    if (isNaN(p) || p < 1)      errs.push(`Price must be at least ${currencySymbol(currency)}1/mo.`);
    if (services.size === 0)     errs.push('Select at least one service.');
    return errs;
  }

  function handleSave(saveStatus: 'draft' | 'active') {
    const errs = validate();
    if (errs.length) { setErrors(errs); return; }
    setSaving(true);
    setTimeout(() => {
      const plan: CustomPlanDef = {
        id:           existing?.id ?? genPlanId(),
        tenantId,
        name:         name.trim(),
        tagline:      tagline.trim(),
        price:        parseFloat(price),
        currency,
        color,
        highlight,
        services:     Array.from(services),
        limits,
        status:       saveStatus,
        isDefault,
        vehicleCount: existing?.vehicleCount ?? 0,
        createdAt:    existing?.createdAt ?? '2026-05-28',
        updatedAt:    '2026-05-28',
      };
      saveCustomPlan(plan);
      setSaving(false);
      onSaved(plan);
      onClose();
    }, 600);
  }

  /* ── shared styles ──────────────────────────────────────────────────── */
  const inp: React.CSSProperties = {
    width: '100%', padding: '8px 10px', border: '1px solid var(--border2)',
    borderRadius: 6, fontSize: 12, color: 'var(--ink)', background: '#fff',
    boxSizing: 'border-box',
  };
  const lbl: React.CSSProperties = {
    fontSize: 10, fontWeight: 600, color: 'var(--ink3)',
    display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5,
  };
  const sel: React.CSSProperties = {
    padding: '4px 6px', fontSize: 11, borderRadius: 5,
    border: '1px solid var(--border2)', background: '#fff', cursor: 'pointer',
    color: 'var(--ink)', flexShrink: 0,
  };

  /* ── preview pill ───────────────────────────────────────────────────── */
  const previewPrice = parseFloat(price) || 0;
  const svcCount     = services.size;

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1400,
    }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>

      <div style={{
        background: '#fff', borderRadius: 14,
        width: 'min(980px, 97vw)', height: 'min(760px, 95vh)',
        display: 'flex', flexDirection: 'column',
        boxShadow: '0 12px 48px rgba(0,0,0,0.22)',
        overflow: 'hidden',
      }}>

        {/* ── Header ────────────────────────────────────────────────── */}
        <div style={{
          padding: '14px 20px', borderBottom: '1px solid var(--border)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: 'var(--cream)', flexShrink: 0,
        }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)' }}>
              {isEdit ? `✏️ Edit: ${existing.name}` : '📦 Create subscription plan'}
            </div>
            <div style={{ fontSize: 11, color: 'var(--ink3)', marginTop: 2 }}>
              Configure services, limits and pricing for this tenant plan
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--ink3)', padding: '4px 8px' }}>✕</button>
        </div>

        {/* ── Body: two columns ─────────────────────────────────────── */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

          {/* LEFT — basic info */}
          <div style={{
            width: 300, flexShrink: 0, borderRight: '1px solid var(--border)',
            overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 16,
          }}>

            {/* Plan name */}
            <div>
              <label style={lbl}>Plan name *</label>
              <input style={inp} value={name} onChange={e => setName(e.target.value)} placeholder="e.g. ACME Fleet Plus" />
            </div>

            {/* Tagline */}
            <div>
              <label style={lbl}>Tagline *</label>
              <input style={inp} value={tagline} onChange={e => setTagline(e.target.value)} placeholder="Short description for customers" />
            </div>

            {/* Currency */}
            <div>
              <label style={lbl}>Currency</label>
              <select style={{ ...inp, cursor: 'pointer' }} value={currency} onChange={e => setCurrency(e.target.value)}>
                <option value="USD">USD — US Dollar ($)</option>
                <option value="PKR">PKR — Pakistani Rupee (Rs.)</option>
                <option value="KES">KES — Kenyan Shilling (KSh)</option>
                <option value="UGX">UGX — Ugandan Shilling (USh)</option>
                <option value="TZS">TZS — Tanzanian Shilling (TSh)</option>
                <option value="EUR">EUR — Euro (€)</option>
                <option value="GBP">GBP — British Pound (£)</option>
              </select>
            </div>

            {/* Price */}
            <div>
              <label style={lbl}>Price ({currency} / vehicle / month) *</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 11, color: 'var(--ink3)', fontWeight: 600 }}>{currencySymbol(currency)}</span>
                <input
                  style={{ ...inp, paddingLeft: currency === 'PKR' ? 30 : 22 }} type="number" min="1" step="1"
                  value={price} onChange={e => setPrice(e.target.value)}
                />
              </div>
            </div>

            {/* Color */}
            <div>
              <label style={lbl}>Plan colour</label>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {COLOR_SWATCHES.map(c => (
                  <button key={c} onClick={() => setColor(c)} style={{
                    width: 26, height: 26, borderRadius: 6, background: c, border: 'none', cursor: 'pointer',
                    outline: color === c ? `3px solid ${c}` : '3px solid transparent',
                    outlineOffset: 2,
                  }} />
                ))}
                <input type="color" value={color} onChange={e => setColor(e.target.value)}
                  style={{ width: 26, height: 26, padding: 1, border: '1px solid var(--border2)', borderRadius: 6, cursor: 'pointer' }}
                />
              </div>
            </div>

            {/* Toggles */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {([
                { label: 'Mark as recommended', value: highlight, set: setHighlight, desc: 'Shows "POPULAR" badge' },
                { label: 'Default for new vehicles', value: isDefault, set: setDefault, desc: 'Auto-assigned on registration' },
              ] as { label: string; value: boolean; set: (v: boolean) => void; desc: string }[]).map(t => (
                <div key={t.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--ink)' }}>{t.label}</div>
                    <div style={{ fontSize: 10, color: 'var(--ink3)' }}>{t.desc}</div>
                  </div>
                  <button
                    onClick={() => t.set(!t.value)}
                    style={{
                      width: 40, height: 22, borderRadius: 11, border: 'none', cursor: 'pointer',
                      background: t.value ? '#c4912a' : '#d1d5db',
                      position: 'relative', flexShrink: 0, transition: 'background 0.2s',
                    }}
                  >
                    <div style={{
                      position: 'absolute', top: 3, left: t.value ? 21 : 3,
                      width: 16, height: 16, borderRadius: '50%', background: '#fff',
                      transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                    }} />
                  </button>
                </div>
              ))}
            </div>

            {/* Plan preview */}
            <div style={{ marginTop: 4, padding: 14, borderRadius: 10, border: `2px solid ${color}50`, background: color + '08' }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--ink3)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 }}>Preview</div>
              {highlight && (
                <div style={{ display: 'inline-block', fontSize: 8, fontWeight: 700, padding: '1px 6px', borderRadius: 3, background: color, color: '#fff', marginBottom: 4 }}>POPULAR</div>
              )}
              <div style={{ fontSize: 15, fontWeight: 800, color }}>
                {name || 'Plan name'}
              </div>
              <div style={{ fontSize: 11, color: 'var(--ink3)', margin: '3px 0 8px', lineHeight: 1.4 }}>
                {tagline || 'Your tagline here'}
              </div>
              <div style={{ fontSize: 18, fontWeight: 700, color }}>
                {currencySymbol(currency)}{previewPrice ? previewPrice.toLocaleString() : '—'}<span style={{ fontSize: 10, fontWeight: 400, color: 'var(--ink3)' }}>/mo</span>
              </div>
              <div style={{ fontSize: 10, color: 'var(--ink3)', marginTop: 4 }}>{svcCount} service{svcCount !== 1 ? 's' : ''} included</div>
            </div>

            {/* Validation errors */}
            {errors.length > 0 && (
              <div style={{ padding: '10px 12px', background: 'var(--red-lt)', border: '1px solid var(--red)', borderRadius: 8 }}>
                {errors.map(e => (
                  <div key={e} style={{ fontSize: 11, color: 'var(--red)', marginBottom: 2 }}>• {e}</div>
                ))}
              </div>
            )}
          </div>

          {/* RIGHT — services & limits */}
          <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink)', marginBottom: 14 }}>
              Services &amp; Limits
              <span style={{ fontSize: 10, fontWeight: 400, color: 'var(--ink3)', marginLeft: 8 }}>
                {svcCount} selected · Configurable limits shown inline
              </span>
            </div>

            {CATEGORY_ORDER.map(cat => {
              const catSvcs = SERVICES.filter(s => s.category === cat);
              return (
                <div key={cat} style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.9, color: 'var(--ink3)', marginBottom: 8, paddingBottom: 4, borderBottom: '1px solid var(--border)' }}>
                    {cat}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {catSvcs.map(svc => {
                      const checked = services.has(svc.key);
                      return (
                        <div key={svc.key} style={{
                          display: 'flex', alignItems: 'flex-start', gap: 10,
                          padding: '10px 12px', borderRadius: 8,
                          background: checked ? color + '08' : 'var(--cream)',
                          border: `1px solid ${checked ? color + '40' : 'var(--border)'}`,
                          cursor: 'pointer',
                          transition: 'all 0.15s',
                        }} onClick={() => toggleService(svc.key)}>

                          {/* checkbox */}
                          <div style={{
                            width: 18, height: 18, borderRadius: 4, flexShrink: 0, marginTop: 1,
                            background: checked ? color : '#fff',
                            border: `2px solid ${checked ? color : '#d1d5db'}`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            transition: 'all 0.15s',
                          }}>
                            {checked && <span style={{ color: '#fff', fontSize: 11, fontWeight: 700, lineHeight: 1 }}>✓</span>}
                          </div>

                          {/* icon + info */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                              <span style={{ fontSize: 14 }}>{svc.icon}</span>
                              <span style={{ fontSize: 12, fontWeight: 600, color: checked ? 'var(--ink)' : 'var(--ink3)' }}>{svc.label}</span>
                              {/* Limit selector — inline, only when checked */}
                              {checked && svc.key === 'sms_alert' && (
                                <select style={sel} value={limits.smsPerMonth ?? 100}
                                  onClick={e => e.stopPropagation()}
                                  onChange={e => { e.stopPropagation(); setLimit('smsPerMonth', e.target.value === 'unlimited' ? 'unlimited' : Number(e.target.value) as ServiceLimits['smsPerMonth']); }}>
                                  {SMS_OPTS.map(o => <option key={String(o)} value={String(o)}>{fmtNum(o)} SMS/mo</option>)}
                                </select>
                              )}
                              {checked && svc.key === 'live_tracking' && (
                                <select style={sel} value={limits.gpsRefreshSec ?? 30}
                                  onClick={e => e.stopPropagation()}
                                  onChange={e => { e.stopPropagation(); setLimit('gpsRefreshSec', Number(e.target.value) as ServiceLimits['gpsRefreshSec']); }}>
                                  {GPS_OPTS.map(o => <option key={o} value={o}>{o}s refresh</option>)}
                                </select>
                              )}
                              {checked && svc.key === 'route_playback' && (
                                <select style={sel} value={limits.routeHistoryDays ?? 90}
                                  onClick={e => e.stopPropagation()}
                                  onChange={e => { e.stopPropagation(); setLimit('routeHistoryDays', Number(e.target.value) as ServiceLimits['routeHistoryDays']); }}>
                                  {HIST_OPTS.map(o => <option key={o} value={o}>{o === 730 ? '2 years' : o === 365 ? '1 year' : `${o} days`} history</option>)}
                                </select>
                              )}
                              {checked && svc.key === 'api_access' && (
                                <select style={sel} value={String(limits.apiCallsPerMonth ?? 'unlimited')}
                                  onClick={e => e.stopPropagation()}
                                  onChange={e => { e.stopPropagation(); setLimit('apiCallsPerMonth', e.target.value === 'unlimited' ? 'unlimited' : Number(e.target.value)); }}>
                                  {API_OPTS.map(o => <option key={String(o)} value={String(o)}>{fmtNum(o)} API calls/mo</option>)}
                                </select>
                              )}
                              {checked && svc.key === 'reports' && (
                                <select style={sel} value={String(limits.reportsPerMonth ?? 20)}
                                  onClick={e => e.stopPropagation()}
                                  onChange={e => { e.stopPropagation(); setLimit('reportsPerMonth', e.target.value === 'unlimited' ? 'unlimited' : Number(e.target.value)); }}>
                                  {RPT_OPTS.map(o => <option key={String(o)} value={String(o)}>{fmtNum(o)} reports/mo</option>)}
                                </select>
                              )}
                            </div>
                            <div style={{ fontSize: 10, color: 'var(--ink3)', marginTop: 2 }}>{svc.description}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Footer ────────────────────────────────────────────────── */}
        <div style={{
          padding: '12px 20px', borderTop: '1px solid var(--border)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: 'var(--cream)', flexShrink: 0,
        }}>
          <button onClick={onClose} style={{
            padding: '8px 18px', background: '#fff', color: 'var(--ink3)',
            border: '1px solid var(--border2)', borderRadius: 7, fontSize: 12, cursor: 'pointer',
          }}>Cancel</button>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => handleSave('draft')} disabled={saving} style={{
              padding: '8px 18px', background: '#fff', color: 'var(--ink2)',
              border: '1px solid var(--border2)', borderRadius: 7, fontSize: 12,
              cursor: saving ? 'not-allowed' : 'pointer', fontWeight: 500,
            }}>
              {saving ? '…' : '💾 Save as draft'}
            </button>
            <button onClick={() => handleSave('active')} disabled={saving} style={{
              padding: '8px 22px', background: color, color: '#fff',
              border: 'none', borderRadius: 7, fontSize: 12, fontWeight: 700,
              cursor: saving ? 'not-allowed' : 'pointer',
            }}>
              {saving ? '…' : isEdit ? '✓ Update plan' : '🚀 Publish plan'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
