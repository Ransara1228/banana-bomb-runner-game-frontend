import { useEffect, useRef } from 'react';
import { drawScenery, makeScenery, updateScenery } from '../scenery';
import { H, STRIPE, W, laneX, loadImg, ready, sAt, yAt } from '../track';

// "Attract mode" behind the title screen: the game plays itself. The runner dodges bombs,
// grabs bananas and mystery boxes, and the world changes to the next level every few seconds.
// It is only decoration (aria-hidden). With "reduce motion" on, it shows one still picture.
const LEVEL_TIME = 8;                             // seconds per level
const SPEED = 0.6;                                // depth per second
const IMG = {
  up: loadImg('/assets/runner/up.svg'), down: loadImg('/assets/runner/down.svg'),
  banana: loadImg('/assets/banana.svg'), bomb: loadImg('/assets/bomb.svg'), mystery: loadImg('/assets/mystery.svg'),
};
const BG = [1, 2, 3, 4, 5].map((n) => loadImg(`/assets/levels/level${n}.svg`));
const SIZE = { bomb: 100, banana: 60, mystery: 88 };

export default function TitleScene() {
  const ref = useRef(null);

  useEffect(() => {
    const ctx = ref.current.getContext('2d');
    const still = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const scenery = makeScenery();
    const s = { t: 0, level: 1, lane: 1, x: 720, objects: [], floats: [], sparks: [], row: 0, nextSpawn: 0.6, fade: 1 };

    function spawn() {
      const r = Math.random();
      if (r < 0.45) {                              // a row of 1-2 bombs, never all 3 lanes
        const lanes = [0, 1, 2].sort(() => Math.random() - 0.5).slice(0, Math.random() < 0.4 ? 2 : 1);
        lanes.forEach((lane) => s.objects.push({ type: 'bomb', lane, p: 0 }));
      } else if (r < 0.9) {
        s.objects.push({ type: 'banana', lane: Math.floor(Math.random() * 3), p: 0 });
      } else {
        s.objects.push({ type: 'mystery', lane: Math.floor(Math.random() * 3), p: 0 });
      }
    }

    // Simple "AI": leave a lane with a bomb coming, move towards bananas and boxes.
    function think() {
      const danger = (lane) => s.objects.some((o) => o.type === 'bomb' && o.lane === lane && o.p > 0.45 && o.p < 1);
      const prize = (lane) => s.objects.filter((o) => o.type !== 'bomb' && o.lane === lane && o.p > 0.3 && o.p < 0.9).length;
      if (danger(s.lane) || prize(s.lane) === 0) {
        const options = [s.lane - 1, s.lane + 1].filter((l) => l >= 0 && l <= 2 && !danger(l));
        options.sort((a, b) => prize(b) - prize(a));
        if (options.length && (danger(s.lane) || prize(options[0]) > 0)) s.lane = options[0];
      }
    }

    function burst(x, y, colors, n) {
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2, v = 150 + Math.random() * 280;
        s.sparks.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 200, life: 0.6 + Math.random() * 0.4, size: 6 + Math.random() * 7, color: colors[i % colors.length] });
      }
    }

    function update(dt) {
      s.t += dt;
      if (s.t > LEVEL_TIME * s.level) { s.level = (s.level % 5) + 1; s.fade = 1; if (s.level === 1) s.t = 0; }
      s.fade = Math.max(0, s.fade - dt * 1.5);
      updateScenery(scenery, dt, SPEED);
      s.row = (s.row + SPEED * dt) % 0.1;
      s.nextSpawn -= dt;
      if (s.nextSpawn <= 0) { spawn(); s.nextSpawn = 0.55 + Math.random() * 0.5; }
      think();
      for (const o of s.objects) {
        o.p += SPEED * dt;
        if (!o.done && o.p > 0.9 && o.lane === s.lane && o.type !== 'bomb') {
          o.done = true;
          const big = o.type === 'mystery';
          s.floats.push({ text: big ? '+100' : '+10', x: s.x + 40, y: 690, life: 0.9, color: big ? '#E3D4FF' : '#FFD23F', size: big ? 56 : 40 });
          burst(s.x, 750, big ? ['#B48CFF', '#FFD23F', '#FFFFFF'] : ['#FFD23F', '#FFE27A'], big ? 26 : 8);
        }
      }
      s.objects = s.objects.filter((o) => o.p < 1.25 && !o.done);
      for (const f of s.floats) { f.y -= 90 * dt; f.life -= dt; }
      for (const k of s.sparks) { k.x += k.vx * dt; k.y += k.vy * dt; k.vy += 900 * dt; k.life -= dt; }
      s.floats = s.floats.filter((f) => f.life > 0);
      s.sparks = s.sparks.filter((k) => k.life > 0);
      s.x += (laneX(s.lane, 0.953) - s.x) * Math.min(1, dt * 10);
    }

    function draw() {
      const bg = BG[s.level - 1];
      if (ready(bg)) ctx.drawImage(bg, 0, 0, W, H);
      else { ctx.fillStyle = '#0E1F17'; ctx.fillRect(0, 0, W, H); }
      ctx.fillStyle = STRIPE[s.level];
      for (let p = s.row; p < 1.2; p += 0.1) {
        const y = yAt(p), sc = sAt(y);
        ctx.fillRect(720 - 430 * sc, y, 860 * sc, Math.max(1, 5 * sc));
      }
      drawScenery(ctx, scenery, s.level, yAt, sAt);
      for (const o of [...s.objects].sort((a, b) => a.p - b.p)) {
        const y = yAt(o.p), sc = sAt(y), size = SIZE[o.type] * sc, x = laneX(o.lane, sc);
        if (o.type === 'mystery') {                 // glow behind the box
          const cy = y - size * 0.55 + Math.sin(s.t * 6) * size * 0.08;
          const g = ctx.createRadialGradient(x, cy, 0, x, cy, size);
          g.addColorStop(0, 'rgba(180,140,255,0.55)'); g.addColorStop(1, 'rgba(180,140,255,0)');
          ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, cy, size, 0, Math.PI * 2); ctx.fill();
          if (ready(IMG.mystery)) ctx.drawImage(IMG.mystery, x - size / 2, cy - size / 2, size, size);
        } else if (ready(IMG[o.type])) ctx.drawImage(IMG[o.type], x - size / 2, y - size, size, size);
      }
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.beginPath(); ctx.ellipse(s.x, 862, 50, 12, 0, 0, Math.PI * 2); ctx.fill();
      const frame = Math.floor(s.t / 0.15) % 2 ? IMG.down : IMG.up;
      const bob = Math.abs(Math.sin(s.t * 10)) * 8;
      if (ready(frame)) ctx.drawImage(frame, s.x - 55, 706 - bob, 110, 160);
      for (const k of s.sparks) {
        ctx.globalAlpha = Math.min(1, k.life * 2); ctx.fillStyle = k.color;
        ctx.fillRect(k.x - k.size / 2, k.y - k.size / 2, k.size, k.size);
      }
      ctx.textAlign = 'center';
      for (const f of s.floats) {
        ctx.globalAlpha = Math.min(1, f.life * 2);
        ctx.font = `700 ${f.size}px Fredoka, system-ui, sans-serif`;
        ctx.lineWidth = 6; ctx.strokeStyle = 'rgba(0,0,0,0.45)'; ctx.strokeText(f.text, f.x, f.y);
        ctx.fillStyle = f.color; ctx.fillText(f.text, f.x, f.y);
      }
      ctx.globalAlpha = 1;
      if (s.fade > 0) { ctx.fillStyle = `rgba(6,14,10,${s.fade})`; ctx.fillRect(0, 0, W, H); }   // fade between levels
    }

    let raf, last = performance.now();
    function loop(now) {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      update(dt);
      draw();
      raf = requestAnimationFrame(loop);
    }
    if (still) {                                    // one still picture once the images have loaded
      s.fade = 0;
      const t = setTimeout(draw, 300);
      return () => clearTimeout(t);
    }
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  return <canvas ref={ref} className="title-scene" width={W} height={H} aria-hidden="true" />;
}
