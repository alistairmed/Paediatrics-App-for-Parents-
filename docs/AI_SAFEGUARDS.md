# AI features: safeguards and how to switch them on

AI (Gemini) features are **off** by default. With them off, nothing a parent
enters leaves the device and `/api/gemini` answers `503`.

## What protects parents when AI is on

| Safeguard | Where |
| --- | --- |
| Explicit consent before the first request; nothing is sent if the parent declines. Re-asked when `AI_CONSENT_VERSION` changes. Can be withdrawn in **Privacy, Backup & Lock**. | `services/aiGuard.ts`, `components/AiConsent.tsx` |
| Daily cap of 20 requests per device (`AI_DAILY_LIMIT`). | `services/aiGuard.ts` |
| API key only on the server; browser calls the same-origin proxy. | `api/gemini.ts` |
| Same-origin check; model and tool allowlist. | `api/gemini.ts` |
| Best-effort per-IP limit: 20 requests per 10 minutes per server instance. | `api/gemini.ts` |
| Safety system instruction on every request (no medical advice, no doses, 000 for emergencies). | `services/prompts.ts` |

The device cap can be cleared by clearing site data, and the per-IP limit is
per server instance, so neither is a hard limit on cost. Add the firewall
rule below before switching AI on.

## Vercel Firewall rate limit (do this in the Vercel dashboard)

1. Open the project → **Firewall** → **Configure** → **New Rule**.
2. Name: `Limit AI proxy`.
3. If: **Request Path** *equals* `/api/gemini`.
4. Then: **Rate Limit** — Fixed window, **60 seconds**, **10 requests**, keyed by **IP Address**; action **Too Many Requests (429)**.
5. Save, then **Review Changes** → **Publish**.

Optionally add a second rule with a longer window (for example 100 requests
per 24 hours per IP). The app already shows a friendly message on `429`.

Also set a **budget alert** or quota on the Google AI Studio / Cloud project
that owns the API key.

## Switching AI on

1. Add the firewall rule above.
2. In Vercel → Settings → Environment Variables, set:
   - `GEMINI_API_KEY` — the server-side key (never a `VITE_` variable)
   - `ENABLE_AI=true` — lets the proxy answer
   - `VITE_ENABLE_AI=true` — shows AI features in the app (needs a rebuild)
3. Redeploy.
4. Have the privacy policy and consent wording reviewed: Google may process
   data outside Australia (APP 8), and health information is sensitive
   information under the Privacy Act.
