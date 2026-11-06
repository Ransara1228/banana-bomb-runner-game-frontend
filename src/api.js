/*
 * AI-assisted: Claude (Anthropic), 2026-11-04.
 * Used for: first version of this file. Change it, test it and make sure you understand it before submitting.
 */
// All calls to the Spring Boot backend (Interoperability: REST + JSON). The JWT cookie is sent automatically.
async function call(method, url, body) {
  const res = await fetch(url, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
    credentials: 'include',
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.message || 'Request failed (' + res.status + ')');
    err.status = res.status;
    throw err;
  }
  return data;
}

export const api = {
  register: (email, username, password) => call('POST', '/api/auth/register', { email, username, password }),
  login: (email, password) => call('POST', '/api/auth/login', { email, password }),
  logout: () => call('POST', '/api/auth/logout'),
  levels: () => call('GET', '/api/levels'),
  progress: () => call('GET', '/api/progress'),
  puzzle: (level) => call('GET', '/api/puzzle?level=' + level),
  answer: (puzzleId, answer) => call('POST', '/api/puzzle/answer', { puzzleId, answer }),
  saveScore: (level, points) => call('POST', '/api/scores', { level, points }),
  leaderboard: () => call('GET', '/api/leaderboard'),
};
