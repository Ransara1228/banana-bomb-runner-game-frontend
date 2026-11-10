import Avatar from './Avatar';
import PartyHat from './PartyHat';
import { COLOR } from '../levels';

// Leaderboard table: rank, player, level, best score. Each row has a little race track:
// the runner stops at the player's score compared with the top score (the flag).
// The logged-in player's row is highlighted, and the player in 1st place wears a party hat.
export default function LeaderboardTable({ rows, me, limit = 10 }) {
  if (!rows) return <p className="muted">Loading...</p>;
  if (rows.length === 0) return <p className="muted">No scores yet. Finish a level to be the first!</p>;
  const top = rows[0].points || 1;
  return (
    <div className="lb">
      <div className="lb-head">
        <span>Rank</span><span>Player</span><span className="c">Level</span><span className="r">Best score</span>
      </div>
      {rows.slice(0, limit).map((r, i) => {
        const mine = me && r.username === me;
        const pct = Math.max(6, (100 * r.points) / top);
        return (
          <div key={r.id} className={mine ? 'lb-row me' : 'lb-row'} style={{ animationDelay: i * 0.06 + 's' }}>
            <span className={'rank r' + (i + 1)}>{i + 1}</span>
            <span className="player">
              <span className="who">
                <span className="lb-avatar">
                  {i === 0 && <span className="mini-hat"><PartyHat size={20} /></span>}
                  <Avatar name={r.username} size={34} />
                </span>
                <span className="name">{r.username}{mine && ' (you)'}</span>
              </span>
              <span className="race" aria-hidden="true">
                <span className="race-track"><span className="race-fill" style={{ width: pct + '%', animationDelay: 0.2 + i * 0.08 + 's' }} /></span>
                <span className="race-runner" style={{ '--to': pct + '%', animationDelay: 0.2 + i * 0.08 + 's' }}>
                  <img src="/assets/runner/up.svg" alt="" />
                </span>
                <span className="race-flag">🏁</span>
              </span>
            </span>
            <span className="c"><span className="lv-badge" style={{ '--c': COLOR[r.level] || '#A9BFB2' }}>L{r.level}</span></span>
            <b className="r">{r.points.toLocaleString()}</b>
          </div>
        );
      })}
    </div>
  );
}
