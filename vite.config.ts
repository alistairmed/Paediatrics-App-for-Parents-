import fs from 'fs';
import path from 'path';
import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Serves api/gemini.ts during `npm run dev`, mirroring the Vercel function,
 * so the Gemini key stays on the server locally too (read from .env.local,
 * along with ENABLE_AI).
 */
const geminiDevProxy = (apiKey?: string, enableAi?: string): Plugin => ({
  name: 'gemini-dev-proxy',
  configureServer(server) {
    if (apiKey && !process.env.GEMINI_API_KEY) process.env.GEMINI_API_KEY = apiKey;
    if (enableAi && !process.env.ENABLE_AI) process.env.ENABLE_AI = enableAi;

    server.middlewares.use('/api/gemini', async (req, res) => {
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

      const { default: handler } = await server.ssrLoadModule('/api/gemini.ts');
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
      plugins: [react(), geminiDevProxy(env.GEMINI_API_KEY || env.API_KEY, env.ENABLE_AI), serviceWorker()],
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
