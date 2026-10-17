import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius } from '@/lib/theme';

export function Screen({ children, scroll = true }: { children: ReactNode; scroll?: boolean }) {
  return (
    <SafeAreaView style={styles.screen} edges={['left', 'right', 'bottom']}>
      {scroll ? (
        <ScrollView contentContainerStyle={styles.content}>{children}</ScrollView>
      ) : (
        <View style={styles.content}>{children}</View>
      )}
    </SafeAreaView>
  );
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  loading,
  disabled,
  style,
}: {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}) {
  const off = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: off }}
      onPress={onPress}
      disabled={off}
      style={({ pressed }) => [
        styles.button,
        variant === 'secondary' && styles.secondary,
        variant === 'danger' && styles.dangerButton,
        off && { opacity: 0.5 },
        pressed && { opacity: 0.8 },
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={colors.accentText} />
      ) : (
        <Text style={[styles.buttonText, variant !== 'primary' && { color: variant === 'danger' ? colors.danger : colors.text }]}>
          {title}
        </Text>
      )}
    </Pressable>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function H1({ children }: { children: ReactNode }) {
  return <Text style={styles.h1}>{children}</Text>;
}

export function P({ children, muted, style }: { children: ReactNode; muted?: boolean; style?: object }) {
  return <Text style={[styles.p, muted && { color: colors.muted }, style]}>{children}</Text>;
}

export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, gap: 16, width: '100%', maxWidth: 640, alignSelf: 'center' },
  button: {
    backgroundColor: colors.accent,
    borderRadius: radius,
    minHeight: 52,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondary: { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.cardBorder },
  dangerButton: { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.danger },
  buttonText: { color: colors.accentText, fontSize: 16, fontWeight: '700' },
  card: { backgroundColor: colors.card, borderColor: colors.cardBorder, borderWidth: 1, borderRadius: radius, padding: 16, gap: 8 },
  h1: { color: colors.text, fontSize: 26, fontWeight: '800' },
  p: { color: colors.text, fontSize: 15, lineHeight: 22 },
});

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <>
      <P style={{ fontWeight: '700', fontSize: 17, marginTop: 8 }}>{title}</P>
      <P muted>{children}</P>
    </>
  );
}
