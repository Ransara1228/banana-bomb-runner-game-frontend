import { useEffect, useState } from 'react';
import { api } from './api';
import Login from './screens/Login';
import Home from './screens/Home';

export default function App() {
  const [screen, setScreen] = useState('loading');   // loading -> login -> home -> game
  const [level, setLevel] = useState(1);

  useEffect(() => {
    api.progress().then(() => setScreen('home')).catch(() => setScreen('login'));   // already logged in?
  }, []);

  function play(lv) {
    setLevel(lv);
    setScreen('game');
  }

  if (screen === 'loading') return <div className="screen">Loading...</div>;
  if (screen === 'login') return <Login onLoggedIn={() => setScreen('home')} />;
  if (screen === 'home') return <Home onPlay={play} onLogout={() => setScreen('login')} onLeaderboard={() => {}} />;
  return (
    <div className="screen">
      Level {level}: the runner game comes next.
      <button className="btn" onClick={() => setScreen('home')}>Back</button>
    </div>
  );
}
