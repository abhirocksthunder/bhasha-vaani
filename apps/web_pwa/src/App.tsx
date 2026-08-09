import { useEffect, useRef, useState } from 'react';
import { ApiClient } from './core/api/apiClient';
import { loadAppConfig } from './core/config/appConfig';
import { ProfileRepository } from './features/profiles/profileRepository';
import { LanguageRepository } from './features/languages/languageRepository';
import { LessonRepository, LessonGenerationException } from './features/lessons/lessonRepository';
import { OllamaRepository } from './features/lessons/ollamaRepository';
import { ProgressRepository } from './features/progress/progressRepository';
import { ProgressOutboxRepository } from './features/progress/progressOutboxRepository';
import { CatalogRepository } from './features/catalog/catalogRepository';
import { ProfileSelectionScreen } from './features/profiles/ProfileSelectionScreen';
import { LanguageSelectionScreen } from './features/languages/LanguageSelectionScreen';
import { LessonSessionScreen } from './features/lessons/LessonSessionScreen';
import { ProgressScreen } from './features/progress/ProgressScreen';
import { RoadmapScreen } from './features/roadmap/RoadmapScreen';
import { CatalogBuilderScreen } from './features/catalog/CatalogBuilderScreen';
import { TutorPetButton } from './features/tutorPet/TutorPetButton';
import type { LearnerProfile } from './features/profiles/types';
import type { LanguagePack } from './features/languages/types';
import type { LessonActivity } from './features/lessons/types';
import type { LearnedWord, ProgressSummary } from './features/progress/types';
import { HomeShell } from './app/HomeShell';
import { seedActivities } from './app/seedActivities';
import { seedLanguages, seedProfiles } from './app/seedData';
import { seedProgressSummary } from './features/progress/types';
import { connectedState, fallbackState, loadingState, type AppLoadState } from './app/appLoadState';

// Mirrors the top-level state management in
// apps/mobile_flutter/lib/app/bhasha_vaani_app.dart (_BhashaVaaniAppState).
const config = loadAppConfig();
const apiClient = new ApiClient(config);
const profileRepository = new ProfileRepository(apiClient);
const languageRepository = new LanguageRepository(apiClient);
const lessonRepository = new LessonRepository(apiClient);
const ollamaRepository = new OllamaRepository(apiClient);
const progressRepository = new ProgressRepository(apiClient);
const progressOutboxRepository = new ProgressOutboxRepository();
const catalogRepository = new CatalogRepository(apiClient);

export default function App() {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [profiles, setProfiles] = useState<LearnerProfile[]>(seedProfiles);
  const [languages, setLanguages] = useState<LanguagePack[]>(seedLanguages);
  const [selectedProfile, setSelectedProfile] = useState<LearnerProfile | null>(seedProfiles[0] ?? null);
  const [selectedLanguage, setSelectedLanguage] = useState<LanguagePack | null>(seedLanguages[0] ?? null);
  const [loadState, setLoadState] = useState<AppLoadState>(loadingState);
  const [activities, setActivities] = useState<LessonActivity[]>(seedActivities);
  const [generatingLessonPlan, setGeneratingLessonPlan] = useState(false);
  const [completionMessage, setCompletionMessage] = useState<string | null>(null);
  const [completionMessageIsError, setCompletionMessageIsError] = useState(false);
  const [queuedEventCount, setQueuedEventCount] = useState(0);
  const [progressSummary, setProgressSummary] = useState<ProgressSummary | null>(null);
  const [learnedWords, setLearnedWords] = useState<LearnedWord[]>([]);
  const [loadingLearnedWords, setLoadingLearnedWords] = useState(false);

  const clientSequence = useRef(0);
  // Refs mirror the "always read the latest selectedProfile/selectedLanguage"
  // behavior the Flutter version gets for free from `this.selectedProfile`
  // inside async methods, without adding every setter to every effect's
  // dependency array.
  const selectedProfileRef = useRef(selectedProfile);
  selectedProfileRef.current = selectedProfile;
  const selectedLanguageRef = useRef(selectedLanguage);
  selectedLanguageRef.current = selectedLanguage;

  useEffect(() => {
    void refreshQueuedCount();
    void loadInitialData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadInitialData() {
    setLoadState(loadingState);
    try {
      const [loadedProfiles, loadedLanguages] = await Promise.all([
        profileRepository.fetchProfiles(),
        languageRepository.fetchLanguages(),
      ]);
      setProfiles(loadedProfiles);
      setLanguages(loadedLanguages);
      const profile = loadedProfiles[0] ?? null;
      const language = loadedLanguages[0] ?? null;
      setSelectedProfile(profile);
      setSelectedLanguage(language);
      setLoadState(connectedState);
      await refreshProgress(profile, language);
      await refreshLessonJourney(profile, language);
    } catch (error) {
      setLoadState(fallbackState(error instanceof Error ? error.message : String(error)));
    }
  }

  async function refreshJourney() {
    await refreshProgress(selectedProfileRef.current, selectedLanguageRef.current);
    await refreshLessonJourney(selectedProfileRef.current, selectedLanguageRef.current);
  }

  async function refreshLessonJourney(profile: LearnerProfile | null, language: LanguagePack | null) {
    if (!profile || !language) return;
    try {
      const loadedActivities = await lessonRepository.fetchJourneyActivities({ profile, language });
      setActivities(loadedActivities.length === 0 ? seedActivities : loadedActivities);
    } catch {
      setActivities(seedActivities);
    }
  }

  async function refreshProgress(profile: LearnerProfile | null, language: LanguagePack | null) {
    if (!profile || !language) return;
    try {
      await flushQueuedEvents();
      const summary = await progressRepository.fetchSummary({ profile, language });
      setProgressSummary(summary);
      setLoadState(connectedState);
      await refreshLessonJourney(profile, language);
      await refreshLearnedWords(profile, language);
    } catch (error) {
      setLoadState(fallbackState(error instanceof Error ? error.message : String(error)));
    }
  }

  async function refreshLearnedWords(profile: LearnerProfile | null, language: LanguagePack | null) {
    if (!profile || !language) return;
    setLoadingLearnedWords(true);
    try {
      const words = await progressRepository.fetchLearnedWords({ profile, language });
      setLearnedWords(words);
    } catch {
      // Keep whatever was last loaded rather than clearing history just
      // because a single refresh failed (e.g. a transient network blip).
    } finally {
      setLoadingLearnedWords(false);
    }
  }

  async function recordActivityCompleted(activityId: string) {
    const profile = selectedProfileRef.current;
    const language = selectedLanguageRef.current;
    if (!profile || !language) return;

    clientSequence.current += 1;
    const event = progressRepository.buildActivityCompletedEvent({
      profile,
      language,
      activityId,
      clientSequence: clientSequence.current,
    });

    try {
      setCompletionMessage('Saving progress...');
      setCompletionMessageIsError(false);
      await progressRepository.uploadEvent(event);
      await refreshProgress(profile, language);
      setCompletionMessage('Progress saved to backend');
      setCompletionMessageIsError(false);
      await refreshLessonJourney(profile, language);
    } catch (error) {
      await progressOutboxRepository.enqueue(event);
      await refreshQueuedCount();
      setLoadState(fallbackState(error instanceof Error ? error.message : String(error)));
      setCompletionMessage('Completion queued for sync');
      setCompletionMessageIsError(false);
    }
  }

  async function generateLessonPlan(ollamaModel: string | null, requestText?: string) {
    const profile = selectedProfileRef.current;
    const language = selectedLanguageRef.current;
    if (!profile || !language || generatingLessonPlan) return;

    setGeneratingLessonPlan(true);
    setCompletionMessage(ollamaModel ? `Generating lesson plan with ${ollamaModel}...` : 'Generating lesson plan...');
    setCompletionMessageIsError(false);

    try {
      const { activities: generatedActivities, interpretation } = await lessonRepository.generateJourneyActivities({
        profile,
        language,
        ollamaModel,
        requestText,
      });
      setActivities(generatedActivities.length === 0 ? seedActivities : generatedActivities);
      setLoadState(connectedState);
      setCompletionMessage(
        interpretation
          ? `Generated a plan for "${interpretation.requestText}" (${interpretation.resolvedMode === 'review' ? 'review' : 'new'} phrases, ${interpretation.resolvedTargetCount} activities)`
          : 'Generated adaptive lesson plan',
      );
      setCompletionMessageIsError(false);
    } catch (error) {
      if (error instanceof LessonGenerationException) {
        setCompletionMessage(`Could not generate a new lesson plan: ${error.message}`);
        setCompletionMessageIsError(true);
      } else {
        setLoadState(fallbackState(error instanceof Error ? error.message : String(error)));
        setCompletionMessage('Could not reach the backend to generate a lesson plan');
        setCompletionMessageIsError(true);
      }
    } finally {
      setGeneratingLessonPlan(false);
    }
  }

  async function saveProfile(profile: LearnerProfile) {
    try {
      const saved = await profileRepository.saveProfile(profile);
      setProfiles((current) => current.map((p) => (p.id === saved.id ? saved : p)));
      setSelectedProfile(saved);
      setLoadState(connectedState);
      await refreshProgress(saved, selectedLanguageRef.current);
    } catch (error) {
      setProfiles((current) => current.map((p) => (p.id === profile.id ? profile : p)));
      setSelectedProfile(profile);
      setLoadState(fallbackState(error instanceof Error ? error.message : String(error)));
    }
  }

  async function refreshQueuedCount() {
    const count = await progressOutboxRepository.queuedCount();
    setQueuedEventCount(count);
  }

  async function flushQueuedEvents() {
    // Retries whatever is queued regardless of which profile is currently
    // selected -- matches the Flutter version's behavior; this stopgap
    // outbox doesn't partition by profile. A per-profile partition is
    // future work if that turns out to matter in practice.
    const queuedEvents = await progressOutboxRepository.fetchQueuedEvents();
    if (queuedEvents.length === 0) {
      await refreshQueuedCount();
      return;
    }
    const failedEvents = [];
    for (const event of queuedEvents) {
      try {
        await progressRepository.uploadEvent(event);
      } catch {
        failedEvents.push(event);
      }
    }
    await progressOutboxRepository.replaceAll(failedEvents);
    await refreshQueuedCount();
  }

  const profileName = selectedProfile?.displayName ?? 'Learner';
  const languageName = selectedLanguage?.name ?? 'Kannada';

  return (
    <HomeShell
      selectedIndex={selectedIndex}
      onDestinationSelected={setSelectedIndex}
      profileName={profileName}
      languageName={languageName}
      environmentName={config.environmentName}
      floatingActionButton={
        <TutorPetButton
          apiClient={apiClient}
          selectedProfile={selectedProfile}
          languages={languages}
          selectedLanguage={selectedLanguage}
        />
      }
      body={
        selectedIndex === 0 ? (
          <ProfileSelectionScreen
            profiles={profiles}
            selectedProfile={selectedProfile}
            loadState={loadState}
            onRetry={loadInitialData}
            onProfileSelected={(profile) => {
              setSelectedProfile(profile);
              void refreshJourney();
            }}
            onProfileEdited={saveProfile}
          />
        ) : selectedIndex === 1 ? (
          <LanguageSelectionScreen
            languages={languages}
            selectedLanguage={selectedLanguage}
            loadState={loadState}
            onRetry={loadInitialData}
            onLanguageSelected={(language) => {
              setSelectedLanguage(language);
              void refreshJourney();
            }}
          />
        ) : selectedIndex === 2 ? (
          <LessonSessionScreen
            profile={selectedProfile}
            language={selectedLanguage}
            activities={activities}
            ollamaRepository={ollamaRepository}
            loadState={loadState}
            completionMessage={completionMessage}
            completionMessageIsError={completionMessageIsError}
            queuedEventCount={queuedEventCount}
            onRetryConnection={loadInitialData}
            onActivityCompleted={recordActivityCompleted}
            onGenerateLessonPlan={generateLessonPlan}
            generatingLessonPlan={generatingLessonPlan}
          />
        ) : selectedIndex === 3 ? (
          <ProgressScreen
            summary={progressSummary ?? seedProgressSummary(profileName, languageName)}
            loadState={loadState}
            queuedEventCount={queuedEventCount}
            onRetry={loadInitialData}
            learnedWords={learnedWords}
            loadingLearnedWords={loadingLearnedWords}
          />
        ) : selectedIndex === 4 ? (
          <RoadmapScreen />
        ) : (
          <CatalogBuilderScreen
            languages={languages}
            selectedLanguage={selectedLanguage}
            ollamaRepository={ollamaRepository}
            catalogRepository={catalogRepository}
          />
        )
      }
    />
  );
}
