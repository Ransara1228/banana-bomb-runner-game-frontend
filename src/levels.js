// Look of each level (colours and short text). The rules (speed, time, distance) come from the backend.
export const COLOR = { 1: '#3DDC84', 2: '#4FA8FF', 3: '#C9A26B', 4: '#FF8A3D', 5: '#B48CFF' };
export const DESC = {
  1: 'An easy jungle path. Learn to dodge and grab bananas.',
  2: 'A wooden bridge over the river. A bit faster.',
  3: 'Old stones, faster feet. 10 seconds at the gate.',
  4: 'Hot rocks and lava cracks. Only 8 seconds at the gate.',
  5: 'The last run. Fast, dark and full of bombs.',
};
export const bombRows = (level) => level.bombs * 2;   // the game makes 2 bomb rows per "bomb" in the level rules

// Mystery boxes: about 1 box for every 250 m of the level, and each one gives +100.
export const MYSTERY_BONUS = 100;
export const mysteryBoxes = (level) => Math.max(1, Math.round(level.distance / 250));

// Fun player titles on the leaderboard, by the highest level a player has opened.
export const TITLE = { 1: 'Banana Rookie', 2: 'River Runner', 3: 'Temple Explorer', 4: 'Lava Dodger', 5: 'Bomb Factory Boss' };
