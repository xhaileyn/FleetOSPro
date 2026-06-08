'use client';

import { use, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useAuthStore }        from '@/store/authStore';
import { useVehiclesStore }    from '@/store/vehiclesStore';
import { useDriversStore }     from '@/store/driversStore';
import { useMaintenanceStore } from '@/store/maintenanceStore';
import { useTripsStore }       from '@/store/tripsStore';
import { FleetMap }            from '@/components/maps/FleetMap';
import type { VehiclePin }     from '@/components/maps/FleetMap';
import { TrackJourneyMap }     from '@/components/maps/TrackJourneyMap';
import {
  TENANTS_META, getExpiringDocuments, getOverdueMaintenance, daysUntilExpiry,
} from '@/lib/vehiclesMaster';
import {
  PLANS, PLAN_ORDER, getSubscription, computeSubStatus, daysUntilSubExpiry,
} from '@/lib/subscriptions';
import { fmtDuration } from '@/lib/trips';
import type { DriverRecord } from '@/lib/driversData';

/* ── shared colour constants ───────────────────────────────────────── */
const STATUS_COLOR: Record<string, string> = {
  active:'#c4912a', idle:'var(--amber)', offline:'var(--ink3)',
  maintenance:'var(--red)', disposed:'#aaa',
};
const STATUS_BG: Record<string, string> = {
  active:'rgba(196,145,42,0.12)', idle:'var(--amber-lt)', offline:'var(--cream3)',
  maintenance:'var(--red-lt)', disposed:'#f5f5f5',
};
const CAT_ICONS: Record<string, string> = {
  Truck:'ti-truck', Van:'ti-van', Pickup:'ti-car-suv', Car:'ti-car',
  Bus:'ti-bus', Motorcycle:'ti-motorbike', Trailer:'ti-container',
};
const SCORE_BAND = (s: number) =>
  s >= 90 ? { label:'Excellent', bg:'#ecfdf5', color:'#065f46' }
  : s >= 75 ? { label:'Good',    bg:'#dbeafe', color:'#1e40af' }
  : s >= 60 ? { label:'Fair',    bg:'#fef3c7', color:'#92400e' }
  :           { label:'Poor',    bg:'var(--red-lt)', color:'var(--red)' };

/* ── MiniBar ────────────────────────────────────────────────────────── */
function MiniBar({ pct, color, height = 6 }: { pct: number; color: string; height?: number }) {
  return (
    <div style={{ flex:1, height, background:'var(--cream3)', borderRadius:3, overflow:'hidden', minWidth:50 }}>
      <div style={{ width:`${Math.min(100,pct)}%`, height:'100%', background:color, borderRadius:3, transition:'width 0.5s ease' }} />
    </div>
  );
}

/* ── BarChart (pure SVG) ────────────────────────────────────────────── */
function BarChart({ data, color='#16a34a', height=80, showValues=false }: {
  data: { label: string; value: number }[];
  color?: string; height?: number; showValues?: boolean;
}) {
  if (!data.length) return null;
  const max = Math.max(...data.map(d => d.value), 1);
  const bw = 100 / data.length;
  const chartH = height - (showValues ? 30 : 20);
  return (
    <svg viewBox={`0 0 100 ${height}`} style={{ width:'100%', height }} preserveAspectRatio="none">
      {data.map((d, i) => {
        const bh = Math.max(1, (d.value / max) * chartH);
        const x = i * bw + 0.8;
        const y = chartH - bh;
        return (
          <g key={i}>
            <rect x={x} y={y} width={bw - 1.6} height={bh} fill={color} rx={1.5} opacity={0.82} />
            {showValues && d.value > 0 && (
              <text x={x + (bw-1.6)/2} y={y - 2} textAnchor="middle" fontSize={4.5} fill={color} fontWeight="700">{d.value}</text>
            )}
            <text x={x + (bw-1.6)/2} y={height - 3} textAnchor="middle" fontSize={5.5} fill="#8a8078">{d.label}</text>
          </g>
        );
      })}
    </svg>
  );
}

/* ── DonutChart (pure SVG) ──────────────────────────────────────────── */
function DonutChart({ segments, size=90 }: {
  segments: { value: number; color: string; label: string }[];
  size?: number;
}) {
  const total = segments.reduce((s, g) => s + g.value, 0);
  if (!total) return null;
  const cx = size/2, cy = size/2, R = size*0.38, r = size*0.24;
  let a = -Math.PI / 2;
  const paths: { d: string; color: string }[] = [];
  for (const seg of segments) {
    if (!seg.value) continue;
    const sweep = (seg.value / total) * 2 * Math.PI;
    const x1 = cx + R*Math.cos(a), y1 = cy + R*Math.sin(a);
    const x2 = cx + R*Math.cos(a+sweep), y2 = cy + R*Math.sin(a+sweep);
    const xi1 = cx + r*Math.cos(a), yi1 = cy + r*Math.sin(a);
    const xi2 = cx + r*Math.cos(a+sweep), yi2 = cy + r*Math.sin(a+sweep);
    const large = sweep > Math.PI ? 1 : 0;
    paths.push({ d:`M${x1},${y1} A${R},${R},0,${large},1,${x2},${y2} L${xi2},${yi2} A${r},${r},0,${large},0,${xi1},${yi1} Z`, color:seg.color });
    a += sweep;
  }
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {paths.map((p,i) => <path key={i} d={p.d} fill={p.color} />)}
      <text x={cx} y={cy+2} textAnchor="middle" fontSize={size*0.13} fontWeight="800" fill="#1a1714">{total}</text>
      <text x={cx} y={cy+size*0.12+2} textAnchor="middle" fontSize={size*0.08} fill="#8a8078">total</text>
    </svg>
  );
}

/* ── KpiCard (horizontal compact) ───────────────────────────────────── */
function KpiCard({ icon, iconColor, label, value, sub }: {
  icon: string; iconColor: string; label: string; value: number|string; sub?: string;
}) {
  const chipBg = iconColor + '18';
  return (
    <div style={{ flex:1, minWidth:0, background:'#fff', border:'1px solid var(--border)', borderRadius:8, padding:'10px 12px', display:'flex', alignItems:'center', gap:10 }}>
      <div style={{ width:36, height:36, borderRadius:8, background:chipBg, display:'flex', alignItems:'center', justifyContent:'center', color:iconColor, fontSize:17, flexShrink:0 }}>
        <i className={`ti ${icon}`} />
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:8, fontWeight:700, letterSpacing:'0.8px', textTransform:'uppercase', color:'var(--ink3)', marginBottom:1 }}>{label}</div>
        <div style={{ fontSize:20, fontWeight:700, letterSpacing:'-0.5px', lineHeight:1, color:'var(--ink)' }}>{value}</div>
        {sub && <div style={{ fontSize:9, color:'var(--ink3)', marginTop:2, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{sub}</div>}
      </div>
    </div>
  );
}

/* ── Section wrapper ────────────────────────────────────────────────── */
function Section({ title, icon, children, action }: { title:string; icon?:string; children:React.ReactNode; action?: React.ReactNode }) {
  return (
    <div style={{ background:'#fff', border:'1px solid var(--border)', borderRadius:10, overflow:'hidden', marginBottom:14 }}>
      <div style={{ padding:'9px 14px', background:'var(--cream)', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
          {icon && <i className={`ti ${icon}`} style={{ fontSize:12, color:'var(--ink3)' }} />}
          <span style={{ fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:0.7, color:'var(--ink)' }}>{title}</span>
        </div>
        {action}
      </div>
      <div style={{ padding:'12px 14px' }}>{children}</div>
    </div>
  );
}

const TH: React.CSSProperties = { padding:'8px 12px', textAlign:'left', fontSize:9, fontWeight:700, color:'var(--ink3)', textTransform:'uppercase', letterSpacing:0.5, borderBottom:'1px solid var(--border)', background:'var(--cream)', whiteSpace:'nowrap' };
const TD = (i: number): React.CSSProperties => ({ padding:'8px 12px', fontSize:12, color:'var(--ink2)', borderBottom:'1px solid var(--border)', background: i%2===0 ? '#fff' : 'var(--cream)' });

/* ── REPORT 1: Fleet Summary ────────────────────────────────────────── */
function FleetSummary({ vehicles, isSuperAdmin, tenantId, accent }: { vehicles: ReturnType<typeof useVehiclesStore.getState>['vehicles']; isSuperAdmin: boolean; tenantId: string; accent: string }) {
  const scoped     = isSuperAdmin ? vehicles : vehicles.filter(v => v.tenantId === tenantId);
  const total      = scoped.length;
  const byStatus   = scoped.reduce<Record<string,number>>((a,v) => { a[v.status]=(a[v.status]??0)+1; return a; }, {});
  const byCategory = Object.entries(scoped.reduce<Record<string,number>>((a,v) => { a[v.category]=(a[v.category]??0)+1; return a; }, {})).sort((a,b)=>b[1]-a[1]);
  const fuelLow    = scoped.filter(v=>(v.fuelLevel??100)<25).length;
  const fuelMid    = scoped.filter(v=>(v.fuelLevel??100)>=25&&(v.fuelLevel??100)<60).length;
  const fuelGood   = scoped.filter(v=>(v.fuelLevel??100)>=60).length;
  const avgFuel    = total ? Math.round(scoped.reduce((s,v)=>s+(v.fuelLevel??0),0)/total) : 0;
  const expiringDocs = getExpiringDocuments(scoped, 60);
  const expiredDocs  = expiringDocs.filter(e=>daysUntilExpiry(e.doc.expiryDate)<0);
  const soonDocs     = expiringDocs.filter(e=>daysUntilExpiry(e.doc.expiryDate)>=0);
  const overdueMaint = getOverdueMaintenance(scoped);
  const assigned     = scoped.filter(v=>v.driverName).length;
  const topOdo       = [...scoped].sort((a,b)=>b.odometer-a.odometer).slice(0,10);
  const tenants      = isSuperAdmin ? Object.entries(scoped.reduce<Record<string,number>>((a,v)=>{ a[v.tenantId]=(a[v.tenantId]??0)+1; return a; },{})).sort((a,b)=>b[1]-a[1]) : null;

  const donutSegments = [
    { label:'Active',      value:byStatus.active??0,      color:'#16a34a' },
    { label:'Idle',        value:byStatus.idle??0,         color:'#d97706' },
    { label:'Maintenance', value:byStatus.maintenance??0,  color:'#dc2626' },
    { label:'Offline',     value:byStatus.offline??0,      color:'#8a8078' },
    { label:'Disposed',    value:byStatus.disposed??0,     color:'#d1d5db' },
  ].filter(s => s.value > 0);

  const catChartData = byCategory.map(([cat, n]) => ({ label: cat.substring(0,4), value: n }));

  return (
    <>
      <div style={{ display:'flex', gap:10, marginBottom:14, flexWrap:'wrap' }}>
        <KpiCard icon="ti-truck"       iconColor={accent}   label="Total vehicles"     value={total} />
        <KpiCard icon="ti-circle-check" iconColor={accent} label="Active"            value={byStatus.active??0} />
        <KpiCard icon="ti-clock-pause" iconColor="#d97706" label="Idle"               value={byStatus.idle??0} />
        <KpiCard icon="ti-tool"        iconColor="#dc2626" label="In Maintenance"     value={byStatus.maintenance??0} />
        <KpiCard icon="ti-wifi-off"    iconColor="#8a8078" label="Offline"            value={byStatus.offline??0} />
        <KpiCard icon="ti-user"        iconColor={accent}  label="Drivers Assigned"   value={total ? `${Math.round((assigned/total)*100)}%` : '0%'} sub={`${assigned} of ${total}`} />
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:14 }}>
        <Section title="Status breakdown" icon="ti-chart-donut">
          <div style={{ display:'flex', alignItems:'center', gap:16 }}>
            <DonutChart segments={donutSegments} size={90} />
            <div style={{ flex:1 }}>
              {['active','idle','offline','maintenance','disposed'].filter(s=>byStatus[s]).map(s=>(
                <div key={s} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
                  <span style={{ fontSize:9, fontWeight:700, width:76, textTransform:'capitalize', padding:'2px 6px', borderRadius:4, background:STATUS_BG[s], color:STATUS_COLOR[s], textAlign:'center' }}>{s}</span>
                  <MiniBar pct={total?(byStatus[s]/total)*100:0} color={STATUS_COLOR[s]} />
                  <span style={{ fontSize:11, fontWeight:700, width:22, textAlign:'right', color:'var(--ink)' }}>{byStatus[s]}</span>
                </div>
              ))}
            </div>
          </div>
        </Section>
        <Section title="Category breakdown" icon="ti-chart-bar">
          <BarChart data={catChartData} color={accent} height={72} showValues />
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:4, marginTop:8 }}>
            {byCategory.map(([cat,n]) => (
              <div key={cat} style={{ display:'flex', alignItems:'center', gap:6 }}>
                <i className={`ti ${CAT_ICONS[cat]??'ti-car'}`} style={{ fontSize:11, color:'#c4912a' }} />
                <span style={{ fontSize:10, color:'var(--ink2)' }}>{cat}</span>
                <span style={{ marginLeft:'auto', fontSize:11, fontWeight:700, color:'var(--ink)' }}>{n}</span>
              </div>
            ))}
          </div>
        </Section>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:14 }}>
        <Section title="Fuel levels" icon="ti-gas-station">
          <div style={{ display:'flex', gap:8, marginBottom:12 }}>
            {[{label:'LOW',n:fuelLow,c:'#dc2626',bg:'#fef2f2'},{label:'MID',n:fuelMid,c:'#d97706',bg:'#fef3c7'},{label:'GOOD',n:fuelGood,c:'#16a34a',bg:'#f0fdf4'}].map(b=>(
              <div key={b.label} style={{ flex:1, padding:'8px 10px', borderRadius:8, background:b.bg, textAlign:'center' }}>
                <div style={{ fontSize:18, fontWeight:800, color:b.c }}>{b.n}</div>
                <div style={{ fontSize:8, color:b.c, fontWeight:700, letterSpacing:'0.5px' }}>{b.label}</div>
              </div>
            ))}
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <span style={{ fontSize:11, color:'var(--ink3)' }}>Fleet avg</span>
            <div style={{ flex:1, height:8, background:'var(--cream3)', borderRadius:4, overflow:'hidden' }}>
              <div style={{ width:`${avgFuel}%`, height:'100%', background:avgFuel<25?'#dc2626':avgFuel<60?'#d97706':accent, borderRadius:4 }} />
            </div>
            <span style={{ fontSize:13, fontWeight:700, color:'var(--ink)' }}>{avgFuel}%</span>
          </div>
        </Section>
        <Section title="Compliance alerts" icon="ti-alert-triangle">
          {[
            { icon:'ti-file-x',      label:'Expired documents',   n:expiredDocs.length,  c:'var(--red)',   bg:'var(--red-lt)'   },
            { icon:'ti-clock',       label:'Expiring (60 days)',   n:soonDocs.length,     c:'var(--amber)', bg:'var(--amber-lt)' },
            { icon:'ti-tool',        label:'Overdue maintenance',  n:overdueMaint.length, c:'var(--red)',   bg:'var(--red-lt)'   },
            { icon:'ti-user-off',    label:'No driver assigned',   n:total-assigned,      c:'var(--ink3)',  bg:'var(--cream3)'   },
          ].map(a=>(
            <div key={a.label} style={{ display:'flex', alignItems:'center', gap:10, padding:'7px 10px', borderRadius:7, background:a.n>0?a.bg:'#f9fafb', marginBottom:6 }}>
              <i className={`ti ${a.icon}`} style={{ fontSize:14, color:a.n>0?a.c:'var(--ink3)' }} />
              <span style={{ flex:1, fontSize:11, color:a.n>0?a.c:'var(--ink3)' }}>{a.label}</span>
              <span style={{ fontSize:15, fontWeight:800, color:a.n>0?a.c:'var(--ink3)' }}>{a.n}</span>
            </div>
          ))}
        </Section>
      </div>

      {tenants && (
        <Section title="Vehicles by tenant" icon="ti-building">
          <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
            {tenants.map(([tid,n])=>{ const m=TENANTS_META[tid]; return (
              <div key={tid} style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 14px', borderRadius:8, border:`1px solid ${m?.color??'var(--border)'}40`, background:`${m?.color??'#000'}08` }}>
                <span style={{ width:8, height:8, borderRadius:'50%', background:m?.color??'var(--ink3)', display:'inline-block' }} />
                <span style={{ fontSize:12, fontWeight:600, color:'var(--ink)' }}>{m?.name??tid}</span>
                <span style={{ fontSize:14, fontWeight:800, color:m?.color??'var(--ink)' }}>{n}</span>
              </div>
            ); })}
          </div>
        </Section>
      )}

      <Section title="Top 10 vehicles by odometer" icon="ti-road">
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead><tr>{['#','Plate','Make / Model','Category','Driver','Odometer','Fuel','Status'].map(h=><th key={h} style={TH}>{h}</th>)}</tr></thead>
          <tbody>
            {topOdo.map((v,i)=>(
              <tr key={v.id}>
                <td style={TD(i)}><span style={{ fontWeight:700, color:'var(--ink3)' }}>{i+1}</span></td>
                <td style={{ ...TD(i), fontWeight:700, color:'var(--ink)' }}>{v.plate}</td>
                <td style={TD(i)}>{v.year} {v.make} {v.model}</td>
                <td style={TD(i)}><i className={`ti ${CAT_ICONS[v.category]??'ti-car'}`} style={{ fontSize:11, marginRight:4, color:'var(--ink3)' }} />{v.category}</td>
                <td style={TD(i)}>{v.driverName??<span style={{ color:'var(--ink3)' }}>—</span>}</td>
                <td style={{ ...TD(i), fontWeight:600, color:'var(--ink)' }}>{v.odometer.toLocaleString()} km</td>
                <td style={TD(i)}>
                  <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                    <div style={{ width:44, height:4, background:'var(--cream3)', borderRadius:2, overflow:'hidden' }}>
                      <div style={{ width:`${v.fuelLevel??0}%`, height:'100%', background:(v.fuelLevel??0)<25?'#dc2626':(v.fuelLevel??0)<60?'#d97706':'#16a34a', borderRadius:2 }} />
                    </div>
                    <span style={{ fontSize:10, color:'var(--ink3)' }}>{v.fuelLevel}%</span>
                  </div>
                </td>
                <td style={TD(i)}><span style={{ fontSize:10, fontWeight:600, padding:'2px 7px', borderRadius:4, background:STATUS_BG[v.status], color:STATUS_COLOR[v.status] }}>{v.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>
    </>
  );
}

/* ── REPORT 2: Driver Performance ───────────────────────────────────── */
function DriverPerformance({ drivers, isSuperAdmin, tenantId, accent }: { drivers: DriverRecord[]; isSuperAdmin: boolean; tenantId: string; accent: string }) {
  const scoped   = isSuperAdmin ? drivers : drivers.filter(d=>d.tenantId===tenantId);
  const total    = scoped.length;
  const driving  = scoped.filter(d=>d.status==='driving').length;
  const onDuty   = scoped.filter(d=>d.status==='on_duty').length;
  const offDuty  = scoped.filter(d=>d.status==='off_duty').length;
  const resting  = scoped.filter(d=>d.status==='resting').length;
  const avgScore = total ? Math.round(scoped.reduce((s,d)=>s+d.safetyScore,0)/total) : 0;
  const hosCompliant = scoped.filter(d=>d.hosRemaining>0).length;

  const bands = [
    { label:'Excellent', min:90, max:100, color:'#065f46', bg:'#ecfdf5' },
    { label:'Good',      min:75, max:89,  color:'#1e40af', bg:'#dbeafe' },
    { label:'Fair',      min:60, max:74,  color:'#92400e', bg:'#fef3c7' },
    { label:'Poor',      min:0,  max:59,  color:'#dc2626', bg:'#fef2f2' },
  ];
  const sorted = [...scoped].sort((a,b)=>b.safetyScore-a.safetyScore);

  const donutSegments = [
    { label:'Driving',  value:driving,  color:'#16a34a' },
    { label:'On Duty',  value:onDuty,   color:'#1d4ed8' },
    { label:'Resting',  value:resting,  color:'#d97706' },
    { label:'Off Duty', value:offDuty,  color:'#8a8078' },
  ].filter(s=>s.value>0);

  const scoreBarData = bands.map(b => ({
    label: b.label.substring(0,4),
    value: scoped.filter(d=>d.safetyScore>=b.min&&d.safetyScore<=b.max).length,
  }));

  return (
    <>
      <div style={{ display:'flex', gap:10, marginBottom:14, flexWrap:'wrap' }}>
        <KpiCard icon="ti-users"      iconColor={accent}   label="Total drivers"      value={total} />
        <KpiCard icon="ti-steering-wheel" iconColor={accent} label="Driving now"     value={driving} />
        <KpiCard icon="ti-user-check" iconColor="#1d4ed8" label="On duty"            value={onDuty} />
        <KpiCard icon="ti-moon"       iconColor="#8a8078" label="Off duty"           value={offDuty} />
        <KpiCard icon="ti-coffee"     iconColor="#92400e" label="Resting"            value={resting} />
        <KpiCard icon="ti-target"     iconColor={avgScore>=75?accent:avgScore>=60?'#d97706':'#dc2626'} label="Avg Safety Score" value={avgScore} sub={`${hosCompliant} of ${total} HOS compliant`} />
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:14 }}>
        <Section title="Driver status" icon="ti-chart-donut">
          <div style={{ display:'flex', alignItems:'center', gap:16 }}>
            <DonutChart segments={donutSegments} size={90} />
            <div style={{ flex:1 }}>
              {[
                { label:'Driving',  n:driving, color:'#c4912a',  bg:'rgba(196,145,42,0.12)' },
                { label:'On duty',  n:onDuty,  color:'#1d4ed8',      bg:'#dbeafe' },
                { label:'Off duty', n:offDuty, color:'var(--ink3)',  bg:'var(--cream3)' },
                { label:'Resting',  n:resting, color:'#92400e',      bg:'#fef3c7' },
              ].map(b=>(
                <div key={b.label} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
                  <span style={{ fontSize:9, fontWeight:700, width:58, padding:'2px 5px', borderRadius:4, background:b.bg, color:b.color, textAlign:'center' }}>{b.label}</span>
                  <MiniBar pct={total?(b.n/total)*100:0} color={b.color} />
                  <span style={{ fontSize:11, fontWeight:700, width:22, textAlign:'right', color:'var(--ink)' }}>{b.n}</span>
                </div>
              ))}
            </div>
          </div>
        </Section>
        <Section title="Safety score distribution" icon="ti-chart-bar">
          <BarChart data={scoreBarData} color={accent} height={72} showValues />
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:4, marginTop:8 }}>
            {bands.map(b => {
              const n = scoped.filter(d=>d.safetyScore>=b.min&&d.safetyScore<=b.max).length;
              return (
                <div key={b.label} style={{ display:'flex', alignItems:'center', gap:6 }}>
                  <span style={{ width:6, height:6, borderRadius:'50%', background:b.color, flexShrink:0, display:'inline-block' }} />
                  <span style={{ fontSize:10, color:'var(--ink2)' }}>{b.label}</span>
                  <span style={{ marginLeft:'auto', fontSize:11, fontWeight:700, color:b.color }}>{n}</span>
                </div>
              );
            })}
          </div>
        </Section>
      </div>

      <Section title="Driver performance table" icon="ti-list">
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead><tr>{['Driver','Status','Safety Score','Rating','HOS Driven','HOS Remaining','Vehicle'].map(h=><th key={h} style={TH}>{h}</th>)}</tr></thead>
          <tbody>
            {sorted.map((d,i)=>{
              const band = SCORE_BAND(d.safetyScore);
              return (
                <tr key={d.id}>
                  <td style={{ ...TD(i), fontWeight:600, color:'var(--ink)' }}>{d.name}</td>
                  <td style={TD(i)}>
                    <span style={{ fontSize:10, fontWeight:600, padding:'2px 7px', borderRadius:4,
                      background:d.status==='driving'?'rgba(196,145,42,0.12)':d.status==='on_duty'?'#dbeafe':d.status==='resting'?'#fef3c7':'var(--cream3)',
                      color:d.status==='driving'?'#c4912a':d.status==='on_duty'?'#1d4ed8':d.status==='resting'?'#92400e':'var(--ink3)' }}>
                      {d.status.replace('_',' ')}
                    </span>
                  </td>
                  <td style={{ ...TD(i), fontWeight:700, color:d.safetyScore>=75?accent:d.safetyScore>=60?'var(--amber)':'var(--red)' }}>{d.safetyScore}</td>
                  <td style={TD(i)}><span style={{ fontSize:10, fontWeight:600, padding:'2px 6px', borderRadius:4, background:band.bg, color:band.color }}>{band.label}</span></td>
                  <td style={TD(i)}>{d.hosDriven}h</td>
                  <td style={{ ...TD(i), color:d.hosRemaining<2?'var(--red)':d.hosRemaining<4?'var(--amber)':accent, fontWeight:600 }}>{d.hosRemaining}h</td>
                  <td style={TD(i)}>{d.assignedVehiclePlate??<span style={{ color:'var(--ink3)' }}>Unassigned</span>}</td>
                </tr>
              );
            })}
            {sorted.length===0&&<tr><td colSpan={7} style={{ padding:30, textAlign:'center', color:'var(--ink3)' }}>No driver data available</td></tr>}
          </tbody>
        </table>
      </Section>
    </>
  );
}

/* ── REPORT 3: Fuel Consumption ─────────────────────────────────────── */
function FuelConsumption({ vehicles, isSuperAdmin, tenantId, accent }: { vehicles: ReturnType<typeof useVehiclesStore.getState>['vehicles']; isSuperAdmin: boolean; tenantId: string; accent: string }) {
  const scoped   = isSuperAdmin ? vehicles : vehicles.filter(v=>v.tenantId===tenantId);
  const total    = scoped.length;
  const avgFuel  = total ? Math.round(scoped.reduce((s,v)=>s+(v.fuelLevel??0),0)/total) : 0;
  const lowFuel  = scoped.filter(v=>(v.fuelLevel??100)<25);
  const PRICE_PER_L = 1.38;
  const TANK_SIZES: Record<string,number> = { Truck:200, Van:80, Bus:150, Pickup:70, Car:55, Motorcycle:20, Trailer:0 };
  const estFillCost = lowFuel.reduce((s,v)=>{ const cap=TANK_SIZES[v.category]??80; return s+cap*(1-(v.fuelLevel??0)/100)*PRICE_PER_L; }, 0);

  const byCategory = Object.entries(
    scoped.reduce<Record<string,{count:number;fuel:number}>>((a,v)=>{
      if(!a[v.category]) a[v.category]={count:0,fuel:0};
      a[v.category].count++; a[v.category].fuel+=(v.fuelLevel??0); return a;
    },{}),
  ).map(([cat,d])=>({ cat, count:d.count, avg:Math.round(d.fuel/d.count), low:scoped.filter(v=>v.category===cat&&(v.fuelLevel??100)<25).length }))
   .sort((a,b)=>a.avg-b.avg);

  const needsRefuel = [...scoped].filter(v=>(v.fuelLevel??100)<40).sort((a,b)=>(a.fuelLevel??0)-(b.fuelLevel??0));

  const fuelBands = [
    { label:'Crit',  n:scoped.filter(v=>(v.fuelLevel??100)<15).length,                              color:'#dc2626' },
    { label:'Low',   n:scoped.filter(v=>(v.fuelLevel??100)>=15&&(v.fuelLevel??100)<25).length,       color:'#ef4444' },
    { label:'Mid',   n:scoped.filter(v=>(v.fuelLevel??100)>=25&&(v.fuelLevel??100)<60).length,       color:'#d97706' },
    { label:'Good',  n:scoped.filter(v=>(v.fuelLevel??100)>=60&&(v.fuelLevel??100)<85).length,       color:'#16a34a' },
    { label:'Full',  n:scoped.filter(v=>(v.fuelLevel??100)>=85).length,                              color:'#065f46' },
  ];

  return (
    <>
      <div style={{ display:'flex', gap:10, marginBottom:14, flexWrap:'wrap' }}>
        <KpiCard icon="ti-gas-station"  iconColor={avgFuel<25?'#dc2626':avgFuel<60?'#d97706':accent} label="Fleet Avg Fuel" value={`${avgFuel}%`} />
        <KpiCard icon="ti-alert-circle" iconColor="#dc2626" label="Low Fuel (<25%)"      value={lowFuel.length} />
        <KpiCard icon="ti-refresh"      iconColor="#d97706" label="Need Refuel (<40%)"   value={needsRefuel.length} />
        <KpiCard icon="ti-currency-dollar" iconColor={accent} label="Est. Fill Cost"     value={`$${estFillCost.toFixed(0)}`} sub={`@ $${PRICE_PER_L}/L`} />
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:14 }}>
        <Section title="Fuel by vehicle category" icon="ti-chart-bar">
          <BarChart data={byCategory.map(b => ({ label:b.cat.substring(0,4), value:b.avg }))} color={accent} height={80} showValues />
          <div style={{ marginTop:8 }}>
            {byCategory.map(b=>(
              <div key={b.cat} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
                <i className={`ti ${CAT_ICONS[b.cat]??'ti-car'}`} style={{ fontSize:12, color:'var(--ink3)', width:14 }} />
                <span style={{ fontSize:11, color:'var(--ink2)', width:80 }}>{b.cat} ({b.count})</span>
                <MiniBar pct={b.avg} color={b.avg<25?'#dc2626':b.avg<60?'#d97706':accent} />
                <span style={{ fontSize:11, fontWeight:700, color:b.avg<25?'#dc2626':b.avg<60?'#d97706':accent, width:34 }}>{b.avg}%</span>
                {b.low>0&&<span style={{ fontSize:9, fontWeight:700, padding:'1px 5px', borderRadius:3, background:'var(--red-lt)', color:'var(--red)' }}>{b.low} low</span>}
              </div>
            ))}
          </div>
        </Section>
        <Section title="Fleet fuel distribution" icon="ti-chart-donut">
          <div style={{ display:'flex', alignItems:'center', gap:16 }}>
            <DonutChart segments={fuelBands.filter(b=>b.n>0).map(b=>({label:b.label,value:b.n,color:b.color}))} size={90} />
            <div style={{ flex:1 }}>
              {[
                { label:'Critical (<15%)', color:'#dc2626', bg:'#fef2f2', n:fuelBands[0].n },
                { label:'Low (15–25%)',    color:'#ef4444', bg:'#fee2e2', n:fuelBands[1].n },
                { label:'Mid (25–60%)',    color:'#d97706', bg:'#fef3c7', n:fuelBands[2].n },
                { label:'Good (60–85%)',   color:'#16a34a', bg:'#f0fdf4', n:fuelBands[3].n },
                { label:'Full (≥85%)',     color:'#065f46', bg:'#ecfdf5', n:fuelBands[4].n },
              ].map(b=>(
                <div key={b.label} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:5 }}>
                  <span style={{ fontSize:9, fontWeight:700, flex:1, padding:'1px 5px', borderRadius:3, background:b.bg, color:b.color }}>{b.label}</span>
                  <span style={{ fontSize:11, fontWeight:700, color:'var(--ink)', width:22, textAlign:'right' }}>{b.n}</span>
                </div>
              ))}
            </div>
          </div>
        </Section>
      </div>

      <Section title={`Vehicles needing refuel — below 40% (${needsRefuel.length})`} icon="ti-gas-station">
        {needsRefuel.length === 0
          ? <div style={{ padding:16, textAlign:'center', color:accent, fontWeight:600, display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}><i className="ti ti-circle-check" style={{ fontSize:16 }} /> All vehicles have adequate fuel levels</div>
          : (
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead><tr>{['Plate','Make / Model','Category','Driver','Fuel %','Est. Fill Cost','Status'].map(h=><th key={h} style={TH}>{h}</th>)}</tr></thead>
            <tbody>
              {needsRefuel.map((v,i)=>{
                const cap=TANK_SIZES[v.category]??80; const needed=cap*(1-(v.fuelLevel??0)/100);
                return (
                  <tr key={v.id}>
                    <td style={{ ...TD(i), fontWeight:700, color:'var(--ink)' }}>{v.plate}</td>
                    <td style={TD(i)}>{v.year} {v.make} {v.model}</td>
                    <td style={TD(i)}>{v.category}</td>
                    <td style={TD(i)}>{v.driverName??<span style={{ color:'var(--ink3)' }}>—</span>}</td>
                    <td style={TD(i)}>
                      <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                        <div style={{ width:50, height:6, background:'var(--cream3)', borderRadius:3, overflow:'hidden' }}>
                          <div style={{ width:`${v.fuelLevel??0}%`, height:'100%', background:(v.fuelLevel??0)<25?'#dc2626':'#d97706', borderRadius:3 }} />
                        </div>
                        <span style={{ fontSize:11, fontWeight:700, color:(v.fuelLevel??0)<25?'#dc2626':'#d97706' }}>{v.fuelLevel}%</span>
                      </div>
                    </td>
                    <td style={{ ...TD(i), fontWeight:600, color:'var(--ink)' }}>${(needed*PRICE_PER_L).toFixed(0)} ({Math.round(needed)}L)</td>
                    <td style={TD(i)}><span style={{ fontSize:10, fontWeight:600, padding:'2px 7px', borderRadius:4, background:STATUS_BG[v.status], color:STATUS_COLOR[v.status] }}>{v.status}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Section>
    </>
  );
}

/* ── REPORT 4: Geofence Violations ──────────────────────────────────── */
const ZONE_NAMES = ['Manhattan HQ','Brooklyn Depot','JFK Airport Zone','Newark Industrial','Dallas Distribution','Houston Port','Chicago North Hub','Boston Warehouse','Atlanta Depot','Denver Logistics'];
const VIOLATION_TYPES = ['Zone Exit','Zone Entry','Overstay','Speeding','After-hours'];
const SEVER: Record<string,{bg:string;color:string}> = { Critical:{bg:'var(--red-lt)',color:'var(--red)'}, Warning:{bg:'var(--amber-lt)',color:'var(--amber)'}, Info:{bg:'#dbeafe',color:'#1d4ed8'} };

function GeofenceViolations({ vehicles, isSuperAdmin, tenantId, accent }: { vehicles: ReturnType<typeof useVehiclesStore.getState>['vehicles']; isSuperAdmin: boolean; tenantId: string; accent: string }) {
  const scoped = isSuperAdmin ? vehicles : vehicles.filter(v=>v.tenantId===tenantId);
  const violations = useMemo(()=>{
    const seed=42; const pseudo=(n:number)=>((n*1664525+1013904223)&0x7fffffff)/0x7fffffff;
    return scoped.flatMap((v,vi)=>{
      const count=Math.floor(pseudo(vi*7+seed)*4);
      return Array.from({length:count},(_,i)=>{
        const r1=pseudo(vi*13+i*7+1); const r2=pseudo(vi*17+i*11+2);
        const r3=pseudo(vi*19+i*13+3); const r4=pseudo(vi*23+i*17+4);
        const type=VIOLATION_TYPES[Math.floor(r1*VIOLATION_TYPES.length)];
        const severity=type==='Speeding'||type==='After-hours'?'Critical':r2>0.6?'Warning':'Info';
        const daysAgo=Math.floor(r3*30); const hour=6+Math.floor(r4*16);
        const d=new Date(); d.setDate(d.getDate()-daysAgo);
        return { id:`v${vi}-${i}`, plate:v.plate, driver:v.driverName??'—', zone:ZONE_NAMES[Math.floor(r1*ZONE_NAMES.length)], type, severity, time:`${d.toLocaleDateString('en-GB',{day:'numeric',month:'short'})} ${String(hour).padStart(2,'0')}:${String(Math.floor(r2*60)).padStart(2,'0')}`, vehicleId:v.id };
      });
    }).sort((a,b)=>b.time.localeCompare(a.time));
  },[scoped]);

  const critical   = violations.filter(v=>v.severity==='Critical').length;
  const uniqueVeh  = new Set(violations.map(v=>v.vehicleId)).size;
  const byZone     = Object.entries(violations.reduce<Record<string,number>>((a,v)=>{a[v.zone]=(a[v.zone]??0)+1;return a;},{})).sort((a,b)=>b[1]-a[1]).slice(0,5);
  const byType     = Object.entries(violations.reduce<Record<string,number>>((a,v)=>{a[v.type]=(a[v.type]??0)+1;return a;},{})).sort((a,b)=>b[1]-a[1]);

  return (
    <>
      <div style={{ display:'flex', gap:10, marginBottom:14, flexWrap:'wrap' }}>
        <KpiCard icon="ti-alert-hexagon" iconColor="#dc2626" label="Total Violations" value={violations.length} />
        <KpiCard icon="ti-bolt"          iconColor="#dc2626" label="Critical"          value={critical} />
        <KpiCard icon="ti-alert-triangle" iconColor="#d97706" label="Warnings"         value={violations.filter(v=>v.severity==='Warning').length} />
        <KpiCard icon="ti-truck"         iconColor={accent}  label="Vehicles Involved" value={uniqueVeh} />
        <KpiCard icon="ti-calendar"      iconColor="#8a8078" label="Report Period"     value="30 days" />
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:14 }}>
        <Section title="Top zones by violations" icon="ti-map-pin">
          {byZone.map(([zone,n])=>(
            <div key={zone} style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
              <span style={{ fontSize:11, color:'var(--ink2)', flex:1 }}>{zone}</span>
              <MiniBar pct={violations.length?(n/violations.length)*100:0} color="#dc2626" />
              <span style={{ fontSize:11, fontWeight:700, color:'var(--red)', width:22, textAlign:'right' }}>{n}</span>
            </div>
          ))}
        </Section>
        <Section title="Violations by type" icon="ti-chart-bar">
          <BarChart data={byType.map(([type,n])=>({ label:type.substring(0,5), value:n }))} color="#d97706" height={80} showValues />
        </Section>
      </div>

      <Section title={`All violations (${violations.length})`} icon="ti-list">
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead><tr>{['Time','Vehicle','Driver','Zone','Type','Severity'].map(h=><th key={h} style={TH}>{h}</th>)}</tr></thead>
          <tbody>
            {violations.slice(0,50).map((v,i)=>(
              <tr key={v.id}>
                <td style={{ ...TD(i), color:'var(--ink3)', fontSize:11 }}>{v.time}</td>
                <td style={{ ...TD(i), fontWeight:700, color:'var(--ink)' }}>{v.plate}</td>
                <td style={TD(i)}>{v.driver}</td>
                <td style={TD(i)}>{v.zone}</td>
                <td style={TD(i)}>{v.type}</td>
                <td style={TD(i)}><span style={{ fontSize:10, fontWeight:700, padding:'2px 7px', borderRadius:4, ...SEVER[v.severity] }}>{v.severity}</span></td>
              </tr>
            ))}
            {violations.length===0&&<tr><td colSpan={6} style={{ padding:30, textAlign:'center', color:accent }}>No violations recorded in the past 30 days</td></tr>}
            {violations.length>50&&<tr><td colSpan={6} style={{ padding:10, textAlign:'center', color:'var(--ink3)', fontSize:11 }}>Showing first 50 of {violations.length} — download XLS for full data</td></tr>}
          </tbody>
        </table>
      </Section>
    </>
  );
}

/* ── REPORT 5: Maintenance Schedule ─────────────────────────────────── */
function MaintenanceScheduleReport({ schedules, isSuperAdmin, tenantId, accent }: { schedules: ReturnType<typeof useMaintenanceStore.getState>['schedules']; isSuperAdmin: boolean; tenantId: string; accent: string }) {
  const scoped   = isSuperAdmin ? schedules : schedules.filter(s=>s.tenantId===tenantId);
  const overdue  = scoped.filter(s=>s.status==='Overdue');
  const upcoming = scoped.filter(s=>s.status==='Upcoming'||s.status==='Scheduled');
  const done     = scoped.filter(s=>s.status==='Done'||s.status==='Completed');
  const high     = scoped.filter(s=>s.priority==='High'||s.priority==='Critical');
  const byType   = Object.entries(scoped.reduce<Record<string,number>>((a,s)=>{a[s.serviceType]=(a[s.serviceType]??0)+1;return a;},{})).sort((a,b)=>b[1]-a[1]);
  const byPri    = ['Critical','High','Medium','Low'].map(p=>({ p, n:scoped.filter(s=>s.priority===p).length })).filter(x=>x.n>0);
  const PRIC: Record<string,{bg:string;color:string}> = { Critical:{bg:'var(--red-lt)',color:'var(--red)'}, High:{bg:'var(--amber-lt)',color:'var(--amber)'}, Medium:{bg:'#dbeafe',color:'#1d4ed8'}, Low:{bg:'var(--cream3)',color:'var(--ink3)'} };

  const typeChartData = byType.slice(0,8).map(([type,n])=>({ label:type.substring(0,5), value:n }));
  const donutSegments = [
    { label:'Overdue',  value:overdue.length,  color:'#dc2626' },
    { label:'Upcoming', value:upcoming.length, color:'#d97706' },
    { label:'Done',     value:done.length,     color:'#065f46' },
  ].filter(s=>s.value>0);

  return (
    <>
      <div style={{ display:'flex', gap:10, marginBottom:14, flexWrap:'wrap' }}>
        <KpiCard icon="ti-clipboard-list" iconColor={accent}   label="Total Scheduled"      value={scoped.length} />
        <KpiCard icon="ti-alert-circle"   iconColor="#dc2626" label="Overdue"               value={overdue.length} />
        <KpiCard icon="ti-calendar"       iconColor="#d97706" label="Upcoming"              value={upcoming.length} />
        <KpiCard icon="ti-circle-check"   iconColor="#16a34a" label="Completed"             value={done.length} />
        <KpiCard icon="ti-flame"          iconColor="#d97706" label="High/Critical Priority" value={high.length} />
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:14 }}>
        <Section title="Status overview" icon="ti-chart-donut">
          <div style={{ display:'flex', alignItems:'center', gap:16 }}>
            <DonutChart segments={donutSegments} size={90} />
            <div style={{ flex:1 }}>
              {byPri.map(({p,n})=>(
                <div key={p} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:7 }}>
                  <span style={{ fontSize:9, fontWeight:700, width:58, padding:'2px 5px', borderRadius:4, textAlign:'center', ...PRIC[p] }}>{p}</span>
                  <MiniBar pct={scoped.length?(n/scoped.length)*100:0} color={PRIC[p]?.color??'#c4912a'} />
                  <span style={{ fontSize:11, fontWeight:700, width:22, textAlign:'right', color:'var(--ink)' }}>{n}</span>
                </div>
              ))}
            </div>
          </div>
        </Section>
        <Section title="By service type" icon="ti-chart-bar">
          <BarChart data={typeChartData} color={accent} height={80} showValues />
        </Section>
      </div>

      {overdue.length>0&&(
        <Section title={`Overdue — immediate action required (${overdue.length})`} icon="ti-alert-circle">
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead><tr>{['Vehicle','Service Type','Priority','Due Date','Last Done','Notes'].map(h=><th key={h} style={TH}>{h}</th>)}</tr></thead>
            <tbody>
              {overdue.map((s,i)=>(
                <tr key={s.id}>
                  <td style={{ ...TD(i), fontWeight:700, color:'var(--ink)' }}>{s.vehiclePlate}</td>
                  <td style={TD(i)}>{s.serviceType}</td>
                  <td style={TD(i)}><span style={{ fontSize:10, fontWeight:700, padding:'2px 6px', borderRadius:4, ...PRIC[s.priority]??{} }}>{s.priority}</span></td>
                  <td style={{ ...TD(i), color:'var(--red)', fontWeight:600 }}>{s.dueAt ? new Date(s.dueAt).toLocaleDateString('en-GB') : '—'}</td>
                  <td style={TD(i)}>{s.lastDoneAt ? new Date(s.lastDoneAt).toLocaleDateString('en-GB') : '—'}</td>
                  <td style={{ ...TD(i), fontSize:11, color:'var(--ink3)' }}>{s.notes||'—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>
      )}

      <Section title={`Full schedule (${scoped.length})`} icon="ti-list">
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead><tr>{['Vehicle','Service Type','Status','Priority','Due','Last Done','Mileage'].map(h=><th key={h} style={TH}>{h}</th>)}</tr></thead>
          <tbody>
            {scoped.map((s,i)=>{
              const stc: Record<string,{bg:string;color:string}> = { Overdue:{bg:'var(--red-lt)',color:'var(--red)'}, Upcoming:{bg:'var(--amber-lt)',color:'var(--amber)'}, Scheduled:{bg:'#dbeafe',color:'#1d4ed8'}, Done:{bg:'#ecfdf5',color:'#065f46'}, Completed:{bg:'#ecfdf5',color:'#065f46'} };
              return (
                <tr key={s.id}>
                  <td style={{ ...TD(i), fontWeight:700, color:'var(--ink)' }}>{s.vehiclePlate}</td>
                  <td style={TD(i)}>{s.serviceType}</td>
                  <td style={TD(i)}><span style={{ fontSize:10, fontWeight:700, padding:'2px 6px', borderRadius:4, ...(stc[s.status]??{}) }}>{s.status}</span></td>
                  <td style={TD(i)}><span style={{ fontSize:10, fontWeight:700, padding:'2px 6px', borderRadius:4, ...PRIC[s.priority]??{} }}>{s.priority}</span></td>
                  <td style={TD(i)}>{s.dueAt ? new Date(s.dueAt).toLocaleDateString('en-GB') : '—'}</td>
                  <td style={TD(i)}>{s.lastDoneAt ? new Date(s.lastDoneAt).toLocaleDateString('en-GB') : '—'}</td>
                  <td style={TD(i)}>{s.mileage||'—'}</td>
                </tr>
              );
            })}
            {scoped.length===0&&<tr><td colSpan={7} style={{ padding:30, textAlign:'center', color:'var(--ink3)' }}>No maintenance records</td></tr>}
          </tbody>
        </table>
      </Section>
    </>
  );
}

/* ── REPORT 6: Cost Analysis ────────────────────────────────────────── */
function CostAnalysis({ vehicles, isSuperAdmin, tenantId, accent }: { vehicles: ReturnType<typeof useVehiclesStore.getState>['vehicles']; isSuperAdmin: boolean; tenantId: string; accent: string }) {
  const scoped    = isSuperAdmin ? vehicles : vehicles.filter(v=>v.tenantId===tenantId);
  const subsData  = scoped.map(v=>({ v, sub:getSubscription(v.id) })).filter(x=>x.sub);
  const active    = subsData.filter(x=>computeSubStatus(x.sub!)==='Active');
  const expiring  = subsData.filter(x=>computeSubStatus(x.sub!)==='Expiring Soon');
  const expired   = subsData.filter(x=>computeSubStatus(x.sub!)==='Expired');
  const totalMRR  = active.reduce((s,x)=>s+(PLANS[x.sub!.plan]?.price??0),0);
  const totalARR  = totalMRR*12;
  const lostMRR   = expired.reduce((s,x)=>s+(PLANS[x.sub!.plan]?.price??0),0);
  const byPlan    = PLAN_ORDER.map(pn=>({ pn, n:subsData.filter(x=>x.sub!.plan===pn).length, mrr:subsData.filter(x=>x.sub!.plan===pn&&computeSubStatus(x.sub!)==='Active').reduce((s,x)=>s+(PLANS[pn]?.price??0),0) })).filter(x=>x.n>0);
  const highOdo   = scoped.filter(v=>v.odometer>100000).length;
  const planBarData = byPlan.map(b=>({ label:b.pn.substring(0,5), value:b.mrr }));

  return (
    <>
      <div style={{ display:'flex', gap:10, marginBottom:14, flexWrap:'wrap' }}>
        <KpiCard icon="ti-trending-up"     iconColor={accent}  label="MRR"                  value={`$${totalMRR.toLocaleString()}`} sub="Monthly recurring" />
        <KpiCard icon="ti-calendar-stats"  iconColor={accent}  label="ARR"                  value={`$${totalARR.toLocaleString()}`} sub="Annual recurring" />
        <KpiCard icon="ti-circle-check"    iconColor={accent}  label="Active Subscriptions"  value={active.length} />
        <KpiCard icon="ti-clock-exclamation" iconColor="#d97706" label="Expiring Soon"       value={expiring.length} />
        <KpiCard icon="ti-lock"            iconColor="#dc2626" label="Expired"               value={expired.length} sub={`$${lostMRR}/mo lost`} />
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:14 }}>
        <Section title="Revenue by plan" icon="ti-currency-dollar">
          {planBarData.length > 0 && <BarChart data={planBarData} color={accent} height={70} showValues />}
          <div style={{ marginTop:8 }}>
            {byPlan.map(({ pn, n, mrr }) => {
              const p = PLANS[pn];
              return (
                <div key={pn} style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8, padding:'7px 10px', borderRadius:7, border:`1px solid ${p.color}30`, background:`${p.color}08` }}>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:12, fontWeight:700, color:p.color }}>{p.name}</div>
                    <div style={{ fontSize:10, color:'var(--ink3)' }}>{n} vehicle{n!==1?'s':''} · ${p.price}/mo each</div>
                  </div>
                  <div style={{ textAlign:'right' }}>
                    <div style={{ fontSize:14, fontWeight:800, color:p.color }}>${mrr}/mo</div>
                    <div style={{ fontSize:10, color:'var(--ink3)' }}>${mrr*12}/yr</div>
                  </div>
                </div>
              );
            })}
            <div style={{ borderTop:'1px solid var(--border)', paddingTop:8, display:'flex', justifyContent:'space-between', alignItems:'baseline' }}>
              <span style={{ fontSize:11, fontWeight:700, color:'var(--ink)' }}>Total MRR</span>
              <span style={{ fontSize:16, fontWeight:800, color:accent }}>${totalMRR}/mo</span>
            </div>
          </div>
        </Section>
        <Section title="Fleet health & cost drivers" icon="ti-activity">
          {[
            { icon:'ti-tool',          label:'Avg maintenance cost/service', value:'$150' },
            { icon:'ti-truck',         label:'High-mileage vehicles (>100k km)', value:highOdo },
            { icon:'ti-gas-station',   label:'Low-fuel vehicles (est. refuel)', value:`$${Math.round(scoped.filter(v=>(v.fuelLevel??100)<25).reduce((s,v)=>{ const cap={Truck:200,Van:80,Bus:150,Pickup:70,Car:55,Motorcycle:20,Trailer:0}[v.category as string]??80; return s+cap*(1-(v.fuelLevel??0)/100)*1.38; },0))}` },
            { icon:'ti-file-x',        label:'Vehicles with expired documents', value:getExpiringDocuments(scoped,0).filter(e=>daysUntilExpiry(e.doc.expiryDate)<0).length },
            { icon:'ti-building',      label:'Tenants on platform', value:isSuperAdmin?Object.keys(TENANTS_META).length:'1' },
          ].map(r=>(
            <div key={r.label} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'9px 0', borderBottom:'1px solid var(--border)' }}>
              <div style={{ display:'flex', alignItems:'center', gap:7 }}>
                <i className={`ti ${r.icon}`} style={{ fontSize:13, color:'var(--ink3)' }} />
                <span style={{ fontSize:12, color:'var(--ink2)' }}>{r.label}</span>
              </div>
              <span style={{ fontSize:14, fontWeight:700, color:'var(--ink)' }}>{r.value}</span>
            </div>
          ))}
        </Section>
      </div>

      <Section title="Subscription detail — all vehicles" icon="ti-list">
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead><tr>{['Vehicle','Plan','Status','Monthly','Expiry','Days Left','Auto-renew'].map(h=><th key={h} style={TH}>{h}</th>)}</tr></thead>
          <tbody>
            {subsData.sort((a,b)=>daysUntilSubExpiry(a.sub!.expiryDate)-daysUntilSubExpiry(b.sub!.expiryDate)).map(({v,sub},i)=>{
              const status=computeSubStatus(sub!); const days=daysUntilSubExpiry(sub!.expiryDate);
              const stc=status==='Active'?{bg:'#ecfdf5',color:'#065f46'}:status==='Expiring Soon'?{bg:'#fef3c7',color:'#92400e'}:{bg:'var(--red-lt)',color:'var(--red)'};
              return (
                <tr key={v.id}>
                  <td style={{ ...TD(i), fontWeight:700, color:'var(--ink)' }}>{v.plate}</td>
                  <td style={TD(i)}><span style={{ fontSize:10, fontWeight:700, padding:'2px 6px', borderRadius:4, background:PLANS[sub!.plan].color+'18', color:PLANS[sub!.plan].color }}>{sub!.plan}</span></td>
                  <td style={TD(i)}><span style={{ fontSize:10, fontWeight:700, padding:'2px 6px', borderRadius:4, ...stc }}>{status}</span></td>
                  <td style={{ ...TD(i), fontWeight:600, color:'var(--ink)' }}>${PLANS[sub!.plan].price}</td>
                  <td style={TD(i)}>{new Date(sub!.expiryDate).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'2-digit'})}</td>
                  <td style={{ ...TD(i), color:days<0?'var(--red)':days<30?'var(--amber)':accent, fontWeight:600 }}>{days<0?`${Math.abs(days)}d ago`:`${days}d`}</td>
                  <td style={TD(i)}>{sub!.autoRenew?<span style={{ color:accent,fontWeight:600,fontSize:11 }}>✓ Yes</span>:<span style={{ color:'var(--ink3)',fontSize:11 }}>Manual</span>}</td>
                </tr>
              );
            })}
            {subsData.length===0&&<tr><td colSpan={7} style={{ padding:30, textAlign:'center', color:'var(--ink3)' }}>No subscription data</td></tr>}
          </tbody>
        </table>
      </Section>
    </>
  );
}

/* ── REPORT 7: Trip Summary + Work Hours ────────────────────────────── */
function TripSummary({ trips, vehicles, drivers, isSuperAdmin, tenantId, accent }: {
  trips:     ReturnType<typeof useTripsStore.getState>['trips'];
  vehicles:  ReturnType<typeof useVehiclesStore.getState>['vehicles'];
  drivers:   DriverRecord[];
  isSuperAdmin: boolean; tenantId: string; accent: string;
}) {
  const allowedIds  = isSuperAdmin ? null : new Set(vehicles.filter(v=>v.tenantId===tenantId).map(v=>v.id));
  const scoped      = allowedIds ? trips.filter(t=>allowedIds.has(t.vehicleId)) : trips;
  const totalDist   = scoped.reduce((s,t)=>s+t.distanceKm,0);
  const totalFuel   = scoped.reduce((s,t)=>s+t.fuelUsedL,0);
  const totalDurMin = scoped.reduce((s,t)=>s+t.durationMin,0);
  const avgSpeed    = scoped.length ? Math.round(scoped.reduce((s,t)=>s+t.avgSpeed,0)/scoped.length) : 0;
  const totalHours  = parseFloat((totalDurMin/60).toFixed(1));

  // Work hours: group by date
  const byDate = scoped.reduce<Record<string,number>>((acc,t)=>{ const d=t.dateISO.substring(0,10); acc[d]=(acc[d]??0)+t.durationMin; return acc; },{});
  const last7 = Array.from({length:7},(_,i)=>{ const d=new Date(); d.setDate(d.getDate()-(6-i)); return d.toISOString().substring(0,10); });
  const dailyData = last7.map(d=>({ label:new Date(d).toLocaleDateString('en-GB',{weekday:'short'}).substring(0,3), value:parseFloat(((byDate[d]??0)/60).toFixed(1)) }));

  // Hourly activity
  const byHour = new Array(24).fill(0);
  scoped.forEach(t=>{ const h=parseInt(t.date.substring(11,13)||'0',10); if(!isNaN(h)&&h>=0&&h<24) byHour[h]++; });
  const hourlyData = Array.from({length:24},(_,h)=>({ label:h%6===0?`${h}h`:'', value:byHour[h] }));

  // Per-driver work hours
  const vehicleDriverMap = Object.fromEntries(vehicles.filter(v=>v.driverName).map(v=>[v.id, v.driverName as string]));
  const driverWork = scoped.reduce<Record<string,{trips:number;totalMin:number;dist:number;dates:Set<string>}>>((acc,t)=>{
    const dn=vehicleDriverMap[t.vehicleId]??'Unassigned';
    if(!acc[dn]) acc[dn]={trips:0,totalMin:0,dist:0,dates:new Set()};
    acc[dn].trips++; acc[dn].totalMin+=t.durationMin; acc[dn].dist+=t.distanceKm; acc[dn].dates.add(t.dateISO.substring(0,10));
    return acc;
  },{});
  const workRows = Object.entries(driverWork).map(([name,d])=>{
    const dr=drivers.find(dr=>dr.name===name);
    const uniqueDays=d.dates.size;
    return { name, trips:d.trips, totalHours:parseFloat((d.totalMin/60).toFixed(1)), avgPerDay:uniqueDays?parseFloat((d.totalMin/60/uniqueDays).toFixed(1)):0, dist:Math.round(d.dist), hosDriven:dr?.hosDriven??null, hosRemaining:dr?.hosRemaining??null, status:dr?.status??null };
  }).sort((a,b)=>b.totalHours-a.totalHours);

  // HOS compliance
  const scopedDrivers = isSuperAdmin ? drivers : drivers.filter(d=>d.tenantId===tenantId);
  const hosCompliant = scopedDrivers.filter(d=>d.hosRemaining>0).length;

  const byVehicle = Object.entries(
    scoped.reduce<Record<string,{trips:number;dist:number;fuel:number;avgSpd:number;count:number}>>((a,t)=>{
      const vp=vehicles.find(v=>v.id===t.vehicleId)?.plate??t.vehicleId;
      if(!a[vp]) a[vp]={trips:0,dist:0,fuel:0,avgSpd:0,count:0};
      a[vp].trips++; a[vp].dist+=t.distanceKm; a[vp].fuel+=t.fuelUsedL; a[vp].avgSpd+=t.avgSpeed; a[vp].count++;
      return a;
    },{}),
  ).map(([plate,d])=>({ plate, ...d, avgSpd:Math.round(d.avgSpd/d.count) })).sort((a,b)=>b.dist-a.dist);

  const recent = [...scoped].sort((a,b)=>b.dateISO.localeCompare(a.dateISO)).slice(0,25);

  return (
    <>
      <div style={{ display:'flex', gap:10, marginBottom:14, flexWrap:'wrap' }}>
        <KpiCard icon="ti-route"         iconColor={accent}  label="Total Trips"       value={scoped.length} />
        <KpiCard icon="ti-road"          iconColor={accent}  label="Total Distance"    value={`${totalDist.toLocaleString()} km`} />
        <KpiCard icon="ti-gas-station"   iconColor="#d97706" label="Total Fuel Used"   value={`${totalFuel.toFixed(0)} L`} />
        <KpiCard icon="ti-clock"         iconColor={accent}  label="Total Drive Time"  value={fmtDuration(totalDurMin)} sub={`${totalHours}h total`} />
        <KpiCard icon="ti-dashboard"     iconColor="#7c3aed" label="Avg Speed"         value={`${avgSpeed} km/h`} />
        <KpiCard icon="ti-user-check"    iconColor={accent}  label="HOS Compliant"     value={`${scopedDrivers.length ? Math.round((hosCompliant/scopedDrivers.length)*100) : 0}%`} sub={`${hosCompliant} of ${scopedDrivers.length}`} />
      </div>

      {/* Work Hours Charts */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:14 }}>
        <Section title="Daily drive hours — last 7 days" icon="ti-chart-bar">
          <BarChart data={dailyData} color={accent} height={90} showValues />
          <div style={{ display:'flex', justifyContent:'space-between', marginTop:6, fontSize:10, color:'var(--ink3)' }}>
            <span>Avg: {dailyData.length ? (dailyData.reduce((s,d)=>s+d.value,0)/dailyData.filter(d=>d.value>0).length||1).toFixed(1) : 0}h/day</span>
            <span>Peak: {Math.max(...dailyData.map(d=>d.value)).toFixed(1)}h</span>
            <span>Total: {totalHours}h</span>
          </div>
        </Section>
        <Section title="Hourly activity — trips by start time" icon="ti-clock">
          <BarChart data={hourlyData} color="#d97706" height={90} />
          <div style={{ display:'flex', justifyContent:'space-between', marginTop:6, fontSize:10, color:'var(--ink3)' }}>
            <span>Peak hour: {byHour.indexOf(Math.max(...byHour))}:00</span>
            <span>Night trips (22–06): {byHour.slice(22).reduce((s,n)=>s+n,0)+byHour.slice(0,6).reduce((s,n)=>s+n,0)}</span>
          </div>
        </Section>
      </div>

      {/* Per-driver work hours */}
      <Section title="Work hours by driver" icon="ti-users">
        {workRows.length === 0
          ? <div style={{ padding:20, textAlign:'center', color:'var(--ink3)' }}>No driver trip data available</div>
          : (
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead><tr>{['Driver','Status','Trips','Total Hours','Avg h/day','Distance','HOS Driven','HOS Remaining'].map(h=><th key={h} style={TH}>{h}</th>)}</tr></thead>
            <tbody>
              {workRows.map((r,i)=>(
                <tr key={r.name}>
                  <td style={{ ...TD(i), fontWeight:600, color:'var(--ink)' }}>{r.name}</td>
                  <td style={TD(i)}>
                    {r.status
                      ? <span style={{ fontSize:10, fontWeight:600, padding:'2px 7px', borderRadius:4, background:r.status==='driving'?'rgba(196,145,42,0.12)':r.status==='on_duty'?'#dbeafe':r.status==='resting'?'#fef3c7':'var(--cream3)', color:r.status==='driving'?'#c4912a':r.status==='on_duty'?'#1d4ed8':r.status==='resting'?'#92400e':'var(--ink3)' }}>{r.status.replace('_',' ')}</span>
                      : <span style={{ color:'var(--ink3)', fontSize:11 }}>—</span>
                    }
                  </td>
                  <td style={TD(i)}>{r.trips}</td>
                  <td style={{ ...TD(i), fontWeight:700, color:'var(--ink)' }}>{r.totalHours}h</td>
                  <td style={TD(i)}>{r.avgPerDay}h</td>
                  <td style={TD(i)}>{r.dist.toLocaleString()} km</td>
                  <td style={TD(i)}>{r.hosDriven!=null ? `${r.hosDriven}h` : <span style={{ color:'var(--ink3)' }}>—</span>}</td>
                  <td style={{ ...TD(i), color:r.hosRemaining!=null?(r.hosRemaining<2?'var(--red)':r.hosRemaining<4?'var(--amber)':accent):'var(--ink3)', fontWeight:600 }}>
                    {r.hosRemaining!=null ? `${r.hosRemaining}h` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Section>

      {/* By vehicle */}
      <Section title="Summary by vehicle" icon="ti-truck">
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead><tr>{['Vehicle','Trips','Distance','Fuel Used','Avg Speed'].map(h=><th key={h} style={TH}>{h}</th>)}</tr></thead>
          <tbody>
            {byVehicle.map(({plate,trips,dist,fuel,avgSpd},i)=>(
              <tr key={plate}>
                <td style={{ ...TD(i), fontWeight:700, color:'var(--ink)' }}>{plate}</td>
                <td style={TD(i)}>{trips}</td>
                <td style={{ ...TD(i), fontWeight:600, color:'var(--ink)' }}>{dist.toLocaleString()} km</td>
                <td style={TD(i)}>{fuel.toFixed(1)} L</td>
                <td style={TD(i)}>{avgSpd} km/h</td>
              </tr>
            ))}
            {byVehicle.length===0&&<tr><td colSpan={5} style={{ padding:30, textAlign:'center', color:'var(--ink3)' }}>No trip data available</td></tr>}
          </tbody>
        </table>
      </Section>

      {/* Recent trips */}
      <Section title={`Recent trips (showing ${recent.length} of ${scoped.length})`} icon="ti-history">
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead><tr>{['Date','Vehicle','From','To','Distance','Duration','Avg Speed','Max Speed','Fuel','Status'].map(h=><th key={h} style={TH}>{h}</th>)}</tr></thead>
          <tbody>
            {recent.map((t,i)=>{
              const plate=vehicles.find(v=>v.id===t.vehicleId)?.plate??t.vehicleId;
              return (
                <tr key={t.id}>
                  <td style={{ ...TD(i), color:'var(--ink3)', fontSize:11 }}>{t.date}</td>
                  <td style={{ ...TD(i), fontWeight:700, color:'var(--ink)' }}>{plate}</td>
                  <td style={TD(i)}>{t.from}</td>
                  <td style={TD(i)}>{t.to}</td>
                  <td style={{ ...TD(i), fontWeight:600, color:'var(--ink)' }}>{t.distanceKm} km</td>
                  <td style={TD(i)}>{fmtDuration(t.durationMin)}</td>
                  <td style={TD(i)}>{t.avgSpeed} km/h</td>
                  <td style={{ ...TD(i), color:t.maxSpeed>90?'var(--red)':t.maxSpeed>70?'var(--amber)':'var(--ink2)', fontWeight:t.maxSpeed>90?700:400 }}>{t.maxSpeed} km/h</td>
                  <td style={TD(i)}>{t.fuelUsedL.toFixed(1)} L</td>
                  <td style={TD(i)}><span style={{ fontSize:10, fontWeight:600, padding:'2px 6px', borderRadius:4, background:t.status==='Completed'?'#ecfdf5':'var(--amber-lt)', color:t.status==='Completed'?'#065f46':'var(--amber)' }}>{t.status}</span></td>
                </tr>
              );
            })}
            {recent.length===0&&<tr><td colSpan={10} style={{ padding:30, textAlign:'center', color:'var(--ink3)' }}>No trips found</td></tr>}
          </tbody>
        </table>
      </Section>
    </>
  );
}

/* ── REPORT 9: Vehicle Track Report ─────────────────────────────────── */
function VehicleTrackReport({ trips, vehicles, isSuperAdmin, tenantId, accent }: {
  trips:     ReturnType<typeof useTripsStore.getState>['trips'];
  vehicles:  ReturnType<typeof useVehiclesStore.getState>['vehicles'];
  isSuperAdmin: boolean; tenantId: string; accent: string;
}) {
  const scopedVehicles = isSuperAdmin ? vehicles : vehicles.filter(v => v.tenantId === tenantId);
  const [vehicleId, setVehicleId] = useState(scopedVehicles[0]?.id ?? '');
  const [dateFrom,  setDateFrom]  = useState(() => { const d = new Date(); d.setDate(d.getDate()-7); return d.toISOString().slice(0,10); });
  const [dateTo,    setDateTo]    = useState(() => new Date().toISOString().slice(0,10));
  const [timeFrom,  setTimeFrom]  = useState('00:00');
  const [timeTo,    setTimeTo]    = useState('23:59');
  const [applied,   setApplied]   = useState(false);
  const [activeTab, setActiveTab] = useState<'track'|'stops'|'speed'|'idle'>('track');

  const vehicle = scopedVehicles.find(v => v.id === vehicleId);

  /* ── Generate deterministic track pings from trips ─────────────── */
  const trackData = useMemo(() => {
    if (!applied || !vehicleId) return [];
    const fromTs = new Date(`${dateFrom}T${timeFrom}:00`).getTime();
    const toTs   = new Date(`${dateTo}T${timeTo}:00`).getTime();
    const vehicleTrips = trips
      .filter(t => t.vehicleId === vehicleId)
      .filter(t => {
        const ts = new Date(t.dateISO).getTime();
        return ts >= fromTs && ts <= toTs;
      });

    const pings: {
      ts: string; lat: number; lng: number; speed: number;
      heading: string; fuel: number; engine: boolean;
      event: string; eventSev: string; address: string;
    }[] = [];

    const headings = ['N','NE','E','SE','S','SW','W','NW'];
    const events   = ['—','—','—','—','Speeding','—','—','Hard brake','—','—','Idle','—','Geofence entry','—','—'];
    const evSev    = { 'Speeding':'warning','Hard brake':'critical','Idle':'info','Geofence entry':'info','—':'none' } as Record<string,string>;
    const streets  = ['5th Ave','Broadway','I-95 N','Route 1','FDR Drive','Lexington Ave','Atlantic Ave','Park Ave'];

    let seed = vehicleTrips.length || 7;
    const rnd = () => { seed = (seed * 1664525 + 1013904223) & 0xffffffff; return Math.abs(seed) / 0xffffffff; };

    let baseLat = vehicle?.latitude ?? -1.286 + (rnd()-0.5)*0.04;
    let baseLng = vehicle?.longitude ?? 36.817 + (rnd()-0.5)*0.04;
    let curFuel = vehicle?.fuelLevel ?? 60;
    let curSpeed = 0;

    const startTs = fromTs;
    const endTs   = toTs;
    const interval = 5 * 60 * 1000; // 5-minute pings

    for (let ts = startTs; ts <= endTs; ts += interval) {
      const d = new Date(ts);
      const h = d.getHours();
      const isNight = h < 6 || h > 22;
      const isMoving = !isNight && rnd() > 0.15;

      if (isMoving) {
        curSpeed = Math.round(30 + rnd() * 80);
        baseLat += (rnd()-0.5)*0.003;
        baseLng += (rnd()-0.5)*0.003;
      } else {
        curSpeed = 0;
      }
      curFuel = Math.max(5, curFuel - rnd()*0.3);

      const evLabel = isMoving ? events[Math.floor(rnd()*events.length)] : (rnd()>0.7 ? 'Idle' : '—');
      const speed = evLabel === 'Speeding' ? Math.round(85 + rnd()*30) : curSpeed;

      pings.push({
        ts: d.toLocaleString('en-GB',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit',second:'2-digit'}),
        lat: parseFloat(baseLat.toFixed(5)),
        lng: parseFloat(baseLng.toFixed(5)),
        speed,
        heading: headings[Math.floor(rnd()*headings.length)],
        fuel: Math.round(curFuel),
        engine: isMoving || rnd()>0.8,
        event: evLabel,
        eventSev: evSev[evLabel] ?? 'none',
        address: streets[Math.floor(rnd()*streets.length)],
      });
    }
    return pings;
  }, [applied, vehicleId, dateFrom, dateTo, timeFrom, timeTo, trips, vehicle]);

  /* ── Derived analytics ──────────────────────────────────────────── */
  const movingPings = trackData.filter(p => p.speed > 0);
  const idlePings   = trackData.filter(p => p.engine && p.speed === 0);
  const stopPings   = trackData.filter(p => !p.engine);
  const eventPings  = trackData.filter(p => p.event !== '—');
  const speedPings  = trackData.filter(p => p.event === 'Speeding');
  const maxSpeed    = trackData.reduce((m,p) => Math.max(m, p.speed), 0);
  const avgSpeed    = movingPings.length ? Math.round(movingPings.reduce((s,p)=>s+p.speed,0)/movingPings.length) : 0;
  const fuelStart   = trackData[0]?.fuel ?? 0;
  const fuelEnd     = trackData[trackData.length-1]?.fuel ?? 0;
  const fuelUsed    = Math.max(0, fuelStart - fuelEnd);
  const distKm      = parseFloat((movingPings.length * 5 / 60 * avgSpeed).toFixed(1));
  const durationMin = Math.round(trackData.length * 5);

  /* ── Stop segments ──────────────────────────────────────────────── */
  const stopSegments = useMemo(() => {
    const segs: { start: string; end: string; dur: number; lat: number; lng: number; addr: string }[] = [];
    let inStop = false; let startIdx = 0;
    trackData.forEach((p, i) => {
      if (!p.engine && !inStop) { inStop = true; startIdx = i; }
      if ((p.engine || i === trackData.length-1) && inStop) {
        segs.push({ start: trackData[startIdx].ts, end: p.ts, dur: (i - startIdx) * 5,
          lat: trackData[startIdx].lat, lng: trackData[startIdx].lng, addr: trackData[startIdx].address });
        inStop = false;
      }
    });
    return segs;
  }, [trackData]);

  const inp: React.CSSProperties = { padding:'7px 10px', border:'1px solid var(--border)', borderRadius:7, fontSize:12, color:'var(--ink)', background:'#fff', fontFamily:'inherit' };
  const evColor: Record<string,string> = { warning:'#d97706', critical:'var(--red)', info:accent, none:'var(--ink3)' };
  const evBg:    Record<string,string> = { warning:'#fef3c7', critical:'var(--red-lt)', info:`${accent}20`, none:'transparent' };

  return (
    <div>
      {/* ── Filter panel ──────────────────────────────────────────── */}
      <div style={{ background:'#fff', border:'1px solid var(--border)', borderRadius:10, padding:'16px 18px', marginBottom:14, boxShadow:'0 1px 4px rgba(0,0,0,0.04)' }}>
        <div style={{ fontSize:11, fontWeight:700, color:'var(--ink)', marginBottom:12, display:'flex', alignItems:'center', gap:7 }}>
          <i className="ti ti-filter" style={{ fontSize:13, color:accent }} /> Track Parameters
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr 1fr auto', gap:10, alignItems:'flex-end' }}>
          <div>
            <label style={{ fontSize:9, fontWeight:700, color:'var(--ink3)', display:'block', textTransform:'uppercase', letterSpacing:'0.6px', marginBottom:5 }}>
              <i className="ti ti-truck" style={{ marginRight:4 }} />Vehicle
            </label>
            <select value={vehicleId} onChange={e => setVehicleId(e.target.value)} style={{ ...inp, width:'100%' }}>
              <option value="">— Select vehicle —</option>
              {scopedVehicles.map(v => <option key={v.id} value={v.id}>{v.plate} — {v.make} {v.model}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize:9, fontWeight:700, color:'var(--ink3)', display:'block', textTransform:'uppercase', letterSpacing:'0.6px', marginBottom:5 }}>
              <i className="ti ti-calendar" style={{ marginRight:4 }} />Date from
            </label>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={{ ...inp, width:'100%', boxSizing:'border-box' }} />
          </div>
          <div>
            <label style={{ fontSize:9, fontWeight:700, color:'var(--ink3)', display:'block', textTransform:'uppercase', letterSpacing:'0.6px', marginBottom:5 }}>
              <i className="ti ti-clock" style={{ marginRight:4 }} />Time from
            </label>
            <input type="time" value={timeFrom} onChange={e => setTimeFrom(e.target.value)} style={{ ...inp, width:'100%', boxSizing:'border-box' }} />
          </div>
          <div>
            <label style={{ fontSize:9, fontWeight:700, color:'var(--ink3)', display:'block', textTransform:'uppercase', letterSpacing:'0.6px', marginBottom:5 }}>
              <i className="ti ti-calendar" style={{ marginRight:4 }} />Date to
            </label>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={{ ...inp, width:'100%', boxSizing:'border-box' }} />
          </div>
          <div>
            <label style={{ fontSize:9, fontWeight:700, color:'var(--ink3)', display:'block', textTransform:'uppercase', letterSpacing:'0.6px', marginBottom:5 }}>
              <i className="ti ti-clock" style={{ marginRight:4 }} />Time to
            </label>
            <input type="time" value={timeTo} onChange={e => setTimeTo(e.target.value)} style={{ ...inp, width:'100%', boxSizing:'border-box' }} />
          </div>
          <button
            onClick={() => { if (vehicleId) setApplied(true); }}
            disabled={!vehicleId}
            style={{ padding:'8px 18px', background: vehicleId ? accent : 'var(--cream3)', color: vehicleId ? '#fff' : 'var(--ink3)', border:'none', borderRadius:7, fontSize:12, fontWeight:700, cursor: vehicleId ? 'pointer' : 'default', fontFamily:'inherit', display:'flex', alignItems:'center', gap:6, whiteSpace:'nowrap' }}
          >
            <i className="ti ti-player-play" style={{ fontSize:12 }} /> Run Report
          </button>
        </div>
        {applied && vehicle && (
          <div style={{ marginTop:10, padding:'6px 10px', background:`${accent}18`, borderRadius:6, display:'flex', alignItems:'center', gap:8, fontSize:11, color:accent }}>
            <i className="ti ti-circle-check" style={{ fontSize:13 }} />
            <strong>{vehicle.plate}</strong> · {vehicle.make} {vehicle.model} · {vehicle.year} ·
            Driver: <strong>{vehicle.driverName ?? 'Unassigned'}</strong> ·
            Period: <strong>{dateFrom} {timeFrom}</strong> → <strong>{dateTo} {timeTo}</strong> ·
            <strong>{trackData.length}</strong> pings captured
          </div>
        )}
      </div>

      {!applied && (
        <div style={{ padding:'60px 32px', textAlign:'center', background:'#fff', borderRadius:10, border:'1px solid var(--border)' }}>
          <i className="ti ti-map-route" style={{ fontSize:48, color:'var(--ink3)', opacity:0.25, display:'block', marginBottom:14 }} />
          <div style={{ fontSize:15, fontWeight:700, color:'var(--ink)', marginBottom:6 }}>Select a vehicle and date range</div>
          <div style={{ fontSize:12, color:'var(--ink3)' }}>Choose parameters above and click Run Report to generate the complete vehicle track.</div>
        </div>
      )}

      {applied && trackData.length === 0 && (
        <div style={{ padding:'60px 32px', textAlign:'center', background:'#fff', borderRadius:10, border:'1px solid var(--border)' }}>
          <i className="ti ti-calendar-off" style={{ fontSize:48, color:'var(--ink3)', opacity:0.25, display:'block', marginBottom:14 }} />
          <div style={{ fontSize:15, fontWeight:700, color:'var(--ink)', marginBottom:6 }}>No track data found</div>
          <div style={{ fontSize:12, color:'var(--ink3)' }}>No trips recorded for this vehicle in the selected period.</div>
        </div>
      )}

      {applied && trackData.length > 0 && (
        <>
          {/* ── KPI summary strip ─────────────────────────────────── */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(8,1fr)', gap:8, marginBottom:14 }}>
            {[
              { icon:'ti-route',            color:accent,        label:'Distance',    value:`${distKm} km`           },
              { icon:'ti-clock',            color:'#7c3aed',     label:'Duration',    value:fmtDuration(durationMin)  },
              { icon:'ti-gauge',            color:accent,        label:'Avg Speed',   value:`${avgSpeed} km/h`        },
              { icon:'ti-gauge-2',          color:'var(--red)',   label:'Max Speed',   value:`${maxSpeed} km/h`        },
              { icon:'ti-gas-station',      color:'#d97706',     label:'Fuel Used',   value:`${fuelUsed.toFixed(1)}%` },
              { icon:'ti-player-pause',     color:'var(--amber)',  label:'Idle Pings',  value:idlePings.length          },
              { icon:'ti-alert-triangle',   color:'var(--red)',   label:'Events',      value:eventPings.length         },
              { icon:'ti-map-pin-off',      color:'var(--ink3)', label:'Engine Off',  value:stopPings.length          },
            ].map(k => (
              <div key={k.label} style={{ background:'#fff', border:'1px solid var(--border)', borderRadius:7, padding:'8px 10px', boxShadow:'0 1px 2px rgba(0,0,0,0.04)', position:'relative', overflow:'hidden' }}>
                <div style={{ position:'absolute', left:0, top:0, bottom:0, width:3, background:k.color, borderRadius:'7px 0 0 7px' }} />
                <div style={{ paddingLeft:6 }}>
                  <div style={{ fontSize:8, fontWeight:700, letterSpacing:'0.8px', textTransform:'uppercase', color:'var(--ink3)', marginBottom:2 }}>{k.label}</div>
                  <div style={{ fontSize:16, fontWeight:700, color:'var(--ink)', lineHeight:1 }}>{k.value}</div>
                </div>
              </div>
            ))}
          </div>

          {/* ── Vehicle details banner ────────────────────────────── */}
          {vehicle && (
            <div style={{ background:'var(--cream)', border:'1px solid var(--border)', borderRadius:8, padding:'10px 14px', marginBottom:14, display:'flex', alignItems:'center', gap:16, flexWrap:'wrap' }}>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <i className="ti ti-truck" style={{ fontSize:16, color:accent }} />
                <span style={{ fontSize:13, fontWeight:700, color:'var(--ink)' }}>{vehicle.plate}</span>
                <span style={{ fontSize:11, color:'var(--ink3)' }}>{vehicle.year} {vehicle.make} {vehicle.model}</span>
              </div>
              {[
                { icon:'ti-user',        val: vehicle.driverName ?? 'Unassigned' },
                { icon:'ti-category',    val: vehicle.category ?? '—' },
                { icon:'ti-gas-station', val: vehicle.fuelType ?? '—' },
                { icon:'ti-road',        val: `${vehicle.odometer.toLocaleString()} km ODO` },
                { icon:'ti-satellite',   val: vehicle.latitude ? `${vehicle.latitude.toFixed(4)}, ${vehicle.longitude?.toFixed(4)}` : 'No GPS' },
              ].map(d => (
                <div key={d.icon} style={{ display:'flex', alignItems:'center', gap:5, fontSize:11, color:'var(--ink2)' }}>
                  <i className={`ti ${d.icon}`} style={{ fontSize:12, color:'var(--ink3)' }} />{d.val}
                </div>
              ))}
            </div>
          )}

          {/* ── Journey map ───────────────────────────────────────── */}
          <div style={{ background:'#fff', border:'1px solid var(--border)', borderRadius:10, overflow:'hidden', marginBottom:14, boxShadow:'0 1px 4px rgba(0,0,0,0.05)' }}>
            {/* Map header */}
            <div style={{ padding:'9px 14px', background:'var(--cream)', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <div style={{ display:'flex', alignItems:'center', gap:7 }}>
                <i className="ti ti-map-route" style={{ fontSize:13, color:accent }} />
                <span style={{ fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:0.7, color:'var(--ink)' }}>
                  Full Journey Track
                </span>
                <span style={{ fontSize:10, color:'var(--ink3)', fontWeight:400 }}>— {trackData.length} GPS pings</span>
              </div>
              <div style={{ display:'flex', gap:10, fontSize:10, color:'var(--ink3)' }}>
                {[
                  { color:accent,    label:'Normal (≤60 km/h)' },
                  { color:'#f59e0b', label:'Brisk (61–90 km/h)' },
                  { color:'#ef4444', label:'Speeding (>90 km/h)' },
                  { color:'#9ca3af', label:'Stopped' },
                ].map(l => (
                  <span key={l.label} style={{ display:'flex', alignItems:'center', gap:4 }}>
                    <span style={{ width:20, height:4, borderRadius:2, background:l.color, display:'inline-block' }} />
                    {l.label}
                  </span>
                ))}
                <span style={{ display:'flex', alignItems:'center', gap:4 }}>
                  <span style={{ width:10, height:10, borderRadius:'50%', background:'#16a34a', display:'inline-block', border:'2px solid #fff', outline:'1px solid #16a34a' }} />
                  Start
                </span>
                <span style={{ display:'flex', alignItems:'center', gap:4 }}>
                  <span style={{ width:10, height:10, borderRadius:'50%', background:'#ef4444', display:'inline-block', border:'2px solid #fff', outline:'1px solid #ef4444' }} />
                  End
                </span>
              </div>
            </div>
            {/* Map canvas */}
            <TrackJourneyMap pings={trackData} accent={accent} height={440} />
            {/* Map footer */}
            <div style={{ padding:'7px 14px', background:'var(--cream)', borderTop:'1px solid var(--border)', display:'flex', gap:18, flexWrap:'wrap', fontSize:11, color:'var(--ink3)' }}>
              <span><i className="ti ti-route" style={{ marginRight:4, color:accent }} />{distKm} km total distance</span>
              <span><i className="ti ti-clock" style={{ marginRight:4, color:accent }} />{fmtDuration(durationMin)} drive time</span>
              <span><i className="ti ti-gauge" style={{ marginRight:4, color:accent }} />Avg {avgSpeed} km/h · Max {maxSpeed} km/h</span>
              <span><i className="ti ti-alert-triangle" style={{ marginRight:4, color:'#ef4444' }} />{eventPings.length} events flagged</span>
              <span><i className="ti ti-map-pin-off" style={{ marginRight:4, color:'var(--ink3)' }} />{stopPings.length} engine-off stops</span>
            </div>
          </div>

          {/* ── Tab strip ─────────────────────────────────────────── */}
          <div style={{ display:'flex', gap:2, background:'var(--cream2)', borderRadius:7, padding:3, marginBottom:12, width:'fit-content' }}>
            {([
              { id:'track' as const, label:`Track Log (${trackData.length})`,      icon:'ti-list-details'    },
              { id:'stops' as const, label:`Stops (${stopSegments.length})`,        icon:'ti-map-pin-off'     },
              { id:'speed' as const, label:`Speed Events (${speedPings.length})`,   icon:'ti-alert-triangle'  },
              { id:'idle'  as const, label:`Idle Periods (${idlePings.length})`,    icon:'ti-player-pause'    },
            ]).map(t => (
              <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
                display:'flex', alignItems:'center', gap:5, padding:'5px 14px', fontSize:11, fontWeight:600,
                borderRadius:5, border:'none', cursor:'pointer', fontFamily:'inherit', transition:'all 0.15s',
                background: activeTab===t.id ? '#fff' : 'transparent',
                color:      activeTab===t.id ? 'var(--ink)' : 'var(--ink3)',
                boxShadow:  activeTab===t.id ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              }}>
                <i className={`ti ${t.icon}`} style={{ fontSize:11 }} />{t.label}
              </button>
            ))}
          </div>

          {/* ── Track Log tab ─────────────────────────────────────── */}
          {activeTab === 'track' && (
            <div style={{ background:'#fff', border:'1px solid var(--border)', borderRadius:10, overflow:'hidden' }}>
              <div style={{ overflowX:'auto', maxHeight:520, overflowY:'auto' }}>
                <table style={{ width:'100%', borderCollapse:'collapse', minWidth:1000 }}>
                  <thead style={{ position:'sticky', top:0, zIndex:1 }}>
                    <tr>
                      {['#','Timestamp','Address / Road','Coordinates','Speed','Heading','Fuel','Engine','Event'].map(h => (
                        <th key={h} style={TH}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {trackData.map((p, i) => (
                      <tr key={i} style={{ background: i%2===0?'#fff':'var(--cream)' }}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background=`${accent}18`}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background=i%2===0?'#fff':'var(--cream)'}
                      >
                        <td style={{ ...TD(i), color:'var(--ink3)', width:36, textAlign:'center' }}>{i+1}</td>
                        <td style={{ ...TD(i), fontFamily:'monospace', fontSize:11, whiteSpace:'nowrap' }}>{p.ts}</td>
                        <td style={{ ...TD(i), maxWidth:160 }}>
                          <div style={{ fontSize:11, color:'var(--ink2)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.address}</div>
                        </td>
                        <td style={{ ...TD(i), fontFamily:'monospace', fontSize:10, color:'var(--ink3)', whiteSpace:'nowrap' }}>{p.lat}, {p.lng}</td>
                        <td style={{ ...TD(i), whiteSpace:'nowrap' }}>
                          <span style={{ fontSize:11, fontWeight:600, color: p.speed>90?'var(--red)':p.speed>60?'#d97706':accent }}>
                            {p.speed > 90 && <i className="ti ti-alert-triangle" style={{ fontSize:9, marginRight:3 }} />}
                            {p.speed} <span style={{ fontSize:9, fontWeight:400, color:'var(--ink3)' }}>km/h</span>
                          </span>
                        </td>
                        <td style={{ ...TD(i) }}>
                          <span style={{ fontSize:10, fontWeight:600, padding:'1px 6px', borderRadius:3, background:'var(--cream2)', color:'var(--ink2)' }}>{p.heading}</span>
                        </td>
                        <td style={{ ...TD(i) }}>
                          <div style={{ display:'flex', alignItems:'center', gap:5 }}>
                            <div style={{ width:36, height:5, background:'var(--cream3)', borderRadius:3, overflow:'hidden' }}>
                              <div style={{ width:`${p.fuel}%`, height:'100%', background:p.fuel<20?'var(--red)':p.fuel<40?'#d97706':accent, borderRadius:3 }} />
                            </div>
                            <span style={{ fontSize:10, color:'var(--ink2)' }}>{p.fuel}%</span>
                          </div>
                        </td>
                        <td style={{ ...TD(i), textAlign:'center' }}>
                          <span style={{ fontSize:10, fontWeight:700, padding:'1px 7px', borderRadius:10, background:p.engine?`${accent}18`:'var(--cream3)', color:p.engine?accent:'var(--ink3)' }}>
                            {p.engine ? 'ON' : 'OFF'}
                          </span>
                        </td>
                        <td style={{ ...TD(i) }}>
                          {p.event !== '—' ? (
                            <span style={{ fontSize:9, fontWeight:700, padding:'2px 7px', borderRadius:10, background:evBg[p.eventSev], color:evColor[p.eventSev], border:`1px solid ${evColor[p.eventSev]}30`, whiteSpace:'nowrap' }}>
                              <i className={`ti ${p.eventSev==='critical'?'ti-alert-octagon':p.eventSev==='warning'?'ti-alert-triangle':'ti-info-circle'}`} style={{ fontSize:8, marginRight:3 }} />
                              {p.event}
                            </span>
                          ) : <span style={{ color:'var(--ink3)', fontSize:11 }}>—</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{ padding:'8px 14px', background:'var(--cream)', borderTop:'1px solid var(--border)', fontSize:11, color:'var(--ink3)', display:'flex', justifyContent:'space-between' }}>
                <span>{trackData.length} pings · 5-min interval</span>
                <span>{eventPings.length} events flagged · {speedPings.length} speed violations</span>
              </div>
            </div>
          )}

          {/* ── Stops tab ─────────────────────────────────────────── */}
          {activeTab === 'stops' && (
            <div style={{ background:'#fff', border:'1px solid var(--border)', borderRadius:10, overflow:'hidden' }}>
              {stopSegments.length === 0 ? (
                <div style={{ padding:40, textAlign:'center', color:'var(--ink3)', fontSize:12 }}>No engine-off stops recorded in this period.</div>
              ) : (
                <table style={{ width:'100%', borderCollapse:'collapse' }}>
                  <thead>
                    <tr>{['#','Arrival','Departure','Duration','Location','Coordinates'].map(h=><th key={h} style={TH}>{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {stopSegments.map((s,i) => (
                      <tr key={i} style={{ background:i%2===0?'#fff':'var(--cream)' }}>
                        <td style={{ ...TD(i), color:'var(--ink3)', width:36, textAlign:'center' }}>{i+1}</td>
                        <td style={{ ...TD(i), fontFamily:'monospace', fontSize:11 }}>{s.start}</td>
                        <td style={{ ...TD(i), fontFamily:'monospace', fontSize:11 }}>{s.end}</td>
                        <td style={{ ...TD(i) }}>
                          <span style={{ fontSize:11, fontWeight:600, color: s.dur>30?'var(--red)':s.dur>10?'#d97706':accent }}>
                            {fmtDuration(s.dur)}
                          </span>
                        </td>
                        <td style={{ ...TD(i), fontSize:11 }}>{s.addr}</td>
                        <td style={{ ...TD(i), fontFamily:'monospace', fontSize:10, color:'var(--ink3)' }}>{s.lat}, {s.lng}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              <div style={{ padding:'8px 14px', background:'var(--cream)', borderTop:'1px solid var(--border)', fontSize:11, color:'var(--ink3)' }}>
                {stopSegments.length} stops · Total stopped time: {fmtDuration(stopSegments.reduce((s,x)=>s+x.dur,0))}
              </div>
            </div>
          )}

          {/* ── Speed Events tab ──────────────────────────────────── */}
          {activeTab === 'speed' && (
            <div style={{ background:'#fff', border:'1px solid var(--border)', borderRadius:10, overflow:'hidden' }}>
              {speedPings.length === 0 ? (
                <div style={{ padding:40, textAlign:'center', color:'var(--ink3)', fontSize:12 }}>
                  <i className="ti ti-circle-check" style={{ fontSize:32, color:accent, display:'block', marginBottom:8, opacity:0.5 }} />
                  No speed violations in this period.
                </div>
              ) : (
                <table style={{ width:'100%', borderCollapse:'collapse' }}>
                  <thead>
                    <tr>{['#','Timestamp','Location','Recorded Speed','Over Limit By','Heading','Fuel'].map(h=><th key={h} style={TH}>{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {speedPings.map((p,i) => (
                      <tr key={i} style={{ background:'#fff7f7' }}>
                        <td style={{ ...TD(i), color:'var(--red)', width:36, textAlign:'center' }}>{i+1}</td>
                        <td style={{ ...TD(i), fontFamily:'monospace', fontSize:11 }}>{p.ts}</td>
                        <td style={{ ...TD(i), fontSize:11 }}>{p.address}</td>
                        <td style={{ ...TD(i) }}>
                          <span style={{ fontSize:13, fontWeight:800, color:'var(--red)' }}>{p.speed} <span style={{ fontSize:10, fontWeight:400 }}>km/h</span></span>
                        </td>
                        <td style={{ ...TD(i) }}>
                          <span style={{ fontSize:11, fontWeight:700, color:'var(--red)' }}>+{Math.max(0,p.speed-80)} km/h</span>
                        </td>
                        <td style={{ ...TD(i) }}><span style={{ fontSize:10, fontWeight:600, padding:'1px 6px', borderRadius:3, background:'var(--cream2)', color:'var(--ink2)' }}>{p.heading}</span></td>
                        <td style={{ ...TD(i), fontSize:11 }}>{p.fuel}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              <div style={{ padding:'8px 14px', background:'var(--cream)', borderTop:'1px solid var(--border)', fontSize:11, color:'var(--ink3)' }}>
                {speedPings.length} violations · Limit: 80 km/h · Max recorded: {maxSpeed} km/h
              </div>
            </div>
          )}

          {/* ── Idle tab ──────────────────────────────────────────── */}
          {activeTab === 'idle' && (
            <div style={{ background:'#fff', border:'1px solid var(--border)', borderRadius:10, overflow:'hidden' }}>
              {idlePings.length === 0 ? (
                <div style={{ padding:40, textAlign:'center', color:'var(--ink3)', fontSize:12 }}>No idle periods recorded.</div>
              ) : (
                <table style={{ width:'100%', borderCollapse:'collapse' }}>
                  <thead>
                    <tr>{['#','Timestamp','Location','Coordinates','Fuel','Engine','Duration Note'].map(h=><th key={h} style={TH}>{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {idlePings.map((p,i) => (
                      <tr key={i} style={{ background:i%2===0?'#fff':'var(--cream)' }}>
                        <td style={{ ...TD(i), color:'var(--ink3)', width:36, textAlign:'center' }}>{i+1}</td>
                        <td style={{ ...TD(i), fontFamily:'monospace', fontSize:11 }}>{p.ts}</td>
                        <td style={{ ...TD(i), fontSize:11 }}>{p.address}</td>
                        <td style={{ ...TD(i), fontFamily:'monospace', fontSize:10, color:'var(--ink3)' }}>{p.lat}, {p.lng}</td>
                        <td style={{ ...TD(i), fontSize:11 }}>{p.fuel}%</td>
                        <td style={{ ...TD(i), textAlign:'center' }}>
                          <span style={{ fontSize:10, fontWeight:700, padding:'1px 7px', borderRadius:10, background:`${accent}18`, color:accent }}>ON</span>
                        </td>
                        <td style={{ ...TD(i) }}>
                          <span style={{ fontSize:10, color:'#d97706', fontWeight:600 }}>Engine on, no movement · 5 min window</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              <div style={{ padding:'8px 14px', background:'var(--cream)', borderTop:'1px solid var(--border)', fontSize:11, color:'var(--ink3)' }}>
                {idlePings.length} idle pings · Est. wasted fuel: ~{(idlePings.length * 0.3).toFixed(1)} L
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ── REPORT 8: Tracking History ─────────────────────────────────────── */
function TrackingHistory({ trips, vehicles, isSuperAdmin, tenantId, accent }: {
  trips:     ReturnType<typeof useTripsStore.getState>['trips'];
  vehicles:  ReturnType<typeof useVehiclesStore.getState>['vehicles'];
  isSuperAdmin: boolean; tenantId: string; accent: string;
}) {
  const scopedVehicles = isSuperAdmin ? vehicles : vehicles.filter(v=>v.tenantId===tenantId);
  const allowedIds     = isSuperAdmin ? null : new Set(scopedVehicles.map(v=>v.id));
  const scopedTrips    = allowedIds ? trips.filter(t=>allowedIds.has(t.vehicleId)) : trips;

  const trackedToday   = scopedVehicles.filter(v=>v.latitude&&v.longitude).length;
  const totalPositions = scopedTrips.length * 12; // estimate: ~12 GPS pings per trip
  const totalDist      = Math.round(scopedTrips.reduce((s,t)=>s+t.distanceKm,0));

  // Daily trip count (last 7 days)
  const byDate = scopedTrips.reduce<Record<string,number>>((acc,t)=>{ const d=t.dateISO.substring(0,10); acc[d]=(acc[d]??0)+1; return acc; },{});
  const last7  = Array.from({length:7},(_,i)=>{ const d=new Date(); d.setDate(d.getDate()-(6-i)); return d.toISOString().substring(0,10); });
  const dailyData = last7.map(d=>({ label:new Date(d).toLocaleDateString('en-GB',{weekday:'short'}).substring(0,3), value:byDate[d]??0 }));

  // Hourly activity
  const byHour = new Array(24).fill(0);
  scopedTrips.forEach(t=>{ const h=parseInt(t.date.substring(11,13)||'0',10); if(!isNaN(h)&&h>=0&&h<24) byHour[h]++; });
  const hourlyData = Array.from({length:24},(_,h)=>({ label:h%6===0?`${h}h`:'', value:byHour[h] }));

  // Per-vehicle activity
  const vehicleActivity = scopedVehicles.map(v=>{
    const vTrips=scopedTrips.filter(t=>t.vehicleId===v.id);
    const vDist=vTrips.reduce((s,t)=>s+t.distanceKm,0);
    const vDurMin=vTrips.reduce((s,t)=>s+t.durationMin,0);
    const lastTrip=[...vTrips].sort((a,b)=>b.dateISO.localeCompare(a.dateISO))[0];
    return { id:v.id, plate:v.plate, make:v.make, model:v.model, status:v.status, lat:v.latitude, lng:v.longitude, trips:vTrips.length, dist:Math.round(vDist), durMin:vDurMin, lastSeen:v.lastSeenAt, lastLocation:lastTrip?.to??'—', hasGps:!!(v.latitude&&v.longitude) };
  }).sort((a,b)=>b.trips-a.trips);

  // Fleet map pins
  const pins: VehiclePin[] = scopedVehicles
    .filter(v=>v.latitude&&v.longitude)
    .map(v=>({
      id:v.id, driver:v.driverName??'Unassigned',
      status:(v.status==='active'||v.status==='idle') ? v.status : 'offline',
      speed:v.speedKmh??0, lat:v.latitude!, lng:v.longitude!, fuel:v.fuelLevel??0,
      make:v.make, model:v.model, year:v.year, category:v.category, odometer:v.odometer, tenantId:v.tenantId,
    }));

  return (
    <>
      <div style={{ display:'flex', gap:10, marginBottom:14, flexWrap:'wrap' }}>
        <KpiCard icon="ti-satellite"  iconColor={accent}  label="Vehicles Tracked"   value={trackedToday} sub={`of ${scopedVehicles.length} total`} />
        <KpiCard icon="ti-map-pin"    iconColor="#7c3aed" label="GPS Pings (est.)"   value={totalPositions.toLocaleString()} />
        <KpiCard icon="ti-road"       iconColor={accent}  label="Total Distance"     value={`${totalDist.toLocaleString()} km`} />
        <KpiCard icon="ti-route"      iconColor="#d97706" label="Total Trips Logged" value={scopedTrips.length} />
        <KpiCard icon="ti-clock"      iconColor={accent}  label="Total Drive Time"   value={fmtDuration(scopedTrips.reduce((s,t)=>s+t.durationMin,0))} />
      </div>

      {/* Fleet map */}
      {pins.length > 0 && (
        <Section title="Live vehicle positions" icon="ti-map">
          <div style={{ borderRadius:8, overflow:'hidden', border:'1px solid var(--border)' }}>
            <FleetMap vehicles={pins} height={360} fitAll />
          </div>
          <div style={{ display:'flex', gap:12, marginTop:10, fontSize:11, color:'var(--ink3)' }}>
            <span><span style={{ width:8,height:8,borderRadius:'50%',background:accent,display:'inline-block',marginRight:5 }} />Active ({pins.filter(p=>p.status==='active').length})</span>
            <span><span style={{ width:8,height:8,borderRadius:'50%',background:'#d97706',display:'inline-block',marginRight:5 }} />Idle ({pins.filter(p=>p.status==='idle').length})</span>
            <span><span style={{ width:8,height:8,borderRadius:'50%',background:'#9ca3af',display:'inline-block',marginRight:5 }} />Offline ({pins.filter(p=>p.status==='offline').length})</span>
          </div>
        </Section>
      )}

      {/* Activity charts */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:14 }}>
        <Section title="Daily trips — last 7 days" icon="ti-chart-bar">
          <BarChart data={dailyData} color={accent} height={90} showValues />
        </Section>
        <Section title="Activity by hour of day" icon="ti-clock">
          <BarChart data={hourlyData} color="#7c3aed" height={90} />
          <div style={{ fontSize:10, color:'var(--ink3)', marginTop:6 }}>
            Peak hour: {byHour.indexOf(Math.max(...byHour))}:00 · Night ops: {byHour.slice(22).reduce((s,n)=>s+n,0)+byHour.slice(0,6).reduce((s,n)=>s+n,0)} trips
          </div>
        </Section>
      </div>

      {/* Per-vehicle tracking table */}
      <Section title={`Vehicle tracking summary (${vehicleActivity.length} vehicles)`} icon="ti-list">
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead><tr>{['Vehicle','Status','GPS','Trips','Distance','Drive Time','Last Location','Last Seen'].map(h=><th key={h} style={TH}>{h}</th>)}</tr></thead>
          <tbody>
            {vehicleActivity.map((v,i)=>(
              <tr key={v.id}>
                <td style={{ ...TD(i), fontWeight:700, color:'var(--ink)' }}>
                  {v.plate}
                  <div style={{ fontSize:10, color:'var(--ink3)', fontWeight:400 }}>{v.make} {v.model}</div>
                </td>
                <td style={TD(i)}><span style={{ fontSize:10, fontWeight:600, padding:'2px 7px', borderRadius:4, background:STATUS_BG[v.status]??'var(--cream3)', color:STATUS_COLOR[v.status]??'var(--ink3)' }}>{v.status}</span></td>
                <td style={TD(i)}>
                  <span style={{ display:'inline-flex', alignItems:'center', gap:4, fontSize:10, fontWeight:600,
                    color:v.hasGps?accent:'var(--ink3)',
                    background:v.hasGps?`${accent}18`:'var(--cream3)',
                    padding:'2px 7px', borderRadius:4 }}>
                    <i className={`ti ${v.hasGps?'ti-satellite':'ti-satellite-off'}`} style={{ fontSize:10 }} />
                    {v.hasGps?'Live':'No GPS'}
                  </span>
                </td>
                <td style={TD(i)}>{v.trips}</td>
                <td style={{ ...TD(i), fontWeight:600, color:'var(--ink)' }}>{v.dist.toLocaleString()} km</td>
                <td style={TD(i)}>{fmtDuration(v.durMin)}</td>
                <td style={TD(i)}>{v.lastLocation}</td>
                <td style={{ ...TD(i), color:'var(--ink3)', fontSize:11 }}>{v.lastSeen ? new Date(v.lastSeen).toLocaleString('en-GB',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}) : '—'}</td>
              </tr>
            ))}
            {vehicleActivity.length===0&&<tr><td colSpan={8} style={{ padding:30, textAlign:'center', color:'var(--ink3)' }}>No tracking data available</td></tr>}
          </tbody>
        </table>
      </Section>
    </>
  );
}

/* ── Per-report colour theme ────────────────────────────────────────── */
type ReportTheme = { gradient: string; glow: string; accent: string; accentBg: string; headerText: string };
const REPORT_THEME: Record<string, ReportTheme> = {
  '1': { gradient:'linear-gradient(135deg, var(--hero-s) 0%, var(--hero-m) 55%, var(--hero-e) 100%)', glow:'rgba(196,145,42,0.45)', accent:'#c4912a', accentBg:'rgba(196,145,42,0.15)', headerText:'#f5d07a' },
  '2': { gradient:'linear-gradient(135deg, #1e1035 0%, #2d1b69 55%, #4c1d95 100%)', glow:'rgba(124,58,237,0.45)', accent:'#7c3aed', accentBg:'rgba(124,58,237,0.15)', headerText:'#c4b5fd' },
  '3': { gradient:'linear-gradient(135deg, #1c1008 0%, #431407 55%, #7c2d12 100%)', glow:'rgba(217,119,6,0.45)',  accent:'#d97706', accentBg:'rgba(217,119,6,0.15)',  headerText:'#fcd34d' },
  '4': { gradient:'linear-gradient(135deg, #1c0a0a 0%, #450a0a 55%, #7f1d1d 100%)', glow:'rgba(220,38,38,0.45)',  accent:'#dc2626', accentBg:'rgba(220,38,38,0.15)',  headerText:'#fca5a5' },
  '5': { gradient:'linear-gradient(135deg, var(--hero-s) 0%, var(--hero-m) 55%, var(--hero-e) 100%)', glow:'rgba(196,145,42,0.45)', accent:'#c4912a', accentBg:'rgba(196,145,42,0.15)', headerText:'#f5d07a' },
  '6': { gradient:'linear-gradient(135deg, #1c1008 0%, #431407 55%, #7c2d12 100%)', glow:'rgba(217,119,6,0.45)',  accent:'#d97706', accentBg:'rgba(217,119,6,0.15)',  headerText:'#fcd34d' },
  '7': { gradient:'linear-gradient(135deg, var(--hero-s) 0%, var(--hero-m) 55%, var(--hero-e) 100%)', glow:'rgba(196,145,42,0.45)', accent:'#c4912a', accentBg:'rgba(196,145,42,0.15)', headerText:'#f5d07a' },
  '8': { gradient:'linear-gradient(135deg, var(--hero-s) 0%, var(--hero-m) 55%, var(--hero-e) 100%)', glow:'rgba(196,145,42,0.45)', accent:'#c4912a', accentBg:'rgba(196,145,42,0.15)', headerText:'#f5d07a' },
  '9': { gradient:'linear-gradient(135deg, var(--hero-s) 0%, var(--hero-m) 55%, var(--hero-e) 100%)', glow:'rgba(196,145,42,0.45)', accent:'#c4912a', accentBg:'rgba(196,145,42,0.15)', headerText:'#f5d07a' },
};
const DEFAULT_THEME: ReportTheme = REPORT_THEME['1'];

/* ── Report metadata ────────────────────────────────────────────────── */
const REPORT_META: Record<string, { name: string; icon: string; subtitle: string; formats: string[] }> = {
  '1': { name:'Fleet Summary',        icon:'ti-truck',              subtitle:'Complete overview of fleet status, documents, and compliance', formats:['PDF','XLS'] },
  '2': { name:'Driver Performance',   icon:'ti-users',              subtitle:'Safety scores, HOS utilisation, and status breakdown',          formats:['PDF'] },
  '3': { name:'Fuel Consumption',     icon:'ti-gas-station',         subtitle:'Fuel levels, refuel requirements, and cost estimates',           formats:['XLS'] },
  '4': { name:'Geofence Violations',  icon:'ti-alert-hexagon',       subtitle:'Zone entry/exit violations, speeding, and after-hours events',   formats:['PDF'] },
  '5': { name:'Maintenance Schedule', icon:'ti-tool',                subtitle:'Overdue, upcoming, and completed maintenance across the fleet',   formats:['PDF'] },
  '6': { name:'Cost Analysis',        icon:'ti-currency-dollar',     subtitle:'Subscription revenue, MRR/ARR, and fleet operational costs',      formats:['XLS','PDF'] },
  '7': { name:'Trip Summary',         icon:'ti-route',               subtitle:'Trips, work hours, daily drive time, distances & driver activity', formats:['XLS'] },
  '8': { name:'Tracking History',     icon:'ti-satellite',           subtitle:'Fleet-wide GPS tracking, position history, routes & activity',    formats:['PDF','XLS'] },
  '9': { name:'Vehicle Track Report', icon:'ti-map-route',            subtitle:'Complete timestamped track of a single vehicle with date & time filters', formats:['PDF','XLS'] },
};

/* ── Page ───────────────────────────────────────────────────────────── */
export default function ReportDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const meta   = REPORT_META[id];

  const { user }     = useAuthStore();
  const role         = user?.role ?? 'viewer';
  const isSuperAdmin = role === 'super_admin' || role === 'platform_admin';
  const isOwner      = role === 'vehicle_owner';
  const tenantId     = user?.tenantId ?? '1';

  const storeVehicles  = useVehiclesStore(s => s.vehicles);
  const storeDrivers   = useDriversStore(s => s.drivers);
  const storeSchedules = useMaintenanceStore(s => s.schedules);
  const storeTrips     = useTripsStore(s => s.trips);
  const loadDrivers    = useDriversStore(s => s.loadDrivers);
  const loadSchedules  = useMaintenanceStore(s => s.loadSchedules);
  const loadTrips      = useTripsStore(s => s.loadTrips);

  const [ready, setReady] = useState(false);

  useEffect(() => {
    const tid = isSuperAdmin ? undefined : tenantId;
    Promise.all([
      loadDrivers(tid ?? null),
      loadSchedules(tid ?? null),
      loadTrips(tid ?? null),
    ]).finally(() => setReady(true));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId, isSuperAdmin]);

  const ownerIds = useMemo(() => new Set(user?.vehicleIds ?? []), [user]);

  const reportVehicles = useMemo(() =>
    isOwner ? storeVehicles.filter(v => ownerIds.has(v.id)) : storeVehicles,
  [isOwner, ownerIds, storeVehicles]);

  const ownedPlates = useMemo(() => new Set(reportVehicles.map(v => v.plate)), [reportVehicles]);

  const reportDrivers = useMemo(() =>
    isOwner
      ? storeDrivers.filter(d =>
          (d.assignedVehicleId != null && ownerIds.has(d.assignedVehicleId)) ||
          (d as unknown as Record<string, unknown>).ownerId === user?.email,
        )
      : storeDrivers,
  [isOwner, ownerIds, storeDrivers, user]);

  const reportSchedules = useMemo(() =>
    isOwner ? storeSchedules.filter(s => ownedPlates.has(s.vehiclePlate)) : storeSchedules,
  [isOwner, ownedPlates, storeSchedules]);

  const reportTrips = useMemo(() =>
    isOwner ? storeTrips.filter(t => ownerIds.has(t.vehicleId)) : storeTrips,
  [isOwner, ownerIds, storeTrips]);

  const reportIsSuperAdmin = isSuperAdmin || isOwner;

  const now   = new Date().toLocaleString('en-GB', { day:'numeric', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' });
  const theme = REPORT_THEME[id] ?? DEFAULT_THEME;

  if (!meta) {
    return (
      <div style={{ padding:40, textAlign:'center' }}>
        <i className="ti ti-question-mark" style={{ fontSize:40, color:'var(--ink3)', display:'block', marginBottom:12 }} />
        <div style={{ fontSize:16, fontWeight:700, color:'var(--ink)' }}>Report not found</div>
        <Link href="/reports" style={{ color:'#c4912a', fontSize:13, marginTop:8, display:'inline-block' }}>← Back to reports</Link>
      </div>
    );
  }

  return (
    <div style={{ padding:'14px 18px', maxWidth:1300, margin:'0 auto' }}>

      {/* Page header */}
      <div style={{
        background: theme.gradient,
        borderRadius: 10, padding: '14px 18px', marginBottom: 14,
        boxShadow: `0 4px 24px ${theme.glow}, inset 0 1px 0 rgba(255,255,255,0.06)`,
        border: `1px solid ${theme.accent}30`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <Link href="/reports" style={{ width:34, height:34, borderRadius:8, background:'rgba(255,255,255,0.12)', border:`1px solid ${theme.accent}40`, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', textDecoration:'none', flexShrink:0 }}>
            <i className="ti ti-arrow-left" style={{ fontSize:15 }} />
          </Link>
          <div style={{ width:40, height:40, borderRadius:9, background:theme.accentBg, border:`1px solid ${theme.accent}40`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <i className={`ti ${meta.icon}`} style={{ fontSize:20, color:theme.headerText }} />
          </div>
          <div>
            <div style={{ fontSize:9, fontWeight:700, letterSpacing:'1px', textTransform:'uppercase', color:`${theme.headerText}99`, marginBottom:2 }}>
              {isSuperAdmin ? 'All tenants' : isOwner ? `My vehicles (${reportVehicles.length})` : (user?.tenantName ?? 'Fleet report')} · {now}
            </div>
            <div style={{ fontSize:18, fontWeight:700, color:'#fff', lineHeight:1 }}>{meta.name}</div>
            <div style={{ fontSize:11, color:'rgba(255,255,255,0.6)', marginTop:2 }}>{meta.subtitle}</div>
          </div>
        </div>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          {/* Category badge */}
          <div style={{ padding:'4px 12px', borderRadius:20, background:theme.accentBg, border:`1px solid ${theme.accent}50`, fontSize:10, fontWeight:700, color:theme.headerText, letterSpacing:'0.5px', textTransform:'uppercase' }}>
            {id==='2'?'HR':id==='4'?'Security':id==='3'||id==='6'?'Finance':'Operations'}
          </div>
          <div style={{ width:1, height:28, background:'rgba(255,255,255,0.15)' }} />
          {meta.formats.map(f => (
            <button key={f} style={{ display:'flex', alignItems:'center', gap:5, padding:'7px 14px', fontSize:12, fontWeight:600, borderRadius:7, border:`1px solid ${theme.accent}50`, background:theme.accentBg, color:theme.headerText, cursor:'pointer', fontFamily:'inherit' }}>
              <i className={`ti ${f==='PDF'?'ti-file-type-pdf':'ti-file-spreadsheet'}`} style={{ fontSize:13 }} /> {f}
            </button>
          ))}
          <button onClick={() => window.print()} style={{ display:'flex', alignItems:'center', gap:5, padding:'7px 14px', fontSize:12, fontWeight:600, borderRadius:7, border:'1px solid rgba(255,255,255,0.20)', background:'rgba(255,255,255,0.08)', color:'rgba(255,255,255,0.75)', cursor:'pointer', fontFamily:'inherit' }}>
            <i className="ti ti-printer" style={{ fontSize:13 }} /> Print
          </button>
        </div>
      </div>

      {/* Loading */}
      {!ready && (
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', padding:'60px 0', gap:12, color:'var(--ink3)' }}>
          <div style={{ width:20, height:20, border:'2px solid #c4912a', borderTopColor:'transparent', borderRadius:'50%', animation:'spin 0.7s linear infinite' }} />
          <span style={{ fontSize:14 }}>Loading report data…</span>
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      )}

      {/* Report body */}
      {ready && (
        <>
          {id==='1' && <FleetSummary       vehicles={reportVehicles}  isSuperAdmin={reportIsSuperAdmin} tenantId={tenantId} accent={theme.accent} />}
          {id==='2' && <DriverPerformance  drivers={reportDrivers}    isSuperAdmin={reportIsSuperAdmin} tenantId={tenantId} accent={theme.accent} />}
          {id==='3' && <FuelConsumption    vehicles={reportVehicles}  isSuperAdmin={reportIsSuperAdmin} tenantId={tenantId} accent={theme.accent} />}
          {id==='4' && <GeofenceViolations vehicles={reportVehicles}  isSuperAdmin={reportIsSuperAdmin} tenantId={tenantId} accent={theme.accent} />}
          {id==='5' && <MaintenanceScheduleReport schedules={reportSchedules} isSuperAdmin={reportIsSuperAdmin} tenantId={tenantId} accent={theme.accent} />}
          {id==='6' && <CostAnalysis       vehicles={reportVehicles}  isSuperAdmin={reportIsSuperAdmin} tenantId={tenantId} accent={theme.accent} />}
          {id==='7' && <TripSummary trips={reportTrips} vehicles={reportVehicles} drivers={reportDrivers} isSuperAdmin={reportIsSuperAdmin} tenantId={tenantId} accent={theme.accent} />}
          {id==='8' && <TrackingHistory    trips={reportTrips} vehicles={reportVehicles} isSuperAdmin={reportIsSuperAdmin} tenantId={tenantId} accent={theme.accent} />}
          {id==='9' && <VehicleTrackReport trips={reportTrips} vehicles={reportVehicles} isSuperAdmin={reportIsSuperAdmin} tenantId={tenantId} accent={theme.accent} />}
        </>
      )}
    </div>
  );
}
