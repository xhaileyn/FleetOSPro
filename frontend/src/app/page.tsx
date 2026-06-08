'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';

// ── Navigation ──────────────────────────────────────────────────────────────
const NAV = ['Features', 'Platform', 'Security', 'Pricing'];

// ── Platform features (all capabilities from the actual product) ────────────
const FEATURE_GROUPS = [
  {
    group: 'Fleet Intelligence',
    color: '#c4912a',
    icon: 'ti-satellite',
    items: [
      { icon: 'ti-map-pin', title: 'Real-time GPS Tracking', desc: 'Live sub-second position updates for every vehicle across 6 global regions. Custom map layers, cluster views, and satellite imagery.' },
      { icon: 'ti-route', title: 'Trip History & Playback', desc: 'Full route replay for any vehicle and date range. Speed, stop events, and driver behaviour overlaid on the map timeline.' },
      { icon: 'ti-polygon', title: 'Geofencing & Boundary Alerts', desc: 'Draw unlimited zones — circles, polygons, or named regions. Instant entry/exit alerts via SMS, email, or webhook.' },
      { icon: 'ti-user', title: 'Driver Performance Scoring', desc: 'Automatic scoring from telematics: harsh braking, acceleration, idling, and speeding. League tables and coaching reports.' },
      { icon: 'ti-truck', title: 'Vehicle Profile & Health', desc: 'Full vehicle registry with documents, insurance, inspections, and maintenance history. Category-specific dashboards.' },
      { icon: 'ti-shield-off', title: 'Unauthorised Usage Detection', desc: 'Detect and alert on out-of-hours movements, unregistered drivers, and geo-boundary violations in real time.' },
    ],
  },
  {
    group: 'Operations & Cost Control',
    color: '#2563eb',
    icon: 'ti-settings-2',
    items: [
      { icon: 'ti-route-2', title: 'AI Route Optimisation', desc: 'Machine-learning dispatch engine balances distance, time windows, driver hours, and fuel cost to generate optimal multi-stop routes.' },
      { icon: 'ti-tool', title: 'Preventive Maintenance', desc: 'Mileage and time-based service schedules with automatic work-order creation, cost tracking, and downtime forecasting.' },
      { icon: 'ti-building-store', title: 'Customer Management', desc: 'Full CRM for freight customers — delivery SLAs, preferred vehicle classes, contact history, and customer-level reporting.' },
      { icon: 'ti-trending-down', title: 'Fuel & Cost Savings', desc: 'Idle-time analysis, fuel-card reconciliation, and benchmark dashboards show exactly where savings are achievable.' },
      { icon: 'ti-alert-triangle', title: 'Alerts & Notifications', desc: 'Configurable alert rules across speed, geofence, maintenance, fuel, or custom thresholds — delivered to any channel.' },
      { icon: 'ti-device-analytics', title: 'IoT Device Management', desc: 'Provision, configure, and monitor GPS trackers and OBD devices. Remote firmware updates and SIM lifecycle management.' },
    ],
  },
  {
    group: 'Analytics & Reporting',
    color: '#16a34a',
    icon: 'ti-chart-bar',
    items: [
      { icon: 'ti-chart-pie', title: 'Advanced Analytics', desc: 'Interactive dashboards with 30+ KPIs. Custom date ranges, fleet-segment drill-downs, and trend comparisons.' },
      { icon: 'ti-file-analytics', title: '9-Report Suite', desc: 'Fleet utilisation, driver scores, fuel summary, maintenance log, trip reports, cost analysis, compliance, alerts, and revenue reports.' },
      { icon: 'ti-clock', title: 'Scheduled Report Delivery', desc: 'Auto-send daily, weekly, or monthly PDF/Excel/CSV reports to any email recipients with role-based access control.' },
      { icon: 'ti-dashboard', title: 'Executive Dashboard', desc: 'Single-screen KPIs for C-suite: fleet health, opex trends, CO₂ data, and region-level drill-through — all in real time.' },
      { icon: 'ti-activity', title: 'Live Fleet Monitoring', desc: 'Global ops-centre view: all tenants, all regions, live. Traffic overlays, weather alerts, and fleet health heat-maps.' },
      { icon: 'ti-coin', title: 'Cost Savings Tracker', desc: 'Quantifies idling reduction, route shortening, and maintenance avoidance in currency terms — monthly and YTD.' },
    ],
  },
  {
    group: 'Security & Compliance',
    color: '#7c3aed',
    icon: 'ti-shield-lock',
    items: [
      { icon: 'ti-shield-check', title: 'Role-Based Access Control', desc: 'Granular RBAC with Super Admin, Platform Admin, Tenant Admin, Fleet Manager, Dispatcher, Viewer, and unlimited custom roles.' },
      { icon: 'ti-device-mobile', title: 'Multi-Factor Authentication', desc: 'TOTP app, SMS, and email OTP. Enforce MFA for all users or admin roles only — configurable per tenant.' },
      { icon: 'ti-lock', title: 'Password & Session Policy', desc: 'Enforce complexity, rotation periods, history, lockout rules, and idle session timeouts from a single policy panel.' },
      { icon: 'ti-key', title: 'SSO / SAML / FIDO2', desc: 'Single sign-on with SAML 2.0, OIDC, and FIDO2 passkeys. Works with Okta, Azure AD, Google Workspace, and more.' },
      { icon: 'ti-lock-access', title: 'Session Management', desc: 'See every active session per user — device, IP, last activity. Remotely terminate any session instantly.' },
      { icon: 'ti-clipboard-check', title: 'Audit Trail', desc: 'Immutable, timestamped audit log for every config change, login, report export, and command issued — GDPR-ready.' },
    ],
  },
];

const PLATFORM_FEATURES = [
  { icon: 'ti-building', title: 'Multi-Tenant Architecture', desc: 'Full data isolation between tenants. Impersonate any tenant as Super Admin without sharing credentials.' },
  { icon: 'ti-palette', title: 'White-Label Branding', desc: 'Per-tenant logos, colour palettes, fonts, and custom domain — your brand, powered by FleetOS.' },
  { icon: 'ti-plug', title: 'Integration Hub', desc: 'REST API, webhooks, and pre-built connectors for TMS, ERP, fuel-card, and payroll systems.' },
  { icon: 'ti-users-group', title: 'Unlimited Custom Roles', desc: 'Create roles beyond the system defaults — define exactly which modules and reports each role can access.' },
  { icon: 'ti-layout-navbar-expand', title: 'Configurable Navigation', desc: 'Super Admin and Tenant Admin can show or hide any navigation section per role — no code changes required.' },
  { icon: 'ti-server', title: 'Global Infrastructure', desc: '6-region deployment on AWS with 99.9% SLA, automatic failover, real-time health dashboards, and 24/7 NOC.' },
];

const PRICING = [
  {
    name: 'Starter',
    price: '£99',
    period: '/month',
    desc: 'For small fleets getting started with GPS tracking.',
    color: '#64748b',
    features: ['Up to 10 vehicles', 'Real-time GPS tracking', 'Trip history & playback', 'Driver scores', 'Email alerts', '3 report types', 'Standard support'],
    cta: 'Start free trial',
    popular: false,
  },
  {
    name: 'Professional',
    price: '£299',
    period: '/month',
    desc: 'For growing fleets that need AI optimisation and analytics.',
    color: '#c4912a',
    features: ['Up to 50 vehicles', 'Everything in Starter', 'AI route optimisation', 'Geofencing', 'Maintenance schedules', 'Full 9-report suite', 'RBAC + custom roles', 'IoT device management', 'Priority support'],
    cta: 'Start free trial',
    popular: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    desc: 'For enterprises requiring full platform capabilities.',
    color: '#1e40af',
    features: ['Unlimited vehicles', 'Everything in Professional', 'Multi-tenant management', 'White-label branding', 'SSO / SAML / FIDO2', 'MFA enforcement', 'Audit trail', 'Integration hub', 'Dedicated account manager', '99.9% SLA guarantee'],
    cta: 'Contact sales',
    popular: false,
  },
];

const TESTIMONIALS = [
  {
    quote: 'FleetOS cut our fuel costs by 31% in the first quarter. The AI route optimisation alone paid for three years of subscription.',
    name: 'James Whitfield',
    role: 'Head of Logistics, Atlantic Freight Inc',
    initials: 'JW',
    color: '#1e40af',
  },
  {
    quote: 'We replaced four legacy systems with FleetOS. The RBAC and multi-tenant setup was flawless — our ops team went live in under two days.',
    name: 'Priya Sharma',
    role: 'CTO, Meridian Logistics',
    initials: 'PS',
    color: '#16a34a',
  },
  {
    quote: 'The real-time GPS and geofence alerts transformed how we handle after-hours incidents. Response time dropped from hours to minutes.',
    name: 'David McAllister',
    role: 'Fleet Director, BritFleet Solutions',
    initials: 'DM',
    color: '#7c3aed',
  },
];

// ── Hero Globe SVG ─────────────────────────────────────────────────────────
function HeroGlobe() {
  const PINS: [number,number,string,string,number][] = [
    [250,148,'#c4912a','3.2s',0],   [310,128,'#34d399','2.8s',0.4],
    [195,135,'#c4912a','3.5s',0.8], [280,178,'#60a5fa','2.6s',0.2],
    [345,155,'#c4912a','3.0s',1.0], [230,110,'#34d399','2.4s',0.6],
    [360,138,'#f97316','3.3s',1.2], [215,165,'#60a5fa','2.9s',0.9],
  ];
  return (
    <svg viewBox="0 0 560 440" xmlns="http://www.w3.org/2000/svg"
      style={{ width:'100%', height:'auto', display:'block' }}>
      <defs>
        <radialGradient id="hg-space" cx="50%" cy="50%" r="60%">
          <stop offset="0%" stopColor="#0d2245"/>
          <stop offset="100%" stopColor="#03080f"/>
        </radialGradient>
        <radialGradient id="hg-earth" cx="36%" cy="34%" r="70%">
          <stop offset="0%" stopColor="#1e4a90"/>
          <stop offset="45%" stopColor="#0d2a58"/>
          <stop offset="100%" stopColor="#060e26"/>
        </radialGradient>
        <clipPath id="hg-ec"><circle cx="285" cy="224" r="160"/></clipPath>
        <filter id="hg-glow" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="3" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      <rect width="560" height="440" fill="url(#hg-space)"/>

      {/* Stars */}
      {([
        [18,14,0.6],[45,8,0.8],[82,20,0.5],[115,6,0.7],[155,16,0.6],[192,5,0.8],
        [420,12,0.7],[460,5,0.9],[500,20,0.5],[540,10,0.6],[8,55,0.5],[5,100,0.7],
        [10,148,0.5],[6,195,0.7],[15,245,0.5],[12,295,0.6],[8,340,0.7],[20,385,0.5],
        [548,50,0.6],[552,95,0.8],[545,148,0.5],[550,200,0.7],[546,255,0.5],[548,310,0.6],
        [60,420,0.6],[100,432,0.7],[148,426,0.5],[200,438,0.6],[350,435,0.7],[410,428,0.5],
        [465,436,0.6],[510,430,0.7],[38,2,0.7],[78,0,0.5],[120,3,0.6],[165,1,0.8],
      ] as [number,number,number][]).map(([x,y,op],i) => (
        <circle key={i} cx={x} cy={y} r={op>0.65?1.2:0.8} fill="#fff" opacity={op}/>
      ))}

      {/* Twinkling */}
      {([[22,38,'#c8deff','2.8s'],[540,72,'#c8deff','3.6s'],[35,390,'#ffd090','2.3s'],[530,395,'#ffd090','4.1s'],[275,8,'#fff','3.0s']] as [number,number,string,string][]).map(([x,y,c,d],i) => (
        <circle key={i} cx={x} cy={y} r={1.5} fill={c} opacity={0.75}>
          <animate attributeName="opacity" values="0.75;0.15;0.75" dur={d} repeatCount="indefinite"/>
        </circle>
      ))}

      {/* Atmosphere */}
      <circle cx="285" cy="224" r="178" fill="none" stroke="#1850a0" strokeWidth="24" opacity="0.14"/>
      <circle cx="285" cy="224" r="160" fill="url(#hg-earth)"/>

      {/* Grid */}
      <g clipPath="url(#hg-ec)" stroke="#2a70cc" fill="none" strokeWidth="0.6" opacity="0.28">
        <ellipse cx="285" cy="180" rx="160" ry="36"/>
        <ellipse cx="285" cy="224" rx="160" ry="68"/>
        <ellipse cx="285" cy="268" rx="160" ry="36"/>
        <line x1="125" y1="224" x2="445" y2="224"/>
        <ellipse cx="285" cy="224" rx="36" ry="160"/>
        <ellipse cx="285" cy="224" rx="78" ry="160"/>
        <ellipse cx="285" cy="224" rx="122" ry="160"/>
      </g>

      {/* Continents */}
      <g clipPath="url(#hg-ec)" fill="#1e6040" opacity="0.50">
        <path d="M218 152 Q235 143 250 147 L248 175 Q234 186 218 180 Q210 173 213 162 Z"/>
        <path d="M248 137 Q260 131 270 136 L268 150 Q259 155 248 151 Z"/>
        <path d="M270 147 Q288 141 304 147 L302 165 Q288 172 271 169 Z"/>
        <path d="M276 188 Q298 183 308 200 L304 232 Q290 245 277 237 Q268 228 270 212 Z"/>
        <path d="M306 143 Q330 136 350 143 L353 165 Q334 178 312 176 Q300 171 300 158 Z"/>
        <path d="M355 170 Q375 164 382 180 L380 198 Q366 204 356 198 Z"/>
        <path d="M360 218 Q376 213 382 225 L380 240 Q368 246 358 238 Z"/>
        <path d="M230 210 Q245 205 252 218 L249 244 Q238 251 228 241 Q222 232 224 222 Z"/>
        <path d="M200 155 Q212 149 219 153 L217 165 Q208 170 200 165 Z" opacity="0.8"/>
      </g>

      <circle cx="285" cy="224" r="160" fill="none" stroke="#4a88cc" strokeWidth="1.8" opacity="0.38"/>

      {/* Orbital rings */}
      <ellipse cx="285" cy="188" rx="220" ry="72" fill="none"
        stroke="rgba(196,145,42,0.32)" strokeWidth="1.4" strokeDasharray="8 5"
        transform="rotate(-10 285 188)"/>
      <ellipse cx="285" cy="188" rx="178" ry="50" fill="none"
        stroke="rgba(80,165,255,0.22)" strokeWidth="1.2" strokeDasharray="6 6"
        transform="rotate(18 285 188)"/>
      <ellipse cx="285" cy="188" rx="140" ry="35" fill="none"
        stroke="rgba(52,211,153,0.18)" strokeWidth="1" strokeDasharray="5 7"
        transform="rotate(-28 285 188)"/>

      {/* Vehicle pins */}
      {PINS.map(([x,y,col,dur,delay],i) => (
        <g key={i}>
          <circle cx={x} cy={y} r={3} fill="none" stroke={col} strokeWidth="1.2">
            <animate attributeName="r" values="3;18;3" dur={dur} begin={`${delay}s`} repeatCount="indefinite"/>
            <animate attributeName="opacity" values="0.9;0;0.9" dur={dur} begin={`${delay}s`} repeatCount="indefinite"/>
          </circle>
          <circle cx={x} cy={y} r={3.2} fill={col} filter="url(#hg-glow)"/>
          <circle cx={x} cy={y} r={1.5} fill="#fff" opacity={0.92}/>
        </g>
      ))}

      {/* Route traces */}
      <path d="M230 110 Q255 92 310 128 Q335 118 360 138 Q370 148 345 155"
        fill="none" stroke="#c4912a" strokeWidth="1.8" strokeDasharray="6 5" opacity="0.55" strokeDashoffset="0">
        <animate attributeName="stroke-dashoffset" values="0;-44;0" dur="4s" repeatCount="indefinite"/>
      </path>
      <path d="M195 135 Q210 120 230 110"
        fill="none" stroke="#c4912a" strokeWidth="1.4" strokeDasharray="5 5" opacity="0.40" strokeDashoffset="0">
        <animate attributeName="stroke-dashoffset" values="0;-30;0" dur="3.2s" repeatCount="indefinite"/>
      </path>

      {/* Signal beams */}
      <line x1="230" y1="110" x2="242" y2="68" stroke="#c4912a" strokeWidth="0.9" strokeDasharray="4 4" opacity="0.38"/>
      <line x1="345" y1="155" x2="365" y2="108" stroke="#60a5fa" strokeWidth="0.8" strokeDasharray="4 4" opacity="0.30"/>
      <line x1="310" y1="128" x2="302" y2="82" stroke="#34d399" strokeWidth="0.8" strokeDasharray="4 4" opacity="0.28"/>

      {/* Satellite 1 — gold */}
      <g filter="url(#hg-glow)">
        <animateMotion dur="16s" repeatCount="indefinite"
          path="M 65 188 A 220 72 0 0 1 505 188 A 220 72 0 0 1 65 188"/>
        <rect x="-10" y="-4.5" width="20" height="9" rx="2" fill="#c4912a"/>
        <rect x="-20" y="-2" width="10" height="4" rx="1" fill="#4a8ce0" opacity="0.9"/>
        <rect x="10"  y="-2" width="10" height="4" rx="1" fill="#4a8ce0" opacity="0.9"/>
        <circle cx="0" cy="0" r="2" fill="#fff"/>
      </g>

      {/* Satellite 2 — blue */}
      <g filter="url(#hg-glow)" opacity="0.88">
        <animateMotion dur="11s" repeatCount="indefinite" begin="-5s"
          path="M 107 188 A 178 50 0 0 1 463 188 A 178 50 0 0 1 107 188"/>
        <rect x="-7" y="-3.5" width="14" height="7" rx="1.5" fill="#60a5fa"/>
        <rect x="-15" y="-1.5" width="8" height="3" rx="1" fill="#1e40af" opacity="0.9"/>
        <rect x="7"   y="-1.5" width="8" height="3" rx="1" fill="#1e40af" opacity="0.9"/>
        <circle cx="0" cy="0" r="1.6" fill="#fff"/>
      </g>

      {/* Satellite 3 — green */}
      <g filter="url(#hg-glow)" opacity="0.78">
        <animateMotion dur="8s" repeatCount="indefinite" begin="-3s"
          path="M 145 188 A 140 35 0 0 1 425 188 A 140 35 0 0 1 145 188"/>
        <rect x="-6" y="-3" width="12" height="6" rx="1.2" fill="#34d399"/>
        <rect x="-12" y="-1.2" width="6" height="2.4" rx="0.8" fill="#065f46" opacity="0.9"/>
        <rect x="6"   y="-1.2" width="6" height="2.4" rx="0.8" fill="#065f46" opacity="0.9"/>
        <circle cx="0" cy="0" r="1.4" fill="#fff"/>
      </g>

      {/* HUD cards */}
      <rect x="10" y="12" width="116" height="46" rx="8" fill="rgba(4,10,24,0.92)" stroke="rgba(196,145,42,0.45)" strokeWidth="0.9"/>
      <circle cx="24" cy="32" r="4.5" fill="#34d399">
        <animate attributeName="opacity" values="1;0.3;1" dur="1.8s" repeatCount="indefinite"/>
      </circle>
      <text x="34" y="27" fontSize="7" fill="rgba(245,208,122,0.72)" fontWeight="700" letterSpacing="0.8">LIVE TRACKING</text>
      <text x="34" y="38" fontSize="12" fill="#fff" fontWeight="700">6,482 Vehicles</text>
      <text x="34" y="50" fontSize="6.5" fill="rgba(255,255,255,0.36)">34 enterprise tenants</text>

      <rect x="432" y="12" width="118" height="46" rx="8" fill="rgba(4,10,24,0.92)" stroke="rgba(80,160,255,0.40)" strokeWidth="0.9"/>
      <text x="442" y="27" fontSize="7" fill="rgba(150,195,255,0.72)" fontWeight="700" letterSpacing="0.8">GPS UPTIME</text>
      <text x="442" y="38" fontSize="12" fill="#60a5fa" fontWeight="700">99.9%</text>
      <text x="442" y="50" fontSize="6.5" fill="rgba(255,255,255,0.32)">Global infrastructure</text>

      <rect x="10" y="382" width="116" height="46" rx="8" fill="rgba(4,10,24,0.92)" stroke="rgba(52,211,153,0.38)" strokeWidth="0.9"/>
      <text x="20" y="397" fontSize="7" fill="rgba(100,220,160,0.72)" fontWeight="700" letterSpacing="0.8">COST SAVINGS</text>
      <text x="20" y="408" fontSize="12" fill="#34d399" fontWeight="700">28% avg</text>
      <text x="20" y="420" fontSize="6.5" fill="rgba(255,255,255,0.32)">Operational cost reduction</text>

      <rect x="432" y="382" width="118" height="46" rx="8" fill="rgba(4,10,24,0.92)" stroke="rgba(249,115,22,0.38)" strokeWidth="0.9"/>
      <text x="442" y="397" fontSize="7" fill="rgba(253,186,116,0.72)" fontWeight="700" letterSpacing="0.8">AI DISPATCH</text>
      <text x="442" y="408" fontSize="12" fill="#f97316" fontWeight="700">Route IQ</text>
      <text x="442" y="420" fontSize="6.5" fill="rgba(255,255,255,0.32)">ML-optimised routing</text>
    </svg>
  );
}

// ── Dashboard Preview Mockup ────────────────────────────────────────────────
function DashboardPreview() {
  return (
    <svg viewBox="0 0 960 540" xmlns="http://www.w3.org/2000/svg"
      style={{ width:'100%', height:'auto', display:'block', borderRadius:16 }}>
      {/* Browser frame */}
      <rect width="960" height="540" rx="12" fill="#0f172a"/>
      {/* Address bar */}
      <rect x="0" y="0" width="960" height="36" rx="12" fill="#1e293b"/>
      <rect x="0" y="18" width="960" height="18" fill="#1e293b"/>
      <circle cx="20" cy="18" r="5" fill="#ef4444" opacity="0.7"/>
      <circle cx="36" cy="18" r="5" fill="#f59e0b" opacity="0.7"/>
      <circle cx="52" cy="18" r="5" fill="#22c55e" opacity="0.7"/>
      <rect x="160" y="11" width="480" height="14" rx="7" fill="#0f172a"/>
      <text x="400" y="21" fontSize="9" fill="rgba(255,255,255,0.3)" textAnchor="middle">app.fleetos.pro/dashboard</text>

      {/* Sidebar */}
      <rect x="0" y="36" width="155" height="504" fill="#0f172a"/>
      {/* Logo */}
      <rect x="12" y="48" width="131" height="32" rx="6" fill="rgba(196,145,42,0.10)"/>
      <text x="22" y="68" fontSize="13" fill="#c4912a" fontWeight="800">Fleet</text>
      <text x="60" y="68" fontSize="13" fill="rgba(255,255,255,0.45)" fontWeight="400">OS</text>
      <text x="84" y="62" fontSize="7" fill="#c4912a" fontWeight="700">PRO</text>
      {/* Nav items */}
      {[
        { icon:'⊞', label:'Dashboard',  y:100, active:true  },
        { icon:'⊙', label:'Map & GPS',  y:128, active:false },
        { icon:'⬡', label:'Vehicles',   y:156, active:false },
        { icon:'⊏', label:'Routes',     y:184, active:false },
        { icon:'▲', label:'Analytics',  y:212, active:false },
        { icon:'☰', label:'Reports',    y:240, active:false },
        { icon:'⚙', label:'Settings',  y:268, active:false },
      ].map(({icon,label,y,active}) => (
        <g key={label}>
          {active && <rect x="0" y={y-12} width="155" height="26" fill="rgba(196,145,42,0.12)"/>}
          {active && <rect x="0" y={y-12} width="3" height="26" rx="1.5" fill="#c4912a"/>}
          <text x="18" y={y+5} fontSize="11" fill={active ? '#c4912a' : 'rgba(255,255,255,0.38)'}>{icon}</text>
          <text x="34" y={y+5} fontSize="10" fill={active ? '#fff' : 'rgba(255,255,255,0.42)'} fontWeight={active?'600':'400'}>{label}</text>
        </g>
      ))}
      {/* Sidebar separator */}
      <line x1="155" y1="36" x2="155" y2="540" stroke="rgba(255,255,255,0.06)" strokeWidth="1"/>

      {/* Top bar */}
      <rect x="155" y="36" width="805" height="42" fill="#0f172a"/>
      <line x1="155" y1="78" x2="960" y2="78" stroke="rgba(255,255,255,0.08)" strokeWidth="1"/>
      <text x="172" y="61" fontSize="12" fill="#fff" fontWeight="600">Dashboard</text>
      <text x="172" y="73" fontSize="8" fill="rgba(255,255,255,0.3)">Monday, 9 June 2025</text>
      <rect x="600" y="46" width="140" height="22" rx="11" fill="#1e293b"/>
      <text x="614" y="61" fontSize="9" fill="rgba(255,255,255,0.3)">🔍  Search fleet…</text>
      <circle cx="780" cy="57" r="14" fill="#1e293b"/>
      <text x="780" y="62" fontSize="12" fill="rgba(255,255,255,0.5)" textAnchor="middle">🔔</text>
      <circle cx="815" cy="57" r="14" fill="rgba(196,145,42,0.2)"/>
      <text x="815" y="62" fontSize="9" fill="#c4912a" fontWeight="700" textAnchor="middle">FA</text>

      {/* Content area */}
      <rect x="155" y="78" width="805" height="462" fill="#f5f3ef"/>

      {/* KPI cards */}
      {[
        { x:168, label:'Active Vehicles', val:'247', sub:'+12 from yesterday', icon:'🚛', c:'#c4912a', bg:'#fdf6e8' },
        { x:362, label:'Trips Today',     val:'1,842', sub:'94% on-time delivery', icon:'🗺', c:'#2563eb', bg:'#eff6ff' },
        { x:556, label:'Fleet Health',    val:'96.2%', sub:'4 due maintenance',   icon:'⚙', c:'#16a34a', bg:'#f0fdf4' },
        { x:750, label:'Alerts Active',   val:'7',     sub:'2 require action',    icon:'⚠', c:'#dc2626', bg:'#fef2f2' },
      ].map(({x,label,val,sub,icon,c,bg}) => (
        <g key={label}>
          <rect x={x} y="92" width="178" height="82" rx="8" fill={bg} stroke={c} strokeWidth="0.8" strokeOpacity={0.25}/>
          <text x={x+14} y="112" fontSize="9" fill={c} fontWeight="600" opacity="0.8">{label}</text>
          <text x={x+14} y="136" fontSize="22" fill="#0d1b2a" fontWeight="800">{val}</text>
          <text x={x+14} y="164" fontSize="8" fill={c} opacity="0.75">{sub}</text>
          <text x={x+148} y="136" fontSize="20" opacity="0.6">{icon}</text>
        </g>
      ))}

      {/* Map panel */}
      <rect x="168" y="188" width="500" height="335" rx="8" fill="#1a2840"/>
      <text x="182" y="206" fontSize="9" fill="rgba(255,255,255,0.5)" fontWeight="600">LIVE MAP</text>
      {/* Grid lines */}
      {[210,240,270,300,330,360,390,420,450,480].map(y => (
        <line key={y} x1="168" y1={y} x2="668" y2={y} stroke="rgba(255,255,255,0.04)" strokeWidth="1"/>
      ))}
      {[220,270,320,370,420,470,520,570,620].map(x => (
        <line key={x} x1={x} y1="188" x2={x} y2="523" stroke="rgba(255,255,255,0.04)" strokeWidth="1"/>
      ))}
      {/* Geofence */}
      <ellipse cx="400" cy="350" rx="85" ry="60" fill="none" stroke="rgba(196,145,42,0.30)" strokeWidth="1.5" strokeDasharray="6 5"/>
      {/* Route lines */}
      <path d="M220 480 Q280 440 340 410 Q390 380 420 345 Q448 310 490 290 Q520 275 560 260"
        fill="none" stroke="#c4912a" strokeWidth="1.5" strokeDasharray="5 4" opacity="0.7"/>
      <path d="M580 320 Q560 340 540 360 Q510 390 480 405 Q450 415 420 410"
        fill="none" stroke="#60a5fa" strokeWidth="1.2" strokeDasharray="5 4" opacity="0.6"/>
      {/* Vehicle markers */}
      {([
        [340,410,'#c4912a'],[490,290,'#34d399'],[420,345,'#60a5fa'],
        [260,455,'#c4912a'],[560,260,'#f97316'],[480,405,'#a78bfa'],
      ] as [number,number,string][]).map(([x,y,c],i) => (
        <g key={i}>
          <circle cx={x} cy={y} r={7} fill={c} opacity={0.9}/>
          <circle cx={x} cy={y} r={3} fill="#fff"/>
        </g>
      ))}

      {/* Analytics panel */}
      <rect x="682" y="188" width="264" height="155" rx="8" fill="#fff"/>
      <text x="696" y="207" fontSize="9" fill="rgba(13,27,42,0.5)" fontWeight="600">ACTIVE VEHICLES — 7 DAYS</text>
      {/* Area chart */}
      <defs>
        <linearGradient id="dp-chart" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#c4912a" stopOpacity="0.3"/>
          <stop offset="100%" stopColor="#c4912a" stopOpacity="0"/>
        </linearGradient>
      </defs>
      <path d="M695 318 L718 295 L740 305 L762 282 L784 290 L806 272 L828 265 L850 258 L872 268 L894 252 L916 245 L938 238 L938 330 L695 330 Z"
        fill="url(#dp-chart)"/>
      <path d="M695 318 L718 295 L740 305 L762 282 L784 290 L806 272 L828 265 L850 258 L872 268 L894 252 L916 245 L938 238"
        fill="none" stroke="#c4912a" strokeWidth="2"/>
      {/* Chart dots */}
      {[[718,295],[762,282],[806,272],[850,258],[894,252],[938,238]].map(([x,y],i) => (
        <circle key={i} cx={x} cy={y} r={3} fill="#c4912a" stroke="#fff" strokeWidth="1.5"/>
      ))}
      {/* Y labels */}
      <text x="695" y="220" fontSize="7" fill="rgba(0,0,0,0.3)">260</text>
      <text x="695" y="255" fontSize="7" fill="rgba(0,0,0,0.3)">240</text>
      <text x="695" y="290" fontSize="7" fill="rgba(0,0,0,0.3)">220</text>
      <text x="695" y="328" fontSize="7" fill="rgba(0,0,0,0.3)">200</text>

      {/* Alerts panel */}
      <rect x="682" y="356" width="264" height="167" rx="8" fill="#fff"/>
      <text x="696" y="374" fontSize="9" fill="rgba(13,27,42,0.5)" fontWeight="600">RECENT ALERTS</text>
      {[
        { y:393, c:'#ef4444', bg:'#fef2f2', label:'Speeding — V-1082',      time:'2m ago' },
        { y:419, c:'#f59e0b', bg:'#fffbeb', label:'Geofence exit — V-0347', time:'15m ago' },
        { y:445, c:'#f59e0b', bg:'#fffbeb', label:'Idle >10min — V-2201',   time:'28m ago' },
        { y:471, c:'#64748b', bg:'#f8fafc', label:'Maintenance due — V-0891',time:'1h ago' },
        { y:497, c:'#64748b', bg:'#f8fafc', label:'Low fuel — V-1654',      time:'2h ago' },
      ].map(({y,c,bg,label,time}) => (
        <g key={label}>
          <rect x="692" y={y-10} width="244" height="20" rx="4" fill={bg}/>
          <circle cx="704" cy={y} r="4" fill={c}/>
          <text x="714" y={y+4} fontSize="8.5" fill="#0d1b2a" fontWeight="500">{label}</text>
          <text x="918" y={y+4} fontSize="7.5" fill="rgba(0,0,0,0.35)" textAnchor="end">{time}</text>
        </g>
      ))}
    </svg>
  );
}

// ── Marketing Page ──────────────────────────────────────────────────────────
export default function MarketingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', h, { passive: true });
    return () => window.removeEventListener('scroll', h);
  }, []);

  function scrollTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setMenuOpen(false);
  }

  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", color: '#0d1b2a', overflowX: 'hidden' }}>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #fff; }
        @keyframes float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
        @keyframes fadein { from { opacity:0; transform:translateY(24px); } to { opacity:1; transform:translateY(0); } }
        @keyframes shimmer { 0% { background-position: -400px 0; } 100% { background-position: 400px 0; } }
        .mkt-btn-gold {
          display:inline-flex; align-items:center; gap:8px;
          padding: 14px 28px; border-radius:8px; font-size:15px; font-weight:700;
          background: linear-gradient(135deg,#c4912a 0%,#e8b84b 50%,#c4912a 100%);
          background-size: 200% auto;
          color:#0d1b2a; border:none; cursor:pointer; text-decoration:none;
          transition: background-position 0.4s, box-shadow 0.2s, transform 0.15s;
          letter-spacing:0.1px;
        }
        .mkt-btn-gold:hover {
          background-position: right center;
          box-shadow: 0 8px 32px rgba(196,145,42,0.45);
          transform: translateY(-1px);
        }
        .mkt-btn-outline {
          display:inline-flex; align-items:center; gap:8px;
          padding: 13px 27px; border-radius:8px; font-size:15px; font-weight:600;
          background: rgba(255,255,255,0.08); color:#fff;
          border:1.5px solid rgba(255,255,255,0.28); cursor:pointer; text-decoration:none;
          transition: background 0.2s, border-color 0.2s;
        }
        .mkt-btn-outline:hover { background: rgba(255,255,255,0.14); border-color:rgba(255,255,255,0.45); }
        .mkt-btn-nav {
          padding: 8px 18px; border-radius:7px; font-size:13px; font-weight:600;
          background: linear-gradient(135deg,#c4912a,#e8b84b);
          color:#0d1b2a; border:none; cursor:pointer; text-decoration:none;
          transition: box-shadow 0.2s;
          display:inline-flex; align-items:center;
        }
        .mkt-btn-nav:hover { box-shadow: 0 4px 18px rgba(196,145,42,0.4); }
        .feat-card {
          background:#fff; border-radius:12px; padding:28px 24px;
          border:1.5px solid #e8e3dc; transition: box-shadow 0.2s, border-color 0.2s, transform 0.2s;
        }
        .feat-card:hover { box-shadow:0 12px 40px rgba(13,27,42,0.12); border-color:#c4912a50; transform:translateY(-3px); }
        .pricing-card {
          background:#fff; border-radius:16px; padding:36px 32px;
          border:2px solid #e8e3dc; transition: box-shadow 0.2s, border-color 0.2s, transform 0.2s;
        }
        .pricing-card:hover { box-shadow:0 16px 48px rgba(13,27,42,0.12); transform:translateY(-4px); }
        .pricing-popular {
          background: linear-gradient(160deg, #0d1b2a 0%, #1c2b44 100%);
          border:2px solid #c4912a;
          box-shadow: 0 20px 60px rgba(13,27,42,0.35);
        }
        .testi-card {
          background:#fff; border-radius:12px; padding:28px 26px;
          border:1.5px solid #e8e3dc; transition: box-shadow 0.2s;
        }
        .testi-card:hover { box-shadow:0 12px 36px rgba(13,27,42,0.10); }
        .section-enter { animation: fadein 0.6s ease both; }
        .platform-feat { display:flex; align-items:flex-start; gap:14px; padding:18px 0; border-bottom:1px solid rgba(255,255,255,0.07); }
        .platform-feat:last-child { border-bottom:none; }
      `}</style>

      {/* ── Sticky Header ─────────────────────────────────────────────────── */}
      <header style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
        background: scrolled ? 'rgba(13,27,42,0.97)' : 'rgba(13,27,42,0.85)',
        backdropFilter: 'blur(16px)',
        borderBottom: scrolled ? '1px solid rgba(196,145,42,0.18)' : '1px solid transparent',
        boxShadow: scrolled ? '0 4px 30px rgba(0,0,0,0.4)' : 'none',
        transition: 'all 0.25s',
        height: 64,
        display: 'flex', alignItems: 'center',
        padding: '0 32px',
      }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20 }}>
          {/* Logo */}
          <button onClick={() => scrollTo('hero')} style={{ display:'flex', alignItems:'center', gap:10, background:'none', border:'none', cursor:'pointer' }}>
            <svg width="34" height="34" viewBox="0 0 40 40">
              <rect width="40" height="40" rx="9" fill="#c4912a"/>
              <path d="M10 28 L20 10 L30 28" fill="none" stroke="#fff" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="20" cy="28" r="3.5" fill="#fff"/>
            </svg>
            <span style={{ color:'#fff', fontSize:17, fontWeight:700, letterSpacing:'-0.3px' }}>Fleet<span style={{ color:'rgba(255,255,255,0.45)', fontWeight:400 }}>OS</span></span>
            <span style={{ fontSize:9, fontWeight:800, color:'#c4912a', border:'1px solid rgba(196,145,42,0.5)', borderRadius:3, padding:'2px 5px', letterSpacing:'0.8px' }}>PRO</span>
          </button>

          {/* Nav */}
          <nav style={{ display:'flex', alignItems:'center', gap:6 }}>
            {NAV.map(item => (
              <button key={item} onClick={() => scrollTo(item.toLowerCase())} style={{
                background:'none', border:'none', cursor:'pointer',
                padding:'8px 14px', borderRadius:7, fontSize:13, fontWeight:500,
                color:'rgba(255,255,255,0.72)', transition:'color 0.15s, background 0.15s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color='#fff'; (e.currentTarget as HTMLElement).style.background='rgba(255,255,255,0.07)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color='rgba(255,255,255,0.72)'; (e.currentTarget as HTMLElement).style.background='none'; }}
              >{item}</button>
            ))}
          </nav>

          {/* Actions */}
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <Link href="/login" style={{
              color:'rgba(255,255,255,0.7)', fontSize:13, fontWeight:500,
              textDecoration:'none', padding:'8px 14px',
              transition:'color 0.15s',
            }}>Sign in</Link>
            <Link href="/login" className="mkt-btn-nav">Launch Platform →</Link>
          </div>
        </div>
      </header>

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section id="hero" style={{
        minHeight: '100vh', background: 'linear-gradient(160deg, #050d1e 0%, #0d1b2a 40%, #091428 100%)',
        display: 'flex', alignItems: 'center', paddingTop: 64, position: 'relative', overflow: 'hidden',
      }}>
        {/* Background grid pattern */}
        <div style={{
          position:'absolute', inset:0, pointerEvents:'none',
          backgroundImage:'linear-gradient(rgba(196,145,42,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(196,145,42,0.05) 1px, transparent 1px)',
          backgroundSize:'60px 60px',
        }}/>
        {/* Radial glow */}
        <div style={{ position:'absolute', top:'10%', left:'5%', width:600, height:600, borderRadius:'50%', pointerEvents:'none', background:'radial-gradient(circle, rgba(196,145,42,0.12) 0%, transparent 65%)' }}/>
        <div style={{ position:'absolute', bottom:'5%', right:'2%', width:500, height:500, borderRadius:'50%', pointerEvents:'none', background:'radial-gradient(circle, rgba(37,99,235,0.10) 0%, transparent 65%)' }}/>

        <div style={{ maxWidth:1280, margin:'0 auto', padding:'80px 40px', width:'100%', display:'grid', gridTemplateColumns:'1fr 1fr', gap:60, alignItems:'center' }}>
          {/* Left — copy */}
          <div style={{ animation:'fadein 0.7s ease both' }}>
            <div style={{ display:'inline-flex', alignItems:'center', gap:8, marginBottom:28, padding:'6px 14px', borderRadius:20, background:'rgba(196,145,42,0.12)', border:'1px solid rgba(196,145,42,0.28)' }}>
              <span style={{ width:7, height:7, borderRadius:'50%', background:'#c4912a', boxShadow:'0 0 8px rgba(196,145,42,0.9)', flexShrink:0 }}/>
              <span style={{ fontSize:11, fontWeight:700, letterSpacing:'1.8px', textTransform:'uppercase', color:'rgba(245,208,122,0.85)' }}>Enterprise Fleet Intelligence Platform</span>
            </div>

            <h1 style={{ fontSize:56, fontWeight:900, lineHeight:1.08, letterSpacing:'-1.5px', marginBottom:20 }}>
              <span style={{ color:'#fff', display:'block' }}>Track every mile.</span>
              <span style={{ color:'#fff', display:'block' }}>Command every route.</span>
              <span style={{ display:'block', background:'linear-gradient(90deg, #f5d07a 0%, #e8b84b 45%, #c4912a 100%)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>
                Deliver every promise.
              </span>
            </h1>

            <p style={{ fontSize:18, color:'rgba(255,255,255,0.55)', lineHeight:1.7, marginBottom:36, maxWidth:480 }}>
              FleetOS Pro is the all-in-one fleet intelligence platform — real-time GPS, AI route optimisation, predictive maintenance, and enterprise-grade RBAC. Built for companies that run fleets at scale.
            </p>

            <div style={{ display:'flex', gap:14, flexWrap:'wrap', marginBottom:48 }}>
              <Link href="/login" className="mkt-btn-gold">
                <i className="ti ti-rocket" style={{ fontSize:16 }}/>
                Start free trial
              </Link>
              <button onClick={() => scrollTo('platform')} className="mkt-btn-outline">
                <i className="ti ti-player-play" style={{ fontSize:15 }}/>
                See platform demo
              </button>
            </div>

            {/* Trust badges */}
            <div style={{ display:'flex', alignItems:'center', gap:20, flexWrap:'wrap' }}>
              {[
                { icon:'ti-shield-check', label:'SOC 2 Type II' },
                { icon:'ti-certificate', label:'ISO 27001' },
                { icon:'ti-building-bank', label:'GDPR Compliant' },
                { icon:'ti-server', label:'99.9% SLA' },
              ].map(({ icon, label }) => (
                <div key={label} style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, color:'rgba(255,255,255,0.38)' }}>
                  <i className={`ti ${icon}`} style={{ fontSize:13, color:'rgba(196,145,42,0.6)' }}/>
                  {label}
                </div>
              ))}
            </div>
          </div>

          {/* Right — globe visual */}
          <div style={{ animation:'fadein 0.7s 0.2s ease both', animationFillMode:'both' }}>
            <HeroGlobe />
          </div>
        </div>

        {/* Stats ribbon */}
        <div style={{
          position:'absolute', bottom:0, left:0, right:0,
          background:'rgba(255,255,255,0.04)', backdropFilter:'blur(8px)',
          borderTop:'1px solid rgba(255,255,255,0.07)',
          padding:'20px 40px',
        }}>
          <div style={{ maxWidth:1280, margin:'0 auto', display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:20 }}>
            {[
              { val:'6,482+', label:'Vehicles tracked globally',    icon:'ti-truck'         },
              { val:'34',     label:'Enterprise clients worldwide',  icon:'ti-building'      },
              { val:'99.9%',  label:'Guaranteed platform uptime',   icon:'ti-server'        },
              { val:'28%',    label:'Average operational cost saved',icon:'ti-trending-down' },
            ].map(({ val, label, icon }) => (
              <div key={label} style={{ display:'flex', alignItems:'center', gap:14 }}>
                <div style={{ width:44, height:44, borderRadius:10, background:'rgba(196,145,42,0.15)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <i className={`ti ${icon}`} style={{ fontSize:20, color:'#c4912a' }}/>
                </div>
                <div>
                  <div style={{ fontSize:26, fontWeight:800, color:'#fff', letterSpacing:'-0.8px', lineHeight:1 }}>{val}</div>
                  <div style={{ fontSize:11, color:'rgba(255,255,255,0.40)', marginTop:3 }}>{label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Trusted By ──────────────────────────────────────────────────── */}
      <div style={{ background:'#fff', padding:'32px 40px', borderBottom:'1px solid #e8e3dc' }}>
        <div style={{ maxWidth:1280, margin:'0 auto', display:'flex', alignItems:'center', gap:40, flexWrap:'wrap' }}>
          <span style={{ fontSize:11, fontWeight:700, letterSpacing:'1.5px', textTransform:'uppercase', color:'#94a3b8', flexShrink:0 }}>Trusted by</span>
          {['Atlantic Freight Inc', 'Meridian Logistics', 'BritFleet Solutions', 'ACME Logistics', 'PeakFleet Co', 'Star Technologies', 'SwiftCargo Ltd'].map(name => (
            <div key={name} style={{ fontSize:13, fontWeight:600, color:'#94a3b8', whiteSpace:'nowrap', padding:'4px 16px', borderRadius:20, border:'1px solid #e8e3dc' }}>{name}</div>
          ))}
        </div>
      </div>

      {/* ── Features ────────────────────────────────────────────────────── */}
      <section id="features" style={{ background:'#faf8f5', padding:'100px 40px' }}>
        <div style={{ maxWidth:1280, margin:'0 auto' }}>
          <div style={{ textAlign:'center', marginBottom:64 }}>
            <div style={{ display:'inline-flex', alignItems:'center', gap:8, marginBottom:16, padding:'6px 14px', borderRadius:20, background:'rgba(196,145,42,0.1)', border:'1px solid rgba(196,145,42,0.22)' }}>
              <i className="ti ti-sparkles" style={{ fontSize:13, color:'#c4912a' }}/>
              <span style={{ fontSize:11, fontWeight:700, letterSpacing:'1.5px', textTransform:'uppercase', color:'#c4912a' }}>Full Platform Feature Set</span>
            </div>
            <h2 style={{ fontSize:44, fontWeight:800, letterSpacing:'-1px', marginBottom:16 }}>Everything your fleet needs</h2>
            <p style={{ fontSize:18, color:'#64748b', maxWidth:580, margin:'0 auto', lineHeight:1.7 }}>
              24 enterprise-grade capabilities across fleet intelligence, operations, analytics, and security — all in one platform.
            </p>
          </div>

          {FEATURE_GROUPS.map(({ group, color, icon, items }) => (
            <div key={group} style={{ marginBottom:72 }}>
              <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:28 }}>
                <div style={{ width:38, height:38, borderRadius:10, background:`${color}18`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <i className={`ti ${icon}`} style={{ fontSize:18, color }}/>
                </div>
                <h3 style={{ fontSize:22, fontWeight:700, color:'#0d1b2a' }}>{group}</h3>
                <div style={{ flex:1, height:1, background:'#e8e3dc', marginLeft:8 }}/>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:20 }}>
                {items.map(({ icon: fi, title, desc }) => (
                  <div key={title} className="feat-card">
                    <div style={{ width:42, height:42, borderRadius:10, background:`${color}14`, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:16 }}>
                      <i className={`ti ${fi}`} style={{ fontSize:20, color }}/>
                    </div>
                    <div style={{ fontSize:15, fontWeight:700, marginBottom:8, color:'#0d1b2a' }}>{title}</div>
                    <div style={{ fontSize:13.5, color:'#64748b', lineHeight:1.65 }}>{desc}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Platform Demo ────────────────────────────────────────────────── */}
      <section id="platform" style={{ background:'linear-gradient(160deg, #0d1b2a 0%, #091428 100%)', padding:'100px 40px' }}>
        <div style={{ maxWidth:1280, margin:'0 auto' }}>
          <div style={{ textAlign:'center', marginBottom:56 }}>
            <div style={{ display:'inline-flex', alignItems:'center', gap:8, marginBottom:16, padding:'6px 14px', borderRadius:20, background:'rgba(196,145,42,0.12)', border:'1px solid rgba(196,145,42,0.25)' }}>
              <i className="ti ti-device-desktop" style={{ fontSize:13, color:'#c4912a' }}/>
              <span style={{ fontSize:11, fontWeight:700, letterSpacing:'1.5px', textTransform:'uppercase', color:'rgba(245,208,122,0.8)' }}>Live Platform</span>
            </div>
            <h2 style={{ fontSize:44, fontWeight:800, letterSpacing:'-1px', color:'#fff', marginBottom:16 }}>See FleetOS Pro in action</h2>
            <p style={{ fontSize:17, color:'rgba(255,255,255,0.50)', maxWidth:540, margin:'0 auto', lineHeight:1.7 }}>
              A single screen gives every fleet manager, dispatcher, and executive exactly what they need — nothing more, nothing less.
            </p>
          </div>

          {/* Dashboard preview */}
          <div style={{ marginBottom:56, borderRadius:16, overflow:'hidden', boxShadow:'0 40px 100px rgba(0,0,0,0.6), 0 0 0 1px rgba(196,145,42,0.20)' }}>
            <DashboardPreview />
          </div>

          {/* Platform capabilities */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16 }}>
            {PLATFORM_FEATURES.map(({ icon, title, desc }) => (
              <div key={title} className="platform-feat" style={{ padding:'20px 0', borderBottom:'1px solid rgba(255,255,255,0.07)' }}>
                <div style={{ width:40, height:40, borderRadius:10, background:'rgba(196,145,42,0.14)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <i className={`ti ${icon}`} style={{ fontSize:18, color:'#c4912a' }}/>
                </div>
                <div>
                  <div style={{ fontSize:14, fontWeight:700, color:'#fff', marginBottom:5 }}>{title}</div>
                  <div style={{ fontSize:12.5, color:'rgba(255,255,255,0.45)', lineHeight:1.6 }}>{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Security Section ─────────────────────────────────────────────── */}
      <section id="security" style={{ background:'#f8fafc', padding:'100px 40px' }}>
        <div style={{ maxWidth:1280, margin:'0 auto', display:'grid', gridTemplateColumns:'1fr 1fr', gap:80, alignItems:'center' }}>
          <div>
            <div style={{ display:'inline-flex', alignItems:'center', gap:8, marginBottom:20, padding:'6px 14px', borderRadius:20, background:'rgba(124,58,237,0.1)', border:'1px solid rgba(124,58,237,0.22)' }}>
              <i className="ti ti-shield-lock" style={{ fontSize:13, color:'#7c3aed' }}/>
              <span style={{ fontSize:11, fontWeight:700, letterSpacing:'1.5px', textTransform:'uppercase', color:'#7c3aed' }}>Enterprise Security</span>
            </div>
            <h2 style={{ fontSize:42, fontWeight:800, letterSpacing:'-0.8px', marginBottom:20 }}>
              Bank-grade security, built for fleet operations.
            </h2>
            <p style={{ fontSize:16, color:'#64748b', lineHeight:1.75, marginBottom:36 }}>
              FleetOS Pro is architected for enterprise compliance — SOC 2, ISO 27001, and GDPR. Every feature is gated by role, every action is audited, and every session is monitored.
            </p>
            <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
              {[
                { icon:'ti-users-group', title:'Granular RBAC', desc:'Super Admin, Tenant Admin, Fleet Manager, Dispatcher, Viewer + unlimited custom roles. Module-level permissions.' },
                { icon:'ti-device-mobile', title:'MFA & SSO', desc:'TOTP, SMS OTP, SAML 2.0, OIDC, and FIDO2 passkeys. Works with Okta, Azure AD, and Google Workspace.' },
                { icon:'ti-lock-access', title:'Session & Audit Control', desc:'Remote session termination, idle timeout enforcement, and an immutable audit trail for every user action.' },
              ].map(({ icon, title, desc }) => (
                <div key={title} style={{ display:'flex', gap:14, alignItems:'flex-start' }}>
                  <div style={{ width:36, height:36, borderRadius:8, background:'rgba(124,58,237,0.1)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, marginTop:2 }}>
                    <i className={`ti ${icon}`} style={{ fontSize:16, color:'#7c3aed' }}/>
                  </div>
                  <div>
                    <div style={{ fontSize:14, fontWeight:700, marginBottom:4 }}>{title}</div>
                    <div style={{ fontSize:13, color:'#64748b', lineHeight:1.6 }}>{desc}</div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ marginTop:36 }}>
              <Link href="/login" className="mkt-btn-gold">Explore security features →</Link>
            </div>
          </div>

          {/* Security visual — compliance badges */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
            {[
              { icon:'ti-shield-check', title:'SOC 2 Type II', desc:'Annual third-party audit of our security controls, availability, and confidentiality', color:'#7c3aed' },
              { icon:'ti-certificate', title:'ISO 27001', desc:'Internationally recognised information security management system certification', color:'#2563eb' },
              { icon:'ti-building-bank', title:'GDPR Ready', desc:'Data residency options, right-to-erasure workflows, and DPA agreements', color:'#16a34a' },
              { icon:'ti-lock', title:'Data Encryption', desc:'AES-256 at rest, TLS 1.3 in transit, zero-knowledge for sensitive credentials', color:'#c4912a' },
              { icon:'ti-eye-off', title:'Zero-Trust Network', desc:'Every internal service-to-service call is authenticated and authorised independently', color:'#dc2626' },
              { icon:'ti-refresh', title:'Auto Failover', desc:'Multi-region active-active deployment with RPO <1 min and RTO <5 min', color:'#0891b2' },
            ].map(({ icon, title, desc, color }) => (
              <div key={title} style={{
                background:'#fff', borderRadius:12, padding:'20px',
                border:'1.5px solid #e8e3dc', transition:'box-shadow 0.2s',
              }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.boxShadow='0 8px 28px rgba(0,0,0,0.10)'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.boxShadow='none'}
              >
                <div style={{ width:36, height:36, borderRadius:9, background:`${color}15`, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:12 }}>
                  <i className={`ti ${icon}`} style={{ fontSize:18, color }}/>
                </div>
                <div style={{ fontSize:13, fontWeight:700, marginBottom:6 }}>{title}</div>
                <div style={{ fontSize:11.5, color:'#64748b', lineHeight:1.55 }}>{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ─────────────────────────────────────────────────── */}
      <section style={{ background:'#fff', padding:'100px 40px' }}>
        <div style={{ maxWidth:1280, margin:'0 auto' }}>
          <div style={{ textAlign:'center', marginBottom:64 }}>
            <h2 style={{ fontSize:42, fontWeight:800, letterSpacing:'-0.8px', marginBottom:14 }}>Up and running in under 24 hours</h2>
            <p style={{ fontSize:16, color:'#64748b', maxWidth:520, margin:'0 auto', lineHeight:1.7 }}>No hardware rollout required. Plug in any GPS tracker, configure your roles, and your whole fleet goes live.</p>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:0, position:'relative' }}>
            {/* Connector line */}
            <div style={{ position:'absolute', top:44, left:'12.5%', right:'12.5%', height:2, background:'linear-gradient(90deg,#c4912a,#2563eb,#16a34a,#7c3aed)', opacity:0.35, zIndex:0 }}/>
            {[
              { step:'01', icon:'ti-plug', color:'#c4912a', title:'Connect Devices', desc:'Plug GPS trackers into any vehicle or use our OBD dongles. SIM management is included — no separate contracts.' },
              { step:'02', icon:'ti-users', color:'#2563eb', title:'Configure Roles', desc:'Set up your RBAC structure — which teams see what. Onboard staff via SSO in minutes.' },
              { step:'03', icon:'ti-map-pin', color:'#16a34a', title:'Go Live & Track', desc:'Your entire fleet appears on the live map instantly. Geofences, alerts, and route plans activate automatically.' },
              { step:'04', icon:'ti-trending-down', color:'#7c3aed', title:'Optimise & Save', desc:'AI analyses 30 days of data and surfaces route improvements, idle-time waste, and maintenance risk.' },
            ].map(({ step, icon, color, title, desc }) => (
              <div key={step} style={{ padding:'0 24px', textAlign:'center', position:'relative', zIndex:1 }}>
                <div style={{ width:88, height:88, borderRadius:'50%', background:`${color}15`, border:`3px solid ${color}`, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px', position:'relative' }}>
                  <i className={`ti ${icon}`} style={{ fontSize:30, color }}/>
                  <span style={{ position:'absolute', top:-8, right:-8, width:26, height:26, borderRadius:'50%', background:color, color:'#fff', fontSize:10, fontWeight:800, display:'flex', alignItems:'center', justifyContent:'center' }}>{step}</span>
                </div>
                <div style={{ fontSize:16, fontWeight:700, marginBottom:10 }}>{title}</div>
                <div style={{ fontSize:13, color:'#64748b', lineHeight:1.65 }}>{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ──────────────────────────────────────────────────────── */}
      <section id="pricing" style={{ background:'#faf8f5', padding:'100px 40px' }}>
        <div style={{ maxWidth:1280, margin:'0 auto' }}>
          <div style={{ textAlign:'center', marginBottom:60 }}>
            <div style={{ display:'inline-flex', alignItems:'center', gap:8, marginBottom:16, padding:'6px 14px', borderRadius:20, background:'rgba(196,145,42,0.1)', border:'1px solid rgba(196,145,42,0.22)' }}>
              <i className="ti ti-coin" style={{ fontSize:13, color:'#c4912a' }}/>
              <span style={{ fontSize:11, fontWeight:700, letterSpacing:'1.5px', textTransform:'uppercase', color:'#c4912a' }}>Simple Pricing</span>
            </div>
            <h2 style={{ fontSize:44, fontWeight:800, letterSpacing:'-1px', marginBottom:14 }}>Choose your plan</h2>
            <p style={{ fontSize:16, color:'#64748b', maxWidth:480, margin:'0 auto', lineHeight:1.7 }}>All plans include a 14-day free trial. No credit card required to start.</p>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:24, alignItems:'stretch' }}>
            {PRICING.map(plan => (
              <div key={plan.name} className={`pricing-card${plan.popular ? ' pricing-popular' : ''}`} style={{ display:'flex', flexDirection:'column' }}>
                {plan.popular && (
                  <div style={{ display:'inline-flex', alignSelf:'flex-start', marginBottom:16, padding:'4px 12px', borderRadius:20, background:'rgba(196,145,42,0.2)', border:'1px solid rgba(196,145,42,0.35)' }}>
                    <span style={{ fontSize:10, fontWeight:700, letterSpacing:'1px', textTransform:'uppercase', color:'#c4912a' }}>Most Popular</span>
                  </div>
                )}
                <div style={{ fontSize:13, fontWeight:700, color: plan.popular ? 'rgba(255,255,255,0.55)' : '#64748b', marginBottom:8, letterSpacing:'0.5px', textTransform:'uppercase' }}>{plan.name}</div>
                <div style={{ display:'flex', alignItems:'baseline', gap:4, marginBottom:8 }}>
                  <span style={{ fontSize:42, fontWeight:900, color: plan.popular ? '#fff' : '#0d1b2a', letterSpacing:'-1px' }}>{plan.price}</span>
                  {plan.period && <span style={{ fontSize:14, color: plan.popular ? 'rgba(255,255,255,0.4)' : '#94a3b8' }}>{plan.period}</span>}
                </div>
                <p style={{ fontSize:13, color: plan.popular ? 'rgba(255,255,255,0.50)' : '#64748b', marginBottom:24, lineHeight:1.6 }}>{plan.desc}</p>
                <div style={{ flex:1, display:'flex', flexDirection:'column', gap:10, marginBottom:28 }}>
                  {plan.features.map(f => (
                    <div key={f} style={{ display:'flex', alignItems:'flex-start', gap:10 }}>
                      <div style={{ width:18, height:18, borderRadius:'50%', background:`${plan.color}22`, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', marginTop:1 }}>
                        <i className="ti ti-check" style={{ fontSize:10, color:plan.color }}/>
                      </div>
                      <span style={{ fontSize:13, color: plan.popular ? 'rgba(255,255,255,0.72)' : '#374151', lineHeight:1.4 }}>{f}</span>
                    </div>
                  ))}
                </div>
                <Link href="/login" style={{
                  display:'flex', alignItems:'center', justifyContent:'center', gap:8,
                  padding:'13px', borderRadius:9, fontSize:14, fontWeight:700,
                  textDecoration:'none', transition:'all 0.2s',
                  background: plan.popular ? 'linear-gradient(135deg,#c4912a,#e8b84b)' : 'transparent',
                  color: plan.popular ? '#0d1b2a' : plan.color,
                  border: plan.popular ? 'none' : `2px solid ${plan.color}`,
                }}>
                  {plan.cta} <i className="ti ti-arrow-right" style={{ fontSize:14 }}/>
                </Link>
              </div>
            ))}
          </div>

          <p style={{ textAlign:'center', marginTop:32, fontSize:13, color:'#94a3b8' }}>
            All prices exclude VAT. Enterprise pricing is per-quote based on vehicle count and regions.{' '}
            <a href="#" style={{ color:'#c4912a', textDecoration:'none', fontWeight:500 }}>Contact our sales team →</a>
          </p>
        </div>
      </section>

      {/* ── Testimonials ─────────────────────────────────────────────────── */}
      <section style={{ background:'#fff', padding:'100px 40px' }}>
        <div style={{ maxWidth:1280, margin:'0 auto' }}>
          <div style={{ textAlign:'center', marginBottom:60 }}>
            <h2 style={{ fontSize:42, fontWeight:800, letterSpacing:'-0.8px', marginBottom:14 }}>Trusted by fleet leaders worldwide</h2>
            <p style={{ fontSize:16, color:'#64748b', maxWidth:480, margin:'0 auto', lineHeight:1.7 }}>Real results from real fleets — no stock photos, no invented quotes.</p>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:24 }}>
            {TESTIMONIALS.map(t => (
              <div key={t.name} className="testi-card">
                <div style={{ fontSize:28, color:'#c4912a', marginBottom:16, lineHeight:1 }}>"</div>
                <p style={{ fontSize:15, color:'#374151', lineHeight:1.75, marginBottom:24 }}>{t.quote}</p>
                <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                  <div style={{ width:42, height:42, borderRadius:'50%', background:`${t.color}18`, border:`2px solid ${t.color}35`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:800, color:t.color }}>
                    {t.initials}
                  </div>
                  <div>
                    <div style={{ fontSize:14, fontWeight:700, color:'#0d1b2a' }}>{t.name}</div>
                    <div style={{ fontSize:12, color:'#64748b' }}>{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────────────────────────── */}
      <section style={{ background:'linear-gradient(135deg, #0d1b2a 0%, #162033 50%, #1c2b44 100%)', padding:'100px 40px', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:'20%', left:'5%', width:500, height:500, borderRadius:'50%', pointerEvents:'none', background:'radial-gradient(circle, rgba(196,145,42,0.15) 0%, transparent 65%)' }}/>
        <div style={{ position:'absolute', bottom:'10%', right:'5%', width:400, height:400, borderRadius:'50%', pointerEvents:'none', background:'radial-gradient(circle, rgba(37,99,235,0.12) 0%, transparent 65%)' }}/>
        <div style={{ maxWidth:760, margin:'0 auto', textAlign:'center', position:'relative', zIndex:1 }}>
          <h2 style={{ fontSize:48, fontWeight:900, color:'#fff', letterSpacing:'-1.2px', marginBottom:20, lineHeight:1.1 }}>
            Ready to transform your fleet?
          </h2>
          <p style={{ fontSize:18, color:'rgba(255,255,255,0.52)', lineHeight:1.7, marginBottom:40 }}>
            Join 34 enterprise clients already running smarter fleets with FleetOS Pro. Start your 14-day free trial — no credit card, no commitment.
          </p>
          <div style={{ display:'flex', gap:16, justifyContent:'center', flexWrap:'wrap' }}>
            <Link href="/login" className="mkt-btn-gold" style={{ fontSize:16, padding:'16px 36px' }}>
              <i className="ti ti-rocket" style={{ fontSize:18 }}/>
              Launch FleetOS Pro
            </Link>
            <a href="#" className="mkt-btn-outline" style={{ fontSize:16, padding:'15px 35px' }}>
              <i className="ti ti-headset" style={{ fontSize:17 }}/>
              Talk to sales
            </a>
          </div>
          <p style={{ marginTop:24, fontSize:13, color:'rgba(255,255,255,0.28)' }}>14-day free trial · No credit card required · Cancel anytime</p>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer style={{ background:'#060d1c', padding:'64px 40px 32px', color:'rgba(255,255,255,0.5)' }}>
        <div style={{ maxWidth:1280, margin:'0 auto' }}>
          <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr 1fr', gap:40, marginBottom:48 }}>
            {/* Brand */}
            <div>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
                <svg width="30" height="30" viewBox="0 0 40 40">
                  <rect width="40" height="40" rx="9" fill="#c4912a"/>
                  <path d="M10 28 L20 10 L30 28" fill="none" stroke="#fff" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="20" cy="28" r="3.5" fill="#fff"/>
                </svg>
                <span style={{ color:'#fff', fontSize:16, fontWeight:700 }}>FleetOS <span style={{ color:'rgba(255,255,255,0.4)', fontWeight:400 }}>Pro</span></span>
              </div>
              <p style={{ fontSize:13, lineHeight:1.7, maxWidth:280, marginBottom:20 }}>
                The enterprise fleet intelligence platform. Track, optimise, and command every vehicle from one place.
              </p>
              <div style={{ display:'flex', gap:10 }}>
                {['ti-brand-linkedin','ti-brand-twitter','ti-brand-github'].map(ico => (
                  <div key={ico} style={{ width:32, height:32, borderRadius:7, background:'rgba(255,255,255,0.07)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
                    <i className={`ti ${ico}`} style={{ fontSize:15, color:'rgba(255,255,255,0.5)' }}/>
                  </div>
                ))}
              </div>
            </div>
            {/* Product */}
            <div>
              <div style={{ fontSize:11, fontWeight:700, letterSpacing:'1.2px', textTransform:'uppercase', color:'rgba(255,255,255,0.3)', marginBottom:16 }}>Product</div>
              {['Features','Platform','Security','Pricing','Changelog','API Docs'].map(l => (
                <div key={l} style={{ marginBottom:9 }}><a href="#" style={{ fontSize:13, color:'rgba(255,255,255,0.5)', textDecoration:'none', transition:'color 0.15s' }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.color='#fff'} onMouseLeave={e => (e.currentTarget as HTMLElement).style.color='rgba(255,255,255,0.5)'}>{l}</a></div>
              ))}
            </div>
            {/* Solutions */}
            <div>
              <div style={{ fontSize:11, fontWeight:700, letterSpacing:'1.2px', textTransform:'uppercase', color:'rgba(255,255,255,0.3)', marginBottom:16 }}>Solutions</div>
              {['Logistics & Freight','Last-Mile Delivery','Construction Fleet','Public Sector','Cold Chain','Field Services'].map(l => (
                <div key={l} style={{ marginBottom:9 }}><a href="#" style={{ fontSize:13, color:'rgba(255,255,255,0.5)', textDecoration:'none', transition:'color 0.15s' }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.color='#fff'} onMouseLeave={e => (e.currentTarget as HTMLElement).style.color='rgba(255,255,255,0.5)'}>{l}</a></div>
              ))}
            </div>
            {/* Company */}
            <div>
              <div style={{ fontSize:11, fontWeight:700, letterSpacing:'1.2px', textTransform:'uppercase', color:'rgba(255,255,255,0.3)', marginBottom:16 }}>Company</div>
              {['About Us','Customers','Partners','Blog','Careers','Contact'].map(l => (
                <div key={l} style={{ marginBottom:9 }}><a href="#" style={{ fontSize:13, color:'rgba(255,255,255,0.5)', textDecoration:'none', transition:'color 0.15s' }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.color='#fff'} onMouseLeave={e => (e.currentTarget as HTMLElement).style.color='rgba(255,255,255,0.5)'}>{l}</a></div>
              ))}
            </div>
            {/* Legal */}
            <div>
              <div style={{ fontSize:11, fontWeight:700, letterSpacing:'1.2px', textTransform:'uppercase', color:'rgba(255,255,255,0.3)', marginBottom:16 }}>Legal</div>
              {['Privacy Policy','Terms of Service','Cookie Policy','DPA','Security','SLA'].map(l => (
                <div key={l} style={{ marginBottom:9 }}><a href="#" style={{ fontSize:13, color:'rgba(255,255,255,0.5)', textDecoration:'none', transition:'color 0.15s' }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.color='#fff'} onMouseLeave={e => (e.currentTarget as HTMLElement).style.color='rgba(255,255,255,0.5)'}>{l}</a></div>
              ))}
            </div>
          </div>

          {/* Bottom bar */}
          <div style={{ borderTop:'1px solid rgba(255,255,255,0.07)', paddingTop:24, display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
            <span style={{ fontSize:12 }}>© {new Date().getFullYear()} FleetOS Pro. All rights reserved. Fleet intelligence, redefined.</span>
            <div style={{ display:'flex', gap:12 }}>
              {[['SOC 2','#7c3aed'],['ISO 27001','#2563eb'],['GDPR','#16a34a']].map(([b,c]) => (
                <span key={b} style={{ fontSize:10, fontWeight:700, padding:'3px 8px', borderRadius:4, border:`1px solid ${c}40`, color:`${c}cc`, letterSpacing:'0.5px' }}>{b}</span>
              ))}
            </div>
            <Link href="/login" style={{ fontSize:12, color:'#c4912a', textDecoration:'none', fontWeight:600, display:'flex', alignItems:'center', gap:5 }}>
              Launch Platform <i className="ti ti-arrow-right" style={{ fontSize:12 }}/>
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
