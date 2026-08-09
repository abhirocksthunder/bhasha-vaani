import type { LearnerProfile } from '../features/profiles/types';
import type { LanguagePack } from '../features/languages/types';

// Mirrors the seed profiles/languages in
// apps/mobile_flutter/lib/app/bhasha_vaani_app.dart, used as an offline
// fallback when the backend on 127.0.0.1:6001 isn't reachable.
export const seedProfiles: LearnerProfile[] = [
  {
    id: 'profile_abhilash',
    displayName: 'Abhilash',
    type: 'adult',
    ageGroup: 'adult',
    explanationLanguage: 'Telugu',
    sessionMinutes: 15,
  },
  {
    id: 'profile_child',
    displayName: 'Child profile',
    type: 'child',
    ageGroup: '4 to 6',
    explanationLanguage: 'Telugu',
    sessionMinutes: 5,
  },
];

export const seedLanguages: LanguagePack[] = [
  {
    code: 'kn',
    name: 'Kannada',
    nativeName: 'Kannada',
    status: 'full',
    transliteration: true,
    speechToText: true,
    textToSpeech: true,
    pronunciation: 'Basic',
  },
  {
    code: 'hi',
    name: 'Hindi',
    nativeName: 'Hindi',
    status: 'planned',
    transliteration: true,
    speechToText: false,
    textToSpeech: false,
    pronunciation: 'Later',
  },
];
