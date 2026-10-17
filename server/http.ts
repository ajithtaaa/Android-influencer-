import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyToken } from './auth';
import { HttpError } from './errors';

export { HttpError };

type Handler = (req: VercelRequest, res: VercelResponse, ctx: { userId: string }) => Promise<unknown>;

/**
 * Wraps an API handler with CORS, method checks, auth and JSON error output.
 * Returning a value sends it as JSON.
 */
export function route(methods: string[], handler: Handler, opts: { auth?: boolean } = { auth: true }) {
  return async (req: VercelRequest, res: VercelResponse) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
    res.setHeader('Access-Control-Allow-Methods', [...methods, 'OPTIONS'].join(', '));
    if (req.method === 'OPTIONS') return res.status(204).end();
    if (!methods.includes(req.method ?? '')) return res.status(405).json({ error: 'Method not allowed' });
    try {
      const userId = opts.auth === false ? '' : verifyToken(req.headers.authorization);
      const result = await handler(req, res, { userId });
      if (!res.headersSent) res.status(200).json(result ?? { ok: true });
    } catch (err) {
      const status = err instanceof HttpError ? err.status : 500;
      if (status === 500) console.error(err);
      if (!res.headersSent) {
        res.status(status).json({ error: err instanceof Error ? err.message : 'Server error' });
      }
    }
  };
}

/** Parsed JSON body (the router reads the raw body once, see api/index.ts). */
export function body<T>(req: VercelRequest): T {
  const raw = (req as VercelRequest & { rawBody?: Buffer }).rawBody;
  if (!raw?.length) return {} as T;
  try {
    return JSON.parse(raw.toString('utf8')) as T;
  } catch {
    throw new HttpError(400, 'Invalid JSON');
  }
}
