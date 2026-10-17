import { env } from './env';
import { HttpError } from './errors';

// Thin client for the Higgsfield API (https://api.higgsfield.ai).
// Auth header format: "Key KEY_ID:KEY_SECRET". Requests are async: submit
// returns a request_id, then /requests/{id}/status reports progress.

export interface HfStatus {
  status: 'queued' | 'in_progress' | 'completed' | 'failed' | 'nsfw';
  request_id: string;
  video?: { url: string };
  images?: { url: string }[];
}

async function hf<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${env.hfBaseUrl}${path}`, {
    ...init,
    headers: {
      Authorization: `Key ${env.hfCredentials}`,
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
  });
  const text = await res.text();
  if (!res.ok) {
    console.error('Higgsfield error', res.status, text);
    // 403 from Higgsfield means the *operator* account is out of credits.
    throw new HttpError(res.status === 400 || res.status === 422 ? 400 : 502, 'Video service unavailable, please try again');
  }
  return JSON.parse(text) as T;
}

/** Returns a presigned URL the app uploads to directly, and the file's public URL. */
export async function createUploadUrl(contentType: string) {
  const r = await hf<{ public_url: string; upload_url: string; upload_headers?: Record<string, string> }>(
    '/files/generate-upload-url',
    { method: 'POST', body: JSON.stringify({ content_type: contentType }) },
  );
  return { publicUrl: r.public_url, uploadUrl: r.upload_url, uploadHeaders: r.upload_headers ?? { 'Content-Type': contentType } };
}

const DEFAULT_TEMPLATE = {
  video_url: '{{video_url}}',
  image_url: '{{image_url}}',
};

/**
 * Builds the model input from HF_SWAP_INPUT_TEMPLATE (JSON with
 * {{video_url}} / {{image_url}} placeholders) so the model can be changed
 * from the dashboard without a code change.
 */
function buildInput(videoUrl: string, imageUrl: string) {
  const template = env.hfSwapInputTemplate ? JSON.parse(env.hfSwapInputTemplate) : DEFAULT_TEMPLATE;
  const json = JSON.stringify(template)
    .replaceAll('{{video_url}}', videoUrl)
    .replaceAll('{{image_url}}', imageUrl);
  return JSON.parse(json);
}

export async function submitSwap(videoUrl: string, imageUrl: string) {
  const model = env.hfSwapModel.startsWith('/') ? env.hfSwapModel : `/${env.hfSwapModel}`;
  return hf<HfStatus>(model, {
    method: 'POST',
    body: JSON.stringify(buildInput(videoUrl, imageUrl)),
  });
}

export const getStatus = (requestId: string) => hf<HfStatus>(`/requests/${encodeURIComponent(requestId)}/status`);
