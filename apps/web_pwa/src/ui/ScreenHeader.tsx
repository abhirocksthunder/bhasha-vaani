import { useEffect, useRef, useState, type ReactNode } from 'react';

// Mirrors apps/mobile_flutter/lib/app/ui/screen_header.dart: eyebrow +
// title + subtitle, with a trailing widget that drops below the text on
// narrow viewports instead of sitting beside it.
interface ScreenHeaderProps {
  eyebrow: string;
  title: string;
  subtitle: string;
  trailing?: ReactNode;
}

export function ScreenHeader({ eyebrow, title, subtitle, trailing }: ScreenHeaderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [compact, setCompact] = useState(false);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;
    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width ?? 0;
      setCompact(width < 560);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const text = (
    <div>
      <div
        style={{
          fontSize: 11,
          fontWeight: 800,
          color: 'var(--bv-seed-dark)',
          textTransform: 'uppercase',
        }}
      >
        {eyebrow}
      </div>
      <h1
        style={{
          margin: '6px 0 0',
          fontSize: compact ? 23 : 30,
          lineHeight: 1.1,
          fontWeight: 800,
          color: 'var(--bv-text)',
        }}
      >
        {title}
      </h1>
      <p
        style={{
          margin: '8px 0 0',
          fontSize: 14,
          lineHeight: 1.35,
          color: 'var(--bv-text-muted)',
        }}
      >
        {subtitle}
      </p>
    </div>
  );

  return (
    <div
      ref={containerRef}
      style={{
        display: 'flex',
        flexDirection: compact || !trailing ? 'column' : 'row',
        alignItems: compact || !trailing ? 'stretch' : 'flex-start',
        gap: compact ? 12 : 16,
      }}
    >
      <div style={{ flex: 1 }}>{text}</div>
      {trailing}
    </div>
  );
}
