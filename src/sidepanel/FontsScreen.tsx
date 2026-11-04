import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { SOURCE_LABEL, buildGoogleHref, familyCss, fullCss, importSnippet, lineHeightLabel, roleCss } from '@/lib/fonts';
import type { FontsResult } from '@/lib/types';
import { ScreenHeader } from './App';
import { CopyIcon } from './MarkdownScreen';

type Props = { fonts: FontsResult | undefined; notify: (m: string) => void; onBack: () => void; menu: ReactNode };
type Family = FontsResult['families'][number];

/** Load the page's web fonts into the panel so each specimen shows the real typeface. */
function useSpecimens(families: Family[]) {
  const [ready, setReady] = useState<Record<string, string>>({});
  useEffect(() => {
    families.forEach((f) => {
      if (f.source === 'system') {
        setReady((r) => ({ ...r, [f.family]: `'${f.cssName}'` }));
        return;
      }
      if (f.source === 'google' || f.source === 'next-font') {
        // Rebuilt from the family name: never load a stylesheet URL taken from the page.
        const href = buildGoogleHref(f);
        if (!document.querySelector(`link[data-vk-font="${CSS.escape(f.family)}"]`)) {
          const link = Object.assign(document.createElement('link'), { rel: 'stylesheet', href });
          link.dataset.vkFont = f.family;
          document.head.appendChild(link);
        }
        setReady((r) => ({ ...r, [f.family]: `'${f.family}'` }));
        return;
      }
      const web = f.files.filter((u) => /^https?:\/\//.test(u));
      const file = web.find((u) => /\.woff2/.test(u)) || web[0];
      if (!file) return;
      const name = `vk-${f.family}`;
      new FontFace(name, `url("${file}")`)
        .load()
        .then((face) => {
          document.fonts.add(face);
          setReady((r) => ({ ...r, [f.family]: `'${name}'` }));
        })
        .catch(() => undefined); // the site may block other origins: keep the default font
    });
  }, [families]);
  return ready;
}

export function FontsScreen({ fonts, notify, onBack, menu }: Props) {
  const [open, setOpen] = useState<string | null>(null);
  const families = useMemo(() => fonts?.families ?? [], [fonts]);
  const roles = fonts?.roles ?? [];
  const specimen = useSpecimens(families);
  const css = useMemo(() => (fonts ? fullCss(fonts) : ''), [fonts]);
  const faceOf = (family: string) => (specimen[family] ? `${specimen[family]}, var(--font)` : 'inherit');
  // The page's own fallback (serif / sans-serif / monospace) for this family.
  const stackOf = (f: Family) => familyCss(f, roles.find((r) => r.family === f.cssName || r.family === f.family)?.stack ?? '');
  const familyOfRole = (r: FontsResult['roles'][number]) => families.find((f) => f.cssName === r.family || f.family === r.family)?.family ?? r.family;

  return (
    <>
      <ScreenHeader
        title='Fonts'
        onBack={onBack}
        menu={menu}
        actions={css ? <CopyIcon text={css} label='Copy all CSS' notify={notify} msg='Font CSS copied' /> : undefined}
      />
      <div className='body'>
        <div className='doc-head'>
          <h2>{families.length ? `${families.length} font${families.length === 1 ? '' : 's'} on this page` : 'No fonts found'}</h2>
          <p className='hint'>Read from the styles the page really renders with. Open a font to see how to use it.</p>
        </div>

        <div className='fonts'>
          {families.map((f) => (
            <div key={f.family} className='card font'>
              <button className='font-top' onClick={() => setOpen(open === f.family ? null : f.family)} aria-expanded={open === f.family}>
                <span className='specimen' style={{ fontFamily: faceOf(f.family) }}>
                  Aa
                </span>
                <span className='grow'>
                  <b style={{ fontFamily: faceOf(f.family) }}>{f.family}</b>
                  <small>
                    {SOURCE_LABEL[f.source]} · <span className='mono'>{(f.weights.find((w) => w.includes('–')) ? [f.weights.find((w) => w.includes('–'))] : f.weights).join(' · ')}</span>
                  </small>
                </span>
                <span className={`tag ${f.source === 'system' ? 'grey' : 'css'}`}>{open === f.family ? 'Hide' : 'Use'}</span>
              </button>
              <div className='used'>
                {f.roles.map((r) => (
                  <span key={r} className='chip'>
                    {r}
                  </span>
                ))}
              </div>
              {open === f.family && (
                <div className='howto'>
                  <div className='howto-head'>
                    <span>How to use it</span>
                    <CopyIcon text={`${importSnippet(f)}\n\nfont-family: ${stackOf(f)};`} label={`Copy ${f.family} CSS`} notify={notify} msg={`Copied ${f.family}`} />
                  </div>
                  <pre className='code'>{`${importSnippet(f)}\n\n/* then */\nfont-family: ${stackOf(f)};`}</pre>
                </div>
              )}
            </div>
          ))}
        </div>

        {roles.length > 0 && (
          <>
            <div className='label'>
              <h2>Type scale</h2>
              <CopyIcon text={roles.map(roleCss).join('\n\n')} label='Copy type scale CSS' notify={notify} msg='Type scale copied' />
            </div>
            <div className='card scale'>
              {roles.map((r) => (
                <div key={r.id} className='scale-row'>
                  <span className='role'>{r.label}</span>
                  <span className='grow'>
                    <span
                      className='sample'
                      style={{
                        fontFamily: faceOf(familyOfRole(r)),
                        fontWeight: Number(r.weight) || 400,
                        fontSize: `min(${r.size}, ${r.id === 'h1' ? 26 : r.id === 'h2' ? 22 : 18}px)`,
                        fontStyle: r.style,
                        textTransform: r.transform as React.CSSProperties['textTransform'],
                      }}
                    >
                      {r.sample}
                    </span>
                    <small className='mono'>
                      {familyOfRole(r)} · {parseFloat(r.size)}px · {r.weight} · {lineHeightLabel(r)}
                    </small>
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </>
  );
}
