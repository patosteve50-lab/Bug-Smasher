import { Hono } from 'hono';
import { context, redis, reddit } from '@devvit/web/server';
import type {
  DecrementResponse,
  IncrementResponse,
  InitResponse,
} from '../../shared/api';

type ErrorResponse = {
  status: 'error';
  message: string;
};

export const api = new Hono();

api.get('/init', async (c) => {
  const { postId } = context;

  if (!postId) {
    console.error('API Init Error: postId not found in devvit context');
    return c.json<ErrorResponse>(
      {
        status: 'error',
        message: 'postId is required but missing from context',
      },
      400
    );
  }

  try {
    const [count, username] = await Promise.all([
      redis.get('count'),
      reddit.getCurrentUsername(),
    ]);

    return c.json<InitResponse>({
      type: 'init',
      postId: postId,
      count: count ? parseInt(count) : 0,
      username: username ?? 'anonymous',
    });
  } catch (error) {
    console.error(`API Init Error for post ${postId}:`, error);
    let errorMessage = 'Unknown error during initialization';
    if (error instanceof Error) {
      errorMessage = `Initialization failed: ${error.message}`;
    }
    return c.json<ErrorResponse>(
      { status: 'error', message: errorMessage },
      400
    );
  }
});

api.post('/increment', async (c) => {
  const { postId } = context;
  if (!postId) {
    return c.json<ErrorResponse>(
      {
        status: 'error',
        message: 'postId is required',
      },
      400
    );
  }

  const count = await redis.incrBy('count', 1);
  return c.json<IncrementResponse>({
    count,
    postId,
    type: 'increment',
  });
});

api.post('/decrement', async (c) => {
  const { postId } = context;
  if (!postId) {
    return c.json<ErrorResponse>(
      {
        status: 'error',
        message: 'postId is required',
      },
      400
    );
  }

  const count = await redis.incrBy('count', -1);
  return c.json<DecrementResponse>({
    count,
    postId,
    type: 'decrement',
  });
});

// ===== Bug Smasher routes =====
function bsDayKey(): string {
  const d = new Date();
  return `${d.getUTCFullYear()}-${d.getUTCMonth() + 1}-${d.getUTCDate()}`;
}
async function bsUser(): Promise<string> {
  try { const u = await reddit.getCurrentUsername(); return u ?? 'anon'; }
  catch { return 'anon'; }
}
api.get('/state', async (c) => {
  const user = await bsUser();
  const raw = await redis.get(`save:${user}`);
  return c.json({ state: raw ? JSON.parse(raw) : null, username: user });
});
api.post('/state', async (c) => {
  const user = await bsUser();
  const body = await c.req.json().catch(() => ({}));
  const state = body?.state ?? {};
  await redis.set(`save:${user}`, JSON.stringify(state));
  return c.json({ ok: true });
});
api.post('/score', async (c) => {
  const user = await bsUser();
  const body = await c.req.json().catch(() => ({}));
  const score = Number(body?.score) || 0;
  const key = `lb:${bsDayKey()}`;
  const prev = await redis.zScore(key, user);
  if (prev == null || score > prev) {
    await redis.zAdd(key, { member: user, score });
    await redis.expire(key, 60 * 60 * 24 * 8);
  }
  return c.json({ ok: true, best: Math.max(score, prev ?? 0) });
});
api.get('/leaderboard', async (c) => {
  const key = `lb:${bsDayKey()}`;
  const rows = await redis.zRange(key, 0, 9, { reverse: true, by: 'rank' });
  const entries = rows.map((r) => ({ name: r.member, score: r.score }));
  return c.json({ entries });
});
