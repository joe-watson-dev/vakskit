// Markdown "source mode": the raw text stays exactly as it will be copied,
// but markers are dimmed and the text gets its formatting (like an editor).
// Everything is HTML-escaped first, so page content can't inject markup.

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function inline(t: string) {
  return t
    .replace(/`([^`]+)`/g, '<code>`$1`</code>')
    .replace(
      /(!?)\[([^\]]*)\]\(([^)\s]+)\)/g,
      '<span class="mk">$1[</span><span class="lt">$2</span><span class="mk">](</span><span class="url">$3</span><span class="mk">)</span>'
    )
    .replace(/\*\*([^*]+)\*\*/g, '<span class="mk">**</span><b>$1</b><span class="mk">**</span>')
    .replace(/(^|[^\w*])_([^_]+)_(?!\w)/g, '$1<span class="mk">_</span><em>$2</em><span class="mk">_</span>');
}

/** Returns safe HTML for <pre class="md">. Very long documents are shown plain. */
export function markdownSourceHtml(md: string) {
  const text = esc(md);
  if (md.length > 120_000) return text;
  let inFront = false;
  let inCode = false;
  return text
    .split('\n')
    .map((l, i) => {
      if (l.startsWith('```')) {
        inCode = !inCode;
        return `<span class="ln mk">${l}</span>`;
      }
      if (inCode) return `<span class="ln"><code>${l || ' '}</code></span>`;
      if (l === '---' && (i === 0 || inFront)) {
        inFront = i === 0;
        return `<span class="ln fm">${l}</span>`;
      }
      if (inFront) {
        const m = l.match(/^([\w-]+):(.*)$/);
        return `<span class="ln fm">${m ? `<span class="fk">${m[1]}</span>:${m[2]}` : l}</span>`;
      }
      const h = l.match(/^(#{1,6}) (.*)$/);
      if (h) return `<span class="h${Math.min(3, h[1].length)}"><span class="mk">${h[1]}</span> ${inline(h[2])}</span>`;
      const li = l.match(/^(\s*)([-*+]|\d+\.) (.*)$/);
      if (li) return `<span class="ln">${li[1]}<span class="li">${li[2]}</span> ${inline(li[3])}</span>`;
      if (l.startsWith('&gt; ')) return `<span class="bq"><span class="mk">&gt;</span> ${inline(l.slice(5))}</span>`;
      return `<span class="ln">${inline(l)}</span>`;
    })
    .join('');
}

/** Words, sections (## headings), images and minutes to read. */
export function markdownStats(md: string) {
  const body = md.replace(/^---\n[\s\S]*?\n---\n/, '');
  const words = body.replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1').split(/\s+/).filter((w) => /\w/.test(w)).length;
  return {
    words,
    sections: (body.match(/^##\s/gm) || []).length,
    images: (body.match(/!\[[^\]]*\]\([^)]*\)/g) || []).length,
    minutes: Math.max(1, Math.round(words / 220)),
  };
}
