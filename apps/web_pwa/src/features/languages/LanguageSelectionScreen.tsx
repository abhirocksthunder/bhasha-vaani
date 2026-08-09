import { GlossyPanel } from '../../ui/GlossyPanel';
import { ScreenHeader } from '../../ui/ScreenHeader';
import { StatusBadge, type BadgeEmphasis } from '../../ui/StatusBadge';
import { EmptyStatePanel, ErrorStatePanel, LoadingPanel } from '../../ui/StatePanels';
import {
  CheckCircleIcon,
  CheckIcon,
  CircleIcon,
  ExtensionIcon,
  LanguageIcon,
  LibraryIcon,
  MicIcon,
  TranslateIcon,
  UpdateIcon,
  VoiceIcon,
  VolumeIcon,
  WifiOffIcon,
} from '../../ui/icons';
import type { AppLoadState } from '../../app/appLoadState';
import { statusLabel, type LanguagePack, type LanguageSupportStatus } from './types';

// Mirrors apps/mobile_flutter/lib/features/language_selection/presentation/language_selection_screen.dart.
interface LanguageSelectionScreenProps {
  languages: LanguagePack[];
  selectedLanguage: LanguagePack | null;
  loadState: AppLoadState;
  onRetry: () => void;
  onLanguageSelected: (language: LanguagePack) => void;
}

function statusEmphasis(status: LanguageSupportStatus): BadgeEmphasis {
  switch (status) {
    case 'full':
      return 'success';
    case 'beta':
      return 'primary';
    case 'preview':
      return 'warning';
    default:
      return 'neutral';
  }
}

export function LanguageSelectionScreen({
  languages,
  selectedLanguage,
  loadState,
  onRetry,
  onLanguageSelected,
}: LanguageSelectionScreenProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <ScreenHeader
        eyebrow="Language packs"
        title="Choose the learning path"
        subtitle="Capabilities are shown honestly so lessons can adapt to text, audio, pronunciation, and beta support."
        trailing={
          <StatusBadge
            icon={loadState.status === 'fallback' ? <WifiOffIcon /> : <ExtensionIcon />}
            label={loadState.status === 'fallback' ? 'Seed packs' : 'Pack based'}
            emphasis={loadState.status === 'fallback' ? 'warning' : 'primary'}
          />
        }
      />

      <GlossyPanel>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          <StatusBadge icon={<CheckIcon />} label="Manifest registry" emphasis="success" />
          <StatusBadge icon={<LibraryIcon />} label={`${languages.length} packs`} emphasis="primary" />
          <StatusBadge icon={<UpdateIcon />} label="Updated now" emphasis="neutral" />
        </div>
      </GlossyPanel>

      {loadState.status === 'loading' && (
        <LoadingPanel title="Loading language packs" message="Reading capability data from the local backend." />
      )}
      {loadState.status === 'fallback' && (
        <ErrorStatePanel
          title="Using local seed packs"
          message="The backend did not respond, so Kannada and Hindi seed packs remain available."
          onRetry={onRetry}
        />
      )}

      {languages.length === 0 ? (
        <EmptyStatePanel icon={<LanguageIcon />} title="No language packs" message="Add a language pack manifest before starting lessons." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {languages.map((language) => {
            const selected = language.code === selectedLanguage?.code;
            return (
              <GlossyPanel key={language.code} selected={selected} onClick={() => onLanguageSelected(language)}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      flexShrink: 0,
                      borderRadius: 8,
                      background: '#e0f2fe',
                      color: '#0369a1',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                    }}
                  >
                    {language.code.toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 800, fontSize: 18 }}>{language.name}</div>
                    <div style={{ marginTop: 4, fontSize: 14, color: 'var(--bv-text-muted)' }}>{language.nativeName}</div>
                  </div>
                  <StatusBadge label={statusLabel(language.status)} emphasis={statusEmphasis(language.status)} />
                  {selected ? <CheckCircleIcon color="var(--bv-seed-dark)" /> : <CircleIcon color="#94a3b8" />}
                </div>

                <div style={{ marginTop: 14, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  <StatusBadge icon={<TranslateIcon />} label="Transliteration" emphasis={language.transliteration ? 'primary' : 'neutral'} />
                  <StatusBadge icon={<MicIcon />} label="STT" emphasis={language.speechToText ? 'primary' : 'neutral'} />
                  <StatusBadge icon={<VolumeIcon />} label="TTS" emphasis={language.textToSpeech ? 'primary' : 'neutral'} />
                  <StatusBadge
                    icon={<VoiceIcon />}
                    label={language.pronunciation}
                    emphasis={language.pronunciation !== 'Later' ? 'primary' : 'neutral'}
                  />
                </div>
              </GlossyPanel>
            );
          })}
        </div>
      )}
    </div>
  );
}
