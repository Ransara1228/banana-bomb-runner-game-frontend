import { useState } from 'react';
import { sound } from '../sfx';
import Avatar from './Avatar';
import Icon from './Icon';

// Top bar for the menu screens: logo, sound toggle, the player and extra buttons.
export default function AppHeader({ me, children }) {
  const [muted, setMuted] = useState(sound.isMuted());
  function toggle() {
    sound.setMuted(!muted);
    setMuted(!muted);
  }
  return (
    <header className="app-header">
      <div className="brand">
        <img src="/assets/banana.svg" alt="" />
        <span>Banana Bomb Runner</span>
      </div>
      <div className="header-right">
        <button className="icon-btn" onClick={toggle} title={muted ? 'Sound off' : 'Sound on'} aria-label={muted ? 'Sound off' : 'Sound on'}><Icon name={muted ? 'soundOff' : 'soundOn'} /></button>
        {me && (
          <span className="user-pill">
            <Avatar name={me.username} size={30} />
            {me.username}
          </span>
        )}
        {children}
      </div>
    </header>
  );
}
