export async function shareVideo(url: string) {
  if (navigator.share) {
    try {
      await navigator.share({ title: 'My SwapReel video', url });
      return;
    } catch {}
  }
  window.open(url, '_blank', 'noopener');
}
