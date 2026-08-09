import 'package:flutter/material.dart';

import '../../../app/app_load_state.dart';
import '../../../app/ui/glossy_panel.dart';
import '../../../app/ui/screen_header.dart';
import '../../../app/ui/state_panels.dart';
import '../../../app/ui/status_badge.dart';
import '../domain/learned_word.dart';
import '../domain/progress_summary.dart';

class ProgressScreen extends StatelessWidget {
  const ProgressScreen({
    required this.summary,
    required this.loadState,
    required this.queuedEventCount,
    required this.onRetry,
    this.learnedWords = const [],
    this.loadingLearnedWords = false,
    super.key,
  });

  final ProgressSummary summary;
  final AppLoadState loadState;
  final int queuedEventCount;
  final VoidCallback onRetry;
  final List<LearnedWord> learnedWords;
  final bool loadingLearnedWords;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        ScreenHeader(
          eyebrow: 'Shared progress',
          title: '${summary.profileName} in ${summary.languageName}',
          subtitle: 'Progress will come from append-only events so web, mobile, and Alexa can resume the same learner state.',
          trailing: StatusBadge(
            icon: loadState.isFallback ? Icons.cloud_off : Icons.sync_lock,
            label: loadState.isFallback ? 'Cached view' : 'Server truth',
            emphasis: loadState.isFallback
                ? BadgeEmphasis.warning
                : BadgeEmphasis.success,
          ),
        ),
        const SizedBox(height: 16),
        if (loadState.isLoading) ...[
          const LoadingPanel(
            title: 'Refreshing progress',
            message: 'Rebuilding the current projection from the backend.',
          ),
          const SizedBox(height: 12),
        ] else if (loadState.isFallback) ...[
          ErrorStatePanel(
            title: 'Showing last available progress',
            message: 'The local backend is unreachable. Your next completed activity will be queued for sync.',
            onRetry: onRetry,
          ),
          const SizedBox(height: 12),
        ],
        LayoutBuilder(
          builder: (context, constraints) {
            final crossAxisCount = constraints.maxWidth >= 820 ? 4 : 2;

            return GridView.count(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              crossAxisCount: crossAxisCount,
              mainAxisSpacing: 12,
              crossAxisSpacing: 12,
              childAspectRatio: constraints.maxWidth >= 820 ? 1.6 : 1.18,
              children: [
                _ProgressTile(
                  icon: Icons.school,
                  title: 'Current lesson',
                  value: summary.currentLesson,
                  color: const Color(0xFF2563EB),
                ),
                _ProgressTile(
                  icon: Icons.task_alt,
                  title: 'Completed',
                  value: summary.completedActivities.toString(),
                  color: const Color(0xFF0F766E),
                ),
                _ProgressTile(
                  icon: Icons.reviews,
                  title: 'Reviews',
                  value: summary.pendingReviews.toString(),
                  color: const Color(0xFFB45309),
                ),
                _ProgressTile(
                  icon: Icons.sync,
                  title: 'Sync',
                  value: queuedEventCount > 0
                      ? '$queuedEventCount queued'
                      : summary.syncState,
                  color: const Color(0xFF7C3AED),
                ),
              ],
            );
          },
        ),
        const SizedBox(height: 16),
        Text(
          'Learned words',
          style: Theme.of(context).textTheme.titleMedium,
        ),
        const SizedBox(height: 8),
        Expanded(
          child: _LearnedWordsList(
            words: learnedWords,
            loading: loadingLearnedWords,
          ),
        ),
      ],
    );
  }
}

class _LearnedWordsList extends StatelessWidget {
  const _LearnedWordsList({
    required this.words,
    required this.loading,
  });

  final List<LearnedWord> words;
  final bool loading;

  @override
  Widget build(BuildContext context) {
    if (loading && words.isEmpty) {
      return const LoadingPanel(
        title: 'Loading history',
        message: 'Fetching completed words from the backend.',
      );
    }

    if (words.isEmpty) {
      return const EmptyStatePanel(
        icon: Icons.menu_book,
        title: 'No words learned yet',
        message: 'Complete an activity in the Lesson tab and it will show up here.',
      );
    }

    return ListView.separated(
      itemCount: words.length,
      separatorBuilder: (_, __) => const SizedBox(height: 8),
      itemBuilder: (context, index) => _LearnedWordTile(word: words[index]),
    );
  }
}

class _LearnedWordTile extends StatelessWidget {
  const _LearnedWordTile({required this.word});

  final LearnedWord word;

  @override
  Widget build(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;
    final completedAt = word.completedAtLocal;

    return GlossyPanel(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  word.nativeScript,
                  style: textTheme.titleMedium,
                ),
                const SizedBox(height: 2),
                Text(
                  '${word.phrase} · ${word.meaning}',
                  overflow: TextOverflow.ellipsis,
                  style: textTheme.bodySmall?.copyWith(
                    color: const Color(0xFF64748B),
                  ),
                ),
              ],
            ),
          ),
          if (completedAt != null)
            Text(
              _formatDate(completedAt),
              style: textTheme.labelSmall?.copyWith(
                color: const Color(0xFF94A3B8),
              ),
            ),
        ],
      ),
    );
  }

  String _formatDate(DateTime date) {
    final now = DateTime.now();
    final isToday = date.year == now.year && date.month == now.month && date.day == now.day;
    if (isToday) {
      final hour = date.hour.toString().padLeft(2, '0');
      final minute = date.minute.toString().padLeft(2, '0');
      return 'Today $hour:$minute';
    }
    return '${date.year}-${date.month.toString().padLeft(2, '0')}-${date.day.toString().padLeft(2, '0')}';
  }
}

class _ProgressTile extends StatelessWidget {
  const _ProgressTile({
    required this.icon,
    required this.title,
    required this.value,
    required this.color,
  });

  final IconData icon;
  final String title;
  final String value;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return GlossyPanel(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 42,
            height: 42,
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(icon, color: color),
          ),
          const Spacer(),
          Text(
            title,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: Theme.of(context).textTheme.labelLarge,
          ),
          const SizedBox(height: 6),
          Text(
            value,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
            style: Theme.of(context).textTheme.titleLarge,
          ),
        ],
      ),
    );
  }
}
