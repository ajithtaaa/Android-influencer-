import { useLocalSearchParams } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Button, Card, H1, P, Screen } from '@/components/ui';
import { api, type Job } from '@/lib/api';
import { shareVideo } from '@/lib/share';
import { colors, radius } from '@/lib/theme';

const REASONS = [
  'Sexual or nude content',
  'Involves a minor',
  'Used without the person’s consent',
  'Impersonation or misinformation',
  'Hateful, violent or harassing',
  'Other',
];

const done = (j: Job | null) => !!j && ['completed', 'failed', 'nsfw'].includes(j.status);

export default function ResultScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [job, setJob] = useState<Job | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reporting, setReporting] = useState(false);

  useEffect(() => {
    let alive = true;
    let timer: ReturnType<typeof setTimeout>;
    const tick = async () => {
      try {
        const j = await api.job(id);
        if (!alive) return;
        setJob(j);
        if (!done(j)) timer = setTimeout(tick, 4000);
      } catch (e) {
        if (alive) setError(e instanceof Error ? e.message : 'Could not load');
      }
    };
    tick();
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [id]);

  async function report(reason: string) {
    try {
      await api.report(id, reason);
      setReporting(false);
      setJob((j) => (j ? { ...j, status: 'failed', videoUrl: undefined, error: 'Reported and removed.' } : j));
      const msg = 'Thanks — our team will review it. The video was removed from your account.';
      if (Platform.OS === 'web') window.alert(msg);
      else Alert.alert('Report sent', msg);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not send report');
    }
  }

  if (error) return <Screen><P style={{ color: colors.danger }}>{error}</P></Screen>;
  if (!job || !done(job)) {
    return (
      <Screen>
        <View style={styles.waiting}>
          <ActivityIndicator size="large" color={colors.accent} />
          <H1>Swapping…</H1>
          <P muted style={{ textAlign: 'center' }}>
            This usually takes 1–3 minutes. You can leave this screen — the result will appear in “My videos”.
          </P>
        </View>
      </Screen>
    );
  }

  if (job.status !== 'completed' || !job.videoUrl) {
    return (
      <Screen>
        <H1>No video</H1>
        <P muted>{job.error ?? 'Something went wrong. Your credit was refunded.'}</P>
      </Screen>
    );
  }

  return (
    <Screen>
      <Player url={job.videoUrl} />
      <View style={styles.label}>
        <Text style={styles.labelText}>AI-generated · Not a real recording</Text>
      </View>
      <Button title="Save / Share" onPress={() => shareVideo(job.videoUrl!).catch((e: Error) => setError(e.message))} />
      {!reporting ? (
        <Button title="🚩 Report this video" variant="secondary" onPress={() => setReporting(true)} />
      ) : (
        <Card>
          <P>Why are you reporting this?</P>
          {REASONS.map((r) => (
            <Pressable key={r} onPress={() => report(r)} style={styles.reason} accessibilityRole="button">
              <Text style={{ color: colors.text }}>{r}</Text>
            </Pressable>
          ))}
          <Button title="Cancel" variant="secondary" onPress={() => setReporting(false)} />
        </Card>
      )}
    </Screen>
  );
}

function Player({ url }: { url: string }) {
  const player = useVideoPlayer(url, (p) => {
    p.loop = true;
    p.play();
  });
  return <VideoView player={player} style={styles.video} nativeControls contentFit="contain" />;
}

const styles = StyleSheet.create({
  waiting: { alignItems: 'center', gap: 16, paddingVertical: 64 },
  video: { width: '100%', aspectRatio: 9 / 16, maxHeight: 560, borderRadius: radius, backgroundColor: '#000' },
  label: { alignSelf: 'center', backgroundColor: colors.card, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
  labelText: { color: colors.muted, fontSize: 12, fontWeight: '600' },
  reason: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.cardBorder },
});
