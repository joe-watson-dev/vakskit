/**
 * Runs INSIDE the page (chrome.scripting.executeScript) while VaksKit reads it:
 * a scan line sweeps down the viewport and the headings, images and links it
 * passes get a short-lived outline and tag. Purely visual, removes itself, and
 * lives in a shadow root so the page's CSS can't touch it. Self-contained:
 * Chrome serializes this function, so no outside references.
 */
export function showScanOverlay() {
  const ID = 'vakskit-scan';
  document.getElementById(ID)?.remove();
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const host = document.createElement('div');
  host.id = ID;
  host.style.cssText = 'position:fixed;inset:0;z-index:2147483647;pointer-events:none;';
  const root = host.attachShadow({ mode: 'open' });
  const DURATION = 1800;
  root.innerHTML = `<style>
    .beam{position:fixed;left:0;right:0;top:-80px;height:80px;
      background:linear-gradient(180deg,transparent,rgb(106 76 245/.08) 70%,rgb(106 76 245/.28) 98%,transparent);
      animation:beam ${DURATION}ms cubic-bezier(.45,0,.55,1) forwards}
    .beam::after{content:'';position:absolute;left:0;right:0;bottom:1px;height:2px;
      background:linear-gradient(90deg,#2f7bea 0 25%,#f2552c 25% 50%,#7c4dff 50% 75%,#10a88f 75%)}
    @keyframes beam{to{top:100%}}
    .box{position:fixed;border:1.5px solid #6a4cf5;border-radius:8px;opacity:0;transition:opacity .2s}
    .box.on{opacity:1}
    .box b{position:absolute;top:-9px;left:6px;font:600 9px/1 ui-monospace,Menlo,monospace;
      padding:3px 5px;border-radius:4px;background:#6a4cf5;color:#fff;letter-spacing:.03em}
  </style><div class="beam"></div>`;
  document.documentElement.appendChild(host);

  const vh = innerHeight;
  const picks: [string, string][] = [
    ['h1', 'H1'],
    ['h2', 'H2'],
    ['h3', 'H3'],
    ['img', 'IMG'],
    ['a[href]', 'LINK'],
  ];
  let count = 0;
  for (const [sel, tag] of picks) {
    for (const el of Array.from(document.querySelectorAll(sel))) {
      if (count > 24) break;
      const r = el.getBoundingClientRect();
      if (r.width < 24 || r.height < 10 || r.bottom < 0 || r.top > vh) continue;
      if (tag === 'LINK' && r.width < 60) continue;
      const box = document.createElement('div');
      box.className = 'box';
      box.style.cssText = `left:${r.left - 3}px;top:${r.top - 3}px;width:${r.width + 6}px;height:${r.height + 6}px`;
      box.innerHTML = `<b>${tag}</b>`;
      root.appendChild(box);
      setTimeout(() => box.classList.add('on'), Math.max(0, (r.top / vh) * DURATION));
      count++;
    }
  }
  setTimeout(() => {
    host.style.transition = 'opacity .3s';
    host.style.opacity = '0';
    setTimeout(() => host.remove(), 320);
  }, DURATION + 500);
}
