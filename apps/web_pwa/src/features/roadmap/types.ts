// Mirrors apps/mobile_flutter/lib/features/roadmap/domain/roadmap_stage.dart.
// Update both together: flip a step's status here whenever the matching
// checkbox in docs/product/roadmap-learning-features.md changes.
export type RoadmapStatus = 'completed' | 'inProgress' | 'planned';

export interface RoadmapStep {
  title: string;
  status: RoadmapStatus;
}

export interface RoadmapStage {
  title: string;
  goal: string;
  status: RoadmapStatus;
  steps: RoadmapStep[];
}

export const bhashaVaaniRoadmap: RoadmapStage[] = [
  {
    title: 'Stage 0 · Foundation',
    goal: 'What BhashaVaani already has in place today.',
    status: 'completed',
    steps: [
      { title: 'Kannada (full) and Hindi (preview) language packs', status: 'completed' },
      { title: 'Append-only progress events and summary projection', status: 'completed' },
      { title: 'Two-model lesson generation with reject-on-invalid output', status: 'completed' },
      { title: 'Provider gateway with local Ollama as default provider', status: 'completed' },
      { title: 'Tutor pet word assistant with explanation-language support', status: 'completed' },
    ],
  },
  {
    title: 'Stage 1 · Adaptive lessons from learning history',
    goal: '"Teach me Kannada today" resumes from what was already taught instead of restarting.',
    status: 'inProgress',
    steps: [
      {
        title:
          'Harden two-model JSON generation reliability (sized token budget, retry/repair loop, think:false fix, gemma4 default -- validated by sustained live usage)',
        status: 'completed',
      },
      {
        title:
          'Progress-aware activity selection (Next saves progress; not-yet-learned catalog phrases are now guaranteed in every plan, not just prompted; weak/spaced-review scoring still planned)',
        status: 'inProgress',
      },
      {
        title: 'Learned-words history view on the Progress tab (now grouped with a "learned ×N" count instead of duplicate rows)',
        status: 'completed',
      },
      { title: '"Teach me X" free-form lesson launcher', status: 'completed' },
      { title: 'Session recap tied to prior sessions, not just today', status: 'planned' },
    ],
  },
  {
    title: 'Stage 2 · Two-bot scenario conversation studio',
    goal: 'Give a scenario, two models converse in the target language, then replay it with a synced transcript.',
    status: 'planned',
    steps: [
      { title: 'Scenario input and conversation contract', status: 'planned' },
      { title: 'Dialogue generation with director + reviewer models', status: 'planned' },
      { title: 'Multi-voice text-to-speech and audio stitching', status: 'planned' },
      { title: 'Scenario Studio playback and transcript screen', status: 'planned' },
      { title: 'Save and revisit recorded conversations', status: 'planned' },
    ],
  },
  {
    title: 'Stage 3 · Personalized voice tutor',
    goal:
      'Speak in your comfortable language; the tutor replies in the target language, always in the same recognizable voice.',
    status: 'planned',
    steps: [
      {
        title:
          'Stopgap: lesson play/record buttons wired to browser Web Speech APIs (not backend-gateway voice)',
        status: 'completed',
      },
      { title: 'Speech-to-text for the explanation language (provider gateway)', status: 'planned' },
      { title: 'Consistent per-profile text-to-speech voice', status: 'planned' },
      { title: 'Bilingual turn-taking conversation loop', status: 'planned' },
      { title: 'Push-to-talk mobile integration', status: 'planned' },
    ],
  },
];
