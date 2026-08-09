/// Maps a BhashaVaani language code to a best-effort BCP-47 locale for
/// on-device / browser voice APIs (flutter_tts, speech_to_text).
///
/// Coverage varies by platform and browser: Kannada and Hindi voices are not
/// guaranteed to be installed everywhere, so callers must handle "not
/// available" gracefully rather than assuming the requested locale will
/// work. See docs/product/roadmap-learning-features.md Stage 3, which
/// replaces this stopgap with provider-gateway STT/TTS.
String localeForLanguageCode(String? code) {
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
