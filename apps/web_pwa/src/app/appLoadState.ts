// Mirrors apps/mobile_flutter/lib/app/app_load_state.dart.
export type AppLoadStatus = 'loading' | 'connected' | 'fallback';

export interface AppLoadState {
  status: AppLoadStatus;
  message: string;
  details?: string;
}

export const loadingState: AppLoadState = {
  status: 'loading',
  message: 'Connecting to local backend',
};

export const connectedState: AppLoadState = {
  status: 'connected',
  message: 'Backend connected',
};

export function fallbackState(details?: string): AppLoadState {
  return { status: 'fallback', message: 'Offline seed mode', details };
}

export function isLoading(state: AppLoadState): boolean {
  return state.status === 'loading';
}

export function isFallback(state: AppLoadState): boolean {
  return state.status === 'fallback';
}
