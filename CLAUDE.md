# Paeds Pouch - notes for Claude Code

Read this instead of exploring the repo. Open only the files a task needs.

## What it is
- Health records app for Australian parents: growth (WHO percentiles), vaccines (NIP), medicines given, appointments, printable summary, links to RCH Kids Health Info and healthdirect.
- It does NOT give medical advice, calculate doses or assess symptoms. Never add features that do (TGA software as a medical device risk; see docs/REGULATORY_NOTES.md).
- React 19 + TypeScript + Vite PWA; iOS and Android via Capacitor 8 (`android/`, `ios/`, `capacitor.config.ts`). Node 22.
- Records stay on the device (encrypted). AI is off by default and goes only through `api/ai.ts` (Vercel function).

## Where things are
- `components/` one file per screen or widget (eg GrowthTracker, VaccineTracker, MedicineLog, HandoverSummary, LockScreen, BackupRestore)
- `clinical/` pure logic and reference data: growth, vaccineSchedule, whoGrowthData, handover, vaccineReminders, factSheets
- `context/` React contexts (children, medical history, navigation, toasts)
- `services/` ai, aiGuard (consent, daily cap), deidentify, prompts, secureStore, biometricUnlock, vaccineNotifications
- `utils/` crypto (AES-GCM), vault, backup, image
- `config/` aiFeatures (which tier each AI feature needs), features (VITE_ flags), legal, platform
- `api/` ai.ts plus `_lib/` entitlement, providers, usageStore
- Tests: `__tests__/` beside each folder (Vitest); `e2e/` (Playwright + axe)
- Docs: docs/AI_SAFEGUARDS.md, docs/REGULATORY_NOTES.md, docs/STORE_RELEASE.md

## Commands
- `npx tsc --noEmit` type check
- `npm test` unit tests; `npx vitest run <path>` for one file (prefer this while working)
- `npm run build` production build
- `npm run test:e2e` end-to-end and accessibility (slow: run once before finishing, not after every edit)
- `npm run cap:sync` copy the build into the native apps

## Rules
- Never put a key or secret in a VITE_ variable or client code; server-only names are listed in vite.config.ts (SERVER_ENV).
- Every premium AI request goes through services/deidentify.ts; never send names, dates of birth, contact details or photos.
- Keep the CSP in vercel.json strict; never cache /api/ responses in sw-template.js.
- Health text: plain Australian English, about Year 7 reading level, "talk to your GP" where relevant, no emoji.
- Brand: terracotta, deep navy or dark brown text, cream backgrounds, soft sky blue accent.
- Small focused changes; add or update a test with each change; work on a branch, never push to main.

## Saving usage
- Default to Sonnet; use Opus only for hard debugging or security review.
- Do not read whole folders or run the full e2e suite to orient yourself; this file is the map.
- Agents in .claude/agents (security-scanner, mobile-optimizer, accessibility-pro) are for pre-release reviews, not every change.
