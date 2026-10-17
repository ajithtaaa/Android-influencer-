import { Platform } from 'react-native';
import { storage } from './storage';

// The Android app talks to the deployed backend; the web build is served
// from the same origin, so relative URLs work there.
const BASE = (process.env.EXPO_PUBLIC_API_URL ?? (Platform.OS === 'web' ? '' : 'https://swapreel.vercel.app')).replace(/\/$/, '');

const TOKEN_KEY = 'session_token';

export interface Pack {
  id: string;
  credits: number;
  priceUsdCents: number;
  label: string;
  best?: boolean;
}

export interface AppConfig {
  demo: boolean;
  stripe: boolean;
  packs: Pack[];
}

export interface Job {
  id: string;
  status: 'queued' | 'in_progress' | 'completed' | 'failed' | 'nsfw';
  videoUrl?: string;
  error?: string;
  createdAt: string;
}

export interface Me {
  userId: string;
  credits: number;
  jobs: Job[];
}

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

let tokenPromise: Promise<string> | null = null;

async function createSession(): Promise<string> {
  const res = await fetch(`${BASE}/api/session`, { method: 'POST' });
  if (!res.ok) throw new ApiError(res.status, 'Could not connect. Check your internet connection.');
  const { token } = (await res.json()) as { token: string };
  await storage.set(TOKEN_KEY, token);
  return token;
}

function getToken(): Promise<string> {
  tokenPromise ??= storage.get(TOKEN_KEY).then((t) => t ?? createSession()).catch((err) => {
    tokenPromise = null;
    throw err;
  });
  return tokenPromise;
}

export async function getUserId(): Promise<string> {
  return (await getToken()).split('.')[0];
}

async function request<T>(path: string, init: RequestInit = {}, retry = true): Promise<T> {
  const token = await getToken();
  const res = await fetch(`${BASE}/api/${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...(init.headers ?? {}) },
  });
  if (res.status === 401 && retry) {
    await storage.remove(TOKEN_KEY);
    tokenPromise = null;
    return request<T>(path, init, false);
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, (data as { error?: string }).error ?? 'Something went wrong');
  return data as T;
}

const post = <T>(path: string, body: unknown) => request<T>(path, { method: 'POST', body: JSON.stringify(body) });

export const api = {
  config: () => fetch(`${BASE}/api/config`).then((r) => r.json() as Promise<AppConfig>),
  me: () => request<Me>('me'),
  job: (id: string) => request<Job>(`jobs/${encodeURIComponent(id)}`),
  uploadUrl: (contentType: string) =>
    post<{ demo?: boolean; uploadUrl: string; publicUrl: string; uploadHeaders: Record<string, string> }>('upload', { contentType }),
  swap: (videoUrl: string, faceUrl: string) => post<Job>('swap', { videoUrl, faceUrl, consent: true }),
  report: (jobId: string, reason: string, details?: string) => post('report', { jobId, reason, details }),
  verifyPlayPurchase: (productId: string, purchaseToken: string) =>
    post<{ credits: number }>('billing/google-verify', { productId, purchaseToken }),
  stripeCheckout: (packId: string) => post<{ url: string }>('billing/stripe-checkout', { packId }),
  demoGrant: (packId: string) => post<{ credits: number }>('billing/demo-grant', { packId }),
  async deleteAccount() {
    await request('me', { method: 'DELETE' });
    await storage.remove(TOKEN_KEY);
    tokenPromise = null;
  },
};
