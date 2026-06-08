'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { AuthUser } from '@/lib/types';
import {
  type BrandConfig,
  BRAND_DEFAULTS,
  darkenHex,
  lightenHex,
} from '@/components/BrandingEditor';
import { FleetOSMark } from '@/components/layout/FleetOSMark';

const DEMO_ACCOUNTS = [
  { label: 'Super Admin',        initials: 'SA', email: 'super@fleetosteam.io',       scope: 'Platform-wide',          scopeColor: '#b91c1c', bg: '#fef2f2', tenantId: undefined },
  { label: 'Fleet Admin (ACME)', initials: 'FA', email: 'admin@acme.io',              scope: 'ACME Logistics — full',  scopeColor: '#c4912a', bg: '#fdf6e8', tenantId: '1' },
  { label: 'Dispatcher',         initials: 'DS', email: 'dispatch@acme.io',           scope: 'Routes & map',           scopeColor: '#1d4ed8', bg: '#eff6ff', tenantId: '1' },
  { label: 'Atlantic Admin',     initials: 'AF', email: 'fleet@atlanticfreight.com',  scope: 'Atlantic Freight Inc',   scopeColor: '#1e40af', bg: '#eff6ff', tenantId: '8' },
  { label: 'Meridian Admin',     initials: 'ML', email: 'admin@meridianlogistics.com',scope: 'Meridian Logistics',     scopeColor: '#047857', bg: '#f0fdf4', tenantId: '9' },
  { label: 'BritFleet Admin',    initials: 'BF', email: 'fleet@britfleet.co.uk',      scope: 'BritFleet Solutions',    scopeColor: '#7c3aed', bg: '#ede9fe', tenantId: '10' },
  { label: 'Viewer',             initials: 'RV', email: 'viewer@acme.io',             scope: 'Read-only',              scopeColor: '#64748b', bg: '#f1f5f9', tenantId: '1' },
];

const TENANT_ADMINS = [
  { tenant: 'Atlantic Freight Inc',  email: 'fleet@atlanticfreight.com',      flag: '🇺🇸', plan: 'Enterprise',   planColor: '#1e40af', planBg: '#eff6ff' },
  { tenant: 'Meridian Logistics',    email: 'admin@meridianlogistics.com',    flag: '🇺🇸', plan: 'Professional', planColor: '#047857', planBg: '#f0fdf4' },
  { tenant: 'BritFleet Solutions',   email: 'fleet@britfleet.co.uk',          flag: '🇬🇧', plan: 'Enterprise',   planColor: '#7c3aed', planBg: '#ede9fe' },
  { tenant: 'ACME Logistics',        email: 'admin@acmelogistics.com',        flag: '🇺🇸', plan: 'Enterprise',   planColor: '#c4912a', planBg: '#fdf6e8' },
  { tenant: 'SwiftCargo Ltd',        email: 'admin@swiftcargo.com',           flag: '🇺🇸', plan: 'Professional', planColor: '#1d4ed8', planBg: '#eff6ff' },
  { tenant: 'NextDay Express',       email: 'admin@nextdayexpress.co.uk',     flag: '🇬🇧', plan: 'Starter',      planColor: '#b45309', planBg: '#fffbeb' },
  { tenant: 'PeakFleet Co',          email: 'admin@peakfleet.co.uk',          flag: '🇬🇧', plan: 'Enterprise',   planColor: '#c4912a', planBg: '#fdf6e8' },
  { tenant: 'SwiftDeliver Co',       email: 'admin@swiftdeliver.com',         flag: '🇺🇸', plan: 'Trial',        planColor: '#b45309', planBg: '#fffbeb' },
  { tenant: 'Star Technologies',     email: 'admin@starttech.io',             flag: '🇵🇰', plan: 'Enterprise',   planColor: '#c4912a', planBg: '#fdf6e8' },
  { tenant: 'KAM Transport',         email: 'admin@kamtransport.com',         flag: '🇺🇸', plan: 'Suspended',    planColor: '#b91c1c', planBg: '#fef2f2' },
];

const STAT_TARGETS = [
  { end: 6482, fmt: (n: number) => Math.round(n).toLocaleString(),          label: 'Vehicles tracked' },
  { end: 34,   fmt: (n: number) => String(Math.round(n)),                   label: 'Enterprise tenants' },
  { end: 99.9, fmt: (n: number) => n.toFixed(n >= 99.9 ? 1 : 0) + '%',    label: 'Platform uptime' },
  { end: 94,   fmt: (n: number) => '$' + Math.round(n) + 'K',              label: 'Monthly revenue' },
];

const FEATURES = [
  'Real-time GPS tracking across 6 global regions',
  'RBAC · MFA · SSO · FIDO2 passkeys',
  'AI route optimisation & predictive maintenance',
  'Average 28% reduction in operational costs',
];

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0, marginTop: 1 }}>
      <circle cx="7" cy="7" r="7" fill="rgba(255,255,255,0.12)" />
      <path d="M4 7l2 2 4-4" stroke="rgba(255,255,255,0.7)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ── Satellite / GPS / Fleet visual ─────────────────────────────────────── */
function FleetMapVisual() {
  const PINS: [number, number, string, string, number][] = [
    [160, 104, '#c4912a', '3s',   0  ],
    [202,  92, '#34d399', '2.6s', 0.5],
    [238, 108, '#c4912a', '3.3s', 0.3],
    [170, 148, '#60a5fa', '2.8s', 0.8],
    [258, 134, '#c4912a', '3.5s', 0.6],
    [218, 155, '#34d399', '2.4s', 1.1],
  ];
  return (
    <div style={{
      borderRadius: 12, overflow: 'hidden',
      boxShadow: '0 0 0 1px rgba(196,145,42,0.22), 0 8px 32px rgba(0,0,0,0.55)',
      marginBottom: 20,
    }}>
      <svg viewBox="0 0 420 222" xmlns="http://www.w3.org/2000/svg"
        style={{ width: '100%', height: 'auto', display: 'block' }}>
        <defs>
          <radialGradient id="fv-space" cx="50%" cy="55%" r="62%">
            <stop offset="0%" stopColor="#0d2040" />
            <stop offset="100%" stopColor="#040c1c" />
          </radialGradient>
          <radialGradient id="fv-earth" cx="36%" cy="34%" r="70%">
            <stop offset="0%" stopColor="#1e4a90" />
            <stop offset="45%" stopColor="#0d2a58" />
            <stop offset="100%" stopColor="#060e26" />
          </radialGradient>
          <clipPath id="fv-ec">
            <circle cx="210" cy="122" r="88" />
          </clipPath>
          <filter id="fv-glow" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="2.5" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* Space background */}
        <rect width="420" height="222" fill="url(#fv-space)" />

        {/* Static stars */}
        {([
          [15,12,0.5],[42,6,0.7],[68,18,0.4],[102,8,0.6],[138,14,0.5],[175,5,0.8],
          [290,10,0.6],[325,6,0.7],[360,18,0.5],[398,8,0.6],[8,45,0.5],[5,85,0.7],
          [12,120,0.4],[8,156,0.6],[16,190,0.5],[55,208,0.6],[90,215,0.7],[128,210,0.4],
          [165,218,0.5],[252,214,0.6],[295,210,0.5],[335,216,0.7],[372,206,0.5],
          [410,45,0.5],[407,85,0.7],[414,120,0.4],[404,158,0.6],[408,190,0.5],
        ] as [number,number,number][]).map(([x,y,op],i) => (
          <circle key={i} cx={x} cy={y} r={op > 0.65 ? 1.1 : 0.7} fill="#fff" opacity={op} />
        ))}

        {/* Twinkling stars */}
        {([
          [22,32,'#c8deff','2.8s'],[392,62,'#c8deff','3.5s'],
          [48,200,'#ffd090','2.2s'],[382,196,'#ffd090','4s'],
        ] as [number,number,string,string][]).map(([x,y,c,d],i) => (
          <circle key={i} cx={x} cy={y} r={1.4} fill={c} opacity={0.7}>
            <animate attributeName="opacity" values="0.7;0.15;0.7" dur={d} repeatCount="indefinite" />
          </circle>
        ))}

        {/* Atmosphere glow */}
        <circle cx="210" cy="122" r="102" fill="none" stroke="#1850a0" strokeWidth="18" opacity="0.16" />

        {/* Earth */}
        <circle cx="210" cy="122" r="88" fill="url(#fv-earth)" />

        {/* Grid lines on earth */}
        <g clipPath="url(#fv-ec)" stroke="#2a70cc" fill="none" strokeWidth="0.55" opacity="0.30">
          <ellipse cx="210" cy="96"  rx="88" ry="20" />
          <ellipse cx="210" cy="122" rx="88" ry="38" />
          <ellipse cx="210" cy="148" rx="88" ry="20" />
          <line x1="122" y1="122" x2="298" y2="122" />
          <ellipse cx="210" cy="122" rx="20" ry="88" />
          <ellipse cx="210" cy="122" rx="44" ry="88" />
          <ellipse cx="210" cy="122" rx="68" ry="88" />
        </g>

        {/* Continent silhouettes */}
        <g clipPath="url(#fv-ec)" fill="#1e6040" opacity="0.52">
          <path d="M154 93 Q165 86 176 89 L175 107 Q164 115 153 109 Q147 103 150 97 Z" />
          <path d="M178 83 Q187 79 193 83 L191 93 Q185 97 178 93 Z" />
          <path d="M198 89 Q209 84 218 88 L216 101 Q207 105 198 102 Z" />
          <path d="M203 117 Q218 113 226 125 L222 151 Q212 161 203 154 Q196 147 198 134 Z" />
          <path d="M222 86 Q240 81 256 87 L258 101 Q244 111 230 109 Q220 105 221 95 Z" />
          <path d="M256 110 Q272 106 278 116 L276 128 Q264 132 256 126 Z" />
          <path d="M258 148 Q270 144 276 152 L274 162 Q263 166 255 160 Z" />
          <path d="M166 140 Q176 135 182 144 L179 166 Q170 172 163 163 Q158 154 161 147 Z" />
        </g>

        {/* Earth rim highlight */}
        <circle cx="210" cy="122" r="88" fill="none" stroke="#4a88cc" strokeWidth="1.5" opacity="0.38" />

        {/* Orbital rings */}
        <ellipse cx="210" cy="96" rx="142" ry="48" fill="none"
          stroke="rgba(196,145,42,0.30)" strokeWidth="1.2" strokeDasharray="6 4"
          transform="rotate(-8 210 96)" />
        <ellipse cx="210" cy="96" rx="108" ry="30" fill="none"
          stroke="rgba(80,165,255,0.22)" strokeWidth="1" strokeDasharray="5 5"
          transform="rotate(20 210 96)" />

        {/* Vehicle ping pulses */}
        {PINS.map(([x, y, col, dur, delay], i) => (
          <g key={i}>
            <circle cx={x} cy={y} r={3} fill="none" stroke={col} strokeWidth="1.2">
              <animate attributeName="r" values="3;14;3" dur={dur} begin={`${delay}s`} repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.9;0;0.9" dur={dur} begin={`${delay}s`} repeatCount="indefinite" />
            </circle>
            <circle cx={x} cy={y} r={2.8} fill={col} filter="url(#fv-glow)" />
            <circle cx={x} cy={y} r={1.3} fill="#fff" opacity={0.9} />
          </g>
        ))}

        {/* Animated route trace */}
        <path d="M160 104 Q178 82 202 92 Q222 85 238 108 Q248 120 258 134"
          fill="none" stroke="#c4912a" strokeWidth="1.5" strokeDasharray="5 4"
          strokeDashoffset="0" opacity="0.55">
          <animate attributeName="stroke-dashoffset" values="0;-36;0" dur="3.5s" repeatCount="indefinite" />
        </path>

        {/* Satellite 1 — gold, outer orbit */}
        <g filter="url(#fv-glow)">
          <animateMotion dur="14s" repeatCount="indefinite"
            path="M 68 96 A 142 48 0 0 1 352 96 A 142 48 0 0 1 68 96" />
          <rect x="-8" y="-3.5" width="16" height="7" rx="1.5" fill="#c4912a" />
          <rect x="-16" y="-1.5" width="8"  height="3"   rx="0.5" fill="#4a8ce0" opacity="0.9" />
          <rect x="8"   y="-1.5" width="8"  height="3"   rx="0.5" fill="#4a8ce0" opacity="0.9" />
          <circle cx="0" cy="0" r="1.5" fill="#fff" />
        </g>

        {/* Satellite 2 — blue, inner orbit */}
        <g filter="url(#fv-glow)" opacity="0.88">
          <animateMotion dur="10s" repeatCount="indefinite" begin="-4.5s"
            path="M 102 96 A 108 30 0 0 1 318 96 A 108 30 0 0 1 102 96" />
          <rect x="-6"  y="-3"   width="12" height="6"   rx="1"   fill="#60a5fa" />
          <rect x="-13" y="-1.2" width="7"  height="2.5" rx="0.5" fill="#1e40af" opacity="0.9" />
          <rect x="6"   y="-1.2" width="7"  height="2.5" rx="0.5" fill="#1e40af" opacity="0.9" />
          <circle cx="0" cy="0" r="1.2" fill="#fff" />
        </g>

        {/* GPS signal beams */}
        <line x1="160" y1="104" x2="168" y2="66" stroke="#c4912a" strokeWidth="0.8" strokeDasharray="3 3" opacity="0.40" />
        <line x1="238" y1="108" x2="262" y2="72" stroke="#60a5fa" strokeWidth="0.7" strokeDasharray="3 3" opacity="0.32" />

        {/* HUD: Live Tracking */}
        <rect x="10" y="10" width="98" height="38" rx="7"
          fill="rgba(6,14,32,0.92)" stroke="rgba(196,145,42,0.42)" strokeWidth="0.8" />
        <circle cx="22" cy="26" r="3.5" fill="#34d399">
          <animate attributeName="opacity" values="1;0.3;1" dur="1.8s" repeatCount="indefinite" />
        </circle>
        <text x="30" y="21"  fontSize="6"   fill="rgba(245,208,122,0.70)" fontWeight="700" letterSpacing="0.8">LIVE TRACKING</text>
        <text x="30" y="31"  fontSize="10"  fill="#ffffff"                fontWeight="700">247 Vehicles</text>
        <text x="30" y="41"  fontSize="5.8" fill="rgba(255,255,255,0.35)" fontWeight="400">6 global regions</text>

        {/* HUD: GPS Signal */}
        <rect x="310" y="174" width="100" height="38" rx="7"
          fill="rgba(6,14,32,0.92)" stroke="rgba(80,160,255,0.38)" strokeWidth="0.8" />
        <text x="320" y="185" fontSize="6"   fill="rgba(150,195,255,0.70)" fontWeight="700" letterSpacing="0.8">GPS SIGNAL</text>
        <text x="320" y="197" fontSize="10"  fill="#60a5fa"                fontWeight="700">99.8% Uptime</text>
        <text x="320" y="207" fontSize="5.8" fill="rgba(255,255,255,0.32)" fontWeight="400">Latency &lt;35ms avg</text>

        {/* HUD: Fleet Status */}
        <rect x="10" y="174" width="104" height="38" rx="7"
          fill="rgba(6,14,32,0.92)" stroke="rgba(52,211,153,0.38)" strokeWidth="0.8" />
        <text x="20" y="185" fontSize="6"   fill="rgba(100,220,160,0.70)" fontWeight="700" letterSpacing="0.8">FLEET STATUS</text>
        <text x="20" y="197" fontSize="9"   fill="#34d399"                fontWeight="700">All Systems Active</text>
        <text x="20" y="207" fontSize="5.8" fill="rgba(255,255,255,0.32)" fontWeight="400">Uptime 99.9%</text>
      </svg>
    </div>
  );
}

export default function LoginPage() {
  const router          = useRouter();
  const { login }       = useAuthStore();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [tab, setTab]           = useState<'demo' | 'tenants'>('demo');
  const [brand, setBrand]       = useState<BrandConfig>(BRAND_DEFAULTS);
  const [tenantLogos, setTenantLogos] = useState<Record<string, string>>({});
  const [statVals, setStatVals] = useState(STAT_TARGETS.map(() => 0));

  useEffect(() => {
    const duration = 1600;
    const startTs  = Date.now();
    let raf: number;
    const tick = () => {
      const t = Math.min((Date.now() - startTs) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setStatVals(STAT_TARGETS.map(s => s.end * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    try {
      const params   = new URLSearchParams(window.location.search);
      const tenantId = params.get('tenant');
      const key      = tenantId ? `fleetBrand_tenant_${tenantId}` : null;
      const raw      = (key && localStorage.getItem(key)) ?? localStorage.getItem('fleetBrand');
      if (!raw) return;
      const saved: Partial<BrandConfig> = JSON.parse(raw);
      const merged = { ...BRAND_DEFAULTS, ...saved };
      setBrand(merged);
      const root = document.documentElement;
      root.style.setProperty('--teal',    merged.primaryColor);
      root.style.setProperty('--teal-dk', darkenHex(merged.primaryColor, 0.18));
      root.style.setProperty('--teal-lt', lightenHex(merged.primaryColor, 0.88));
      root.style.setProperty('--gold',    merged.accentColor);
      if (merged.fontFamily) document.body.style.fontFamily = merged.fontFamily;
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    try {
      const logos: Record<string, string> = {};
      const ids = [...new Set(DEMO_ACCOUNTS.map(a => a.tenantId).filter(Boolean))] as string[];
      for (const id of ids) {
        const raw = localStorage.getItem(`fleetBrand_tenant_${id}`);
        if (raw) {
          const parsed: Partial<BrandConfig> = JSON.parse(raw);
          if (parsed.logoDataUrl) logos[id] = parsed.logoDataUrl;
        }
      }
      setTenantLogos(logos);
    } catch { /* ignore */ }
  }, []);

  async function doLogin(overrideEmail?: string, overridePw?: string) {
    const finalEmail = overrideEmail ?? email;
    const finalPw    = overridePw   ?? password;
    setError('');
    setLoading(true);
    try {
      const result = await api.auth.login(finalEmail, finalPw) as AuthUser;
      login(result);
      router.push('/dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Invalid credentials.');
    } finally {
      setLoading(false);
    }
  }

  const panelBg = brand.darkTopbar ? '#0d1b2a' : darkenHex(brand.primaryColor, 0.55);

  return (
    <div className="login-root" style={{ fontFamily: 'inherit' }}>
      <style>{`
        .auth-input {
          width: 100%; box-sizing: border-box;
          padding: 0 14px; height: 44px;
          border: 1.5px solid var(--border); border-radius: 8px;
          background: #fff; color: var(--ink);
          font-size: 14px; outline: none; font-family: inherit;
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        .auth-input:focus {
          border-color: #c4912a;
          box-shadow: 0 0 0 3px rgba(196,145,42,0.15);
        }
        .auth-input::placeholder { color: #94a3b8; }
        .auth-btn-primary {
          width: 100%; height: 44px;
          background: linear-gradient(135deg, #0d1b2a 0%, #162033 100%);
          color: #f5d07a;
          border: 1px solid rgba(196,145,42,0.38);
          border-radius: 8px;
          font-size: 14px; font-weight: 600; cursor: pointer;
          font-family: inherit; letter-spacing: 0.1px;
          transition: opacity 0.15s, box-shadow 0.15s;
          display: flex; align-items: center; justify-content: center; gap: 7px;
        }
        .auth-btn-primary:hover:not(:disabled) {
          opacity: 0.92;
          box-shadow: 0 4px 20px rgba(196,145,42,0.32);
        }
        .auth-btn-primary:disabled { opacity: 0.55; cursor: default; }
        .demo-card:hover { border-color: #c4912a !important; box-shadow: 0 0 0 3px rgba(196,145,42,0.14) !important; }
        .tenant-card:hover:not(:disabled) { border-color: #c4912a !important; box-shadow: 0 0 0 3px rgba(196,145,42,0.14) !important; }
        .pw-toggle { background: none; border: none; cursor: pointer; padding: 4px; color: #94a3b8; transition: color 0.12s; }
        .pw-toggle:hover { color: var(--ink2); }

        /* ── Login responsive layout ── */
        .login-root { display: flex; height: 100vh; overflow: hidden; }
        .login-left  { width: 460px; flex-shrink: 0; }
        .login-right { flex: 1; display: flex; flex-direction: column; background: #f8fafc; overflow: hidden; }
        .login-right-grid { flex: 1; display: grid; grid-template-columns: 1fr 1fr; overflow: hidden; }
        .login-form-panel {
          display: flex; flex-direction: column; justify-content: center;
          padding: 40px 48px; background: #fff;
          border-right: 1px solid #e2e8f0; overflow-y: auto;
        }
        .login-qa-panel {
          display: flex; flex-direction: column; overflow: hidden;
          padding: 28px 24px 20px; background: #eef1f6;
        }
        .login-mobile-header { display: none; }

        @media (max-width: 900px) {
          .login-left { width: 360px; }
          .login-form-panel { padding: 32px 32px; }
        }
        @media (max-width: 768px) {
          .login-root { flex-direction: column; height: auto; min-height: 100vh; overflow-y: auto; }
          .login-left  { display: none; }
          .login-right { flex: 1; overflow: visible; }
          .login-right-grid { grid-template-columns: 1fr; overflow: visible; height: auto; }
          .login-form-panel {
            justify-content: flex-start; padding: 28px 24px 24px;
            border-right: none; border-bottom: 1px solid #e2e8f0;
            overflow-y: visible;
          }
          .login-qa-panel { overflow: visible; padding: 20px 16px 24px; max-height: none; }
          .login-mobile-header {
            display: flex; align-items: center; gap: 10px;
            padding: 16px 20px; background: #0d1b2a;
            border-bottom: 1px solid rgba(196,145,42,0.18);
          }
        }
        @media (max-width: 480px) {
          .login-form-panel { padding: 24px 16px 20px; }
          .login-qa-panel { padding: 16px 14px 20px; }
          .login-mobile-header { padding: 14px 16px; }
        }
      `}</style>

      {/* ── Mobile header (logo — visible only on mobile) ─────────── */}
      <div className="login-mobile-header">
        <FleetOSMark size={32} accent={brand.accentColor} />
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 0 }}>
          <span style={{ color: '#fff', fontSize: 16, fontWeight: 700, letterSpacing: '-0.4px' }}>Fleet</span>
          <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 16, fontWeight: 400, letterSpacing: '-0.3px' }}>OS</span>
          <span style={{ marginLeft: 5, fontSize: 9, fontWeight: 800, letterSpacing: '0.8px',
            color: brand.accentColor, border: `1px solid ${brand.accentColor}50`,
            borderRadius: 3, padding: '2px 5px', lineHeight: 1, textTransform: 'uppercase', alignSelf: 'center' }}>Pro</span>
        </div>
      </div>

      {/* ── Left branded panel ─────────────────────────────────────── */}
      <div className="login-left" style={{
        background: panelBg,
        display: 'flex', flexDirection: 'column',
        padding: '28px 32px 28px',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Dot grid texture */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)',
          backgroundSize: '26px 26px',
        }} />
        {/* Subtle brand glow */}
        <div style={{
          position: 'absolute', top: -80, left: -80, width: 380, height: 380,
          borderRadius: '50%', pointerEvents: 'none',
          background: 'radial-gradient(circle, rgba(196,145,42,0.18) 0%, transparent 65%)',
        }} />

        <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
          {/* Logo + brand name */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 22 }}>
            {brand.logoDataUrl ? (
              <div style={{ width: 36, height: 36, borderRadius: 9, overflow: 'hidden', flexShrink: 0,
                background: brand.accentColor, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img src={brand.logoDataUrl} alt="logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              </div>
            ) : (
              <FleetOSMark size={36} accent={brand.accentColor} />
            )}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 0 }}>
              {brand.logoDataUrl || brand.companyName !== BRAND_DEFAULTS.companyName ? (
                <span style={{ color: '#fff', fontSize: 16, fontWeight: 600, letterSpacing: '-0.3px' }}>
                  {brand.companyName.endsWith('+')
                    ? <>{brand.companyName.slice(0, -1)}<span style={{ color: brand.accentColor }}>+</span></>
                    : brand.companyName}
                </span>
              ) : (
                <>
                  <span style={{ color: '#fff', fontSize: 17, fontWeight: 700, letterSpacing: '-0.4px', lineHeight: 1 }}>Fleet</span>
                  <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 17, fontWeight: 400, letterSpacing: '-0.3px', lineHeight: 1 }}>OS</span>
                  <span style={{
                    marginLeft: 6, fontSize: 10, fontWeight: 800, letterSpacing: '0.8px',
                    color: brand.accentColor, border: `1px solid ${brand.accentColor}50`,
                    borderRadius: 3, padding: '2px 5px', lineHeight: 1,
                    textTransform: 'uppercase', alignSelf: 'center',
                  }}>Pro</span>
                </>
              )}
            </div>
          </div>

          {/* Headline */}
          {brand.tagline ? (
            <div style={{ marginBottom: 16 }}>
              <div style={{ color: '#fff', fontSize: 24, fontWeight: 700, lineHeight: 1.3, letterSpacing: '-0.5px', marginBottom: 8 }}>
                {brand.tagline}
              </div>
              <div style={{ color: 'rgba(255,255,255,0.38)', fontSize: 12, lineHeight: 1.7 }}>
                Monitor every vehicle in real time, optimise routes with AI, and cut operational costs — at any scale.
              </div>
            </div>
          ) : (
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <span style={{
                  width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
                  background: '#c4912a',
                  boxShadow: '0 0 8px rgba(196,145,42,0.8), 0 0 20px rgba(196,145,42,0.3)',
                }} />
                <span style={{ fontSize: 8.5, fontWeight: 700, letterSpacing: '2.2px', textTransform: 'uppercase', color: 'rgba(245,208,122,0.55)' }}>
                  Fleet Intelligence Platform
                </span>
              </div>
              <div>
                {['Track every mile.', 'Command every route.'].map(line => (
                  <div key={line} style={{ color: '#fff', fontSize: 26, fontWeight: 800, lineHeight: 1.2, letterSpacing: '-0.7px' }}>
                    {line}
                  </div>
                ))}
                <div style={{
                  fontSize: 26, fontWeight: 800, lineHeight: 1.2, letterSpacing: '-0.7px',
                  background: 'linear-gradient(90deg, #f5d07a 0%, #e8b84b 45%, #c4912a 100%)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                }}>
                  Deliver every promise.
                </div>
              </div>
            </div>
          )}

          {/* ── Satellite / GPS / Vehicle visual ── */}
          <FleetMapVisual />

          {/* Feature list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 9, marginBottom: 'auto' }}>
            {FEATURES.map(f => (
              <div key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 12.5, color: 'rgba(255,255,255,0.52)' }}>
                <CheckIcon /> {f}
              </div>
            ))}
          </div>

          {/* Stats grid */}
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 24px',
            paddingTop: 20, marginTop: 24,
            borderTop: '1px solid rgba(196,145,42,0.18)',
          }}>
            {STAT_TARGETS.map(({ fmt, label }, i) => (
              <div key={label}>
                <div style={{ fontSize: 22, fontWeight: 700, color: '#fff', letterSpacing: '-0.6px', lineHeight: 1 }}>{fmt(statVals[i])}</div>
                <div style={{ fontSize: 9.5, color: 'rgba(245,208,122,0.52)', letterSpacing: '0.7px', textTransform: 'uppercase', marginTop: 3 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right panel ────────────────────────────────────────────── */}
      <div className="login-right">
        <div className="login-right-grid">

          {/* ── Sign-in form ─────────────────────────────────────── */}
          <div className="login-form-panel">
            <div style={{ maxWidth: 340 }}>
              <div style={{ marginBottom: 32 }}>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#0d1b2a', marginBottom: 6, letterSpacing: '-0.5px' }}>
                  Welcome back
                </div>
                <div style={{ fontSize: 14, color: '#64748b' }}>
                  Sign in to your {brand.companyName} account
                </div>
              </div>

              {error && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  background: '#fef2f2', border: '1px solid #fecaca',
                  borderRadius: 8, padding: '10px 13px',
                  fontSize: 13, color: '#b91c1c', marginBottom: 20,
                }}>
                  <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ flexShrink: 0 }}>
                    <circle cx="12" cy="12" r="10" /><path strokeLinecap="round" d="M12 8v4m0 4h.01" />
                  </svg>
                  {error}
                </div>
              )}

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Work email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && doLogin()} placeholder="you@company.com" className="auth-input" />
              </div>

              <div style={{ marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>Password</label>
                  <a href="#" style={{ fontSize: 12, color: '#c4912a', textDecoration: 'none', fontWeight: 500 }}>Forgot password?</a>
                </div>
                <div style={{ position: 'relative' }}>
                  <input type={showPw ? 'text' : 'password'} value={password}
                    onChange={e => setPassword(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && doLogin()}
                    placeholder="Enter your password" className="auth-input" style={{ paddingRight: 44 }} />
                  <button onClick={() => setShowPw(!showPw)} className="pw-toggle"
                    style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)' }}>
                    {showPw ? (
                      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                      </svg>
                    ) : (
                      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <button onClick={() => doLogin()} disabled={loading} className="auth-btn-primary">
                {loading ? (
                  <>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}
                      style={{ animation: 'spin 0.8s linear infinite' }}>
                      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" strokeLinecap="round" />
                    </svg>
                    Signing in…
                  </>
                ) : `Sign in to ${brand.companyName}`}
              </button>
              <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>

              <div style={{ marginTop: 24, textAlign: 'center', fontSize: 13, color: '#64748b' }}>
                Don&apos;t have an account?{' '}
                <a href="/signup" style={{ color: '#c4912a', fontWeight: 600, textDecoration: 'none' }}>Start free trial</a>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, marginTop: 28,
                paddingTop: 20, borderTop: '1px solid #f1f5f9' }}>
                {['SOC 2', 'GDPR', 'ISO 27001'].map(badge => (
                  <div key={badge} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, color: '#94a3b8' }}>
                    <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
                    </svg>
                    {badge}
                  </div>
                ))}
              </div>

              {/* Website link */}
              <div style={{ marginTop: 20, textAlign: 'center' }}>
                <a
                  href="/website/index.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    fontSize: 12, color: '#94a3b8', textDecoration: 'none',
                    fontWeight: 500, transition: 'color 0.15s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#c4912a')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#94a3b8')}
                >
                  <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418" />
                  </svg>
                  Learn about FleetOS Pro →
                </a>
              </div>
            </div>
          </div>

          {/* ── Quick access panel ──────────────────────────────────── */}
          <div className="login-qa-panel">

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <div style={{ width: 3, height: 18, borderRadius: 2, background: '#c4912a' }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: '#0d1b2a', textTransform: 'uppercase', letterSpacing: 1.1 }}>Quick Access</span>
            </div>

            <div style={{ display: 'flex', background: '#d8dde8', borderRadius: 9, padding: 3, marginBottom: 14, gap: 2 }}>
              {(['demo', 'tenants'] as const).map(t => (
                <button key={t} onClick={() => setTab(t)} style={{
                  flex: 1, padding: '8px 0', borderRadius: 7,
                  border: tab === t ? '1px solid rgba(196,145,42,0.30)' : '1px solid transparent',
                  background: tab === t ? '#0d1b2a' : 'transparent',
                  color: tab === t ? '#f5d07a' : '#64748b',
                  fontSize: 12, fontWeight: tab === t ? 700 : 400,
                  cursor: 'pointer', fontFamily: 'inherit',
                  boxShadow: tab === t ? '0 1px 6px rgba(13,27,42,0.22)' : 'none',
                  transition: 'all 0.15s',
                }}>
                  {t === 'demo' ? 'Demo roles' : 'Tenant admins'}
                </button>
              ))}
            </div>

            <div style={{ fontSize: 11, color: '#64748b', marginBottom: 12, lineHeight: 1.5 }}>
              {tab === 'demo'
                ? 'Click any card to sign in instantly — password: Demo1234!'
                : 'Sign in as Fleet Admin for any tenant below'}
            </div>

            {tab === 'demo' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7, overflowY: 'auto' }}>
                {DEMO_ACCOUNTS.map(acc => (
                  <button key={acc.email} onClick={() => doLogin(acc.email, 'Demo1234!')}
                    disabled={loading} className="demo-card"
                    style={{
                      textAlign: 'left', padding: '11px 13px 10px',
                      border: '1.5px solid #e2e8f0', borderRadius: 9,
                      borderLeft: `4px solid ${acc.scopeColor}`,
                      background: '#fff', cursor: loading ? 'default' : 'pointer',
                      fontFamily: 'inherit', transition: 'border-color 0.12s, box-shadow 0.12s',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: 7,
                        background: acc.bg, color: acc.scopeColor,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 9, fontWeight: 800, flexShrink: 0, overflow: 'hidden', letterSpacing: 0.5,
                      }}>
                        {acc.tenantId && tenantLogos[acc.tenantId]
                          ? <img src={tenantLogos[acc.tenantId]} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                          : acc.initials}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#0d1b2a', lineHeight: 1.2 }}>{acc.label}</div>
                        <div style={{ fontSize: 10, fontWeight: 600, color: acc.scopeColor, marginTop: 1 }}>{acc.scope}</div>
                      </div>
                    </div>
                    <div style={{ fontSize: 10, color: '#94a3b8', fontFamily: 'monospace',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {acc.email}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {tab === 'tenants' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7, overflowY: 'auto' }}>
                {TENANT_ADMINS.map(a => (
                  <button key={a.email} onClick={() => doLogin(a.email, 'Demo1234!')}
                    disabled={loading || a.plan === 'Suspended'} className="tenant-card"
                    style={{
                      display: 'flex', flexDirection: 'column', gap: 6,
                      padding: '11px 13px 10px',
                      border: `1.5px solid ${a.plan === 'Suspended' ? '#fecaca' : '#e2e8f0'}`,
                      borderRadius: 9, background: '#fff',
                      cursor: a.plan === 'Suspended' ? 'not-allowed' : 'pointer',
                      fontFamily: 'inherit', textAlign: 'left',
                      opacity: a.plan === 'Suspended' ? 0.5 : 1,
                      transition: 'border-color 0.12s, box-shadow 0.12s',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                        <span style={{ fontSize: 14, flexShrink: 0 }}>{a.flag}</span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#0d1b2a',
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {a.tenant}
                        </span>
                      </div>
                      <span style={{
                        fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 4, flexShrink: 0,
                        background: a.planBg, color: a.planColor, textTransform: 'uppercase', letterSpacing: 0.3,
                      }}>
                        {a.plan}
                      </span>
                    </div>
                    <div style={{ fontSize: 10, color: '#94a3b8', fontFamily: 'monospace',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {a.email}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
