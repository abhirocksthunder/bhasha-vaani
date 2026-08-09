import { useEffect, useRef, useState } from 'react';
import { GlossyPanel } from '../../ui/GlossyPanel';
import { ScreenHeader } from '../../ui/ScreenHeader';
import { StatusBadge } from '../../ui/StatusBadge';
import { EmptyStatePanel, ErrorStatePanel, LoadingPanel } from '../../ui/StatePanels';
import { AutoAwesomeIcon, CloudUploadIcon, OfflineBoltIcon, SchoolIcon, WifiOffIcon } from '../../ui/icons';
import type { AppLoadState } from '../../app/appLoadState';
import { useWindowWidth } from '../../app/useWindowWidth';
import type { LearnerProfile } from '../profiles/types';
import type { LanguagePack } from '../languages/types';
import type { OllamaRepository } from './ollamaRepository';
import type { LessonActivity, OllamaModel } from './types';
import { LessonCard } from './LessonCard';
import { SessionPanel } from './SessionPanel';

// Mirrors apps/mobile_flutter/lib/features/learning_session/presentation/learning_session_screen.dart.
interface LessonSessionScreenProps {
  profile: LearnerProfile | null;
  language: LanguagePack | null;
  activities: LessonActivity[];
  ollamaRepository: OllamaRepository;
  loadState: AppLoadState;
  completionMessage: string | null;
  completionMessageIsError: boolean;
  queuedEventCount: number;
  onRetryConnection: () => void;
  onActivityCompleted: (activityId: string) => Promise<void>;
  onGenerateLessonPlan: (ollamaModel: string | null, requestText?: string) => Promise<void>;
  generatingLessonPlan: boolean;
}

function sameActivityIds(a: LessonActivity[], b: LessonActivity[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((activity, index) => activity.id === b[index]?.id);
}

export function LessonSessionScreen({
  profile,
  language,
  activities,
  ollamaRepository,
  loadState,
  completionMessage,
  completionMessageIsError,
  queuedEventCount,
  onRetryConnection,
  onActivityCompleted,
  onGenerateLessonPlan,
  generatingLessonPlan,
}: LessonSessionScreenProps) {
  const [activityIndex, setActivityIndex] = useState(0);
  const [completedActivityIds, setCompletedActivityIds] = useState<Set<string>>(new Set());
  const [ollamaModels, setOllamaModels] = useState<OllamaModel[]>([]);
  const [selectedOllamaModel, setSelectedOllamaModel] = useState<string | null>(null);
  const [loadingModels, setLoadingModels] = useState(false);
  const [teachMeText, setTeachMeText] = useState('');

  const previousActivities = useRef<LessonActivity[]>(activities);
  const width = useWindowWidth();

  // Fixes the exact bug tracked as BV-NEXT-STUCK-001 in the Flutter app:
  // completing an activity triggers a backend refetch that produces a new
  // array instance every time even when the activities are unchanged.
  // Resetting position on every *array identity* change (instead of
  // content change) made "Next" appear to do nothing but flicker. Compare
  // by id content instead, and only reset when the underlying set of
  // activities actually changed.
  useEffect(() => {
    if (!sameActivityIds(previousActivities.current, activities)) {
      setActivityIndex(0);
      setCompletedActivityIds(new Set());
    } else if (activityIndex >= activities.length && activities.length > 0) {
      setActivityIndex(activities.length - 1);
    }
    previousActivities.current = activities;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activities]);

  useEffect(() => {
    void loadOllamaModels();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadOllamaModels() {
    setLoadingModels(true);
    try {
      const models = await ollamaRepository.fetchModels();
      setOllamaModels(models);
    } catch {
      setOllamaModels([]);
      setSelectedOllamaModel(null);
    } finally {
      setLoadingModels(false);
    }
  }

  async function completeCurrent() {
    const activity = activities[activityIndex];
    if (!activity) return;
    setCompletedActivityIds((current) => new Set(current).add(activity.id));
    await onActivityCompleted(activity.id);
  }

  function previous() {
    setActivityIndex((index) => index - 1);
  }

  async function next() {
    // Mirrors _next() in the Flutter version: treat moving past a phrase
    // as having practised it (auto-complete if not already), instead of
    // requiring the separate Complete button -- see BV-NEXT-NOSAVE-001.
    const activity = activities[activityIndex];
    if (activity && !completedActivityIds.has(activity.id)) {
      await completeCurrent();
    }
    setActivityIndex((index) => index + 1);
  }

  if (activities.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <ScreenHeader eyebrow="Guided lesson" title={`${language?.name ?? 'Kannada'} starter`} subtitle="No lesson activities yet." />
        <EmptyStatePanel icon={<SchoolIcon />} title="No lesson activities" message="Add starter curriculum to the selected language pack." />
      </div>
    );
  }

  const activity = activities[activityIndex]!;
  const isCompleted = completedActivityIds.has(activity.id);
  const progress = (activityIndex + 1) / activities.length;
  const wide = width >= 900;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, height: '100%' }}>
      <ScreenHeader
        eyebrow="Guided lesson"
        title={`${language?.name ?? 'Kannada'} starter`
        }
        subtitle={`${profile?.displayName ?? 'Learner'} is practising with ${loadState.message}.`}
        trailing={
          <StatusBadge
            icon={loadState.status === 'fallback' ? <OfflineBoltIcon /> : <AutoAwesomeIcon />}
            label={loadState.status === 'fallback' ? 'Queue enabled' : 'Local AI ready'}
            emphasis={loadState.status === 'fallback' ? 'warning' : 'success'}
          />
        }
      />

      {loadState.status === 'loading' && (
        <LoadingPanel title="Preparing lesson state" message="Checking backend progress before you continue." />
      )}
      {loadState.status === 'fallback' && (
        <ErrorStatePanel
          title="Lesson can continue offline"
          message="Completed activities will be marked locally for now and synced when the backend is reachable."
          onRetry={onRetryConnection}
        />
      )}
      {completionMessage && (
        <GlossyPanel>
          <StatusBadge
            icon={completionMessageIsError ? <WifiOffIcon /> : <CloudUploadIcon />}
            label={completionMessage}
            emphasis={completionMessageIsError ? 'warning' : 'success'}
          />
        </GlossyPanel>
      )}

      <div style={{ display: 'flex', flexDirection: wide ? 'row' : 'column', gap: 14, flex: 1, minHeight: 0 }}>
        <div style={{ flex: wide ? 3 : undefined, minHeight: wide ? undefined : 430 }}>
          <LessonCard activity={activity} isCompleted={isCompleted} onComplete={completeCurrent} languageCode={language?.code ?? null} />
        </div>
        <div style={{ flex: wide ? 2 : undefined }}>
          <SessionPanel
            progress={progress}
            activityIndex={activityIndex}
            activityCount={activities.length}
            completedCount={completedActivityIds.size}
            queuedCount={queuedEventCount}
            generatingLessonPlan={generatingLessonPlan}
            onPrevious={activityIndex === 0 ? null : previous}
            onNext={activityIndex === activities.length - 1 ? null : next}
            atEndOfPlan={activityIndex === activities.length - 1 && isCompleted}
            onLearnMore={() =>
              void onGenerateLessonPlan(selectedOllamaModel, teachMeText || 'a few more new words')
            }
            onGenerateLessonPlan={() => void onGenerateLessonPlan(selectedOllamaModel, teachMeText)}
            ollamaModels={ollamaModels}
            selectedOllamaModel={selectedOllamaModel}
            loadingModels={loadingModels}
            onOllamaModelChanged={setSelectedOllamaModel}
            onRefreshModels={() => void loadOllamaModels()}
            teachMeText={teachMeText}
            onTeachMeTextChanged={setTeachMeText}
          />
        </div>
      </div>
    </div>
  );
}
