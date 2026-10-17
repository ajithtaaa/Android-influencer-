import { router } from 'expo-router';
import { Linking } from 'react-native';
import Constants from 'expo-constants';
import { Button, Card, P, Screen } from '@/components/ui';
import { SUPPORT_EMAIL } from '@/lib/theme';

export default function SettingsScreen() {
  return (
    <Screen>
      <Card>
        <Button title="Privacy Policy" variant="secondary" onPress={() => router.push('/privacy')} />
        <Button title="Terms of Use" variant="secondary" onPress={() => router.push('/terms')} />
        <Button title="Contact support" variant="secondary" onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}`)} />
      </Card>
      <Card>
        <P muted>Delete your account, videos and credits from our servers.</P>
        <Button title="Delete my data" variant="danger" onPress={() => router.push('/delete-account')} />
      </Card>
      <P muted style={{ textAlign: 'center', fontSize: 12 }}>Version {Constants.expoConfig?.version}</P>
    </Screen>
  );
}
