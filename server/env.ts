// Central place for server configuration. Every secret comes from environment
// variables set in the hosting dashboard (Vercel) — never commit real values.

export const env = {
  appSecret: process.env.APP_SECRET ?? '',
  publicUrl: (process.env.PUBLIC_APP_URL ?? '').replace(/\/$/, ''),

  // Higgsfield (server-side only, format KEY_ID:KEY_SECRET)
  hfCredentials: process.env.HF_CREDENTIALS ?? '',
  hfBaseUrl: (process.env.HF_BASE_URL ?? 'https://api.higgsfield.ai').replace(/\/$/, ''),
  hfSwapModel: process.env.HF_SWAP_MODEL ?? '',
  hfSwapInputTemplate: process.env.HF_SWAP_INPUT_TEMPLATE ?? '',

  // Storage (Upstash Redis REST — Vercel's KV integration sets these)
  kvUrl: process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL ?? '',
  kvToken: process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN ?? '',

  // Stripe (web checkout)
  stripeSecretKey: process.env.STRIPE_SECRET_KEY ?? '',
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? '',

  // Google Play (purchase verification)
  playPackageName: process.env.PLAY_PACKAGE_NAME ?? 'com.swapreel.app',
  playServiceAccountJson: process.env.PLAY_SERVICE_ACCOUNT_JSON ?? '',

  freeCredits: Number(process.env.FREE_CREDITS ?? '0'),
};

/** Demo mode: no Higgsfield key configured, so swaps return a sample clip. */
export const isDemo = () => !env.hfCredentials || !env.hfSwapModel;
export const stripeEnabled = () => Boolean(env.stripeSecretKey);
