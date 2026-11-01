# AI features: safeguards and how to switch them on

AI (Gemini) features are **off** by default. With them off, nothing a parent
enters leaves the device and `/api/gemini` answers `503`.

## What protects parents when AI is on

| Safeguard | Where |
| --- | --- |
| Explicit consent before the first request; nothing is sent if the parent declines. Re-asked when `AI_CONSENT_VERSION` changes. Can be withdrawn in **Privacy, Backup & Lock**. | `services/aiGuard.ts`, `components/AiConsent.tsx` |
| Daily cap of 20 requests per device (`AI_DAILY_LIMIT`). | `services/aiGuard.ts` |
| API key only on the server; browser calls the same-origin proxy. | `api/gemini.ts` |
| Same-origin check; model and tool allowlist; every request names its feature, checked against an allow-list. | `api/gemini.ts` |
| Google Search grounding only for parenting tips and vaccine information. | `api/gemini.ts` |
| Google's error text is logged on the server only; the browser gets a generic message and status code. | `api/gemini.ts` |
| Best-effort per-IP limit: 20 requests per 10 minutes per server instance. | `api/gemini.ts` |
| Safety system instruction on every request (no medical advice, no doses, 000 for emergencies). | `services/prompts.ts` |

The device cap can be cleared by clearing site data, and the per-IP limit is
per server instance, so neither is a hard limit on cost. Add the firewall
rule below before switching AI on.

## Vercel Firewall rate limit checklist

Do this in the Vercel dashboard before switching AI on.

- [ ] Project → **Firewall** → **Configure** → **New Rule**, named `Limit AI proxy`
- [ ] Condition: **Request Path** *equals* `/api/gemini`
- [ ] Action: **Rate Limit**, fixed window **60 s**, **10 requests**, keyed by **IP Address**, respond **429**
- [ ] Optional second rule: same path, **24 h** window, **100 requests** per IP
- [ ] **Save** → **Review Changes** → **Publish**
- [ ] Check: send 11 requests in a minute from one IP and confirm the 11th gets `429`
- [ ] Set a budget alert or quota on the Google project that owns the API key

## Content-Security-Policy

`vercel.json` uses `style-src 'self'` with no `'unsafe-inline'`. React and
Recharts set styles through the DOM `style` property, which CSP allows;
inline `style="…"` attributes in HTML and `<style>` blocks are blocked.
`e2e/csp.e2e.ts` serves pages with the production policy and fails on any
violation, so a change that needs inline styles is caught in CI.

## Switching AI on

1. Complete the firewall checklist above.
2. In Vercel → Settings → Environment Variables, set:
   - `GEMINI_API_KEY` — the server-side key (never a `VITE_` variable)
   - `ENABLE_AI=true` — lets the proxy answer
   - `VITE_ENABLE_AI=true` — shows AI features in the app (needs a rebuild)
3. Redeploy.
4. Have the privacy policy and consent wording reviewed: Google may process
   data outside Australia (APP 8), and health information is sensitive
   information under the Privacy Act.
