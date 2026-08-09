import { useEffect, useRef, useState } from 'react';
import { GlossyPanel } from '../../ui/GlossyPanel';
import { StatusBadge } from '../../ui/StatusBadge';
import {
  CheckCircleIcon,
  GraphicEqIcon,
  MicIcon,
  PendingIcon,
  SchoolIcon,
  StopCircleIcon,
  TaskAltIcon,
  VolumeIcon,
} from '../../ui/icons';
import { languageDisplayName, localeForLanguageCode } from '../../core/voice/languageLocale';
import { VoiceService } from '../../core/voice/voiceService';
import type { LessonActivity } from './types';

// Mirrors the _LessonCard widget in
// apps/mobile_flutter/lib/features/learning_session/presentation/learning_session_screen.dart.
interface LessonCardProps {
  activity: LessonActivity;
  isCompleted: boolean;
  onComplete: () => void;
  languageCode: string | null;
}

export function LessonCard({ activity, isCompleted, onComplete, languageCode }: LessonCardProps) {
  const voiceServiceRef = useRef<VoiceService | null>(null);
  if (!voiceServiceRef.current) {
    voiceServiceRef.current = new VoiceService();
  }

  const [speaking, setSpeaking] = useState(false);
  const [listening, setListening] = useState(false);
  const [recognizedText, setRecognizedText] = useState('');
  const [message, setMessage] = useState<string | null>(null);

  // Mirrors didUpdateWidget's activity-change reset in the Flutter version:
  // stop any in-flight speech/listening and clear transcript when the
  // displayed activity changes (e.g. after Next advances).
  const previousActivityId = useRef(activity.id);
  useEffect(() => {
    if (previousActivityId.current !== activity.id) {
      previousActivityId.current = activity.id;
      voiceServiceRef.current?.stopSpeaking();
      void voiceServiceRef.current?.stopListening();
      setSpeaking(false);
      setListening(false);
      setRecognizedText('');
    }
  }, [activity.id]);

  useEffect(() => {
    return () => {
      voiceServiceRef.current?.dispose();
    };
  }, []);

  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => setMessage(null), 4000);
    return () => clearTimeout(timer);
  }, [message]);

  async function playPhrase() {
    const locale = localeForLanguageCode(languageCode);
    setSpeaking(true);
    // Speak the native-script text (e.g. ನಮಸ್ಕಾರ), not the romanized
    // "phrase" field -- reading the Latin transliteration with whatever
    // fallback voice the browser picks produces mispronunciation.
    const outcome = await voiceServiceRef.current!.speak(activity.nativeScript, locale);
    setSpeaking(false);
    if (outcome === 'spokenWithFallbackVoice') {
      setMessage(
        `No ${languageDisplayName(languageCode)} voice is installed here, so this played with a fallback voice and may not sound right.`,
      );
    } else if (outcome === 'noVoice') {
      setMessage('No text-to-speech voice is available on this device/browser.');
    }
  }

  async function toggleListening() {
    if (listening) {
      await voiceServiceRef.current!.stopListening();
      setListening(false);
      return;
    }

    setListening(true);
    setRecognizedText('');

    const locale = localeForLanguageCode(languageCode);
    const outcome = await voiceServiceRef.current!.startListening(locale, (recognizedWords, isFinal) => {
      setRecognizedText(recognizedWords);
      if (isFinal) {
        setListening(false);
      }
    });

    if (outcome === 'permissionDenied') {
      setListening(false);
      setMessage('Microphone access was denied. Allow microphone permission to record answers.');
    } else if (outcome === 'unavailable') {
      setListening(false);
      setMessage('Speech recognition is not available in this browser/device.');
    }
  }

  return (
    <GlossyPanel padding="18px" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <StatusBadge icon={<SchoolIcon />} label={activity.title} emphasis="primary" />
        <div style={{ flex: 1 }} />
        {isCompleted ? <CheckCircleIcon color="#047857" /> : <PendingIcon color="#94a3b8" />}
      </div>

      <p style={{ marginTop: 16, fontSize: 14, color: 'var(--bv-text)' }}>{activity.prompt}</p>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ maxWidth: 460, width: '100%', textAlign: 'center' }}>
          <div
            style={{
              width: 76,
              height: 76,
              margin: '0 auto',
              borderRadius: 8,
              background: 'rgba(14, 165, 164, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--bv-seed)',
            }}
          >
            <GraphicEqIcon width={40} height={40} />
          </div>
          <div style={{ marginTop: 18, fontSize: 36, fontWeight: 800, color: 'var(--bv-text)' }}>{activity.phrase}</div>
          <div style={{ marginTop: 8, fontSize: 16, fontWeight: 700, color: 'var(--bv-text-muted)' }}>{activity.meaning}</div>
        </div>
      </div>

      {(listening || recognizedText) && (
        <div style={{ textAlign: 'center', fontSize: 13, fontStyle: 'italic', color: 'var(--bv-text-faint)', marginBottom: 8 }}>
          {listening
            ? recognizedText
              ? `Hearing: "${recognizedText}"`
              : 'Listening...'
            : `You said: "${recognizedText}"`}
        </div>
      )}

      {message && (
        <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--bv-warning-fg)', marginBottom: 8 }}>{message}</div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button
          type="button"
          title={speaking ? 'Playing...' : 'Play phrase'}
          disabled={speaking}
          onClick={playPhrase}
          style={tonalButtonStyle}
        >
          <VolumeIcon />
        </button>
        <button
          type="button"
          title={listening ? 'Stop recording' : 'Record answer'}
          onClick={toggleListening}
          style={{
            ...tonalButtonStyle,
            background: listening ? '#fee2e2' : tonalButtonStyle.background,
            color: listening ? '#991b1b' : tonalButtonStyle.color,
          }}
        >
          {listening ? <StopCircleIcon /> : <MicIcon />}
        </button>
        <div style={{ flex: 1 }} />
        <button type="button" className="bv-filled-button" onClick={onComplete}>
          {isCompleted ? <CheckCircleIcon /> : <TaskAltIcon />}
          {isCompleted ? 'Completed' : 'Complete'}
        </button>
      </div>
    </GlossyPanel>
  );
}

const tonalButtonStyle = {
  border: 'none',
  borderRadius: 8,
  background: 'rgba(14, 165, 164, 0.12)',
  color: 'var(--bv-seed-dark)',
  padding: 10,
  display: 'flex',
  cursor: 'pointer',
} as const;
