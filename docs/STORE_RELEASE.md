# Paeds Pouch: store release and launch

How to build, submit and launch Paeds Pouch on the web, Google Play and the
App Store. Store rules change often: check each console's current help pages
when you submit. Items marked **(check)** come from secondary sources.

- App ID / bundle ID: `au.com.paedspouch.app` (permanent once published)
- Version: 1.0.0 (Android `versionCode 1`, iOS build `1`)
- Native shell: Capacitor 8, Android target SDK 36

---

## 1. Before any store build

1. Add the brand pack to `brand/` (icons, `svg/logo-parent.svg`, `svg/icon-parent.svg`), then:
   ```sh
   node scripts/install-brand-assets.mjs
   npm run build && npm run assets && npx cap sync
   ```
   This replaces the web icons and generates every Android and iOS icon and splash screen.
2. Fill in `config/legal.ts`: operator, contact email, effective date. Have the Privacy Policy and Terms reviewed by a lawyer.
3. Decide whether AI is on for this release. With AI off (the default), the apps make **no network calls**. If AI is on, set `VITE_API_BASE_URL` to the deployed site for app builds (see section 6) and re-check the privacy answers in sections 3 and 4.
4. Bump versions for every upload: `versionCode` and `versionName` in `android/app/build.gradle`; `CURRENT_PROJECT_VERSION` and `MARKETING_VERSION` in Xcode (App target → General).
5. Run the checks: `npx tsc --noEmit && npm test && npm run build && npm run test:e2e`.

## 2. Build commands

### Android App Bundle (AAB)

Needs the Android SDK (Android Studio) and JDK 21.

One-time: create an **upload key** and keep it outside the repo (Play App Signing holds the real signing key):

```sh
keytool -genkeypair -v -keystore ~/secure/paeds-pouch-upload.jks \
  -alias paeds-pouch -keyalg RSA -keysize 4096 -validity 10000
```

Each release:

```sh
export PAEDS_POUCH_KEYSTORE_FILE=~/secure/paeds-pouch-upload.jks
export PAEDS_POUCH_KEYSTORE_PASSWORD='…'
export PAEDS_POUCH_KEY_ALIAS=paeds-pouch
export PAEDS_POUCH_KEY_PASSWORD='…'
# Only if AI is on in this release:
# export VITE_API_BASE_URL=https://your-domain.com.au

npm ci
npm run android:bundle
# Output: android/app/build/outputs/bundle/release/app-release.aab
```

Without the `PAEDS_POUCH_*` variables the bundle is unsigned and Play will reject it. Never commit the keystore or passwords (`.gitignore` blocks `*.jks`, `*.keystore` and `.env*`).

### iOS archive

Needs a Mac with Xcode and an Apple Developer account. The project uses Swift Package Manager (no CocoaPods).

```sh
npm ci
npm run cap:sync
# Either open Xcode:  npx cap open ios   → Product → Archive → Distribute App
# Or from the command line (set YOUR_TEAM_ID in ios/ExportOptions.plist first):
xcodebuild -project ios/App/App.xcodeproj -scheme App -configuration Release \
  -destination 'generic/platform=iOS' -archivePath build/PaedsPouch.xcarchive archive
xcodebuild -exportArchive -archivePath build/PaedsPouch.xcarchive \
  -exportOptionsPlist ios/ExportOptions.plist -exportPath build/ios
# Upload build/ios/App.ipa with Xcode Organizer or Transporter.
```

The app targets iPhone **and iPad** (`TARGETED_DEVICE_FAMILY = 1,2`). To ship iPhone-only, set Targeted Device Families to iPhone in Xcode; otherwise you need iPad screenshots too.

---

## 3. Google Play Console checklist

**Account**
- [ ] Developer account. A **personal** account created after 13 Nov 2023 must run a **closed test with at least 12 testers opted in for 14 continuous days** before production access **(check)**. An organisation account (with a D-U-N-S number) is exempt **(check)**.
- [ ] Complete developer identity verification.

**Store listing**
- [ ] App name (max 30), short description (max 80), full description (max 4000): see section 7
- [ ] App icon 512 × 512 PNG; feature graphic 1024 × 500
- [ ] Phone screenshots: at least 2, PNG or JPEG, 320–3840 px per side, 16:9 or 9:16. Add 7" and 10" tablet screenshots if you want tablet visibility
- [ ] Category: Medical (or Parenting). Contact email, privacy policy URL (`https://your-domain/#/privacy`)

**App content (Policy → App content)**
- [ ] Privacy policy URL
- [ ] **Health apps declaration**: record-keeping and general health information for parents; no diagnosis, triage or dosing; no Health Connect
- [ ] **Data safety** (AI off):
  - Data collected: **No**. Data shared: **No**. Records stay on the device; app data is excluded from Android backup and device transfer
  - Encrypted in transit: not applicable (no data sent). Users can request deletion: in-app "Delete Everything on This Device"
  - If AI is on: declare "Health info" and "Other user-generated content", collected only when the user uses an AI feature, **processed ephemerally**, optional, with the purpose "App functionality"; shared with Google / Anthropic as service providers. Re-check the wording with the current form
- [ ] Content rating (IARC questionnaire): reference/medical information, no violence, no user-to-user content, no purchases. Expect Everyone / PEGI 3
- [ ] Target audience: **adults (18+)**. The app is for parents and carers, not children
- [ ] Ads: **No ads**
- [ ] Government apps: No. Financial features: No

**Permissions the app uses**: notifications (opt-in vaccine reminders), biometrics (opt-in unlock), internet (AI only). Exact alarms are **not** requested.

**Release**
- [ ] Upload the AAB to **Closed testing**, add at least 12 testers, wait 14 days, then apply for production
- [ ] Release notes, roll out

## 4. App Store Connect checklist

- [ ] Apple Developer Program membership (organisation account recommended for a health app)
- [ ] New app: name (max 30), subtitle (max 30), bundle ID `au.com.paedspouch.app`, SKU `paeds-pouch`, primary language English (Australia)
- [ ] Category: Medical (primary), Health & Fitness or Lifestyle (secondary)
- [ ] Screenshots, flat PNG or JPEG with no transparency:
  - iPhone 6.9": 1320 × 2868 or 1290 × 2796 (smaller iPhones are scaled from these) **(check)**
  - iPad 13": 2064 × 2752 or 2048 × 2732, only if the app stays universal
- [ ] Keywords (max 100 characters, commas, no spaces needed), description, support URL, privacy policy URL
- [ ] **App Privacy (nutrition labels)**, AI off: **Data Not Collected**. Tracking: **No**. This matches `ios/App/App/PrivacyInfo.xcprivacy`. If AI is on, declare Health & Fitness "Health" and "Other user content", linked to the user: No, used for tracking: No, purpose "App Functionality"; update the privacy manifest to match
- [ ] Age rating questionnaire: medical or treatment information present (informational); no unrestricted web access; no user-generated content shared with others
- [ ] Export compliance: the app encrypts records with standard algorithms (Web Crypto AES-GCM). Answer the encryption questions in App Store Connect; record the outcome as `ITSAppUsesNonExemptEncryption` in `Info.plist` once confirmed
- [ ] **Review notes** (see section 7): explain record-keeping and education only, no diagnosis, triage or dosing; data on-device; AI optional and off. No login is needed, so no demo account
- [ ] Guideline 1.4.1 (medical apps): the app tells parents to check with their GP, pharmacist or child health nurse, and links 000 and healthdirect

## 5. Vercel launch checklist

- [ ] Production branch: `main`. Builds: `npm run build`; output `dist`
- [ ] Environment variables (Production): `ENABLE_AI` / `VITE_ENABLE_AI` (false unless switching AI on); for AI see `docs/AI_SAFEGUARDS.md` (`GEMINI_API_KEY`, `ANTHROPIC_API_KEY`, `ENTITLEMENT_SECRET`, `PREMIUM_ENABLED`, `VITE_PREMIUM_ENABLED`). Never prefix secrets with `VITE_`
- [ ] **Deployment Protection**: keep Preview deployments protected (Vercel Authentication). Production stays public
- [ ] **Domain**: add `your-domain.com.au`, set DNS, confirm HTTPS. Use it in the privacy policy URL and in `VITE_API_BASE_URL` for app builds
- [ ] Security headers and CSP come from `vercel.json`; check them on the live site (securityheaders.com)
- [ ] **Firewall rate limit** on `/api/ai`: checklist in `docs/AI_SAFEGUARDS.md`
- [ ] **Spend limits**: set a monthly limit in Google AI Studio and the Anthropic Console before switching AI on
- [ ] Check the live site: install the PWA, go offline, reload, open every screen

## 6. AI in the apps (only if switched on)

The apps load from the phone, so they call the deployed site's `/api/ai`. Build them with `VITE_API_BASE_URL=https://your-domain.com.au` plus `VITE_ENABLE_AI=true` (and `VITE_PREMIUM_ENABLED` if needed). `api/ai.ts` accepts the app origins (`capacitor://localhost`, `https://localhost`, `http://localhost`) and still blocks other websites. With AI off, leave these unset: the apps make no network calls.

## 7. Draft store text

| Field | Draft | Length | Note |
| --- | --- | --- | --- |
| Title | Paeds Pouch: Child Health Record | 32 | **Over the 30-character limit on both stores.** Options: "Paeds Pouch: Child Health" (25), "Paeds Pouch: Child Records" (26) |
| Subtitle (App Store) | Growth, vaccines, appointments | 30 | Fits |
| Short description (Play) | Keep your child's growth, vaccines and appointments in one private place on your phone. | 87 | **Over Play's 80.** Option: "Your child's growth, vaccines and appointments, kept private on your phone." (75) |
| Keywords (App Store) | child health record, growth chart, vaccine schedule, immunisation, baby tracker, Red Book, paediatric, milestones | 113 | **Over Apple's 100** (106 without spaces). Words in the title are already indexed, so drop "child health record": `growth chart,vaccine schedule,immunisation,baby tracker,Red Book,paediatric,milestones` (85) |
| Review note | Record-keeping and education app. No diagnosis, triage or dosing. Data stored on-device. AI features are optional and use de-identified text. | | Add: "AI features are switched off in this build." if true |

**Full description (draft)**

> Paeds Pouch keeps your child's health records in one private place on your phone.
>
> • Growth charts with WHO percentiles, from birth to 5 years
> • Australian National Immunisation Program schedule, with what's due, upcoming or overdue, and optional reminders on your phone
> • Appointments, medicines given, allergies and conditions
> • A one-page summary to print or show your GP
> • Checklists to help you put what you've noticed into words before an appointment
> • Links to trusted information from the Royal Children's Hospital and healthdirect
>
> Private by design: no account, no ads, no tracking. Records stay on your phone, with an optional passcode lock, Face ID or fingerprint unlock, and encrypted backup files you control.
>
> Paeds Pouch is for record-keeping and general information. It doesn't diagnose, assess symptoms or tell you how much medicine to give. Always talk to your GP, pharmacist or child health nurse about your child's health. In an emergency, call 000.

## 8. Real-phone test checklist

Run on at least one iPhone and one Android phone, each on a recent OS version.

**iPhone Safari (PWA)**
- [ ] Open the site, Share → Add to Home Screen; open from the icon (no browser bar; terracotta theme)
- [ ] Turn on Airplane Mode and reopen: the app loads and records are there
- [ ] Growth, vaccines, summary print (Share → Print → pinch to save PDF), backup save and restore (Files)
- [ ] Larger Text (Settings → Accessibility) at a large size: no overlapping text; VoiceOver reads menu items and checkboxes

**Android Chrome (PWA)**
- [ ] Install from the menu; open from the icon; offline reload works
- [ ] Back gesture closes the menu and moves between screens
- [ ] Backup file saves to Downloads and restores; TalkBack reads controls; font size at largest

**Both native builds** (TestFlight / Play closed testing)
- [ ] First launch: splash screen, safety notice, add a child; status bar readable
- [ ] Passcode lock on; background the app for over 5 minutes; it asks for the passcode
- [ ] Face ID / fingerprint: turn on (needs passcode), lock, unlock with biometrics; "Use passcode" fallback; change the passcode and check biometrics must be turned on again
- [ ] Vaccine reminders: turn on, allow notifications; set a test child's date of birth so a visit is due tomorrow, wait for the 9am reminder; the text doesn't include the child's name; turn off and check it's cancelled
- [ ] Keyboard doesn't cover the input fields; rotate the phone
- [ ] Photo of a letter: camera and photo library permission prompts show the right text (iOS)
- [ ] Uninstall and reinstall: records are gone (expected: they aren't in cloud backups). Restore from a backup file
- [ ] iOS: confirm the app's data isn't in an iCloud backup (Settings → Apple Account → iCloud → Manage Storage → Backups → this phone → apps list)
- [ ] With AI off: use a network monitor (Charles or Proxyman) and confirm no network calls
- [ ] Delete Everything on This Device: everything is gone, including Face ID unlock and the lock

## 9. Outside the code (you)

- [ ] Medical defence organisation (MDO) and indemnity review of the app and its wording
- [ ] TGA: confirm the app is excluded or exempt as software (record-keeping and general information, no diagnosis, triage or dosing). See `docs/REGULATORY_NOTES.md`. Get advice before turning AI on
- [ ] Privacy lawyer review: Privacy Policy, Terms, APP 8 wording
- [ ] Clinical review of the vaccine schedule wording against the current health.gov.au NIP page
