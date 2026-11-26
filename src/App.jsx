import { useEffect, useState } from 'react';
import { api } from './api';
import { connectEffects } from './effects';
import { enterFullscreen } from './browser';
import Login from './screens/Login';
import Otp from './screens/Otp';
import Home from './screens/Home';
import Game from './screens/Game';
import Leaderboard from './screens/Leaderboard';
import { FREE_LEVELS } from './levels';

export default function App() {
  const [screen, setScreen] = useState('loading');   // loading -> login -> otp (or guest) -> home -> game / leaderboard
  const [email, setEmail] = useState('');
  const [level, setLevel] = useState(1);
  const [run, setRun] = useState(0);                 // new number = fresh game
  const [guest, setGuest] = useState(false);         // true = playing without an account (levels 1-2 only)

  useEffect(() => connectEffects(), []);               // sounds, vibration, confetti listen to game events

  useEffect(() => {
    api.progress().then(() => setScreen('home')).catch(() => setScreen('login'));   // already logged in?
  }, []);

  function toLogin() {
    setGuest(false);
    setScreen('login');
  }

  function playAsGuest() {
    setGuest(true);
    setScreen('home');
  }

  function play(lv) {
    if (guest && lv > FREE_LEVELS) { toLogin(); return; }   // the backend checks this too (401)
    enterFullscreen();                               // the game fills the whole screen
    setLevel(lv);
    setRun((r) => r + 1);
    setScreen('game');
  }

  if (screen === 'loading') return <div className="screen">Loading...</div>;
  if (screen === 'login') return <Login onCodeSent={(e) => { setEmail(e); setScreen('otp'); }} onGuest={playAsGuest} />;
  if (screen === 'otp') return <Otp email={email} onDone={() => { setGuest(false); setScreen('home'); }} onBack={toLogin} />;
  if (screen === 'home') {
    return <Home guest={guest} onPlay={play} onLogout={toLogin} onLogin={toLogin} onLeaderboard={() => setScreen('leaderboard')} />;
  }
  if (screen === 'leaderboard') return <Leaderboard guest={guest} onBack={() => setScreen('home')} onPlay={play} onLogin={toLogin} />;
  return <Game key={run} guest={guest} levelNo={level} onPlay={play} onExit={() => setScreen('home')}
               onLeaderboard={() => setScreen('leaderboard')} onLogin={toLogin} />;
}
