'use client';
import { useState, useEffect, useRef } from 'react';

/* ── Types ──────────────────────────────────────────────────────────── */
export interface BrandConfig {
  companyName: string;
  tagline: string;
  primaryColor: string;
  accentColor: string;
  fontFamily: string;
  logoDataUrl: string;
  darkTopbar: boolean;
}

export const BRAND_DEFAULTS: BrandConfig = {
  companyName: 'FleetOS+',
  tagline: 'Enterprise fleet management',
  primaryColor: '#c4912a',
  accentColor: '#c4912a',
  fontFamily: 'system-ui, -apple-system, sans-serif',
  logoDataUrl: '',
  darkTopbar: true,
};

const PRIMARY_PRESETS = [
  { hex: '#c4912a', name: 'Gold (default)' },
  { hex: '#2563eb', name: 'Ocean blue' },
  { hex: '#7c3aed', name: 'Purple' },
  { hex: '#dc2626', name: 'Red' },
  { hex: '#059669', name: 'Emerald' },
  { hex: '#0891b2', name: 'Cyan' },
];

const ACCENT_PRESETS = [
  { hex: '#c4912a', name: 'Gold (default)' },
  { hex: '#f59e0b', name: 'Amber' },
  { hex: '#f97316', name: 'Orange' },
  { hex: '#ec4899', name: 'Pink' },
  { hex: '#8b5cf6', name: 'Violet' },
  { hex: '#64748b', name: 'Slate' },
];

const FONT_OPTIONS = [
  { label: 'System UI (default)', value: 'system-ui, -apple-system, sans-serif' },
  { label: 'Inter',               value: "'Inter', system-ui, sans-serif" },
  { label: 'Roboto',              value: "'Roboto', system-ui, sans-serif" },
  { label: 'Montserrat',          value: "'Montserrat', system-ui, sans-serif" },
  { label: 'DM Sans',             value: "'DM Sans', system-ui, sans-serif" },
];

/* ── Colour helpers ─────────────────────────────────────────────────── */
export function darkenHex(hex: string, amount = 0.2): string {
  const n = parseInt(hex.replace('#', ''), 16);
  const r = Math.max(0, Math.round(((n >> 16) & 255) * (1 - amount)));
  const g = Math.max(0, Math.round(((n >> 8)  & 255) * (1 - amount)));
  const b = Math.max(0, Math.round(( n        & 255) * (1 - amount)));
  return `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`;
}

export function lightenHex(hex: string, amount = 0.88): string {
  const n = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, Math.round(((n >> 16) & 255) + (255 - ((n >> 16) & 255)) * amount));
  const g = Math.min(255, Math.round(((n >> 8)  & 255) + (255 - ((n >> 8)  & 255)) * amount));
  const b = Math.min(255, Math.round(( n        & 255) + (255 - ( n        & 255)) * amount));
  return `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`;
}

export function applyBrandToDOM(brand: BrandConfig) {
  const root = document.documentElement;
  root.style.setProperty('--teal',    brand.primaryColor);
  root.style.setProperty('--teal-dk', darkenHex(brand.primaryColor, 0.18));
  root.style.setProperty('--teal-lt', lightenHex(brand.primaryColor, 0.88));
  root.style.setProperty('--gold',    brand.accentColor);
  document.body.style.fontFamily = brand.fontFamily;
}

/* ── Sub-components ─────────────────────────────────────────────────── */
function ColorSwatch({ hex, name, selected, onClick }: { hex:string; name:string; selected:boolean; onClick:()=>void }) {
  return (
    <button title={name} onClick={onClick} style={{
      width:28, height:28, borderRadius:6, background:hex, flexShrink:0, cursor:'pointer',
      border: selected ? `3px solid ${darkenHex(hex, 0.3)}` : '2px solid rgba(0,0,0,0.08)',
      boxShadow: selected ? `0 0 0 2px #fff, 0 0 0 4px ${hex}` : 'none',
      transition:'box-shadow 0.15s',
    }} />
  );
}

function BrandPreview({ brand }: { brand: BrandConfig }) {
  const topbarBg = brand.darkTopbar ? '#1a1714' : brand.primaryColor;
  const logoFg   = brand.darkTopbar ? '#1a1714' : '#fff';
  const miniItems = ['Live dashboard', 'Live map', 'Vehicles', 'Reports'];

  return (
    <div style={{ border:'1px solid var(--border)', borderRadius:10, overflow:'hidden', background:'#f8f7f5', boxShadow:'0 4px 24px rgba(0,0,0,0.08)', userSelect:'none', fontFamily:brand.fontFamily }}>
      <div style={{ background:'#e8e8e8', padding:'6px 10px', display:'flex', alignItems:'center', gap:5 }}>
        {['#ff5f57','#febc2e','#28c840'].map(c=><div key={c} style={{ width:9, height:9, borderRadius:'50%', background:c }} />)}
        <div style={{ flex:1, marginLeft:6, background:'#fff', borderRadius:4, height:14, fontSize:8, color:'#aaa', display:'flex', alignItems:'center', paddingLeft:6 }}>
          fleetOS.app/dashboard
        </div>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'90px 1fr', gridTemplateRows:'26px 1fr' }}>
        <div style={{ gridColumn:'1 / -1', background:topbarBg, display:'flex', alignItems:'center', padding:'0 8px', gap:5 }}>
          {brand.logoDataUrl ? (
            <img src={brand.logoDataUrl} alt="logo" style={{ height:14, width:14, objectFit:'contain', borderRadius:3 }} />
          ) : (
            <div style={{ width:13, height:13, background:brand.accentColor, borderRadius:2, display:'flex', alignItems:'center', justifyContent:'center' }}>
              <div style={{ width:6, height:6, background:logoFg, borderRadius:1 }} />
            </div>
          )}
          <span style={{ color:'#fff', fontSize:7, fontWeight:600, flex:1 }}>{brand.companyName}</span>
          <div style={{ width:5, height:5, borderRadius:'50%', background:brand.primaryColor }} />
          <div style={{ width:14, height:8, background:'rgba(255,255,255,0.12)', borderRadius:3 }} />
        </div>
        <div style={{ background:'#fff', borderRight:'1px solid #e5e7eb', padding:'6px 0' }}>
          {miniItems.map((item,i)=>(
            <div key={item} style={{ padding:'3px 6px', fontSize:6, color:i===0?brand.primaryColor:'#6b7280', background:i===0?lightenHex(brand.primaryColor,0.88):'transparent', borderLeft:`2px solid ${i===0?brand.primaryColor:'transparent'}`, fontWeight:i===0?600:400 }}>{item}</div>
          ))}
          <div style={{ margin:'4px 6px', height:1, background:'#f0f0f0' }} />
          <div style={{ padding:'2px 6px', fontSize:5, color:'#aaa', textTransform:'uppercase', letterSpacing:1 }}>Settings</div>
          {['System config','Branding'].map(item=><div key={item} style={{ padding:'3px 6px', fontSize:6, color:'#6b7280' }}>{item}</div>)}
        </div>
        <div style={{ background:'#f8f7f5', padding:6 }}>
          <div style={{ fontSize:7, fontWeight:600, color:'#1a1714', marginBottom:4 }}>Live operations dashboard</div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:3, marginBottom:5 }}>
            {[
              { label:'Active', value:'18', stripe:brand.primaryColor },
              { label:'Drivers',value:'24', stripe:'#22c55e' },
              { label:'Fuel',   value:'$420',stripe:brand.accentColor },
              { label:'Alerts', value:'3',  stripe:'#ef4444' },
            ].map(k=>(
              <div key={k.label} style={{ background:'#fff', border:'1px solid #e5e7eb', borderRadius:3, padding:'4px 4px 2px' }}>
                <div style={{ fontSize:4, color:'#9ca3af', textTransform:'uppercase', letterSpacing:0.5 }}>{k.label}</div>
                <div style={{ fontSize:9, fontWeight:600, color:'#1a1714' }}>{k.value}</div>
                <div style={{ height:1.5, background:k.stripe, borderRadius:1, marginTop:2 }} />
              </div>
            ))}
          </div>
          <div style={{ background:'#e9f0e9', borderRadius:3, height:40, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <div style={{ fontSize:6, color:'#9ca3af' }}>Fleet map · New York</div>
          </div>
        </div>
      </div>
      <div style={{ background:'#f0f0f0', padding:'4px 10px', textAlign:'center', fontSize:9, color:'#9ca3af' }}>
        Live preview — changes apply instantly
      </div>
    </div>
  );
}

/* ── Main editor component ──────────────────────────────────────────── */
export interface BrandingEditorProps {
  /** localStorage key for persisting this config */
  storageKey: string;
  /** Pre-populate company name (e.g. tenant name) */
  defaultName?: string;
  /** Called after Save & apply */
  onSaved?: (brand: BrandConfig) => void;
  /** Scope description shown at the bottom of the preview panel */
  scopeNote?: string;
  /** Pre-seed brand values used when no saved config exists for this tenant */
  defaultConfig?: Partial<BrandConfig>;
}

export function BrandingEditor({ storageKey, defaultName, onSaved, scopeNote, defaultConfig }: BrandingEditorProps) {
  const defaults: BrandConfig = { ...BRAND_DEFAULTS, ...defaultConfig, companyName: defaultName ?? BRAND_DEFAULTS.companyName };
  const [brand, setBrand]         = useState<BrandConfig>(defaults);
  const [saved, setSaved]         = useState(false);
  const [resetConfirm, setResetConfirm] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        setBrand({ ...defaults, ...JSON.parse(raw) });
      } else {
        const seeded = { ...defaults };
        setBrand(seeded);
        if (defaultConfig) {
          localStorage.setItem(storageKey, JSON.stringify(seeded));
          applyBrandToDOM(seeded);
        }
      }
    } catch { /* ignore */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey, defaultName]);

  function set<K extends keyof BrandConfig>(key: K, val: BrandConfig[K]) {
    setBrand(prev => ({ ...prev, [key]: val }));
  }

  function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 512 * 1024) { alert('Logo must be under 512 KB'); return; }
    const reader = new FileReader();
    reader.onload = ev => set('logoDataUrl', ev.target?.result as string ?? '');
    reader.readAsDataURL(file);
  }

  function save() {
    localStorage.setItem(storageKey, JSON.stringify(brand));
    applyBrandToDOM(brand);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
    onSaved?.(brand);
  }

  function resetToDefaults() {
    setBrand(defaults);
    localStorage.removeItem(storageKey);
    const root = document.documentElement;
    root.style.removeProperty('--teal');
    root.style.removeProperty('--teal-dk');
    root.style.removeProperty('--teal-lt');
    root.style.removeProperty('--gold');
    document.body.style.fontFamily = '';
    setResetConfirm(false);
  }

  const inputStyle: React.CSSProperties  = { padding:'8px 10px', border:'1px solid var(--border)', borderRadius:6, fontSize:13, color:'var(--ink)', width:'100%', background:'#fff', fontFamily:'inherit', boxSizing:'border-box' };
  const selectStyle: React.CSSProperties = { ...inputStyle, cursor:'pointer' };
  const sectionStyle: React.CSSProperties= { background:'#fff', border:'1px solid var(--border)', borderRadius:10, padding:'0 20px', marginBottom:16 };
  const sectionHead: React.CSSProperties = { fontSize:13, fontWeight:600, color:'var(--ink)', padding:'16px 0 2px' };
  const fieldRow: React.CSSProperties    = { padding:'12px 0', borderBottom:'1px solid var(--border)' };
  const fieldLabel: React.CSSProperties  = { fontSize:12, fontWeight:500, color:'var(--ink)', marginBottom:4 };
  const fieldNote: React.CSSProperties   = { fontSize:11, color:'var(--ink3)', marginBottom:7 };

  return (
    <div>
      {/* Action bar */}
      <div style={{ display:'flex', justifyContent:'flex-end', gap:8, marginBottom:18 }}>
        {!resetConfirm ? (
          <button onClick={()=>setResetConfirm(true)} style={{ padding:'8px 16px', fontSize:12, border:'1px solid var(--border)', borderRadius:7, background:'#fff', cursor:'pointer', color:'var(--ink2)' }}>
            Reset to defaults
          </button>
        ) : (
          <button onClick={resetToDefaults} style={{ padding:'8px 16px', fontSize:12, border:'1px solid var(--red)', borderRadius:7, background:'var(--red-lt,#fef2f2)', cursor:'pointer', color:'var(--red)' }}>
            Confirm reset
          </button>
        )}
        <button onClick={save} style={{ padding:'8px 22px', fontSize:13, background:saved?'#22c55e':'#c4912a', color:'#fff', border:'none', borderRadius:7, cursor:'pointer', fontWeight:500, transition:'background 0.2s' }}>
          {saved ? '✓ Saved & applied' : 'Save & apply'}
        </button>
      </div>

      {/* Two-column: form + preview */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 320px', gap:20, alignItems:'start' }}>

        {/* ── Left: form ── */}
        <div>

          {/* Identity */}
          <div style={sectionStyle}>
            <div style={sectionHead}>Identity</div>
            <div style={fieldRow}>
              <div style={fieldLabel}>Company name</div>
              <div style={fieldNote}>Shown in the top navigation bar and browser title.</div>
              <input style={inputStyle} value={brand.companyName} maxLength={40} onChange={e=>set('companyName',e.target.value)} placeholder="e.g. Acme Fleet" />
            </div>
            <div style={fieldRow}>
              <div style={fieldLabel}>Tagline</div>
              <div style={fieldNote}>Short descriptor shown on the login screen.</div>
              <input style={inputStyle} value={brand.tagline} maxLength={80} onChange={e=>set('tagline',e.target.value)} placeholder="e.g. Fleet intelligence for East Africa" />
            </div>
            <div style={{ padding:'12px 0' }}>
              <div style={fieldLabel}>Company logo</div>
              <div style={fieldNote}>PNG or SVG, max 512 KB. Displayed in the top-left corner at 24 × 24 px.</div>
              <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                <div style={{ width:56, height:56, background:'#f5f4f2', border:'1px dashed var(--border2)', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, overflow:'hidden' }}>
                  {brand.logoDataUrl
                    ? <img src={brand.logoDataUrl} alt="logo preview" style={{ width:'100%', height:'100%', objectFit:'contain' }} />
                    : <span style={{ fontSize:10, color:'var(--ink3)' }}>No logo</span>}
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                  <button onClick={()=>fileRef.current?.click()} style={{ padding:'7px 14px', fontSize:12, border:'1px solid var(--border)', borderRadius:6, background:'#fff', cursor:'pointer', color:'var(--ink)' }}>Upload logo…</button>
                  {brand.logoDataUrl && <button onClick={()=>set('logoDataUrl','')} style={{ padding:'4px 10px', fontSize:11, border:'1px solid var(--border)', borderRadius:6, background:'#fff', cursor:'pointer', color:'var(--red)' }}>Remove</button>}
                </div>
              </div>
              <input ref={fileRef} type="file" accept="image/png,image/svg+xml,image/jpeg,image/webp" style={{ display:'none' }} onChange={handleLogoUpload} />
            </div>
          </div>

          {/* Colours */}
          <div style={sectionStyle}>
            <div style={sectionHead}>Colours</div>
            <div style={fieldRow}>
              <div style={fieldLabel}>Primary colour</div>
              <div style={fieldNote}>Used for active nav items, buttons, status badges, and chart accents.</div>
              <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
                {PRIMARY_PRESETS.map(p=><ColorSwatch key={p.hex} hex={p.hex} name={p.name} selected={brand.primaryColor===p.hex} onClick={()=>set('primaryColor',p.hex)} />)}
                <div style={{ display:'flex', alignItems:'center', gap:6, marginLeft:4 }}>
                  <input type="color" value={brand.primaryColor} onChange={e=>set('primaryColor',e.target.value)} style={{ width:28, height:28, padding:0, border:'1px solid var(--border)', borderRadius:6, cursor:'pointer', background:'none' }} title="Custom colour" />
                  <span style={{ fontSize:11, color:'var(--ink3)', fontFamily:'monospace' }}>{brand.primaryColor}</span>
                </div>
              </div>
            </div>
            <div style={{ padding:'12px 0' }}>
              <div style={fieldLabel}>Accent colour</div>
              <div style={fieldNote}>Used for the logo badge, highlights, and secondary call-to-actions.</div>
              <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
                {ACCENT_PRESETS.map(p=><ColorSwatch key={p.hex} hex={p.hex} name={p.name} selected={brand.accentColor===p.hex} onClick={()=>set('accentColor',p.hex)} />)}
                <div style={{ display:'flex', alignItems:'center', gap:6, marginLeft:4 }}>
                  <input type="color" value={brand.accentColor} onChange={e=>set('accentColor',e.target.value)} style={{ width:28, height:28, padding:0, border:'1px solid var(--border)', borderRadius:6, cursor:'pointer', background:'none' }} title="Custom colour" />
                  <span style={{ fontSize:11, color:'var(--ink3)', fontFamily:'monospace' }}>{brand.accentColor}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Typography */}
          <div style={sectionStyle}>
            <div style={sectionHead}>Typography</div>
            <div style={{ padding:'12px 0' }}>
              <div style={fieldLabel}>Font family</div>
              <div style={fieldNote}>Applied across the entire portal UI.</div>
              <select value={brand.fontFamily} onChange={e=>set('fontFamily',e.target.value)} style={{ ...selectStyle, maxWidth:300 }}>
                {FONT_OPTIONS.map(f=><option key={f.value} value={f.value}>{f.label}</option>)}
              </select>
              <div style={{ marginTop:10, padding:'10px 12px', background:'var(--cream,#f8f7f5)', borderRadius:6, fontFamily:brand.fontFamily }}>
                <div style={{ fontSize:16, fontWeight:600, color:'var(--ink)' }}>Fleet operations · 247 vehicles</div>
                <div style={{ fontSize:12, color:'var(--ink3)', marginTop:2 }}>The quick brown fox jumps over the lazy dog. 0123456789</div>
              </div>
            </div>
          </div>

          {/* Topbar style */}
          <div style={sectionStyle}>
            <div style={sectionHead}>Top navigation bar</div>
            <div style={{ padding:'12px 0', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <div>
                <div style={fieldLabel}>Dark background (recommended)</div>
                <div style={{ ...fieldNote, marginBottom:0 }}>
                  {brand.darkTopbar ? 'Charcoal (#1a1714) top bar — high contrast.' : 'Primary colour used as top bar background.'}
                </div>
              </div>
              <button onClick={()=>set('darkTopbar',!brand.darkTopbar)} style={{ width:44, height:24, borderRadius:12, border:'none', cursor:'pointer', background:brand.darkTopbar?'#c4912a':'#d1d5db', position:'relative', transition:'background 0.2s', flexShrink:0 }}>
                <div style={{ position:'absolute', top:3, left:brand.darkTopbar?22:3, width:18, height:18, borderRadius:'50%', background:'#fff', transition:'left 0.2s', boxShadow:'0 1px 3px rgba(0,0,0,0.2)' }} />
              </button>
            </div>
          </div>

          <div style={{ padding:'12px 16px', background:'rgba(196,145,42,0.06)', border:'1px solid rgba(196,145,42,0.25)', borderRadius:8, fontSize:12, color:'var(--ink2)' }}>
            <span style={{ fontWeight:600, color:'var(--gold,#c4912a)' }}>Tip:</span>{' '}
            Changes are previewed live on the right. Click <strong>Save &amp; apply</strong> to persist the brand and update the portal immediately.
          </div>
        </div>

        {/* ── Right: preview panel ── */}
        <div style={{ position:'sticky', top:20 }}>
          <div style={{ fontSize:11, fontWeight:600, color:'var(--ink3)', textTransform:'uppercase', letterSpacing:1, marginBottom:8 }}>Live preview</div>
          <BrandPreview brand={brand} />

          {/* Colour palette summary */}
          <div style={{ marginTop:14, background:'#fff', border:'1px solid var(--border)', borderRadius:8, padding:'12px 14px' }}>
            <div style={{ fontSize:11, fontWeight:600, color:'var(--ink)', marginBottom:10 }}>Current palette</div>
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {[
                { label:'Primary',      hex:brand.primaryColor },
                { label:'Primary dark', hex:darkenHex(brand.primaryColor,0.18) },
                { label:'Primary tint', hex:lightenHex(brand.primaryColor,0.88) },
                { label:'Accent',       hex:brand.accentColor },
              ].map(chip=>(
                <div key={chip.label} style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <div style={{ width:20, height:20, borderRadius:4, background:chip.hex, border:'1px solid rgba(0,0,0,0.08)', flexShrink:0 }} />
                  <span style={{ fontSize:11, color:'var(--ink2)', flex:1 }}>{chip.label}</span>
                  <span style={{ fontSize:10, color:'var(--ink3)', fontFamily:'monospace' }}>{chip.hex}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ marginTop:12, fontSize:10, color:'var(--ink3)', textAlign:'center' }}>
            {scopeNote ?? 'Branding is stored in browser localStorage and applied on every page load.'}
          </div>
        </div>
      </div>
    </div>
  );
}
