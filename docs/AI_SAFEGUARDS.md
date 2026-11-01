# AI features: safeguards and how to switch them on

AI features are **off** by default. With them off, nothing a parent enters
leaves the device and `/api/ai` answers `503`.

## Two providers, one endpoint

All AI requests go to `api/ai.ts`. Each request names its **feature** and
**tier**; `config/aiFeatures.ts` decides which tier each feature needs, and
the server refuses a request whose tier doesn't match (`403`).

| Tier | Provider and model | Features |
| --- | --- | --- |
| Free | Google Gemini 2.5 Flash | vaccine information, calming story, appointment questions, short parenting tips, explain a medical term, checklist summary, read a letter |
| Premium | Anthropic Claude (`claude-sonnet-5-5`) | handover / GP letter summary, in-depth parenting guidance |

Premium requests contain a **de-identified summary only**
(`services/deidentify.ts`): no name, date of birth (age instead), contact
details, care-team or family names, photos or letters. In free text, the
child's name, names already in the record, email addresses and phone numbers
are replaced. Other names a parent types can't be detected, so the consent
dialog asks parents to leave them out.

## What protects parents when AI is on

| Safeguard | Where |
| --- | --- |
| Explicit consent before the first request; nothing is sent if the parent declines. Re-asked when `AI_CONSENT_VERSION` changes (now 2, for the second provider). Can be withdrawn in **Privacy, Backup & Lock**. | `services/aiGuard.ts`, `components/AiConsent.tsx` |
| Daily cap of 20 requests per device (`AI_DAILY_LIMIT`). | `services/aiGuard.ts` |
| `ENABLE_AI` switch: `503` for everything unless `true`. | `api/ai.ts` |
| API keys only on the server; the browser calls the same-origin endpoint. | `api/ai.ts` |
| Same-origin check (`Sec-Fetch-Site`). | `api/ai.ts` |
| Best-effort per-IP limit: 20 requests per 10 minutes per server instance. | `api/ai.ts` |
| Safety system instruction forced on every request to either provider (no medical advice, no doses, 000 for emergencies). | `services/prompts.ts`, `api/ai.ts` |
| Feature allow-list; the server sets the tier, model, and output-token cap per feature. | `config/aiFeatures.ts` |
| Model allow-lists: `gemini-2.5-flash` (free), `claude-sonnet-5-5` (premium). | `config/aiFeatures.ts` |
| Input caps: 24,000 characters of text, 4 MB of image data; larger requests get `413` before any provider call. | `config/aiFeatures.ts`, `api/ai.ts` |
| Output caps: `maxOutputTokens` (Gemini) / `max_tokens` (Claude) from the feature map; a client can't raise them. | `config/aiFeatures.ts` |
| Google Search grounding only for short parenting tips and vaccine information; never on the Claude route. Claude requests carry no tools and text only. | `api/ai.ts` |
| Provider error text is logged on the server only; the browser gets a generic message and status code. | `api/ai.ts` |
| Premium: `PREMIUM_ENABLED` switch (`503` unless `true`), HMAC-signed entitlement token with expiry, and a per-token monthly request cap. | `api/_lib/entitlement.ts`, `api/_lib/usageStore.ts` |
| If Claude's safety classifiers decline a request, the API's server-side fallback retries on another Claude model; a final refusal returns a generic error. | `api/_lib/providers.ts` |

The device cap can be cleared by clearing site data, and the per-IP limit and
the in-memory premium count are per server instance, so none of them is a
hard limit on cost. Add the firewall rule below, and a shared usage store,
before switching AI on for real users.

## Premium entitlement tokens

There are no payments yet. A token looks like `pp1.<payload>.<signature>`:

- payload: base64url JSON `{ sub, jti, tier: "premium", exp, cap }`
- signature: HMAC-SHA256 over `pp1.<payload>` with `ENTITLEMENT_SECRET`
  (at least 32 characters), compared in constant time
- the app sends it as `Authorization: Bearer <token>`, only on premium requests
- `exp` is checked on every request; `cap` is premium requests per calendar
  month (UTC), counted per `jti`

**Usage store.** `api/_lib/usageStore.ts` defines
`UsageStore.increment(key, ttlSeconds)` with an in-memory default. To use
Vercel KV (or Upstash Redis), implement it with `INCR key` followed by
`EXPIRE key ttl` and call `setUsageStore()` once at module load.

**Test tokens (development only).**

```sh
ENTITLEMENT_SECRET=<same as the server> npm run mint-token -- --sub tester --days 7 --cap 20
```

Paste the printed code into **Privacy, Backup & Lock → Premium access code**.
The script refuses to run when `NODE_ENV=production` or on Vercel.

## Vercel Firewall rate limit checklist

Do this in the Vercel dashboard before switching AI on.

- [ ] Project → **Firewall** → **Configure** → **New Rule**, named `Limit AI endpoint`
- [ ] Condition: **Request Path** *equals* `/api/ai`
- [ ] Action: **Rate Limit**, fixed window **60 s**, **10 requests**, keyed by **IP Address**, respond **429**
- [ ] Optional second rule: same path, **24 h** window, **100 requests** per IP
- [ ] **Save** → **Review Changes** → **Publish**
- [ ] Check: send 11 requests in a minute from one IP and confirm the 11th gets `429`
- [ ] Set budget alerts or spend limits on the Google project and the Anthropic workspace that own the keys

## Content-Security-Policy

`vercel.json` uses `style-src 'self'` with no `'unsafe-inline'`, and
`connect-src 'self'`: the browser only ever talks to this site, and the server
calls Google and Anthropic. React and Recharts set styles through the DOM
`style` property, which CSP allows; inline `style="…"` attributes in HTML and
`<style>` blocks are blocked. `e2e/csp.e2e.ts` serves pages with the
production policy and fails on any violation.

## Switching AI on

1. Complete the firewall checklist above.
2. In Vercel → Settings → Environment Variables, set (see `.env.example`):
   - `GEMINI_API_KEY`: the server-side Gemini key (never a `VITE_` variable)
   - `ENABLE_AI=true`: lets `/api/ai` answer
   - `VITE_ENABLE_AI=true`: shows AI features in the app (needs a rebuild)
3. For premium, also set `ANTHROPIC_API_KEY`, `ENTITLEMENT_SECRET`,
   `PREMIUM_ENABLED=true` and `VITE_PREMIUM_ENABLED=true`, and plug in a
   shared usage store.
4. Redeploy.
5. Have the privacy policy and consent wording reviewed: Google and Anthropic
   may process data outside Australia (APP 8), and health information is
   sensitive information under the Privacy Act.
