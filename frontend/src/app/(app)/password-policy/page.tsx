'use client';

import { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useConfigStore, PasswordPolicy, DEFAULT_PASSWORD_POLICY } from '@/store/configStore';

function Slider({
  label, value, min, max, unit, onChange, disabled,
}: {
  label: string; value: number; min: number; max: number; unit: string;
  onChange: (v: number) => void; disabled?: boolean;
}) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: 13, fontWeight: 500 }}>{label}</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: '#c4912a' }}>
          {value === 0 ? 'Never' : `${value} ${unit}`}
        </span>
      </div>
      <input
        type="range" min={min} max={max} value={value}
        onChange={e => onChange(Number(e.target.value))}
        disabled={disabled}
        style={{ width: '100%', accentColor: '#c4912a' }}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--ink3)', marginTop: 2 }}>
        <span>{min === 0 ? 'Never' : `${min} ${unit}`}</span>
        <span>{max} {unit}</span>
      </div>
    </div>
  );
}

function Toggle({ label, desc, checked, onChange, disabled }: {
  label: string; desc: string; checked: boolean; onChange: () => void; disabled?: boolean;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 500 }}>{label}</div>
        <div style={{ fontSize: 11, color: 'var(--ink3)', marginTop: 2 }}>{desc}</div>
      </div>
      <div
        onClick={disabled ? undefined : onChange}
        style={{
          width: 40, height: 22, borderRadius: 11, flexShrink: 0,
          background: checked ? '#c4912a' : 'var(--border2)',
          cursor: disabled ? 'default' : 'pointer',
          position: 'relative', transition: 'background 0.2s',
          opacity: disabled ? 0.6 : 1,
        }}
      >
        <div style={{
          position: 'absolute', top: 3, left: checked ? 21 : 3,
          width: 16, height: 16, borderRadius: '50%', background: '#fff',
          transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
        }} />
      </div>
    </div>
  );
}

function StrengthMeter({ policy }: { policy: PasswordPolicy }) {
  const checks = [
    policy.minLength >= 12,
    policy.requireUppercase,
    policy.requireLowercase,
    policy.requireNumbers,
    policy.requireSpecial,
    policy.maxAgeDays > 0 && policy.maxAgeDays <= 90,
    policy.lockoutAttempts <= 5,
    policy.mfaRequiredForAdmins,
  ];
  const score = checks.filter(Boolean).length;
  const pct   = (score / checks.length) * 100;
  const label = pct >= 87 ? 'Very strong' : pct >= 62 ? 'Strong' : pct >= 37 ? 'Moderate' : 'Weak';
  const color = pct >= 87 ? '#16a34a' : pct >= 62 ? '#0891b2' : pct >= 37 ? '#ca8a04' : '#dc2626';

  return (
    <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 10, padding: '16px 18px', marginBottom: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <span style={{ fontSize: 13, fontWeight: 600 }}>Policy strength</span>
        <span style={{ fontSize: 12, fontWeight: 700, color }}>{label}</span>
      </div>
      <div style={{ height: 8, background: 'var(--cream3)', borderRadius: 4 }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 4, transition: 'all 0.3s' }} />
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 12 }}>
        {[
          { label: 'Length ≥ 12',         ok: checks[0] },
          { label: 'Uppercase',            ok: checks[1] },
          { label: 'Lowercase',            ok: checks[2] },
          { label: 'Numbers',              ok: checks[3] },
          { label: 'Special chars',        ok: checks[4] },
          { label: 'Password rotation',    ok: checks[5] },
          { label: 'Account lockout',      ok: checks[6] },
          { label: 'Admin MFA',            ok: checks[7] },
        ].map(c => (
          <span key={c.label} style={{
            fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 5,
            background: c.ok ? '#dcfce7' : '#fee2e2',
            color: c.ok ? '#16a34a' : '#dc2626',
          }}>
            {c.ok ? '✓' : '✗'} {c.label}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function PasswordPolicyPage() {
  const { user } = useAuthStore();
  const config   = useConfigStore();

  const isSuperAdmin = user?.role === 'super_admin';
  const [local, setLocal] = useState<PasswordPolicy>({ ...config.passwordPolicy });
  const [saved, setSaved]  = useState(false);

  const isDirty = JSON.stringify(local) !== JSON.stringify(config.passwordPolicy);

  function upd<K extends keyof PasswordPolicy>(key: K, val: PasswordPolicy[K]) {
    setLocal(p => ({ ...p, [key]: val }));
    setSaved(false);
  }

  function handleSave() {
    config.updatePasswordPolicy(local);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  function handleReset() {
    setLocal({ ...DEFAULT_PASSWORD_POLICY });
    setSaved(false);
  }

  const ro = !isSuperAdmin;

  return (
    <div className="page-in" style={{ padding: '14px 18px' }}>

      {/* ── Hero ───────────────────────────────────────────────────── */}
      <div style={{
        background: 'linear-gradient(135deg, var(--hero-s) 0%, var(--hero-m) 55%, var(--hero-e) 100%)',
        border: '1px solid rgba(196,145,42,0.18)',
        borderRadius: 14, padding: '20px 24px', marginBottom: 20,
        boxShadow: '0 4px 24px rgba(13,27,42,0.50), inset 0 1px 0 rgba(196,145,42,0.15)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(196,145,42,0.15)', border: '1px solid rgba(196,145,42,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <i className="ti ti-lock-password" style={{ fontSize: 22, color: '#f5d07a' }} />
          </div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase', color: 'rgba(245,208,122,0.7)', marginBottom: 2 }}>Security &amp; Auth</div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: '#fff', margin: 0 }}>Password Policy</h1>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>Global policy enforced across all tenants · super_admin only</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ display: 'flex', gap: 0 }}>
            {[
              { label: 'Min Length',  value: `${local.minLength}` },
              { label: 'Max Age',     value: local.maxAgeDays === 0 ? '∞' : `${local.maxAgeDays}d` },
              { label: 'Lockout',     value: `${local.lockoutAttempts}x` },
            ].map((s, i) => (
              <div key={s.label} style={{ textAlign: 'center', padding: '0 18px', borderLeft: i > 0 ? '1px solid rgba(196,145,42,0.20)' : 'none' }}>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#fff' }}>{s.value}</div>
                <div style={{ fontSize: 9, color: 'rgba(245,208,122,0.55)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: 0.5 }}>{s.label}</div>
              </div>
            ))}
          </div>
          {!ro && (
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={handleReset} style={{ padding: '7px 14px', border: '1px solid rgba(196,145,42,0.35)', borderRadius: 6, background: 'rgba(196,145,42,0.08)', cursor: 'pointer', fontSize: 12, color: '#f5d07a', fontWeight: 500 }}>
                Reset defaults
              </button>
              <button
                onClick={handleSave}
                disabled={!isDirty}
                style={{
                  padding: '7px 16px', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 700,
                  background: isDirty ? 'linear-gradient(135deg, #c4912a, #d4a23a)' : 'rgba(255,255,255,0.08)',
                  color: isDirty ? '#0d1b2a' : 'rgba(255,255,255,0.3)',
                  cursor: isDirty ? 'pointer' : 'default',
                }}
              >
                {saved ? '✓ Saved' : 'Save policy'}
              </button>
            </div>
          )}
        </div>
      </div>

      <StrengthMeter policy={local} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>

        {/* Left column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Complexity */}
          <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 10, padding: '18px 20px' }}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>
              <i className="ti ti-lock" style={{ marginRight: 8, color: '#c4912a' }} />
              Complexity rules
            </div>
            <div style={{ fontSize: 11, color: 'var(--ink3)', marginBottom: 14 }}>Applied when users set or reset passwords</div>

            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 500 }}>Minimum length</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#c4912a' }}>{local.minLength} chars</span>
              </div>
              <input type="range" min={6} max={32} value={local.minLength}
                onChange={e => upd('minLength', Number(e.target.value))}
                disabled={ro} style={{ width: '100%', accentColor: '#c4912a' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--ink3)' }}>
                <span>6</span><span>32</span>
              </div>
            </div>

            {[
              { key: 'requireUppercase',  label: 'Require uppercase (A–Z)', desc: 'At least one uppercase letter' },
              { key: 'requireLowercase',  label: 'Require lowercase (a–z)', desc: 'At least one lowercase letter' },
              { key: 'requireNumbers',    label: 'Require numbers (0–9)',    desc: 'At least one digit' },
              { key: 'requireSpecial',    label: 'Require special chars',   desc: '!@#$%^&* etc.' },
            ].map(row => (
              <Toggle
                key={row.key}
                label={row.label}
                desc={row.desc}
                checked={local[row.key as keyof PasswordPolicy] as boolean}
                onChange={() => upd(row.key as keyof PasswordPolicy, !local[row.key as keyof PasswordPolicy] as PasswordPolicy[keyof PasswordPolicy])}
                disabled={ro}
              />
            ))}
          </div>

          {/* MFA */}
          <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 10, padding: '18px 20px' }}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>
              <i className="ti ti-device-mobile" style={{ marginRight: 8, color: '#c4912a' }} />
              Multi-factor authentication
            </div>
            <div style={{ fontSize: 11, color: 'var(--ink3)', marginBottom: 14 }}>Enforce 2FA on login</div>
            <Toggle label="Require MFA for admin roles" desc="fleet_admin, platform_admin, super_admin"
              checked={local.mfaRequiredForAdmins} onChange={() => upd('mfaRequiredForAdmins', !local.mfaRequiredForAdmins)} disabled={ro} />
            <Toggle label="Require MFA for all users" desc="Every role must complete 2FA on login"
              checked={local.mfaRequiredForAll} onChange={() => upd('mfaRequiredForAll', !local.mfaRequiredForAll)} disabled={ro} />
          </div>
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Expiry & rotation */}
          <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 10, padding: '18px 20px' }}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>
              <i className="ti ti-clock-rotate" style={{ marginRight: 8, color: '#d97706' }} />
              Expiry & rotation
            </div>
            <div style={{ fontSize: 11, color: 'var(--ink3)', marginBottom: 14 }}>How long a password stays valid</div>
            <Slider label="Password max age" value={local.maxAgeDays} min={0} max={365} unit="days"
              onChange={v => upd('maxAgeDays', v)} disabled={ro} />
            <Slider label="Prevent password reuse" value={local.preventReuseCount} min={0} max={24} unit="previous"
              onChange={v => upd('preventReuseCount', v)} disabled={ro} />
          </div>

          {/* Account lockout */}
          <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 10, padding: '18px 20px' }}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>
              <i className="ti ti-ban" style={{ marginRight: 8, color: '#dc2626' }} />
              Account lockout
            </div>
            <div style={{ fontSize: 11, color: 'var(--ink3)', marginBottom: 14 }}>Brute-force protection</div>
            <Slider label="Failed attempts before lockout" value={local.lockoutAttempts} min={3} max={20} unit="attempts"
              onChange={v => upd('lockoutAttempts', v)} disabled={ro} />
            <Slider label="Lockout duration" value={local.lockoutDurationMinutes} min={5} max={1440} unit="min"
              onChange={v => upd('lockoutDurationMinutes', v)} disabled={ro} />
          </div>

          {/* Session */}
          <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 10, padding: '18px 20px' }}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>
              <i className="ti ti-logout" style={{ marginRight: 8, color: '#c4912a' }} />
              Session timeout
            </div>
            <div style={{ fontSize: 11, color: 'var(--ink3)', marginBottom: 14 }}>Auto-logout after inactivity</div>
            <Slider label="Idle session timeout" value={local.sessionTimeoutMinutes} min={10} max={1440} unit="min"
              onChange={v => upd('sessionTimeoutMinutes', v)} disabled={ro} />
          </div>
        </div>
      </div>

      {ro && (
        <div style={{ marginTop: 20, background: '#fef3c7', border: '1px solid #fcd34d', borderRadius: 8, padding: '12px 16px', fontSize: 13 }}>
          <i className="ti ti-lock" style={{ marginRight: 8 }} />
          Read-only view — Super Admin access required to modify the global password policy.
        </div>
      )}
    </div>
  );
}
