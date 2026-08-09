/// Shown in the app's top bar so you can tell, after a restart + hard
/// refresh, whether the browser actually picked up the latest build.
///
/// Bump [version] and [updatedAt] on every code change that touches the
/// Flutter app, per the workflow in CLAUDE.md. If the badge in the UI still
/// shows the old version/time after a hard refresh, the frontend has not
/// rebuilt yet -- rerun `Start BhashaVaani.cmd` (which now does a full
/// `flutter build web --wasm`) rather than refreshing again.
class BuildInfo {
  const BuildInfo._();

  static const String version = '0.6.3';
  static const String updatedAt = '2026-08-02 07:00 IST';
  static const String summary = 'Fixed "Completed" count being cross-language and duplicate-inflated (progress now scoped to selected language); roadmap tab statuses updated';
}
