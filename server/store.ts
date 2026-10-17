import { env } from './env';
import { HttpError } from './errors';
import { kv } from './kv';

// Credit packs. Product ids must match the in-app products created in
// Google Play Console (consumable "one-time products").
export const PACKS = [
  { id: 'credits_5', credits: 5, priceUsdCents: 499, label: 'Starter' },
  { id: 'credits_20', credits: 20, priceUsdCents: 1499, label: 'Creator', best: true },
  { id: 'credits_60', credits: 60, priceUsdCents: 3499, label: 'Studio' },
] as const;

export type PackId = (typeof PACKS)[number]['id'];
export const findPack = (id: string) => PACKS.find((p) => p.id === id);

export type JobStatus = 'queued' | 'in_progress' | 'completed' | 'failed' | 'nsfw';

export interface Job {
  id: string;
  userId: string;
  status: JobStatus;
  hfRequestId?: string;
  videoUrl?: string;
  error?: string;
  refunded?: boolean;
  createdAt: string;
  demo?: boolean;
  demoReadyAt?: number;
}

const k = {
  user: (id: string) => `user:${id}`,
  credits: (id: string) => `credits:${id}`,
  jobs: (id: string) => `jobs:${id}`,
  job: (id: string) => `job:${id}`,
};

export async function createUser(userId: string) {
  await kv.set(k.user(userId), { id: userId, createdAt: new Date().toISOString() });
  if (env.freeCredits > 0) await kv.incrBy(k.credits(userId), env.freeCredits);
}

export const getCredits = (userId: string) => kv.getNumber(k.credits(userId));
export const addCredits = (userId: string, n: number) => kv.incrBy(k.credits(userId), n);

/** Atomically takes one credit, or throws 402 when the balance is empty. */
export async function spendCredit(userId: string) {
  const left = await kv.incrBy(k.credits(userId), -1);
  if (left < 0) {
    await kv.incrBy(k.credits(userId), 1);
    throw new HttpError(402, 'Not enough credits');
  }
}

export async function saveJob(job: Job, isNew = false) {
  // Jobs and results are kept for 30 days, then expire automatically.
  await kv.set(k.job(job.id), job, 60 * 60 * 24 * 30);
  if (isNew) await kv.pushFront(k.jobs(job.userId), job.id);
}

export async function getJob(userId: string, jobId: string) {
  const job = await kv.get<Job>(k.job(jobId));
  if (!job || job.userId !== userId) throw new HttpError(404, 'Not found');
  return job;
}

export async function listJobs(userId: string) {
  const ids = await kv.list(k.jobs(userId));
  const jobs = await Promise.all(ids.map((id) => kv.get<Job>(k.job(id))));
  return jobs.filter((j): j is Job => j != null);
}

/** Deletes everything stored for a user (Play "account deletion" requirement). */
export async function deleteUser(userId: string) {
  const ids = await kv.list(k.jobs(userId));
  await kv.del(...ids.map(k.job), k.jobs(userId), k.credits(userId), k.user(userId));
}

/** Runs `grant` once per unique key — guards against double-crediting. */
export async function once(key: string, grant: () => Promise<void>) {
  if (!(await kv.setOnce(`once:${key}`, Date.now()))) return;
  try {
    await grant();
  } catch (err) {
    await kv.del(`once:${key}`);
    throw err;
  }
}
