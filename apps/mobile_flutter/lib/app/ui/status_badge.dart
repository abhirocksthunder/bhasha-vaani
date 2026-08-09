import 'package:flutter/material.dart';

class StatusBadge extends StatelessWidget {
  const StatusBadge({
    required this.label,
    this.icon,
    this.emphasis = BadgeEmphasis.primary,
    super.key,
  });

  final String label;
  final IconData? icon;
  final BadgeEmphasis emphasis;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final colors = switch (emphasis) {
      BadgeEmphasis.primary => (
          foreground: colorScheme.primary,
          background: colorScheme.primary.withValues(alpha: 0.10),
          border: colorScheme.primary.withValues(alpha: 0.22),
        ),
      BadgeEmphasis.success => (
          foreground: const Color(0xFF047857),
          background: const Color(0xFFDCFCE7),
          border: const Color(0xFF86EFAC),
        ),
      BadgeEmphasis.warning => (
          foreground: const Color(0xFFB45309),
          background: const Color(0xFFFEF3C7),
          border: const Color(0xFFFCD34D),
        ),
      BadgeEmphasis.neutral => (
          foreground: const Color(0xFF475569),
          background: const Color(0xFFF1F5F9),
          border: const Color(0xFFE2E8F0),
        ),
    };

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 7),
      decoration: BoxDecoration(
        color: colors.background,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: colors.border),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (icon != null) ...[
            Icon(icon, size: 16, color: colors.foreground),
            const SizedBox(width: 6),
          ],
          Flexible(
            // Long messages (e.g. lesson-generation failure diagnostics)
            // were getting visually clipped by the parent panel instead of
            // wrapping, because Text had no width constraint inside a
            // mainAxisSize.min Row. Flexible + softWrap lets long text wrap
            // onto multiple lines instead of overflowing/clipping.
            child: Text(
              label,
              softWrap: true,
              style: Theme.of(context).textTheme.labelMedium?.copyWith(
                    color: colors.foreground,
                    fontWeight: FontWeight.w800,
                  ),
            ),
          ),
        ],
      ),
    );
  }
}

enum BadgeEmphasis {
  primary,
  success,
  warning,
  neutral,
}
