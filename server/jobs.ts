import { randomUUID } from 'node:crypto';
import { isDemo } from './env';
import { getStatus, submitSwap } from './higgsfield';
import { addCredits, type Job, once, saveJob, spendCredit } from './store';

// Public sample clip returned in demo mode (no Higgsfield key configured).
const DEMO_VIDEO = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4';

export async function startSwap(userId: string, videoUrl: string, imageUrl: string): Promise<Job> {
  await spendCredit(userId);
  const job: Job = { id: randomUUID(), userId, status: 'queued', createdAt: new Date().toISOString() };
  try {
    if (isDemo()) {
      job.demo = true;
      job.demoReadyAt = Date.now() + 8000;
    } else {
      const r = await submitSwap(videoUrl, imageUrl);
      job.hfRequestId = r.request_id;
      job.status = r.status ?? 'queued';
    }
  } catch (err) {
    await addCredits(userId, 1);
    throw err;
  }
  await saveJob(job, true);
  return job;
}

/** Pulls the latest status for an unfinished job; refunds failed ones. */
export async function refreshJob(job: Job): Promise<Job> {
  if (job.status === 'completed' || job.status === 'failed' || job.status === 'nsfw') return job;

  if (job.demo) {
    if (Date.now() >= (job.demoReadyAt ?? 0)) {
      job.status = 'completed';
      job.videoUrl = DEMO_VIDEO;
    } else {
      job.status = 'in_progress';
    }
  } else if (job.hfRequestId) {
    const s = await getStatus(job.hfRequestId);
    job.status = s.status;
    if (s.status === 'completed') job.videoUrl = s.video?.url ?? s.images?.[0]?.url;
    if (s.status === 'nsfw') job.error = 'This content was blocked by our safety filter.';
    if (s.status === 'failed') job.error = 'The swap failed. Your credit was refunded.';
  }

  if ((job.status === 'failed' || job.status === 'nsfw') && !job.refunded) {
    job.refunded = true;
    await once(`refund:${job.id}`, async () => {
      await addCredits(job.userId, 1);
    });
  }
  await saveJob(job);
  return job;
}
