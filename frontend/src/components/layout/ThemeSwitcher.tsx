'use client';

import { useConfigStore } from '@/store/configStore';

type Theme = 'gold' | 'slate' | 'forest';

const THEMES: { id: Theme; label: string; swatch: string; bg: string; ink: string; border: string; desc: string }[] = [
  {
    id:     'gold',
    label:  'Warm Gold',
    desc:   'Classic warm cream & navy',
    swatch: '#c4912a',
    bg:     '#faf8f5',
    ink:    '#0d1b2a',
    border: '#ddd8d0',
  },
  {
    id:     'slate',
    label:  'Cool Slate',
    desc:   'Royal blue accent & cool surfaces',
    swatch: '#2563eb',
    bg:     '#f0f6ff',
    ink:    '#0b1929',
    border: '#b8cfe8',
  },
  {
    id:     'forest',
    label:  'Forest Green',
    desc:   'Forest green accent & sage surfaces',
    swatch: '#16a34a',
    bg:     '#edf7f1',
    ink:    '#0d2018',
    border: '#aed4bc',
  },
];

interface Props {
  /** Render inline (sidebar bottom) vs inside a panel */
  collapsed?: boolean;
}

export function ThemeSwitcher({ collapsed }: Props) {
  const colorTheme   = useConfigStore(s => s.colorTheme);
  const setColorTheme = useConfigStore(s => s.setColorTheme);

  if (collapsed) {
    // Compact: just a small palette icon that cycles themes
    const next: Record<Theme, Theme> = { gold: 'slate', slate: 'forest', forest: 'gold' };
    const cur = THEMES.find(t => t.id === colorTheme)!;
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 0' }}>
        <button
          onClick={() => setColorTheme(next[colorTheme])}
          title={`Theme: ${cur.label} — click to cycle`}
          style={{
            width: 28, height: 28, borderRadius: 8,
            background: 'rgba(255,255,255,0.07)',
            border: '1px solid rgba(255,255,255,0.12)',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <span style={{ fontSize: 12 }}>🎨</span>
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '8px 12px 10px' }}>
      <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.28)', marginBottom: 7 }}>
        Color Theme
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        {THEMES.map(t => {
          const active = colorTheme === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setColorTheme(t.id)}
              title={`${t.label} — ${t.desc}`}
              style={{
                flex: 1, padding: '6px 4px', borderRadius: 8, cursor: 'pointer',
                border: active
                  ? `2px solid ${t.swatch}`
                  : '2px solid rgba(255,255,255,0.10)',
                background: active ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.04)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                transition: 'all 0.15s',
                outline: 'none',
              }}
            >
              {/* Mini card preview */}
              <div style={{
                width: 36, height: 24, borderRadius: 5, overflow: 'hidden',
                border: `1px solid ${t.border}`,
                background: t.bg,
                position: 'relative',
                boxShadow: active ? `0 0 0 1px ${t.swatch}40` : 'none',
              }}>
                {/* Simulated top bar */}
                <div style={{ height: 6, background: '#0d1b2a', width: '100%' }} />
                {/* Simulated content lines */}
                <div style={{ padding: '3px 3px 0', display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <div style={{ height: 2, borderRadius: 1, background: t.ink, width: '70%', opacity: 0.6 }} />
                  <div style={{ height: 2, borderRadius: 1, background: t.ink, width: '50%', opacity: 0.3 }} />
                </div>
                {/* Accent dot */}
                <div style={{ position: 'absolute', bottom: 3, right: 3, width: 5, height: 5, borderRadius: '50%', background: t.swatch }} />
              </div>

              {/* Label */}
              <span style={{
                fontSize: 8, fontWeight: active ? 700 : 500, letterSpacing: '0.3px',
                color: active ? '#fff' : 'rgba(255,255,255,0.45)',
                textAlign: 'center', lineHeight: 1.2,
              }}>
                {t.label.split(' ')[0]}
              </span>

              {/* Active dot */}
              {active && (
                <div style={{ width: 4, height: 4, borderRadius: '50%', background: t.swatch }} />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
