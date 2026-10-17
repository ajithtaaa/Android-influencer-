import { env } from './env';

// Minimal key-value store. Uses Upstash Redis over REST when configured
// (durable, works across serverless instances); otherwise an in-memory map
// that is only good enough for the demo link.

type Cmd = (string | number)[];

const memory = new Map<string, string>();

async function redis<T = unknown>(cmd: Cmd): Promise<T> {
  const res = await fetch(env.kvUrl, {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.kvToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(cmd),
  });
  const data = (await res.json()) as { result?: T; error?: string };
  if (!res.ok || data.error) throw new Error(`KV error: ${data.error ?? res.status}`);
  return data.result as T;
}

const useRedis = () => Boolean(env.kvUrl && env.kvToken);

export const kv = {
  async get<T>(key: string): Promise<T | null> {
    const raw = useRedis() ? await redis<string | null>(['GET', key]) : memory.get(key) ?? null;
    return raw == null ? null : (JSON.parse(raw) as T);
  },

  async set(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
    const raw = JSON.stringify(value);
    if (!useRedis()) {
      memory.set(key, raw);
      return;
    }
    await redis(ttlSeconds ? ['SET', key, raw, 'EX', ttlSeconds] : ['SET', key, raw]);
  },

  /** Sets only if the key does not exist. Returns true when it was set. */
  async setOnce(key: string, value: unknown): Promise<boolean> {
    const raw = JSON.stringify(value);
    if (!useRedis()) {
      if (memory.has(key)) return false;
      memory.set(key, raw);
      return true;
    }
    return (await redis<string | null>(['SET', key, raw, 'NX'])) === 'OK';
  },

  async del(...keys: string[]): Promise<void> {
    if (keys.length === 0) return;
    if (!useRedis()) {
      keys.forEach((k) => memory.delete(k));
      return;
    }
    await redis(['DEL', ...keys]);
  },

  async incrBy(key: string, by: number): Promise<number> {
    if (!useRedis()) {
      const next = Number(memory.get(key) ?? '0') + by;
      memory.set(key, String(next));
      return next;
    }
    return Number(await redis<number>(['INCRBY', key, by]));
  },

  async getNumber(key: string): Promise<number> {
    const raw = useRedis() ? await redis<string | null>(['GET', key]) : memory.get(key) ?? null;
    return Number(raw ?? '0');
  },

  async pushFront(key: string, value: string, maxLen = 100): Promise<void> {
    if (!useRedis()) {
      const list = JSON.parse(memory.get(key) ?? '[]') as string[];
      memory.set(key, JSON.stringify([value, ...list].slice(0, maxLen)));
      return;
    }
    await redis(['LPUSH', key, value]);
    await redis(['LTRIM', key, 0, maxLen - 1]);
  },

  async list(key: string): Promise<string[]> {
    if (!useRedis()) return JSON.parse(memory.get(key) ?? '[]') as string[];
    return (await redis<string[]>(['LRANGE', key, 0, -1])) ?? [];
  },
};
