import { GoogleAuth } from 'google-auth-library';
import { env } from './env';
import { HttpError } from './errors';

// Verifies a one-time product purchase with the Google Play Developer API.
// Needs a service account with "View financial data" + "Manage orders"
// permission in Play Console (PLAY_SERVICE_ACCOUNT_JSON).

interface ProductPurchase {
  purchaseState?: number; // 0 purchased, 1 canceled, 2 pending
  consumptionState?: number; // 0 not consumed, 1 consumed
  obfuscatedExternalAccountId?: string;
  orderId?: string;
}

let auth: GoogleAuth | null = null;

export async function verifyPlayPurchase(productId: string, purchaseToken: string, userId: string) {
  if (!env.playServiceAccountJson) throw new HttpError(503, 'Google Play billing is not configured');
  auth ??= new GoogleAuth({
    credentials: JSON.parse(env.playServiceAccountJson),
    scopes: ['https://www.googleapis.com/auth/androidpublisher'],
  });
  const client = await auth.getClient();
  const url =
    `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${encodeURIComponent(env.playPackageName)}` +
    `/purchases/products/${encodeURIComponent(productId)}/tokens/${encodeURIComponent(purchaseToken)}`;
  const { data } = await client.request<ProductPurchase>({ url });

  if (data.purchaseState !== 0) throw new HttpError(400, 'Purchase is not completed');
  if (data.obfuscatedExternalAccountId && data.obfuscatedExternalAccountId !== userId) {
    throw new HttpError(403, 'Purchase belongs to another account');
  }
  return data;
}
