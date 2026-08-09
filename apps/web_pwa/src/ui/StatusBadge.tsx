import type { CSSProperties, ReactNode } from 'react';

// Mirrors apps/mobile_flutter/lib/app/ui/status_badge.dart.
export type BadgeEmphasis = 'primary' | 'success' | 'warning' | 'neutral';

interface StatusBadgeProps {
  label: string;
  icon?: ReactNode;
  emphasis?: BadgeEmphasis;
}

const emphasisColors: Record<BadgeEmphasis, { fg: string; bg: string; border: string }> = {
  primary: { fg: 'var(--bv-seed-dark)', bg: 'rgba(14, 165, 164, 0.10)', border: 'rgba(14, 165, 164, 0.22)' },
  success: { fg: 'var(--bv-success-fg)', bg: 'var(--bv-success-bg)', border: 'var(--bv-success-border)' },
  warning: { fg: 'var(--bv-warning-fg)', bg: 'var(--bv-warning-bg)', border: 'var(--bv-warning-border)' },
  neutral: { fg: 'var(--bv-neutral-fg)', bg: 'var(--bv-neutral-bg)', border: 'var(--bv-neutral-border)' },
};

export function StatusBadge({ label, icon, emphasis = 'primary' }: StatusBadgeProps) {
  const colors = emphasisColors[emphasis];

  const style: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '7px 10px',
    borderRadius: 8,
    background: colors.bg,
    border: `1px solid ${colors.border}`,
    color: colors.fg,
    fontWeight: 800,
    fontSize: 12,
    maxWidth: '100%',
    // Long messages (e.g. lesson-generation diagnostics in the Flutter app)
    // were getting clipped instead of wrapping there; this port wraps by
    // default from the start.
    whiteSpace: 'normal',
    wordBreak: 'break-word',
  };

  return (
    <span style={style}>
      {icon}
      <span>{label}</span>
    </span>
  );
}
