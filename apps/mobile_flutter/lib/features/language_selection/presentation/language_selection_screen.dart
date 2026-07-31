import 'package:flutter/material.dart';

import '../../../app/app_load_state.dart';
import '../../../app/ui/glossy_panel.dart';
import '../../../app/ui/screen_header.dart';
import '../../../app/ui/state_panels.dart';
import '../../../app/ui/status_badge.dart';
import '../domain/language_pack.dart';

class LanguageSelectionScreen extends StatelessWidget {
  const LanguageSelectionScreen({
    required this.languages,
    required this.selectedLanguage,
    required this.loadState,
    required this.onRetry,
    required this.onLanguageSelected,
    super.key,
  });

  final List<LanguagePack> languages;
  final LanguagePack? selectedLanguage;
  final AppLoadState loadState;
  final VoidCallback onRetry;
  final ValueChanged<LanguagePack> onLanguageSelected;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        ScreenHeader(
          eyebrow: 'Language packs',
          title: 'Choose the learning path',
          subtitle: 'Capabilities are shown honestly so lessons can adapt to text, audio, pronunciation, and beta support.',
          trailing: StatusBadge(
            icon: loadState.isFallback ? Icons.wifi_off : Icons.extension,
            label: loadState.isFallback ? 'Seed packs' : 'Pack based',
            emphasis: loadState.isFallback
                ? BadgeEmphasis.warning
                : BadgeEmphasis.primary,
          ),
        ),
        const SizedBox(height: 16),
        GlossyPanel(
          child: Wrap(
            spacing: 8,
            runSpacing: 8,
            crossAxisAlignment: WrapCrossAlignment.center,
            children: [
              const StatusBadge(
                icon: Icons.fact_check,
                label: 'Manifest registry',
                emphasis: BadgeEmphasis.success,
              ),
              StatusBadge(
                icon: Icons.library_books,
                label: '${languages.length} packs',
                emphasis: BadgeEmphasis.primary,
              ),
              const StatusBadge(
                icon: Icons.update,
                label: 'Updated now',
                emphasis: BadgeEmphasis.neutral,
              ),
            ],
          ),
        ),
        const SizedBox(height: 12),
        if (loadState.isLoading) ...[
          const LoadingPanel(
            title: 'Loading language packs',
            message: 'Reading capability data from the local backend.',
          ),
          const SizedBox(height: 12),
        ] else if (loadState.isFallback) ...[
          ErrorStatePanel(
            title: 'Using local seed packs',
            message: 'The backend did not respond, so Kannada and Hindi seed packs remain available.',
            onRetry: onRetry,
          ),
          const SizedBox(height: 12),
        ],
        Expanded(
          child: languages.isEmpty
              ? const EmptyStatePanel(
                  icon: Icons.language,
                  title: 'No language packs',
                  message: 'Add a language pack manifest before starting lessons.',
                )
              : ListView.separated(
            itemCount: languages.length,
            separatorBuilder: (_, __) => const SizedBox(height: 12),
            itemBuilder: (context, index) {
              final language = languages[index];
              final selected = language.code == selectedLanguage?.code;

              return GlossyPanel(
                selected: selected,
                onTap: () => onLanguageSelected(language),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Container(
                          width: 48,
                          height: 48,
                          alignment: Alignment.center,
                          decoration: BoxDecoration(
                            color: const Color(0xFFE0F2FE),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Text(
                            language.code.toUpperCase(),
                            style: Theme.of(context).textTheme.titleMedium?.copyWith(
                                  color: const Color(0xFF0369A1),
                                ),
                          ),
                        ),
                        const SizedBox(width: 14),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                language.name,
                                style: Theme.of(context).textTheme.titleLarge,
                              ),
                              const SizedBox(height: 4),
                              Text(language.nativeName),
                            ],
                          ),
                        ),
                        StatusBadge(
                          label: language.statusLabel,
                          emphasis: _statusEmphasis(language.status),
                        ),
                        const SizedBox(width: 8),
                        Icon(
                          selected ? Icons.check_circle : Icons.circle_outlined,
                          color: selected
                              ? Theme.of(context).colorScheme.primary
                              : const Color(0xFF94A3B8),
                        ),
                      ],
                    ),
                    const SizedBox(height: 14),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: [
                        _CapabilityBadge(
                          icon: Icons.translate,
                          label: 'Transliteration',
                          enabled: language.transliteration,
                        ),
                        _CapabilityBadge(
                          icon: Icons.mic,
                          label: 'STT',
                          enabled: language.speechToText,
                        ),
                        _CapabilityBadge(
                          icon: Icons.volume_up,
                          label: 'TTS',
                          enabled: language.textToSpeech,
                        ),
                        _CapabilityBadge(
                          icon: Icons.record_voice_over,
                          label: language.pronunciation,
                          enabled: language.pronunciation != 'Later',
                        ),
                      ],
                    ),
                  ],
                ),
              );
            },
          ),
        ),
      ],
    );
  }
}

BadgeEmphasis _statusEmphasis(LanguageSupportStatus status) {
  return switch (status) {
    LanguageSupportStatus.full => BadgeEmphasis.success,
    LanguageSupportStatus.beta => BadgeEmphasis.primary,
    LanguageSupportStatus.preview => BadgeEmphasis.warning,
    LanguageSupportStatus.planned => BadgeEmphasis.neutral,
  };
}

class _CapabilityBadge extends StatelessWidget {
  const _CapabilityBadge({
    required this.icon,
    required this.label,
    required this.enabled,
  });

  final IconData icon;
  final String label;
  final bool enabled;

  @override
  Widget build(BuildContext context) {
    return StatusBadge(
      icon: icon,
      label: label,
      emphasis: enabled ? BadgeEmphasis.primary : BadgeEmphasis.neutral,
    );
  }
}
