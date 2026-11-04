export async function copyText(text: string) {
  await navigator.clipboard.writeText(text);
}

export function downloadText(text: string, filename: string, type = 'text/plain') {
  const url = URL.createObjectURL(new Blob([text], { type: `${type};charset=utf-8` }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Open text in a new browser tab: rendered when `type` is text/html, plain text otherwise. */
export function openInTab(text: string, type = 'text/plain') {
  const url = URL.createObjectURL(new Blob([text], { type: `${type};charset=utf-8` }));
  chrome.tabs.create({ url });
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

/** "https://www.example.com/blog/post?x=1" -> "example-com-blog-post" */
export function slugFromUrl(url: string) {
  try {
    const u = new URL(url);
    const slug = (u.hostname.replace(/^www\./, '') + u.pathname)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    return slug.slice(0, 80) || 'page';
  } catch {
    return 'page';
  }
}
