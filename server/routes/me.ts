import { route } from '../http';
import { refreshJob } from '../jobs';
import { deleteUser, getCredits, listJobs } from '../store';

export default route(['GET', 'DELETE'], async (req, _res, { userId }) => {
  if (req.method === 'DELETE') {
    await deleteUser(userId);
    return { deleted: true };
  }
  const jobs = await Promise.all((await listJobs(userId)).map((j) => refreshJob(j).catch(() => j)));
  return { userId, credits: await getCredits(userId), jobs };
});
