import { useEffect, useMemo, useRef, useState } from 'react';
import { COLORS, colorInfo } from '../i18n.js';

// Colour swatch: preset colours show their colour, typed colours a neutral striped chip.
export function Swatch({ css }) {
  return <span className={`swatch ${css ? '' : 'swatch-custom'}`} style={css ? { background: css } : undefined} aria-hidden="true" />;
}

// Pick an animal colour from the list (name + swatch) or type a new one.
export default function ColorPicker({ t, lang, value, extra = [], onChange }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const box = useRef(null);
  const info = colorInfo(value, lang);

  useEffect(() => {
    if (!open) return undefined;
    const away = (e) => box.current && !box.current.contains(e.target) && setOpen(false);
    document.addEventListener('pointerdown', away);
    return () => document.removeEventListener('pointerdown', away);
  }, [open]);

  const q = query.trim();
  const options = useMemo(() => {
    const presets = COLORS.map((c) => ({ value: c.key, label: lang === 'en' ? c.en : c.am, sub: lang === 'en' ? c.am : c.en, css: c.css }));
    const custom = [...new Set(extra)]
      .filter((v) => v && !COLORS.some((c) => c.key === v))
      .map((v) => ({ value: v, label: v, sub: '', css: null }));
    const needle = q.toLowerCase();
    return [...presets, ...custom].filter((o) => !needle || o.label.toLowerCase().includes(needle) || o.sub.toLowerCase().includes(needle));
  }, [extra, lang, q]);

  // A typed name that matches a listed colour (in either language) selects that colour.
  const resolve = (text) => {
    const n = text.trim().toLowerCase();
    const preset = COLORS.find((c) => c.am.toLowerCase() === n || c.en.toLowerCase() === n);
    return preset ? preset.key : text.trim();
  };
  const exact = q && options.some((o) => o.label.toLowerCase() === q.toLowerCase() || o.sub.toLowerCase() === q.toLowerCase());
  const pick = (v) => {
    onChange(v);
    setQuery('');
    setOpen(false);
  };

  return (
    <div className="color-picker" ref={box}>
      <div className={`color-input ${open ? 'open' : ''}`}>
        {value && !open && <Swatch css={info.css} />}
        <input
          id="color-input"
          value={open ? query : info.label}
          placeholder={open && info.label ? info.label : t('colorPlaceholder')}
          autoComplete="off"
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              if (q) pick(resolve(q));
            } else if (e.key === 'Escape') {
              setOpen(false);
            }
          }}
        />
        {value && (
          <button type="button" className="color-clear" aria-label="clear" onClick={() => pick('')}>
            ✕
          </button>
        )}
        <button type="button" className="color-caret" aria-label={t('color')} onClick={() => setOpen((o) => !o)}>
          ▾
        </button>
      </div>
      {open && (
        <ul className="color-list" role="listbox">
          {q && !exact && (
            <li className="color-add" onClick={() => pick(resolve(q))}>
              ➕ {t('addColor')}: <b>{q}</b>
            </li>
          )}
          {options.map((o) => (
            <li key={o.value} role="option" aria-selected={o.value === value} className={o.value === value ? 'sel' : ''} onClick={() => pick(o.value)}>
              <span className="color-name">
                {o.label}
                {o.sub && <small>{o.sub}</small>}
              </span>
              <Swatch css={o.css} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
