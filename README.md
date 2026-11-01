# Paeds Pouch

A web app (and iPhone and Android app) for Australian parents and carers to keep their children's health
records: growth (WHO percentiles), vaccines (National Immunisation Program),
medicines given, appointments, a printable summary for the doctor, and links to
trusted general information (RCH Kids Health Info, healthdirect).

It does not give medical advice, calculate doses or assess symptoms. Records
stay on the device (optionally passcode-locked), with encrypted backup files.

## Run locally

Prerequisite: Node.js 22.

```sh
npm install
cp .env.example .env.local   # optional: only needed for AI features
npm run dev
```

## Checks

```sh
npx tsc --noEmit        # type check
npm test                # unit tests (Vitest)
npm run build           # production build
npm run test:e2e        # end-to-end and accessibility tests (Playwright + axe)
```

GitHub Actions runs all four on every pull request (`.github/workflows/ci.yml`).
On a machine with Chromium already installed, set `PW_CHROMIUM_PATH` to its
path instead of running `npx playwright install`.

## AI features (off by default)

All AI requests go through one server endpoint, `api/ai.ts`, so API keys never
reach the browser:

- **Free tier:** Google Gemini 2.5 Flash (vaccine information, calming story,
  appointment questions, short parenting tips and more).
- **Premium tier:** Anthropic Claude (handover / GP letter summary, in-depth
  parenting guidance). Needs an entitlement token and only ever receives a
  de-identified summary. Shown as "Premium (coming soon)" until switched on;
  there are no payments yet.

`config/aiFeatures.ts` decides which tier each feature needs, and the server
enforces it. Every request needs the parent's consent first.

To switch AI on, and for every safeguard (rate limits, caps, the Vercel
Firewall checklist, entitlement tokens and `npm run mint-token` for test
tokens), see [docs/AI_SAFEGUARDS.md](docs/AI_SAFEGUARDS.md). Settings are
listed in [.env.example](.env.example).

## iPhone and Android apps

The same app is wrapped for iOS and Android with Capacitor 8 (`android/`,
`ios/`, `capacitor.config.ts`). The apps add an optional Face ID or
fingerprint unlock, keep the passcode lock settings in the iOS Keychain or
Android Keystore, and offer opt-in vaccine reminders as notifications on the
phone. Records stay on the phone and are excluded from cloud backups.

```sh
npm run cap:sync        # build the web app and copy it into both projects
npm run android         # open Android Studio
npm run ios             # open Xcode
npm run android:bundle  # signed AAB (needs the PAEDS_POUCH_* signing variables)
```

Building, signing, store checklists and launch steps are in
[docs/STORE_RELEASE.md](docs/STORE_RELEASE.md).

## Other docs

- [docs/REGULATORY_NOTES.md](docs/REGULATORY_NOTES.md): internal TGA
  self-assessment and risk register (not reviewed by the TGA).
- Privacy Policy and Terms of Use are in the app (`#/privacy`, `#/terms`);
  fill in the operator details in `config/legal.ts` and have them reviewed
  before launch.
