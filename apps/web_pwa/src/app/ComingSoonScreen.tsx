import { GlossyPanel } from '../ui/GlossyPanel';
import { ScreenHeader } from '../ui/ScreenHeader';

// Placeholder for tabs not yet ported in this phase of the Vite/React
// rewrite (Lesson, Progress, Roadmap land in later phases per the migration
// plan). apps/mobile_flutter keeps serving the full app on its own port in
// the meantime.
export function ComingSoonScreen({ title, eyebrow }: { title: string; eyebrow: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <ScreenHeader
        eyebrow={eyebrow}
        title={title}
        subtitle="Not ported yet in this phase of the Vite/React rewrite. Use the Flutter app for this tab in the meantime."
      />
      <GlossyPanel>
        <div style={{ fontSize: 14, color: 'var(--bv-text-muted)' }}>
          This screen lands in a later migration phase.
        </div>
      </GlossyPanel>
    </div>
  );
}
