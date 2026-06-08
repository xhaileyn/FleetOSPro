'use client';

interface MarkProps {
  size?: number;
  accent?: string;
}

/* ── Hexagonal route-node icon mark ─────────────────────────────────── */
export function FleetOSMark({ size = 32, accent = '#c4912a' }: MarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 36 36"
      fill="none"
      aria-hidden="true"
    >
      {/* Left solar panel */}
      <rect x="1" y="15" width="9" height="6" rx="1.5" fill={accent} />
      <line x1="4.5" y1="15" x2="4.5" y2="21" stroke="rgba(13,27,42,0.35)" strokeWidth="0.8" />
      <line x1="7" y1="15" x2="7" y2="21" stroke="rgba(13,27,42,0.35)" strokeWidth="0.8" />

      {/* Satellite body */}
      <rect x="10" y="12" width="16" height="12" rx="2.5" fill="#0d1b2a" />
      <rect x="12.5" y="16.5" width="11" height="3" rx="0.8" fill="none" stroke={`${accent}66`} strokeWidth="0.7" />
      <circle cx="15" cy="18" r="1.2" fill={accent} opacity="0.9" />
      <circle cx="18" cy="18" r="0.9" fill="white" opacity="0.55" />
      <circle cx="21" cy="18" r="1.2" fill="rgba(100,190,255,0.7)" />

      {/* Right solar panel */}
      <rect x="26" y="15" width="9" height="6" rx="1.5" fill={accent} />
      <line x1="29" y1="15" x2="29" y2="21" stroke="rgba(13,27,42,0.35)" strokeWidth="0.8" />
      <line x1="31.5" y1="15" x2="31.5" y2="21" stroke="rgba(13,27,42,0.35)" strokeWidth="0.8" />

      {/* Antenna dish */}
      <line x1="18" y1="8" x2="18" y2="12" stroke="rgba(255,255,255,0.85)" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M14.5 9 A4.5 3 0 0 1 21.5 9" stroke="rgba(255,255,255,0.85)" strokeWidth="1.2" fill="none" strokeLinecap="round" />

      {/* GPS signal beams */}
      <line x1="14" y1="24" x2="11" y2="30" stroke={accent} strokeWidth="0.9" strokeLinecap="round" strokeDasharray="1.5 2" opacity="0.7" />
      <line x1="18" y1="24" x2="18" y2="31" stroke={accent} strokeWidth="1" strokeLinecap="round" strokeDasharray="1.5 2" opacity="0.85" />
      <line x1="22" y1="24" x2="25" y2="30" stroke={accent} strokeWidth="0.9" strokeLinecap="round" strokeDasharray="1.5 2" opacity="0.7" />
    </svg>
  );
}

interface WordmarkProps {
  accent?: string;
  size?: number;
  nameOverride?: string;
}

/* ── Full horizontal lockup: icon + wordmark ─────────────────────────── */
export function FleetOSLockup({ size = 28, accent = '#c4912a', nameOverride }: WordmarkProps) {
  const fontSize = Math.round(size * 0.5);
  const badgeSize = Math.round(size * 0.26);

  if (nameOverride) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
        <FleetOSMark size={size} accent={accent} />
        <span style={{ color: '#fff', fontSize: fontSize, fontWeight: 600, letterSpacing: '-0.3px' }}>
          {nameOverride.endsWith('+')
            ? <>{nameOverride.slice(0, -1)}<span style={{ color: accent }}>+</span></>
            : nameOverride}
        </span>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
      <FleetOSMark size={size} accent={accent} />
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 0 }}>
        <span style={{ color: '#fff', fontSize: fontSize, fontWeight: 700, letterSpacing: '-0.4px', lineHeight: 1 }}>
          Fleet
        </span>
        <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: fontSize, fontWeight: 400, letterSpacing: '-0.3px', lineHeight: 1 }}>
          OS
        </span>
        <span style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          marginLeft: 5, fontSize: badgeSize, fontWeight: 800, letterSpacing: '0.8px',
          color: accent, border: `1px solid ${accent}50`,
          borderRadius: 3, padding: '1.5px 4px', lineHeight: 1,
          textTransform: 'uppercase', alignSelf: 'center',
        }}>
          Pro
        </span>
      </div>
    </div>
  );
}
