import 'package:flutter/material.dart';

import '../../../app/app_load_state.dart';
import '../../../app/ui/glossy_panel.dart';
import '../../../app/ui/screen_header.dart';
import '../../../app/ui/state_panels.dart';
import '../../../app/ui/status_badge.dart';
import '../domain/progress_summary.dart';

class ProgressScreen extends StatelessWidget {
  const ProgressScreen({
    required this.summary,
    required this.loadState,
    required this.queuedEventCount,
    required this.onRetry,
    super.key,
  });

  final ProgressSummary summary;
  final AppLoadState loadState;
  final int queuedEventCount;
  final VoidCallback onRetry;

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
        Expanded(
          child: LayoutBuilder(
            builder: (context, constraints) {
              final crossAxisCount = constraints.maxWidth >= 820 ? 4 : 2;

              return GridView.count(
                crossAxisCount: crossAxisCount,
                mainAxisSpacing: 12,
                crossAxisSpacing: 12,
                childAspectRatio: constraints.maxWidth >= 820 ? 1.05 : 1.18,
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
        ),
      ],
    );
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
