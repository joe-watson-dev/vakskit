import { useState } from 'react';
import type { Seo } from '@/lib/types';
import { hostOf } from '@/lib/url';

/** The site's favicon, or its first two letters when there is none. */
export function SiteIcon({ seo, mini }: { seo: Seo; mini?: boolean }) {
  const [broken, setBroken] = useState(false);
  const icon = seo.icons.find((i) => /icon/i.test(i.rel) && !/mask/i.test(i.rel))?.href || `${new URL(seo.url).origin}/favicon.ico`;
  const host = hostOf(seo.url);
  return (
    <span className={`fav${mini ? ' mini' : ''}`} aria-hidden='true'>
      {!broken ? <img src={icon} alt='' onError={() => setBroken(true)} /> : host.slice(0, 2).toUpperCase()}
    </span>
  );
}
