import 'package:flutter/material.dart';

import '../core/api/api_client.dart';
import '../core/config/app_config.dart';
import '../features/language_selection/domain/language_pack.dart';
import '../features/language_selection/domain/language_repository.dart';
import '../features/language_selection/presentation/language_selection_screen.dart';
import '../features/learning_session/domain/lesson_activity.dart';
import '../features/learning_session/domain/lesson_repository.dart';
import '../features/learning_session/presentation/learning_session_screen.dart';
import '../features/profiles/domain/learner_profile.dart';
import '../features/profiles/domain/profile_repository.dart';
import '../features/profiles/presentation/profile_selection_screen.dart';
import '../features/progress/domain/progress_repository.dart';
import '../features/progress/domain/progress_outbox_repository.dart';
import '../features/progress/domain/progress_summary.dart';
import '../features/progress/presentation/progress_screen.dart';
import '../features/tutor_pet/presentation/tutor_pet_button.dart';
import 'app_load_state.dart';
import 'bhasha_vaani_theme.dart';
import 'home_shell.dart';

class BhashaVaaniApp extends StatefulWidget {
  const BhashaVaaniApp({
    required this.config,
    super.key,
  });

  final AppConfig config;

  @override
  State<BhashaVaaniApp> createState() => _BhashaVaaniAppState();
}

class _BhashaVaaniAppState extends State<BhashaVaaniApp> {
  late final ApiClient apiClient;
  late final ProfileRepository profileRepository;
  late final LanguageRepository languageRepository;
  late final LessonRepository lessonRepository;
  late final ProgressRepository progressRepository;
  late final ProgressOutboxRepository progressOutboxRepository;
  LearnerProfile? selectedProfile;
  LanguagePack? selectedLanguage;
  ProgressSummary? progressSummary;
  AppLoadState loadState = const AppLoadState.loading();
  String? completionMessage;
  int queuedEventCount = 0;
  int selectedIndex = 0;
  int clientSequence = 0;

  List<LearnerProfile> profiles = const [
    LearnerProfile(
      id: 'profile_abhilash',
      displayName: 'Abhilash',
      type: ProfileType.adult,
      ageGroup: 'adult',
      explanationLanguage: 'Telugu',
      sessionMinutes: 15,
    ),
    LearnerProfile(
      id: 'profile_child',
      displayName: 'Child profile',
      type: ProfileType.child,
      ageGroup: '4 to 6',
      explanationLanguage: 'Telugu',
      sessionMinutes: 5,
    ),
  ];

  List<LanguagePack> languages = const [
    LanguagePack(
      code: 'kn',
      name: 'Kannada',
      nativeName: 'Kannada',
      status: LanguageSupportStatus.full,
      transliteration: true,
      speechToText: true,
      textToSpeech: true,
      pronunciation: 'Basic',
    ),
    LanguagePack(
      code: 'hi',
      name: 'Hindi',
      nativeName: 'Hindi',
      status: LanguageSupportStatus.planned,
      transliteration: true,
      speechToText: false,
      textToSpeech: false,
      pronunciation: 'Later',
    ),
  ];

  static const seedActivities = [
    LessonActivity(
      id: 'kn_a1_lesson_01_activity_01',
      title: 'Greeting',
      prompt: 'Listen and repeat a basic Kannada greeting.',
      phrase: 'Namaskara',
      meaning: 'Hello',
    ),
    LessonActivity(
      id: 'kn_a1_lesson_01_activity_02',
      title: 'Useful phrase',
      prompt: 'Practise asking for water.',
      phrase: 'Nanage neeru beku',
      meaning: 'I need water',
    ),
    LessonActivity(
      id: 'kn_a1_lesson_01_activity_03',
      title: 'Thank you',
      prompt: 'Practise a polite everyday phrase.',
      phrase: 'Dhanyavaadagalu',
      meaning: 'Thank you',
    ),
    LessonActivity(
      id: 'kn_a1_lesson_01_activity_04',
      title: 'Yes',
      prompt: 'Say a simple confirmation.',
      phrase: 'Howdu',
      meaning: 'Yes',
    ),
    LessonActivity(
      id: 'kn_a1_lesson_01_activity_05',
      title: 'No',
      prompt: 'Say a simple refusal.',
      phrase: 'Illa',
      meaning: 'No',
    ),
    LessonActivity(
      id: 'kn_a1_lesson_01_activity_06',
      title: 'How are you?',
      prompt: 'Practise a friendly question.',
      phrase: 'Hegiddira?',
      meaning: 'How are you?',
    ),
  ];
  List<LessonActivity> activities = seedActivities;

  @override
  void initState() {
    super.initState();
    apiClient = ApiClient(widget.config);
    profileRepository = ProfileRepository(apiClient);
    languageRepository = LanguageRepository(apiClient);
    lessonRepository = LessonRepository(apiClient);
    progressRepository = ProgressRepository(apiClient);
    progressOutboxRepository = const ProgressOutboxRepository();
    selectedProfile = profiles.first;
    selectedLanguage = languages.first;
    progressSummary = ProgressSummary.seed(
      profileName: selectedProfile!.displayName,
      languageName: selectedLanguage!.name,
    );
    _refreshQueuedCount();
    _loadInitialData();
  }

  @override
  Widget build(BuildContext context) {
    final profile = selectedProfile;
    final language = selectedLanguage;

    return MaterialApp(
      title: 'BhashaVaani',
      debugShowCheckedModeBanner: false,
      theme: buildBhashaVaaniTheme(),
      home: HomeShell(
        selectedIndex: selectedIndex,
        profileName: profile?.displayName ?? 'Learner',
        languageName: language?.name ?? 'Kannada',
        environmentName: widget.config.environmentName,
        floatingActionButton: TutorPetButton(
          apiClient: apiClient,
          selectedProfile: profile,
          languages: languages,
          selectedLanguage: language,
        ),
        onDestinationSelected: (index) {
          setState(() => selectedIndex = index);
        },
        body: switch (selectedIndex) {
          0 => ProfileSelectionScreen(
              profiles: profiles,
              selectedProfile: profile,
              loadState: loadState,
              onRetry: _loadInitialData,
              onProfileEdited: _saveProfile,
              onProfileSelected: (nextProfile) {
                setState(() => selectedProfile = nextProfile);
                _refreshJourney();
              },
            ),
          1 => LanguageSelectionScreen(
              languages: languages,
              selectedLanguage: language,
              loadState: loadState,
              onRetry: _loadInitialData,
              onLanguageSelected: (nextLanguage) {
                setState(() => selectedLanguage = nextLanguage);
                _refreshJourney();
              },
            ),
          2 => LearningSessionScreen(
              profile: profile,
              language: language,
              activities: activities,
              apiBaseUrl: widget.config.apiBaseUrl,
              loadState: loadState,
              completionMessage: completionMessage,
              queuedEventCount: queuedEventCount,
              onRetryConnection: _loadInitialData,
              onActivityCompleted: _recordActivityCompleted,
            ),
          _ => ProgressScreen(
              summary: progressSummary ??
                  ProgressSummary.seed(
                    profileName: profile?.displayName ?? 'Learner',
                    languageName: language?.name ?? 'Kannada',
              ),
              loadState: loadState,
              queuedEventCount: queuedEventCount,
              onRetry: _refreshProgress,
            ),
        },
      ),
    );
  }

  Future<void> _loadInitialData() async {
    setState(() {
      loadState = const AppLoadState.loading();
    });

    try {
      final loadedProfiles = await profileRepository.fetchProfiles();
      final loadedLanguages = await languageRepository.fetchLanguages();

      if (!mounted) {
        return;
      }

      setState(() {
        profiles = loadedProfiles;
        languages = loadedLanguages;
        selectedProfile = loadedProfiles.first;
        selectedLanguage = loadedLanguages.first;
        loadState = const AppLoadState.connected();
      });
      await _refreshProgress();
      await _refreshLessonJourney();
    } catch (error) {
      if (!mounted) {
        return;
      }

      setState(() {
        loadState = AppLoadState.fallback(error.toString());
      });
    }
  }

  Future<void> _refreshProgress() async {
    final profile = selectedProfile;
    final language = selectedLanguage;
    if (profile == null || language == null) {
      return;
    }

    try {
      await _flushQueuedEvents();
      final summary = await progressRepository.fetchSummary(
        profile: profile,
        language: language,
      );

      if (!mounted) {
        return;
      }

      setState(() {
        progressSummary = summary;
        loadState = const AppLoadState.connected();
      });
      await _refreshLessonJourney();
    } catch (error) {
      if (!mounted) {
        return;
      }

      setState(() {
        loadState = AppLoadState.fallback(error.toString());
      });
    }
  }

  Future<void> _recordActivityCompleted(String activityId) async {
    final profile = selectedProfile;
    final language = selectedLanguage;
    if (profile == null || language == null) {
      return;
    }

    clientSequence += 1;
    final event = progressRepository.buildActivityCompletedEvent(
      profile: profile,
      language: language,
      activityId: activityId,
      clientSequence: clientSequence,
    );

    try {
      setState(() {
        completionMessage = 'Saving progress...';
      });
      await progressRepository.uploadEvent(event);
      await _refreshProgress();
      if (!mounted) {
        return;
      }
      setState(() {
        completionMessage = 'Progress saved to backend';
      });
      await _refreshLessonJourney();
    } catch (error) {
      await progressOutboxRepository.enqueue(event);
      await _refreshQueuedCount();
      if (!mounted) {
        return;
      }

      setState(() {
        loadState = AppLoadState.fallback(error.toString());
        completionMessage = 'Completion queued for sync';
      });
    }
  }

  Future<void> _saveProfile(LearnerProfile profile) async {
    try {
      final savedProfile = await profileRepository.saveProfile(profile);
      if (!mounted) {
        return;
      }

      setState(() {
        profiles = [
          for (final currentProfile in profiles)
            if (currentProfile.id == savedProfile.id) savedProfile else currentProfile,
        ];
        selectedProfile = savedProfile;
        loadState = const AppLoadState.connected();
      });
      await _refreshProgress();
    } catch (error) {
      if (!mounted) {
        return;
      }

      setState(() {
        profiles = [
          for (final currentProfile in profiles)
            if (currentProfile.id == profile.id) profile else currentProfile,
        ];
        selectedProfile = profile;
        loadState = AppLoadState.fallback(error.toString());
      });
    }
  }

  Future<void> _refreshJourney() async {
    await _refreshProgress();
    await _refreshLessonJourney();
  }

  Future<void> _refreshLessonJourney() async {
    final profile = selectedProfile;
    final language = selectedLanguage;
    if (profile == null || language == null) {
      return;
    }

    try {
      final loadedActivities = await lessonRepository.fetchJourneyActivities(
        profile: profile,
        language: language,
      );
      if (!mounted) {
        return;
      }

      setState(() {
        activities = loadedActivities.isEmpty ? seedActivities : loadedActivities;
      });
    } catch (_) {
      if (!mounted) {
        return;
      }

      setState(() {
        activities = seedActivities;
      });
    }
  }

  Future<void> _refreshQueuedCount() async {
    final count = await progressOutboxRepository.queuedCount();
    if (!mounted) {
      return;
    }

    setState(() {
      queuedEventCount = count;
    });
  }

  Future<void> _flushQueuedEvents() async {
    final queuedEvents = await progressOutboxRepository.fetchQueuedEvents();
    if (queuedEvents.isEmpty) {
      await _refreshQueuedCount();
      return;
    }

    final failedEvents = <dynamic>[];
    for (final event in queuedEvents) {
      try {
        await progressRepository.uploadEvent(event);
      } catch (_) {
        failedEvents.add(event);
      }
    }

    await progressOutboxRepository.replaceAll(failedEvents.cast());
    await _refreshQueuedCount();
  }
}
