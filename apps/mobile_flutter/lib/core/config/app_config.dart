class AppConfig {
  const AppConfig({
    required this.apiBaseUrl,
    required this.environmentName,
  });

  factory AppConfig.fromEnvironment() {
    const apiBaseUrl = String.fromEnvironment(
      'BHASHAVAANI_API_URL',
      defaultValue: 'http://localhost:6001',
    );
    const environmentName = String.fromEnvironment(
      'BHASHAVAANI_ENV',
      defaultValue: 'local',
    );

    return const AppConfig(
      apiBaseUrl: apiBaseUrl,
      environmentName: environmentName,
    );
  }

  final String apiBaseUrl;
  final String environmentName;

  bool get isRemote => environmentName != 'local';
}
