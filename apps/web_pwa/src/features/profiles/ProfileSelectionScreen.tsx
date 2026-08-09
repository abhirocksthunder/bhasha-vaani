import { useState } from 'react';
import { GlossyPanel } from '../../ui/GlossyPanel';
import { ScreenHeader } from '../../ui/ScreenHeader';
import { StatusBadge } from '../../ui/StatusBadge';
import { EmptyStatePanel, ErrorStatePanel, LoadingPanel } from '../../ui/StatePanels';
import { CheckCircleIcon, ChildIcon, CircleIcon, EditIcon, FamilyIcon, LockIcon, PersonIcon, TranslateIcon, WifiOffIcon } from '../../ui/icons';
import type { AppLoadState } from '../../app/appLoadState';
import { EditProfileModal } from './EditProfileModal';
import { isChild, typeLabel, type LearnerProfile } from './types';

// Mirrors apps/mobile_flutter/lib/features/profiles/presentation/profile_selection_screen.dart.
interface ProfileSelectionScreenProps {
  profiles: LearnerProfile[];
  selectedProfile: LearnerProfile | null;
  loadState: AppLoadState;
  onRetry: () => void;
  onProfileSelected: (profile: LearnerProfile) => void;
  onProfileEdited: (profile: LearnerProfile) => void;
}

export function ProfileSelectionScreen({
  profiles,
  selectedProfile,
  loadState,
  onRetry,
  onProfileSelected,
  onProfileEdited,
}: ProfileSelectionScreenProps) {
  const [editingProfile, setEditingProfile] = useState<LearnerProfile | null>(null);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, height: '100%' }}>
      <ScreenHeader
        eyebrow="Family profiles"
        title="Who is learning today?"
        subtitle="Pick a learner to keep lessons, reviews, and progress separate across web, mobile, and voice clients."
        trailing={
          <StatusBadge
            icon={loadState.status === 'fallback' ? <WifiOffIcon /> : <LockIcon />}
            label={loadState.message}
            emphasis={loadState.status === 'fallback' ? 'warning' : 'success'}
          />
        }
      />

      {loadState.status === 'loading' && (
        <LoadingPanel title="Loading family profiles" message="Checking the local backend before falling back to seed data." />
      )}
      {loadState.status === 'fallback' && (
        <ErrorStatePanel
          title="Backend is not reachable"
          message="You can keep exploring with seed profiles. Retry when the local API is back on port 6001."
          onRetry={onRetry}
        />
      )}

      {profiles.length === 0 ? (
        <EmptyStatePanel icon={<FamilyIcon />} title="No profiles yet" message="Create an adult or child profile to start learning." />
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: 12,
          }}
        >
          {profiles.map((profile) => (
            <ProfileTile
              key={profile.id}
              profile={profile}
              selected={profile.id === selectedProfile?.id}
              onSelect={() => onProfileSelected(profile)}
              onEdit={() => setEditingProfile(profile)}
            />
          ))}
        </div>
      )}

      {editingProfile && (
        <EditProfileModal
          profile={editingProfile}
          onCancel={() => setEditingProfile(null)}
          onSave={(updated) => {
            setEditingProfile(null);
            onProfileEdited(updated);
          }}
        />
      )}
    </div>
  );
}

function ProfileTile({
  profile,
  selected,
  onSelect,
  onEdit,
}: {
  profile: LearnerProfile;
  selected: boolean;
  onSelect: () => void;
  onEdit: () => void;
}) {
  const child = isChild(profile);

  return (
    <GlossyPanel selected={selected}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div
          style={{
            width: 54,
            height: 54,
            flexShrink: 0,
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: child ? '#ffedd5' : 'rgba(14, 165, 164, 0.12)',
            color: child ? '#c2410c' : 'var(--bv-seed-dark)',
          }}
        >
          {child ? <ChildIcon width={24} height={24} /> : <PersonIcon width={24} height={24} />}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 16, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {profile.displayName}
          </div>
          <div style={{ marginTop: 6, fontSize: 14, color: 'var(--bv-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {typeLabel(profile)}, {profile.ageGroup}, {profile.sessionMinutes} min
          </div>
          <div style={{ marginTop: 8 }}>
            <StatusBadge icon={<TranslateIcon />} label={profile.explanationLanguage} emphasis={child ? 'warning' : 'primary'} />
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <button
            type="button"
            title={selected ? 'Selected profile' : 'Select profile'}
            onClick={onSelect}
            style={iconButtonStyle}
          >
            {selected ? (
              <CheckCircleIcon color="var(--bv-seed-dark)" />
            ) : (
              <CircleIcon color="#94a3b8" />
            )}
          </button>
          <button type="button" title="Edit profile" onClick={onEdit} style={iconButtonStyle}>
            <EditIcon />
          </button>
        </div>
      </div>
    </GlossyPanel>
  );
}

const iconButtonStyle = {
  border: 'none',
  background: 'transparent',
  padding: 6,
  borderRadius: 8,
  cursor: 'pointer',
  display: 'flex',
} as const;
