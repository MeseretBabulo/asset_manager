import { useCallback, useEffect, useMemo, useState } from 'react';
import * as api from './api.js';
import { makeT } from './i18n.js';
import Login from './components/Login.jsx';
import LangSwitch from './components/LangSwitch.jsx';
import Dashboard from './components/Dashboard.jsx';
import Assets from './components/Assets.jsx';
import Settings from './components/Settings.jsx';
import { RecordForm, AssetForm } from './components/Forms.jsx';

const LANG_KEY = 'am_lang';
const readLang = () => {
  try { return localStorage.getItem(LANG_KEY) || 'am'; } catch { return 'am'; }
};

export default function App() {
  const [lang, setLang] = useState(readLang);
  const [authed, setAuthed] = useState(() => !!api.getPin());
  const [tab, setTab] = useState('home');
  const [records, setRecords] = useState([]);
  const [assets, setAssets] = useState([]);
  const [owners, setOwners] = useState([]);
  const [types, setTypes] = useState([]);
  const [ownerFilter, setOwnerFilter] = useState('all');
  const [offline, setOffline] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState(null); // { kind: 'record'|'asset', item }
  const [toast, setToast] = useState('');
  const [installEvent, setInstallEvent] = useState(null);
  const [installHelp, setInstallHelp] = useState(false);

  const t = useMemo(() => makeT(lang), [lang]);

  useEffect(() => {
    document.documentElement.lang = lang;
    try { localStorage.setItem(LANG_KEY, lang); } catch { /* ignore */ }
  }, [lang]);

  // "Add to home screen" support (Chrome / Android)
  useEffect(() => {
    const onPrompt = (e) => {
      e.preventDefault();
      setInstallEvent(e);
    };
    const onInstalled = () => setInstallEvent(null);
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const flash = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2400);
  }, []);

  const handleError = useCallback(
    (e) => {
      if (e instanceof api.AuthError) setAuthed(false);
      else flash(e.message === 'in_use' ? t('inUse') : t('error'));
    },
    [t, flash],
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await Promise.all(['records', 'assets', 'owners', 'animal-types'].map(api.list));
      setRecords(res[0].rows);
      setAssets(res[1].rows);
      setOwners(res[2].rows);
      setTypes(res[3].rows);
      setOffline(res.some((r) => r.offline));
    } catch (e) {
      handleError(e);
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  useEffect(() => {
    if (authed) load();
  }, [authed, load]);

  // Generic save / delete used by forms and settings. Returns true on success.
  const save = useCallback(
    async (resource, data, { close = true, quiet = false } = {}) => {
      try {
        if (data.id) await api.update(resource, data.id, data);
        else await api.create(resource, data);
        if (close) setForm(null);
        if (!quiet) flash(t('saved'));
        await load();
        return true;
      } catch (e) {
        handleError(e);
        return false;
      }
    },
    [flash, handleError, load, t],
  );

  const del = useCallback(
    async (resource, item) => {
      if (!window.confirm(t('confirmDelete'))) return false;
      try {
        await api.remove(resource, item.id);
        setForm(null);
        flash(t('deleted'));
        await load();
        return true;
      } catch (e) {
        handleError(e);
        return false;
      }
    },
    [flash, handleError, load, t],
  );


  if (!authed) {
    return <Login t={t} onLogin={() => setAuthed(true)} lang={lang} setLang={setLang} />;
  }

  // Already opened as the installed app? Then no install button.
  const isStandalone = window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true;
  const byOwner = (rows) => (ownerFilter === 'all' ? rows : rows.filter((r) => r.owner_id === ownerFilter));
  const defaultOwner = ownerFilter === 'all' ? owners[0]?.id : ownerFilter;
  const shared = { t, lang, owners, ownerFilter, setOwnerFilter, loading };

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <img src="/icons/icon-192.png" alt="" width="32" height="32" />
          <span>{t('appName')}</span>
        </div>
        <div className="topbar-actions">
          {!isStandalone && (
            <button
              className="chip chip-accent"
              onClick={async () => {
                // Chrome/Edge with HTTPS: real install prompt. Anywhere else: show how to install.
                if (!installEvent) return setInstallHelp(true);
                installEvent.prompt();
                await installEvent.userChoice;
                setInstallEvent(null);
              }}
            >
              ⬇ <span className="install-label">{t('install')}</span>
            </button>
          )}
          <LangSwitch lang={lang} setLang={setLang} />
        </div>
      </header>

      {offline && <div className="banner">{t('offline')}</div>}

      <main className="content">
        {tab === 'home' && (
          <Dashboard {...shared} records={byOwner(records)} allRecords={records} types={types} onOpen={(item) => setForm({ kind: 'record', item })} />
        )}
        {tab === 'assets' && <Assets {...shared} assets={byOwner(assets)} onOpen={(item) => setForm({ kind: 'asset', item })} />}
        {tab === 'settings' && (
          <Settings
            t={t}
            lang={lang}
            owners={owners}
            types={types}
            onSave={(resource, data) => save(resource, data, { close: false })}
            onDelete={del}
            onLogout={() => {
              api.logout();
              setAuthed(false);
            }}
          />
        )}
      </main>

      {tab !== 'settings' && (
        <button
          className="fab"
          aria-label={tab === 'home' ? t('newRecord') : t('newAsset')}
          onClick={() => setForm({ kind: tab === 'home' ? 'record' : 'asset', item: null })}
          disabled={offline || !owners.length}
        >
          +
        </button>
      )}

      <nav className="bottomnav">
        {[
          ['home', '🐄', t('livestock')],
          ['assets', '🏠', t('assets')],
          ['settings', '⚙️', t('settings')],
        ].map(([key, icon, label]) => (
          <button key={key} className={tab === key ? 'active' : ''} onClick={() => setTab(key)}>
            <span className="nav-icon">{icon}</span>
            {label}
          </button>
        ))}
      </nav>

      {form?.kind === 'record' && (
        <RecordForm
          t={t}
          lang={lang}
          item={form.item}
          owners={owners}
          types={types}
          defaultOwner={defaultOwner}
          locations={[...new Set(records.map((r) => r.location))]}
          receivers={[...new Set(records.map((r) => r.receiver))]}
          onSave={(d) => save('records', d)}
          onDelete={(i) => del('records', i)}
          onClose={() => setForm(null)}
        />
      )}
      {form?.kind === 'asset' && (
        <AssetForm
          t={t}
          item={form.item}
          owners={owners}
          defaultOwner={defaultOwner}
          locations={[...new Set([...assets.map((a) => a.location), ...records.map((r) => r.location)])]}
          onSave={(d) => save('assets', d)}
          onDelete={(i) => del('assets', i)}
          onClose={() => setForm(null)}
        />
      )}

      {installHelp && (
        <div className="sheet-backdrop" onClick={() => setInstallHelp(false)}>
          <div className="sheet install-help" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <div className="sheet-head">
              <h2>⬇ {t('installTitle')}</h2>
              <button className="icon-btn" onClick={() => setInstallHelp(false)} aria-label="close">
                ✕
              </button>
            </div>
            <ol>
              <li>📱 <b>Android:</b> {t('installAndroid')}</li>
              <li>🍏 <b>iPhone:</b> {t('installIphone')}</li>
              <li>💻 <b>{t('installPcLabel')}:</b> {t('installDesktop')}</li>
            </ol>
            <p className="muted small">{t('installNote')}</p>
            <div className="form-actions">
              <span className="spacer" />
              <button className="btn btn-primary" onClick={() => setInstallHelp(false)}>
                {t('ok')}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
