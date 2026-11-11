import { useState } from 'react';

// Avatar from the DiceBear HTTP API (Lorelei Neutral style, CC0). If it fails, show the first 2 letters.
export default function Avatar({ name, size = 40 }) {
  const [failed, setFailed] = useState(false);
  const label = (name || '?').slice(0, 2).toUpperCase();
  if (failed) {
    return <span className="avatar fallback" style={{ width: size, height: size, fontSize: size * 0.4 }}>{label}</span>;
  }
  return (
    <img className="avatar" width={size} height={size} alt={name} loading="lazy"
         src={`https://api.dicebear.com/10.x/lorelei-neutral/svg?seed=${encodeURIComponent(name || 'player')}`}
         onError={() => setFailed(true)} />
  );
}
