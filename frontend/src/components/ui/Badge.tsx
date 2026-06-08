'use client';

type Variant = 'green' | 'amber' | 'red' | 'blue' | 'teal' | 'ink' | 'muted' | 'purple';

interface BadgeProps {
  variant: Variant;
  children: React.ReactNode;
}

export function Badge({ variant, children }: BadgeProps) {
  return <span className={`badge badge-${variant}`}>{children}</span>;
}

export function VehicleStatusBadge({ status }: { status: string }) {
  const map: Record<string, Variant> = {
    active: 'green',
    idle: 'amber',
    offline: 'muted',
    maintenance: 'blue',
  };
  return <Badge variant={map[status] ?? 'muted'}>{status}</Badge>;
}

export function DriverStatusBadge({ status }: { status: string }) {
  const map: Record<string, Variant> = {
    driving: 'green',
    on_duty: 'teal',
    off_duty: 'muted',
    resting: 'amber',
  };
  const labels: Record<string, string> = {
    driving: 'Driving',
    on_duty: 'On duty',
    off_duty: 'Off duty',
    resting: 'Resting',
  };
  return <Badge variant={map[status] ?? 'muted'}>{labels[status] ?? status}</Badge>;
}

export function AlertSeverityBadge({ severity }: { severity: string }) {
  const map: Record<string, Variant> = {
    critical: 'red',
    warning: 'amber',
    info: 'blue',
  };
  return <Badge variant={map[severity] ?? 'muted'}>{severity}</Badge>;
}
