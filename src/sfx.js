/*
 * AI-assisted: Claude (Anthropic), 2026-11-04.
 * Used for: first version of this file. Change it, test it and make sure you understand it before submitting.
 */
// Sounds with Howler.js (it uses the browser's Web Audio API underneath).
// The files are in public/sounds, so the game does not need the internet for sound.
import { Howl, Howler } from 'howler';

const FILES = {
  banana: 'banana.wav', bomb: 'bomb.wav', gate: 'gate.wav', win: 'win.wav',
  fail: 'fail.wav', over: 'over.wav', tick: 'tick.wav', mystery: 'mystery.wav',
};
const cache = {};
let music = null;

function howl(name) {
  return (cache[name] ||= new Howl({ src: ['/sounds/' + FILES[name]], volume: 0.6 }));
}

function readMuted() {
  try { return localStorage.getItem('bbr-muted') === '1'; } catch { return false; }
}

let muted = readMuted();
Howler.mute(muted);

export const sound = {
  play(name) {
    try { howl(name).play(); } catch { /* sound is optional */ }
  },
  music(on) {
    try {
      music ||= new Howl({ src: ['/sounds/music.wav'], loop: true, volume: 0.25 });
      if (on && !music.playing()) music.play();
      if (!on) music.pause();
    } catch { /* sound is optional */ }
  },
  isMuted: () => muted,
  setMuted(value) {
    muted = value;
    Howler.mute(value);
    try { localStorage.setItem('bbr-muted', value ? '1' : '0'); } catch { /* private window */ }
  },
};
