import { useEffect, useState } from 'react';
import { api } from './api';
import Login from './screens/Login';

export default function App() {
  const [screen, setScreen] = useState('loading');   // loading -> login -> home

  useEffect(() => {
    api.progress().then(() => setScreen('home')).catch(() => setScreen('login'));   // already logged in?
  }, []);

  if (screen === 'loading') return <div className="screen">Loading...</div>;
  if (screen === 'login') return <Login onLoggedIn={() => setScreen('home')} />;
  return <div className="screen">Logged in. The level map comes next.</div>;
}
