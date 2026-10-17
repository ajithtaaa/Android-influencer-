import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Card, P, Screen } from '@/components/ui';
import { colors } from '@/lib/theme';
import { useMe } from '@/lib/use-me';

const LABEL = { queued: 'In queue', in_progress: 'Processing', completed: 'Ready', failed: 'Failed', nsfw: 'Blocked' } as const;

export default function LibraryScreen() {
  const { me, error } = useMe();
  if (error) return <Screen><P style={{ color: colors.danger }}>{error}</P></Screen>;
  if (!me) return <Screen><P muted>Loading…</P></Screen>;
  if (me.jobs.length === 0) return <Screen><P muted>No videos yet. Your swaps will show up here for 30 days.</P></Screen>;
  return (
    <Screen>
      <P muted>Videos are kept for 30 days. Save the ones you want to keep.</P>
      {me.jobs.map((j) => (
        <Pressable key={j.id} onPress={() => router.push({ pathname: '/result/[id]', params: { id: j.id } })} accessibilityRole="button">
          <Card style={styles.row}>
            <Text style={styles.icon}>{j.status === 'completed' ? '🎬' : j.status === 'failed' || j.status === 'nsfw' ? '⚠️' : '⏳'}</Text>
            <View style={{ flex: 1 }}>
              <P>{LABEL[j.status]}</P>
              <P muted style={{ fontSize: 13 }}>{new Date(j.createdAt).toLocaleString()}</P>
            </View>
            <Text style={{ color: colors.muted }}>›</Text>
          </Card>
        </Pressable>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  icon: { fontSize: 24 },
});
