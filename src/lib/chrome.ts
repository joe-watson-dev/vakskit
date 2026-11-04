import { extractPage } from './extract';
import { showScanOverlay } from './overlay';
import type { PageResult } from './types';

const ALL_SITES = { origins: ['<all_urls>'] };

/** The side panel follows the active tab. */
export async function getTargetTab(): Promise<chrome.tabs.Tab | undefined> {
  const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  return tab;
}

export const hasSiteAccess = () => chrome.permissions.contains(ALL_SITES);

/**
 * Must be called straight from a click handler (needs a user gesture).
 * Resolves immediately, without a prompt, once access was granted before.
 */
export const requestSiteAccess = () => chrome.permissions.request(ALL_SITES);

export function isAnalyzable(url?: string) {
  return !!url && /^(https?|file):/.test(url) && !/^https:\/\/chrome(webstore)?\.google\.com\/webstore/.test(url);
}

export async function analyzeTab(tabId: number, mainOnly: boolean): Promise<PageResult> {
  // Load Defuddle into the page's isolated world (not the page's own scripts).
  await chrome.scripting.executeScript({ target: { tabId }, files: ['vendor/defuddle.js'] }).catch(() => undefined);
  const [res] = await chrome.scripting.executeScript({
    target: { tabId },
    func: extractPage,
    args: [{ mainOnly }],
  });
  if (!res?.result) throw new Error('The page did not return any data.');
  return res.result as PageResult;
}

export type SiteFile = { name: string; url: string; found: boolean; status: number; content: string };

/** Fetch well-known files at the site root: llms.txt, llms-full.txt, robots.txt, sitemap.xml. */
export async function fetchSiteFiles(pageUrl: string): Promise<SiteFile[]> {
  let origin: string;
  try {
    origin = new URL(pageUrl).origin;
  } catch {
    return [];
  }
  if (!origin.startsWith('http')) return [];
  const names = ['llms.txt', 'llms-full.txt', 'robots.txt', 'sitemap.xml'];
  return Promise.all(
    names.map(async (name) => {
      const url = `${origin}/${name}`;
      try {
        const r = await fetch(url, { credentials: 'omit', redirect: 'follow' });
        const type = r.headers.get('content-type') || '';
        // Many sites answer every path with their HTML app shell; that's not a real file.
        const isHtml = type.includes('text/html');
        const content = r.ok && !isHtml ? await r.text() : '';
        return { name, url, status: r.status, found: r.ok && !isHtml && content.trim().length > 0, content };
      } catch {
        return { name, url, status: 0, found: false, content: '' };
      }
    })
  );
}

/** Visual only: sweep a scan line over the page while it is read. Never blocks or fails analysis. */
export function showScan(tabId: number) {
  chrome.scripting.executeScript({ target: { tabId }, func: showScanOverlay }).catch(() => undefined);
}
