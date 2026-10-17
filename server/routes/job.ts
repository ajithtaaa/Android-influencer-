import { route } from '../http';
import { refreshJob } from '../jobs';
import { getJob } from '../store';

export default route(['GET'], async (req, _res, { userId }) => refreshJob(await getJob(userId, String(req.query.id ?? ''))));
