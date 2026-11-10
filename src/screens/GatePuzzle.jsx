import { useEffect, useRef, useState } from 'react';
import { api } from '../api';
import { bus } from '../events';

const RING = 2 * Math.PI * 62;   // length of the timer ring

// The level gate at the finish line: a Banana API puzzle (through our backend) with a timer.
// It only emits events (gateSolved / gateFailed). The Game screen decides what happens next.
export default function GatePuzzle({ level, hearts }) {
  const [puzzle, setPuzzle] = useState(null);
  const [error, setError] = useState('');
  const [loaded, setLoaded] = useState(false);
  const [left, setLeft] = useState(level.puzzleTime);
  const [answer, setAnswer] = useState('');
  const [result, setResult] = useState(null);   // { ok, text }
  const [tries, setTries] = useState(0);        // +1 = get another puzzle after an error
  const done = useRef(false);

  // 1. get a puzzle from the backend (it calls the Banana API and keeps the solution)
  useEffect(() => {
    let alive = true;
    setError(''); setPuzzle(null); setLoaded(false); setResult(null); setAnswer(''); done.current = false;
    api.puzzle(level.id)
      .then((p) => { if (alive) { setPuzzle(p); setLeft(p.timeLimit); } })
      .catch((e) => { if (alive) setError(e.message); });
    return () => { alive = false; };
  }, [tries]);

  // 2. the timer starts only after the image has loaded (fair on slow internet)
  useEffect(() => {
    if (!loaded || done.current) return;
    if (left <= 0) { submit(true); return; }
    if (left <= 5) bus.emit('tick');
    const t = setTimeout(() => setLeft((l) => l - 1), 1000);
    return () => clearTimeout(t);
  }, [loaded, left]);

  // 3. keyboard: numbers type, Backspace clears, Enter unlocks
  useEffect(() => {
    const onKey = (e) => {
      if (/^[0-9]$/.test(e.key)) press(e.key);
      if (e.key === 'Backspace') setAnswer('');
      if (e.key === 'Enter') submit(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  function press(d) {
    if (!loaded || done.current) return;
    setAnswer((a) => (a + d).slice(-2));
  }

  async function submit(timeUp) {
    if (!puzzle || !loaded || done.current) return;
    if (!timeUp && answer === '') return;
    done.current = true;
    try {
      const r = await api.answer(puzzle.puzzleId, timeUp ? -1 : Number(answer));
      if (r.correct) {
        setResult({ ok: true, text: `GATE OPEN! +${r.bonus} bonus` });
        setTimeout(() => bus.emit('gateSolved', r), 1000);
      } else {
        setResult({ ok: false, text: timeUp || r.timeUp ? "Time's up! -1 heart" : 'Wrong answer! -1 heart' });
        setTimeout(() => bus.emit('gateFailed', r), 1200);
      }
    } catch (e) {
      setResult({ ok: false, text: e.message + ' - getting a new puzzle' });
      setTimeout(() => setTries((n) => n + 1), 1300);
    }
  }

  const red = left <= 5;
  const unlockText = level.id < 5 ? `unlock Level ${level.id + 1}` : 'win the game';
  return (
    <div className="overlay">
      <div className={result && !result.ok ? 'panel gate shake' : 'panel gate pop'}>
        <div className="gate-head">
          <span className="gate-icon">🔒</span>
          <div>
            <h2 className="gate-title">LEVEL GATE!</h2>
            <p className="muted">Level {level.id} · {level.name} — solve it in <b>{level.puzzleTime} seconds</b> to {unlockText}</p>
          </div>
          <span className="hearts big">
            {[0, 1, 2].map((i) => <span key={i} className={i < hearts ? '' : 'lost'}>♥</span>)}
          </span>
        </div>

        <div className="gate-body">
          <div className="question">
            <span className="tag">BANANA API · question image</span>
            {error ? (
              <div className="center col">
                <p className="msg">{error}</p>
                <button className="btn primary" onClick={() => setTries((n) => n + 1)}>Try again</button>
              </div>
            ) : puzzle ? (
              <img src={puzzle.image} alt="Banana puzzle" onLoad={() => setLoaded(true)}
                   onError={() => setError('Could not load the puzzle image')} />
            ) : (
              <p className="muted">Getting a puzzle from the Banana API...</p>
            )}
          </div>
          <div className="ring-box">
            <svg viewBox="0 0 150 150" className="ring">
              <circle cx="75" cy="75" r="62" className="ring-bg" />
              <circle cx="75" cy="75" r="62" className={red ? 'ring-fg red' : 'ring-fg'}
                      strokeDasharray={RING} strokeDashoffset={RING * (1 - Math.max(0, left) / level.puzzleTime)} />
            </svg>
            <div className="ring-text">
              <b className={red ? 'danger' : ''}>{String(Math.max(0, left)).padStart(2, '0')}</b>
              <span>seconds left</span>
            </div>
            <p className="muted small">Last 5 seconds turn red</p>
          </div>
        </div>

        <div className="gate-input">
          <div className="answer-box"><span>Your answer</span><b>{answer || '–'}</b></div>
          <div className="keypad">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'].map((d) => (
              <button key={d} className={answer.endsWith(d) ? 'key on' : 'key'} disabled={!loaded || done.current} onClick={() => press(d)}>{d}</button>
            ))}
          </div>
          <div className="gate-actions">
            <button className="btn ghost" onClick={() => setAnswer('')} disabled={done.current}>Clear</button>
            <button className="btn primary" onClick={() => submit(false)} disabled={!loaded || done.current || answer === ''}>Unlock</button>
          </div>
        </div>

        {result ? (
          <p className={result.ok ? 'result ok' : 'result bad'}>{result.text}</p>
        ) : (
          <div className="rules">
            <span className="ok">Correct: +{200 * level.id} + 20 × seconds left, next level unlocked</span>
            <span className="bad">Wrong or time out: -1 heart, new puzzle</span>
          </div>
        )}
      </div>
    </div>
  );
}
