const TRACKING = /^(utm_\w+|fbclid|gclid|dclid|msclkid|igshid|mc_cid|mc_eid|_hsenc|_hsmi|yclid)$/i;

/** Remove tracking parameters (utm_*, fbclid, gclid…) from a URL. */
export function cleanUrl(url: string) {
  try {
    const u = new URL(url);
    [...u.searchParams.keys()].forEach((k) => TRACKING.test(k) && u.searchParams.delete(k));
    return u.href;
  } catch {
    return url;
  }
}
