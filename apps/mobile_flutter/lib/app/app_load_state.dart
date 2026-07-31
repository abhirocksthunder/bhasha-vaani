enum AppLoadStatus {
  loading,
  connected,
  fallback,
}

class AppLoadState {
  const AppLoadState({
    required this.status,
    required this.message,
    this.details,
  });

  const AppLoadState.loading()
      : status = AppLoadStatus.loading,
        message = 'Connecting to local backend',
        details = null;

  const AppLoadState.connected()
      : status = AppLoadStatus.connected,
        message = 'Backend connected',
        details = null;

  const AppLoadState.fallback([this.details])
      : status = AppLoadStatus.fallback,
        message = 'Offline seed mode';

  final AppLoadStatus status;
  final String message;
  final String? details;

  bool get isLoading => status == AppLoadStatus.loading;
  bool get isFallback => status == AppLoadStatus.fallback;
}
