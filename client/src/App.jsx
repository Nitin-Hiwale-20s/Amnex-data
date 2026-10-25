import { useEffect, useState } from 'react';
import { api, getToken, setToken } from './api.js';
import { can, ROLE_LABEL, APP_NAME, APP_SUB } from './constants.js';
import { Icon, Logo, Modal, Field, ToastHost, toast, useTheme, ThemeSwitch, ThemeFab } from './ui.jsx';
import Home from './pages/Home.jsx';
import Materials from './pages/Materials.jsx';
import Material from './pages/Material.jsx';
import Deliveries from './pages/Deliveries.jsx';
import Serials from './pages/Serials.jsx';
import Dispatches from './pages/Dispatches.jsx';
import Dispatch from './pages/Dispatch.jsx';
import Challans from './pages/Challans.jsx';
import Challan from './pages/Challan.jsx';
import Reports from './pages/Reports.jsx';
import Import from './pages/Import.jsx';
import Users from './pages/Users.jsx';
import Activity from './pages/Activity.jsx';

function AuthScreen({ initial, onDone }) {
  const [mode, setMode] = useState(initial); // login | setup (accounts are created by the admin only)
  const [f, setF] = useState({ name: '', email: '', password: '' });
  const [busy, setBusy] = useState(false);
  const set = k => e => setF({ ...f, [k]: e.target.value });
  const submit = async e => {
    e.preventDefault(); setBusy(true);
    try {
      const d = await api(mode === 'setup' ? '/api/auth/setup' : '/api/auth/login', 'POST', mode === 'setup' ? f : { username: f.email, password: f.password });
      setToken(d.token); onDone(d.user);
    } catch (er) { toast(er.message, 'err'); }
    setBusy(false);
  };
  const title = { login: 'Log in', setup: 'Create admin account' }[mode];
  return (
    <div className="auth">
      <form className="auth-card" onSubmit={submit}>
        <div className="auth-sign"><Logo size={54} /><div><b>{APP_NAME}</b><span>{APP_SUB}</span></div></div>
        <div className="auth-body">
          <h1>{title}</h1>
          {mode === 'setup' && <p className="muted">First run. The admin account creates all other accounts and controls who can see and change what.</p>}
          {mode === 'login' && <p className="muted">Accounts are created by your admin. Ask your admin if you need one.</p>}
          {mode === 'setup' && <Field label="Your name"><input value={f.name} onChange={set('name')} required autoComplete="name" /></Field>}
          <Field label={mode === 'login' ? 'Email or username' : 'Email'}>
            <input type={mode === 'login' ? 'text' : 'email'} value={f.email} onChange={set('email')} required autoCapitalize="none" autoComplete="username" />
          </Field>
          <Field label="Password" hint={mode === 'setup' ? 'At least 6 characters' : undefined}>
            <input type="password" value={f.password} onChange={set('password')} required autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />
          </Field>
          <button className="btn primary block" disabled={busy}>{busy ? 'Please wait...' : title}</button>
        </div>
      </form>
    </div>
  );
}

function Account({ user, onClose, onLogout }) {
  const [f, setF] = useState({ current: '', next: '' });
  const submit = async e => {
    e.preventDefault();
    try { await api('/api/auth/password', 'POST', f); toast('Password changed'); onClose(); }
    catch (er) { toast(er.message, 'err'); }
  };
  return (
    <Modal title="My account" onClose={onClose}>
      <div className="me-card"><div className="avatar big">{user.name[0]}</div><div><b>{user.name}</b><div className="muted">{user.email || user.username}</div><span className={'tag role-' + user.role}>{ROLE_LABEL[user.role]}</span></div></div>
      <form onSubmit={submit} className="stack">
        <Field label="Current password"><input type="password" value={f.current} onChange={e => setF({ ...f, current: e.target.value })} required /></Field>
        <Field label="New password" hint="At least 6 characters"><input type="password" value={f.next} onChange={e => setF({ ...f, next: e.target.value })} required /></Field>
        <button className="btn primary block">Change password</button>
      </form>
      <button className="btn block" style={{ marginTop: 12 }} onClick={onLogout}><Icon name="logout" size={18} />Log out</button>
    </Modal>
  );
}

export default function App() {
  const [boot, setBoot] = useState('loading');
  const [user, setUser] = useState(null);
  const [view, setView] = useState({ page: 'home' });
  const [depth, setDepth] = useState(0); // how many screens we can go back through inside the app
  const [acct, setAcct] = useState(false);
  const [theme, setTheme] = useTheme();
  // Every screen change is saved in the browser history, so the in-app Back button
  // AND the phone / browser back button return to the previous screen instead of leaving the app.
  // replace = true swaps the current screen (used after delete, so Back does not return to a deleted record).
  const go = (page, p = {}, replace = false) => {
    const v = { page, ...p };
    // tapping the screen you are already on must not add another history entry
    if (JSON.stringify(window.history.state?.view) === JSON.stringify(v)) replace = true;
    const d = (window.history.state?.depth ?? 0) + (replace ? 0 : 1);
    try { window.history[replace ? 'replaceState' : 'pushState']({ view: v, depth: d }, ''); } catch { /* ignore */ }
    setView(v); setDepth(d); window.scrollTo(0, 0);
  };
  const back = () => { if (depth > 0) window.history.back(); else go('home', {}, true); };

  useEffect(() => {
    try { window.history.replaceState({ view: { page: 'home' }, depth: 0 }, ''); } catch { /* ignore */ }
    const onPop = e => {
      const st = e.state;
      setView(st?.view || { page: 'home' }); setDepth(st?.depth || 0); window.scrollTo(0, 0);
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  useEffect(() => {
    const f = () => { setUser(null); setBoot('login'); };
    window.addEventListener('unauth', f);
    return () => window.removeEventListener('unauth', f);
  }, []);
  useEffect(() => {
    (async () => {
      try {
        const st = await api('/api/auth/status');
        if (st.needsSetup) return setBoot('setup');
        if (getToken()) { setUser(await api('/api/auth/me')); return setBoot('ready'); }
        setBoot('login');
      } catch { setBoot('login'); }
    })();
  }, []);

  useEffect(() => { document.querySelector('.nav button.on')?.scrollIntoView({ inline: 'center', block: 'nearest' }); }, [view.page, boot]);

  const logout = () => { setToken(null); setUser(null); setAcct(false); setBoot('login'); };
  const done = u => {
    try { window.history.replaceState({ view: { page: 'home' }, depth: 0 }, ''); } catch { /* ignore */ }
    setUser(u); setView({ page: 'home' }); setDepth(0); setBoot('ready');
  };

  if (boot === 'loading') return <div className="auth"><p className="loading">Loading...</p></div>;
  if (boot !== 'ready' || !user) return <><div className="auth-theme"><ThemeSwitch theme={theme} setTheme={setTheme} /></div><AuthScreen key={boot} initial={boot === 'setup' ? 'setup' : 'login'} onDone={done} /><ToastHost /></>;

  const inv = can(user, 'inventory'), editor = can(user, 'inventory', 'edit');
  const nav = [
    { k: 'home', l: 'Dashboard', i: 'grid', show: true, on: ['home'] },
    { k: 'mat', l: 'Materials', i: 'box', show: inv, on: ['mat', 'material'] },
    { k: 'del', l: 'Deliveries', i: 'inbox', show: inv, on: ['del'] },
    { k: 'ser', l: 'Serials', i: 'tag', show: inv, on: ['ser'] },
    { k: 'dis', l: 'Dispatch', i: 'truck', show: inv, on: ['dis', 'dispatch'] },
    { k: 'chl', l: 'Challans', i: 'file', show: inv, on: ['chl', 'challan'] },
    { k: 'rep', l: 'Reports', i: 'chart', show: inv, on: ['rep'] },
    { k: 'imp', l: 'Import', i: 'upload', show: editor, on: ['imp'] },
    { k: 'usr', l: 'Users', i: 'users', show: user.role === 'admin', on: ['usr'] },
    { k: 'act', l: 'Activity', i: 'activity', show: user.role === 'admin', on: ['act'] },
  ].filter(x => x.show);
  const noAccess = !inv;

  const p = { user, go };
  let body;
  if (noAccess && view.page !== 'usr') body = <div className="empty"><b>No access yet</b><p>Ask an admin to give you access to the Material Tracker.</p></div>;
  else if (view.page === 'mat') body = <Materials {...p} />;
  else if (view.page === 'material') body = <Material key={view.id} id={view.id} {...p} />;
  else if (view.page === 'del') body = <Deliveries {...p} />;
  else if (view.page === 'ser') body = <Serials {...p} />;
  else if (view.page === 'dis') body = <Dispatches {...p} />;
  else if (view.page === 'dispatch') body = <Dispatch key={view.id} id={view.id} {...p} />;
  else if (view.page === 'chl') body = <Challans {...p} />;
  else if (view.page === 'challan') body = <Challan key={view.id} id={view.id} {...p} />;
  else if (view.page === 'rep') body = <Reports />;
  else if (view.page === 'imp' && editor) body = <Import />;
  else if (view.page === 'usr' && user.role === 'admin') body = <Users me={user} />;
  else if (view.page === 'act' && user.role === 'admin') body = <Activity />;
  else body = <Home {...p} />;

  return (
    <div className="app">
      <aside className="side">
        <div className="brand"><Logo size={42} /><div><b>{APP_NAME}</b><span>{APP_SUB}</span></div></div>
        <nav className="nav">
          {nav.map(n => (
            <button key={n.k} className={n.on.includes(view.page) ? 'on' : ''} onClick={() => go(n.k)}>
              <Icon name={n.i} size={20} /><span>{n.l}</span>
            </button>
          ))}
        </nav>
        <ThemeSwitch theme={theme} setTheme={setTheme} />
        <button className="me" onClick={() => setAcct(true)}><span className="avatar">{user.name[0]}</span><span><b>{user.name}</b><small>{ROLE_LABEL[user.role]}</small></span></button>
      </aside>
      <header className="mtop"><div className="mtop-left">{depth > 0 && <button className="back-fab" onClick={back} aria-label="Back"><Icon name="back" size={20} /></button>}<div className="brand"><Logo size={32} /><b>{APP_NAME}</b></div></div><div className="mtop-right"><ThemeFab theme={theme} setTheme={setTheme} /><button className="avatar" onClick={() => setAcct(true)} aria-label="My account">{user.name[0]}</button></div></header>
      <main>
        {depth > 0 && <button className="btn sm back-btn" onClick={back}><Icon name="back" size={16} />Back</button>}
        {body}
      </main>
      {acct && <Account user={user} onClose={() => setAcct(false)} onLogout={logout} />}
      <ToastHost />
    </div>
  );
}
