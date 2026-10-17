import * as SecureStore from 'expo-secure-store';

// Native: values live in the Android Keystore-backed secure store.
export const storage = {
  get: (key: string) => SecureStore.getItemAsync(key),
  set: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  remove: (key: string) => SecureStore.deleteItemAsync(key),
};
