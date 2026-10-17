import { api } from './api';

export async function uploadMedia(uri: string, contentType: string): Promise<string> {
  const target = await api.uploadUrl(contentType);
  if (target.demo) return '';
  const blob = await (await fetch(uri)).blob();
  const res = await fetch(target.uploadUrl, { method: 'PUT', body: blob, headers: target.uploadHeaders });
  if (!res.ok) throw new Error('Upload failed, please try again');
  return target.publicUrl;
}
