import 'package:flutter/material.dart';

import '../core/config/build_info.dart';

class HomeShell extends StatelessWidget {
  const HomeShell({
    required this.body,
    required this.selectedIndex,
    required this.onDestinationSelected,
    required this.profileName,
    required this.languageName,
    required this.environmentName,
    required this.floatingActionButton,
    super.key,
  });

  final Widget body;
  final int selectedIndex;
  final ValueChanged<int> onDestinationSelected;
  final String profileName;
  final String languageName;
  final String environmentName;
  final Widget floatingActionButton;

  @override
  Widget build(BuildContext context) {
    final width = MediaQuery.sizeOf(context).width;
    final useRail = width >= 900;

    return Scaffold(
      body: DecoratedBox(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [
              Color(0xFFF8FAFC),
              Color(0xFFEFF6F3),
              Color(0xFFF7F3EA),
            ],
          ),
        ),
        child: SafeArea(
          child: Row(
            children: [
              if (useRail)
                _NavigationRail(
                  selectedIndex: selectedIndex,
                  onDestinationSelected: onDestinationSelected,
                ),
              Expanded(
                child: Column(
                  children: [
                    _TopBar(
                      profileName: profileName,
                      languageName: languageName,
                      environmentName: environmentName,
                    ),
                    Expanded(
                      child: Center(
                        child: ConstrainedBox(
                          constraints: const BoxConstraints(maxWidth: 1040),
                          child: Padding(
                            padding: EdgeInsets.fromLTRB(
                              useRail ? 24 : 14,
                              8,
                              useRail ? 24 : 14,
                              useRail ? 24 : 12,
                            ),
                            child: body,
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
      bottomNavigationBar: useRail
          ? null
          : NavigationBar(
              selectedIndex: selectedIndex,
              onDestinationSelected: onDestinationSelected,
              destinations: _destinations,
            ),
      floatingActionButton: floatingActionButton,
    );
  }
}

class _TopBar extends StatelessWidget {
  const _TopBar({
    required this.profileName,
    required this.languageName,
    required this.environmentName,
  });

  final String profileName;
  final String languageName;
  final String environmentName;

  @override
  Widget build(BuildContext context) {
    final compact = MediaQuery.sizeOf(context).width < 520;
    final colorScheme = Theme.of(context).colorScheme;

    return Padding(
      padding: EdgeInsets.fromLTRB(compact ? 14 : 24, 14, compact ? 14 : 24, 8),
      child: Row(
        children: [
          Container(
            width: 42,
            height: 42,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(8),
              gradient: const LinearGradient(
                colors: [
                  Color(0xFF0EA5A4),
                  Color(0xFF2563EB),
                ],
              ),
              boxShadow: [
                BoxShadow(
                  color: const Color(0xFF0EA5A4).withValues(alpha: 0.28),
                  blurRadius: 18,
                  offset: const Offset(0, 8),
                ),
              ],
            ),
            child: const Icon(Icons.record_voice_over, color: Colors.white),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Text(
                      'BhashaVaani',
                      style: Theme.of(context).textTheme.titleMedium,
                    ),
                    const SizedBox(width: 8),
                    const _BuildBadge(),
                  ],
                ),
                const SizedBox(height: 2),
                Text(
                  '$profileName learns $languageName',
                  overflow: TextOverflow.ellipsis,
                  style: Theme.of(context).textTheme.labelMedium?.copyWith(
                        color: const Color(0xFF64748B),
                      ),
                ),
              ],
            ),
          ),
          if (!compact) ...[
            _ConnectionPill(label: environmentName),
            const SizedBox(width: 8),
          ],
          IconButton(
            tooltip: 'Sync',
            onPressed: () {},
            icon: Icon(Icons.sync, color: colorScheme.primary),
          ),
        ],
      ),
    );
  }
}

/// Small always-visible badge showing the running build's version and last
/// update time, so after a code change + restart + hard refresh you can
/// confirm the browser actually loaded the new build (rather than a stale
/// cached one) instead of guessing from UI behavior alone.
class _BuildBadge extends StatelessWidget {
  const _BuildBadge();

  @override
  Widget build(BuildContext context) {
    return Tooltip(
      message: 'BhashaVaani build ${BuildInfo.version}\n'
          'Updated ${BuildInfo.updatedAt}\n'
          '${BuildInfo.summary}',
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
        decoration: BoxDecoration(
          color: const Color(0xFF0F172A).withValues(alpha: 0.06),
          borderRadius: BorderRadius.circular(4),
        ),
        child: Text(
          'v${BuildInfo.version}',
          style: Theme.of(context).textTheme.labelSmall?.copyWith(
                color: const Color(0xFF64748B),
                fontWeight: FontWeight.w700,
              ),
        ),
      ),
    );
  }
}

class _ConnectionPill extends StatelessWidget {
  const _ConnectionPill({required this.label});

  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 7),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.75),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.white),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(Icons.cloud_done, size: 16, color: Color(0xFF0F766E)),
          const SizedBox(width: 6),
          Text(
            label,
            style: Theme.of(context).textTheme.labelMedium,
          ),
        ],
      ),
    );
  }
}

class _NavigationRail extends StatelessWidget {
  const _NavigationRail({
    required this.selectedIndex,
    required this.onDestinationSelected,
  });

  final int selectedIndex;
  final ValueChanged<int> onDestinationSelected;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 96,
      margin: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.70),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.white),
      ),
      child: NavigationRail(
        backgroundColor: Colors.transparent,
        selectedIndex: selectedIndex,
        onDestinationSelected: onDestinationSelected,
        labelType: NavigationRailLabelType.all,
        destinations: const [
          NavigationRailDestination(
            icon: Icon(Icons.family_restroom_outlined),
            selectedIcon: Icon(Icons.family_restroom),
            label: Text('Profiles'),
          ),
          NavigationRailDestination(
            icon: Icon(Icons.language_outlined),
            selectedIcon: Icon(Icons.language),
            label: Text('Languages'),
          ),
          NavigationRailDestination(
            icon: Icon(Icons.school_outlined),
            selectedIcon: Icon(Icons.school),
            label: Text('Lesson'),
          ),
          NavigationRailDestination(
            icon: Icon(Icons.bar_chart_outlined),
            selectedIcon: Icon(Icons.bar_chart),
            label: Text('Progress'),
          ),
          NavigationRailDestination(
            icon: Icon(Icons.map_outlined),
            selectedIcon: Icon(Icons.map),
            label: Text('Roadmap'),
          ),
        ],
      ),
    );
  }
}

const _destinations = [
  NavigationDestination(
    icon: Icon(Icons.family_restroom_outlined),
    selectedIcon: Icon(Icons.family_restroom),
    label: 'Profiles',
  ),
  NavigationDestination(
    icon: Icon(Icons.language_outlined),
    selectedIcon: Icon(Icons.language),
    label: 'Languages',
  ),
  NavigationDestination(
    icon: Icon(Icons.school_outlined),
    selectedIcon: Icon(Icons.school),
    label: 'Lesson',
  ),
  NavigationDestination(
    icon: Icon(Icons.bar_chart_outlined),
    selectedIcon: Icon(Icons.bar_chart),
    label: 'Progress',
  ),
  NavigationDestination(
    icon: Icon(Icons.map_outlined),
    selectedIcon: Icon(Icons.map),
    label: 'Roadmap',
  ),
];
