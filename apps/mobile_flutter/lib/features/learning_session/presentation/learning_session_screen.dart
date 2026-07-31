import 'package:flutter/material.dart';

import '../../../app/app_load_state.dart';
import '../../../app/ui/glossy_panel.dart';
import '../../../app/ui/screen_header.dart';
import '../../../app/ui/state_panels.dart';
import '../../../app/ui/status_badge.dart';
import '../../language_selection/domain/language_pack.dart';
import '../../profiles/domain/learner_profile.dart';
import '../domain/lesson_activity.dart';

class LearningSessionScreen extends StatefulWidget {
  const LearningSessionScreen({
    required this.profile,
    required this.language,
    required this.activities,
    required this.apiBaseUrl,
    required this.loadState,
    required this.completionMessage,
    required this.queuedEventCount,
    required this.onRetryConnection,
    required this.onActivityCompleted,
    super.key,
  });

  final LearnerProfile? profile;
  final LanguagePack? language;
  final List<LessonActivity> activities;
  final String apiBaseUrl;
  final AppLoadState loadState;
  final String? completionMessage;
  final int queuedEventCount;
  final VoidCallback onRetryConnection;
  final Future<void> Function(String activityId) onActivityCompleted;

  @override
  State<LearningSessionScreen> createState() => _LearningSessionScreenState();
}

class _LearningSessionScreenState extends State<LearningSessionScreen> {
  int activityIndex = 0;
  final completedActivityIds = <String>{};

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
              icon: Icons.cloud_done,
              label: widget.completionMessage!,
              emphasis: BadgeEmphasis.success,
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
                        onPrevious: activityIndex == 0 ? null : _previous,
                        onNext: activityIndex == widget.activities.length - 1 ? null : _next,
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
                    ),
                  ),
                  const SizedBox(height: 12),
                  _SessionPanel(
                    progress: progress,
                    activityIndex: activityIndex,
                    activityCount: widget.activities.length,
                    completedCount: completedActivityIds.length,
                    queuedCount: widget.queuedEventCount,
                    onPrevious: activityIndex == 0 ? null : _previous,
                    onNext: activityIndex == widget.activities.length - 1 ? null : _next,
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

  void _next() {
    setState(() => activityIndex += 1);
  }
}

class _LessonCard extends StatelessWidget {
  const _LessonCard({
    required this.activity,
    required this.isCompleted,
    required this.onComplete,
  });

  final LessonActivity activity;
  final bool isCompleted;
  final VoidCallback onComplete;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

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
          const Spacer(),
          Row(
            children: [
              IconButton.filledTonal(
                tooltip: 'Play phrase',
                onPressed: () {},
                icon: const Icon(Icons.volume_up),
              ),
              const SizedBox(width: 8),
              IconButton.filledTonal(
                tooltip: 'Record answer',
                onPressed: () {},
                icon: const Icon(Icons.mic),
              ),
              const Spacer(),
              Flexible(
                child: FilledButton.icon(
                  onPressed: onComplete,
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
}

class _SessionPanel extends StatelessWidget {
  const _SessionPanel({
    required this.progress,
    required this.activityIndex,
    required this.activityCount,
    required this.completedCount,
    required this.queuedCount,
    required this.onPrevious,
    required this.onNext,
  });

  final double progress;
  final int activityIndex;
  final int activityCount;
  final int completedCount;
  final int queuedCount;
  final VoidCallback? onPrevious;
  final VoidCallback? onNext;

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
