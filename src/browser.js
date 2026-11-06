/*
 * AI-assisted: Claude (Anthropic), 2026-11-04.
 * Used for: first version of this file. Change it, test it and make sure you understand it before submitting.
 */
// Small helpers for browser Web APIs. Each one checks the browser supports it first.

/** Vibration API: phones only (not every browser has it, e.g. iOS Safari). */
export function vibrate(ms) {
  try { if ('vibrate' in navigator) navigator.vibrate(ms); } catch { /* not supported */ }
}

/** Fullscreen API. */
export function toggleFullscreen() {
  try {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen?.().catch(() => {});
    else document.exitFullscreen?.();
  } catch { /* not supported */ }
}

/** Fullscreen API: go full screen when a level starts (must be called from a click). */
export function enterFullscreen() {
  try {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen?.().catch(() => {});
  } catch { /* not supported */ }
}

/** Page Visibility API: calls fn when the player switches to another tab. Returns a function to stop. */
export function onTabHidden(fn) {
  const handler = () => { if (document.hidden) fn(); };
  document.addEventListener('visibilitychange', handler);
  return () => document.removeEventListener('visibilitychange', handler);
}
