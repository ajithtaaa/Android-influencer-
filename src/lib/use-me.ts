import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { api, type Me } from './api';

/** Loads the account (credits + history) and refreshes when the screen is focused. */
export function useMe() {
  const [me, setMe] = useState<Me | null>(null);
  const [error, setError] = useState<string | null>(null);
  const reload = useCallback(() => {
    api.me().then((m) => {
      setMe(m);
      setError(null);
    }, (e: Error) => setError(e.message));
  }, []);
  useFocusEffect(reload);
  return { me, error, reload };
}
