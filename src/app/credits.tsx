import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Button, Card, H1, P, Screen } from '@/components/ui';
import { api, type AppConfig, type Pack } from '@/lib/api';
import { buy, disconnect, loadPrices, type StorePrice } from '@/lib/billing';
import { colors, radius } from '@/lib/theme';
import { useMe } from '@/lib/use-me';

export default function CreditsScreen() {
  const { paid } = useLocalSearchParams<{ paid?: string }>();
  const { me, reload } = useMe();
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [prices, setPrices] = useState<StorePrice>({});
  const [selected, setSelected] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(paid ? 'Payment received — credits will appear in a moment.' : null);

  useEffect(() => {
    api.config().then(async (c) => {
      setConfig(c);
      setSelected(c.packs.find((p) => p.best)?.id ?? c.packs[0]?.id ?? null);
      setPrices(await loadPrices(c.packs).catch(() => ({})));
      reload();
    }, () => setMessage('Could not load the shop. Check your connection.'));
    return disconnect;
  }, [reload]);

  // Stripe webhooks can land a few seconds after the redirect back.
  useEffect(() => {
    if (!paid) return;
    const t = setInterval(reload, 3000);
    const stop = setTimeout(() => clearInterval(t), 30000);
    return () => {
      clearInterval(t);
      clearTimeout(stop);
    };
  }, [paid, reload]);

  async function purchase() {
    const pack = config?.packs.find((p) => p.id === selected);
    if (!pack || !config) return;
    setBusy(true);
    setMessage(null);
    try {
      const result = await buy(pack, { demo: config.demo, stripe: config.stripe });
      if (result === 'purchased') setMessage(`Added ${pack.credits} credits. Enjoy!`);
      if (result === 'pending') setMessage('Your payment is pending. Credits are added once it completes.');
      reload();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Purchase failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen>
      <H1>⚡ {me ? me.credits : '…'} credits</H1>
      <P muted>1 credit = 1 face swap video. Failed or blocked swaps are refunded automatically. Credits never expire.</P>

      {config?.packs.map((p) => (
        <PackRow key={p.id} pack={p} price={prices[p.id]} selected={selected === p.id} onPress={() => setSelected(p.id)} />
      ))}

      <Button title="Buy" loading={busy} disabled={!selected} onPress={purchase} />
      {message && <P style={{ textAlign: 'center' }}>{message}</P>}

      <P muted style={{ fontSize: 12, textAlign: 'center' }}>
        {Platform.OS === 'android'
          ? 'Payments are processed securely by Google Play.'
          : config?.demo
            ? 'Demo mode: purchases are simulated and free.'
            : 'Payments are processed securely by Stripe.'}
      </P>
    </Screen>
  );
}

function PackRow({ pack, price, selected, onPress }: { pack: Pack; price?: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="radio" accessibilityState={{ selected }}>
      <Card style={[styles.pack, selected && { borderColor: colors.accent }]}>
        <View style={{ flex: 1 }}>
          <Text style={styles.packTitle}>
            {pack.credits} credits {pack.best ? <Text style={styles.best}> BEST VALUE </Text> : null}
          </Text>
          <P muted>{pack.label}</P>
        </View>
        <Text style={styles.price}>{price ?? '—'}</Text>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pack: { flexDirection: 'row', alignItems: 'center', borderRadius: radius, borderWidth: 2 },
  packTitle: { color: colors.text, fontSize: 18, fontWeight: '700' },
  best: { color: colors.accentText, backgroundColor: colors.accent, fontSize: 11, fontWeight: '800' },
  price: { color: colors.text, fontSize: 18, fontWeight: '700' },
});
