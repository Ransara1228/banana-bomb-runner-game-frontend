// Moving scenery for each level, drawn on the canvas with the same perspective as the road.
// Things start far away (p = 0) and come towards the runner (p = 1), so the world feels like it moves.
const rand = (a, b) => a + Math.random() * (b - a);

export function makeScenery() {
  const sc = { items: [], next: 0 };
  for (let p = 0; p < 1.2; p += 0.06) spawn(sc, p);   // fill the road sides at the start
  return sc;
}

function spawn(sc, p = 0) {
  for (const side of [-1, 1]) sc.items.push({ p: p + rand(0, 0.03), side, off: rand(40, 620), kind: Math.random() });
}

export function updateScenery(sc, dt, speed) {
  sc.next -= dt;
  if (sc.next <= 0) { spawn(sc); sc.next = rand(0.1, 0.2) / Math.max(0.6, speed); }
  for (const it of sc.items) it.p += speed * dt;
  sc.items = sc.items.filter((it) => it.p < 1.35);
}

function circle(ctx, x, y, r, color) {
  ctx.fillStyle = color; ctx.beginPath(); ctx.arc(x, y, Math.max(0.5, r), 0, Math.PI * 2); ctx.fill();
}

const DRAW = {
  1(ctx, it, x, y, s) {                               // jungle: bushes and trees
    if (it.kind < 0.2) {
      ctx.fillStyle = '#6B4A2B'; ctx.fillRect(x - 6 * s, y - 110 * s, 12 * s, 110 * s);
      circle(ctx, x, y - 130 * s, 55 * s, '#2E8B3A'); circle(ctx, x - 30 * s, y - 110 * s, 38 * s, '#38A346');
    } else {
      circle(ctx, x - 40 * s, y - 30 * s, 42 * s, '#2E8B3A');
      circle(ctx, x + 10 * s, y - 45 * s, 55 * s, '#38A346');
      circle(ctx, x + 55 * s, y - 28 * s, 38 * s, '#2A7A33');
      circle(ctx, x + 5 * s, y - 75 * s, 12 * s, 'rgba(255,255,255,0.15)');
    }
  },
  2(ctx, it, x, y, s) {                               // river: bridge posts, lily pads, ripples
    if (it.kind < 0.35) {
      const px = 720 + it.side * 445 * s;
      ctx.fillStyle = '#6B3F22'; ctx.fillRect(px - 8 * s, y - 55 * s, 16 * s, 60 * s);
      ctx.fillStyle = '#8A5530'; ctx.fillRect(px - 8 * s, y - 55 * s, 16 * s, 8 * s);
    } else if (it.kind < 0.8) {
      ctx.fillStyle = '#3DAA4F'; ctx.beginPath(); ctx.ellipse(x, y, 42 * s, 15 * s, 0, 0.3, Math.PI * 2); ctx.lineTo(x, y); ctx.fill();
      if (it.kind > 0.7) circle(ctx, x + 10 * s, y - 6 * s, 8 * s, '#FF9BC4');
    } else {
      ctx.strokeStyle = 'rgba(255,255,255,0.45)'; ctx.lineWidth = Math.max(1, 2 * s);
      ctx.beginPath(); ctx.ellipse(x, y, 50 * s, 10 * s, 0, 0, Math.PI * 2); ctx.stroke();
    }
  },
  3(ctx, it, x, y, s) {                               // temple: stone lanterns and dark bushes
    if (it.kind < 0.4) {
      const lx = 720 + it.side * (480 + it.off * 0.3) * s;
      ctx.fillStyle = '#7A7670'; ctx.fillRect(lx - 26 * s, y - 20 * s, 52 * s, 20 * s);
      ctx.fillStyle = '#8C8880'; ctx.fillRect(lx - 16 * s, y - 80 * s, 32 * s, 60 * s);
      ctx.fillStyle = '#FFC46B'; ctx.fillRect(lx - 9 * s, y - 68 * s, 18 * s, 18 * s);
      ctx.fillStyle = '#6E6A64'; ctx.beginPath();
      ctx.moveTo(lx - 34 * s, y - 80 * s); ctx.lineTo(lx, y - 110 * s); ctx.lineTo(lx + 34 * s, y - 80 * s); ctx.fill();
    } else {
      circle(ctx, x, y - 30 * s, 45 * s, '#2E3A2C'); circle(ctx, x + 40 * s, y - 22 * s, 32 * s, '#26302A');
    }
  },
  4(ctx, it, x, y, s) {                               // volcano: rocks and glowing lava pools
    if (it.kind < 0.55) {
      ctx.fillStyle = '#3A2A24'; ctx.beginPath();
      ctx.moveTo(x - 50 * s, y); ctx.lineTo(x - 30 * s, y - 50 * s); ctx.lineTo(x + 15 * s, y - 65 * s);
      ctx.lineTo(x + 50 * s, y - 20 * s); ctx.lineTo(x + 45 * s, y); ctx.fill();
      ctx.fillStyle = '#4A362E'; ctx.fillRect(x - 20 * s, y - 50 * s, 18 * s, 10 * s);
    } else {
      ctx.fillStyle = 'rgba(255,106,31,0.35)'; ctx.beginPath(); ctx.ellipse(x, y, 70 * s, 22 * s, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#FF7A2B'; ctx.beginPath(); ctx.ellipse(x, y, 45 * s, 12 * s, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#FFD23F'; ctx.beginPath(); ctx.ellipse(x, y, 18 * s, 5 * s, 0, 0, Math.PI * 2); ctx.fill();
    }
  },
  5(ctx, it, x, y, s) {                               // bomb factory at night: lamp posts and crates
    if (it.kind < 0.35) {
      const lx = 720 + it.side * 470 * s;
      ctx.fillStyle = '#2B2F45'; ctx.fillRect(lx - 4 * s, y - 150 * s, 8 * s, 150 * s);
      const g = ctx.createRadialGradient(lx, y - 155 * s, 1, lx, y - 155 * s, 60 * s);
      g.addColorStop(0, 'rgba(255,214,90,0.9)'); g.addColorStop(1, 'rgba(255,214,90,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(lx, y - 155 * s, 60 * s, 0, Math.PI * 2); ctx.fill();
      circle(ctx, lx, y - 155 * s, 9 * s, '#FFE7A3');
    } else if (it.kind < 0.75) {
      ctx.fillStyle = '#6B4A2E'; ctx.fillRect(x - 35 * s, y - 70 * s, 70 * s, 70 * s);
      ctx.strokeStyle = '#4A3220'; ctx.lineWidth = Math.max(1, 5 * s);
      ctx.beginPath(); ctx.moveTo(x - 35 * s, y - 70 * s); ctx.lineTo(x + 35 * s, y); ctx.moveTo(x + 35 * s, y - 70 * s); ctx.lineTo(x - 35 * s, y); ctx.stroke();
    } else {
      circle(ctx, x, y - 28 * s, 28 * s, '#22253A');
      ctx.fillStyle = '#FF5A4E'; ctx.fillRect(x - 3 * s, y - 64 * s, 6 * s, 10 * s);
    }
  },
};

export function drawScenery(ctx, sc, levelId, yAt, sAt) {
  const draw = DRAW[levelId] || DRAW[1];
  for (const it of [...sc.items].sort((a, b) => a.p - b.p)) {
    if (it.p <= 0.02) continue;
    const y = yAt(Math.min(it.p, 1.3)), s = sAt(y);
    if (s <= 0) continue;
    const x = 720 + it.side * (450 + it.off) * s;
    draw(ctx, it, x, y, s);
  }
}

/** The FINISH gate: far away it sits on the horizon, then it comes closer. */
export function drawFinishGate(ctx, finishP, metresLeft, yAt, sAt) {
  const p = Math.max(0, Math.min(1, finishP));
  const y = yAt(p), s = sAt(y);
  const k = Math.max(1, (s / 0.094) * 0.3);
  const w = 250 * k, h = 34 * k, top = y - 96 * k;
  ctx.fillStyle = '#F4F1E8';
  ctx.fillRect(720 - w / 2, top, 5 * k, y - top);
  ctx.fillRect(720 + w / 2 - 5 * k, top, 5 * k, y - top);
  ctx.fillStyle = '#10241A';
  ctx.strokeStyle = '#F4F1E8'; ctx.lineWidth = 2 * k;
  ctx.beginPath(); ctx.roundRect(720 - w / 2, top, w, h, 6 * k); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#F4F1E8';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.font = `700 ${15 * k}px Inter, system-ui, sans-serif`;
  const label = metresLeft > 0 ? `FINISH   ${Math.ceil(metresLeft)} m to go` : 'FINISH';
  ctx.fillText(label, 720, top + h / 2 + 1);
}
