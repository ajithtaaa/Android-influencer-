import type { VercelRequest, VercelResponse } from '@vercel/node';
import demoGrant from '../server/routes/billing/demo-grant';
import googleVerify from '../server/routes/billing/google-verify';
import stripeCheckout from '../server/routes/billing/stripe-checkout';
import stripeWebhook from '../server/routes/billing/stripe-webhook';
import configRoute from '../server/routes/config';
import job from '../server/routes/job';
import me from '../server/routes/me';
import report from '../server/routes/report';
import session from '../server/routes/session';
import swap from '../server/routes/swap';
import upload from '../server/routes/upload';

// Single serverless function for the whole API (vercel.json rewrites
// /api/* here). Keeping one function means one warm instance and lets the
// demo run without a database.

export const config = { api: { bodyParser: false } };

type Handler = (req: VercelRequest, res: VercelResponse) => unknown;

const routes: Record<string, Handler> = {
  config: configRoute,
  session,
  me,
  upload,
  swap,
  report,
  'billing/google-verify': googleVerify,
  'billing/stripe-checkout': stripeCheckout,
  'billing/stripe-webhook': stripeWebhook,
  'billing/demo-grant': demoGrant,
};

async function readBody(req: VercelRequest): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  return Buffer.concat(chunks);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const path = String(req.query.path ?? '').replace(/^\/+|\/+$/g, '');
  const jobMatch = /^jobs\/([\w-]+)$/.exec(path);
  const target = jobMatch ? job : routes[path];
  if (jobMatch) req.query.id = jobMatch[1];
  if (!target) return res.status(404).json({ error: 'Not found' });
  if (req.method !== 'GET' && req.method !== 'OPTIONS') {
    (req as VercelRequest & { rawBody?: Buffer }).rawBody = await readBody(req);
  }
  return target(req, res);
}
