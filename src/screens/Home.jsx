import { useEffect, useState } from 'react';
import { api } from '../api';
import { COLOR, DESC, MYSTERY_BONUS, bombRows, mysteryBoxes } from '../levels';
import AppHeader from '../components/AppHeader';
import BgFx from '../components/BgFx';
import CountUp from '../components/CountUp';
import WorldMap from '../components/WorldMap';

export default function Home({ onPlay, onLogout, onLeaderboard }) {
  const [levels, setLevels] = useState([]);
  const [me, setMe] = useState(null);
  const [sel, setSel] = useState(1);

  useEffect(() => {
    Promise.all([api.levels(), api.progress()])
      .then(([l, p]) => { setLevels(l); setMe(p); setSel(Math.min(p.highestLevel, l.length)); })
      .catch(onLogout);   // cookie expired -> back to login
  }, []);

  // keyboard like a game menu: <- -> pick a level, Enter plays it
  useEffect(() => {
    if (!me) return;
    const onKey = (e) => {
      const typing = ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName);
      if (typing) return;
      if (e.key === 'ArrowRight') setSel((s) => Math.min(s + 1, me.highestLevel));
      if (e.key === 'ArrowLeft') setSel((s) => Math.max(s - 1, 1));
      if (e.key === 'Enter' && (document.activeElement === document.body || document.activeElement?.classList.contains('node'))) {
        e.preventDefault();
        onPlay(sel);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [me, sel]);

  async function logout() {
    await api.logout().catch(() => {});
    onLogout();
  }

  if (!me || levels.length === 0) return <div className="screen">Loading...</div>;
  const lv = levels[sel - 1];
  const nextLocked = levels[me.highestLevel];             // the first locked level (undefined when all are open)
  return (
    <div className="page">
      <BgFx />
      <AppHeader me={me}><button className="btn ghost" onClick={logout}>Log out</button></AppHeader>
      <main className="home-grid">
        <section className="panel map-panel">
          <WorldMap levels={levels} highest={me.highestLevel} selected={sel} me={me} onSelect={setSel} onPlay={onPlay} />
          <details className="howto floating">
            <summary>📖 How to play</summary>
            <ul>
              <li>← → (or A / D, or tap left / right) to change lane.</li>
              <li>Banana = +10. Bomb = -1 heart. You have 3 hearts.</li>
              <li>Grab the purple mystery box for a +{MYSTERY_BONUS} bonus!</li>
              <li>At the finish line, solve the Banana puzzle before the timer ends to unlock the next level.</li>
              <li>Wrong answer or time up = -1 heart and a new puzzle. 0 hearts = start the level again.</li>
              <li>P or Esc = pause. The game also pauses when you switch tab.</li>
            </ul>
          </details>
        </section>

        <aside className="side">
          <section className="panel level-card" style={{ '--c': COLOR[lv.id] }}>
            <div className="level-banner" key={lv.id}>
              <img className="banner-bg" src={'/assets/levels/' + lv.background} alt="" />
              <img className="banner-runner bob" src="/assets/runner/up.svg" alt="" />
              <img className="banner-box" src="/assets/mystery.svg" alt="" />
              <span className="level-pill">LEVEL {lv.id}</span>
            </div>
            <h2>{lv.name}</h2>
            <p className="muted">{DESC[lv.id]}</p>
            <div className="tiles">
              <div className="tile"><span>Runner speed</span><b>{lv.speed}×</b></div>
              <div className="tile"><span>Puzzle time</span><b className="danger">{lv.puzzleTime}s</b></div>
              <div className="tile"><span>Distance</span><b>{lv.distance} m</b></div>
              <div className="tile"><span>Bomb rows</span><b>{bombRows(lv)}</b></div>
              <div className="tile wide"><img src="/assets/mystery.svg" alt="" /><span>Mystery boxes</span><b className="purple">{mysteryBoxes(lv)} × +{MYSTERY_BONUS}</b></div>
            </div>
            <button className="btn primary big glow" onClick={() => onPlay(lv.id)}>▶ Play level {lv.id}</button>
          </section>

          <section className="panel stats-card">
            <h3>Your journey</h3>
            <div className="journey" aria-label={`${me.highestLevel} of ${levels.length} levels unlocked`}>
              {levels.map((l) => (
                <span key={l.id} className={l.id <= me.highestLevel ? 'pip on' : 'pip'} style={{ '--c': COLOR[l.id] }} title={l.name}>
                  {l.id <= me.highestLevel ? l.id : '🔒'}
                </span>
              ))}
            </div>
            <p className="goal-text">
              {nextLocked ? <>Next: clear <b>{levels[me.highestLevel - 1].name}</b> to open <b>{nextLocked.name}</b>.</> : <>All 5 levels are open. Go for the top score!</>}
            </p>
            <div className="stat-row"><span className="muted">Best score</span><b className="num"><CountUp value={me.bestScore} /></b></div>
            <button className="btn ghost wide" onClick={onLeaderboard}>🏆 Open leaderboard</button>
          </section>
        </aside>
      </main>
    </div>
  );
}
