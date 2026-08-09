import type { CSSProperties, ReactNode } from 'react';
import { BarChartIcon, CloudDoneIcon, FamilyIcon, LanguageIcon, LibraryIcon, MapIcon, SchoolIcon, SyncIcon, VoiceOverIcon } from '../ui/icons';
import { BuildBadge } from './BuildBadge';
import { useWindowWidth } from './useWindowWidth';

// Mirrors apps/mobile_flutter/lib/app/home_shell.dart: a rail nav on wide
// viewports, a bottom tab bar on narrow ones, a top bar with the build
// badge, and a max-width-1040 centered content area.
export interface TabDestination {
  index: number;
  label: string;
  icon: ReactNode;
}

const destinations: TabDestination[] = [
  { index: 0, label: 'Profiles', icon: <FamilyIcon /> },
  { index: 1, label: 'Languages', icon: <LanguageIcon /> },
  { index: 2, label: 'Lesson', icon: <SchoolIcon /> },
  { index: 3, label: 'Progress', icon: <BarChartIcon /> },
  { index: 4, label: 'Roadmap', icon: <MapIcon /> },
  { index: 5, label: 'Catalog', icon: <LibraryIcon /> },
];

interface HomeShellProps {
  body: ReactNode;
  selectedIndex: number;
  onDestinationSelected: (index: number) => void;
  profileName: string;
  languageName: string;
  environmentName: string;
  floatingActionButton?: ReactNode;
}

export function HomeShell({
  body,
  selectedIndex,
  onDestinationSelected,
  profileName,
  languageName,
  environmentName,
  floatingActionButton,
}: HomeShellProps) {
  const width = useWindowWidth();
  const useRail = width >= 900;
  const compact = width < 520;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        {useRail && (
          <NavigationRail selectedIndex={selectedIndex} onDestinationSelected={onDestinationSelected} />
        )}

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <TopBar
            profileName={profileName}
            languageName={languageName}
            environmentName={environmentName}
            compact={compact}
          />
          <div style={{ flex: 1, overflow: 'auto', display: 'flex', justifyContent: 'center' }}>
            <div
              style={{
                width: '100%',
                maxWidth: 1040,
                padding: useRail ? '8px 24px 24px' : '8px 14px 12px',
              }}
            >
              {body}
            </div>
          </div>
        </div>
      </div>

      {!useRail && (
        <BottomNav selectedIndex={selectedIndex} onDestinationSelected={onDestinationSelected} />
      )}

      {floatingActionButton && (
        <div style={{ position: 'fixed', right: 20, bottom: useRail ? 20 : 76 }}>{floatingActionButton}</div>
      )}
    </div>
  );
}

function TopBar({
  profileName,
  languageName,
  environmentName,
  compact,
}: {
  profileName: string;
  languageName: string;
  environmentName: string;
  compact: boolean;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: compact ? '14px 14px 8px' : '14px 24px 8px' }}>
      <div
        style={{
          width: 42,
          height: 42,
          flexShrink: 0,
          borderRadius: 8,
          background: 'linear-gradient(135deg, #0ea5a4, #2563eb)',
          boxShadow: '0 8px 18px rgba(14, 165, 164, 0.28)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
        }}
      >
        <VoiceOverIcon width={20} height={20} />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontWeight: 700, fontSize: 16 }}>BhashaVaani</span>
          <BuildBadge />
        </div>
        <div
          style={{
            marginTop: 2,
            fontSize: 12,
            fontWeight: 700,
            color: 'var(--bv-text-faint)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {profileName} learns {languageName}
        </div>
      </div>

      {!compact && <ConnectionPill label={environmentName} />}

      <button type="button" title="Sync" style={{ border: 'none', background: 'transparent', color: 'var(--bv-seed)', cursor: 'pointer', padding: 8 }}>
        <SyncIcon />
      </button>
    </div>
  );
}

function ConnectionPill({ label }: { label: string }) {
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '7px 10px',
        borderRadius: 8,
        background: 'rgba(255, 255, 255, 0.75)',
        border: '1px solid white',
        fontSize: 12,
        fontWeight: 700,
      }}
    >
      <CloudDoneIcon color="#0f766e" width={16} height={16} />
      {label}
    </div>
  );
}

function NavigationRail({
  selectedIndex,
  onDestinationSelected,
}: {
  selectedIndex: number;
  onDestinationSelected: (index: number) => void;
}) {
  return (
    <div
      style={{
        width: 96,
        margin: 12,
        borderRadius: 8,
        background: 'rgba(255, 255, 255, 0.70)',
        border: '1px solid white',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 4,
        padding: '16px 0',
      }}
    >
      {destinations.map((destination) => (
        <RailItem
          key={destination.index}
          destination={destination}
          selected={destination.index === selectedIndex}
          onClick={() => onDestinationSelected(destination.index)}
        />
      ))}
    </div>
  );
}

function RailItem({
  destination,
  selected,
  onClick,
}: {
  destination: TabDestination;
  selected: boolean;
  onClick: () => void;
}) {
  const style: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
    width: 76,
    padding: '10px 0',
    border: 'none',
    borderRadius: 8,
    background: selected ? 'rgba(14, 165, 164, 0.14)' : 'transparent',
    color: selected ? 'var(--bv-seed-dark)' : 'var(--bv-text-muted)',
    cursor: 'pointer',
    fontSize: 11,
    fontWeight: 600,
  };

  return (
    <button type="button" style={style} onClick={onClick}>
      {destination.icon}
      {destination.label}
    </button>
  );
}

function BottomNav({
  selectedIndex,
  onDestinationSelected,
}: {
  selectedIndex: number;
  onDestinationSelected: (index: number) => void;
}) {
  return (
    <div
      style={{
        display: 'flex',
        background: 'rgba(255, 255, 255, 0.92)',
        borderTop: '1px solid var(--bv-border)',
        padding: '6px 4px',
      }}
    >
      {destinations.map((destination) => {
        const selected = destination.index === selectedIndex;
        return (
          <button
            key={destination.index}
            type="button"
            onClick={() => onDestinationSelected(destination.index)}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
              border: 'none',
              background: 'transparent',
              padding: '6px 0',
              color: selected ? 'var(--bv-seed-dark)' : 'var(--bv-text-faint)',
              fontSize: 11,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {destination.icon}
            {destination.label}
          </button>
        );
      })}
    </div>
  );
}
