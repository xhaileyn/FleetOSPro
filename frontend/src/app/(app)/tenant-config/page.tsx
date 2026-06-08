'use client';

import { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useConfigStore, DEFAULT_TENANT_CONFIG, TenantConfig } from '@/store/configStore';

export default function TenantConfigPage() {
  const { user } = useAuthStore();
  const { tenantConfigs, setTenantConfig } = useConfigStore();
  const tenantId = user?.tenantId ?? 'default';

  const stored = tenantConfigs[tenantId] ?? DEFAULT_TENANT_CONFIG;
  const [cfg, setCfg] = useState<TenantConfig>(stored);
  const [saved, setSaved] = useState(false);

  function patch<K extends keyof TenantConfig>(key: K, val: TenantConfig[K]) {
    setCfg(prev => ({ ...prev, [key]: val }));
  }

  function save() {
    setTenantConfig(tenantId, cfg);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const inputSt: React.CSSProperties = {
    padding: '7px 10px', border: '1px solid var(--border)',
    borderRadius: 6, fontSize: 13, color: 'var(--ink)', width: 220,
    background: '#fff',
  };
  const selectSt: React.CSSProperties = { ...inputSt, cursor: 'pointer' };
  const numberSt: React.CSSProperties = { ...inputSt, width: 120 };

  function Row({ label, note, children }: { label: string; note?: string; children: React.ReactNode }) {
    return (
      <div style={{
        display: 'grid', gridTemplateColumns: '220px 1fr', gap: 16,
        padding: '14px 0', borderBottom: '1px solid var(--border)', alignItems: 'center',
      }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)' }}>{label}</div>
          {note && <div style={{ fontSize: 11, color: 'var(--ink3)', marginTop: 2 }}>{note}</div>}
        </div>
        <div>{children}</div>
      </div>
    );
  }

  function Card({ title, children }: { title: string; children: React.ReactNode }) {
    return (
      <div style={{
        background: '#fff', border: '1px solid var(--border)',
        borderRadius: 10, padding: '0 20px', marginBottom: 20,
      }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)', padding: '16px 0 4px' }}>
          {title}
        </div>
        {children}
      </div>
    );
  }

  function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
    return (
      <button
        onClick={() => onChange(!checked)}
        style={{
          width: 40, height: 22, borderRadius: 11,
          background: checked ? '#c4912a' : 'var(--border2, #cbd5e1)',
          border: 'none', cursor: 'pointer', position: 'relative',
          transition: 'background 0.18s', flexShrink: 0,
        }}
      >
        <span style={{
          position: 'absolute', top: 3,
          left: checked ? 20 : 3,
          width: 16, height: 16, borderRadius: '50%',
          background: '#fff',
          transition: 'left 0.18s',
          boxShadow: '0 1px 3px rgba(0,0,0,.2)',
          display: 'block',
        }} />
      </button>
    );
  }

  return (
    <div className="page-in" style={{ padding: '14px 18px' }}>

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <div style={{
        background: 'linear-gradient(135deg, var(--hero-s) 0%, var(--hero-m) 55%, var(--hero-e) 100%)',
        border: '1px solid rgba(196,145,42,0.18)', borderRadius: 14,
        padding: '20px 24px', marginBottom: 20,
        boxShadow: '0 4px 24px rgba(13,27,42,0.50), inset 0 1px 0 rgba(196,145,42,0.15)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(196,145,42,0.15)', border: '1px solid rgba(196,145,42,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <i className="ti ti-adjustments-horizontal" style={{ fontSize: 22, color: '#f5d07a' }} />
          </div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase', color: 'rgba(245,208,122,0.7)', marginBottom: 2 }}>Org Admin</div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: '#fff', margin: 0 }}>System Config</h1>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>Preferences and defaults for your organisation</div>
          </div>
        </div>
        <button onClick={save} style={{ padding: '8px 20px', background: saved ? 'rgba(22,163,74,0.9)' : 'linear-gradient(135deg,#c4912a,#d4a23a)', color: saved ? '#fff' : '#0d1b2a', border: 'none', borderRadius: 7, fontSize: 13, cursor: 'pointer', fontWeight: 700, transition: 'background 0.2s' }}>
          {saved ? '✓ Saved' : 'Save changes'}
        </button>
      </div>

      {/* General */}
      <Card title="General">
        <Row label="Timezone">
          <select value={cfg.timezone} onChange={e => patch('timezone', e.target.value)} style={selectSt}>
            <option value="America/New_York">America/New_York (EST/EDT)</option>
            <option value="America/Chicago">America/Chicago (CST/CDT)</option>
            <option value="America/Denver">America/Denver (MST/MDT)</option>
            <option value="America/Los_Angeles">America/Los_Angeles (PST/PDT)</option>
            <option value="America/Toronto">America/Toronto (ET)</option>
            <option value="Europe/London">Europe/London (GMT/BST)</option>
            <option value="Europe/Berlin">Europe/Berlin (CET/CEST)</option>
            <option value="Europe/Paris">Europe/Paris (CET +1)</option>
            <option value="Australia/Sydney">Australia/Sydney (AEST)</option>
            <option value="Asia/Dubai">Asia/Dubai (GST +4)</option>
            <option value="Asia/Karachi">Asia/Karachi (PKT +5)</option>
            <option value="Asia/Kolkata">Asia/Kolkata (IST +5:30)</option>
            <option value="Asia/Singapore">Asia/Singapore (SGT +8)</option>
            <option value="UTC">UTC</option>
          </select>
        </Row>
        <Row label="Language">
          <select value={cfg.language} onChange={e => patch('language', e.target.value)} style={selectSt}>
            <option value="en">English</option>
            <option value="ur">Urdu (اردو)</option>
            <option value="ar">Arabic (العربية)</option>
            <option value="sw">Swahili</option>
            <option value="fr">French</option>
            <option value="es">Spanish</option>
          </select>
        </Row>
        <Row label="Date format">
          <select value={cfg.dateFormat} onChange={e => patch('dateFormat', e.target.value)} style={selectSt}>
            <option value="DD MMM YYYY">DD MMM YYYY</option>
            <option value="DD/MM/YYYY">DD/MM/YYYY</option>
            <option value="MM/DD/YYYY">MM/DD/YYYY</option>
            <option value="YYYY-MM-DD">YYYY-MM-DD (ISO)</option>
          </select>
        </Row>
        <Row label="Speed units">
          <select value={cfg.speedUnit} onChange={e => patch('speedUnit', e.target.value as 'km/h' | 'mph')} style={selectSt}>
            <option value="km/h">km/h</option>
            <option value="mph">mph</option>
          </select>
        </Row>
        <Row label="Currency">
          <select value={cfg.currency} onChange={e => patch('currency', e.target.value)} style={selectSt}>
            <option value="USD">USD — US Dollar ($)</option>
            <option value="GBP">GBP — British Pound (£)</option>
            <option value="EUR">EUR — Euro (€)</option>
            <option value="CAD">CAD — Canadian Dollar ($)</option>
            <option value="AUD">AUD — Australian Dollar ($)</option>
            <option value="AED">AED — UAE Dirham</option>
            <option value="SGD">SGD — Singapore Dollar</option>
            <option value="INR">INR — Indian Rupee (₹)</option>
            <option value="PKR">PKR — Pakistani Rupee (₨)</option>
            <option value="ZAR">ZAR — South African Rand</option>
            <option value="NGN">NGN — Nigerian Naira</option>
          </select>
        </Row>
      </Card>

      {/* Alert defaults */}
      <Card title="Alert defaults">
        <Row label="Speed alert threshold" note={`Alert fires when vehicle exceeds this speed (${cfg.speedUnit})`}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="number"
              value={cfg.speedAlertThreshold}
              onChange={e => patch('speedAlertThreshold', Number(e.target.value))}
              style={numberSt}
              min={50} max={250}
            />
            <span style={{ fontSize: 12, color: 'var(--ink3)' }}>{cfg.speedUnit}</span>
          </div>
        </Row>
        <Row label="Idle timeout" note="Minutes before an idle alert is triggered">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="number"
              value={cfg.idleTimeoutMinutes}
              onChange={e => patch('idleTimeoutMinutes', Number(e.target.value))}
              style={numberSt}
              min={1} max={120}
            />
            <span style={{ fontSize: 12, color: 'var(--ink3)' }}>min</span>
          </div>
        </Row>
        <Row label="Harsh braking sensitivity" note="Sensitivity for detecting harsh braking events">
          <select
            value={cfg.harshBrakingSensitivity}
            onChange={e => patch('harshBrakingSensitivity', e.target.value as TenantConfig['harshBrakingSensitivity'])}
            style={selectSt}
          >
            <option value="low">Low — fewer alerts</option>
            <option value="medium">Medium — balanced</option>
            <option value="high">High — strict detection</option>
          </select>
        </Row>
        <Row label="Fuel efficiency alert" note="Alert when consumption exceeds this value (L/100 km)">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="number"
              value={cfg.fuelThreshold}
              onChange={e => patch('fuelThreshold', Number(e.target.value))}
              style={numberSt}
              min={1} max={50}
              step={0.5}
            />
            <span style={{ fontSize: 12, color: 'var(--ink3)' }}>L/100km</span>
          </div>
        </Row>
      </Card>

      {/* Notifications */}
      <Card title="Notifications">
        <Row label="Alert email recipients" note="Comma-separated addresses; receives real-time alert emails">
          <input
            type="text"
            value={cfg.alertEmailRecipients}
            onChange={e => patch('alertEmailRecipients', e.target.value)}
            placeholder="ops@yourco.com, fleet@yourco.com"
            style={{ ...inputSt, width: 340 }}
          />
        </Row>
        <Row label="Report email recipients" note="Receives scheduled fleet reports">
          <input
            type="text"
            value={cfg.reportEmailRecipients}
            onChange={e => patch('reportEmailRecipients', e.target.value)}
            placeholder="manager@yourco.com"
            style={{ ...inputSt, width: 340 }}
          />
        </Row>
        <Row label="SMS notifications" note="Send critical alerts via SMS to driver managers">
          <Toggle checked={cfg.smsEnabled} onChange={v => patch('smsEnabled', v)} />
        </Row>
        <Row label="After-hours alerts" note="Continue sending alerts outside business hours (18:00–06:00)">
          <Toggle checked={cfg.afterHoursAlerts} onChange={v => patch('afterHoursAlerts', v)} />
        </Row>
      </Card>

      {/* Data & Reporting */}
      <Card title="Data and reporting">
        <Row label="Default export format" note="File format used when exporting reports">
          <select
            value={cfg.exportFormat}
            onChange={e => patch('exportFormat', e.target.value as TenantConfig['exportFormat'])}
            style={selectSt}
          >
            <option value="excel">Excel (.xlsx)</option>
            <option value="csv">CSV (.csv)</option>
            <option value="pdf">PDF (.pdf)</option>
          </select>
        </Row>
        <Row label="Automatic report schedule" note="How often automated fleet reports are generated">
          <select
            value={cfg.reportSchedule}
            onChange={e => patch('reportSchedule', e.target.value as TenantConfig['reportSchedule'])}
            style={selectSt}
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly (Monday)</option>
            <option value="monthly">Monthly (1st)</option>
          </select>
        </Row>
        <Row label="Report delivery time" note="Time of day reports are generated and emailed">
          <input
            type="time"
            value={cfg.reportTime}
            onChange={e => patch('reportTime', e.target.value)}
            style={{ ...inputSt, width: 120 }}
          />
        </Row>
      </Card>
    </div>
  );
}
