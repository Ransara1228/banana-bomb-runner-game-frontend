import { useId } from 'react';

// A party hat for the player in 1st place (drawn in SVG, so it scales and needs no image file).
export default function PartyHat({ size = 56 }) {
  const id = useId().replace(/:/g, '');      // unique ids, so two hats on one page do not clash
  return (
    <svg className="party-hat" width={size} height={size * 1.15} viewBox="0 0 60 69" aria-hidden="true">
      <defs>
        <linearGradient id={`cone${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FF7AB6" /><stop offset="1" stopColor="#B48CFF" />
        </linearGradient>
        <clipPath id={`clip${id}`}><path d="M30 6 L53 60 L7 60 Z" /></clipPath>
      </defs>
      <path d="M30 6 L53 60 L7 60 Z" fill={`url(#cone${id})`} />
      <g clipPath={`url(#clip${id})`}>
        <path d="M0 30 L60 12 L60 20 L0 38 Z" fill="#FFD23F" />
        <path d="M0 48 L60 30 L60 38 L0 56 Z" fill="#3DDC84" />
        <circle cx="24" cy="44" r="2.2" fill="#fff" /><circle cx="37" cy="26" r="2" fill="#fff" />
        <circle cx="40" cy="50" r="2.2" fill="#fff" /><circle cx="27" cy="22" r="1.6" fill="#fff" />
      </g>
      <path d="M4 60 l4 -5 l4 5 l4 -5 l4 5 l4 -5 l4 5 l4 -5 l4 5 l4 -5 l4 5 l4 -5 l4 5 v6 h-52 z" fill="#FFD23F" />
      <circle cx="30" cy="6" r="6" fill="#FFD23F" />
    </svg>
  );
}
