import { Stack, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { OnboardingGate } from '@/components/onboarding-gate';
import { colors } from '@/lib/theme';

// Legal pages must stay reachable without onboarding (they are also the
// public URLs entered in Play Console).
const PUBLIC_PAGES = ['/privacy', '/terms', '/delete-account'];

export default function RootLayout() {
  const pathname = usePathname();
  const stack = (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.bg },
        headerTintColor: colors.text,
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.bg },
      }}>
      <Stack.Screen name="index" options={{ title: 'SwapReel' }} />
      <Stack.Screen name="result/[id]" options={{ title: 'Your video' }} />
      <Stack.Screen name="library" options={{ title: 'My videos' }} />
      <Stack.Screen name="credits" options={{ title: 'Get credits' }} />
      <Stack.Screen name="settings" options={{ title: 'Settings' }} />
      <Stack.Screen name="privacy" options={{ title: 'Privacy Policy' }} />
      <Stack.Screen name="terms" options={{ title: 'Terms of Use' }} />
      <Stack.Screen name="delete-account" options={{ title: 'Delete your data' }} />
    </Stack>
  );
  return (
    <>
      <StatusBar style="light" />
      {PUBLIC_PAGES.includes(pathname) ? stack : <OnboardingGate>{stack}</OnboardingGate>}
    </>
  );
}
