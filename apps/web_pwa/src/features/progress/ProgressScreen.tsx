import type { ReactNode } from 'react';
import { GlossyPanel } from '../../ui/GlossyPanel';
import { ScreenHeader } from '../../ui/ScreenHeader';
import { StatusBadge } from '../../ui/StatusBadge';
import { EmptyStatePanel, ErrorStatePanel, LoadingPanel } from '../../ui/StatePanels';
import { CloudOffIcon, MenuBookIcon, ReviewsIcon, SchoolIcon, SyncIcon, SyncLockIcon, TaskAltIcon } from '../../ui/icons';
import type { AppLoadState } from '../../app/appLoadState';
import { learnedWordCompletedAtLocal, type LearnedWord, type ProgressSummary } from './types';

// Mirrors apps/mobile_flutter/lib/features/progress/presentation/progress_screen.dart.
interface ProgressScreenProps {
  summary: ProgressSummary;
  loadState: AppLoadState;
  queuedEventCount: number;
  onRetry: () => void;
  learnedWords: LearnedWord[];
  loadingLearnedWords: boolean;
}

export function ProgressScreen({
  summary,
  loadState,
  queuedEventCount,
  onRetry,
  learnedWords,
  loadingLearnedWords,
}: ProgressScreenProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <ScreenHeader
        eyebrow="Shared progress"
        title={`${summary.profileName} in ${summary.languageName}`}
        subtitle="Progress comes from append-only events so web, mobile, and Alexa can resume the same learner state."
        trailing={
          <StatusBadge
            icon={loadState.status === 'fallback' ? <CloudOffIcon /> : <SyncLockIcon />}
            label={loadState.status === 'fallback' ? 'Cached view' : 'Server truth'}
            emphasis={loadState.status === 'fallback' ? 'warning' : 'success'}
          />
        }
      />

      {loadState.status === 'loading' && (
        <LoadingPanel title="Refreshing progress" message="Rebuilding the current projection from the backend." />
      )}
      {loadState.status === 'fallback' && (
        <ErrorStatePanel
          title="Showing last available progress"
          message="The backend is unreachable. Your next completed activity will be queued for sync."
          onRetry={onRetry}
        />
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
        <ProgressTile icon={<SchoolIcon />} title="Current lesson" value={summary.currentLesson} color="#2563eb" />
        <ProgressTile icon={<TaskAltIcon />} title="Completed" value={String(summary.completedActivities)} color="#0f766e" />
        <ProgressTile icon={<ReviewsIcon />} title="Reviews" value={String(summary.pendingReviews)} color="#b45309" />
        <ProgressTile
          icon={<SyncIcon />}
          title="Sync"
          value={queuedEventCount > 0 ? `${queuedEventCount} queued` : summary.syncState}
          color="#7c3aed"
        />
      </div>

      <div style={{ fontWeight: 700, fontSize: 16 }}>Learned words</div>
      <LearnedWordsList words={learnedWords} loading={loadingLearnedWords} />
    </div>
  );
}

function LearnedWordsList({ words, loading }: { words: LearnedWord[]; loading: boolean }) {
  if (loading && words.length === 0) {
    return <LoadingPanel title="Loading history" message="Fetching completed words from the backend." />;
  }
  if (words.length === 0) {
    return (
      <EmptyStatePanel
        icon={<MenuBookIcon />}
        title="No words learned yet"
        message="Complete an activity in the Lesson tab and it will show up here."
      />
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {words.map((word) => (
        <LearnedWordTile key={`${word.activityId}_${word.completedAt}`} word={word} />
      ))}
    </div>
  );
}

function LearnedWordTile({ word }: { word: LearnedWord }) {
  const completedAt = learnedWordCompletedAtLocal(word);

  return (
    <GlossyPanel padding="12px 16px">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ fontWeight: 700, fontSize: 16 }}>{word.nativeScript}</div>
            {word.timesCompleted > 1 && (
              <span
                title={`Learned ${word.timesCompleted} times`}
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: 'var(--bv-seed-dark)',
                  background: 'rgba(14, 165, 164, 0.12)',
                  borderRadius: 999,
                  padding: '2px 8px',
                  flexShrink: 0,
                }}
              >
                ×{word.timesCompleted}
              </span>
            )}
          </div>
          <div
            style={{
              marginTop: 2,
              fontSize: 13,
              color: 'var(--bv-text-faint)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {word.phrase} · {word.meaning}
          </div>
        </div>
        {completedAt && <div style={{ fontSize: 11, color: '#94a3b8', flexShrink: 0 }}>{formatDate(completedAt)}</div>}
      </div>
    </GlossyPanel>
  );
}

function formatDate(date: Date): string {
  const now = new Date();
  const isToday =
    date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth() && date.getDate() === now.getDate();
  if (isToday) {
    const hour = String(date.getHours()).padStart(2, '0');
    const minute = String(date.getMinutes()).padStart(2, '0');
    return `Today ${hour}:${minute}`;
  }
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function ProgressTile({
  icon,
  title,
  value,
  color,
}: {
  icon: ReactNode;
  title: string;
  value: string;
  color: string;
}) {
  return (
    <GlossyPanel>
      <div
        style={{
          width: 42,
          height: 42,
          borderRadius: 8,
          background: `${color}1f`,
          color,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {icon}
      </div>
      <div style={{ marginTop: 16, fontSize: 12, fontWeight: 700, color: 'var(--bv-text-muted)' }}>{title}</div>
      <div
        style={{
          marginTop: 4,
          fontSize: 21,
          fontWeight: 800,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
        }}
      >
        {value}
      </div>
    </GlossyPanel>
  );
}
