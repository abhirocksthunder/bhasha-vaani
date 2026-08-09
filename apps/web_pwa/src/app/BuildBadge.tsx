import { BuildInfo } from '../core/config/buildInfo';

// Mirrors the _BuildBadge widget in apps/mobile_flutter/lib/app/home_shell.dart.
export function BuildBadge() {
  return (
    <span
      title={`BhashaVaani build ${BuildInfo.version}\nUpdated ${BuildInfo.updatedAt}\n${BuildInfo.summary}`}
      style={{
        padding: '2px 6px',
        borderRadius: 4,
        background: 'rgba(15, 23, 42, 0.06)',
        color: 'var(--bv-text-faint)',
        fontWeight: 700,
        fontSize: 11,
      }}
    >
      v{BuildInfo.version}
    </span>
  );
}
