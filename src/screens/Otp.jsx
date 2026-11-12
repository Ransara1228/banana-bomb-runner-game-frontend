/*
 * AI-assisted: Claude (Anthropic), 2026-11-12.
 */
import { useEffect, useRef, useState } from 'react';
import { api } from '../api';
import AuthHero from '../components/AuthHero';
import Icon from '../components/Icon';

export default function Otp({ email, onDone, onBack }) {
  const [code, setCode] = useState('');
  const [msg, setMsg] = useState('');
  const [wait, setWait] = useState(60);   // the backend allows a new code after 60 seconds
  const input = useRef(null);

  useEffect(() => {
    if (wait <= 0) return;
    const t = setTimeout(() => setWait((w) => w - 1), 1000);
    return () => clearTimeout(t);
  }, [wait]);

  async function submit(e) {
    e.preventDefault();
    try {
      await api.verifyOtp(email, code);   // the backend sets the JWT cookie
      onDone();
    } catch (err) {
      setMsg(err.message);
      setCode('');
    }
  }

  return (
    <AuthHero started onStart={() => {}}>
      <form className="panel auth-card login-card pop" onSubmit={submit}>
        <img className="corner-banana" src="/assets/banana.svg" alt="" aria-hidden="true" />
        <span className="corner-bomb" aria-hidden="true"><img src="/assets/bomb.svg" alt="" /><span className="spark" /></span>
        <div className="mail-badge" aria-hidden="true"><Icon name="mail" size={34} /></div>
        <h2 className="center-text">Check your email</h2>
        <p className="muted center-text">We sent a 6-digit code to <b>{email}</b>. It works for 5 minutes and 5 tries. Check Spam too.</p>
        <div className="otp-boxes" onClick={() => input.current?.focus()}>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <span key={i} className={i === code.length ? 'otp-box focus' : code[i] ? 'otp-box filled' : 'otp-box'}>{code[i] || ''}</span>
          ))}
          <input ref={input} className="otp-input" inputMode="numeric" maxLength={6} value={code} aria-label="6-digit code"
                 onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} autoFocus />
        </div>
        <button className="btn primary big glow" disabled={code.length !== 6}>Verify and play →</button>
        {msg && <p className="msg">{msg}</p>}
        <p className="muted small">{wait > 0 ? `You can ask for a new code in ${wait}s.` : 'No email? Log in again for a new code.'}</p>
        <button type="button" className="link" onClick={onBack}>← Back to login</button>
      </form>
    </AuthHero>
  );
}
