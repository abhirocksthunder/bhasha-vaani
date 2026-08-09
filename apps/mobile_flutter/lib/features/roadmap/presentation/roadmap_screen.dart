import 'package:flutter/material.dart';

import '../../../app/ui/glossy_panel.dart';
import '../../../app/ui/screen_header.dart';
import '../../../app/ui/status_badge.dart';
import '../domain/roadmap_stage.dart';

class RoadmapScreen extends StatelessWidget {
  const RoadmapScreen({
    this.stages = bhashaVaaniRoadmap,
    super.key,
  });

  final List<RoadmapStage> stages;

  @override
  Widget build(BuildContext context) {
    final completedStages =
        stages.where((stage) => stage.status == RoadmapStatus.completed).length;

    return SingleChildScrollView(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          ScreenHeader(
            eyebrow: 'Build plan',
            title: 'Roadmap',
            subtitle:
                'History-aware lessons, two-bot scenario conversations, and a '
                'personalized voice tutor — staged on top of what already works.',
            trailing: StatusBadge(
              icon: Icons.flag_circle_outlined,
              label: '$completedStages of ${stages.length} stages complete',
              emphasis: BadgeEmphasis.neutral,
            ),
          ),
          const SizedBox(height: 16),
          for (final stage in stages) ...[
            _RoadmapStageCard(stage: stage),
            const SizedBox(height: 12),
          ],
        ],
      ),
    );
  }
}

class _RoadmapStageCard extends StatelessWidget {
  const _RoadmapStageCard({required this.stage});

  final RoadmapStage stage;

  @override
  Widget build(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;

    return GlossyPanel(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Text(stage.title, style: textTheme.titleMedium),
              ),
              const SizedBox(width: 8),
              _StageStatusBadge(status: stage.status),
            ],
          ),
          const SizedBox(height: 6),
          Text(
            stage.goal,
            style: textTheme.bodyMedium?.copyWith(
              color: const Color(0xFF475569),
              height: 1.35,
            ),
          ),
          const SizedBox(height: 12),
          for (final step in stage.steps) _RoadmapStepRow(step: step),
        ],
      ),
    );
  }
}

class _RoadmapStepRow extends StatelessWidget {
  const _RoadmapStepRow({required this.step});

  final RoadmapStep step;

  @override
  Widget build(BuildContext context) {
    final done = step.status == RoadmapStatus.completed;
    final inProgress = step.status == RoadmapStatus.inProgress;
    final color = done
        ? const Color(0xFF047857)
        : inProgress
            ? const Color(0xFFB45309)
            : const Color(0xFF94A3B8);
    final icon = done
        ? Icons.check_circle
        : inProgress
            ? Icons.autorenew
            : Icons.radio_button_unchecked;

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 18, color: color),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              step.title,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: done ? const Color(0xFF334155) : const Color(0xFF475569),
                    decoration: done ? TextDecoration.lineThrough : null,
                    decorationColor: const Color(0xFF94A3B8),
                  ),
            ),
          ),
        ],
      ),
    );
  }
}

class _StageStatusBadge extends StatelessWidget {
  const _StageStatusBadge({required this.status});

  final RoadmapStatus status;

  @override
  Widget build(BuildContext context) {
    return switch (status) {
      RoadmapStatus.completed => const StatusBadge(
          icon: Icons.check_circle,
          label: 'Completed',
          emphasis: BadgeEmphasis.success,
        ),
      RoadmapStatus.inProgress => const StatusBadge(
          icon: Icons.autorenew,
          label: 'In progress',
          emphasis: BadgeEmphasis.warning,
        ),
      RoadmapStatus.planned => const StatusBadge(
          icon: Icons.radio_button_unchecked,
          label: 'Planned',
          emphasis: BadgeEmphasis.neutral,
        ),
    };
  }
}
