'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { TENANTS_META } from '@/lib/vehiclesMaster';
import { useVehiclesStore } from '@/store/vehiclesStore';
import { PlaybackPanel } from '@/components/playback/PlaybackPanel';

export default function PlaybackPage() {
  const router        = useRouter();
  const { user }      = useAuthStore();
  const role          = user?.role ?? 'viewer';
  const isSuperAdmin  = role === 'super_admin' || role === 'platform_admin';
  const isVehicleOwner = role === 'vehicle_owner';
  const tenantId      = user?.tenantId ?? '1';

  const vehicles        = useVehiclesStore(s => s.vehicles);
  const vehiclesLoading = useVehiclesStore(s => s.loading);

  const scopedVehicles = useMemo(() => {
    if (isSuperAdmin) return vehicles;
    if (isVehicleOwner) {
      const ids = user?.vehicleIds?.length ? user.vehicleIds : user?.vehicleId ? [user.vehicleId] : [];
      return vehicles.filter(v => ids.includes(v.id));
    }
    return vehicles.filter(v => v.tenantId === tenantId);
  }, [isSuperAdmin, isVehicleOwner, vehicles, tenantId, user?.vehicleId, user?.vehicleIds]);

  return (
    <div style={{ padding: '14px 18px' }}>

      {/* ── Hero header ─────────────────────────────────────────────── */}
      <div style={{
        background: 'linear-gradient(135deg, var(--hero-s) 0%, var(--hero-m) 55%, var(--hero-e) 100%)',
        borderRadius: 10, padding: '12px 16px', marginBottom: 14,
        boxShadow: '0 4px 24px rgba(13,27,42,0.50), inset 0 1px 0 rgba(196,145,42,0.15)',
        border: '1px solid rgba(196,145,42,0.18)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 38, height: 38, borderRadius: 9, background: 'rgba(196,145,42,0.15)', border: '1px solid rgba(196,145,42,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <i className="ti ti-route" style={{ fontSize: 19, color: '#f5d07a' }} />
          </div>
          <div>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: 'rgba(245,208,122,0.7)', marginBottom: 2 }}>Real-time Ops</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#fff', lineHeight: 1 }}>Route Playback</div>
          </div>
        </div>
        <span style={{ fontSize: 10, fontWeight: 700, padding: '4px 12px', borderRadius: 20, background: 'rgba(196,145,42,0.15)', color: '#f5d07a', border: '1px solid rgba(196,145,42,0.28)' }}>
          {isSuperAdmin ? '👁 ALL TENANTS' : isVehicleOwner ? '🚗 My vehicle' : `🔒 ${user?.tenantName ?? 'Tenant'}`}
        </span>
      </div>

      {/* ── Loading skeleton ─────────────────────────────────────────── */}
      {vehiclesLoading && scopedVehicles.length === 0 ? (
        <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 10, padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 200, height: 32, borderRadius: 6, background: 'var(--cream3)', animation: 'pulse 1.4s ease-in-out infinite' }} />
          <div style={{ width: 120, height: 32, borderRadius: 6, background: 'var(--cream3)', animation: 'pulse 1.4s ease-in-out infinite', animationDelay: '0.2s' }} />
          <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.45}}`}</style>
        </div>
      ) : (
        <PlaybackPanel vehicles={scopedVehicles} />
      )}
    </div>
  );
}
