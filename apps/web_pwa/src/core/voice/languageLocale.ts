// Mirrors apps/mobile_flutter/lib/core/voice/language_locale.dart.
// Maps a BhashaVaani language code to a best-effort BCP-47 locale for
// browser voice APIs (speechSynthesis / SpeechRecognition). Coverage varies
// by browser/OS: Kannada and Hindi voices are not guaranteed to be
// installed everywhere, so callers must handle "not available" gracefully.
export function localeForLanguageCode(code: string | null | undefined): string {
  switch (code) {
    case 'kn':
      return 'kn-IN';
    case 'hi':
      return 'hi-IN';
    case 'ta':
      return 'ta-IN';
    case 'ml':
      return 'ml-IN';
    case 'pa':
      return 'pa-IN';
    case 'te':
      return 'te-IN';
    case 'en':
      return 'en-IN';
    default:
      return 'en-US';
  }
}

export function languageDisplayName(code: string | null | undefined): string {
  switch (code) {
    case 'kn':
      return 'Kannada';
    case 'hi':
      return 'Hindi';
    case 'ta':
      return 'Tamil';
    case 'ml':
      return 'Malayalam';
    case 'pa':
      return 'Punjabi';
    case 'te':
      return 'Telugu';
    default:
      return 'a matching';
  }
}
