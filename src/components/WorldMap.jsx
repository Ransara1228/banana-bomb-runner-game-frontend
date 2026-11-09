import { useEffect, useRef, useState } from 'react';
import { COLOR } from '../levels';
import Avatar from './Avatar';

// The level map, drawn like a game world map (SVG, 1600 x 900 units).
// Every level has its own place: jungle, river bridge, temple, volcano, bomb factory.
// Locked places are under fog. The level buttons sit on top of the picture at the same spots.
const P = [[230, 700], [520, 520], [820, 650], [1110, 440], [1390, 240]];   // level spots
const pct = ([x, y]) => ({ left: (x / 1600) * 100 + '%', top: (y / 900) * 100 + '%' });   // before we know the size
const road = (a, b) => {                       // a soft S-curve from one spot to the next
  const dx = (b[0] - a[0]) * 0.55;
  return `M${a[0]} ${a[1]} C${a[0] + dx} ${a[1]} ${b[0] - dx} ${b[1]} ${b[0]} ${b[1]}`;
};

function Tree({ x, y, s = 1 }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <rect x="-5" y="-6" width="10" height="34" rx="3" fill="#5A3B22" />
      <circle cx="0" cy="-26" r="30" fill="#256B42" />
      <circle cx="-18" cy="-12" r="20" fill="#2E7D4F" />
      <circle cx="16" cy="-14" r="22" fill="#3A9A60" />
      <circle cx="-6" cy="-36" r="12" fill="#4FB774" opacity=".7" />
    </g>
  );
}

function Cloud({ y, s, cls }) {
  return (
    <g className={'cloud ' + cls} transform={`translate(0 ${y}) scale(${s})`}>
      <ellipse cx="0" cy="0" rx="70" ry="26" fill="#F4F1E8" opacity=".55" />
      <ellipse cx="-38" cy="6" rx="40" ry="20" fill="#F4F1E8" opacity=".5" />
      <ellipse cx="40" cy="8" rx="46" ry="18" fill="#F4F1E8" opacity=".45" />
    </g>
  );
}

export default function WorldMap({ levels, highest, selected, me, onSelect, onPlay }) {
  const [nudge, setNudge] = useState(null);    // a locked level the player tried to open
  const box = useRef(null);
  const [size, setSize] = useState(null);       // the map's size on screen, to put the buttons on the picture

  useEffect(() => {
    const el = box.current;
    const measure = () => setSize({ w: el.clientWidth, h: el.clientHeight });
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // The picture keeps its shape and sits in the middle (like the SVG "meet" rule), so do the same maths here.
  function at([x, y]) {
    if (!size) return pct([x, y]);
    const k = Math.min(size.w / 1600, size.h / 900);
    return { left: (size.w - 1600 * k) / 2 + x * k, top: (size.h - 900 * k) / 2 + y * k };
  }

  function click(l) {
    if (l.id > highest) {
      setNudge(l.id);
      setTimeout(() => setNudge((n) => (n === l.id ? null : n)), 1600);
      return;
    }
    if (l.id === selected) onPlay(l.id);        // second click on the same level = play
    else onSelect(l.id);
  }

  return (
    <div className="world" ref={box}>
      <svg className="world-art" viewBox="0 0 1600 900" aria-hidden="true">
        <defs>
          <radialGradient id="wm-ground" gradientUnits="userSpaceOnUse" cx="800" cy="480" r="1150">
            <stop offset="0" stopColor="#21502F" /><stop offset="1" stopColor="#132E1E" />
          </radialGradient>
          <linearGradient id="wm-volcano" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#6B3A2A" /><stop offset="1" stopColor="#2E1A14" />
          </linearGradient>
          <radialGradient id="wm-lava" cx="50%" cy="50%" r="50%">
            <stop offset="0" stopColor="#FFE27A" /><stop offset=".5" stopColor="#FF8A3D" /><stop offset="1" stopColor="#FF5A4E" stopOpacity="0" />
          </radialGradient>
          <filter id="wm-blur" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="24" /></filter>
          <filter id="wm-soft" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="6" /></filter>
        </defs>

        {/* ground and the colour of each place */}
        <rect x="-1200" y="-900" width="4000" height="2700" fill="url(#wm-ground)" />   {/* big enough to fill tall or wide screens */}
        {[[-120, 120], [-60, 420], [-140, 760], [1700, 120], [1660, 520], [1740, 820]].map(([x, y], i) => <Tree key={'e' + i} x={x} y={y} s={1.1} />)}
        {[[80, -40], [300, -90], [1000, -60], [1300, -110], [140, 980], [420, 1040], [900, 990], [1200, 1060], [1500, 980]].map(([x, y], i) => <Tree key={'b' + i} x={x} y={y} s={1.2} />)}
        <ellipse cx="230" cy="740" rx="300" ry="190" fill="#2A6B3E" opacity=".45" filter="url(#wm-soft)" />
        <ellipse cx="880" cy="640" rx="230" ry="140" fill="#6E5F43" opacity=".35" filter="url(#wm-soft)" />
        <ellipse cx="1190" cy="470" rx="260" ry="150" fill="#4A2A20" opacity=".55" filter="url(#wm-soft)" />
        <ellipse cx="1430" cy="200" rx="230" ry="150" fill="#2E2C4A" opacity=".7" filter="url(#wm-soft)" />

        {/* river with moving water */}
        <path d="M730 -400 C 730 -260, 700 -120, 700 -20 C 600 240, 740 420, 650 570 S 520 800, 570 930 S 640 1200, 600 1400" fill="none" stroke="#1B4F66" strokeWidth="86" strokeLinecap="round" />
        <path d="M730 -400 C 730 -260, 700 -120, 700 -20 C 600 240, 740 420, 650 570 S 520 800, 570 930 S 640 1200, 600 1400" fill="none" stroke="#25708F" strokeWidth="58" strokeLinecap="round" />
        <path className="river-flow" d="M730 -400 C 730 -260, 700 -120, 700 -20 C 600 240, 740 420, 650 570 S 520 800, 570 930 S 640 1200, 600 1400" fill="none" stroke="#8FD0EA" strokeWidth="4" strokeDasharray="16 46" strokeLinecap="round" opacity=".6" />
        <circle cx="664" cy="300" r="11" fill="#3DA060" /><circle cx="684" cy="318" r="7" fill="#3DA060" />
        <circle cx="590" cy="760" r="10" fill="#3DA060" />

        {/* level 1: jungle */}
        <Tree x={90} y={640} s={1.1} /><Tree x={150} y={860} s={1.2} /><Tree x={360} y={820} s={1} />
        <Tree x={60} y={800} /><Tree x={400} y={660} s={0.8} /><Tree x={300} y={560} s={0.9} />
        <Tree x={120} y={520} s={0.8} /><Tree x={470} y={880} s={1.1} />
        {[[180, 600], [330, 760], [80, 720], [420, 740]].map(([x, y], i) => (
          <circle key={i} className={'firefly f' + (i % 3)} cx={x} cy={y} r="4" fill="#FFE27A" />
        ))}

        {/* level 3: temple ruins */}
        <g transform="translate(960 560)">
          <rect x="-90" y="40" width="180" height="34" fill="#8E7349" />
          <rect x="-70" y="10" width="140" height="34" fill="#A88B5E" />
          <rect x="-48" y="-20" width="96" height="34" fill="#BB9E6C" />
          <rect x="-26" y="-56" width="52" height="40" fill="#C9A26B" />
          <rect x="-9" y="-40" width="18" height="24" rx="9" fill="#2A1E0C" />
          <polygon points="-34,-56 0,-80 34,-56" fill="#8E7349" />
        </g>
        <rect x="700" y="700" width="16" height="56" fill="#9A8460" /><rect x="732" y="716" width="16" height="40" fill="#9A8460" />
        <rect x="692" y="694" width="64" height="12" fill="#B39B70" />

        {/* level 4: volcano with lava and smoke */}
        <polygon points="1040,520 1215,240 1260,240 1420,520" fill="url(#wm-volcano)" />
        <path d="M1225 250 C 1215 320, 1250 360, 1230 430 S 1200 480, 1215 520" fill="none" stroke="#FF6A2A" strokeWidth="9" strokeLinecap="round" opacity=".85" />
        <ellipse className="lava-glow" cx="1238" cy="246" rx="44" ry="20" fill="url(#wm-lava)" />
        <circle className="smoke s1" cx="1236" cy="210" r="22" fill="#6B6560" />
        <circle className="smoke s2" cx="1250" cy="190" r="26" fill="#57524E" />
        <circle className="smoke s3" cx="1226" cy="170" r="30" fill="#4A4643" />

        {/* level 5: bomb factory */}
        <g transform="translate(1430 110)">
          <rect x="0" y="40" width="140" height="100" fill="#3B3F5C" />
          <polygon points="0,40 35,10 35,40 70,10 70,40 105,10 105,40 140,10 140,40" fill="#4A4F72" />
          <rect x="18" y="-30" width="18" height="60" fill="#2E314A" /><rect x="92" y="-50" width="20" height="80" fill="#2E314A" />
          <rect className="window w1" x="18" y="70" width="24" height="18" rx="3" fill="#FFD23F" />
          <rect className="window w2" x="58" y="70" width="24" height="18" rx="3" fill="#FFD23F" />
          <rect className="window w3" x="98" y="70" width="24" height="18" rx="3" fill="#FFD23F" />
          <rect x="0" y="126" width="140" height="14" fill="#FFD23F" />
          {[0, 28, 56, 84, 112].map((x) => <polygon key={x} points={`${x},140 ${x + 14},126 ${x + 26},126 ${x + 12},140`} fill="#2A2100" />)}
          <circle className="smoke s1" cx="27" cy="-44" r="16" fill="#5A5870" />
          <circle className="smoke s2" cx="102" cy="-66" r="20" fill="#4C4A60" />
        </g>
        <circle cx="1560" cy="270" r="14" fill="#1E1E24" /><circle cx="1538" cy="276" r="12" fill="#1E1E24" /><circle cx="1550" cy="254" r="11" fill="#1E1E24" />

        {/* the road between the levels: bright when open, dark when locked */}
        {P.slice(0, -1).map((a, i) => {
          const open = i + 2 <= highest;
          const d = road(a, P[i + 1]);
          return (
            <g key={i}>
              <path d={d} fill="none" stroke="#0E2117" strokeWidth="44" strokeLinecap="round" opacity=".55" />
              <path d={d} fill="none" stroke={open ? '#C9A26B' : '#3E4F43'} strokeWidth="32" strokeLinecap="round" />
              <path d={d} fill="none" stroke={open ? '#F4E2B8' : '#56685B'} strokeWidth="3" strokeDasharray="12 16" strokeLinecap="round" />
              {open && <path className="road-glow" d={d} fill="none" stroke="#FFD23F" strokeWidth="5" strokeDasharray="2 22" strokeLinecap="round" />}
            </g>
          );
        })}

        {/* wooden bridge where the road crosses the river (level 1 -> 2 -> 3) */}
        <g transform="translate(652 588) rotate(18)">
          <rect x="-64" y="-26" width="128" height="52" rx="6" fill="#8B5A2B" />
          {[-52, -36, -20, -4, 12, 28, 44].map((x) => <rect key={x} x={x} y="-26" width="10" height="52" fill="#A86E37" />)}
          <rect x="-66" y="-32" width="132" height="8" rx="4" fill="#5A3B22" /><rect x="-66" y="24" width="132" height="8" rx="4" fill="#5A3B22" />
        </g>

        {/* fog over the places that are still locked */}
        {levels.filter((l) => l.id > highest).map((l) => (
          <g key={l.id} className="fog">
            <ellipse cx={P[l.id - 1][0]} cy={P[l.id - 1][1] - 20} rx="210" ry="140" fill="#DCE8E0" opacity=".3" filter="url(#wm-blur)" />
            <ellipse cx={P[l.id - 1][0] + 60} cy={P[l.id - 1][1] - 70} rx="150" ry="90" fill="#DCE8E0" opacity=".22" filter="url(#wm-blur)" />
          </g>
        ))}

        <Cloud y={90} s={1.2} cls="c1" /><Cloud y={190} s={0.8} cls="c2" /><Cloud y={60} s={1} cls="c3" />
      </svg>

      <div className="world-title">
        <h1>Choose your level</h1>
        <p>Each level runs faster and gives you less time at the gate.</p>
      </div>
      <span className="world-hint">← → choose · Enter play · click twice to play</span>

      {levels.map((l, i) => {
        const locked = l.id > highest;
        const current = l.id === highest;
        const cls = ['node', locked ? 'locked' : '', l.id === selected ? 'sel' : '', current ? 'current' : '', nudge === l.id ? 'nudge' : ''].join(' ');
        return (
          <button key={l.id} className={cls} aria-disabled={locked} onClick={() => click(l)}
                  aria-label={`Level ${l.id}, ${l.name}${locked ? ', locked' : ''}`}
                  style={{ ...at(P[i]), '--c': COLOR[l.id] }}>
            <span className="node-circle">{locked ? '🔒' : l.id}</span>
            {current && <span className="badge">PLAY NOW</span>}
            {!locked && !current && <span className="done">✓ cleared</span>}
            <span className="node-name">{l.name}</span>
            <span className="node-sub">{l.speed}× · {l.puzzleTime}s puzzle</span>
            {nudge === l.id && <span className="lock-tip">🔒 Clear {levels[l.id - 2].name} first</span>}
          </button>
        );
      })}

      {me && (
        <span className="you-pin" style={at(P[Math.min(highest, levels.length) - 1])} aria-hidden="true">
          <Avatar name={me.username} size={36} />
          <b>YOU</b>
        </span>
      )}
    </div>
  );
}
