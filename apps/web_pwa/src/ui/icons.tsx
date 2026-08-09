// Minimal inline-SVG icon set standing in for Flutter's Material Icons,
// kept dependency-free for phase 1 of the Vite/React rewrite (see the
// migration plan discussed in chat) so scaffolding doesn't depend on an
// extra npm install of an icon library on top of the base Vite template.
// Swap for lucide-react or similar in a later phase if a fuller icon set
// is needed.
import type { SVGProps } from 'react';

function Svg(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    />
  );
}

export const WifiOffIcon = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}>
    <path d="M1 1l22 22" />
    <path d="M16.72 11.06A10.94 10.94 0 0119 12.55" />
    <path d="M5 12.55a10.94 10.94 0 015.17-2.39" />
    <path d="M10.71 5.05A16 16 0 0122.58 9" />
    <path d="M1.42 9a15.91 15.91 0 014.7-2.88" />
    <path d="M8.53 16.11a6 6 0 016.95 0" />
    <line x1="12" y1="20" x2="12.01" y2="20" />
  </Svg>
);

export const LockIcon = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}>
    <rect x="3" y="11" width="18" height="11" rx="2" />
    <path d="M7 11V7a5 5 0 0110 0v4" />
  </Svg>
);

export const FamilyIcon = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}>
    <circle cx="9" cy="7" r="3" />
    <circle cx="17" cy="9" r="2.4" />
    <path d="M2 21v-2a5 5 0 015-5h4a5 5 0 015 5v2" />
    <path d="M17 13.4a3.6 3.6 0 013.6 3.6v1.6" />
  </Svg>
);

export const PersonIcon = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21v-1a8 8 0 0116 0v1" />
  </Svg>
);

export const ChildIcon = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}>
    <circle cx="12" cy="6" r="3" />
    <path d="M12 9v5" />
    <path d="M9 12h6" />
    <path d="M8 20l4-6 4 6" />
  </Svg>
);

export const CheckCircleIcon = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="10" />
    <path d="M9 12l2 2 4-4" />
  </Svg>
);

export const CircleIcon = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="10" />
  </Svg>
);

export const EditIcon = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}>
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.12 2.12 0 013 3L7 19l-4 1 1-4z" />
  </Svg>
);

export const TranslateIcon = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}>
    <path d="M4 5h7" />
    <path d="M7 3v2c0 4.5-2 8-5 9" />
    <path d="M3 12c2 1.5 5 1.5 7 0" />
    <path d="M13 21l4-9 4 9" />
    <path d="M14.5 18h5" />
  </Svg>
);

export const MicIcon = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}>
    <rect x="9" y="2" width="6" height="12" rx="3" />
    <path d="M5 10a7 7 0 0014 0" />
    <line x1="12" y1="17" x2="12" y2="22" />
  </Svg>
);

export const VolumeIcon = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}>
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
    <path d="M15.5 8.5a5 5 0 010 7" />
    <path d="M18.5 5.5a9 9 0 010 13" />
  </Svg>
);

export const VoiceIcon = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}>
    <rect x="9" y="2" width="6" height="12" rx="3" />
    <path d="M5 10a7 7 0 0014 0" />
    <line x1="12" y1="17" x2="12" y2="22" />
    <line x1="8" y1="22" x2="16" y2="22" />
  </Svg>
);

export const ExtensionIcon = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}>
    <path d="M14 3v3a1 1 0 001 1h3" />
    <path d="M20.4 14.5a2 2 0 000-3.6 2 2 0 01-1-3.4L18 6H8a2 2 0 00-2 2v3.4a2 2 0 01-3.4 1 2 2 0 000 3.6 2 2 0 013.4 1V20a2 2 0 002 2h10a2 2 0 002-2v-3.4a2 2 0 011.4-1.1" />
  </Svg>
);

export const CheckIcon = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}>
    <path d="M20 6L9 17l-5-5" />
  </Svg>
);

export const LibraryIcon = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}>
    <rect x="3" y="4" width="4" height="16" rx="1" />
    <rect x="10" y="6" width="4" height="14" rx="1" />
    <path d="M17 4l4 1.5L18 20l-4-1" />
  </Svg>
);

export const UpdateIcon = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}>
    <path d="M21 12a9 9 0 11-3-6.7" />
    <polyline points="21 3 21 9 15 9" />
  </Svg>
);

export const LanguageIcon = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="10" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15 15 0 010 20 15 15 0 010-20z" />
  </Svg>
);

export const RefreshIcon = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}>
    <polyline points="23 4 23 10 17 10" />
    <polyline points="1 20 1 14 7 14" />
    <path d="M3.51 9a9 9 0 0114.36-3.36L23 10M1 14l5.15 4.36A9 9 0 0020.49 15" />
  </Svg>
);

export const SchoolIcon = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}>
    <path d="M22 10L12 5 2 10l10 5 10-5z" />
    <path d="M6 12v5c0 1.5 2.7 3 6 3s6-1.5 6-3v-5" />
  </Svg>
);

export const BarChartIcon = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}>
    <line x1="12" y1="20" x2="12" y2="10" />
    <line x1="18" y1="20" x2="18" y2="4" />
    <line x1="6" y1="20" x2="6" y2="16" />
  </Svg>
);

export const MapIcon = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}>
    <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
    <line x1="8" y1="2" x2="8" y2="18" />
    <line x1="16" y1="6" x2="16" y2="22" />
  </Svg>
);

export const SyncIcon = RefreshIcon;

export const CloudDoneIcon = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}>
    <path d="M17.5 19a4.5 4.5 0 000-9 6 6 0 00-11.4-1.5A4.5 4.5 0 006.5 19h11z" />
    <path d="M9 13l2 2 4-4" />
  </Svg>
);

export const CloudOffIcon = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}>
    <path d="M1 1l22 22" />
    <path d="M9.5 4.5A6 6 0 0117.5 10a4.5 4.5 0 011.4 8.8" opacity={0.7} />
    <path d="M6.5 6.7A4.5 4.5 0 006.5 15.5" opacity={0.7} />
  </Svg>
);

export const SyncLockIcon = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}>
    <polyline points="23 4 23 10 17 10" />
    <polyline points="1 20 1 14 7 14" />
    <path d="M3.51 9a9 9 0 0114.36-3.36L23 10M1 14l5.15 4.36A9 9 0 0020.49 15" />
  </Svg>
);

export const ReviewsIcon = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}>
    <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" />
  </Svg>
);

export const MenuBookIcon = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}>
    <path d="M2 4h7a4 4 0 014 4v12a3 3 0 00-3-3H2z" />
    <path d="M22 4h-7a4 4 0 00-4 4v12a3 3 0 013-3h8z" />
  </Svg>
);

export const PetsIcon = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}>
    <circle cx="6" cy="7" r="2" />
    <circle cx="12" cy="4.5" r="2" />
    <circle cx="18" cy="7" r="2" />
    <circle cx="21" cy="13" r="2" />
    <path d="M9 21c-1.5 0-2.5-1.2-2.2-2.6.4-2 1.6-3.4 3-4.4a4 4 0 014.4 0c1.4 1 2.6 2.4 3 4.4.3 1.4-.7 2.6-2.2 2.6z" />
  </Svg>
);

export const CloseIcon = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}>
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </Svg>
);

export const SendIcon = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}>
    <line x1="22" y1="2" x2="11" y2="13" />
    <polygon points="22 2 15 22 11 13 2 9 22 2" />
  </Svg>
);

export const AutorenewIcon = RefreshIcon;

export const RadioButtonUncheckedIcon = CircleIcon;

export const FlagCircleIcon = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="10" />
    <path d="M9 8v8" />
    <path d="M9 8h4l-1 2 1 2H9" />
  </Svg>
);

export const OfflineBoltIcon = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}>
    <path d="M1 1l22 22" />
    <path d="M13 2L4.5 12.5H11L10 22l9-11h-6.5z" opacity={0.6} />
  </Svg>
);

export const GraphicEqIcon = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}>
    <line x1="4" y1="9" x2="4" y2="15" />
    <line x1="9" y1="5" x2="9" y2="19" />
    <line x1="14" y1="3" x2="14" y2="21" />
    <line x1="19" y1="7" x2="19" y2="17" />
  </Svg>
);

export const StopCircleIcon = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="10" />
    <rect x="9" y="9" width="6" height="6" />
  </Svg>
);

export const TaskAltIcon = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="10" />
    <path d="M8 12l3 3 5-6" />
  </Svg>
);

export const ArrowBackIcon = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}>
    <line x1="19" y1="12" x2="5" y2="12" />
    <polyline points="12 19 5 12 12 5" />
  </Svg>
);

export const ArrowForwardIcon = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}>
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </Svg>
);

export const RouteIcon = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}>
    <circle cx="6" cy="19" r="2" />
    <circle cx="18" cy="5" r="2" />
    <path d="M8 19h7a4 4 0 000-8H9a4 4 0 010-8h7" />
  </Svg>
);

export const CloudUploadIcon = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}>
    <path d="M17.5 19a4.5 4.5 0 000-9 6 6 0 00-11.4-1.5A4.5 4.5 0 006.5 19h11z" />
    <polyline points="12 12 12 21" />
    <polyline points="9 15 12 12 15 15" />
  </Svg>
);

export const AutoAwesomeIcon = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}>
    <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5L18 18M18 6l-2.5 2.5M8.5 15.5L6 18" />
    <circle cx="12" cy="12" r="2" />
  </Svg>
);

export const PendingIcon = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="10" />
    <circle cx="8" cy="12" r="1" fill="currentColor" />
    <circle cx="12" cy="12" r="1" fill="currentColor" />
    <circle cx="16" cy="12" r="1" fill="currentColor" />
  </Svg>
);

export const VoiceOverIcon = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}>
    <circle cx="9" cy="9" r="4" />
    <path d="M2 20a7 7 0 0114 0" />
    <path d="M16 8a4 4 0 010 6" />
    <path d="M19 5a8 8 0 010 12" />
  </Svg>
);
