import {
  type Purchase,
  ErrorCode,
  endConnection,
  fetchProducts,
  finishTransaction,
  getAvailablePurchases,
  initConnection,
  purchaseErrorListener,
  purchaseUpdatedListener,
  requestPurchase,
} from 'expo-iap';
import { api, getUserId, type Pack } from './api';

// Android: credits are sold as consumable in-app products through Google Play
// Billing, as required by Google Play's Payments policy for digital goods.

export interface StorePrice {
  [productId: string]: string;
}

let connected = false;

async function connect() {
  if (!connected) {
    await initConnection();
    connected = true;
  }
}

/** Verifies on the server, then consumes so the pack can be bought again. */
async function deliver(purchase: Purchase) {
  if (purchase.purchaseState !== 'purchased' || !purchase.purchaseToken) return;
  await api.verifyPlayPurchase(purchase.productId, purchase.purchaseToken);
  await finishTransaction({ purchase, isConsumable: true });
}

export async function loadPrices(packs: Pack[]): Promise<StorePrice> {
  await connect();
  const products = (await fetchProducts({ skus: packs.map((p) => p.id), type: 'in-app' })) ?? [];
  // Deliver anything bought earlier but not yet credited (e.g. app was killed).
  const pending = await getAvailablePurchases().catch(() => [] as Purchase[]);
  await Promise.all(pending.map((p) => deliver(p).catch(() => undefined)));
  return Object.fromEntries(products.map((p) => [p.id, p.displayPrice]));
}

export async function buy(pack: Pack, _opts?: { demo: boolean; stripe: boolean }): Promise<'purchased' | 'cancelled' | 'pending'> {
  await connect();
  const userId = await getUserId();
  return new Promise((resolve, reject) => {
    const cleanup = () => {
      updated.remove();
      failed.remove();
    };
    const updated = purchaseUpdatedListener(async (purchase) => {
      if (purchase.productId !== pack.id) return;
      cleanup();
      if (purchase.purchaseState === 'pending') return resolve('pending');
      try {
        await deliver(purchase);
        resolve('purchased');
      } catch (err) {
        reject(err);
      }
    });
    const failed = purchaseErrorListener((error) => {
      cleanup();
      if (error.code === ErrorCode.UserCancelled) resolve('cancelled');
      else reject(new Error(error.message));
    });
    requestPurchase({
      type: 'in-app',
      // obfuscatedAccountId ties the purchase to this account on the server.
      request: { google: { skus: [pack.id], obfuscatedAccountId: userId } },
    }).catch((err) => {
      cleanup();
      reject(err);
    });
  });
}

export function disconnect() {
  if (connected) endConnection().catch(() => undefined);
  connected = false;
}
