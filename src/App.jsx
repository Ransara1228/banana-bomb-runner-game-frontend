import { useEffect, useState } from 'react';
import { api } from './api';
import { connectEffects } from './effects';
import { enterFullscreen } from './browser';
import Login from './screens/Login';
import Otp from './screens/Otp';
import Home from './screens/Home';
import Game from './screens/Game';
import Leaderboard from './screens/Leaderboard';

export default function App() {
  const [screen, setScreen] = useState('loading');   // loading -> login -> otp -> home -> game / leaderboard
  const [email, setEmail] = useState('');
  const [level, setLevel] = useState(1);
  const [run, setRun] = useState(0);                 // new number = fresh game

  useEffect(() => connectEffects(), []);               // sounds, vibration, confetti listen to game events

  useEffect(() => {
    api.progress().then(() => setScreen('home')).catch(() => setScreen('login'));   // already logged in?
  }, []);

  function play(lv) {
    enterFullscreen();                               // the game fills the whole screen
    setLevel(lv);
    setRun((r) => r + 1);
    setScreen('game');
  }

  if (screen === 'loading') return <div className="screen">Loading...</div>;
  if (screen === 'login') return <Login onCodeSent={(e) => { setEmail(e); setScreen('otp'); }} />;
  if (screen === 'otp') return <Otp email={email} onDone={() => setScreen('home')} onBack={() => setScreen('login')} />;
  if (screen === 'home') {
    return <Home onPlay={play} onLogout={() => setScreen('login')} onLeaderboard={() => setScreen('leaderboard')} />;
  }
  if (screen === 'leaderboard') return <Leaderboard onBack={() => setScreen('home')} onPlay={play} />;
  return <Game key={run} levelNo={level} onPlay={play} onExit={() => setScreen('home')}
               onLeaderboard={() => setScreen('leaderboard')} />;
}
