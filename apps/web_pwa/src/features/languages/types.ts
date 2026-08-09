// Mirrors apps/mobile_flutter/lib/features/language_selection/domain/language_pack.dart.
export type LanguageSupportStatus = 'full' | 'beta' | 'preview' | 'planned';

export interface LanguagePack {
  code: string;
  name: string;
  nativeName: string;
  status: LanguageSupportStatus;
  transliteration: boolean;
  speechToText: boolean;
  textToSpeech: boolean;
  pronunciation: string;
}

export function languagePackFromJson(json: Record<string, unknown>): LanguagePack {
  const statusValue = (json.status as string | undefined) ?? 'planned';
  const status: LanguageSupportStatus = ['full', 'beta', 'preview'].includes(statusValue)
    ? (statusValue as LanguageSupportStatus)
    : 'planned';

  return {
    code: json.code as string,
    name: json.name as string,
    nativeName: (json.native_name as string | undefined) ?? (json.name as string),
    status,
    transliteration: Boolean(json.transliteration),
    speechToText: Boolean(json.speech_to_text),
    textToSpeech: Boolean(json.text_to_speech),
    pronunciation: (json.pronunciation as string | undefined) ?? 'Later',
  };
}

export function statusLabel(status: LanguageSupportStatus): string {
  switch (status) {
    case 'full':
      return 'Full';
    case 'beta':
      return 'Beta';
    case 'preview':
      return 'Preview';
    default:
      return 'Planned';
  }
}
