'use client';

interface CardProps {
  title?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  noPadding?: boolean;
}

export function Card({ title, action, children, noPadding }: CardProps) {
  return (
    <div style={{
      background: '#fff',
      border: '1px solid var(--border)',
      borderRadius: 6,
      marginBottom: 13,
    }}>
      {title && (
        <div style={{
          padding: '10px 15px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <span style={{
            fontSize: 9,
            fontWeight: 600,
            letterSpacing: '1.3px',
            textTransform: 'uppercase',
            color: 'var(--ink3)',
          }}>
            {title}
          </span>
          {action}
        </div>
      )}
      <div style={noPadding ? {} : { padding: 15 }}>
        {children}
      </div>
    </div>
  );
}
