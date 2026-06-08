'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FleetOSMark } from '@/components/layout/FleetOSMark';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { AuthUser } from '@/lib/types';

type Step = 1 | 2 | 3 | 4;
type Plan = 'starter' | 'pro' | 'enterprise';

const STEP_LABELS = ['Account', 'Fleet info', 'Choose plan', 'Review'];

const PLANS: { id: Plan; name: string; price: string; desc: string; highlight?: boolean }[] = [
  { id: 'starter',    name: 'Starter',      price: '$24',  desc: 'per vehicle / mo' },
  { id: 'pro',        name: 'Professional', price: '$18',  desc: 'per vehicle / mo', highlight: true },
  { id: 'enterprise', name: 'Enterprise',   price: 'Custom', desc: 'volume pricing' },
];

const LEFT_FEATURES = [
  '14-day free trial — no credit card required',
  'Onboard in under 10 minutes',
  'GDPR compliant · SOC 2 Type II certified',
  'Cancel anytime · data export always included',
];

function CheckIcon({ color = 'rgba(255,255,255,0.7)' }: { color?: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0, marginTop: 1 }}>
      <circle cx="7" cy="7" r="7" fill="rgba(255,255,255,0.1)" />
      <path d="M4 7l2 2 4-4" stroke={color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function SignupPage() {
  const router    = useRouter();
  const { login } = useAuthStore();

  const [step, setStep]   = useState<Step>(1);
  const [plan, setPlan]   = useState<Plan>('pro');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [form, setForm]   = useState({
    firstName: '', lastName: '', email: '', password: '', confirm: '',
    company: '', industry: '', fleetSize: '', country: '',
  });

  const set = (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm(f => ({ ...f, [k]: e.target.value }));

  function validate1() {
    if (!form.firstName || !form.lastName || !form.email || !form.password) return 'Please fill in all required fields.';
    if (form.password !== form.confirm) return 'Passwords do not match.';
    if (form.password.length < 8) return 'Password must be at least 8 characters.';
    return '';
  }
  function validate2() {
    if (!form.company || !form.industry || !form.fleetSize || !form.country) return 'Please fill in all fields.';
    return '';
  }

  function next() {
    if (step === 1) { const e = validate1(); if (e) { setError(e); return; } }
    if (step === 2) { const e = validate2(); if (e) { setError(e); return; } }
    setError('');
    setStep(s => (s + 1) as Step);
  }

  async function submit() {
    setLoading(true);
    setError('');
    try {
      const result = await api.auth.register({
        firstName: form.firstName, lastName: form.lastName,
        email: form.email, password: form.password,
        companyName: form.company, industry: form.industry,
        fleetSize: form.fleetSize, country: form.country, plan,
      }) as AuthUser;
      login(result);
      router.push('/dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'inherit' }}>
      <style>{`
        .su-input {
          width: 100%; box-sizing: border-box;
          padding: 0 13px; height: 42px;
          border: 1.5px solid #e2e8f0; border-radius: 8px;
          background: #fff; color: #0f172a;
          font-size: 13px; outline: none; font-family: inherit;
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        .su-input:focus { border-color: #c4912a; box-shadow: 0 0 0 3px rgba(196,145,42,0.12); }
        .su-input::placeholder { color: #94a3b8; }
        .su-btn-primary {
          flex: 1; height: 42px; background: #c4912a; color: #fff;
          border: none; border-radius: 8px;
          font-size: 13px; font-weight: 600; cursor: pointer;
          font-family: inherit; transition: opacity 0.15s, box-shadow 0.15s;
          display: flex; align-items: center; justify-content: center; gap: 6px;
        }
        .su-btn-primary:hover:not(:disabled) { opacity: 0.88; box-shadow: 0 4px 14px rgba(13,110,94,0.28); }
        .su-btn-primary:disabled { opacity: 0.6; cursor: default; }
        .su-btn-back {
          height: 42px; padding: 0 16px;
          background: #fff; color: #475569;
          border: 1.5px solid #e2e8f0; border-radius: 8px;
          font-size: 13px; font-weight: 500; cursor: pointer; font-family: inherit;
          transition: border-color 0.12s;
          display: flex; align-items: center; gap: 5px;
        }
        .su-btn-back:hover { border-color: #94a3b8; }
        .plan-card { transition: border-color 0.12s, box-shadow 0.12s; }
        .plan-card:hover { border-color: #c4912a !important; }
      `}</style>

      {/* ── Left panel ──────────────────────────────────────────────── */}
      <div style={{
        width: 400, flexShrink: 0, background: '#0f172a',
        padding: '44px 40px', display: 'flex', flexDirection: 'column',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 1px)',
          backgroundSize: '26px 26px',
        }} />
        <div style={{
          position: 'absolute', top: -60, left: -60, width: 360, height: 360,
          borderRadius: '50%', pointerEvents: 'none',
          background: 'radial-gradient(circle, rgba(13,110,94,0.25) 0%, transparent 65%)',
        }} />

        <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
          {/* Brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 48 }}>
            <FleetOSMark size={38} accent="#c4912a" />
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 0 }}>
              <span style={{ color: '#fff', fontSize: 17, fontWeight: 700, letterSpacing: '-0.4px', lineHeight: 1 }}>Fleet</span>
              <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 17, fontWeight: 400, letterSpacing: '-0.3px', lineHeight: 1 }}>OS</span>
              <span style={{
                marginLeft: 6, fontSize: 10, fontWeight: 800, letterSpacing: '0.8px',
                color: '#c4912a', border: '1px solid rgba(196,145,42,0.4)',
                borderRadius: 3, padding: '2px 5px', lineHeight: 1,
                textTransform: 'uppercase', alignSelf: 'center',
              }}>Pro</span>
            </div>
          </div>

          <div style={{ color: '#fff', fontSize: 26, fontWeight: 700, lineHeight: 1.3, letterSpacing: '-0.5px', marginBottom: 12 }}>
            Start managing your fleet smarter today.
          </div>
          <div style={{ color: 'rgba(255,255,255,0.42)', fontSize: 13, lineHeight: 1.7, marginBottom: 36 }}>
            Join hundreds of fleet operators who have cut costs and improved visibility across their operations.
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 'auto' }}>
            {LEFT_FEATURES.map(f => (
              <div key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 13, color: 'rgba(255,255,255,0.55)' }}>
                <CheckIcon /> {f}
              </div>
            ))}
          </div>

          <div style={{ paddingTop: 24, marginTop: 36, borderTop: '1px solid rgba(255,255,255,0.07)',
            fontSize: 10, color: 'rgba(255,255,255,0.22)', textTransform: 'uppercase', letterSpacing: 1.5, textAlign: 'center' }}>
            Trusted by leading logistics companies
          </div>
        </div>
      </div>

      {/* ── Right panel ──────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '44px 36px', background: '#f8fafc', overflowY: 'auto' }}>
        <div style={{ width: '100%', maxWidth: 400 }}>

          {/* ── Step progress bar ────────────────────────────────── */}
          <div style={{ marginBottom: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 10 }}>
              {STEP_LABELS.map((label, i) => {
                const n = i + 1;
                const done    = step > n;
                const active  = step === n;
                const isLast  = i === STEP_LABELS.length - 1;
                return (
                  <React.Fragment key={n}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: done ? '#c4912a' : active ? '#fff' : '#f1f5f9',
                        border: `2px solid ${done || active ? '#c4912a' : '#e2e8f0'}`,
                        color: done ? '#fff' : active ? '#c4912a' : '#94a3b8',
                        fontSize: 11, fontWeight: 700, transition: 'all 0.2s',
                      }}>
                        {done ? (
                          <svg width="12" height="12" fill="none" viewBox="0 0 14 14">
                            <path d="M3 7l3 3 5-5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        ) : n}
                      </div>
                      <div style={{ fontSize: 9, fontWeight: active ? 700 : 500,
                        color: active ? '#c4912a' : done ? '#475569' : '#94a3b8',
                        textTransform: 'uppercase', letterSpacing: 0.6, whiteSpace: 'nowrap' }}>
                        {label}
                      </div>
                    </div>
                    {!isLast && (
                      <div style={{ flex: 1, height: 2, background: done ? '#c4912a' : '#e2e8f0',
                        margin: '0 6px', marginBottom: 22, transition: 'background 0.2s', minWidth: 16 }} />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          {/* Error banner */}
          {error && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8,
              background: '#fef2f2', border: '1px solid #fecaca',
              borderRadius: 8, padding: '10px 13px', fontSize: 13, color: '#b91c1c', marginBottom: 20 }}>
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ flexShrink: 0 }}>
                <circle cx="12" cy="12" r="10" /><path strokeLinecap="round" d="M12 8v4m0 4h.01" />
              </svg>
              {error}
            </div>
          )}

          {/* ── Step 1: Account ─────────────────────────────────── */}
          {step === 1 && (
            <div>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', letterSpacing: '-0.4px', marginBottom: 4 }}>
                Create your account
              </div>
              <div style={{ fontSize: 13, color: '#64748b', marginBottom: 24 }}>Start your 14-day free trial</div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                <Field label="First name">
                  <input className="su-input" value={form.firstName} onChange={set('firstName')} placeholder="Arif" />
                </Field>
                <Field label="Last name">
                  <input className="su-input" value={form.lastName} onChange={set('lastName')} placeholder="Khan" />
                </Field>
              </div>
              <Field label="Work email" mb={14}>
                <input type="email" className="su-input" value={form.email} onChange={set('email')} placeholder="you@company.com" />
              </Field>
              <Field label="Password" mb={14}>
                <input type="password" className="su-input" value={form.password} onChange={set('password')} placeholder="Minimum 8 characters" />
              </Field>
              <Field label="Confirm password" mb={24}>
                <input type="password" className="su-input" value={form.confirm} onChange={set('confirm')} placeholder="Repeat password" />
              </Field>

              <button onClick={next} className="su-btn-primary" style={{ width: '100%' }}>
                Continue
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                </svg>
              </button>
              <div style={{ marginTop: 18, textAlign: 'center', fontSize: 13, color: '#64748b' }}>
                Already have an account?{' '}
                <a href="/login" style={{ color: '#c4912a', fontWeight: 600, textDecoration: 'none' }}>Sign in</a>
              </div>
            </div>
          )}

          {/* ── Step 2: Fleet info ──────────────────────────────── */}
          {step === 2 && (
            <div>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', letterSpacing: '-0.4px', marginBottom: 4 }}>
                Tell us about your fleet
              </div>
              <div style={{ fontSize: 13, color: '#64748b', marginBottom: 24 }}>
                Help us tailor FleetOS+ to your needs
              </div>

              <Field label="Company name" mb={14}>
                <input className="su-input" value={form.company} onChange={set('company')} placeholder="ACME Logistics Ltd" />
              </Field>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                <Field label="Industry">
                  <select className="su-input" value={form.industry} onChange={set('industry')}>
                    <option value="">Select…</option>
                    {['Logistics', 'Transport', 'Construction', 'Oil and gas', 'Retail', 'Other'].map(i => <option key={i}>{i}</option>)}
                  </select>
                </Field>
                <Field label="Fleet size">
                  <select className="su-input" value={form.fleetSize} onChange={set('fleetSize')}>
                    <option value="">Select…</option>
                    {['1–25', '26–100', '101–500', '500+'].map(s => <option key={s}>{s}</option>)}
                  </select>
                </Field>
              </div>
              <Field label="Country" mb={24}>
                <select className="su-input" value={form.country} onChange={set('country')}>
                  <option value="">Select…</option>
                  {['Pakistan', 'United Kingdom', 'UAE', 'Nigeria', 'Kenya', 'Other'].map(c => <option key={c}>{c}</option>)}
                </select>
              </Field>

              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => { setError(''); setStep(1); }} className="su-btn-back">
                  <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
                  </svg>
                  Back
                </button>
                <button onClick={next} className="su-btn-primary">
                  Continue
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {/* ── Step 3: Plan ────────────────────────────────────── */}
          {step === 3 && (
            <div>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', letterSpacing: '-0.4px', marginBottom: 4 }}>
                Choose your plan
              </div>
              <div style={{ fontSize: 13, color: '#64748b', marginBottom: 24 }}>
                All plans include a 14-day free trial
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
                {PLANS.map(p => {
                  const active = plan === p.id;
                  return (
                    <button
                      key={p.id}
                      onClick={() => setPlan(p.id)}
                      className="plan-card"
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '14px 16px', border: `2px solid ${active ? '#c4912a' : '#e2e8f0'}`,
                        borderRadius: 10, background: active ? 'rgba(196,145,42,0.12)' : '#fff',
                        cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
                        boxShadow: active ? '0 0 0 4px rgba(196,145,42,0.12)' : 'none',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{
                          width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
                          border: `2px solid ${active ? '#c4912a' : '#cbd5e1'}`,
                          background: active ? '#c4912a' : '#fff',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          {active && (
                            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff' }} />
                          )}
                        </div>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 700, color: active ? '#c4912a' : '#0f172a' }}>
                            {p.name}
                            {p.highlight && (
                              <span style={{ marginLeft: 7, fontSize: 9, fontWeight: 700, padding: '2px 6px',
                                borderRadius: 4, background: '#c4912a', color: '#fff',
                                textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                Popular
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: 12, color: '#64748b', marginTop: 1 }}>{p.desc}</div>
                        </div>
                      </div>
                      <div style={{ fontSize: 20, fontWeight: 700, color: active ? '#c4912a' : '#0f172a',
                        letterSpacing: '-0.5px' }}>
                        {p.price}
                      </div>
                    </button>
                  );
                })}
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => { setError(''); setStep(2); }} className="su-btn-back">
                  <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
                  </svg>
                  Back
                </button>
                <button onClick={submit} disabled={loading} className="su-btn-primary">
                  {loading ? (
                    <>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}
                        style={{ animation: 'spin 0.8s linear infinite' }}>
                        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" strokeLinecap="round" />
                      </svg>
                      Creating account…
                    </>
                  ) : (
                    <>
                      Start free trial
                      <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                      </svg>
                    </>
                  )}
                </button>
              </div>
              <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

/* ── Field wrapper ────────────────────────────────────────────────── */
function Field({ label, children, mb = 0 }: { label: string; children: React.ReactNode; mb?: number }) {
  return (
    <div style={{ marginBottom: mb }}>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
        {label}
      </label>
      {children}
    </div>
  );
}
