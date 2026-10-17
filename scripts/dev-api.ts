// Local API server for development: npm run dev:api
import http from 'node:http';
import handler from '../api/index';
http.createServer((req: any, res: any) => {
  const u = new URL(req.url, 'http://x');
  req.query = Object.fromEntries(u.searchParams);
  if (u.pathname.startsWith('/api/')) req.query.path = u.pathname.slice(5);
  res.status = (c: number) => { res.statusCode = c; return res; };
  res.json = (o: unknown) => { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(o)); return res; };
  res.send = (s: string) => { res.end(s); return res; };
  handler(req, res);
}).listen(Number(process.env.PORT ?? 3001), () => console.log('API on http://localhost:' + (process.env.PORT ?? 3001)));
