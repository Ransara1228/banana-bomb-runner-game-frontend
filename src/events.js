// Tiny event bus (observer pattern): one part emits, many parts listen.
// Game events: bananaCollected, mysteryCollected, bombHit, finishReached, gateSolved, gateFailed, levelFailed, tick
const listeners = {};

export const bus = {
  on(name, fn) {
    (listeners[name] ||= []).push(fn);
    return () => { listeners[name] = listeners[name].filter((f) => f !== fn); };   // call this to stop listening
  },
  emit(name, data) {
    (listeners[name] || []).forEach((fn) => fn(data));
  },
};
