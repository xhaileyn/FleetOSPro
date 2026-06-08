'use client';
import { useAuthStore } from '@/store/authStore';
import { BrandingEditor } from '@/components/BrandingEditor';

export default function BrandingPage() {
  const { user } = useAuthStore();
  const tenantId = user?.tenantId;
  const storageKey = tenantId ? `fleetBrand_tenant_${tenantId}` : 'fleetBrand';

  return (
    <div className="page-in" style={{ padding:'14px 18px' }}>

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <div style={{ background:'linear-gradient(135deg,#0d1b2a 0%,#162033 55%,#1c2b44 100%)', border:'1px solid rgba(196,145,42,0.18)', borderRadius:14, padding:'20px 24px', marginBottom:20, boxShadow:'0 4px 24px rgba(13,27,42,0.50),inset 0 1px 0 rgba(196,145,42,0.15)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div style={{ display:'flex', alignItems:'center', gap:14 }}>
          <div style={{ width:44, height:44, borderRadius:10, background:'rgba(196,145,42,0.15)', border:'1px solid rgba(196,145,42,0.25)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <i className="ti ti-palette" style={{ fontSize:22, color:'#f5d07a' }} />
          </div>
          <div>
            <div style={{ fontSize:10, fontWeight:700, letterSpacing:1.2, textTransform:'uppercase', color:'rgba(245,208,122,0.7)', marginBottom:2 }}>Enterprise</div>
            <h1 style={{ fontSize:22, fontWeight:800, color:'#fff', margin:0 }}>Portal Branding</h1>
            <div style={{ fontSize:12, color:'rgba(255,255,255,0.45)', marginTop:2 }}>
              Customise your company portal — logo, colours, and typography
              {tenantId && <span style={{ marginLeft:10, padding:'2px 8px', background:'rgba(196,145,42,0.18)', color:'#f5d07a', borderRadius:4, fontSize:11, fontWeight:600 }}>Tenant {tenantId}</span>}
            </div>
          </div>
        </div>
      </div>

      <BrandingEditor
        storageKey={storageKey}
        defaultName={user?.tenantName ?? undefined}
        scopeNote={
          tenantId
            ? `Branding is scoped to tenant "${user?.tenantName ?? tenantId}" and stored per-tenant in localStorage.`
            : 'Branding is stored in browser localStorage and applied on every page load.'
        }
      />
    </div>
  );
}
