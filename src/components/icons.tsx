import type { ReactNode } from 'react';

// Line icons (Lucide shapes), inlined to keep the bundle small.
const Svg = ({ children, className, sw = 1.8 }: { children: ReactNode; className?: string; sw?: number }) => (
  <svg
    xmlns='http://www.w3.org/2000/svg'
    viewBox='0 0 24 24'
    fill='none'
    stroke='currentColor'
    strokeWidth={sw}
    strokeLinecap='round'
    strokeLinejoin='round'
    className={className}
    aria-hidden='true'
  >
    {children}
  </svg>
);

type P = { className?: string };

export const Logo = () => (
  <span className='logo' aria-hidden='true'>
    <i />
    <i />
    <i />
    <i />
  </span>
);

export const Gauge = (p: P) => (
  <Svg {...p}>
    <path d='m12 14 4-4' />
    <path d='M3.3 19a10 10 0 1 1 17.4 0' />
  </Svg>
);
export const Doc = (p: P) => (
  <Svg {...p}>
    <path d='M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z' />
    <path d='M14 2v6h6M8 13h8M8 17h5' />
  </Svg>
);
export const Braces = (p: P) => (
  <Svg {...p}>
    <path d='M8 3H7a2 2 0 0 0-2 2v5a2 2 0 0 1-2 2 2 2 0 0 1 2 2v5a2 2 0 0 0 2 2h1M16 21h1a2 2 0 0 0 2-2v-5a2 2 0 0 1 2-2 2 2 0 0 1-2-2V5a2 2 0 0 0-2-2h-1' />
  </Svg>
);
export const Code = (p: P) => (
  <Svg {...p}>
    <path d='m16 18 6-6-6-6M8 6l-6 6 6 6' />
  </Svg>
);
export const Download = (p: P) => (
  <Svg {...p} sw={2}>
    <path d='M12 3v12m-5-5 5 5 5-5M5 21h14' />
  </Svg>
);
export const Copy = (p: P) => (
  <Svg {...p} sw={2}>
    <rect x='8' y='8' width='13' height='13' rx='3' />
    <path d='M4 16V5a2 2 0 0 1 2-2h11' />
  </Svg>
);
export const Check = (p: P) => (
  <Svg {...p} sw={2.4}>
    <path d='M20 6 9 17l-5-5' />
  </Svg>
);
export const Chevron = (p: P) => (
  <Svg {...p} sw={2.2}>
    <path d='m9 18 6-6-6-6' />
  </Svg>
);
export const Back = (p: P) => (
  <Svg {...p} sw={2}>
    <path d='m15 18-6-6 6-6' />
  </Svg>
);
export const Refresh = (p: P) => (
  <Svg {...p}>
    <path d='M21 12a9 9 0 1 1-2.6-6.4L21 8M21 3v5h-5' />
  </Svg>
);
export const Sun = (p: P) => (
  <Svg {...p}>
    <circle cx='12' cy='12' r='4' />
    <path d='M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4' />
  </Svg>
);
export const Moon = (p: P) => (
  <Svg {...p}>
    <path d='M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z' />
  </Svg>
);
export const More = ({ className }: P) => (
  <svg viewBox='0 0 24 24' fill='currentColor' className={className} aria-hidden='true'>
    <circle cx='5' cy='12' r='1.8' />
    <circle cx='12' cy='12' r='1.8' />
    <circle cx='19' cy='12' r='1.8' />
  </svg>
);
export const Eye = (p: P) => (
  <Svg {...p}>
    <path d='M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z' />
    <circle cx='12' cy='12' r='3' />
  </Svg>
);
export const EyeOff = (p: P) => (
  <Svg {...p}>
    <path d='M10.7 5.1A10 10 0 0 1 12 5c6.4 0 10 7 10 7a17 17 0 0 1-2.2 3.1M6.6 6.6C3.9 8.3 2 12 2 12s3.6 7 10 7a9.7 9.7 0 0 0 5.4-1.6M9.9 9.9a3 3 0 0 0 4.2 4.2M2 2l20 20' />
  </Svg>
);
