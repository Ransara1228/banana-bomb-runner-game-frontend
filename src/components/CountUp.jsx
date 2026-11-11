import { useEffect, useState } from 'react';

// Counts a number up from 0 (for scores). Shows the final number at once if the player wants less motion.
export default function CountUp({ value, ms = 900 }) {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    const still = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (still || !value) { setShown(value || 0); return; }
    let raf;
    const start = performance.now();
    const step = (now) => {
      const k = Math.min(1, (now - start) / ms);
      setShown(Math.round(value * (1 - Math.pow(1 - k, 3))));   // ease-out
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value, ms]);
  return <>{shown.toLocaleString()}</>;
}
