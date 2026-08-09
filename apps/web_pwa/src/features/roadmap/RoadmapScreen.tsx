import { GlossyPanel } from '../../ui/GlossyPanel';
import { ScreenHeader } from '../../ui/ScreenHeader';
import { StatusBadge } from '../../ui/StatusBadge';
import { AutorenewIcon, CheckCircleIcon, FlagCircleIcon, RadioButtonUncheckedIcon } from '../../ui/icons';
import { bhashaVaaniRoadmap, type RoadmapStage, type RoadmapStatus, type RoadmapStep } from './types';

// Mirrors apps/mobile_flutter/lib/features/roadmap/presentation/roadmap_screen.dart.
export function RoadmapScreen({ stages = bhashaVaaniRoadmap }: { stages?: RoadmapStage[] }) {
  const completedStages = stages.filter((stage) => stage.status === 'completed').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <ScreenHeader
        eyebrow="Build plan"
        title="Roadmap"
        subtitle="History-aware lessons, two-bot scenario conversations, and a personalized voice tutor — staged on top of what already works."
        trailing={<StatusBadge icon={<FlagCircleIcon />} label={`${completedStages} of ${stages.length} stages complete`} emphasis="neutral" />}
      />

      {stages.map((stage) => (
        <RoadmapStageCard key={stage.title} stage={stage} />
      ))}
    </div>
  );
}

function RoadmapStageCard({ stage }: { stage: RoadmapStage }) {
  return (
    <GlossyPanel>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
        <div style={{ flex: 1, fontWeight: 700, fontSize: 16 }}>{stage.title}</div>
        <StageStatusBadge status={stage.status} />
      </div>
      <div style={{ marginTop: 6, fontSize: 14, color: 'var(--bv-text-muted)', lineHeight: 1.35 }}>{stage.goal}</div>
      <div style={{ marginTop: 12 }}>
        {stage.steps.map((step) => (
          <RoadmapStepRow key={step.title} step={step} />
        ))}
      </div>
    </GlossyPanel>
  );
}

function RoadmapStepRow({ step }: { step: RoadmapStep }) {
  const done = step.status === 'completed';
  const inProgress = step.status === 'inProgress';
  const color = done ? '#047857' : inProgress ? '#b45309' : '#94a3b8';

  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '4px 0' }}>
      <div style={{ color, flexShrink: 0, marginTop: 2 }}>
        {done ? <CheckCircleIcon width={18} height={18} /> : inProgress ? <AutorenewIcon width={18} height={18} /> : <RadioButtonUncheckedIcon width={18} height={18} />}
      </div>
      <div
        style={{
          fontSize: 14,
          color: done ? '#334155' : '#475569',
          textDecoration: done ? 'line-through' : undefined,
          textDecorationColor: '#94a3b8',
        }}
      >
        {step.title}
      </div>
    </div>
  );
}

function StageStatusBadge({ status }: { status: RoadmapStatus }) {
  if (status === 'completed') {
    return <StatusBadge icon={<CheckCircleIcon />} label="Completed" emphasis="success" />;
  }
  if (status === 'inProgress') {
    return <StatusBadge icon={<AutorenewIcon />} label="In progress" emphasis="warning" />;
  }
  return <StatusBadge icon={<RadioButtonUncheckedIcon />} label="Planned" emphasis="neutral" />;
}
