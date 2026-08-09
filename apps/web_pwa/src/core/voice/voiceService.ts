import type { SpeechRecognitionLike } from './speechRecognition';

// Mirrors apps/mobile_flutter/lib/core/voice/voice_service.dart, ported
// from flutter_tts/speech_to_text to the browser's native
// speechSynthesis / SpeechRecognition APIs. Same stopgap status as the
// Flutter version: no guaranteed consistent voice per learner, and STT
// browser support is inconsistent (reliably Chrome/Chromium only) -- not a
// regression versus Flutter, just a different flavor of the same caveat.
// Stage 2/3 in docs/product/roadmap-learning-features.md replaces this with
// provider-gateway STT/TTS.

export type SpeakOutcome = 'spokenInLanguage' | 'spokenWithFallbackVoice' | 'noVoice';
export type VoiceListenOutcome = 'listening' | 'unavailable' | 'permissionDenied';

export class VoiceService {
  private recognition: SpeechRecognitionLike | null = null;
  private listening = false;

  async speak(text: string, localeId: string): Promise<SpeakOutcome> {
    if (!text.trim()) {
      return 'noVoice';
    }
    if (!('speechSynthesis' in window)) {
      return 'noVoice';
    }

    window.speechSynthesis.cancel();

    const hasMatchingVoice = await this.hasVoiceForLocale(localeId);

    return new Promise((resolve) => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = localeId;
      utterance.rate = 0.85;

      utterance.onend = () => resolve(hasMatchingVoice ? 'spokenInLanguage' : 'spokenWithFallbackVoice');
      utterance.onerror = () => resolve('noVoice');

      try {
        window.speechSynthesis.speak(utterance);
      } catch {
        resolve('noVoice');
      }
    });
  }

  stopSpeaking(): void {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }

  /** Best-effort check for whether any installed voice matches `localeId`
   * (exact match) or at least its base language (e.g. "kn" for "kn-IN").
   * `getVoices()` can return an empty list on first call before the
   * browser's voice list has loaded, so this fails open (assumes no
   * dedicated voice) rather than blocking playback. */
  private async hasVoiceForLocale(localeId: string): Promise<boolean> {
    if (!('speechSynthesis' in window)) {
      return false;
    }
    try {
      const voices = window.speechSynthesis.getVoices();
      const languagePrefix = localeId.split('-')[0]?.toLowerCase() ?? '';
      return voices.some((voice) => {
        const voiceLocale = voice.lang?.toLowerCase();
        return voiceLocale === localeId.toLowerCase() || voiceLocale?.startsWith(`${languagePrefix}-`);
      });
    } catch {
      return false;
    }
  }

  async startListening(
    localeId: string,
    onResult: (recognizedWords: string, isFinal: boolean) => void,
  ): Promise<VoiceListenOutcome> {
    const SpeechRecognitionCtor = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!SpeechRecognitionCtor) {
      return 'unavailable';
    }

    try {
      const recognition = new SpeechRecognitionCtor();
      recognition.lang = localeId;
      recognition.continuous = false;
      recognition.interimResults = true;

      recognition.onresult = (event) => {
        let transcript = '';
        let isFinal = false;
        for (let i = event.resultIndex; i < event.results.length; i += 1) {
          const result = event.results[i];
          transcript += result[0].transcript;
          isFinal = isFinal || result.isFinal;
        }
        onResult(transcript, isFinal);
      };

      recognition.onerror = (event) => {
        this.listening = false;
        if (event.error === 'not-allowed' || event.error === 'permission-denied') {
          // Surfaced to the caller via the returned outcome for the initial
          // start() failure path; mid-session denials just stop listening.
        }
      };

      recognition.onend = () => {
        this.listening = false;
      };

      recognition.start();
      this.recognition = recognition;
      this.listening = true;
      return 'listening';
    } catch (error) {
      if (error instanceof DOMException && error.name === 'NotAllowedError') {
        return 'permissionDenied';
      }
      return 'unavailable';
    }
  }

  async stopListening(): Promise<void> {
    this.recognition?.stop();
    this.listening = false;
  }

  get isListening(): boolean {
    return this.listening;
  }

  dispose(): void {
    this.stopSpeaking();
    this.recognition?.abort();
  }
}
