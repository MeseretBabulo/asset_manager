import { useState } from 'react';
import { login } from '../api.js';
import LangSwitch from './LangSwitch.jsx';

export default function Login({ t, lang, setLang, onLogin }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError(false);
    try {
      if (await login(pin)) onLogin();
      else setError(true);
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login">
      <LangSwitch lang={lang} setLang={setLang} className="login-lang" />
      <img src="/icons/icon-192.png" alt="" width="96" height="96" />
      <h1>{t('appName')}</h1>
      <form onSubmit={submit}>
        <label htmlFor="pin">{t('enterPin')}</label>
        <input
          id="pin"
          type="password"
          inputMode="numeric"
          autoComplete="current-password"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          autoFocus
        />
        {error && <p className="error">{t('wrongPin')}</p>}
        <button className="btn btn-primary" disabled={busy || !pin}>
          {t('login')}
        </button>
      </form>
    </div>
  );
}
