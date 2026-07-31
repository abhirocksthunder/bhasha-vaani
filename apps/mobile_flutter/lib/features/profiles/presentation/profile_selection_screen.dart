import 'package:flutter/material.dart';

import '../../../app/app_load_state.dart';
import '../../../app/ui/glossy_panel.dart';
import '../../../app/ui/screen_header.dart';
import '../../../app/ui/state_panels.dart';
import '../../../app/ui/status_badge.dart';
import '../domain/learner_profile.dart';

class ProfileSelectionScreen extends StatelessWidget {
  const ProfileSelectionScreen({
    required this.profiles,
    required this.selectedProfile,
    required this.loadState,
    required this.onRetry,
    required this.onProfileSelected,
    required this.onProfileEdited,
    super.key,
  });

  final List<LearnerProfile> profiles;
  final LearnerProfile? selectedProfile;
  final AppLoadState loadState;
  final VoidCallback onRetry;
  final ValueChanged<LearnerProfile> onProfileSelected;
  final ValueChanged<LearnerProfile> onProfileEdited;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        ScreenHeader(
          eyebrow: 'Family profiles',
          title: 'Who is learning today?',
          subtitle: 'Pick a learner to keep lessons, reviews, and progress separate across web, mobile, and voice clients.',
          trailing: StatusBadge(
            icon: loadState.isFallback ? Icons.wifi_off : Icons.lock_outline,
            label: loadState.message,
            emphasis: loadState.isFallback
                ? BadgeEmphasis.warning
                : BadgeEmphasis.success,
          ),
        ),
        const SizedBox(height: 16),
        if (loadState.isLoading) ...[
          const LoadingPanel(
            title: 'Loading family profiles',
            message: 'Checking the local backend before falling back to seed data.',
          ),
          const SizedBox(height: 12),
        ] else if (loadState.isFallback) ...[
          ErrorStatePanel(
            title: 'Backend is not reachable',
            message: 'You can keep exploring with seed profiles. Retry when the local API is back on port 6001.',
            onRetry: onRetry,
          ),
          const SizedBox(height: 12),
        ],
        Expanded(
          child: profiles.isEmpty
              ? const EmptyStatePanel(
                  icon: Icons.family_restroom,
                  title: 'No profiles yet',
                  message: 'Create an adult or child profile to start learning.',
                )
              : LayoutBuilder(
            builder: (context, constraints) {
              final useGrid = constraints.maxWidth >= 720;

              if (!useGrid) {
                return ListView.separated(
                  itemCount: profiles.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 12),
                  itemBuilder: (context, index) => _ProfileTile(
                    profile: profiles[index],
                    selected: profiles[index].id == selectedProfile?.id,
                    onTap: () => onProfileSelected(profiles[index]),
                    onEdit: () => _showEditProfileSheet(context, profiles[index]),
                  ),
                );
              }

              return GridView.builder(
                itemCount: profiles.length,
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 2,
                  mainAxisSpacing: 12,
                  crossAxisSpacing: 12,
                  childAspectRatio: 2.35,
                ),
                itemBuilder: (context, index) => _ProfileTile(
                  profile: profiles[index],
                  selected: profiles[index].id == selectedProfile?.id,
                  onTap: () => onProfileSelected(profiles[index]),
                  onEdit: () => _showEditProfileSheet(context, profiles[index]),
                ),
              );
            },
          ),
        ),
      ],
    );
  }

  Future<void> _showEditProfileSheet(
    BuildContext context,
    LearnerProfile profile,
  ) async {
    final nameController = TextEditingController(text: profile.displayName);
    final explanationController = TextEditingController(
      text: profile.explanationLanguage,
    );
    final minutesController = TextEditingController(
      text: profile.sessionMinutes.toString(),
    );

    final editedProfile = await showModalBottomSheet<LearnerProfile>(
      context: context,
      isScrollControlled: true,
      builder: (context) {
        return Padding(
          padding: EdgeInsets.fromLTRB(
            16,
            16,
            16,
            MediaQuery.viewInsetsOf(context).bottom + 16,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Edit profile', style: Theme.of(context).textTheme.titleLarge),
              const SizedBox(height: 14),
              TextField(
                controller: nameController,
                decoration: const InputDecoration(labelText: 'Display name'),
              ),
              const SizedBox(height: 10),
              TextField(
                controller: explanationController,
                decoration: const InputDecoration(labelText: 'Explanation language'),
              ),
              const SizedBox(height: 10),
              TextField(
                controller: minutesController,
                keyboardType: TextInputType.number,
                decoration: const InputDecoration(labelText: 'Session minutes'),
              ),
              const SizedBox(height: 16),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () => Navigator.of(context).pop(),
                      child: const Text('Cancel'),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: FilledButton.icon(
                      onPressed: () {
                        Navigator.of(context).pop(
                          profile.copyWith(
                            displayName: nameController.text.trim().isEmpty
                                ? profile.displayName
                                : nameController.text.trim(),
                            explanationLanguage: explanationController.text.trim().isEmpty
                                ? profile.explanationLanguage
                                : explanationController.text.trim(),
                            sessionMinutes: int.tryParse(minutesController.text.trim()) ??
                                profile.sessionMinutes,
                          ),
                        );
                      },
                      icon: const Icon(Icons.save),
                      label: const Text('Save'),
                    ),
                  ),
                ],
              ),
            ],
          ),
        );
      },
    );

    nameController.dispose();
    explanationController.dispose();
    minutesController.dispose();

    if (editedProfile != null) {
      onProfileEdited(editedProfile);
    }
  }
}

class _ProfileTile extends StatelessWidget {
  const _ProfileTile({
    required this.profile,
    required this.selected,
    required this.onTap,
    required this.onEdit,
  });

  final LearnerProfile profile;
  final bool selected;
  final VoidCallback onTap;
  final VoidCallback onEdit;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    return GlossyPanel(
      selected: selected,
      child: Row(
        children: [
          Container(
            width: 54,
            height: 54,
            decoration: BoxDecoration(
              color: profile.isChild
                  ? const Color(0xFFFFEDD5)
                  : colorScheme.primary.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(
              profile.isChild ? Icons.child_care : Icons.person_outline,
              color: profile.isChild ? const Color(0xFFC2410C) : colorScheme.primary,
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  profile.displayName,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: Theme.of(context).textTheme.titleMedium,
                ),
                const SizedBox(height: 6),
                Text(
                  '${profile.typeLabel}, ${profile.ageGroup}, ${profile.sessionMinutes} min',
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 8),
                StatusBadge(
                  icon: Icons.translate,
                  label: profile.explanationLanguage,
                  emphasis: profile.isChild ? BadgeEmphasis.warning : BadgeEmphasis.primary,
                ),
              ],
            ),
          ),
          const SizedBox(width: 8),
          Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              IconButton(
                tooltip: selected ? 'Selected profile' : 'Select profile',
                onPressed: onTap,
                icon: Icon(
                  selected ? Icons.check_circle : Icons.circle_outlined,
                  color: selected ? colorScheme.primary : const Color(0xFF94A3B8),
                ),
              ),
              IconButton(
                tooltip: 'Edit profile',
                onPressed: onEdit,
                icon: const Icon(Icons.edit_outlined),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
