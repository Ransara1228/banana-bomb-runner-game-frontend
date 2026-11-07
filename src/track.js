// The 3-lane track seen from behind the runner. Shared by the game and the title screen.
export const W = 1440, H = 900;                          // canvas size (CSS stretches it to cover the screen)
export const yAt = (p) => 320 + 580 * p * p;             // depth p (0 = far, 1 = runner) -> screen y
export const sAt = (y) => (y - 260) / 640;               // how big things are at that y
export const laneX = (lane, s) => 720 + (lane - 1) * 287 * s;   // lanes 0, 1, 2
export const STRIPE = { 1: 'rgba(150,100,50,0.25)', 2: '#7E4A26', 3: '#BB9E6C', 4: '#554A46', 5: '#4A5890' };

export function loadImg(src) { const i = new Image(); i.src = src; return i; }
export const ready = (img) => img.complete && img.naturalWidth > 0;
