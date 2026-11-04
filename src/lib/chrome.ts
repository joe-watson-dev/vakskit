import { extractPage } from './extract';
import type { PageResult } from './types';

const ALL_SITES = { origins: ['<all_urls>'] };

/**
 * In the side panel PageKit follows the active tab. In the full view
 * (sidepanel.html?tab=123, opened in its own tab) it stays on that one page.
 */
export const FULL_VIEW_TAB_ID = Number(new URLSearchParams(location.search).get('tab')) || null;

export async function getTargetTab(): Promise<chrome.tabs.Tab | undefined> {
  if (FULL_VIEW_TAB_ID) return chrome.tabs.get(FULL_VIEW_TAB_ID).catch(() => undefined);
  const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  return tab;
}

/**
 * True when the tab shows one of PageKit's own pages (the full view).
 * Checked through Chrome's list of PageKit pages, because the tab's URL
 * may be hidden from the extension.
 */
export async function isOwnTab(tab?: chrome.tabs.Tab) {
  if (!tab?.id) return false;
  if (tab.url?.startsWith(chrome.runtime.getURL(''))) return true;
  const pages = await chrome.runtime.getContexts({ contextTypes: [chrome.runtime.ContextType.TAB] }).catch(() => []);
  return pages.some((c) => c.tabId === tab.id);
}

/**
 * Open the whole app in a browser tab, bound to the given page.
 * If a full view for that page is already open, switch to it instead of opening another.
 */
export async function openFullView(tabId: number) {
  const url = chrome.runtime.getURL(`sidepanel.html?tab=${tabId}`);
  const open = await chrome.runtime.getContexts({ contextTypes: [chrome.runtime.ContextType.TAB], documentUrls: [url] }).catch(() => []);
  const existing = open.find((c) => c.tabId >= 0);
  if (existing) {
    await chrome.tabs.update(existing.tabId, { active: true });
    if (existing.windowId >= 0) await chrome.windows.update(existing.windowId, { focused: true });
    return;
  }
  await chrome.tabs.create({ url });
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
