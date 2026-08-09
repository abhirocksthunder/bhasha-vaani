import type { CSSProperties, PropsWithChildren } from 'react';

// Mirrors apps/mobile_flutter/lib/app/ui/glossy_panel.dart: a frosted-glass
// card with a soft shadow, optionally clickable/selected.
interface GlossyPanelProps extends PropsWithChildren {
  selected?: boolean;
  onClick?: () => void;
  padding?: string;
  style?: CSSProperties;
  className?: string;
}

export function GlossyPanel({
  children,
  selected = false,
  onClick,
  padding = '16px',
  style,
  className,
}: GlossyPanelProps) {
  const borderColor = selected ? 'rgba(14, 165, 164, 0.46)' : 'rgba(255, 255, 255, 0.70)';

  const panelStyle: CSSProperties = {
    padding,
    borderRadius: 'var(--bv-radius)',
    background: 'rgba(255, 255, 255, 0.76)',
    border: `1px solid ${borderColor}`,
    boxShadow: '0 14px 24px rgba(15, 23, 42, 0.08)',
    backdropFilter: 'blur(18px)',
    WebkitBackdropFilter: 'blur(18px)',
    cursor: onClick ? 'pointer' : undefined,
    textAlign: 'left',
    ...style,
  };

  if (onClick) {
    return (
      <button type="button" onClick={onClick} style={panelStyle} className={className}>
        {children}
      </button>
    );
  }

  return (
    <div style={panelStyle} className={className}>
      {children}
    </div>
  );
}
