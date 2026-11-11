import { useEffect, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import { api } from '../api';
import { sound } from '../sfx';
import { TITLE } from '../levels';
import AppHeader from '../components/AppHeader';
import Avatar from '../components/Avatar';
import BgFx from '../components/BgFx';
import CountUp from '../components/CountUp';
import LeaderboardTable from '../components/LeaderboardTable';
import PartyHat from '../components/PartyHat';

const PARTY = ['#FFD23F', '#FF7AB6', '#B48CFF', '#3DDC84', '#4FA8FF'];
const MEDAL = { 1: ['#FFE27A', '#E0A800', '#FF5A4E'], 2: ['#F2F5F8', '#AEB7C0', '#4FA8FF'], 3: ['#F2B57E', '#B86E33', '#3DDC84'] };

// A medal with a ribbon, for the podium (gold, silver, bronze).
function Medal({ place }) {
  const [light, dark, ribbon] = MEDAL[place];
  return (
    <svg className="medal" width="46" height="60" viewBox="0 0 46 60" aria-hidden="true">
      <path d="M8 0h11l6 22h-11z" fill={ribbon} /><path d="M38 0H27l-6 22h11z" fill={ribbon} opacity=".8" />
      <circle cx="23" cy="40" r="18" fill={dark} />
      <circle cx="23" cy="40" r="14" fill={light} />
      <text x="23" y="46" textAnchor="middle" fontFamily="Fredoka, sans-serif" fontWeight="700" fontSize="17" fill="#2A2100">{place}</text>
    </svg>
  );
}

// Fireworks over the stage (CSS only, so they stop when the player asks for less motion).
function Fireworks() {
  const shots = [['14%', '24%', '#FFD23F', 0], ['86%', '20%', '#FF7AB6', 1.3], ['74%', '46%', '#4FA8FF', 2.4], ['24%', '50%', '#3DDC84', 3.2]];
  return (
    <div className="fireworks" aria-hidden="true">
      {shots.map(([left, top, c, delay], k) => (
        <span key={k} className="burst" style={{ left, top, '--c': c, animationDelay: delay + 's' }}>
          {Array.from({ length: 12 }, (_, i) => <i key={i} style={{ '--r': i * 30 + 'deg' }} />)}
        </span>
      ))}
    </div>
  );
}

export default function Leaderboard({ onBack, onPlay }) {
  const [rows, setRows] = useState(null);
  const [me, setMe] = useState(null);
  const [error, setError] = useState('');
  const champ = useRef(null);

  useEffect(() => {
    api.leaderboard().then(setRows).catch((e) => setError(e.message));
    api.progress().then(setMe).catch(() => {});
  }, []);

  // A small party for the player in 1st place: confetti from their spot on the podium.
  function celebrate(withSound) {
    const el = champ.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const origin = { x: (r.left + r.width / 2) / window.innerWidth, y: (r.top + r.height / 3) / window.innerHeight };
    confetti({ particleCount: 90, spread: 110, startVelocity: 30, ticks: 220, origin, colors: PARTY, disableForReducedMotion: true });
    if (withSound) sound.play('win');
  }
  useEffect(() => {
    if (!rows || rows.length === 0) return;
    const t = setTimeout(() => celebrate(false), 900);   // after the hat lands
    return () => clearTimeout(t);
  }, [rows]);

  const rank = rows && me ? rows.findIndex((r) => r.username === me.username) + 1 : 0;
  const above = rank > 1 ? rows[rank - 2] : null;           // the player just above me
  const target = rows && me && rank === 0 && rows.length ? rows[rows.length - 1] : above;
  const podium = rows ? [1, 0, 2].filter((i) => rows[i]) : [];
  const myTitle = me ? (rank === 1 ? 'Jungle Champion' : TITLE[me.highestLevel]) : '';
  return (
    <div className="page board-page">
      <BgFx />
      <AppHeader me={me}><button className="btn ghost" onClick={onBack}>← Level map</button></AppHeader>
      <main className="board-grid">
        <section className="panel me-card player-card pop">
          <span className="card-shine" aria-hidden="true" />
          {me ? (
            <>
              <span className="label">PLAYER CARD</span>
              <span className="me-avatar"><Avatar name={me.username} size={104} /></span>
              <h2>{me.username}</h2>
              <span className="title-badge">{rank === 1 ? '👑 ' : '⭐ '}{myTitle}</span>
              <div className="card-stats">
                <div><b className="num y"><CountUp value={me.bestScore} /></b><span>Best score</span></div>
                <div><b className="num">{me.highestLevel}/5</b><span>Levels</span></div>
                <div><b className="num">{rank > 0 ? '#' + rank : '—'}</b><span>Rank</span></div>
              </div>
              <div className="goal">
                {rank === 1 ? (
                  <><b>You are the champion! 🎉</b><span>Keep playing to stay on top.</span></>
                ) : target ? (
                  <>
                    <b>{(target.points - me.bestScore + 1).toLocaleString()} pts to pass {target.username}</b>
                    <span className="bar"><span style={{ width: Math.min(100, (100 * me.bestScore) / (target.points + 1)) + '%' }} /></span>
                  </>
                ) : <span>Finish a level to get on the board.</span>}
              </div>
              <button className="btn primary big glow" onClick={() => onPlay(me.highestLevel)}>▶ Play level {me.highestLevel}</button>
            </>
          ) : <p className="muted">Loading...</p>}
        </section>

        <div className="board-main">
          <section className="panel stage pop">
            <span className="curtain left" aria-hidden="true" /><span className="curtain right" aria-hidden="true" />
            <span className="valance" aria-hidden="true" />
            <span className="beam left" aria-hidden="true" /><span className="beam right" aria-hidden="true" />
            <Fireworks />
            <div className="stage-head">
              <span className="label">HALL OF FAME</span>
              <h1 className="ribbon"><span className="trophy">🏆</span> Leaderboard</h1>
              <span className="chip">All time · top 10</span>
            </div>
            {error && <p className="msg">{error}</p>}
            {rows && rows.length > 0 && (
              <div className="podium" aria-label="Top 3 players">
                {podium.map((i) => (
                  <div key={rows[i].id} className={'podium-col p' + (i + 1) + (rows[i].username === me?.username ? ' me' : '')}>
                    {i === 0 ? (
                      <button className="champ" ref={champ} onClick={() => celebrate(true)} title="Celebrate!" aria-label={`Celebrate ${rows[0].username}, the champion`}>
                        <span className="hat-wrap"><PartyHat size={58} /></span>
                        <span className="twinkle t1">✦</span><span className="twinkle t2">✦</span><span className="twinkle t3">✦</span>
                        <Avatar name={rows[0].username} size={84} />
                      </button>
                    ) : <Avatar name={rows[i].username} size={60} />}
                    {i === 0 && <span className="champ-tag">CHAMPION</span>}
                    <b className="pname">{rows[i].username}</b>
                    <span className="ptitle">{TITLE[rows[i].level]}</span>
                    <span className="num pscore"><CountUp value={rows[i].points} /></span>
                    <div className="podium-block"><Medal place={i + 1} /></div>
                  </div>
                ))}
              </div>
            )}
            {rows && rows.length > 0 && (
              <div className="stats-strip">
                <div><span>👥 Players</span><b><CountUp value={rows.length} /></b></div>
                <div><span>⭐ Top score</span><b className="y"><CountUp value={rows[0].points} /></b></div>
                <div><span>🗺 Highest level</span><b>{Math.max(...rows.map((r) => r.level))} / 5</b></div>
                <div><span>🏅 Your rank</span><b>{rank > 0 ? '#' + rank : '—'}</b></div>
              </div>
            )}
          </section>
          <section className="panel board-card pop">
            <div className="row board-head"><h2>🏁 The race to the top</h2><span className="muted small">Each player once, by best score</span></div>
            {!error && <LeaderboardTable rows={rows} me={me?.username} />}
            <p className="muted small">Tap the champion to celebrate. Avatars: DiceBear "Lorelei Neutral" (CC0).</p>
          </section>
        </div>
      </main>
    </div>
  );
}
