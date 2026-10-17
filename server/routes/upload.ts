import { isDemo } from '../env';
import { HttpError } from '../errors';
import { body, route } from '../http';
import { createUploadUrl } from '../higgsfield';

const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/quicktime', 'video/webm'];

// Returns a presigned upload URL so large videos go straight to storage.
export default route(['POST'], async (req) => {
  const { contentType } = body<{ contentType?: string }>(req);
  if (!contentType || !ALLOWED.includes(contentType)) throw new HttpError(400, 'Unsupported file type');
  if (isDemo()) return { demo: true };
  return createUploadUrl(contentType);
});
