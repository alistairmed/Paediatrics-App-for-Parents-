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
              Your records are stored <strong>only on this device</strong>, in this browser's storage. There is no account, and your records are not
              uploaded to our servers or any cloud service.
            </p>
            <ul>
              <li>If you clear this browser's data, uninstall the app or lose the device, your records are deleted unless you have made a backup.</li>
              <li>Anyone who can use this device and browser may be able to open the app. Turn on the passcode lock to protect your records.</li>
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
        body: AI_ENABLED ? (
          <p>
            Features marked ✨ send the information needed for that request (for example a description or photo) to Google's Gemini service to produce
            a response. Nothing is sent unless you choose to use one of these features and agree to it first. Google's handling of that data is covered by its own terms.
          </p>
        ) : (
          <p>AI features are switched off in this version. Nothing you enter is sent to any AI service.</p>
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
            <p>The app doesn't use advertising, analytics or tracking cookies.</p>
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
            <li>You can erase everything from the device using the reset option in the Medical Record section.</li>
            <li>Because we don't hold your records, we can't access, correct or delete them for you.</li>
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
