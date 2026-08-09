import 'package:flutter/material.dart';

import '../../../app/app_load_state.dart';
import '../../../app/ui/glossy_panel.dart';
import '../../../app/ui/screen_header.dart';
import '../../../app/ui/state_panels.dart';
import '../../../app/ui/status_badge.dart';
import '../../../core/api/api_client.dart';
import '../../../core/api/ollama_model.dart';
import '../../../core/voice/language_locale.dart';
import '../../../core/voice/voice_service.dart';
import '../../language_selection/domain/language_pack.dart';
import '../../profiles/domain/learner_profile.dart';
import '../domain/lesson_activity.dart';

class LearningSessionScreen extends StatefulWidget {
  const LearningSessionScreen({
    required this.profile,
    required this.language,
    required this.activities,
    required this.apiClient,
    required this.loadState,
    required this.completionMessage,
    this.completionMessageIsError = false,
    required this.queuedEventCount,
    required this.onRetryConnection,
    required this.onActivityCompleted,
    required this.onGenerateLessonPlan,
    required this.generatingLessonPlan,
    super.key,
  });

  final LearnerProfile? profile;
  final LanguagePack? language;
  final List<LessonActivity> activities;
  final ApiClient apiClient;
  final AppLoadState loadState;
  final String? completionMessage;
  final bool completionMessageIsError;
  final int queuedEventCount;
  final VoidCallback onRetryConnection;
  final Future<void> Function(String activityId) onActivityCompleted;
  final Future<void> Function(String? ollamaModel) onGenerateLessonPlan;
  final bool generatingLessonPlan;

  @override
  State<LearningSessionScreen> createState() => _LearningSessionScreenState();
}

class _LearningSessionScreenState extends State<LearningSessionScreen> {
  int activityIndex = 0;
  final completedActivityIds = <String>{};
  List<OllamaModel> ollamaModels = const [];
  String? selectedOllamaModel;
  bool loadingModels = false;

  @override
  void initState() {
    super.initState();
    _loadOllamaModels();
  }

  @override
  void didUpdateWidget(covariant LearningSessionScreen oldWidget) {
    super.didUpdateWidget(oldWidget);
    // Every "Next"/"Complete" tap triggers a backend refetch of the lesson
    // journey (to persist progress and pick up server-driven changes), and
    // that refetch always returns a freshly-decoded List instance even when
    // the activities are unchanged. Comparing lists by reference (`!=`)
    // treated that as "the lesson changed" on every single tap, resetting
    // activityIndex back to 0 right after _next() had just moved it
    // forward, so the learner appeared stuck re-refreshing the same card.
    // Compare by activity id content instead, and only reset position when
    // the underlying set of activities has actually changed.
    if (!_sameActivityIds(oldWidget.activities, widget.activities)) {
      activityIndex = 0;
      completedActivityIds.clear();
    } else if (activityIndex >= widget.activities.length && widget.activities.isNotEmpty) {
      activityIndex = widget.activities.length - 1;
    }
  }

  bool _sameActivityIds(List<LessonActivity> a, List<LessonActivity> b) {
    if (a.length != b.length) {
      return false;
    }
    for (var i = 0; i < a.length; i++) {
      if (a[i].id != b[i].id) {
        return false;
      }
    }
    return true;
  }

  Future<void> _loadOllamaModels() async {
    setState(() => loadingModels = true);

    try {
      final response = await widget.apiClient.getMap('/providers/ollama/models');
      final modelsJson = response['models'] as List<dynamic>? ?? const [];
      final loadedModels = [
        for (final model in modelsJson)
          OllamaModel.fromJson(model as Map<String, dynamic>),
      ];
      if (!mounted) {
        return;
      }

      setState(() {
        ollamaModels = loadedModels;
        selectedOllamaModel = response['selected_model'] as String? ??
            (loadedModels.isEmpty ? null : loadedModels.first.name);
      });
    } catch (_) {
      if (!mounted) {
        return;
      }

      setState(() {
        ollamaModels = const [];
        selectedOllamaModel = null;
      });
    } finally {
      if (mounted) {
        setState(() => loadingModels = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final profile = widget.profile;
    final language = widget.language;

    if (widget.activities.isEmpty) {
      return const EmptyStatePanel(
        icon: Icons.school,
        title: 'No lesson activities',
        message: 'Add starter curriculum to the selected language pack.',
      );
    }

    final activity = widget.activities[activityIndex];
    final isCompleted = completedActivityIds.contains(activity.id);
    final progress = (activityIndex + 1) / widget.activities.length;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        ScreenHeader(
          eyebrow: 'Guided lesson',
          title: '${language?.name ?? 'Kannada'} starter',
          subtitle: '${profile?.displayName ?? 'Learner'} is practising with ${widget.loadState.message}.',
          trailing: StatusBadge(
            icon: widget.loadState.isFallback
                ? Icons.offline_bolt
                : Icons.auto_awesome,
            label: widget.loadState.isFallback ? 'Queue enabled' : 'Local AI ready',
            emphasis: widget.loadState.isFallback
                ? BadgeEmphasis.warning
                : BadgeEmphasis.success,
          ),
        ),
        const SizedBox(height: 14),
        if (widget.loadState.isLoading) ...[
          const LoadingPanel(
            title: 'Preparing lesson state',
            message: 'Checking backend progress before you continue.',
          ),
          const SizedBox(height: 12),
        ] else if (widget.loadState.isFallback) ...[
          ErrorStatePanel(
            title: 'Lesson can continue offline',
            message: 'Completed activities will be marked locally for now and synced when port 6001 is reachable.',
            onRetry: widget.onRetryConnection,
          ),
          const SizedBox(height: 12),
        ] else if (widget.completionMessage != null) ...[
          GlossyPanel(
            child: StatusBadge(
              icon: widget.completionMessageIsError ? Icons.error_outline : Icons.cloud_done,
              label: widget.completionMessage!,
              emphasis: widget.completionMessageIsError ? BadgeEmphasis.warning : BadgeEmphasis.success,
            ),
          ),
          const SizedBox(height: 12),
        ],
        Expanded(
          child: LayoutBuilder(
            builder: (context, constraints) {
              final wide = constraints.maxWidth >= 820;

              if (wide) {
                return Row(
                  children: [
                    Expanded(
                      flex: 3,
                      child: _LessonCard(
                        activity: activity,
                        isCompleted: isCompleted,
                        onComplete: _completeCurrent,
                        languageCode: language?.code,
                      ),
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      flex: 2,
                      child: _SessionPanel(
                        progress: progress,
                        activityIndex: activityIndex,
                        activityCount: widget.activities.length,
                        completedCount: completedActivityIds.length,
                        queuedCount: widget.queuedEventCount,
                        generatingLessonPlan: widget.generatingLessonPlan,
                        onPrevious: activityIndex == 0 ? null : _previous,
                        onNext: activityIndex == widget.activities.length - 1 ? null : _next,
                        onGenerateLessonPlan: () => widget.onGenerateLessonPlan(selectedOllamaModel),
                        ollamaModels: ollamaModels,
                        selectedOllamaModel: selectedOllamaModel,
                        loadingModels: loadingModels,
                        onOllamaModelChanged: (model) => setState(() => selectedOllamaModel = model),
                        onRefreshModels: _loadOllamaModels,
                      ),
                    ),
                  ],
                );
              }

              return ListView(
                children: [
                  SizedBox(
                    height: 430,
                    child: _LessonCard(
                      activity: activity,
                      isCompleted: isCompleted,
                      onComplete: _completeCurrent,
                      languageCode: language?.code,
                    ),
                  ),
                  const SizedBox(height: 12),
                  _SessionPanel(
                    progress: progress,
                    activityIndex: activityIndex,
                    activityCount: widget.activities.length,
                    completedCount: completedActivityIds.length,
                    queuedCount: widget.queuedEventCount,
                    generatingLessonPlan: widget.generatingLessonPlan,
                    onPrevious: activityIndex == 0 ? null : _previous,
                    onNext: activityIndex == widget.activities.length - 1 ? null : _next,
                    onGenerateLessonPlan: () => widget.onGenerateLessonPlan(selectedOllamaModel),
                    ollamaModels: ollamaModels,
                    selectedOllamaModel: selectedOllamaModel,
                    loadingModels: loadingModels,
                    onOllamaModelChanged: (model) => setState(() => selectedOllamaModel = model),
                    onRefreshModels: _loadOllamaModels,
                  ),
                ],
              );
            },
          ),
        ),
      ],
    );
  }

  Future<void> _completeCurrent() async {
    setState(() {
      completedActivityIds.add(widget.activities[activityIndex].id);
    });
    await widget.onActivityCompleted(widget.activities[activityIndex].id);
  }

  void _previous() {
    setState(() => activityIndex -= 1);
  }

  Future<void> _next() async {
    // "Next" used to just move the on-screen index without saving anything:
    // a learner who paged through phrases with Next/Back and never pressed
    // the separate "Complete" button on the card had zero progress events
    // recorded, so completed_activities stayed 0 server-side and the next
    // fetched journey looked like it "reset" to the same phrases. Treat
    // moving past a phrase as having practised it, the same way a normal
    // lesson app would, while still leaving the explicit Complete button in
    // place for anyone who wants to mark it without navigating.
    final currentActivity = widget.activities[activityIndex];
    if (!completedActivityIds.contains(currentActivity.id)) {
      await _completeCurrent();
      if (!mounted) {
        return;
      }
    }
    setState(() => activityIndex += 1);
  }
}

class _LessonCard extends StatefulWidget {
  const _LessonCard({
    required this.activity,
    required this.isCompleted,
    required this.onComplete,
    required this.languageCode,
  });

  final LessonActivity activity;
  final bool isCompleted;
  final VoidCallback onComplete;
  final String? languageCode;

  @override
  State<_LessonCard> createState() => _LessonCardState();
}

class _LessonCardState extends State<_LessonCard> {
  final _voiceService = VoiceService();
  bool _speaking = false;
  bool _listening = false;
  String _recognizedText = '';

  @override
  void didUpdateWidget(covariant _LessonCard oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.activity.id != widget.activity.id) {
      _voiceService.stopSpeaking();
      _voiceService.stopListening();
      setState(() {
        _speaking = false;
        _listening = false;
        _recognizedText = '';
      });
    }
  }

  @override
  void dispose() {
    _voiceService.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final activity = widget.activity;
    final isCompleted = widget.isCompleted;

    return GlossyPanel(
      padding: const EdgeInsets.all(18),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              StatusBadge(
                icon: Icons.school,
                label: activity.title,
                emphasis: BadgeEmphasis.primary,
              ),
              const Spacer(),
              Icon(
                isCompleted ? Icons.check_circle : Icons.pending_outlined,
                color: isCompleted ? const Color(0xFF047857) : const Color(0xFF94A3B8),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Text(
            activity.prompt,
            style: Theme.of(context).textTheme.bodyMedium,
          ),
          const Spacer(),
          Center(
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 460),
              child: Column(
                children: [
                  Container(
                    width: 76,
                    height: 76,
                    decoration: BoxDecoration(
                      color: colorScheme.primary.withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Icon(
                      Icons.graphic_eq,
                      size: 40,
                      color: colorScheme.primary,
                    ),
                  ),
                  const SizedBox(height: 18),
                  FittedBox(
                    fit: BoxFit.scaleDown,
                    child: Text(
                      activity.phrase,
                      textAlign: TextAlign.center,
                      style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                            fontSize: 36,
                          ),
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    activity.meaning,
                    textAlign: TextAlign.center,
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          color: const Color(0xFF475569),
                        ),
                  ),
                ],
              ),
            ),
          ),
          if (_listening || _recognizedText.isNotEmpty) ...[
            Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: Text(
                _listening
                    ? (_recognizedText.isEmpty ? 'Listening...' : 'Hearing: "$_recognizedText"')
                    : 'You said: "$_recognizedText"',
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: const Color(0xFF64748B),
                      fontStyle: FontStyle.italic,
                    ),
              ),
            ),
          ],
          Row(
            children: [
              IconButton.filledTonal(
                tooltip: _speaking ? 'Playing...' : 'Play phrase',
                onPressed: _speaking ? null : _playPhrase,
                icon: Icon(_speaking ? Icons.volume_up : Icons.volume_up_outlined),
              ),
              const SizedBox(width: 8),
              IconButton.filledTonal(
                tooltip: _listening ? 'Stop recording' : 'Record answer',
                onPressed: _toggleListening,
                icon: Icon(_listening ? Icons.stop_circle : Icons.mic),
                style: _listening
                    ? IconButton.styleFrom(
                        backgroundColor: colorScheme.errorContainer,
                        foregroundColor: colorScheme.onErrorContainer,
                      )
                    : null,
              ),
              const Spacer(),
              Flexible(
                child: FilledButton.icon(
                  onPressed: widget.onComplete,
                  icon: Icon(isCompleted ? Icons.check_circle : Icons.task_alt),
                  label: Text(isCompleted ? 'Completed' : 'Complete'),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Future<void> _playPhrase() async {
    final locale = localeForLanguageCode(widget.languageCode);
    setState(() => _speaking = true);
    // Speak the native-script text (e.g. ನಮಸ್ಕಾರ), not the romanized
    // "phrase" field: reading the Latin transliteration with whatever
    // fallback voice the browser picks is what produced English-accented
    // pronunciation of Kannada/Hindi words.
    final outcome = await _voiceService.speak(widget.activity.nativeScript, localeId: locale);
    if (!mounted) {
      return;
    }
    setState(() => _speaking = false);
    switch (outcome) {
      case SpeakOutcome.spokenInLanguage:
        break;
      case SpeakOutcome.spokenWithFallbackVoice:
        _showMessage(
          'No ${_languageDisplayName(widget.languageCode)} voice is installed here, so this '
          'played with a fallback voice and may not sound right.',
        );
        break;
      case SpeakOutcome.noVoice:
        _showMessage('No text-to-speech voice is available on this device/browser.');
        break;
    }
  }

  String _languageDisplayName(String? code) {
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

  Future<void> _toggleListening() async {
    if (_listening) {
      await _voiceService.stopListening();
      if (!mounted) {
        return;
      }
      setState(() => _listening = false);
      return;
    }

    final locale = localeForLanguageCode(widget.languageCode);
    setState(() {
      _listening = true;
      _recognizedText = '';
    });

    final outcome = await _voiceService.startListening(
      localeId: locale,
      onResult: (recognizedWords, isFinal) {
        if (!mounted) {
          return;
        }
        setState(() {
          _recognizedText = recognizedWords;
          if (isFinal) {
            _listening = false;
          }
        });
      },
    );

    if (!mounted) {
      return;
    }

    switch (outcome) {
      case VoiceListenOutcome.listening:
        break;
      case VoiceListenOutcome.permissionDenied:
        setState(() => _listening = false);
        _showMessage('Microphone access was denied. Allow microphone permission to record answers.');
        break;
      case VoiceListenOutcome.unavailable:
        setState(() => _listening = false);
        _showMessage('Speech recognition is not available in this browser/device.');
        break;
    }
  }

  void _showMessage(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message)),
    );
  }
}

class _SessionPanel extends StatelessWidget {
  const _SessionPanel({
    required this.progress,
    required this.activityIndex,
    required this.activityCount,
    required this.completedCount,
    required this.queuedCount,
    required this.generatingLessonPlan,
    required this.onPrevious,
    required this.onNext,
    required this.onGenerateLessonPlan,
    required this.ollamaModels,
    required this.selectedOllamaModel,
    required this.loadingModels,
    required this.onOllamaModelChanged,
    required this.onRefreshModels,
  });

  final double progress;
  final int activityIndex;
  final int activityCount;
  final int completedCount;
  final int queuedCount;
  final bool generatingLessonPlan;
  final VoidCallback? onPrevious;
  final VoidCallback? onNext;
  final Future<void> Function() onGenerateLessonPlan;
  final List<OllamaModel> ollamaModels;
  final String? selectedOllamaModel;
  final bool loadingModels;
  final ValueChanged<String?> onOllamaModelChanged;
  final VoidCallback onRefreshModels;

  @override
  Widget build(BuildContext context) {
    return GlossyPanel(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Session flow',
            style: Theme.of(context).textTheme.titleLarge,
          ),
          const SizedBox(height: 10),
          ClipRRect(
            borderRadius: BorderRadius.circular(8),
            child: LinearProgressIndicator(
              value: progress,
              minHeight: 10,
            ),
          ),
          const SizedBox(height: 12),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              StatusBadge(
                icon: Icons.route,
                label: '${activityIndex + 1} of $activityCount',
                emphasis: BadgeEmphasis.primary,
              ),
              StatusBadge(
                icon: Icons.task_alt,
                label: '$completedCount done',
                emphasis: BadgeEmphasis.success,
              ),
              const StatusBadge(
                icon: Icons.sync,
                label: 'Offline sync ready',
                emphasis: BadgeEmphasis.neutral,
              ),
              if (queuedCount > 0)
                StatusBadge(
                  icon: Icons.cloud_upload,
                  label: '$queuedCount queued',
                  emphasis: BadgeEmphasis.warning,
                ),
            ],
          ),
          const SizedBox(height: 18),
          DropdownButtonFormField<String>(
            initialValue: selectedOllamaModel,
            items: [
              for (final model in ollamaModels)
                DropdownMenuItem(
                  value: model.name,
                  child: Text(
                    model.label,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
            ],
            onChanged: generatingLessonPlan ? null : onOllamaModelChanged,
            decoration: InputDecoration(
              labelText: 'Ollama model for lesson generation',
              helperText: ollamaModels.isEmpty && !loadingModels
                  ? 'No installed models found -- check Ollama is running.'
                  : null,
              suffixIcon: loadingModels
                  ? const Padding(
                      padding: EdgeInsets.all(14),
                      child: SizedBox(
                        width: 16,
                        height: 16,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      ),
                    )
                  : IconButton(
                      tooltip: 'Refresh installed models',
                      onPressed: onRefreshModels,
                      icon: const Icon(Icons.refresh),
                    ),
            ),
          ),
          const SizedBox(height: 10),
          SizedBox(
            width: double.infinity,
            child: OutlinedButton.icon(
              onPressed: generatingLessonPlan ? null : onGenerateLessonPlan,
              icon: generatingLessonPlan
                  ? const SizedBox(
                      width: 16,
                      height: 16,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : const Icon(Icons.auto_awesome),
              label: Text(generatingLessonPlan ? 'Generating' : 'Generate plan'),
            ),
          ),
          const SizedBox(height: 10),
          Row(
            children: [
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: onPrevious,
                  icon: const Icon(Icons.arrow_back),
                  label: const Text('Back'),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: FilledButton.icon(
                  onPressed: onNext,
                  icon: const Icon(Icons.arrow_forward),
                  label: const Text('Next'),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
