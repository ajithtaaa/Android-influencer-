// Web: localStorage, guarded because it can throw in private windows.
export const storage = {
  async get(key: string) {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  async set(key: string, value: string) {
    try {
      localStorage.setItem(key, value);
    } catch {}
  },
  async remove(key: string) {
    try {
      localStorage.removeItem(key);
    } catch {}
  },
};
