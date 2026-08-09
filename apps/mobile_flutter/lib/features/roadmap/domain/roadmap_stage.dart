enum RoadmapStatus {
  completed,
  inProgress,
  planned,
}

class RoadmapStep {
  const RoadmapStep({
    required this.title,
    required this.status,
  });

  final String title;
  final RoadmapStatus status;
}

class RoadmapStage {
  const RoadmapStage({
    required this.title,
    required this.goal,
    required this.status,
    required this.steps,
  });

  final String title;
  final String goal;
  final RoadmapStatus status;
  final List<RoadmapStep> steps;

  int get completedStepCount =>
      steps.where((step) => step.status == RoadmapStatus.completed).length;
}

/// Mirrors docs/product/roadmap-learning-features.md.
///
/// Update both together: flip a step's status here whenever the matching
/// checkbox in the doc changes.
const List<RoadmapStage> bhashaVaaniRoadmap = [
  RoadmapStage(
    title: 'Stage 0 · Foundation',
    goal: 'What BhashaVaani already has in place today.',
    status: RoadmapStatus.completed,
    steps: [
      RoadmapStep(
        title: 'Kannada (full) and Hindi (preview) language packs',
        status: RoadmapStatus.completed,
      ),
      RoadmapStep(
        title: 'Append-only progress events and summary projection',
        status: RoadmapStatus.completed,
      ),
      RoadmapStep(
        title: 'Two-model lesson generation with reject-on-invalid output',
        status: RoadmapStatus.completed,
      ),
      RoadmapStep(
        title: 'Provider gateway with local Ollama as default provider',
        status: RoadmapStatus.completed,
      ),
      RoadmapStep(
        title: 'Tutor pet word assistant with explanation-language support',
        status: RoadmapStatus.completed,
      ),
    ],
  ),
  RoadmapStage(
    title: 'Stage 1 · Adaptive lessons from learning history',
    goal:
        '"Teach me Kannada today" resumes from what was already taught instead of restarting.',
    status: RoadmapStatus.inProgress,
    steps: [
      RoadmapStep(
        title:
            'Harden two-model JSON generation reliability (sized token budget, retry/repair loop, think:false fix, gemma4 default -- validated by sustained live usage)',
        status: RoadmapStatus.completed,
      ),
      RoadmapStep(
        title:
            'Progress-aware activity selection (Next saves progress; not-yet-learned catalog phrases are now guaranteed in every plan, not just prompted; weak/spaced-review scoring still planned)',
        status: RoadmapStatus.inProgress,
      ),
      RoadmapStep(
        title: 'Learned-words history view on the Progress tab (now grouped with a "learned xN" count instead of duplicate rows)',
        status: RoadmapStatus.completed,
      ),
      RoadmapStep(
        title: '"Teach me X" free-form lesson launcher',
        status: RoadmapStatus.completed,
      ),
      RoadmapStep(
        title: 'Session recap tied to prior sessions, not just today',
        status: RoadmapStatus.planned,
      ),
    ],
  ),
  RoadmapStage(
    title: 'Stage 2 · Two-bot scenario conversation studio',
    goal:
        'Give a scenario, two models converse in the target language, then replay it with a synced transcript.',
    status: RoadmapStatus.planned,
    steps: [
      RoadmapStep(
        title: 'Scenario input and conversation contract',
        status: RoadmapStatus.planned,
      ),
      RoadmapStep(
        title: 'Dialogue generation with director + reviewer models',
        status: RoadmapStatus.planned,
      ),
      RoadmapStep(
        title: 'Multi-voice text-to-speech and audio stitching',
        status: RoadmapStatus.planned,
      ),
      RoadmapStep(
        title: 'Scenario Studio playback and transcript screen',
        status: RoadmapStatus.planned,
      ),
      RoadmapStep(
        title: 'Save and revisit recorded conversations',
        status: RoadmapStatus.planned,
      ),
    ],
  ),
  RoadmapStage(
    title: 'Stage 3 · Personalized voice tutor',
    goal:
        'Speak in your comfortable language; the tutor replies in the target language, always in the same recognizable voice.',
    status: RoadmapStatus.planned,
    steps: [
      RoadmapStep(
        title:
            'Stopgap: lesson play/record buttons wired to browser flutter_tts + speech_to_text (not backend-gateway voice)',
        status: RoadmapStatus.completed,
      ),
      RoadmapStep(
        title: 'Speech-to-text for the explanation language (provider gateway)',
        status: RoadmapStatus.planned,
      ),
      RoadmapStep(
        title: 'Consistent per-profile text-to-speech voice',
        status: RoadmapStatus.planned,
      ),
      RoadmapStep(
        title: 'Bilingual turn-taking conversation loop',
        status: RoadmapStatus.planned,
      ),
      RoadmapStep(
        title: 'Push-to-talk mobile integration',
        status: RoadmapStatus.planned,
      ),
    ],
  ),
];
