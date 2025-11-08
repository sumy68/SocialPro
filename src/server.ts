import 'dotenv/config';
import app from './hono.js';
import { createServer } from 'node:http';

const PORT = Number(process.env.PORT ?? 10000);

function nodeHeadersToFetchHeaders(h: import('node:http').IncomingHttpHeaders) {
  const headers = new Headers();
  for (const [k, v] of Object.entries(h)) {
    if (Array.isArray(v)) {
      for (const vv of v) headers.append(k, vv);
    } else if (typeof v === 'string') {
      headers.set(k, v);
    }
  }
  return headers;
}

const server = createServer(async (req, res) => {
  try {
    const origin = `http://localhost:${PORT}`;
    const url = new URL(req.url || '/', origin);

    const headers = nodeHeadersToFetchHeaders(req.headers);
    const method = req.method || 'GET';
    const hasBody = method !== 'GET' && method !== 'HEAD';

    const init: any = { method, headers };
    if (hasBody) {
      init.body = req;         // stream body
      init.duplex = 'half';    // required by WHATWG Request on Node when streaming
    }

    const request = new Request(url, init as RequestInit);
    const r = await app.fetch(request);

    res.statusCode = r.status;
    r.headers.forEach((v, k) => res.setHeader(k, v));

    const ab = await r.arrayBuffer();
    res.end(Buffer.from(ab));
  } catch (err) {
    console.error('[server] error:', err);
    res.statusCode = 500;
    res.end('Internal Server Error');
  }
});

server.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
