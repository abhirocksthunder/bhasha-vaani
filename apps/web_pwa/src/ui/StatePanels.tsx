import type { ReactNode } from 'react';
import { GlossyPanel } from './GlossyPanel';
import { StatusBadge } from './StatusBadge';

// Mirrors apps/mobile_flutter/lib/app/ui/state_panels.dart.

export function LoadingPanel({ title, message }: { title: string; message: string }) {
  return (
    <GlossyPanel>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <span className="bv-spinner" aria-hidden />
        <div>
          <div style={{ fontWeight: 700, fontSize: 16 }}>{title}</div>
          <div style={{ marginTop: 4, fontSize: 14, color: 'var(--bv-text-muted)' }}>{message}</div>
        </div>
      </div>
    </GlossyPanel>
  );
}

export function EmptyStatePanel({
  icon,
  title,
  message,
}: {
  icon?: ReactNode;
  title: string;
  message: string;
}) {
  return (
    <GlossyPanel>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 8 }}>
        {icon && <div style={{ fontSize: 42, color: 'var(--bv-seed)' }}>{icon}</div>}
        <div style={{ fontWeight: 800, fontSize: 21 }}>{title}</div>
        <div style={{ fontSize: 14, color: 'var(--bv-text-muted)' }}>{message}</div>
      </div>
    </GlossyPanel>
  );
}

export function ErrorStatePanel({
  title,
  message,
  onRetry,
}: {
  title: string;
  message: string;
  onRetry: () => void;
}) {
  return (
    <GlossyPanel>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'flex-start' }}>
        <StatusBadge label="Offline fallback" emphasis="warning" />
        <div style={{ fontWeight: 800, fontSize: 21 }}>{title}</div>
        <div style={{ fontSize: 14, color: 'var(--bv-text-muted)' }}>{message}</div>
        <button type="button" className="bv-filled-button" onClick={onRetry}>
          Retry
        </button>
      </div>
    </GlossyPanel>
  );
}
