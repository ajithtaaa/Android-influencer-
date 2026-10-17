import { useEffect, useState, type ReactNode } from 'react';
import { Text, View } from 'react-native';
import Checkbox from 'expo-checkbox';
import { router } from 'expo-router';
import { Button, Card, H1, P, Screen } from './ui';
import { storage } from '@/lib/storage';
import { APP_NAME, colors } from '@/lib/theme';

const KEY = 'accepted_terms_v1';

// First-run gate: confirms the user is 18+ and accepts the Terms and the
// acceptable-use rules before any face swap feature is available.
export function OnboardingGate({ children }: { children: ReactNode }) {
  const [state, setState] = useState<'loading' | 'needed' | 'done'>('loading');
  const [adult, setAdult] = useState(false);
  const [agree, setAgree] = useState(false);

  useEffect(() => {
    storage.get(KEY).then((v) => setState(v ? 'done' : 'needed'));
  }, []);

  if (state === 'loading') return <View style={{ flex: 1, backgroundColor: colors.bg }} />;
  if (state === 'done') return <>{children}</>;

  return (
    <Screen>
      <H1>Welcome to {APP_NAME}</H1>
      <P muted>Swap a face into a short video using AI. Before you start, please confirm:</P>
      <Card>
        <P>✅ Only use faces of yourself, or of people who gave you permission.</P>
        <P>🚫 No sexual content, no minors, no harassment, no impersonation to deceive or defraud.</P>
        <P>🏷️ Results are AI-generated and labelled as such. Don't present them as real.</P>
        <P>🚩 You can report any result from its screen.</P>
      </Card>
      <Row value={adult} onChange={setAdult} label="I am 18 years or older." />
      <Row
        value={agree}
        onChange={setAgree}
        label={
          <Text style={{ color: colors.text }}>
            I agree to the{' '}
            <Text style={{ color: colors.accent }} onPress={() => router.push('/terms')}>Terms of Use</Text> and{' '}
            <Text style={{ color: colors.accent }} onPress={() => router.push('/privacy')}>Privacy Policy</Text>.
          </Text>
        }
      />
      <Button
        title="Continue"
        disabled={!adult || !agree}
        onPress={async () => {
          await storage.set(KEY, new Date().toISOString());
          setState('done');
        }}
      />
      <P muted style={{ fontSize: 13 }}>Under 18? Sorry, this app isn't for you.</P>
    </Screen>
  );
}

function Row({ value, onChange, label }: { value: boolean; onChange: (v: boolean) => void; label: ReactNode }) {
  return (
    <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
      <Checkbox value={value} onValueChange={onChange} color={value ? colors.accent : undefined} />
      <View style={{ flex: 1 }}>{typeof label === 'string' ? <P>{label}</P> : label}</View>
    </View>
  );
}
