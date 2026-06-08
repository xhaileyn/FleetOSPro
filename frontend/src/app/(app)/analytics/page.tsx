'use client';
import { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useAnalyticsData } from '@/hooks/useAnalyticsData';

type View      = 'operations' | 'financial' | 'sales';
type Period    = 'week' | 'month' | 'quarter';
type FinPeriod = 'monthly' | 'quarterly' | 'yearly';
type SalePeriod = 'monthly' | 'quarterly' | 'yearly';

/* ── micro SVG components ─────────────────────────────────────────────────── */

function Sparkline({ data }: { data: number[] }) {
  const W = 56, H = 26;
  const max = Math.max(...data), min = Math.min(...data), rng = max - min || 1;
  const pts = data.map((v, i) =>
    `${((i / (data.length - 1)) * W).toFixed(1)},${(H - 2 - ((v - min) / rng) * (H - 4)).toFixed(1)}`
  ).join(' ');
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} preserveAspectRatio="none">
      <polygon points={`0,${H} ${pts} ${W},${H}`} fill="#c4912a" opacity={0.14} />
      <polyline points={pts} fill="none" stroke="#c4912a" strokeWidth={1.5}
        strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

function TrendLine({ data }: { data: number[] }) {
  const W = 480, H = 88;
  const max = Math.max(...data), min = Math.min(...data), rng = max - min || 1;
  const pts = data.map((v, i) =>
    `${((i / (data.length - 1)) * W).toFixed(1)},${(H - 3 - ((v - min) / rng) * (H - 6)).toFixed(1)}`
  ).join(' ');
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 88 }} preserveAspectRatio="none">
      <defs>
        <linearGradient id="tlg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#c4912a" stopOpacity={0.22} />
          <stop offset="100%" stopColor="#c4912a" stopOpacity={0} />
        </linearGradient>
      </defs>
      <polygon points={`0,${H} ${pts} ${W},${H}`} fill="url(#tlg)" />
      <polyline points={pts} fill="none" stroke="#c4912a" strokeWidth={2}
        strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

function MultiLine({
  series,
  height = 130,
}: {
  series: { values: number[]; color: string; dashed?: boolean }[];
  height?: number;
}) {
  const W = 480, H = height;
  const all = series.flatMap(s => s.values);
  const max = Math.max(...all);
  const rng = max || 1;
  const n   = series[0].values.length;
  const xf  = n > 1 ? W / (n - 1) : 0;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height }} preserveAspectRatio="none">
      <defs>
        {series.map((s, i) => (
          <linearGradient key={i} id={`mlg${i}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor={s.color} stopOpacity={s.dashed ? 0 : 0.16} />
            <stop offset="100%" stopColor={s.color} stopOpacity={0} />
          </linearGradient>
        ))}
      </defs>
      {series.map((s, si) => {
        const pts = s.values.map((v, i) =>
          `${(i * xf).toFixed(1)},${(H - 3 - (v / rng) * (H - 6)).toFixed(1)}`
        ).join(' ');
        return (
          <g key={si}>
            {!s.dashed && (
              <polygon points={`0,${H} ${pts} ${W},${H}`} fill={`url(#mlg${si})`} />
            )}
            <polyline points={pts} fill="none" stroke={s.color} strokeWidth={si === 0 ? 2.5 : 1.8}
              strokeLinejoin="round" strokeLinecap="round"
              strokeDasharray={s.dashed ? '5,4' : undefined} />
          </g>
        );
      })}
    </svg>
  );
}

function ScoreRing({ v, size = 42 }: { v: number; size?: number }) {
  const r = size / 2 - 4;
  const c = 2 * Math.PI * r;
  const col = v >= 90 ? '#16a34a' : v >= 75 ? '#c4912a' : v >= 60 ? '#d97706' : '#dc2626';
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--cream3)" strokeWidth={3.5} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={col} strokeWidth={3.5}
        strokeDasharray={`${(v / 100) * c} ${c}`} strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`} />
      <text x={size / 2} y={size / 2 + 1} textAnchor="middle" dominantBaseline="middle"
        fontSize={size * 0.23} fontWeight={700} fill={col}>{v}</text>
    </svg>
  );
}

function DeltaTag({ delta, unit, goodUp }: { delta: number; unit: string; goodUp: boolean }) {
  if (delta === 0) return <span style={{ fontSize: 10, color: 'var(--ink3)' }}>— no change</span>;
  const good = goodUp ? delta > 0 : delta < 0;
  return (
    <span style={{ fontSize: 10, color: good ? '#16a34a' : '#dc2626', fontWeight: 500 }}>
      {delta > 0 ? '↑' : '↓'} {Math.abs(delta)}{unit} vs prev
    </span>
  );
}

function fmtK(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000)     return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n}`;
}

/* ══════════════════════════════════════════════════════════════════════════
   OPERATIONS DATA
══════════════════════════════════════════════════════════════════════════ */

const TRENDS: Record<Period, number[]> = {
  week:    [28, 44, 58, 42, 51, 63, 71],
  month:   [45,52,60,48,55,70,75,72,65,58,62,78,70,60,74,80,76,72,84,70,78,86,80,88,76,82,90,84,76,72],
  quarter: [48,55,63,70,65,72,78,82,75,80,85,88,82,76,84,90,86,92,88,82,88,94,90,96,88,92,98,94,86,84],
};
const X_LABELS: Record<Period, string[]> = {
  week:    ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
  month:   ['Day 1','Day 10','Day 20','Day 30'],
  quarter: ['Wk 1','Wk 5','Wk 9','Wk 13'],
};

interface KPIRow { label: string; value: string; delta: number; unit: string; goodUp: boolean; spark: number[] }
const KPIS: Record<Period, KPIRow[]> = {
  week: [
    { label:'Total trips',       value:'345',        delta:12,  unit:'%',  goodUp:true, spark:[28,44,58,42,51,63,71] },
    { label:'Distance covered',  value:'28,450 km',  delta:8,   unit:'%',  goodUp:true, spark:[34,52,70,50,61,76,85] },
    { label:'Fleet utilization', value:'78%',        delta:3,   unit:'pp', goodUp:true, spark:[62,68,74,68,74,78,80] },
    { label:'Fuel efficiency',   value:'9.2 km/L',   delta:4,   unit:'%',  goodUp:true, spark:[8.4,8.7,9.0,8.9,9.1,9.2,9.3] },
    { label:'On-time rate',      value:'91.3%',      delta:-1,  unit:'pp', goodUp:true, spark:[93,92,91,90,91,91,91] },
    { label:'Driver avg score',  value:'87 / 100',   delta:2,   unit:'%',  goodUp:true, spark:[82,83,84,85,85,86,87] },
  ],
  month: [
    { label:'Total trips',       value:'1,420',       delta:9,  unit:'%',  goodUp:true, spark:[115,128,136,122,130,142,148] },
    { label:'Distance covered',  value:'118,200 km',  delta:11, unit:'%',  goodUp:true, spark:[3400,3800,4100,3600,3900,4200,4400] },
    { label:'Fleet utilization', value:'76%',         delta:2,  unit:'pp', goodUp:true, spark:[68,70,72,70,72,74,76] },
    { label:'Fuel efficiency',   value:'9.0 km/L',    delta:2,  unit:'%',  goodUp:true, spark:[8.5,8.7,8.9,8.8,8.9,9.0,9.0] },
    { label:'On-time rate',      value:'89.5%',       delta:-2, unit:'pp', goodUp:true, spark:[92,91,90,90,89,89,89] },
    { label:'Driver avg score',  value:'86 / 100',    delta:1,  unit:'%',  goodUp:true, spark:[83,84,84,85,85,85,86] },
  ],
  quarter: [
    { label:'Total trips',       value:'4,280',        delta:15, unit:'%',  goodUp:true, spark:[980,1020,1080,1040,1080,1120,1140] },
    { label:'Distance covered',  value:'356,800 km',   delta:18, unit:'%',  goodUp:true, spark:[10200,10800,11400,10900,11200,11800,12100] },
    { label:'Fleet utilization', value:'75%',          delta:5,  unit:'pp', goodUp:true, spark:[64,66,68,70,70,72,74] },
    { label:'Fuel efficiency',   value:'9.4 km/L',     delta:7,  unit:'%',  goodUp:true, spark:[8.6,8.8,9.0,9.1,9.2,9.3,9.4] },
    { label:'On-time rate',      value:'90.1%',        delta:3,  unit:'pp', goodUp:true, spark:[88,88,89,89,90,90,90] },
    { label:'Driver avg score',  value:'88 / 100',     delta:4,  unit:'%',  goodUp:true, spark:[82,83,84,85,86,87,88] },
  ],
};
const TOTALS: Record<Period,{trips:number;dist:string;util:number}> = {
  week:    {trips:345,   dist:'28,450',   util:78},
  month:   {trips:1420,  dist:'118,200',  util:76},
  quarter: {trips:4280,  dist:'356,800',  util:75},
};
const VEHICLES: Record<Period,{id:string;fuel:number;km:number}[]> = {
  week:    [{id:'ABC-001A',km:1240,fuel:180},{id:'ABC-002B',km:1580,fuel:210},{id:'ABC-003C',km:980,fuel:145},{id:'ABC-004D',km:620,fuel:95},{id:'ABC-005E',km:1120,fuel:165},{id:'ABC-006F',km:860,fuel:130}],
  month:   [{id:'ABC-001A',km:4800,fuel:720},{id:'ABC-002B',km:5900,fuel:840},{id:'ABC-003C',km:3900,fuel:580},{id:'ABC-004D',km:2400,fuel:380},{id:'ABC-005E',km:4400,fuel:660},{id:'ABC-006F',km:3400,fuel:520}],
  quarter: [{id:'ABC-001A',km:14800,fuel:2160},{id:'ABC-002B',km:17400,fuel:2520},{id:'ABC-003C',km:11600,fuel:1740},{id:'ABC-004D',km:7200,fuel:1140},{id:'ABC-005E',km:13200,fuel:1980},{id:'ABC-006F',km:10200,fuel:1560}],
};
const DRIVERS: Record<Period,{name:string;score:number;trips:number;dist:string}[]> = {
  week:    [{name:'James M.',score:94,trips:47,dist:'3,420 km'},{name:'Sarah K.',score:91,trips:52,dist:'3,810 km'},{name:'Peter O.',score:88,trips:39,dist:'2,950 km'},{name:'Grace N.',score:85,trips:44,dist:'3,210 km'},{name:'David W.',score:79,trips:36,dist:'2,740 km'}],
  month:   [{name:'James M.',score:93,trips:182,dist:'13,240 km'},{name:'Sarah K.',score:90,trips:198,dist:'14,920 km'},{name:'Peter O.',score:87,trips:155,dist:'11,400 km'},{name:'Grace N.',score:84,trips:168,dist:'12,450 km'},{name:'David W.',score:78,trips:141,dist:'10,680 km'}],
  quarter: [{name:'James M.',score:92,trips:540,dist:'39,800 km'},{name:'Sarah K.',score:89,trips:592,dist:'44,200 km'},{name:'Peter O.',score:86,trips:462,dist:'33,900 km'},{name:'Grace N.',score:83,trips:505,dist:'37,600 km'},{name:'David W.',score:77,trips:421,dist:'31,400 km'}],
};
const ALERTS: Record<Period,{label:string;count:number;color:string}[]> = {
  week:    [{label:'Speeding',count:142,color:'#ef4444'},{label:'Harsh braking',count:89,color:'#f97316'},{label:'Idle time',count:51,color:'#eab308'},{label:'Geofence exit',count:34,color:'#8b5cf6'},{label:'Other',count:18,color:'#94a3b8'}],
  month:   [{label:'Speeding',count:562,color:'#ef4444'},{label:'Harsh braking',count:341,color:'#f97316'},{label:'Idle time',count:198,color:'#eab308'},{label:'Geofence exit',count:134,color:'#8b5cf6'},{label:'Other',count:72,color:'#94a3b8'}],
  quarter: [{label:'Speeding',count:1680,color:'#ef4444'},{label:'Harsh braking',count:1024,color:'#f97316'},{label:'Idle time',count:594,color:'#eab308'},{label:'Geofence exit',count:401,color:'#8b5cf6'},{label:'Other',count:215,color:'#94a3b8'}],
};
const SPEEDS = [
  {range:'0–30',  pct:8,  safe:true},{range:'31–50', pct:22,safe:true},
  {range:'51–70', pct:41, safe:true},{range:'71–90', pct:24,safe:true},
  {range:'91–110',pct:4,  safe:false},{range:'110+', pct:1, safe:false},
];
const FLEET_STATUS = [
  {label:'On route',  count:28,color:'#16a34a'},{label:'Idle',      count:7, color:'#d97706'},
  {label:'Offline',   count:4, color:'#94a3b8'},{label:'In service',count:2, color:'#0891b2'},
];
const TOTAL_FLEET = 41;

const OPS_INSIGHTS: Record<Period,{icon:string;title:string;body:string;bg:string;bd:string}[]> = {
  week: [
    {icon:'🔥',title:'ABC-002B highest consumption',body:'210L this week — 30% above fleet average. Consider a maintenance check or reassign to lighter routes.',bg:'#fef2f2',bd:'#fca5a5'},
    {icon:'⭐',title:'James M. top driver this week',body:'94 safety score across 47 trips — on track for the monthly performance bonus.',bg:'#f0fdf4',bd:'#86efac'},
    {icon:'⚡',title:'5% over-speed events above 75 mph',body:'Concentrated on Route 7 and I-95 corridor. Targeted coaching recommended for 3 drivers.',bg:'#fffbeb',bd:'#fcd34d'},
  ],
  month: [
    {icon:'📉',title:'On-time rate dipped 2pp this month',body:'89.5% vs 91.5% last month. Traffic congestion on Route 3 is the primary contributor.',bg:'#fef2f2',bd:'#fca5a5'},
    {icon:'⭐',title:'Sarah K. most productive this month',body:'198 trips and 14,920 km with a 90 safety score — fleet-leading output.',bg:'#f0fdf4',bd:'#86efac'},
    {icon:'⛽',title:'Fuel efficiency stable at 9.0 km/L',body:'Up 2% from last month. ABC-003C leads at 9.8 km/L — eco-driving recognised.',bg:'#eff6ff',bd:'#93c5fd'},
  ],
  quarter: [
    {icon:'📈',title:'Fleet utilization up 5pp quarter-on-quarter',body:'75% active utilization. Expansion onto 5 new routes contributed to the gains.',bg:'#f0fdf4',bd:'#86efac'},
    {icon:'🛡',title:'Harsh braking events down 12%',body:'Safety coaching deployed in Month 2 has measurably reduced harsh braking incidents.',bg:'#eff6ff',bd:'#93c5fd'},
    {icon:'⛽',title:'Fuel efficiency up 7% to 9.4 km/L',body:'Route optimisation and eco-driving programmes are paying off. Best quarter on record.',bg:'#fefce8',bd:'#fde047'},
  ],
};

/* ══════════════════════════════════════════════════════════════════════════
   FINANCIAL DATA
══════════════════════════════════════════════════════════════════════════ */

interface FinPoint {
  label:      string;
  revenue:    number;   // gross revenue
  cellular:   number;   // paid to cellular/telco companies
  opsCost:    number;   // other operating costs (fuel, maintenance, platform)
  vehicles:   number;   // active vehicles this period
}

const FIN_DATA: Record<FinPeriod, FinPoint[]> = {
  monthly: [
    {label:'Jul 24', revenue:19800,  cellular:1820, opsCost:3640,  vehicles:36},
    {label:'Aug 24', revenue:20600,  cellular:1880, opsCost:3780,  vehicles:37},
    {label:'Sep 24', revenue:21400,  cellular:1950, opsCost:3920,  vehicles:37},
    {label:'Oct 24', revenue:22100,  cellular:2020, opsCost:4060,  vehicles:38},
    {label:'Nov 24', revenue:22800,  cellular:2080, opsCost:4180,  vehicles:39},
    {label:'Dec 24', revenue:23600,  cellular:2150, opsCost:4320,  vehicles:39},
    {label:'Jan 25', revenue:22400,  cellular:2060, opsCost:4100,  vehicles:39},
    {label:'Feb 25', revenue:23200,  cellular:2120, opsCost:4240,  vehicles:40},
    {label:'Mar 25', revenue:24100,  cellular:2190, opsCost:4410,  vehicles:40},
    {label:'Apr 25', revenue:24850,  cellular:2260, opsCost:4550,  vehicles:40},
    {label:'May 25', revenue:25700,  cellular:2330, opsCost:4700,  vehicles:41},
    {label:'Jun 25', revenue:26600,  cellular:2410, opsCost:4860,  vehicles:41},
  ],
  quarterly: [
    {label:'Q1 23', revenue:52000,  cellular:4800, opsCost:10200, vehicles:32},
    {label:'Q2 23', revenue:56000,  cellular:5100, opsCost:10900, vehicles:33},
    {label:'Q3 23', revenue:60000,  cellular:5450, opsCost:11600, vehicles:35},
    {label:'Q4 23', revenue:64000,  cellular:5820, opsCost:12300, vehicles:36},
    {label:'Q1 24', revenue:66400,  cellular:6070, opsCost:12780, vehicles:38},
    {label:'Q2 24', revenue:70200,  cellular:6350, opsCost:13400, vehicles:39},
    {label:'Q3 24', revenue:63800,  cellular:5850, opsCost:12240, vehicles:38},
    {label:'Q4 24', revenue:68400,  cellular:6250, opsCost:13060, vehicles:39},
    {label:'Q1 25', revenue:69700,  cellular:6370, opsCost:13350, vehicles:40},
    {label:'Q2 25', revenue:76350,  cellular:7000, opsCost:14110, vehicles:41},
  ],
  yearly: [
    {label:'2021', revenue:168000,  cellular:15400, opsCost:32800, vehicles:28},
    {label:'2022', revenue:212000,  cellular:19200, opsCost:40200, vehicles:33},
    {label:'2023', revenue:232000,  cellular:21170, opsCost:45000, vehicles:36},
    {label:'2024', revenue:268800,  cellular:24490, opsCost:51780, vehicles:39},
    {label:'2025', revenue:302400,  cellular:27680, opsCost:56580, vehicles:41},
  ],
};

const CELLULAR_CARRIERS = [
  {name:'AT&T',          pct:42, color:'#16a34a'},
  {name:'Verizon',       pct:31, color:'#dc2626'},
  {name:'T-Mobile US',   pct:17, color:'#c4912a'},
  {name:'Roaming / Int', pct:10, color:'#f97316'},
];

const REV_STREAMS = [
  {label:'Vehicle subscriptions',color:'#c4912a',pct:62},
  {label:'Driver management',    color:'#c4912a',pct:18},
  {label:'API & integrations',   color:'#c4912a',pct:11},
  {label:'Support & SLA',        color:'#d97706',pct:6 },
  {label:'Overage charges',      color:'#94a3b8',pct:3 },
];

const FIN_INSIGHTS: Record<FinPeriod,{icon:string;title:string;body:string;bg:string;bd:string}[]> = {
  monthly: [
    {icon:'📈',title:'Revenue up 3.5% month-on-month',body:'$26,600 in June — driven by adding 1 new vehicle and full-month billing of April activations.',bg:'#f0fdf4',bd:'#86efac'},
    {icon:'📡',title:'Cellular costs at 9.1% of revenue',body:'Within target (<10%). AT&T data plan renegotiation saved $180 vs May rates.',bg:'#eff6ff',bd:'#93c5fd'},
    {icon:'💰',title:'Net margin 63.8% — best in 12 months',body:'$16,980 net after all costs. Improved route density reduced per-trip connectivity spend.',bg:'#fefce8',bd:'#fde047'},
  ],
  quarterly: [
    {icon:'📈',title:'Q2 2025 highest revenue quarter',body:'$76,350 — 9.1% above Q1. Fleet expansion to 41 vehicles and new API tier contributed.',bg:'#f0fdf4',bd:'#86efac'},
    {icon:'📡',title:'Cellular costs grew slower than revenue',body:'Telco costs up 9.9% while revenue grew 26.5% year-on-year. Bundle negotiations working.',bg:'#eff6ff',bd:'#93c5fd'},
    {icon:'⚠️',title:'Q3 2024 revenue dip — investigate',body:'Revenue fell to $63,800 vs $70,200 in Q2. Linked to vehicle downtime and 2 contract pauses.',bg:'#fef2f2',bd:'#fca5a5'},
  ],
  yearly: [
    {icon:'🚀',title:'42.9% revenue CAGR over 4 years',body:'From $168K in 2021 to $302K in 2025. Fleet growth from 28 to 41 vehicles is the primary driver.',bg:'#f0fdf4',bd:'#86efac'},
    {icon:'📡',title:'Cellular cost ratio stable at ~9.1%',body:'Telco spend grew proportionally with fleet — bundle pricing has kept the ratio consistent.',bg:'#eff6ff',bd:'#93c5fd'},
    {icon:'💰',title:'2025 ARR tracking at $302,400',body:'On track to close the year at $302K+. 5 vehicle expansion planned for Q4 adds ~$15K ARR.',bg:'#fefce8',bd:'#fde047'},
  ],
};

/* ══════════════════════════════════════════════════════════════════════════
   SALES DATA
══════════════════════════════════════════════════════════════════════════ */

interface SalePoint {
  label:       string;
  newContracts: number;
  renewals:    number;
  churned:     number;
  pipeline:    number;   // $K
  revenue:     number;   // $K closed-won
}

const SALE_DATA: Record<SalePeriod, SalePoint[]> = {
  monthly: [
    {label:'Jul 24', newContracts:4,  renewals:31, churned:1, pipeline:38,  revenue:18.2},
    {label:'Aug 24', newContracts:5,  renewals:32, churned:1, pipeline:41,  revenue:19.1},
    {label:'Sep 24', newContracts:3,  renewals:33, churned:0, pipeline:36,  revenue:18.8},
    {label:'Oct 24', newContracts:6,  renewals:33, churned:1, pipeline:44,  revenue:20.4},
    {label:'Nov 24', newContracts:4,  renewals:34, churned:0, pipeline:40,  revenue:20.9},
    {label:'Dec 24', newContracts:7,  renewals:35, churned:2, pipeline:52,  revenue:22.1},
    {label:'Jan 25', newContracts:3,  renewals:35, churned:1, pipeline:38,  revenue:20.6},
    {label:'Feb 25', newContracts:5,  renewals:36, churned:0, pipeline:45,  revenue:21.8},
    {label:'Mar 25', newContracts:6,  renewals:37, churned:1, pipeline:50,  revenue:23.2},
    {label:'Apr 25', newContracts:5,  renewals:37, churned:0, pipeline:48,  revenue:23.9},
    {label:'May 25', newContracts:8,  renewals:38, churned:1, pipeline:58,  revenue:25.1},
    {label:'Jun 25', newContracts:6,  renewals:39, churned:0, pipeline:54,  revenue:26.0},
  ],
  quarterly: [
    {label:'Q1 23', newContracts:10, renewals:88,  churned:3, pipeline:95,  revenue:48},
    {label:'Q2 23', newContracts:12, renewals:90,  churned:2, pipeline:108, revenue:52},
    {label:'Q3 23', newContracts:14, renewals:92,  churned:4, pipeline:118, revenue:56},
    {label:'Q4 23', newContracts:16, renewals:95,  churned:3, pipeline:130, revenue:61},
    {label:'Q1 24', newContracts:13, renewals:98,  churned:2, pipeline:122, revenue:62},
    {label:'Q2 24', newContracts:18, renewals:100, churned:3, pipeline:148, revenue:68},
    {label:'Q3 24', newContracts:12, renewals:99,  churned:5, pipeline:112, revenue:60},
    {label:'Q4 24', newContracts:17, renewals:102, churned:2, pipeline:144, revenue:66},
    {label:'Q1 25', newContracts:14, renewals:104, churned:1, pipeline:136, revenue:65},
    {label:'Q2 25', newContracts:22, renewals:107, churned:2, pipeline:172, revenue:76},
  ],
  yearly: [
    {label:'2021', newContracts:28, renewals:220, churned:12, pipeline:240, revenue:158},
    {label:'2022', newContracts:42, renewals:268, churned:10, pipeline:310, revenue:200},
    {label:'2023', newContracts:52, renewals:295, churned:12, pipeline:368, revenue:218},
    {label:'2024', newContracts:60, renewals:324, churned:13, pipeline:416, revenue:256},
    {label:'2025', newContracts:74, renewals:352, churned:8,  pipeline:492, revenue:302},
  ],
};

const FUNNEL_STAGES = [
  {label:'Leads',      value:284, color:'#6366f1'},
  {label:'Qualified',  value:142, color:'#0ea5e9'},
  {label:'Proposal',   value:68,  color:'#c4912a'},
  {label:'Negotiation',value:31,  color:'#f59e0b'},
  {label:'Closed Won', value:19,  color:'#16a34a'},
];

const SALE_CHANNELS = [
  {label:'Direct sales',   pct:45, color:'#c4912a'},
  {label:'Partner network',pct:28, color:'#6366f1'},
  {label:'Inbound / Web',  pct:18, color:'#0ea5e9'},
  {label:'Referral',       pct:9,  color:'#f59e0b'},
];

interface SaleRep { name:string; deals:number; revenue:number; quota:number; conv:number }
const SALE_REPS: SaleRep[] = [
  {name:'Alice Njoroge',  deals:14, revenue:62400,  quota:60000, conv:38},
  {name:'Brian Odhiambo', deals:11, revenue:49800,  quota:55000, conv:31},
  {name:'Carol Wanjiru',  deals:9,  revenue:41200,  quota:45000, conv:29},
  {name:'David Kamau',    deals:8,  revenue:36500,  quota:40000, conv:26},
  {name:'Eve Achieng',    deals:6,  revenue:28900,  quota:35000, conv:22},
];

const PLAN_MIX = [
  {label:'Enterprise',  arr:124000, vehicles:14, color:'#6366f1'},
  {label:'Business',    arr:108000, vehicles:18, color:'#c4912a'},
  {label:'Starter',     arr:48000,  vehicles:7,  color:'#0ea5e9'},
  {label:'Custom',      arr:22400,  vehicles:2,  color:'#f59e0b'},
];

const SALE_INSIGHTS: Record<SalePeriod,{icon:string;title:string;body:string;bg:string;bd:string}[]> = {
  monthly: [
    {icon:'🏆',title:'June best new-contract month in H1',body:'6 new contracts closed in June — 20% above the monthly average. Direct sales team lead by Alice.',bg:'#f0fdf4',bd:'#86efac'},
    {icon:'🔄',title:'Zero churn in Feb, Apr, Jun',body:'Three churn-free months this year. Onboarding improvements and quarterly reviews are reducing early cancellations.',bg:'#eff6ff',bd:'#93c5fd'},
    {icon:'📊',title:'Pipeline $54K — 2.1× monthly target',body:'Healthy pipeline coverage. 8 proposals in negotiation stage expected to close within 30 days.',bg:'#fefce8',bd:'#fde047'},
  ],
  quarterly: [
    {icon:'🚀',title:'Q2 2025 — record new contracts (22)',body:'22 new contracts in Q2, up 57% from Q1. Partner channel now accounts for 34% of new business.',bg:'#f0fdf4',bd:'#86efac'},
    {icon:'⚠️',title:'Q3 2024 churn spike — investigate',body:'5 churns in Q3 2024 — highest in 2 years. Linked to a competitor pricing promotion. Retention package deployed.',bg:'#fef2f2',bd:'#fca5a5'},
    {icon:'📈',title:'Win rate improving — 28% in Q2 2025',body:'Up from 22% in Q1. Shorter proposal review cycle and new ROI calculator contributed.',bg:'#eff6ff',bd:'#93c5fd'},
  ],
  yearly: [
    {icon:'📈',title:'New contracts up 164% since 2021',body:'28 new deals in 2021 to 74 in 2025. Partner network expansion and inbound marketing are key drivers.',bg:'#f0fdf4',bd:'#86efac'},
    {icon:'🛡',title:'Churn rate declining — 2.6% in 2025',body:'Down from 4.3% in 2021. Customer success programme and annual contract incentives are working.',bg:'#eff6ff',bd:'#93c5fd'},
    {icon:'💰',title:'ARR $302K — on track for $350K by year-end',body:'Q4 expansion of 5 vehicles plus 3 pipeline enterprise deals expected to add $48K ARR.',bg:'#fefce8',bd:'#fde047'},
  ],
};

/* ══════════════════════════════════════════════════════════════════════════
   PAGE
══════════════════════════════════════════════════════════════════════════ */

export default function AnalyticsPage() {
  const { user }     = useAuthStore();
  const tenantId     = user?.tenantId ?? '1';

  const [view,       setView]       = useState<View>('operations');
  const [period,     setPeriod]     = useState<Period>('week');
  const [finPeriod,  setFinPeriod]  = useState<FinPeriod>('monthly');
  const [salePeriod, setSalePeriod] = useState<SalePeriod>('monthly');

  /* ── Fetch from data warehouse (falls back to hardcoded if DB unavailable) ── */
  const { ops: dbOps, fin: dbFin, sale: dbSale, config: dbCfg, loading: dbLoading } =
    useAnalyticsData(tenantId, period, finPeriod, salePeriod);

  /* ── operations — DB first, hardcoded fallback ── */
  const kpis     = dbOps?.kpis     ?? KPIS[period];
  const trend    = dbOps?.trend    ?? TRENDS[period];
  const totals   = dbOps?.totals   ?? TOTALS[period];
  const alerts   = dbOps?.alerts   ?? ALERTS[period];
  const xLabels  = dbOps?.xLabels  ?? X_LABELS[period];
  const fleetSt  = dbOps?.fleetStatus ?? FLEET_STATUS;
  const totalFlt = dbOps?.totalFleet  ?? TOTAL_FLEET;
  const vehicles   = dbCfg?.vehicles   ?? VEHICLES[period];
  const drivers    = dbCfg?.drivers    ?? DRIVERS[period];
  const speeds     = dbCfg?.speeds     ?? SPEEDS;
  const opsInsights = dbCfg?.insights  ?? OPS_INSIGHTS[period];
  const alertTotal = alerts.reduce((s,a)=>s+a.count,0);
  const maxFuel    = Math.max(...vehicles.map(v=>v.fuel));

  /* ── sales — DB first, hardcoded fallback ── */
  const saleRows          = dbSale?.rows     ?? SALE_DATA[salePeriod];
  const saleSum           = dbSale?.summary;
  const sLatest           = saleRows[saleRows.length - 1];
  const sPrev             = saleRows[saleRows.length - 2];
  const totalNewContracts = saleSum?.totalNewContracts ?? saleRows.reduce((s,r)=>s+r.newContracts,0);
  const totalRenewals     = saleSum?.totalRenewals     ?? saleRows.reduce((s,r)=>s+r.renewals,0);
  const totalChurned      = saleSum?.totalChurned      ?? saleRows.reduce((s,r)=>s+r.churned,0);
  const totalSaleRevenue  = saleRows.reduce((s,r)=>s+r.revenue,0);
  const avgDealSize       = saleSum?.avgDealSize ?? Math.round((totalSaleRevenue * 1000) / Math.max(totalNewContracts,1));
  const netContracts      = saleSum?.netContracts ?? (totalNewContracts - totalChurned);
  const churnRate         = saleSum?.churnRate    ?? Math.round((totalChurned / Math.max(totalRenewals,1)) * 100 * 10) / 10;
  const funnelStages  = dbCfg?.funnelStages  ?? FUNNEL_STAGES;
  const saleChannels  = dbCfg?.saleChannels  ?? SALE_CHANNELS;
  const saleReps      = dbCfg?.salesReps     ?? SALE_REPS;
  const planMix       = dbCfg?.planMix       ?? PLAN_MIX;
  const saleInsights  = dbCfg?.insights      ?? SALE_INSIGHTS[salePeriod];
  const convRate      = funnelStages.length >= 2
    ? Math.round((funnelStages[funnelStages.length-1].value / funnelStages[0].value) * 100 * 10) / 10
    : Math.round((FUNNEL_STAGES[4].value / FUNNEL_STAGES[0].value) * 100 * 10) / 10;
  const revDeltaSale  = saleSum?.revDelta ?? (sPrev ? Math.round(((sLatest.revenue - sPrev.revenue) / sPrev.revenue) * 100) : 0);
  const funnelMax     = funnelStages[0]?.value ?? FUNNEL_STAGES[0].value;
  const totalARR      = planMix.reduce((s,p)=>s+p.arr,0);

  /* ── financial — DB first, hardcoded fallback ── */
  const finRows        = dbFin?.rows          ?? FIN_DATA[finPeriod];
  const finSum         = dbFin?.summary;
  const cellularCarriers = dbCfg?.cellularCarriers ?? CELLULAR_CARRIERS;
  const revStreams      = dbCfg?.revStreams     ?? REV_STREAMS;
  const finInsights    = dbCfg?.insights        ?? FIN_INSIGHTS[finPeriod];
  const latest  = finRows[finRows.length - 1];
  const prev    = finRows[finRows.length - 2];
  const totalRevenue      = finSum?.totalRevenue      ?? finRows.reduce((s,r)=>s+r.revenue,0);
  const totalCellular     = finSum?.totalCellular     ?? finRows.reduce((s,r)=>s+r.cellular,0);
  const totalCost         = finSum?.totalCost         ?? finRows.reduce((s,r)=>s+r.cellular+r.opsCost,0);
  const netIncome         = finSum?.netIncome         ?? (totalRevenue - totalCost);
  const netMarginPct      = finSum?.netMarginPct      ?? Math.round((netIncome / totalRevenue) * 100);
  const revDelta          = finSum?.revDelta          ?? (prev ? Math.round(((latest.revenue - prev.revenue) / prev.revenue) * 100) : 0);
  const cellDelta         = finSum?.cellDelta         ?? (prev ? Math.round(((latest.cellular - prev.cellular) / prev.cellular) * 100) : 0);
  const revenuePerVehicle = finSum?.revenuePerVehicle ?? Math.round(totalRevenue / (latest?.vehicles ?? 1));

  const card: React.CSSProperties = {
    background: '#fff', border: '1px solid var(--border)', borderRadius: 10,
  };

  return (
    <div className="page-in" style={{ padding: '14px 18px', background: 'var(--cream,#f8fafc)', minHeight: '100vh' }}>

      {/* ── Hero ───────────────────────────────────────────────────── */}
      <div style={{
        background: 'linear-gradient(135deg, var(--hero-s) 0%, var(--hero-m) 55%, var(--hero-e) 100%)',
        border: '1px solid rgba(196,145,42,0.18)',
        borderRadius: 14,
        padding: '18px 24px',
        marginBottom: 18,
        boxShadow: '0 4px 24px rgba(13,27,42,0.50), inset 0 1px 0 rgba(196,145,42,0.15)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 20,
      }}>
        {/* Left — identity + stats */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 }}>
          {/* Icon chip */}
          <div style={{
            width: 44, height: 44, borderRadius: 10, flexShrink: 0,
            background: 'rgba(196,145,42,0.15)',
            border: '1px solid rgba(196,145,42,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <i className="ti ti-chart-bar" style={{ fontSize: 22, color: '#f5d07a' }} />
          </div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase', color: 'rgba(245,208,122,0.7)', marginBottom: 2 }}>
              Analytics
            </div>
            <h1 style={{ fontSize: 20, fontWeight: 800, color: '#fff', margin: 0 }}>
              {view === 'operations' ? 'Fleet Performance' : view === 'financial' ? 'Financial Overview' : 'Sales Performance'}
            </h1>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>
              {dbLoading
                ? <span style={{ color: '#f5d07a' }}>Loading data warehouse…</span>
                : 'Live from data warehouse'}
            </div>
          </div>

          {/* Stat chips */}
          <div style={{ display: 'flex', gap: 0, marginLeft: 12 }}>
            {[
              { label: 'Fleet',   value: String(totalFlt) },
              { label: 'Drivers', value: String(totalFlt) },
              { label: 'Alerts',  value: String(alertTotal) },
            ].map((s, i) => (
              <div key={s.label} style={{
                textAlign: 'center', padding: '0 14px',
                borderLeft: i > 0 ? '1px solid rgba(196,145,42,0.20)' : '1px solid rgba(196,145,42,0.20)',
              }}>
                <div style={{ fontSize: 17, fontWeight: 700, color: '#fff' }}>{s.value}</div>
                <div style={{ fontSize: 9, color: 'rgba(245,208,122,0.55)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: 0.5 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right — period selector + view toggle */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10, flexShrink: 0 }}>

          {/* Period selector */}
          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(196,145,42,0.18)', borderRadius: 8, overflow: 'hidden' }}>
            {view === 'operations' && (['week','month','quarter'] as Period[]).map(p => (
              <button key={p} onClick={() => setPeriod(p)} style={{
                padding: '6px 14px', border: 'none', cursor: 'pointer', fontSize: 11,
                fontFamily: 'inherit', fontWeight: period === p ? 700 : 400,
                background: period === p ? 'rgba(196,145,42,0.22)' : 'transparent',
                color: period === p ? '#f5d07a' : 'rgba(255,255,255,0.45)',
                borderBottom: period === p ? '2px solid rgba(196,145,42,0.60)' : '2px solid transparent',
                transition: 'all 0.12s',
              }}>
                {p === 'week' ? 'Week' : p === 'month' ? 'Month' : 'Quarter'}
              </button>
            ))}
            {view === 'financial' && (['monthly','quarterly','yearly'] as FinPeriod[]).map(p => (
              <button key={p} onClick={() => setFinPeriod(p)} style={{
                padding: '6px 14px', border: 'none', cursor: 'pointer', fontSize: 11,
                fontFamily: 'inherit', fontWeight: finPeriod === p ? 700 : 400,
                background: finPeriod === p ? 'rgba(196,145,42,0.22)' : 'transparent',
                color: finPeriod === p ? '#f5d07a' : 'rgba(255,255,255,0.45)',
                borderBottom: finPeriod === p ? '2px solid rgba(196,145,42,0.60)' : '2px solid transparent',
                transition: 'all 0.12s',
              }}>
                {p === 'monthly' ? 'Monthly' : p === 'quarterly' ? 'Quarterly' : 'Yearly'}
              </button>
            ))}
            {view === 'sales' && (['monthly','quarterly','yearly'] as SalePeriod[]).map(p => (
              <button key={p} onClick={() => setSalePeriod(p)} style={{
                padding: '6px 14px', border: 'none', cursor: 'pointer', fontSize: 11,
                fontFamily: 'inherit', fontWeight: salePeriod === p ? 700 : 400,
                background: salePeriod === p ? 'rgba(196,145,42,0.22)' : 'transparent',
                color: salePeriod === p ? '#f5d07a' : 'rgba(255,255,255,0.45)',
                borderBottom: salePeriod === p ? '2px solid rgba(196,145,42,0.60)' : '2px solid transparent',
                transition: 'all 0.12s',
              }}>
                {p === 'monthly' ? 'Monthly' : p === 'quarterly' ? 'Quarterly' : 'Yearly'}
              </button>
            ))}
          </div>

          {/* View toggle */}
          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(196,145,42,0.18)', borderRadius: 8, overflow: 'hidden' }}>
            {([
              { v: 'operations' as View, label: 'Operations', icon: 'ti-chart-bar' },
              { v: 'financial'  as View, label: 'Financial',  icon: 'ti-coin' },
              { v: 'sales'      as View, label: 'Sales',       icon: 'ti-shopping-cart' },
            ]).map(({ v, label, icon }) => (
              <button key={v} onClick={() => setView(v)} style={{
                padding: '7px 16px', border: 'none', cursor: 'pointer', fontSize: 12,
                fontFamily: 'inherit', fontWeight: view === v ? 700 : 400,
                background: view === v ? 'rgba(196,145,42,0.20)' : 'transparent',
                color: view === v ? '#f5d07a' : 'rgba(255,255,255,0.45)',
                display: 'flex', alignItems: 'center', gap: 5,
                borderBottom: view === v ? '2px solid rgba(196,145,42,0.55)' : '2px solid transparent',
                transition: 'all 0.12s',
              }}>
                <i className={`ti ${icon}`} style={{ fontSize: 13 }} />
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ════════════════ OPERATIONS VIEW ════════════════ */}
      {view === 'operations' && <>

        {/* KPI row */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(6,1fr)', gap:10, marginBottom:12 }}>
          {kpis.map(k=>(
            <div key={k.label} style={{ ...card, padding:'13px 15px' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:4 }}>
                <div style={{ fontSize:10, fontWeight:600, color:'var(--ink3)', textTransform:'uppercase', letterSpacing:0.5, flex:1, lineHeight:1.3 }}>{k.label}</div>
                <Sparkline data={k.spark}/>
              </div>
              <div style={{ fontSize:20, fontWeight:700, color:'var(--ink)', lineHeight:1.15, marginBottom:3 }}>{k.value}</div>
              <DeltaTag delta={k.delta} unit={k.unit} goodUp={k.goodUp}/>
            </div>
          ))}
        </div>

        {/* Trip trend + fleet status */}
        <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:10, marginBottom:10 }}>
          <div style={{ ...card, padding:'16px 18px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
              <div>
                <div style={{ fontSize:13, fontWeight:600, color:'var(--ink)' }}>Trip volume</div>
                <div style={{ fontSize:11, color:'var(--ink3)' }}>
                  {period==='week'?'Daily trips this week':period==='month'?'30-day trend':'13-week trend'}
                </div>
              </div>
              <div style={{ textAlign:'right' }}>
                <div style={{ fontSize:22, fontWeight:700, color:'#c4912a' }}>{totals.trips.toLocaleString()}</div>
                <div style={{ fontSize:10, color:'var(--ink3)' }}>total trips</div>
              </div>
            </div>
            <TrendLine data={trend}/>
            <div style={{ display:'flex', justifyContent:'space-between', marginTop:4 }}>
              {xLabels.length<=7
                ? xLabels.map(l=><div key={l} style={{ fontSize:9, color:'var(--ink3)' }}>{l}</div>)
                : [xLabels[0],xLabels[Math.floor(xLabels.length/3)],xLabels[Math.floor(xLabels.length*2/3)],xLabels[xLabels.length-1]].map((l,i)=>(
                    <div key={i} style={{ fontSize:9, color:'var(--ink3)' }}>{l}</div>
                  ))
              }
            </div>
          </div>
          <div style={{ ...card, padding:'16px 18px' }}>
            <div style={{ fontSize:13, fontWeight:600, color:'var(--ink)', marginBottom:12 }}>Fleet status now</div>
            <div style={{ display:'flex', flexDirection:'column', gap:9 }}>
              {fleetSt.map(s=>(
                <div key={s.label} style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <span style={{ width:8, height:8, borderRadius:'50%', background:s.color, flexShrink:0 }}/>
                  <span style={{ fontSize:12, color:'var(--ink2)', flex:1 }}>{s.label}</span>
                  <span style={{ fontSize:13, fontWeight:700, color:'var(--ink)' }}>{s.count}</span>
                  <div style={{ width:50, height:5, background:'var(--cream3)', borderRadius:3 }}>
                    <div style={{ width:`${(s.count/totalFlt)*100}%`, height:'100%', background:s.color, borderRadius:3 }}/>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ marginTop:14, padding:'10px 12px', background:'rgba(196,145,42,0.10)', borderRadius:8, display:'flex', alignItems:'center', gap:10 }}>
              <div>
                <div style={{ fontSize:20, fontWeight:700, color:'#c4912a' }}>{totals.util}%</div>
                <div style={{ fontSize:10, color:'var(--ink3)' }}>Fleet utilization</div>
              </div>
              <div style={{ flex:1 }}>
                <div style={{ height:6, background:'var(--cream3)', borderRadius:3 }}>
                  <div style={{ width:`${totals.util}%`, height:'100%', background:'#c4912a', borderRadius:3 }}/>
                </div>
                <div style={{ fontSize:9, color:'var(--ink3)', marginTop:3 }}>{Math.round(totalFlt*totals.util/100)} of {totalFlt} active</div>
              </div>
            </div>
          </div>
        </div>

        {/* Fuel + drivers */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:10 }}>
          <div style={{ ...card, padding:'16px 18px' }}>
            <div style={{ fontSize:13, fontWeight:600, color:'var(--ink)', marginBottom:2 }}>Fuel consumption by vehicle</div>
            <div style={{ fontSize:11, color:'var(--ink3)', marginBottom:14 }}>Litres used vs distance covered</div>
            <div style={{ display:'flex', flexDirection:'column', gap:11 }}>
              {vehicles.map(v=>{
                const eff=(v.km/v.fuel).toFixed(1);
                return (
                  <div key={v.id}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                      <span style={{ fontSize:11, fontWeight:600, color:'var(--ink2)', fontFamily:'monospace' }}>{v.id}</span>
                      <span style={{ fontSize:10, color:'var(--ink3)' }}>{v.fuel.toLocaleString()}L · {v.km.toLocaleString()} km · <span style={{ color:'#c4912a', fontWeight:600 }}>{eff} km/L</span></span>
                    </div>
                    <div style={{ height:8, background:'var(--cream3)', borderRadius:4, overflow:'hidden' }}>
                      <div style={{ width:`${(v.fuel/maxFuel)*100}%`, height:'100%', background:v.fuel===maxFuel?'#f97316':'#c4912a', borderRadius:4, opacity:0.85 }}/>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div style={{ ...card, padding:'16px 18px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
              <div style={{ fontSize:13, fontWeight:600, color:'var(--ink)' }}>Driver leaderboard</div>
              <div style={{ fontSize:11, color:'var(--ink3)' }}>Top 5 · by safety score</div>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {drivers.map((dr,i)=>(
                <div key={dr.name} style={{ display:'flex', alignItems:'center', gap:10, padding:'6px 8px', borderRadius:7, background:i===0?'#f0fdf4':'transparent', border:`1px solid ${i===0?'#bbf7d0':'transparent'}` }}>
                  <div style={{ fontSize:12, fontWeight:700, color:i===0?'#16a34a':'var(--ink3)', width:14, textAlign:'center' }}>{i+1}</div>
                  <ScoreRing v={dr.score} size={40}/>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:12, fontWeight:500, color:'var(--ink)' }}>{dr.name}</div>
                    <div style={{ fontSize:10, color:'var(--ink3)' }}>{dr.trips.toLocaleString()} trips · {dr.dist}</div>
                  </div>
                  {i===0 && <span style={{ fontSize:10, background:'#dcfce7', color:'#166534', padding:'2px 7px', borderRadius:10, fontWeight:600 }}>Top</span>}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Alerts + speed */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:10 }}>
          <div style={{ ...card, padding:'16px 18px' }}>
            <div style={{ fontSize:13, fontWeight:600, color:'var(--ink)', marginBottom:2 }}>Alert distribution</div>
            <div style={{ fontSize:11, color:'var(--ink3)', marginBottom:14 }}>{alertTotal.toLocaleString()} alerts · {period==='week'?'this week':period==='month'?'this month':'this quarter'}</div>
            {alerts.map(a=>(
              <div key={a.label} style={{ marginBottom:10 }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                  <span style={{ fontSize:12, color:'var(--ink2)', display:'flex', alignItems:'center', gap:6 }}>
                    <span style={{ width:8, height:8, borderRadius:2, background:a.color, display:'inline-block' }}/>{a.label}
                  </span>
                  <span style={{ fontSize:12, color:'var(--ink)', fontWeight:600 }}>{a.count.toLocaleString()} <span style={{ fontSize:10, color:'var(--ink3)', fontWeight:400 }}>({Math.round(a.count/alertTotal*100)}%)</span></span>
                </div>
                <div style={{ height:7, background:'var(--cream3)', borderRadius:4 }}>
                  <div style={{ width:`${(a.count/alertTotal)*100}%`, height:'100%', background:a.color, borderRadius:4, opacity:0.85 }}/>
                </div>
              </div>
            ))}
          </div>
          <div style={{ ...card, padding:'16px 18px' }}>
            <div style={{ fontSize:13, fontWeight:600, color:'var(--ink)', marginBottom:2 }}>Speed profile</div>
            <div style={{ fontSize:11, color:'var(--ink3)', marginBottom:14 }}>% of total driving time per speed band</div>
            <div style={{ display:'flex', alignItems:'flex-end', gap:8, height:88, marginBottom:6 }}>
              {speeds.map(s=>{
                const color=s.range==='110+'?'#ef4444':s.range==='91–110'?'#f97316':'#c4912a';
                return (
                  <div key={s.range} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:3 }}>
                    <div style={{ fontSize:10, fontWeight:700, color:s.safe?'var(--ink3)':color }}>{s.pct}%</div>
                    <div style={{ width:'100%', background:color, borderRadius:'4px 4px 0 0', height:`${s.pct*2}px`, minHeight:4, opacity:s.safe?0.75:0.9 }}/>
                  </div>
                );
              })}
            </div>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:10 }}>
              {speeds.map(s=><div key={s.range} style={{ flex:1, textAlign:'center', fontSize:9, color:'var(--ink3)' }}>{s.range}</div>)}
            </div>
            <div style={{ display:'flex', gap:18, paddingTop:8, borderTop:'1px solid var(--border)' }}>
              <div style={{ fontSize:11, color:'var(--ink3)' }}><span style={{ fontWeight:700, color:'#16a34a' }}>{speeds.filter(s=>s.safe).reduce((a,s)=>a+s.pct,0)}%</span> within limit</div>
              <div style={{ fontSize:11, color:'var(--ink3)' }}><span style={{ fontWeight:700, color:'#ef4444' }}>{speeds.filter(s=>!s.safe).reduce((a,s)=>a+s.pct,0)}%</span> over 90 km/h</div>
            </div>
          </div>
        </div>

        {/* Insights */}
        <div style={{ ...card, padding:'14px 18px' }}>
          <div style={{ fontSize:13, fontWeight:700, color:'var(--ink)', marginBottom:10 }}>💡 Key insights</div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10 }}>
            {opsInsights.map(ins=>(
              <div key={ins.title} style={{ padding:'11px 13px', background:ins.bg, border:`1px solid ${ins.bd}`, borderRadius:8 }}>
                <div style={{ fontSize:13, marginBottom:5 }}>{ins.icon} <span style={{ fontSize:12, fontWeight:600, color:'var(--ink)' }}>{ins.title}</span></div>
                <div style={{ fontSize:11, color:'var(--ink2)', lineHeight:1.6 }}>{ins.body}</div>
              </div>
            ))}
          </div>
        </div>
      </>}

      {/* ════════════════ FINANCIAL VIEW ════════════════ */}
      {view === 'financial' && <>

        {/* Financial KPI row */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:10, marginBottom:12 }}>
          {[
            {
              label: finPeriod==='monthly'?'Monthly Revenue':finPeriod==='quarterly'?'Quarterly Revenue':'Annual Revenue',
              value: fmtK(latest.revenue),
              sub: `${revDelta>0?'↑':'↓'} ${Math.abs(revDelta)}% vs prev`,
              good: revDelta>=0, accent:'#c4912a',
              spark: finRows.slice(-6).map(r=>r.revenue),
            },
            {
              label: finPeriod==='yearly'?'ARR (est.)':'MRR (run-rate)',
              value: fmtK(finPeriod==='yearly'?latest.revenue:latest.revenue),
              sub: `${latest.vehicles} billable vehicles`,
              good: true, accent:'#c4912a',
              spark: finRows.slice(-6).map(r=>r.revenue*0.95),
            },
            {
              label: 'Cellular costs',
              value: fmtK(latest.cellular),
              sub: `${cellDelta>0?'↑':'↓'} ${Math.abs(cellDelta)}% vs prev · ${Math.round(latest.cellular/latest.revenue*100)}% of rev`,
              good: cellDelta<=0, accent:'#f97316',
              spark: finRows.slice(-6).map(r=>r.cellular),
            },
            {
              label: 'Net income',
              value: fmtK(latest.revenue-latest.cellular-latest.opsCost),
              sub: `${netMarginPct}% net margin`,
              good: netMarginPct>=55, accent: netMarginPct>=60?'#16a34a':netMarginPct>=50?'#d97706':'#dc2626',
              spark: finRows.slice(-6).map(r=>r.revenue-r.cellular-r.opsCost),
            },
            {
              label: 'Revenue per vehicle',
              value: fmtK(Math.round(latest.revenue/latest.vehicles)),
              sub: `${latest.vehicles} active vehicles`,
              good: true, accent:'#c4912a',
              spark: finRows.slice(-6).map(r=>Math.round(r.revenue/r.vehicles)),
            },
          ].map(k=>(
            <div key={k.label} style={{ ...card, padding:'14px 16px', borderTop:`3px solid ${k.accent}` }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:6 }}>
                <div style={{ fontSize:10, fontWeight:600, color:'var(--ink3)', textTransform:'uppercase', letterSpacing:0.5, flex:1, lineHeight:1.3 }}>{k.label}</div>
                <svg viewBox="0 0 56 26" width={56} height={26} preserveAspectRatio="none">
                  {(() => {
                    const d=k.spark; const max=Math.max(...d),min=Math.min(...d),rng=max-min||1;
                    const pts=d.map((v,i)=>`${((i/(d.length-1))*56).toFixed(1)},${(24-((v-min)/rng)*22).toFixed(1)}`).join(' ');
                    return <>
                      <polygon points={`0,26 ${pts} 56,26`} fill={k.accent} opacity={0.12}/>
                      <polyline points={pts} fill="none" stroke={k.accent} strokeWidth={1.5} strokeLinejoin="round"/>
                    </>;
                  })()}
                </svg>
              </div>
              <div style={{ fontSize:22, fontWeight:700, color:'var(--ink)', lineHeight:1.1, marginBottom:4 }}>{k.value}</div>
              <div style={{ fontSize:10, color: k.good?'#16a34a':'#dc2626', fontWeight:500 }}>{k.sub}</div>
            </div>
          ))}
        </div>

        {/* Revenue progression chart */}
        <div style={{ ...card, padding:'18px 20px', marginBottom:10 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:14 }}>
            <div>
              <div style={{ fontSize:13, fontWeight:700, color:'var(--ink)' }}>Revenue vs cost progression</div>
              <div style={{ fontSize:11, color:'var(--ink3)' }}>
                {finPeriod==='monthly'?'Last 12 months':finPeriod==='quarterly'?'Last 10 quarters':'Last 5 years'} · Total revenue {fmtK(totalRevenue)} · Net income {fmtK(netIncome)}
              </div>
            </div>
            {/* Legend */}
            <div style={{ display:'flex', gap:16, flexShrink:0 }}>
              {[
                {color:'#c4912a',  label:'Revenue',     dashed:false},
                {color:'#d97706',  label:'Total costs',  dashed:false},
                {color:'#f97316',  label:'Cellular',     dashed:true },
              ].map(l=>(
                <div key={l.label} style={{ display:'flex', alignItems:'center', gap:5 }}>
                  <svg width={24} height={12}><line x1={0} y1={6} x2={24} y2={6} stroke={l.color} strokeWidth={2} strokeDasharray={l.dashed?'4,3':undefined}/></svg>
                  <span style={{ fontSize:11, color:'var(--ink3)' }}>{l.label}</span>
                </div>
              ))}
            </div>
          </div>

          <MultiLine
            series={[
              {values: finRows.map(r=>r.revenue),              color:'#c4912a'},
              {values: finRows.map(r=>r.cellular+r.opsCost),   color:'#d97706'},
              {values: finRows.map(r=>r.cellular),             color:'#f97316', dashed:true},
            ]}
            height={140}
          />

          {/* x-axis labels */}
          <div style={{ display:'flex', justifyContent:'space-between', marginTop:4 }}>
            {finRows.length<=12
              ? finRows.map(r=><div key={r.label} style={{ fontSize:9, color:'var(--ink3)', textAlign:'center', flex:1 }}>{r.label}</div>)
              : [0,Math.floor(finRows.length/4),Math.floor(finRows.length/2),Math.floor(finRows.length*3/4),finRows.length-1].map(i=>(
                  <div key={i} style={{ fontSize:9, color:'var(--ink3)' }}>{finRows[i].label}</div>
                ))
            }
          </div>

          {/* Period summary bar */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginTop:16, paddingTop:14, borderTop:'1px solid var(--border)' }}>
            {[
              {label:'Total Revenue',  value:fmtK(totalRevenue),  color:'#c4912a'},
              {label:'Total Cellular', value:fmtK(totalCellular), color:'#f97316'},
              {label:'Total Costs',    value:fmtK(totalCost),     color:'#d97706'},
              {label:'Net Income',     value:fmtK(netIncome),     color: netMarginPct>=55?'#16a34a':'#d97706'},
            ].map(s=>(
              <div key={s.label} style={{ padding:'10px 14px', background:'var(--cream,#f8fafc)', borderRadius:7, borderLeft:`3px solid ${s.color}` }}>
                <div style={{ fontSize:10, color:'var(--ink3)', textTransform:'uppercase', letterSpacing:0.5, marginBottom:3 }}>{s.label}</div>
                <div style={{ fontSize:18, fontWeight:700, color:s.color }}>{s.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Revenue breakdown + Cellular breakdown */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:10 }}>

          {/* Revenue streams */}
          <div style={{ ...card, padding:'16px 18px' }}>
            <div style={{ fontSize:13, fontWeight:700, color:'var(--ink)', marginBottom:2 }}>Revenue streams</div>
            <div style={{ fontSize:11, color:'var(--ink3)', marginBottom:16 }}>Breakdown by product / service line</div>

            {/* Stacked bar */}
            <div style={{ display:'flex', height:20, borderRadius:6, overflow:'hidden', marginBottom:16, gap:2 }}>
              {revStreams.map(s=>(
                <div key={s.label} style={{ flex:s.pct, background:s.color, opacity:0.85 }} title={`${s.label} ${s.pct}%`}/>
              ))}
            </div>

            {revStreams.map(s=>{
              const val=Math.round(latest.revenue*s.pct/100);
              return (
                <div key={s.label} style={{ marginBottom:10 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                    <span style={{ fontSize:12, color:'var(--ink2)', display:'flex', alignItems:'center', gap:7 }}>
                      <span style={{ width:9, height:9, borderRadius:2, background:s.color, display:'inline-block', flexShrink:0 }}/>
                      {s.label}
                    </span>
                    <span style={{ fontSize:12, fontWeight:600, color:'var(--ink)' }}>
                      {fmtK(val)} <span style={{ fontSize:10, color:'var(--ink3)', fontWeight:400 }}>{s.pct}%</span>
                    </span>
                  </div>
                  <div style={{ height:6, background:'var(--cream3)', borderRadius:3 }}>
                    <div style={{ width:`${s.pct}%`, height:'100%', background:s.color, borderRadius:3, opacity:0.8 }}/>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Cellular cost breakdown */}
          <div style={{ ...card, padding:'16px 18px' }}>
            <div style={{ fontSize:13, fontWeight:700, color:'var(--ink)', marginBottom:2 }}>Cellular / telco costs</div>
            <div style={{ fontSize:11, color:'var(--ink3)', marginBottom:16 }}>Payments to carriers · {fmtK(latest.cellular)} this {finPeriod==='yearly'?'year':finPeriod==='quarterly'?'quarter':'month'}</div>

            {/* Stacked bar */}
            <div style={{ display:'flex', height:20, borderRadius:6, overflow:'hidden', marginBottom:16, gap:2 }}>
              {cellularCarriers.map(c=>(
                <div key={c.name} style={{ flex:c.pct, background:c.color, opacity:0.85 }} title={`${c.name} ${c.pct}%`}/>
              ))}
            </div>

            {cellularCarriers.map(c=>{
              const val=Math.round(latest.cellular*c.pct/100);
              return (
                <div key={c.name} style={{ marginBottom:10 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                    <span style={{ fontSize:12, color:'var(--ink2)', display:'flex', alignItems:'center', gap:7 }}>
                      <span style={{ width:9, height:9, borderRadius:'50%', background:c.color, display:'inline-block', flexShrink:0 }}/>
                      {c.name}
                    </span>
                    <span style={{ fontSize:12, fontWeight:600, color:'var(--ink)' }}>
                      {fmtK(val)} <span style={{ fontSize:10, color:'var(--ink3)', fontWeight:400 }}>{c.pct}%</span>
                    </span>
                  </div>
                  <div style={{ height:6, background:'var(--cream3)', borderRadius:3 }}>
                    <div style={{ width:`${c.pct}%`, height:'100%', background:c.color, borderRadius:3, opacity:0.8 }}/>
                  </div>
                </div>
              );
            })}

            <div style={{ marginTop:14, padding:'10px 12px', background:'#fff7ed', border:'1px solid #fed7aa', borderRadius:7 }}>
              <div style={{ fontSize:10, color:'#9a3412', fontWeight:600, marginBottom:2 }}>Cost per vehicle per {finPeriod==='yearly'?'year':finPeriod==='quarterly'?'quarter':'month'}</div>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <div style={{ fontSize:18, fontWeight:700, color:'#ea580c' }}>
                  {fmtK(Math.round(latest.cellular/latest.vehicles))}
                </div>
                <div style={{ fontSize:11, color:'#9a3412' }}>{latest.vehicles} active vehicles</div>
              </div>
            </div>
          </div>
        </div>

        {/* Vehicle-level revenue table */}
        <div style={{ ...card, padding:'16px 18px', marginBottom:10 }}>
          <div style={{ fontSize:13, fontWeight:700, color:'var(--ink)', marginBottom:2 }}>Vehicle revenue contribution</div>
          <div style={{ fontSize:11, color:'var(--ink3)', marginBottom:14 }}>Per-vehicle breakdown — subscription + usage charges</div>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr>
                {['Vehicle','Plan tier','Subscription','Usage charges','Connectivity cost','Gross margin','Status'].map(h=>(
                  <th key={h} style={{ padding:'7px 12px', textAlign:'left', fontSize:10, fontWeight:600, color:'var(--ink3)', textTransform:'uppercase', letterSpacing:0.8, borderBottom:'1px solid var(--border)', whiteSpace:'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                {id:'ABC-001A',plan:'Professional',sub:560,usage:82, conn:58,status:'Active'},
                {id:'ABC-002B',plan:'Professional',sub:560,usage:110,conn:67,status:'Active'},
                {id:'ABC-003C',plan:'Standard',    sub:380,usage:64, conn:49,status:'Active'},
                {id:'ABC-004D',plan:'Standard',    sub:380,usage:38, conn:31,status:'Active'},
                {id:'ABC-005E',plan:'Professional',sub:560,usage:96, conn:63,status:'Active'},
                {id:'ABC-006F',plan:'Standard',    sub:380,usage:52, conn:42,status:'Active'},
              ].map((v,i)=>{
                const gross=v.sub+v.usage-v.conn;
                const margin=Math.round(gross/(v.sub+v.usage)*100);
                return (
                  <tr key={v.id} style={{ background:i%2===0?'#fff':'var(--cream,#f8fafc)' }}>
                    <td style={{ padding:'9px 12px', fontSize:12, fontWeight:600, fontFamily:'monospace', color:'var(--ink)' }}>{v.id}</td>
                    <td style={{ padding:'9px 12px', fontSize:11 }}>
                      <span style={{ padding:'2px 8px', borderRadius:10, fontSize:10, fontWeight:600, background:v.plan==='Professional'?'rgba(196,145,42,0.12)':'#f0fdf4', color:v.plan==='Professional'?'#c4912a':'#16a34a' }}>{v.plan}</span>
                    </td>
                    <td style={{ padding:'9px 12px', fontSize:12, color:'var(--ink2)' }}>${v.sub}</td>
                    <td style={{ padding:'9px 12px', fontSize:12, color:'var(--ink2)' }}>${v.usage}</td>
                    <td style={{ padding:'9px 12px', fontSize:12, color:'#f97316', fontWeight:500 }}>${v.conn}</td>
                    <td style={{ padding:'9px 12px', fontSize:12 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                        <span style={{ fontWeight:700, color:margin>=75?'#16a34a':margin>=60?'#d97706':'#dc2626' }}>${gross}</span>
                        <span style={{ fontSize:10, color:'var(--ink3)' }}>{margin}%</span>
                        <div style={{ flex:1, maxWidth:50, height:4, background:'var(--cream3)', borderRadius:2 }}>
                          <div style={{ width:`${margin}%`, height:'100%', background:margin>=75?'#16a34a':margin>=60?'#d97706':'#dc2626', borderRadius:2 }}/>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding:'9px 12px' }}>
                      <span style={{ fontSize:10, fontWeight:600, padding:'2px 7px', borderRadius:10, background:'#dcfce7', color:'#166534' }}>{v.status}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Financial insights */}
        <div style={{ ...card, padding:'14px 18px' }}>
          <div style={{ fontSize:13, fontWeight:700, color:'var(--ink)', marginBottom:10 }}>💡 Financial insights</div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10 }}>
            {finInsights.map(ins=>(
              <div key={ins.title} style={{ padding:'11px 13px', background:ins.bg, border:`1px solid ${ins.bd}`, borderRadius:8 }}>
                <div style={{ fontSize:13, marginBottom:5 }}>{ins.icon} <span style={{ fontSize:12, fontWeight:600, color:'var(--ink)' }}>{ins.title}</span></div>
                <div style={{ fontSize:11, color:'var(--ink2)', lineHeight:1.6 }}>{ins.body}</div>
              </div>
            ))}
          </div>
        </div>

      </>}

      {/* ════════════════ SALES VIEW ════════════════ */}
      {view === 'sales' && <>

        {/* KPI row */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(6,1fr)', gap:10, marginBottom:12 }}>
          {[
            { label:'New contracts',    value:String(totalNewContracts),            spark:saleRows.map(r=>r.newContracts), delta:revDeltaSale, unit:'%', goodUp:true,  color:'#c4912a' },
            { label:'Renewals',         value:String(totalRenewals),                spark:saleRows.map(r=>r.renewals),     delta:4,            unit:'%', goodUp:true,  color:'#c4912a' },
            { label:'Churned',          value:String(totalChurned),                 spark:saleRows.map(r=>r.churned),      delta:-2,           unit:'%', goodUp:false, color:'#dc2626' },
            { label:'Net new',          value:(netContracts>0?'+':'')+netContracts, spark:saleRows.map(r=>r.newContracts-r.churned), delta:8, unit:'%', goodUp:true,  color:'#16a34a' },
            { label:'Avg deal size',    value:`$${(avgDealSize/1000).toFixed(1)}K`, spark:saleRows.map(r=>r.revenue/Math.max(r.newContracts,1)), delta:5, unit:'%', goodUp:true, color:'#f59e0b' },
            { label:'Conversion rate',  value:`${convRate}%`,                       spark:[14,16,18,17,19,21,22,20,23,24,25,26], delta:3, unit:'pp', goodUp:true, color:'#0ea5e9' },
          ].map(k => {
            const W=56,H=26,vals=k.spark,mx=Math.max(...vals),mn=Math.min(...vals),rng=mx-mn||1;
            const pts=vals.map((v,i)=>`${((i/(vals.length-1))*W).toFixed(1)},${(H-2-((v-mn)/rng)*(H-4)).toFixed(1)}`).join(' ');
            return (
              <div key={k.label} style={{ ...card, padding:'13px 15px', borderTop:`3px solid ${k.color}` }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:4 }}>
                  <div style={{ fontSize:10, fontWeight:600, color:'var(--ink3)', textTransform:'uppercase', letterSpacing:0.5, flex:1, lineHeight:1.3 }}>{k.label}</div>
                  <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} preserveAspectRatio="none">
                    <polygon points={`0,${H} ${pts} ${W},${H}`} fill={k.color} opacity={0.13}/>
                    <polyline points={pts} fill="none" stroke={k.color} strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round"/>
                  </svg>
                </div>
                <div style={{ fontSize:20, fontWeight:700, color:'var(--ink)', lineHeight:1.15, marginBottom:3 }}>{k.value}</div>
                <DeltaTag delta={k.delta} unit={k.unit} goodUp={k.goodUp}/>
              </div>
            );
          })}
        </div>

        {/* Row 2 — Trend + Funnel */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 340px', gap:12, marginBottom:12 }}>

          {/* Contracts trend */}
          <div style={{ ...card, padding:'16px 18px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
              <div style={{ fontSize:13, fontWeight:700, color:'var(--ink)' }}>Contract trend</div>
              <div style={{ display:'flex', gap:14, fontSize:10 }}>
                {[{color:'#c4912a',label:'New'},{color:'#c4912a',label:'Renewals'},{color:'#dc2626',label:'Churned',dashed:true}].map(s=>(
                  <span key={s.label} style={{ display:'flex', alignItems:'center', gap:4 }}>
                    <span style={{ width:16, height:2, background:s.dashed?'transparent':s.color, borderTop:s.dashed?`2px dashed ${s.color}`:'none', display:'inline-block' }}/>
                    <span style={{ color:'var(--ink3)' }}>{s.label}</span>
                  </span>
                ))}
              </div>
            </div>
            <MultiLine height={110} series={[
              {values:saleRows.map(r=>r.newContracts), color:'#c4912a'},
              {values:saleRows.map(r=>r.renewals),     color:'#c4912a'},
              {values:saleRows.map(r=>r.churned),      color:'#dc2626', dashed:true},
            ]}/>
            <div style={{ display:'flex', justifyContent:'space-between', marginTop:4 }}>
              {saleRows.filter((_,i)=>i===0||i===Math.floor(saleRows.length/2)||i===saleRows.length-1).map(r=>(
                <span key={r.label} style={{ fontSize:9, color:'var(--ink3)' }}>{r.label}</span>
              ))}
            </div>
          </div>

          {/* Sales Funnel */}
          <div style={{ ...card, padding:'16px 18px' }}>
            <div style={{ fontSize:13, fontWeight:700, color:'var(--ink)', marginBottom:12 }}>Sales funnel</div>
            <div style={{ display:'flex', flexDirection:'column', gap:7 }}>
              {funnelStages.map((s,i) => {
                const pct = Math.round((s.value/funnelMax)*100);
                const conv = i>0 ? Math.round((s.value/funnelStages[i-1].value)*100) : 100;
                return (
                  <div key={s.label}>
                    <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, marginBottom:3 }}>
                      <span style={{ fontWeight:600, color:'var(--ink)' }}>{s.label}</span>
                      <span style={{ color:'var(--ink3)' }}>{s.value} {i>0&&<span style={{ color:s.color, fontWeight:600 }}>({conv}%)</span>}</span>
                    </div>
                    <div style={{ height:8, background:'var(--cream3)', borderRadius:4, overflow:'hidden' }}>
                      <div style={{ width:`${pct}%`, height:'100%', background:s.color, borderRadius:4, transition:'width 0.3s' }}/>
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{ marginTop:10, padding:'8px 10px', background:'rgba(196,145,42,0.10)', borderRadius:6, fontSize:11 }}>
              <span style={{ fontWeight:700, color:'#c4912a' }}>Win rate: {convRate}%</span>
              <span style={{ color:'var(--ink3)', marginLeft:8 }}>Industry avg: 21%</span>
            </div>
          </div>
        </div>

        {/* Row 3 — Rep leaderboard + Plan mix + Channel */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 240px 220px', gap:12, marginBottom:12 }}>

          {/* Rep leaderboard */}
          <div style={{ ...card, padding:'16px 18px' }}>
            <div style={{ fontSize:13, fontWeight:700, color:'var(--ink)', marginBottom:10 }}>Sales rep performance</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 60px 80px 60px 64px', gap:0 }}>
              {['Rep','Deals','Revenue','Quota','Conv%'].map(h=>(
                <div key={h} style={{ fontSize:9, fontWeight:700, color:'var(--ink3)', textTransform:'uppercase', padding:'0 8px 8px 0', letterSpacing:0.5 }}>{h}</div>
              ))}
              {saleReps.map((r,i) => {
                const quotaPct = Math.round((r.revenue/r.quota)*100);
                const atQuota  = r.revenue >= r.quota;
                return (
                  <>
                    <div key={`${r.name}-name`} style={{ display:'flex', alignItems:'center', gap:8, padding:'7px 8px 7px 0', borderTop:'1px solid var(--border)' }}>
                      <div style={{ width:24, height:24, borderRadius:'50%', background:'rgba(196,145,42,0.10)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:700, color:'#c4912a', flexShrink:0 }}>
                        {i+1}
                      </div>
                      <span style={{ fontSize:12, fontWeight:600, color:'var(--ink)' }}>{r.name}</span>
                    </div>
                    <div key={`${r.name}-deals`} style={{ fontSize:13, fontWeight:700, color:'var(--ink)', display:'flex', alignItems:'center', borderTop:'1px solid var(--border)', padding:'7px 8px 7px 0' }}>{r.deals}</div>
                    <div key={`${r.name}-rev`} style={{ fontSize:12, fontWeight:600, color:'var(--ink)', display:'flex', alignItems:'center', borderTop:'1px solid var(--border)', padding:'7px 8px 7px 0' }}>{fmtK(r.revenue)}</div>
                    <div key={`${r.name}-quota`} style={{ display:'flex', alignItems:'center', borderTop:'1px solid var(--border)', padding:'7px 8px 7px 0' }}>
                      <span style={{ fontSize:10, fontWeight:700, color:atQuota?'#16a34a':'#d97706', padding:'1px 5px', borderRadius:3, background:atQuota?'#f0fdf4':'#fffbeb' }}>
                        {quotaPct}%
                      </span>
                    </div>
                    <div key={`${r.name}-conv`} style={{ fontSize:12, color:'var(--ink3)', display:'flex', alignItems:'center', borderTop:'1px solid var(--border)', padding:'7px 0' }}>{r.conv}%</div>
                  </>
                );
              })}
            </div>
          </div>

          {/* Plan / ARR mix */}
          <div style={{ ...card, padding:'16px 18px' }}>
            <div style={{ fontSize:13, fontWeight:700, color:'var(--ink)', marginBottom:10 }}>ARR by plan</div>
            <div style={{ fontSize:18, fontWeight:800, color:'#c4912a', marginBottom:2 }}>${(totalARR/1000).toFixed(0)}K</div>
            <div style={{ fontSize:10, color:'var(--ink3)', marginBottom:12 }}>Annual recurring revenue</div>
            {planMix.map(p=>{
              const pct=Math.round((p.arr/totalARR)*100);
              return (
                <div key={p.label} style={{ marginBottom:9 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, marginBottom:3 }}>
                    <span style={{ fontWeight:600, color:'var(--ink)' }}>{p.label}</span>
                    <span style={{ color:'var(--ink3)' }}>{fmtK(p.arr)}</span>
                  </div>
                  <div style={{ height:6, background:'var(--cream3)', borderRadius:3, overflow:'hidden' }}>
                    <div style={{ width:`${pct}%`, height:'100%', background:p.color, borderRadius:3 }}/>
                  </div>
                  <div style={{ fontSize:9, color:'var(--ink3)', marginTop:1 }}>{p.vehicles} accounts · {pct}%</div>
                </div>
              );
            })}
          </div>

          {/* Sales channel mix */}
          <div style={{ ...card, padding:'16px 18px' }}>
            <div style={{ fontSize:13, fontWeight:700, color:'var(--ink)', marginBottom:10 }}>Revenue by channel</div>
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {saleChannels.map(ch=>(
                <div key={ch.label}>
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, marginBottom:3 }}>
                    <span style={{ fontWeight:600, color:'var(--ink)' }}>{ch.label}</span>
                    <span style={{ color:ch.color, fontWeight:700 }}>{ch.pct}%</span>
                  </div>
                  <div style={{ height:7, background:'var(--cream3)', borderRadius:4, overflow:'hidden' }}>
                    <div style={{ width:`${ch.pct}%`, height:'100%', background:ch.color, borderRadius:4 }}/>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ marginTop:12, borderTop:'1px solid var(--border)', paddingTop:10 }}>
              <div style={{ fontSize:10, color:'var(--ink3)', marginBottom:2 }}>Pipeline coverage</div>
              <div style={{ fontSize:16, fontWeight:700, color:'#c4912a' }}>${sLatest.pipeline}K</div>
              <div style={{ fontSize:10, color:'var(--ink3)' }}>{(sLatest.pipeline/sLatest.revenue*100).toFixed(0)}% of period revenue</div>
            </div>
          </div>
        </div>

        {/* Row 4 — Pipeline trend + Insights */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 340px', gap:12 }}>

          {/* Pipeline / closed revenue over time */}
          <div style={{ ...card, padding:'16px 18px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
              <div style={{ fontSize:13, fontWeight:700, color:'var(--ink)' }}>Pipeline vs closed revenue</div>
              <div style={{ display:'flex', gap:14, fontSize:10 }}>
                {[{color:'#c4912a',label:'Pipeline $K'},{color:'#16a34a',label:'Closed $K',dashed:false}].map(s=>(
                  <span key={s.label} style={{ display:'flex', alignItems:'center', gap:4, color:'var(--ink3)' }}>
                    <span style={{ width:12, height:2, background:s.color, display:'inline-block', borderRadius:1 }}/>
                    {s.label}
                  </span>
                ))}
              </div>
            </div>
            <MultiLine height={100} series={[
              {values:saleRows.map(r=>r.pipeline), color:'#c4912a'},
              {values:saleRows.map(r=>r.revenue),  color:'#16a34a'},
            ]}/>
            <div style={{ display:'flex', justifyContent:'space-between', marginTop:4 }}>
              {saleRows.filter((_,i)=>i===0||i===Math.floor(saleRows.length/2)||i===saleRows.length-1).map(r=>(
                <span key={r.label} style={{ fontSize:9, color:'var(--ink3)' }}>{r.label}</span>
              ))}
            </div>
          </div>

          {/* Sales Insights */}
          <div style={{ ...card, padding:'16px 18px' }}>
            <div style={{ fontSize:13, fontWeight:700, color:'var(--ink)', marginBottom:10 }}>📌 Sales insights</div>
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {saleInsights.map(ins=>(
                <div key={ins.title} style={{ padding:'10px 12px', borderRadius:8, border:`1px solid ${ins.bd}`, background:ins.bg }}>
                  <div style={{ fontSize:12, fontWeight:700, color:'var(--ink)', marginBottom:3 }}>{ins.icon} {ins.title}</div>
                  <div style={{ fontSize:11, color:'var(--ink2)', lineHeight:1.5 }}>{ins.body}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </>}
    </div>
  );
}
