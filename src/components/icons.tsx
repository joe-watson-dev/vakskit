import type { ReactNode } from 'react';

// Lucide icons (https://lucide.dev), inlined to keep the bundle small.
const Svg = ({ children, className = 'h-4 w-4' }: { children: ReactNode; className?: string }) => (
  <svg
    xmlns='http://www.w3.org/2000/svg'
    viewBox='0 0 24 24'
    fill='none'
    stroke='currentColor'
    strokeWidth={2}
    strokeLinecap='round'
    strokeLinejoin='round'
    className={className}
    aria-hidden='true'
  >
    {children}
  </svg>
);

type P = { className?: string };

export const Download = (p: P) => (
  <Svg {...p}>
    <path d='M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4' />
    <path d='m7 10 5 5 5-5M12 15V3' />
  </Svg>
);

export const Copy = (p: P) => (
  <Svg {...p}>
    <rect width='14' height='14' x='8' y='8' rx='2' />
    <path d='M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2' />
  </Svg>
);

export const Check = (p: P) => (
  <Svg {...p}>
    <path d='M20 6 9 17l-5-5' />
  </Svg>
);

export const Refresh = (p: P) => (
  <Svg {...p}>
    <path d='M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8' />
    <path d='M21 3v5h-5M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16' />
    <path d='M8 16H3v5' />
  </Svg>
);

export const Search = (p: P) => (
  <Svg {...p}>
    <circle cx='11' cy='11' r='8' />
    <path d='m21 21-4.3-4.3' />
  </Svg>
);

export const FileText = (p: P) => (
  <Svg {...p}>
    <path d='M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z' />
    <path d='M14 2v4a2 2 0 0 0 2 2h4M10 9H8M16 13H8M16 17H8' />
  </Svg>
);

export const Code = (p: P) => (
  <Svg {...p}>
    <path d='m16 18 6-6-6-6M8 6l-6 6 6 6' />
  </Svg>
);

export const Sun = (p: P) => (
  <Svg {...p}>
    <circle cx='12' cy='12' r='4' />
    <path d='M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41' />
  </Svg>
);

export const Moon = (p: P) => (
  <Svg {...p}>
    <path d='M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z' />
  </Svg>
);

export const Monitor = (p: P) => (
  <Svg {...p}>
    <rect width='20' height='14' x='2' y='3' rx='2' />
    <path d='M8 21h8M12 17v4' />
  </Svg>
);

export const Home =(p: P) => (
  <Svg {...p}>
    <path d='M3 10 12 3l9 7v10a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1Z' />
  </Svg>
);

export const ExternalLink = (p: P) => (
  <Svg {...p}>
    <path d='M15 3h6v6M10 14 21 3M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6' />
  </Svg>
);

export const Sparkles =(p: P) => (
  <Svg {...p}>
    <path d='M9.94 14.06 4 20M12 3l1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2Z' />
  </Svg>
);
