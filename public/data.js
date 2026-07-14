/* =========================================================================
   Bug Smasher — data layer
   Bridges the game to a Devvit server when running inside Reddit, and falls
   back to localStorage when running standalone (e.g. Codespaces preview).

   The game calls window.BSData.load() once at startup and
   window.BSData.save(state) whenever progress changes. Everything is async
   and safe to call regardless of environment.
   ========================================================================= */
(function () {
  const LS_KEY = 'bugsmasher_save_v2';
  const API = {
    load: '/api/state',        // GET  -> { state }
    save: '/api/state',        // POST { state }
    leaderboard: '/api/leaderboard', // GET -> { entries: [{name, score}] }
    submitScore: '/api/score', // POST { mode, score, wave }
  };

  // Detect whether a Devvit server is reachable. We assume "inside Reddit" if
  // a GET to the state endpoint returns JSON. Otherwise we go local-only.
  let online = false;
  let currentUser = null;

  async function tryFetch(url, opts) {
    try {
      const res = await fetch(url, opts);
      if (!res.ok) return null;
      const ct = res.headers.get('content-type') || '';
      if (!ct.includes('application/json')) return null;
      return await res.json();
    } catch (e) {
      return null;
    }
  }

  async function load() {
    const server = await tryFetch(API.load);
    // A JSON response (even {state:null}) means we're inside Reddit / have a server.
    if (server && typeof server === 'object' && 'state' in server) {
      online = true;
      if (server.username) currentUser = server.username;
      return server.state; // may be null for a brand-new user — that's fine
    }
    // fallback: localStorage
    online = false;
    try {
      const raw = localStorage.getItem(LS_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  async function save(state) {
    // always mirror to localStorage so nothing is lost if the server hiccups
    try { localStorage.setItem(LS_KEY, JSON.stringify(state)); } catch (e) {}
    if (online) {
      await tryFetch(API.save, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ state }),
      });
    }
  }

  async function submitScore(mode, score, wave) {
    // Always attempt — tryFetch returns null harmlessly if there's no server.
    return tryFetch(API.submitScore, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ mode, score, wave }),
    });
  }

  async function leaderboard() {
    if (!online) return { entries: [] };
    return (await tryFetch(API.leaderboard)) || { entries: [] };
  }

  window.BSData = { load, save, submitScore, leaderboard, username: () => currentUser, get online() { return online; } };
})();
