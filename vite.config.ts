import fs from 'fs';
import path from 'path';
import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

// Server-only settings api/ai.ts reads. Never VITE_-prefixed, so never in the browser bundle.
const SERVER_ENV = ['GEMINI_API_KEY', 'API_KEY', 'ENABLE_AI', 'ANTHROPIC_API_KEY', 'PREMIUM_ENABLED', 'ENTITLEMENT_SECRET'];

/**
 * Serves api/ai.ts during `npm run dev`, mirroring the Vercel function, so
 * API keys stay on the server locally too (read from .env.local).
 */
const aiDevProxy = (env: Record<string, string>): Plugin => ({
  name: 'ai-dev-proxy',
  configureServer(server) {
    for (const key of SERVER_ENV) if (env[key] && !process.env[key]) process.env[key] = env[key];

    server.middlewares.use('/api/ai', async (req, res) => {
      const send = (code: number, body?: unknown) => {
        res.statusCode = code;
        if (body === undefined) return res.end();
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(body));
      };

      let raw = '';
      for await (const chunk of req) raw += chunk;
      let body: unknown;
      try {
        body = raw ? JSON.parse(raw) : undefined;
      } catch {
        return send(400, { error: 'Invalid JSON body.' });
      }

      const { default: handler } = await server.ssrLoadModule('/api/ai.ts');
      await handler(
        { method: req.method, body, headers: req.headers },
        {
          setHeader: (name: string, value: string) => res.setHeader(name, value),
          status: (code: number) => ({
            json: (json: unknown) => send(code, json),
            end: () => send(code),
          }),
        }
      );
    });
  },
});

/**
 * Writes sw.js at build time with the list of every built file, so the
 * service worker can save the whole app for offline use.
 */
const serviceWorker = (): Plugin => ({
  name: 'pedipulse-service-worker',
  apply: 'build',
  generateBundle(_options, bundle) {
    const publicFiles = ['/manifest.webmanifest', '/icons/icon-192.png', '/icons/icon-512.png', '/icons/apple-touch-icon.png', '/icons/favicon-32.png'];
    const built = Object.keys(bundle).filter(f => !f.endsWith('.map')).map(f => '/' + f);
    const precache = ['/', ...new Set([...built, ...publicFiles])];
    const version = Date.now().toString(36);
    const source = fs.readFileSync(path.resolve(__dirname, 'sw-template.js'), 'utf8')
      .replaceAll('__PRECACHE__', JSON.stringify(precache))
      .replaceAll('__VERSION__', version);
    this.emitFile({ type: 'asset', fileName: 'sw.js', source });
  },
});

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react(), aiDevProxy(env), serviceWorker()],
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
