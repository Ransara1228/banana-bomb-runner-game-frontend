// Moving background for the menu screens: soft colour blobs and floating bananas, bombs and boxes.
// It is only decoration (aria-hidden), and it stops moving when the player asks for less motion.
const ITEMS = [
  ['banana', 6, 46, 19, 2], ['bomb', 16, 34, 24, 11], ['mystery', 27, 40, 21, 6], ['banana', 39, 30, 26, 15],
  ['banana', 52, 52, 18, 9], ['bomb', 63, 40, 23, 3], ['mystery', 74, 34, 27, 13], ['banana', 85, 42, 20, 7],
  ['bomb', 94, 30, 25, 17], ['banana', 45, 26, 22, 20],
];

export default function BgFx() {
  return (
    <div className="bgfx" aria-hidden="true">
      <span className="blob b1" /><span className="blob b2" /><span className="blob b3" />
      {ITEMS.map(([img, x, w, sec, delay], i) => (
        <img key={i} className="floaty" src={`/assets/${img}.svg`} alt=""
             style={{ left: x + '%', width: w, animationDuration: sec + 's', animationDelay: -delay + 's' }} />
      ))}
    </div>
  );
}
