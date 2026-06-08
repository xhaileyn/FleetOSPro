'use client';

interface KpiCardProps {
  label: string;
  value: string | number;
  note?: string;
  noteType?: 'pos' | 'neg' | 'warn' | 'neutral';
  stripeColor?: string;
}

export function KpiCard({ label, value, note, noteType = 'neutral', stripeColor }: KpiCardProps) {
  const noteColors = {
    pos:     'color:var(--green)',
    neg:     'color:var(--red)',
    warn:    'color:var(--amber)',
    neutral: 'color:var(--ink3)',
  };

  return (
    <div style={{
      background: '#fff',
      border: '1px solid var(--border)',
      borderRadius: 6,
      padding: '13px 15px',
    }}>
      <div style={{
        fontSize: 9,
        fontWeight: 600,
        letterSpacing: '1.3px',
        textTransform: 'uppercase',
        color: 'var(--ink3)',
        marginBottom: 5,
      }}>
        {label}
      </div>
      <div style={{
        fontSize: 23,
        fontWeight: 400,
        letterSpacing: '-1px',
        lineHeight: 1,
        color: 'var(--ink)',
      }}>
        {value}
      </div>
      {note && (
        <div style={{ fontSize: 10, marginTop: 4, ...Object.fromEntries([[noteColors[noteType].split(':')[0], noteColors[noteType].split(':')[1]]]) }}>
          {note}
        </div>
      )}
      {stripeColor && (
        <div style={{
          height: 2,
          marginTop: 9,
          borderRadius: 1,
          background: stripeColor,
        }} />
      )}
    </div>
  );
}
