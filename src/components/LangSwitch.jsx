// Two-option language switch: the active language is highlighted.
export default function LangSwitch({ lang, setLang, className = '' }) {
  return (
    <div className={`lang-switch ${className}`} role="group" aria-label="Language / ቋንቋ">
      {[
        ['am', 'አማ'],
        ['en', 'EN'],
      ].map(([code, label]) => (
        <button key={code} className={lang === code ? 'on' : ''} aria-pressed={lang === code} onClick={() => setLang(code)}>
          {label}
        </button>
      ))}
    </div>
  );
}
