import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

// Downloads to the app cache and opens the share sheet (users can save to
// their gallery from there) — no storage permission needed.
export async function shareVideo(url: string) {
  const file = new File(Paths.cache, `swapreel-${Date.now()}.mp4`);
  const downloaded = await File.downloadFileAsync(url, file);
  await Sharing.shareAsync(downloaded.uri, { mimeType: 'video/mp4', dialogTitle: 'Share your video' });
}
