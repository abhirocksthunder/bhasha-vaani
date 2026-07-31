import 'package:flutter/material.dart';

import '../../../app/ui/glossy_panel.dart';
import '../../../app/ui/status_badge.dart';
import '../../../core/api/api_client.dart';
import '../../language_selection/domain/language_pack.dart';
import '../../profiles/domain/learner_profile.dart';

class TutorPetButton extends StatelessWidget {
  const TutorPetButton({
    required this.apiClient,
    required this.selectedProfile,
    required this.languages,
    required this.selectedLanguage,
    super.key,
  });

  final ApiClient apiClient;
  final LearnerProfile? selectedProfile;
  final List<LanguagePack> languages;
  final LanguagePack? selectedLanguage;

  @override
  Widget build(BuildContext context) {
    return FloatingActionButton.extended(
      tooltip: 'Ask tutor pet',
      onPressed: () => _showTutorSheet(context),
      icon: const Icon(Icons.pets),
      label: const Text('Ask'),
    );
  }

  Future<void> _showTutorSheet(BuildContext context) async {
    await showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) {
        return _TutorPetSheet(
          apiClient: apiClient,
          selectedProfile: selectedProfile,
          languages: languages,
          selectedLanguage: selectedLanguage,
        );
      },
    );
  }
}

class _TutorPetSheet extends StatefulWidget {
  const _TutorPetSheet({
    required this.apiClient,
    required this.selectedProfile,
    required this.languages,
    required this.selectedLanguage,
  });

  final ApiClient apiClient;
  final LearnerProfile? selectedProfile;
  final List<LanguagePack> languages;
  final LanguagePack? selectedLanguage;

  @override
  State<_TutorPetSheet> createState() => _TutorPetSheetState();
}

class _TutorPetSheetState extends State<_TutorPetSheet> {
  final wordController = TextEditingController();
  late LanguagePack? selectedLanguage = widget.selectedLanguage ??
      (widget.languages.isEmpty ? null : widget.languages.first);
  String selectedProvider = 'local_ollama';
  String? selectedOllamaModel;
  List<OllamaModel> ollamaModels = const [];
  String? answer;
  bool loading = false;
  bool loadingModels = false;

  @override
  void initState() {
    super.initState();
    _loadOllamaModels();
  }

  @override
  void dispose() {
    wordController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.fromLTRB(
        12,
        12,
        12,
        MediaQuery.viewInsetsOf(context).bottom + 12,
      ),
      child: GlossyPanel(
        padding: const EdgeInsets.all(18),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  width: 44,
                  height: 44,
                  decoration: BoxDecoration(
                    color: Theme.of(context).colorScheme.primary.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Icon(
                    Icons.pets,
                    color: Theme.of(context).colorScheme.primary,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Tutor pet',
                        style: Theme.of(context).textTheme.titleLarge,
                      ),
                      const SizedBox(height: 4),
                      const Text('Ask any word or phrase.'),
                    ],
                  ),
                ),
                IconButton(
                  tooltip: 'Close',
                  onPressed: () => Navigator.of(context).pop(),
                  icon: const Icon(Icons.close),
                ),
              ],
            ),
            const SizedBox(height: 14),
            TextField(
              controller: wordController,
              decoration: const InputDecoration(
                labelText: 'Word or phrase',
                hintText: 'Example: water',
              ),
              textInputAction: TextInputAction.done,
              onSubmitted: (_) => _ask(),
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: DropdownButtonFormField<LanguagePack>(
                    initialValue: selectedLanguage,
                    items: [
                      for (final language in widget.languages)
                        DropdownMenuItem(
                          value: language,
                          child: Text(language.name),
                        ),
                    ],
                    onChanged: (language) {
                      setState(() => selectedLanguage = language);
                    },
                    decoration: const InputDecoration(labelText: 'Language'),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: DropdownButtonFormField<String>(
                    initialValue: selectedProvider,
                    items: const [
                      DropdownMenuItem(
                        value: 'local_ollama',
                        child: Text('Local Ollama'),
                      ),
                      DropdownMenuItem(
                        value: 'local_lmstudio',
                        child: Text('Local LM Studio'),
                      ),
                      DropdownMenuItem(
                        value: 'frontier_later',
                        child: Text('Frontier later'),
                      ),
                    ],
                    onChanged: (provider) {
                      if (provider != null) {
                        setState(() => selectedProvider = provider);
                      }
                    },
                    decoration: const InputDecoration(labelText: 'Provider'),
                  ),
                ),
              ],
            ),
            if (selectedProvider == 'local_ollama') ...[
              const SizedBox(height: 12),
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
                onChanged: (model) {
                  setState(() => selectedOllamaModel = model);
                },
                decoration: InputDecoration(
                  labelText: 'Ollama model',
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
                          tooltip: 'Refresh models',
                          onPressed: _loadOllamaModels,
                          icon: const Icon(Icons.refresh),
                        ),
                ),
              ),
            ],
            const SizedBox(height: 14),
            Row(
              children: [
                const StatusBadge(
                  icon: Icons.route,
                  label: 'Provider gateway',
                  emphasis: BadgeEmphasis.primary,
                ),
                const Spacer(),
                FilledButton.icon(
                  onPressed: loading ? null : _ask,
                  icon: loading
                      ? const SizedBox(
                          width: 16,
                          height: 16,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : const Icon(Icons.send),
                  label: const Text('Ask'),
                ),
              ],
            ),
            if (answer != null) ...[
              const SizedBox(height: 14),
              GlossyPanel(
                child: Text(answer!),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Future<void> _ask() async {
    final language = selectedLanguage;
    final word = wordController.text.trim();
    if (language == null || word.isEmpty) {
      return;
    }

    setState(() {
      loading = true;
      answer = null;
    });

    try {
      final response = await widget.apiClient.postMap(
        '/assistant/word',
        {
          'word': word,
          'language_code': language.code,
          'explanation_language': widget.selectedProfile?.explanationLanguage ?? 'English',
          'model': selectedProvider == 'local_ollama' && selectedOllamaModel != null
              ? 'ollama:$selectedOllamaModel'
              : selectedProvider,
        },
      );
      setState(() {
        answer = response['answer'] as String? ?? 'No answer returned.';
      });
    } catch (error) {
      setState(() {
        answer = 'I could not reach the tutor backend. Try again when port 6001 is running.';
      });
    } finally {
      if (mounted) {
        setState(() => loading = false);
      }
    }
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
}

class OllamaModel {
  const OllamaModel({
    required this.name,
    required this.parameterSize,
    required this.family,
  });

  final String name;
  final String parameterSize;
  final String family;

  String get label {
    final parts = [
      name,
      if (parameterSize.isNotEmpty) parameterSize,
      if (family.isNotEmpty) family,
    ];
    return parts.join(' - ');
  }

  factory OllamaModel.fromJson(Map<String, dynamic> json) {
    return OllamaModel(
      name: json['name'] as String? ?? '',
      parameterSize: json['parameter_size'] as String? ?? '',
      family: json['family'] as String? ?? '',
    );
  }
}
