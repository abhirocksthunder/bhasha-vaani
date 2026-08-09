import type { LessonActivity } from '../features/lessons/types';

// Mirrors the seedActivities in apps/mobile_flutter/lib/app/bhasha_vaani_app.dart.
export const seedActivities: LessonActivity[] = [
  {
    id: 'kn_a1_lesson_01_activity_01',
    title: 'Greeting',
    prompt: 'Listen and repeat a basic Kannada greeting.',
    phrase: 'Namaskara',
    nativeScript: 'ನಮಸ್ಕಾರ',
    meaning: 'Hello',
  },
  {
    id: 'kn_a1_lesson_01_activity_02',
    title: 'Useful phrase',
    prompt: 'Practise asking for water.',
    phrase: 'Nanage neeru beku',
    nativeScript: 'ನನಗೆ ನೀರು ಬೇಕು',
    meaning: 'I need water',
  },
  {
    id: 'kn_a1_lesson_01_activity_03',
    title: 'Thank you',
    prompt: 'Practise a polite everyday phrase.',
    phrase: 'Dhanyavaadagalu',
    nativeScript: 'ಧನ್ಯವಾದಗಳು',
    meaning: 'Thank you',
  },
  {
    id: 'kn_a1_lesson_01_activity_04',
    title: 'Yes',
    prompt: 'Say a simple confirmation.',
    phrase: 'Howdu',
    nativeScript: 'ಹೌದು',
    meaning: 'Yes',
  },
  {
    id: 'kn_a1_lesson_01_activity_05',
    title: 'No',
    prompt: 'Say a simple refusal.',
    phrase: 'Illa',
    nativeScript: 'ಇಲ್ಲ',
    meaning: 'No',
  },
  {
    id: 'kn_a1_lesson_01_activity_06',
    title: 'How are you?',
    prompt: 'Practise a friendly question.',
    phrase: 'Hegiddira?',
    nativeScript: 'ಹೇಗಿದ್ದೀರಾ?',
    meaning: 'How are you?',
  },
];
