import { isDemo } from '../env';
import { HttpError } from '../errors';
import { body, route } from '../http';
import { startSwap } from '../jobs';

interface SwapBody {
  videoUrl?: string;
  faceUrl?: string;
  consent?: boolean;
}

const isHttps = (u?: string) => !!u && /^https:\/\//.test(u);

export default route(['POST'], async (req, _res, { userId }) => {
  const { videoUrl, faceUrl, consent } = body<SwapBody>(req);
  if (consent !== true) throw new HttpError(400, 'You must confirm you have consent to use this face');
  if (!isDemo() && (!isHttps(videoUrl) || !isHttps(faceUrl))) throw new HttpError(400, 'Upload a video and a face photo');
  return startSwap(userId, videoUrl ?? '', faceUrl ?? '');
});
