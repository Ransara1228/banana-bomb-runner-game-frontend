# Banana Bomb Runner – Frontend

React 18 + Vite web game for CIS046-3 Software For Enterprise. It talks to the Spring Boot backend
(`banana-bomb-runner-game-backend`) through the Vite proxy (`/api` → `http://localhost:8080`).

> AI-assisted: the first version of much of this code was generated with Claude (Anthropic) in November 2026,
> then reviewed, changed and tested.

## How to run

1. Start the backend first (port 8080) and MySQL.
2. In this folder:
   ```
   npm install
   npm run dev
   ```
3. Open <http://localhost:5173>.

If the backend runs on another port (for example `SERVER_PORT=8078`), change the proxy in `vite.config.js`
to the same port.

## How to play

- ← → (or A / D, or tap left / right) change lane. Banana = +10. Bomb = -1 heart. 3 hearts.
- Purple **mystery box** = +100 bonus (about 1 box for every 250 m of a level).
- At the finish line a Banana API puzzle opens (Level 1: 20 s, 2: 15 s, 3: 10 s, 4: 8 s, 5: 6 s).
  Right in time = bonus (200 × level + 20 × seconds left) and the **server** unlocks the next level.
- Wrong or time up = -1 heart and a new puzzle. 0 hearts = the level starts again.
- P or Esc = pause. The game pauses when you switch tab.

## Parts

| Part | File |
|---|---|
| Screens | `src/screens/` (Login, Home, Game, GatePuzzle, Leaderboard) |
| REST calls | `src/api.js` |
| Event bus (observer) | `src/events.js` — events: `bananaCollected`, `mysteryCollected`, `bombHit`, `finishReached`, `gateSolved`, `gateFailed`, `levelFailed`, `tick` |
| Listeners: sound, vibration, confetti | `src/effects.js` |
| Sounds (Howler.js) | `src/sfx.js`, files in `public/sounds` |
| Browser APIs | `src/browser.js` (Page Visibility, Vibration, Fullscreen) |
| Avatar (DiceBear HTTP API) | `src/components/Avatar.jsx` |
| Moving scenery per level + finish gate (canvas) | `src/scenery.js` |
| Mystery boxes, sparkles, "+10" texts (canvas) | `src/screens/Game.jsx` (`spawnBox`, `drawMystery`, `burst`) |
| Leaderboard: podium, party hat for #1, confetti | `src/screens/Leaderboard.jsx`, `src/components/PartyHat.jsx` |
| Moving background, count-up numbers | `src/components/BgFx.jsx`, `src/components/CountUp.jsx` |
| Level colours and text | `src/levels.js` |
| Shared parts | `src/components/` (AppHeader, LeaderboardTable, AuthHero, Icon) |
| Look (tokens from the Figma style guide) | `src/index.css` — Fredoka + Inter (Google Fonts), colours `#0E1F17`, `#15301F`, `#FFD23F`, `#FF5A4E` |

The game screen fills the whole window, and **Play** also asks the browser for real full screen
(Fullscreen API). Press the full-screen button in the HUD to leave or enter it again.

## Credits (third-party)

- [Howler.js](https://howlerjs.com) (MIT) – sound.
- [canvas-confetti](https://github.com/catdad/canvas-confetti) (ISC) – level complete animation.
- [DiceBear](https://dicebear.com) – avatars, style "Lorelei Neutral" (CC0 1.0).
- [Google Fonts](https://fonts.google.com) – Fredoka and Inter (SIL Open Font License).
- Sound effects and music in `public/sounds` were made for this project (CC0). They can be swapped for
  Kenney.nl CC0 sounds with the same file names.
- Banana puzzles: Banana API by Marc Conrad (University of Bedfordshire).
