import 'package:flutter_tts/flutter_tts.dart';
import 'package:speech_to_text/speech_recognition_result.dart';
import 'package:speech_to_text/speech_to_text.dart' as stt;

/// Outcome of asking [VoiceService] to start listening.
enum VoiceListenOutcome {
  listening,
  unavailable,
  permissionDenied,
}

/// Outcome of asking [VoiceService] to speak a phrase.
enum SpeakOutcome {
  /// Spoke using a voice that matches the requested language, so
  /// pronunciation should be correct.
  spokenInLanguage,

  /// Spoke, but no voice for the requested language was found, so playback
  /// used the engine's default voice. Pronunciation may not respect the
  /// target language (e.g. an English voice reading Kannada text).
  spokenWithFallbackVoice,

  /// No text-to-speech voice was available at all.
  noVoice,
}

/// Thin wrapper around the device/browser text-to-speech and speech-to-text
/// engines, used to make the lesson screen's play/record buttons actually do
/// something today.
///
/// This is a stopgap built on platform voice APIs (flutter_tts +
/// speech_to_text) rather than a new backend provider. It intentionally does
/// not try to guarantee a consistent voice per learner or route audio
/// through the provider gateway — that is Stage 2/3 work in
/// docs/product/roadmap-learning-features.md. This class exists so "Play
/// phrase" and "Record answer" are functional now instead of no-ops.
class VoiceService {
  VoiceService({FlutterTts? tts, stt.SpeechToText? speech})
      : _tts = tts ?? FlutterTts(),
        _speech = speech ?? stt.SpeechToText();

  final FlutterTts _tts;
  final stt.SpeechToText _speech;
  bool _speechInitialized = false;

  /// Speaks [text] using the requested locale when available, falling back
  /// to the engine's default voice otherwise. Returns a [SpeakOutcome] so
  /// callers can tell a genuine "spoke it correctly" from "spoke it with
  /// whatever voice was available" (e.g. an English voice reading Kannada
  /// script/romanization, which mispronounces it) instead of silently
  /// treating both as success.
  Future<SpeakOutcome> speak(String text, {required String localeId}) async {
    if (text.trim().isEmpty) {
      return SpeakOutcome.noVoice;
    }

    await _tts.stop();
    final hasMatchingVoice = await _hasVoiceForLocale(localeId);
    try {
      await _tts.setLanguage(localeId);
    } catch (_) {
      // Locale not installed/supported; continue with the default voice
      // rather than blocking playback entirely.
    }
    try {
      await _tts.setSpeechRate(0.45);
      final result = await _tts.speak(text);
      if (result != 1) {
        return SpeakOutcome.noVoice;
      }
      return hasMatchingVoice ? SpeakOutcome.spokenInLanguage : SpeakOutcome.spokenWithFallbackVoice;
    } catch (_) {
      return SpeakOutcome.noVoice;
    }
  }

  Future<void> stopSpeaking() => _tts.stop();

  /// Best-effort check for whether any installed TTS voice matches
  /// [localeId] (exact match) or at least its base language (e.g. "kn" for
  /// "kn-IN"). Not all platforms expose `getVoices`, so this fails open
  /// (returns false, meaning "assume no dedicated voice") rather than
  /// throwing.
  Future<bool> _hasVoiceForLocale(String localeId) async {
    try {
      final voices = await _tts.getVoices as List<dynamic>?;
      if (voices == null) {
        return false;
      }
      final languagePrefix = localeId.split('-').first.toLowerCase();
      return voices.any((voice) {
        final voiceLocale = (voice is Map ? voice['locale'] : null)?.toString().toLowerCase();
        if (voiceLocale == null) {
          return false;
        }
        return voiceLocale == localeId.toLowerCase() || voiceLocale.startsWith('$languagePrefix-');
      });
    } catch (_) {
      return false;
    }
  }

  /// Starts listening for speech in [localeId] when the platform supports
  /// it, otherwise falls back to the device default locale. Recognized text
  /// (interim and final) is streamed through [onResult].
  Future<VoiceListenOutcome> startListening({
    required String localeId,
    required void Function(String recognizedWords, bool isFinal) onResult,
  }) async {
    final available = await _ensureSpeechInitialized();
    if (!available) {
      return VoiceListenOutcome.permissionDenied;
    }

    final supportsRequestedLocale = await _localeSupported(localeId);

    try {
      await _speech.listen(
        localeId: supportsRequestedLocale ? localeId : null,
        onResult: (SpeechRecognitionResult result) {
          onResult(result.recognizedWords, result.finalResult);
        },
      );
      return VoiceListenOutcome.listening;
    } catch (_) {
      return VoiceListenOutcome.unavailable;
    }
  }

  Future<void> stopListening() => _speech.stop();

  bool get isListening => _speech.isListening;

  Future<bool> _ensureSpeechInitialized() async {
    if (_speechInitialized) {
      return true;
    }
    try {
      _speechInitialized = await _speech.initialize();
    } catch (_) {
      _speechInitialized = false;
    }
    return _speechInitialized;
  }

  Future<bool> _localeSupported(String localeId) async {
    try {
      final locales = await _speech.locales();
      return locales.any((locale) => locale.localeId == localeId);
    } catch (_) {
      return false;
    }
  }

  void dispose() {
    _tts.stop();
    _speech.stop();
  }
}
