// Mirrors apps/mobile_flutter/lib/core/config/app_config.dart.
// Vite exposes build-time env vars prefixed with VITE_ via import.meta.env;
// set VITE_BHASHAVAANI_API_URL / VITE_BHASHAVAANI_ENV in a .env file to
// override for a given build, same idea as Flutter's --dart-define.
export interface AppConfig {
  apiBaseUrl: string;
  environmentName: string;
}

export function loadAppConfig(): AppConfig {
  const apiBaseUrl =
    (import.meta.env.VITE_BHASHAVAANI_API_URL as string | undefined) ??
    'http://127.0.0.1:6001';
  const environmentName =
    (import.meta.env.VITE_BHASHAVAANI_ENV as string | undefined) ?? 'local';

  return { apiBaseUrl, environmentName };
}

export function isRemote(config: AppConfig): boolean {
  return config.environmentName !== 'local';
}
