import { useState } from 'react';
import type { LearnerProfile } from './types';

// Mirrors the bottom-sheet editor in
// apps/mobile_flutter/lib/features/profiles/presentation/profile_selection_screen.dart
// (_showEditProfileSheet), as a centered modal instead of a bottom sheet.
interface EditProfileModalProps {
  profile: LearnerProfile;
  onCancel: () => void;
  onSave: (profile: LearnerProfile) => void;
}

export function EditProfileModal({ profile, onCancel, onSave }: EditProfileModalProps) {
  const [displayName, setDisplayName] = useState(profile.displayName);
  const [explanationLanguage, setExplanationLanguage] = useState(profile.explanationLanguage);
  const [sessionMinutes, setSessionMinutes] = useState(String(profile.sessionMinutes));

  function handleSave() {
    const parsedMinutes = Number.parseInt(sessionMinutes.trim(), 10);
    onSave({
      ...profile,
      displayName: displayName.trim() || profile.displayName,
      explanationLanguage: explanationLanguage.trim() || profile.explanationLanguage,
      sessionMinutes: Number.isFinite(parsedMinutes) ? parsedMinutes : profile.sessionMinutes,
    });
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.35)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 50,
      }}
      onClick={onCancel}
    >
      <div
        style={{
          background: 'white',
          borderRadius: 12,
          padding: 20,
          width: 360,
          maxWidth: '90vw',
          boxShadow: '0 20px 40px rgba(15, 23, 42, 0.25)',
        }}
        onClick={(event) => event.stopPropagation()}
      >
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>Edit profile</h2>

        <label style={fieldLabelStyle}>
          Display name
          <input
            style={inputStyle}
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
          />
        </label>

        <label style={fieldLabelStyle}>
          Explanation language
          <input
            style={inputStyle}
            value={explanationLanguage}
            onChange={(event) => setExplanationLanguage(event.target.value)}
          />
        </label>

        <label style={fieldLabelStyle}>
          Session minutes
          <input
            style={inputStyle}
            type="number"
            value={sessionMinutes}
            onChange={(event) => setSessionMinutes(event.target.value)}
          />
        </label>

        <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
          <button type="button" className="bv-outlined-button" style={{ flex: 1 }} onClick={onCancel}>
            Cancel
          </button>
          <button type="button" className="bv-filled-button" style={{ flex: 1, justifyContent: 'center' }} onClick={handleSave}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

const fieldLabelStyle = {
  display: 'block',
  marginTop: 12,
  fontSize: 13,
  fontWeight: 700,
  color: 'var(--bv-text-muted)',
} as const;

const inputStyle = {
  display: 'block',
  width: '100%',
  marginTop: 6,
  padding: '10px 12px',
  borderRadius: 8,
  border: '1px solid var(--bv-border)',
  fontSize: 14,
} as const;
