import { GlossyPanel } from '../../ui/GlossyPanel';
import { StatusBadge } from '../../ui/StatusBadge';
import {
  ArrowBackIcon,
  ArrowForwardIcon,
  AutoAwesomeIcon,
  CloudUploadIcon,
  RefreshIcon,
  RouteIcon,
  SyncIcon,
  TaskAltIcon,
} from '../../ui/icons';
import type { OllamaModel } from './types';
import { ollamaModelLabel } from './types';

// Mirrors the _SessionPanel widget in
// apps/mobile_flutter/lib/features/learning_session/presentation/learning_session_screen.dart.
interface SessionPanelProps {
  progress: number;
  activityIndex: number;
  activityCount: number;
  completedCount: number;
  queuedCount: number;
  generatingLessonPlan: boolean;
  onPrevious: (() => void) | null;
  onNext: (() => void) | null;
  /** True when the learner has completed the last activity in the current
   * plan -- Next has nothing left to advance to. Instead of just showing a
   * dead disabled button, the panel offers a direct way to keep learning. */
  atEndOfPlan: boolean;
  onLearnMore: () => void;
  onGenerateLessonPlan: () => void;
  ollamaModels: OllamaModel[];
  selectedOllamaModel: string | null;
  loadingModels: boolean;
  onOllamaModelChanged: (model: string | null) => void;
  onRefreshModels: () => void;
  /** Stage 1.3 "teach me X" launcher: free-form request text, e.g. "5 new
   * words today" or "review what we did", sent alongside Generate plan. */
  teachMeText: string;
  onTeachMeTextChanged: (value: string) => void;
}

export function SessionPanel({
  progress,
  activityIndex,
  activityCount,
  completedCount,
  queuedCount,
  generatingLessonPlan,
  onPrevious,
  onNext,
  atEndOfPlan,
  onLearnMore,
  onGenerateLessonPlan,
  ollamaModels,
  selectedOllamaModel,
  loadingModels,
  onOllamaModelChanged,
  onRefreshModels,
  teachMeText,
  onTeachMeTextChanged,
}: SessionPanelProps) {
  return (
    <GlossyPanel>
      <div style={{ fontWeight: 800, fontSize: 21 }}>Session flow</div>

      <div style={{ marginTop: 10, height: 10, borderRadius: 8, background: 'var(--bv-neutral-bg)', overflow: 'hidden' }}>
        <div
          style={{
            height: '100%',
            width: `${Math.min(100, Math.max(0, progress * 100))}%`,
            background: 'var(--bv-seed)',
            transition: 'width 0.2s ease',
          }}
        />
      </div>

      <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        <StatusBadge icon={<RouteIcon />} label={`${activityIndex + 1} of ${activityCount}`} emphasis="primary" />
        <StatusBadge icon={<TaskAltIcon />} label={`${completedCount} done`} emphasis="success" />
        <StatusBadge icon={<SyncIcon />} label="Offline sync ready" emphasis="neutral" />
        {queuedCount > 0 && <StatusBadge icon={<CloudUploadIcon />} label={`${queuedCount} queued`} emphasis="warning" />}
      </div>

      <label style={{ display: 'block', marginTop: 18 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--bv-text-muted)', marginBottom: 6 }}>
          Ollama model for lesson generation
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <select
            value={selectedOllamaModel ?? ''}
            disabled={generatingLessonPlan}
            onChange={(event) => onOllamaModelChanged(event.target.value || null)}
            style={selectStyle}
          >
            <option value="">Auto (provider gateway default)</option>
            {ollamaModels.map((model) => (
              <option key={model.name} value={model.name}>
                {ollamaModelLabel(model)}
              </option>
            ))}
          </select>
          <button
            type="button"
            title="Refresh installed models"
            onClick={onRefreshModels}
            disabled={loadingModels}
            style={{ ...tonalButtonStyle, opacity: loadingModels ? 0.5 : 1 }}
          >
            <RefreshIcon />
          </button>
        </div>
        {ollamaModels.length === 0 && !loadingModels && (
          <div style={{ marginTop: 4, fontSize: 12, color: 'var(--bv-text-faint)' }}>
            No installed models found -- check Ollama is running.
          </div>
        )}
      </label>

      <label style={{ display: 'block', marginTop: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--bv-text-muted)', marginBottom: 6 }}>
          Teach me... (optional)
        </div>
        <input
          type="text"
          value={teachMeText}
          disabled={generatingLessonPlan}
          onChange={(event) => onTeachMeTextChanged(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !generatingLessonPlan) {
              event.preventDefault();
              onGenerateLessonPlan();
            }
          }}
          placeholder='e.g. "5 new words today" or "review what we did"'
          style={selectStyle}
        />
        <div style={{ marginTop: 4, fontSize: 12, color: 'var(--bv-text-faint)' }}>
          Leave blank for the default 8-activity plan.
        </div>
      </label>

      <button
        type="button"
        className="bv-outlined-button"
        style={{ width: '100%', marginTop: 10, justifyContent: 'center' }}
        disabled={generatingLessonPlan}
        onClick={onGenerateLessonPlan}
      >
        <AutoAwesomeIcon />
        {generatingLessonPlan ? 'Generating' : 'Generate plan'}
      </button>

      <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
        <button
          type="button"
          className="bv-outlined-button"
          style={{ flex: 1, justifyContent: 'center' }}
          disabled={!onPrevious}
          onClick={onPrevious ?? undefined}
        >
          <ArrowBackIcon />
          Back
        </button>
        {atEndOfPlan ? (
          <button
            type="button"
            className="bv-filled-button"
            style={{ flex: 1, justifyContent: 'center' }}
            disabled={generatingLessonPlan}
            onClick={onLearnMore}
            title="Generate a new plan with more phrases"
          >
            <AutoAwesomeIcon />
            {generatingLessonPlan ? 'Generating' : 'Learn more words'}
          </button>
        ) : (
          <button
            type="button"
            className="bv-filled-button"
            style={{ flex: 1, justifyContent: 'center' }}
            disabled={!onNext}
            onClick={onNext ?? undefined}
          >
            <ArrowForwardIcon />
            Next
          </button>
        )}
      </div>
    </GlossyPanel>
  );
}

const selectStyle = {
  flex: 1,
  padding: '10px 12px',
  borderRadius: 8,
  border: '1px solid var(--bv-border)',
  fontSize: 14,
  background: 'white',
} as const;

const tonalButtonStyle = {
  border: 'none',
  borderRadius: 8,
  background: 'rgba(14, 165, 164, 0.12)',
  color: 'var(--bv-seed-dark)',
  padding: '0 12px',
  display: 'flex',
  alignItems: 'center',
  cursor: 'pointer',
} as const;
