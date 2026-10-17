import { FileSystemUploadType, uploadAsync } from 'expo-file-system/legacy';
import { api } from './api';

/**
 * Uploads a picked file straight to storage via a presigned URL and returns
 * its public URL. Returns '' in demo mode (nothing is uploaded).
 */
export async function uploadMedia(uri: string, contentType: string): Promise<string> {
  const target = await api.uploadUrl(contentType);
  if (target.demo) return '';
  const res = await uploadAsync(target.uploadUrl, uri, {
    httpMethod: 'PUT',
    uploadType: FileSystemUploadType.BINARY_CONTENT,
    headers: target.uploadHeaders,
  });
  if (res.status >= 300) throw new Error('Upload failed, please try again');
  return target.publicUrl;
}
