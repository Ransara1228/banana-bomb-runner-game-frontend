// Event-driven: these listeners react to game events. The game loop does not know they exist.
import confetti from 'canvas-confetti';
import { bus } from './events';
import { sound } from './sfx';
import { vibrate } from './browser';

export function connectEffects() {
  const offs = [
    bus.on('bananaCollected', () => sound.play('banana')),
    bus.on('bombHit', () => { sound.play('bomb'); vibrate(200); }),
    bus.on('mysteryCollected', () => {
      sound.play('mystery');
      vibrate([40, 30, 40]);
      confetti({ particleCount: 60, spread: 75, startVelocity: 38, origin: { x: 0.5, y: 0.8 }, scalar: 0.9,
                 colors: ['#B48CFF', '#FFD23F', '#FFFFFF', '#8E63FF'], disableForReducedMotion: true });
    }),
    bus.on('finishReached', () => sound.play('gate')),
    bus.on('tick', () => sound.play('tick')),
    bus.on('gateSolved', () => {
      sound.play('win');
      confetti({ particleCount: 160, spread: 90, origin: { y: 0.6 }, disableForReducedMotion: true });
    }),
    bus.on('gateFailed', () => { sound.play('fail'); vibrate([80, 60, 80]); }),
    bus.on('levelFailed', () => sound.play('over')),
  ];
  return () => offs.forEach((off) => off());   // stop listening
}
