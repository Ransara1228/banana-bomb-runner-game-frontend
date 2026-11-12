import { useEffect, useState } from 'react';
import { sound } from '../sfx';
import Icon from './Icon';
import TitleScene from './TitleScene';

// One letter of the logo. Each letter drops in a little after the one before it.
function Letters({ word, from, red }) {
  return word.split('').map((ch, i) => (
    <span key={i} className={red ? 'ch red' : 'ch'} style={{ '--d': (from + i) * 0.05 + 's' }}>{ch}</span>
  ));
}

// Title screen for the login and OTP screens, like a real game:
// the game plays itself in the background, with the logo and a PLAY button on top.
// After PLAY, the login card (children) is shown in the middle.
export default function AuthHero({ started, onStart, children }) {
  const [muted, setMuted] = useState(sound.isMuted());

  useEffect(() => {                                  // Enter or Space = PLAY
    if (started) return;
    const onKey = (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onStart(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [started, onStart]);

  function toggleSound() {
    sound.setMuted(!muted);
    setMuted(!muted);
  }

  return (
    <div className={started ? 'title-screen started' : 'title-screen'}>
      <TitleScene />
      <div className="title-shade" aria-hidden="true" />

      <header className="title-top">
        <span className="chip dark">5 LEVELS · BANANA API PUZZLES</span>
        <button className="icon-btn" onClick={toggleSound} aria-label={muted ? 'Sound off' : 'Sound on'} title={muted ? 'Sound off' : 'Sound on'}>
          <Icon name={muted ? 'soundOff' : 'soundOn'} />
        </button>
      </header>

      <main className="title-center">
        <h1 className="game-logo" aria-label="Banana Bomb Runner">
          <span className="logo-row" aria-hidden="true">
            <img className="logo-banana" src="/assets/banana.svg" alt="" />
            <Letters word="BANANA" from={0} />
            <span className="ch-gap" />
            <Letters word="BOMB" from={6} red />
          </span>
          <span className="logo-row big" aria-hidden="true">
            <Letters word="RUNNER" from={10} />
            <img className="logo-bomb" src="/assets/bomb.svg" alt="" />
          </span>
        </h1>
        <p className="tagline">Run fast. Think faster.</p>

        {started ? children : (
          <div className="start-box">
            <button className="btn primary big glow play-btn" onClick={onStart}>▶ PLAY</button>
            <span className="press">PRESS ENTER TO START</span>
          </div>
        )}
      </main>

      <footer className="title-bottom">
        {!started && (
          <ul className="feature-chips">
            <li><img src="/assets/banana.svg" alt="" /> Grab bananas +10</li>
            <li><img src="/assets/mystery.svg" alt="" /> Mystery box +100</li>
            <li><img src="/assets/bomb.svg" alt="" /> Dodge the bombs</li>
            <li><Icon name="lock" size={18} /> Solve the gate puzzle</li>
            <li>🏆 Top the leaderboard</li>
          </ul>
        )}
        <span className="credit">Puzzles from the Banana API by Marc Conrad</span>
      </footer>
    </div>
  );
}
