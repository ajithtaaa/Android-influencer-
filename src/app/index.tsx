import Checkbox from 'expo-checkbox';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { Link, router } from 'expo-router';
import { useState } from 'react';
import { Alert, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Button, Card, H1, P, Screen } from '@/components/ui';
import { api, ApiError } from '@/lib/api';
import { colors, radius } from '@/lib/theme';
import { uploadMedia } from '@/lib/upload';
import { useMe } from '@/lib/use-me';

type Picked = { uri: string; mimeType: string };

const MAX_VIDEO_SECONDS = 30;

function notify(title: string, message: string) {
  if (Platform.OS === 'web') window.alert(`${title}\n\n${message}`);
  else Alert.alert(title, message);
}

export default function CreateScreen() {
  const { me } = useMe();
  const [video, setVideo] = useState<Picked | null>(null);
  const [face, setFace] = useState<Picked | null>(null);
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  // Uses the system Photo Picker — no storage permission is requested.
  async function pick(kind: 'videos' | 'images') {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: kind,
      quality: 0.9,
      videoMaxDuration: MAX_VIDEO_SECONDS,
    });
    if (result.canceled) return;
    const asset = result.assets[0];
    if (kind === 'videos' && asset.duration && asset.duration / 1000 > MAX_VIDEO_SECONDS + 1) {
      return notify('Video too long', `Please choose a clip of ${MAX_VIDEO_SECONDS} seconds or less.`);
    }
    const picked = { uri: asset.uri, mimeType: asset.mimeType ?? (kind === 'videos' ? 'video/mp4' : 'image/jpeg') };
    if (kind === 'videos') setVideo(picked);
    else setFace(picked);
  }

  async function start() {
    if (!video || !face) return;
    if ((me?.credits ?? 0) < 1) return router.push('/credits');
    try {
      setBusy('Uploading video…');
      const videoUrl = await uploadMedia(video.uri, video.mimeType);
      setBusy('Uploading photo…');
      const faceUrl = await uploadMedia(face.uri, face.mimeType);
      setBusy('Starting swap…');
      const job = await api.swap(videoUrl, faceUrl);
      setVideo(null);
      setFace(null);
      setConsent(false);
      router.push({ pathname: '/result/[id]', params: { id: job.id } });
    } catch (e) {
      if (e instanceof ApiError && e.status === 402) router.push('/credits');
      else notify('Could not start', e instanceof Error ? e.message : 'Please try again.');
    } finally {
      setBusy(null);
    }
  }

  return (
    <Screen>
      <View style={styles.topRow}>
        <Link href="/credits" asChild>
          <Pressable style={styles.pill} accessibilityRole="button">
            <Text style={styles.pillText}>⚡ {me ? me.credits : '…'} credits</Text>
          </Pressable>
        </Link>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Link href="/library" asChild>
            <Pressable style={styles.pill} accessibilityRole="button">
              <Text style={styles.pillText}>My videos</Text>
            </Pressable>
          </Link>
          <Link href="/settings" asChild>
            <Pressable style={styles.pill} accessibilityRole="button" accessibilityLabel="Settings">
              <Text style={styles.pillText}>⚙︎</Text>
            </Pressable>
          </Link>
        </View>
      </View>

      <H1>Swap a face into any video</H1>
      <P muted>Pick a short clip and a clear photo of a face. Our AI does the rest in about a minute.</P>

      <View style={styles.pickers}>
        <Slot label="1. Video" hint={`Up to ${MAX_VIDEO_SECONDS}s`} onPress={() => pick('videos')} picked={video} isVideo />
        <Slot label="2. Face photo" hint="Front-facing, well lit" onPress={() => pick('images')} picked={face} />
      </View>

      <Card>
        <View style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
          <Checkbox value={consent} onValueChange={setConsent} color={consent ? colors.accent : undefined} style={{ marginTop: 3 }} />
          <P style={{ flex: 1 }}>
            This is my face, or I have the permission of the person in the photo and the rights to the video. I won't use the
            result to deceive, harass or impersonate anyone.
          </P>
        </View>
      </Card>

      <Button
        title={busy ?? 'Swap face · 1 credit'}
        loading={!!busy}
        disabled={!video || !face || !consent}
        onPress={start}
      />
      {me && me.credits < 1 && (
        <P muted style={{ textAlign: 'center' }}>You have no credits yet — tapping the button will take you to the shop.</P>
      )}
    </Screen>
  );
}

function Slot({ label, hint, onPress, picked, isVideo }: { label: string; hint: string; onPress: () => void; picked: Picked | null; isVideo?: boolean }) {
  return (
    <Pressable onPress={onPress} style={styles.slot} accessibilityRole="button" accessibilityLabel={`Choose ${label}`}>
      {picked && !isVideo ? (
        <Image source={{ uri: picked.uri }} style={StyleSheet.absoluteFill} contentFit="cover" />
      ) : null}
      <View style={styles.slotInner}>
        <Text style={styles.slotIcon}>{picked ? '✓' : isVideo ? '🎬' : '🙂'}</Text>
        <Text style={styles.slotLabel}>{label}</Text>
        <Text style={styles.slotHint}>{picked ? 'Tap to change' : hint}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pill: { backgroundColor: colors.card, borderColor: colors.cardBorder, borderWidth: 1, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8 },
  pillText: { color: colors.text, fontWeight: '600' },
  pickers: { flexDirection: 'row', gap: 12 },
  slot: {
    flex: 1,
    aspectRatio: 3 / 4,
    borderRadius: radius,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.cardBorder,
    backgroundColor: colors.card,
    overflow: 'hidden',
  },
  slotInner: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', padding: 12, gap: 4, backgroundColor: 'rgba(11,11,18,0.35)' },
  slotIcon: { fontSize: 32, color: colors.text, marginBottom: 'auto', marginTop: 'auto' },
  slotLabel: { color: colors.text, fontWeight: '700', fontSize: 16 },
  slotHint: { color: colors.muted, fontSize: 13 },
});
