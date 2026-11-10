import { useEffect, useRef, useState } from 'react';
import { api } from '../api';
import { bus } from '../events';
import { sound } from '../sfx';
import { onTabHidden, toggleFullscreen } from '../browser';
import { COLOR, MYSTERY_BONUS, bombRows, mysteryBoxes } from '../levels';
import { drawFinishGate, drawScenery, makeScenery, updateScenery } from '../scenery';
import { H, STRIPE, W, laneX, loadImg, ready, sAt, yAt } from '../track';
import Avatar from '../components/Avatar';
import Icon from '../components/Icon';
import CountUp from '../components/CountUp';
import LeaderboardTable from '../components/LeaderboardTable';
import GatePuzzle from './GatePuzzle';

const HIT_FROM = 0.9, HIT_TO = 1.0;               // depth where things reach the runner
const SAFE_TIME = 1.2;                            // seconds without damage after a bomb hit
const SIZE = { bomb: 100, banana: 60, mystery: 92 }; // object sizes at the runner

const IMG = {
  up: loadImg('/assets/runner/up.svg'), down: loadImg('/assets/runner/down.svg'),
  banana: loadImg('/assets/banana.svg'), bomb: loadImg('/assets/bomb.svg'), mystery: loadImg('/assets/mystery.svg'),
};
const clock = (sec) => `${Math.floor(sec / 60)}:${String(Math.floor(sec % 60)).padStart(2, '0')}`;

export default function Game({ levelNo, onPlay, onExit, onLeaderboard }) {
  const canvasRef = useRef(null);
  const game = useRef(null);                      // the running game (shared with the buttons)
  const [levels, setLevels] = useState(null);
  const [me, setMe] = useState(null);
  const [hud, setHud] = useState({ score: 0, hearts: 3, metres: 0, bananas: 0, boxes: 0, bombAhead: false, time: 0 });
  const [toast, setToast] = useState(null);         // "+100 MYSTERY BONUS" pop-up
  const [phase, setPhase] = useState('run');      // run -> gate -> complete, or failed
  const [paused, setPaused] = useState(false);
  const [gateKey, setGateKey] = useState(0);      // new key = new puzzle
  const [result, setResult] = useState(null);
  const [board, setBoard] = useState(null);
  const [muted, setMuted] = useState(sound.isMuted());
  const [error, setError] = useState('');
  const level = levels ? levels[levelNo - 1] : null;
  const me0 = me;                                    // best score before this run (for "New best!")

  // 1. level rules come from the backend as JSON (interoperability)
  useEffect(() => {
    Promise.all([api.levels(), api.progress()])
      .then(([l, p]) => { setLevels(l); setMe(p); })
      .catch((e) => setError(e.message));
  }, [levelNo]);

  // 2. game loop + event listeners
  useEffect(() => {
    if (!level) return;
    const ctx = canvasRef.current.getContext('2d');
    const bg = loadImg('/assets/levels/' + level.background);
    const scenery = makeScenery();
    const s = {
      lane: 1, x: 720, objects: [], score: 0, bananas: 0, boxes: 0, hearts: 3, metres: 0, phase: 'run', paused: false,
      floats: [], sparks: [],                     // floating "+10" texts and little particles
      t: 0, runTime: 0, row: 0, nextBanana: 0.8, safe: 0, flash: 0, shake: 0, banner: 2.2,
    };
    game.current = s;
    const speed = 0.55 * level.speed;             // depth per second
    const metresPerSec = 20 * level.speed;
    const metresPerDepth = metresPerSec / speed;  // used to place the finish gate
    const waves = bombRows(level);
    const firstWave = 60, lastWave = level.distance - 60;
    const gap = (lastWave - firstWave) / waves;
    let nextWave = firstWave;
    // mystery boxes: spread along the run, a bit random, never at the very start or end
    const boxCount = mysteryBoxes(level);
    const boxAt = Array.from({ length: boxCount }, (_, i) =>
      firstWave + 15 + ((i + 0.5) * (lastWave - firstWave)) / boxCount + (Math.random() - 0.5) * gap * 0.6);
    let nextBox = 0;

    const bombAhead = () => s.objects.some((o) => o.type === 'bomb' && o.lane === s.lane && o.p > 0.35 && o.p < 0.88);
    const sync = () => setHud({
      score: s.score, hearts: s.hearts, metres: Math.floor(s.metres), bananas: s.bananas, boxes: s.boxes,
      bombAhead: s.phase === 'run' && bombAhead(), time: s.runTime,
    });

    // Event-driven: each listener does one job (sounds, vibration and confetti listen in effects.js)
    const offs = [
      bus.on('bananaCollected', () => {
        s.score += 10; s.bananas += 1;
        s.floats.push({ text: '+10', x: s.x + 40, y: 700, life: 0.8, color: '#FFD23F', size: 40 });
        burst(s.x, 760, 8, ['#FFD23F', '#FFE27A']);
      }),
      bus.on('mysteryCollected', (e) => {
        s.score += e.bonus; s.boxes += 1; sync();
        burst(s.x, 740, 34, ['#B48CFF', '#FFD23F', '#FFFFFF', '#8E63FF']);
        setToast({ id: performance.now(), bonus: e.bonus });
        setTimeout(() => setToast(null), 1500);
      }),
      bus.on('bombHit', () => {
        s.hearts -= 1; s.safe = SAFE_TIME; s.flash = 0.35; s.shake = 0.3; sync();
        if (s.hearts <= 0) bus.emit('levelFailed');
      }),
      bus.on('finishReached', () => { s.phase = 'gate'; setPhase('gate'); sync(); }),
      bus.on('gateFailed', () => {
        s.hearts -= 1; sync();
        if (s.hearts <= 0) bus.emit('levelFailed');
        else setGateKey((k) => k + 1);           // a new puzzle
      }),
      bus.on('gateSolved', (r) => {
        s.phase = 'complete';
        const total = s.score + r.bonus;
        setResult({ runScore: s.score, bonus: r.bonus, total, highestLevel: r.highestLevel, hearts: s.hearts,
                    bananas: s.bananas, boxes: s.boxes, time: s.runTime, newBest: total > (me0?.bestScore ?? 0) });
        setPhase('complete'); sync();
        api.saveScore(level.id, total).catch(() => {});
      }),
      bus.on('levelFailed', () => {
        s.phase = 'failed'; setPhase('failed'); sync();
        api.leaderboard().then(setBoard).catch(() => setBoard([]));
      }),
    ];

    s.move = (dir) => { if (s.phase === 'run' && !s.paused) s.lane = Math.min(2, Math.max(0, s.lane + dir)); };
    s.setPaused = (value) => {
      if (s.phase !== 'run') return;
      s.paused = value;
      setPaused(value);
      sound.music(!value);
    };
    const onKey = (e) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') s.move(-1);
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') s.move(1);
      if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') s.setPaused(!s.paused);
    };
    window.addEventListener('keydown', onKey);
    const offHidden = onTabHidden(() => s.setPaused(true));   // Page Visibility API
    sound.music(true);

    function burst(x, y, n, colors) {             // little squares that fly out and fall
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2, v = 160 + Math.random() * 320;
        s.sparks.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 220, life: 0.6 + Math.random() * 0.5,
                        size: 6 + Math.random() * 8, color: colors[i % colors.length], spin: Math.random() * 6 });
      }
    }

    function spawnBox() {                         // in a lane that has nothing new in it
      const free = [0, 1, 2].filter((l) => !s.objects.some((o) => o.lane === l && o.p < 0.25));
      const lanes = free.length ? free : [0, 1, 2];
      s.objects.push({ type: 'mystery', lane: lanes[Math.floor(Math.random() * lanes.length)], p: 0 });
    }

    function spawnWave() {                        // 1 or 2 bombs, never all 3 lanes
      const lanes = [0, 1, 2].sort(() => Math.random() - 0.5).slice(0, Math.random() < 0.35 ? 2 : 1);
      lanes.forEach((lane) => s.objects.push({ type: 'bomb', lane, p: 0 }));
    }

    function update(dt) {
      s.t += dt;
      s.safe = Math.max(0, s.safe - dt);
      s.flash = Math.max(0, s.flash - dt);
      s.shake = Math.max(0, s.shake - dt);
      s.banner = Math.max(0, s.banner - dt);
      for (const f of s.floats) { f.y -= 90 * dt; f.life -= dt; }
      for (const k of s.sparks) { k.x += k.vx * dt; k.y += k.vy * dt; k.vy += 900 * dt; k.life -= dt; }
      s.floats = s.floats.filter((f) => f.life > 0);
      s.sparks = s.sparks.filter((k) => k.life > 0);
      if (s.phase !== 'run' || s.paused) return;
      s.runTime += dt;
      updateScenery(scenery, dt, speed);         // the world moves past the runner
      s.metres = Math.min(level.distance, s.metres + metresPerSec * dt);
      s.row = (s.row + speed * dt) % 0.1;
      s.nextBanana -= dt;
      if (s.nextBanana <= 0 && s.metres < level.distance - 40) {
        s.objects.push({ type: 'banana', lane: Math.floor(Math.random() * 3), p: 0 });
        s.nextBanana = 0.5 + Math.random() * 0.7;
      }
      if (s.metres >= nextWave && nextWave <= lastWave) { spawnWave(); nextWave += gap; }
      if (nextBox < boxAt.length && s.metres >= boxAt[nextBox]) { spawnBox(); nextBox += 1; }
      for (const o of s.objects) {
        o.p += speed * dt;
        if (!o.done && o.p > HIT_FROM && o.p < HIT_TO && o.lane === s.lane) {   // reached the runner
          if (o.type === 'banana') { o.done = true; bus.emit('bananaCollected'); }
          else if (o.type === 'mystery') { o.done = true; bus.emit('mysteryCollected', { bonus: MYSTERY_BONUS }); }
          else if (s.safe <= 0) { o.done = true; bus.emit('bombHit'); }
        }
      }
      s.objects = s.objects.filter((o) => o.p < 1.25 && !o.done);
      s.x += (laneX(s.lane, 0.953) - s.x) * Math.min(1, dt * 12);   // smooth lane change
      if (s.metres >= level.distance && s.phase === 'run') bus.emit('finishReached');
    }

    function drawMystery(x, y, size, p) {         // glowing, bobbing box with sparkles around it
      const bob = Math.sin(s.t * 6 + p * 20) * size * 0.08;
      const cy = y - size * 0.55 + bob;
      const glow = ctx.createRadialGradient(x, cy, 0, x, cy, size * 0.95);
      glow.addColorStop(0, 'rgba(180,140,255,0.55)');
      glow.addColorStop(1, 'rgba(180,140,255,0)');
      ctx.fillStyle = glow;
      ctx.beginPath(); ctx.arc(x, cy, size * 0.95, 0, Math.PI * 2); ctx.fill();
      ctx.save();
      ctx.translate(x, cy);
      ctx.rotate(Math.sin(s.t * 4 + p * 9) * 0.12);
      if (ready(IMG.mystery)) ctx.drawImage(IMG.mystery, -size / 2, -size / 2, size, size);
      ctx.restore();
      ctx.fillStyle = '#FFF4C2';
      for (let i = 0; i < 4; i++) {               // 4 little stars going round
        const a = s.t * 2.4 + (i * Math.PI) / 2, r = size * 0.72, k = size * (0.06 + 0.03 * Math.sin(s.t * 8 + i));
        const sx = x + Math.cos(a) * r, sy = cy + Math.sin(a) * r * 0.6;
        ctx.beginPath();
        ctx.moveTo(sx, sy - k * 2); ctx.lineTo(sx + k * 0.6, sy - k * 0.6); ctx.lineTo(sx + k * 2, sy);
        ctx.lineTo(sx + k * 0.6, sy + k * 0.6); ctx.lineTo(sx, sy + k * 2); ctx.lineTo(sx - k * 0.6, sy + k * 0.6);
        ctx.lineTo(sx - k * 2, sy); ctx.lineTo(sx - k * 0.6, sy - k * 0.6); ctx.closePath(); ctx.fill();
      }
    }

    function draw() {
      ctx.save();
      if (s.shake > 0) ctx.translate((Math.random() - 0.5) * 18, (Math.random() - 0.5) * 18);
      if (ready(bg)) ctx.drawImage(bg, 0, 0, W, H);
      else { ctx.fillStyle = '#0E1F17'; ctx.fillRect(0, 0, W, H); }
      ctx.fillStyle = STRIPE[level.id];                  // moving road lines
      for (let p = s.row; p < 1.2; p += 0.1) {
        const y = yAt(p), sc = sAt(y);
        ctx.fillRect(720 - 430 * sc, y, 860 * sc, Math.max(1, 5 * sc));
      }
      drawScenery(ctx, scenery, level.id, yAt, sAt);     // level scenery on both sides
      const metresLeft = level.distance - s.metres;
      drawFinishGate(ctx, 1 - metresLeft / metresPerDepth, metresLeft, yAt, sAt);
      for (const o of [...s.objects].sort((a, b) => a.p - b.p)) {   // far first
        const y = yAt(o.p), sc = sAt(y), size = SIZE[o.type] * sc, x = laneX(o.lane, sc);
        if (o.type === 'mystery') { drawMystery(x, y, size, o.p); continue; }
        if (ready(IMG[o.type])) ctx.drawImage(IMG[o.type], x - size / 2, y - size, size, size);
      }
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.beginPath(); ctx.ellipse(s.x, 862, 50, 12, 0, 0, Math.PI * 2); ctx.fill();
      const blink = s.safe > 0 && Math.floor(s.t * 12) % 2 === 0;          // blinking = safe for a moment
      const running = s.phase === 'run' && !s.paused;
      const frame = running && Math.floor(s.t / 0.15) % 2 ? IMG.down : IMG.up;   // 2 frames = running
      const bob = running ? Math.abs(Math.sin(s.t * 10)) * 8 : 0;
      if (!blink && ready(frame)) ctx.drawImage(frame, s.x - 55, 706 - bob, 110, 160);
      for (const k of s.sparks) {                         // particles
        ctx.globalAlpha = Math.min(1, k.life * 2);
        ctx.fillStyle = k.color;
        ctx.save(); ctx.translate(k.x, k.y); ctx.rotate(k.spin * k.life);
        ctx.fillRect(-k.size / 2, -k.size / 2, k.size, k.size);
        ctx.restore();
      }
      ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
      for (const f of s.floats) {                         // "+10" texts
        ctx.globalAlpha = Math.min(1, f.life * 2);
        ctx.font = `700 ${f.size}px Fredoka, system-ui, sans-serif`;
        ctx.lineWidth = 6; ctx.strokeStyle = 'rgba(0,0,0,0.45)';
        ctx.strokeText(f.text, f.x, f.y);
        ctx.fillStyle = f.color; ctx.fillText(f.text, f.x, f.y);
      }
      ctx.globalAlpha = 1;
      ctx.restore();
      if (s.flash > 0) { ctx.fillStyle = `rgba(255,60,40,${s.flash})`; ctx.fillRect(0, 0, W, H); }
      if (s.banner > 0) {                                 // start banner
        ctx.globalAlpha = Math.min(1, s.banner);
        ctx.fillStyle = '#FFD23F';
        ctx.font = '700 96px Fredoka, system-ui, sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
        ctx.fillText('DODGE THE BOMBS!', 720, 230);
        ctx.globalAlpha = 1;
      }
    }

    let last = performance.now(), raf, hudTime = 0;
    function loop(now) {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      update(dt);
      draw();
      hudTime += dt;
      if (hudTime > 0.15) { hudTime = 0; sync(); }
      raf = requestAnimationFrame(loop);
    }
    raf = requestAnimationFrame(loop);

    return () => {                                     // clean up when leaving the screen
      cancelAnimationFrame(raf);
      window.removeEventListener('keydown', onKey);
      offHidden();
      offs.forEach((off) => off());
      sound.music(false);
    };
  }, [level]);

  function toggleMute() {
    sound.setMuted(!muted);
    setMuted(!muted);
  }

  function tap(e) {                                    // phone: tap the left / right half
    const r = e.currentTarget.getBoundingClientRect();
    game.current?.move(e.clientX - r.left < r.width / 2 ? -1 : 1);
  }

  if (error) return <div className="screen"><div className="panel"><p className="msg">{error}</p><button className="btn ghost" onClick={onExit}>Level map</button></div></div>;
  if (!level) return <div className="screen">Loading level...</div>;
  const hearts = Math.max(0, hud.hearts);
  const pct = Math.min(100, (100 * hud.metres) / level.distance);
  const next = levels[level.id];                      // the next level (undefined on level 5)
  const stars = result ? Math.max(1, result.hearts) : 0;
  return (
    <div className="game" style={{ '--c': COLOR[level.id] }}>
      <canvas ref={canvasRef} width={W} height={H} onPointerDown={tap} />

      <div className="hud-top">
        <div className="hud-card level-hud">
          <div className="row-tight">
            <span className="pill" style={{ background: COLOR[level.id] }}>LEVEL {level.id}</span>
            <b>{level.name}</b>
          </div>
          <div className="bar"><div style={{ width: pct + '%', background: COLOR[level.id] }} /></div>
          <span className="muted small">{hud.metres} / {level.distance} m</span>
        </div>
        <div className="hud-card"><span className="label">SCORE</span><b className="num big">{hud.score.toLocaleString()}</b></div>
        <div className="hud-card bananas">
          <span className="count" key={'b' + hud.bananas}><img src="/assets/banana.svg" alt="Bananas" /><b className="num">× {hud.bananas}</b></span>
          <span className="sep" />
          <span className="count" key={'m' + hud.boxes}><img src="/assets/mystery.svg" alt="Mystery boxes" /><b className="num">× {hud.boxes}</b></span>
        </div>
        <div className="hud-hearts" key={hearts}>
          {[0, 1, 2].map((i) => <span key={i} className={i < hearts ? 'heart' : 'heart lost'}>♥</span>)}
        </div>
        <div className="hud-right">
          <button className="icon-btn" title={muted ? 'Sound off' : 'Sound on'} aria-label={muted ? 'Sound off' : 'Sound on'} onClick={toggleMute}><Icon name={muted ? 'soundOff' : 'soundOn'} /></button>
          <button className="icon-btn" title="Pause (P)" aria-label={paused ? 'Resume' : 'Pause'} onClick={() => game.current?.setPaused(!paused)} disabled={phase !== 'run'}><Icon name={paused ? 'play' : 'pause'} /></button>
          <button className="icon-btn" title="Full screen" aria-label="Full screen" onClick={toggleFullscreen}><Icon name="full" /></button>
          {me && <span className="user-pill"><Avatar name={me.username} size={30} />{me.username}</span>}
          <button className="icon-btn" title="Level map" aria-label="Back to level map" onClick={onExit}><Icon name="close" /></button>
        </div>
      </div>

      <div className="hud-bottom">
        <div className="hud-card lane-hint">
          <button className="key-btn" onPointerDown={() => game.current?.move(-1)}>←</button>
          <button className="key-btn" onPointerDown={() => game.current?.move(1)}>→</button>
          <span className="muted">or A / D to switch lane</span>
        </div>
        {hud.bombAhead && <div className="bomb-ahead">BOMB AHEAD</div>}
        {toast && (
          <div className="mystery-toast" key={toast.id} role="status">
            <img src="/assets/mystery.svg" alt="" />
            <div><b>+{toast.bonus}</b><span>MYSTERY BONUS!</span></div>
          </div>
        )}
        <div className="hud-card speed-chip">
          <span>⚡ Speed <b>{level.speed}×</b></span>
          <span className="sep" />
          <span>Puzzle time <b className="danger">{level.puzzleTime}s</b></span>
        </div>
      </div>

      {paused && phase === 'run' && (
        <div className="overlay">
          <div className="panel pop center col">
            <h1>Paused</h1>
            <p className="muted">Press P or Esc to go on.</p>
            <div className="row center">
              <button className="btn primary" onClick={() => game.current?.setPaused(false)}>▶ Resume</button>
              <button className="btn ghost" onClick={onExit}>Level map</button>
            </div>
          </div>
        </div>
      )}

      {phase === 'gate' && <GatePuzzle key={gateKey} level={level} hearts={hearts} />}

      {phase === 'failed' && (
        <div className="overlay">
          <div className="over-grid">
            <section className="panel over-card pop">
              <div className="boom">
                <span className="boom-icon">💥</span>
                <div>
                  <h1 className="boom-title">Out of hearts!</h1>
                  <p className="muted">Level {level.id} · {level.name} ({hud.metres} / {level.distance} m)</p>
                </div>
              </div>
              <span className="label">RUN SCORE</span>
              <b className="num huge">{hud.score.toLocaleString()}</b>
              <div className="lines">
                <div><span>Distance</span><b>{hud.metres} m</b></div>
                <div><span>Bananas ({hud.bananas} × 10)</span><b>{hud.bananas * 10}</b></div>
                <div><span>Mystery boxes ({hud.boxes} × {MYSTERY_BONUS})</span><b>{hud.boxes * MYSTERY_BONUS}</b></div>
                <div><span>Time</span><b>{clock(hud.time)}</b></div>
              </div>
              <p className="muted small">The level starts again with 3 hearts. Only finished levels go on the leaderboard.</p>
              <div className="row">
                <button className="btn primary big grow glow" onClick={() => onPlay(level.id)}>↻ Restart level {level.id}</button>
                <button className="btn ghost big" onClick={onExit}>Level map</button>
              </div>
            </section>
            <section className="panel pop">
              <div className="row"><h2>Leaderboard</h2><span className="chip">Top 6</span></div>
              <LeaderboardTable rows={board} me={me?.username} limit={6} />
            </section>
          </div>
        </div>
      )}

      {phase === 'complete' && result && (
        <div className="overlay">
          <section className="panel done-card pop">
            <div className="stars">
              {[1, 2, 3].map((i) => <span key={i} className={i <= stars ? 'star on' : 'star'}>★</span>)}
            </div>
            <h1 className="done-title">{level.id < 5 ? `Level ${level.id} cleared!` : 'You beat the Bomb Factory!'}</h1>
            <p className="muted">
              {level.name} · {level.distance} m in {clock(result.time)} · {3 - result.hearts === 0 ? 'no hearts lost' : `lost ${3 - result.hearts} heart${3 - result.hearts > 1 ? 's' : ''}`}, so {stars} of 3 stars
            </p>
            {result.newBest && <span className="new-best">★ New best score!</span>}
            <div className="tiles five">
              <div className="tile"><span>Level score</span><b className="num y">+<CountUp value={result.total} /></b></div>
              <div className="tile"><span>Bananas</span><b className="num">{result.bananas}</b></div>
              <div className="tile"><span>Mystery boxes</span><b className="num purple">{result.boxes} <small>× {MYSTERY_BONUS}</small></b></div>
              <div className="tile"><span>Gate bonus</span><b className="num">+{result.bonus}</b></div>
              <div className="tile"><span>Hearts left</span><b className="num">{result.hearts} <span className="danger">♥</span></b></div>
            </div>
            {next && result.highestLevel > level.id && (
              <div className="next-card" style={{ '--n': COLOR[next.id] }}>
                <span className="next-num">{next.id}</span>
                <div>
                  <b>Next: {next.name}</b>
                  <div className="chips">
                    <span className="chip dark">Speed {next.speed}×</span>
                    <span className="chip dark danger">Puzzle {next.puzzleTime}s</span>
                    <span className="chip dark">{next.distance.toLocaleString()} m</span>
                    <span className="chip dark">{bombRows(next)} bomb rows</span>
                    <span className="chip dark purple">{mysteryBoxes(next)} mystery box{mysteryBoxes(next) > 1 ? 'es' : ''}</span>
                  </div>
                </div>
              </div>
            )}
            <div className="row">
              <button className="btn ghost big" onClick={onExit}>Level map</button>
              <button className="btn ghost big" onClick={onLeaderboard}>Leaderboard</button>
              {next && result.highestLevel > level.id
                ? <button className="btn primary big grow glow" onClick={() => onPlay(next.id)}>Next level →</button>
                : <button className="btn primary big grow" onClick={() => onPlay(level.id)}>Play again</button>}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
