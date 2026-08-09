// Mirrors apps/mobile_flutter/lib/core/config/build_info.dart.
//
// Shown in the app's top bar so you can tell, after a rebuild + reload,
// whether the browser actually picked up the latest build. Bump `version`
// and `updatedAt` on every code change that touches this app, per the
// workflow in CLAUDE.md (same reasoning as the Flutter build badge: Vite's
// dev server hot-reloads fine, but a `vite build` + static-serve deployment
// can still be masked by browser caching, and this badge makes that
// visible instead of guessing from UI behavior).
export const BuildInfo = {
  version: '0.5.1',
  updatedAt: '2026-08-02 07:00 IST',
  summary: 'Fixed "Completed" count being cross-language and duplicate-inflated, which was making Kannada (or other languages) show no phrases left -- Progress tab now scopes to the selected language',
} as const;
