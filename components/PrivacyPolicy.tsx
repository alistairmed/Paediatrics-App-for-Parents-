import React from 'react';
import { LEGAL } from '../config/legal';
import { AI_ENABLED } from '../config/features';
import { LegalPage } from './LegalPage';

export const PrivacyPolicy: React.FC = () => (
  <LegalPage
    title="Privacy Policy"
    intro={
      <p>
        {LEGAL.appName} helps parents and carers keep their child's health records. This policy explains what information the app handles,
        where it is kept and your choices. It is written to meet the Australian Privacy Principles under the Privacy Act 1988 (Cth).
      </p>
    }
    sections={[
      {
        heading: 'What the app stores',
        body: (
          <>
            <p>Only what you enter, for example your child's name, date of birth, growth measurements, vaccines, medicines, appointments, notes and photos you add.</p>
            <p>This is health information, which the law treats as sensitive. Please only enter information about children you care for.</p>
          </>
        ),
      },
      {
        heading: 'Where your information is kept',
        body: (
          <>
            <p>
              Your records are stored <strong>only on this device</strong>: in the browser's storage on the website, or in the app's own storage in the
              iPhone and Android apps. There is no account, and your records are not uploaded to our servers or any cloud service.
            </p>
            <ul>
              <li>The iPhone and Android apps keep your records out of iCloud, computer and Google backups, so they stay on this phone. Use an encrypted backup file to move them.</li>
              <li>If you clear this browser's data, uninstall the app or lose the device, your records are deleted unless you have made a backup.</li>
              <li>Anyone who can use this device may be able to open the app. Turn on the passcode lock to protect your records.</li>
              <li>Vaccine reminders in the apps are optional notifications scheduled on the phone itself. Nothing is sent to us, and they don't include your child's name.</li>
            </ul>
          </>
        ),
      },
      {
        heading: 'Passcode lock and encryption',
        body: (
          <>
            <p>
              With the optional passcode lock, your records are encrypted on the device (AES-256-GCM, with a key made from your passcode using PBKDF2).
              The passcode and key are never stored, so nobody, including us, can recover your records if you forget the passcode.
            </p>
            <p>
              In the iPhone and Android apps, the lock's settings are kept in the phone's secure storage (the iOS Keychain or Android Keystore). If you turn
              on the optional Face ID or fingerprint unlock, the key is also kept there, on this phone only, and released only after your face or fingerprint
              is recognised. Anyone whose face or fingerprint is set up on the phone could then open your records.
            </p>
            <p>
              Limitation: in a web browser the encrypted records sit in ordinary browser storage. The lock protects them from someone reading the
              storage without your passcode, but it can't protect against a device that is already compromised (for example by malware) while the app is unlocked.
            </p>
          </>
        ),
      },
      {
        heading: 'Backups you export',
        body: (
          <p>
            You can export an encrypted backup file and keep it wherever you choose. The file is protected with a password you set. Keep the file
            and password safe: anyone with both can read your child's records.
          </p>
        ),
      },
      {
        heading: 'AI features',
        body: (
          <>
            {!AI_ENABLED && <p>AI features are switched off in this version. Nothing you enter is sent to any AI service.</p>}
            <p>
              {AI_ENABLED ? 'When AI features are used, Paeds Pouch' : 'If AI features are switched on in a later version, Paeds Pouch'} uses two AI providers, through its own server:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Google (Gemini)</strong> for most AI features, such as vaccine information, short parenting tips and calming stories. The information
                needed for that request is sent, for example what you typed or a photo of a letter you chose to upload.
              </li>
              <li>
                <strong>Anthropic (Claude)</strong> for premium features, such as a handover or GP letter summary and in-depth parenting guidance. Only a
                de-identified summary is sent: no name, date of birth, contact details, care-team or family names, photos or letters. Names already in your
                records, email addresses and phone numbers are removed from free text, but please leave other names out of what you type.
              </li>
            </ul>
            <p>
              Nothing is sent unless you choose to use one of these features and agree first, and you can withdraw that permission at any time. Google and
              Anthropic may process the information outside Australia, under their own terms. Paeds Pouch's server does not store what is sent; it keeps a
              count of premium requests per access code for monthly limits, and its logs may record that a request failed.
            </p>
            <p>
              <strong>Overseas disclosure (Australian Privacy Principle 8).</strong> Using an AI feature discloses the information described above to
              Google LLC or Anthropic PBC, which are based in the United States and may process it in the United States and other countries where they
              operate. They are not bound by the Australian Privacy Principles, and Australian law may not give you the same protection or remedies there.
              The app tells you this before anything is sent, and sends it only if you agree. If you don't agree, don't use the AI features: everything
              else works without them.
            </p>
          </>
        ),
      },
      {
        heading: 'Information collected when you visit',
        body: (
          <>
            <p>
              The app is hosted by Vercel. Like any website, the hosting service receives technical information when the app loads, such as your IP address,
              browser type and the pages requested, and may keep it in short-term logs for security and reliability. These logs don't contain your child's records.
            </p>
            <p>The app doesn't use advertising, analytics or tracking cookies, and doesn't load anything from other websites (fonts are part of the app).</p>
          </>
        ),
      },
      {
        heading: 'Links to other websites',
        body: <p>The app links to trusted sources such as the Royal Children's Hospital Melbourne and healthdirect. Their own privacy policies apply when you visit them.</p>,
      },
      {
        heading: 'Your choices',
        body: (
          <ul>
            <li>You can view, change or delete any record in the app at any time.</li>
            <li>You can withdraw permission for AI features in Privacy, Backup &amp; Lock.</li>
            <li>Because we don't hold your records, we can't access, correct or delete them for you.</li>
          </ul>
        ),
      },
      {
        heading: 'Deleting your data',
        body: (
          <ul>
            <li><strong>One child:</strong> in Children, choose the child, then Remove this child.</li>
            <li><strong>Everything on this device:</strong> in Health Overview, choose "Delete Everything on This Device" at the bottom of the page, or "Forgot your passcode?" then "Erase all data" on the lock screen. This deletes all children, records, settings and the passcode lock, including anything kept in the phone's secure storage.</li>
            <li><strong>Removing the app or clearing browser data</strong> also deletes the records on that device.</li>
            <li><strong>Backup files</strong> you exported are yours to delete wherever you saved them.</li>
            <li><strong>AI features:</strong> we don't keep what you send. Google and Anthropic handle it under their own terms; contact them about anything they keep.</li>
          </ul>
        ),
      },
      {
        heading: 'Changes and contact',
        body: (
          <p>
            We'll update this policy if the app's handling of information changes, and show the date at the top. For privacy questions or complaints,
            contact {LEGAL.operator} at {LEGAL.contactEmail}. If you're not satisfied with our response, you can contact the Office of the Australian
            Information Commissioner (oaic.gov.au).
          </p>
        ),
      },
    ]}
  />
);
