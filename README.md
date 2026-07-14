# 🐛 Bug Smasher

A fast, tactile 3D bug-tapping arcade game that runs **inside a Reddit post**, built on [Devvit Web](https://developers.reddit.com/docs/capabilities/devvit-web/devvit_web_overview). Tap bugs before they escape the field, chain combos, dodge the friendly critters, grab power-ups, and take down a boss at the end of every biome. There's a shared **Daily Run** (everyone plays the same seeded swarm), an endless survival mode, a shop, and daily missions — all designed to pull players back tomorrow.

Built with **three.js** for the 3D rendering, with a Devvit server backing per-user progress and a daily leaderboard in Reddit's Redis.

## How to play

- **Tap / click a bug** to smash it. Land taps in quick succession to build a **combo multiplier**.
- **Don't tap the ladybugs** — they're friendly. Hitting one costs points and breaks your combo.
- **Tough bugs** (spiders, roaches, armored beetles) take more than one hit. The **splitter** bursts into two fast larvae when smashed.
- **Let a bug escape** and you lose a life. Run out of lives — or the timer — and the run ends.
- **Power-ups drop from kills**: slow-mo, frenzy (2× points), shard magnet, an extra life, and multi-smash (hit everything nearby).
- **Clear a biome's quota** to trigger a **boss fight**. Beat the boss to clear the biome and unlock the next.
- **Shards** you collect are spent in the **Shop** on permanent upgrades.

## Modes

- **Campaign** — 7 biomes (Garden → Void), scaling Easy to Insane, each ending in a unique boss.
- **Daily Run** — one seeded run per day. Everyone gets the exact same swarm, so scores are directly comparable on the **daily leaderboard**. One shot per day.
- **Endless** — survive escalating waves; every 10 smashes bumps the wave and the difficulty. Tracks your best wave.

## The shop

Shards collected during runs buy permanent, account-synced upgrades:

- **Power Hammer** — bugs take fewer hits to smash.
- **Shard Magnet** — auto-collects nearby drops.
- **Longer Slow-Mo** — extends the slow-mo power-up.
- **Spare Heart** — start every run with +1 life.
- **Coin Boost** — +25% shards earned from every run.
- **Combo Guard** — combos last longer before they break.
- **Kickstart** — begin every run with a short 2× frenzy.
- **Wide Magnet** — the magnet grabs drops sooner and faster.
- **Reinforced Heart** — start with another +1 life on top of Spare Heart.

## Why it keeps people coming back (the hook)

- **Daily seeded run + leaderboard** — a fresh, identical-for-everyone challenge each day that resets at UTC midnight, so there's always a reason to check back and a shared thing to talk about in the comments.
- **Daily missions** — three rotating goals for bonus shards.
- **Progression** — biome unlocks, star ratings, a shard economy, and persistent upgrades that carry across sessions and devices (saved to your Reddit account).

## Tech

| Layer | What it does |
|-------|--------------|
| `public/` | The game itself — `three.min.js` (vendored, not CDN), `game.js` (the three.js game), `data.js` (talks to the server, falls back to localStorage when run standalone). Served verbatim by Vite. |
| `src/client/` | HTML entrypoints and the splash/preview card that loads the public scripts. |
| `src/server/` | Devvit Web server built on **Hono**. Per-user save state + daily leaderboard in Redis. Handles the "create post" menu action. |
| `devvit.json` | App config: post entrypoint, server, permissions, menu. |

The client is deliberately **environment-agnostic**: it runs identically as a plain web page (great for fast iteration in Codespaces) and inside a Reddit post. When a Devvit server is reachable, progress and scores sync to your Reddit account; otherwise it uses `localStorage`.

## Running it

Requires **Node 22**. From the project root:

```bash
npm install                          # install dependencies
node --check public/game.js          # quick syntax check of the game
npm run dev                          # devvit playtest — runs live on your test subreddit
```

Deploying a new version live (bumps the version, uploads, then installs to the subreddit):

```bash
npm run type-check                   # TypeScript sanity check on the server
devvit upload                        # build + upload a new version (not live yet)
devvit install <your-subreddit>      # push that version so it's actually live
```

After installing, open the post in an incognito window (logged out) to see exactly what other players and judges see — that's the source of truth.

## Credits

Game design and code: built for the Reddit **Games with a Hook** hackathon. Rendering by three.js. Runs on Reddit's Devvit platform.
