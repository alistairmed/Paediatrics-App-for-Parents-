# Handover

Status at 17 November 2026. Read `CLAUDE.md` first (map, commands, rules); this file adds the decisions behind them and what is still open.

## Where things stand
- Everything is merged to `main` (latest: PR #17). CI (type check, unit tests, build, Playwright and axe) runs on every PR.
- Live on Vercel (project `v0-project`). AI and premium are **off** (`ENABLE_AI`, `VITE_ENABLE_AI`, `PREMIUM_ENABLED` unset).
- Native iOS and Android projects exist but have **never been built** (the cloud sessions have no Android SDK or Xcode).

## Decisions and why (don't undo without a reason)
- **No dosing, triage or diagnosis.** The dose calculator, symptom checker, "red flag" labels and the app's own growth alerts were removed for TGA software-as-a-medical-device risk. Medicines are label-style information only; the medicine log records doses but holds no intervals or maximums. Milestones say "To discuss" (amber); losing skills says "see your GP soon".
- **Checklists are "conversation starters"**, with no scores.
- **Old internal name kept on purpose:** `pedipulse_` storage keys, the `pedipulse-backup` format marker, the passcode check text and the service-worker cache prefix. Renaming them loses users' records, backups or locks.
- **Colours:** palette tokens in `index.css` `@theme`. Each shade is lightness-matched to the Tailwind shade it replaced, so contrast holds. Buttons and small links use `brand-dark` (#a9532a): plain terracotta with white text is 3.8:1, below AA.
- **Capacitor 8, not 6:** Google Play requires target API 36.
- **Records stay on the phone:** Android backup and device transfer are off (`data_extraction_rules.xml`); iOS excludes WebKit data from backups (`AppDelegate.swift`). Keychain/Keystore items are this-device-only. Moving phones uses the encrypted backup file.
- **Passcode key never stored.** It is derived from the passcode (PBKDF2, AES-GCM). The exception is opt-in biometric unlock, which stores the key in the Keychain/Keystore on that phone only.
- **Backups never carry device settings:** lock settings, AI consent and usage, premium code and reminder settings are dropped on restore, so a crafted file can't lock a parent out or turn on AI.
- **Vaccine reminders** are inexact local notifications (no exact-alarm permission, which needs a Play declaration) and never show the child's name.
- **AI** goes only through `api/ai.ts`: the server enforces the tier per feature (`config/aiFeatures.ts`), returns generic errors, and allows Google Search only for parenting tips and vaccine information. Premium (Claude) gets a de-identified summary only. The app origins `capacitor://localhost`, `https://localhost` and `http://localhost` are allowed with CORS; everything else is blocked.
- **CSP** has no `'unsafe-inline'`; `e2e/csp.e2e.ts` enforces it.

## Still open
1. **Store text** in `docs/STORE_RELEASE.md` section 7 now fits store limits (checked by `config/__tests__/storeText.test.ts`). Paste it into both consoles when the listings are set up.
2. **Native builds:** build the AAB and the iOS archive on a Mac or PC with Android Studio and Xcode (`docs/STORE_RELEASE.md` section 2). Set `YOUR_TEAM_ID` in `ios/ExportOptions.plist` and the `PAEDS_POUCH_*` signing variables. Never commit keys.
3. **iPad:** the iOS app targets iPhone and iPad (`TARGETED_DEVICE_FAMILY = 1,2`). Either provide 13" iPad screenshots or switch to iPhone-only.
4. **Real-phone test:** `docs/STORE_RELEASE.md` section 8, especially Face ID or fingerprint, reminders and backup restore. These native paths are unit-tested but untested on devices.
5. **Before switching AI on:** a shared usage store (Vercel KV; `api/_lib/usageStore.ts` has the interface), the Vercel Firewall rule, monthly spend limits, and a privacy review of the APP 8 wording.
6. **Reviews:** MDO/indemnity, TGA exclusion advice, privacy lawyer, and a clinical check of the NIP vaccine list (`clinical/vaccineSchedule.ts`) against health.gov.au.
7. **Store consoles:** Play (closed test of 12 testers for 14 days for personal accounts; health apps declaration; Data safety) and App Store Connect (privacy labels, review notes), per `docs/STORE_RELEASE.md`.

## Gotchas
- `npm audit` shows 8 moderate findings in dev-only Capacitor CLI and assets tooling. The "fix" downgrades them, so leave it.
- Playwright needs `PW_CHROMIUM_PATH=/opt/pw-browsers/chromium-1194/chrome-linux/chrome` in cloud sessions.
- e2e tests seed storage with `openWithChild()` (`e2e/helpers.ts`). Vaccine tests fix the clock with `page.clock.setFixedTime`.
- Changing a palette shade: re-run the axe tests. Changing the app origins or CSP: re-run `api/__tests__/ai.test.ts` and `e2e/csp.e2e.ts`.

## Starter prompt for a new chat

```
Repo: alistairmed/Paediatrics-App-for-Parents- (Paeds Pouch). Read CLAUDE.md and docs/HANDOVER.md first; open other files only as the task needs.
Rules: no medical advice, dosing or triage content; records stay on-device; keep the axe tests passing; work on a branch with small commits; run the relevant tests while working and npm run test:e2e once before finishing.
Task: <one task, e.g. "item 1 in docs/HANDOVER.md: shorten the store text">
```
