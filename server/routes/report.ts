import { randomUUID } from 'node:crypto';
import { HttpError } from '../errors';
import { body, route } from '../http';
import { kv } from '../kv';
import { getJob, saveJob } from '../store';

// In-app reporting of offensive AI output (Google Play AI-generated content policy).
export default route(['POST'], async (req, _res, { userId }) => {
  const { jobId, reason, details } = body<{ jobId?: string; reason?: string; details?: string }>(req);
  if (!jobId || !reason) throw new HttpError(400, 'Choose a reason');
  const job = await getJob(userId, jobId);
  const id = randomUUID();
  await kv.set(`report:${id}`, { id, jobId, userId, reason, details: details?.slice(0, 1000), videoUrl: job.videoUrl, createdAt: new Date().toISOString() });
  await kv.pushFront('reports', id, 10000);
  console.warn('Content report', { id, jobId, reason });
  // Hide the reported result from the reporter right away.
  job.videoUrl = undefined;
  job.error = 'Reported and removed.';
  job.status = 'failed';
  job.refunded = true;
  await saveJob(job);
  return { reported: true };
});
