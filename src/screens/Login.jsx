import { useEffect, useState } from 'react';
import { api } from '../api';
import AuthHero from '../components/AuthHero';
import Avatar from '../components/Avatar';
import Icon from '../components/Icon';
import { sound } from '../sfx';

let startedOnce = false;   // after the first PLAY in this visit, the title screen opens on the login card

// How strong a password is, shown as 0-3 bananas (the backend only asks for 6+ characters).
function strength(pw) {
  let points = 0;
  if (pw.length >= 6) points++;
  if (pw.length >= 10) points++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) points++;
  if (/\d/.test(pw)) points++;
  if (/[^A-Za-z0-9]/.test(pw)) points++;
  if (pw.length < 6) return { level: pw ? 1 : 0, text: pw ? 'Too short (6+ characters)' : '' };
  if (points <= 2) return { level: 1, text: 'Weak' };
  if (points === 3) return { level: 2, text: 'Okay' };
  return { level: 3, text: 'Strong' };
}

export default function Login({ onLoggedIn }) {
  const [mode, setMode] = useState('login');   // 'login' or 'register'
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [seed, setSeed] = useState('');         // avatar name, updated a moment after typing stops
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const [started, setStarted] = useState(startedOnce);

  function start() {
    if (!startedOnce) sound.play('banana');
    startedOnce = true;
    setStarted(true);
  }

  // wait 400 ms after the last key before asking DiceBear for a new avatar
  useEffect(() => {
    const t = setTimeout(() => setSeed(username.trim()), 400);
    return () => clearTimeout(t);
  }, [username]);

  function switchMode(next) {
    setMode(next);
    setMsg('');
  }

  async function submit(e) {
    e.preventDefault();
    setMsg('');
    setBusy(true);
    try {
      if (mode === 'register') {
        await api.register(email, username, password);
        setMode('login');
        setMsg('Registered. Now log in.');
      } else {
        await api.login(email, password);   // 5 wrong passwords -> locked for 5 minutes (429)
        onLoggedIn();
      }
    } catch (err) {
      setMsg(err.message);
    } finally {
      setBusy(false);
    }
  }

  const register = mode === 'register';
  const pw = strength(password);
  return (
    <AuthHero started={started} onStart={start}>
      <form className="panel auth-card login-card pop" onSubmit={submit}>
        <img className="corner-banana" src="/assets/banana.svg" alt="" aria-hidden="true" />
        <span className="corner-bomb" aria-hidden="true"><img src="/assets/bomb.svg" alt="" /><span className="spark" /></span>

        <div className="mode-switch" role="tablist" aria-label="Log in or sign up">
          <span className="mode-pill" style={{ transform: register ? 'translateX(100%)' : 'none' }} />
          <button type="button" role="tab" aria-selected={!register} className={register ? '' : 'on'} onClick={() => switchMode('login')}>Log in</button>
          <button type="button" role="tab" aria-selected={register} className={register ? 'on' : ''} onClick={() => switchMode('register')}>Sign up</button>
        </div>

        <div className="card-title" key={mode}>
          <h2>{register ? 'Join the run!' : 'Welcome back, runner!'}</h2>
          <p className="muted">
            {register ? 'Make your runner. Your name and avatar go on the leaderboard.' : 'Log in with your email and password.'}
          </p>
        </div>

        {register && (
          <div className="avatar-preview">
            <span className="avatar-pop" key={seed}><Avatar name={seed || 'new runner'} size={58} /></span>
            <div>
              <b>{seed || 'Your runner'}</b>
              <span>This is how you look on the leaderboard</span>
            </div>
          </div>
        )}

        <div className="field">
          <label htmlFor="email">Email</label>
          <span className="input-icon">
            <Icon name="mail" />
            <input id="email" type="email" placeholder="you@example.com" autoComplete="email" value={email}
                   onChange={(e) => setEmail(e.target.value)} required />
          </span>
        </div>
        {register && (
          <div className="field">
            <label htmlFor="username">Username</label>
            <span className="input-icon">
              <Icon name="user" />
              <input id="username" placeholder="e.g. BananaKing" autoComplete="username" value={username} maxLength={20}
                     onChange={(e) => setUsername(e.target.value)} required />
            </span>
          </div>
        )}
        <div className="field">
          <label htmlFor="password">Password</label>
          <span className="input-icon pw">
            <Icon name="lock" />
            <input id="password" type={show ? 'text' : 'password'} placeholder="6 or more characters" value={password}
                   autoComplete={register ? 'new-password' : 'current-password'}
                   onChange={(e) => setPassword(e.target.value)} required minLength={6} />
            <button type="button" className="eye" onClick={() => setShow(!show)} aria-label={show ? 'Hide password' : 'Show password'}>{show ? '🙈' : '👁'}</button>
          </span>
          {register && password && (
            <div className={'strength s' + pw.level} aria-live="polite">
              {[1, 2, 3].map((i) => <img key={i} className={i <= pw.level ? 'on' : ''} src="/assets/banana.svg" alt="" />)}
              <span>{pw.text}</span>
            </div>
          )}
        </div>

        <button className="btn primary big glow" disabled={busy}>
          {busy ? 'Please wait…' : register ? 'Create my runner' : '▶ Start running'}
        </button>
        {msg && <p className="msg" role="status">{msg}</p>}

        <p className="note"><Icon name="shield" size={18} /> Safe login: 5 wrong passwords lock the account for 5 minutes.</p>
      </form>
    </AuthHero>
  );
}
