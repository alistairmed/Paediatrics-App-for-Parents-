import React from 'react';
import { LEGAL } from '../config/legal';
import { LegalPage } from './LegalPage';

export const TermsOfUse: React.FC = () => (
  <LegalPage
    title="Terms of Use"
    intro={<p>By using {LEGAL.appName}, you agree to these terms. Please read them carefully.</p>}
    sections={[
      {
        heading: 'Not medical advice',
        body: (
          <>
            <p>
              {LEGAL.appName} is a record-keeping and general-information tool. It does not diagnose, assess symptoms, recommend treatment or
              calculate medicine doses, and it doesn't replace advice from a doctor, nurse, pharmacist or other health professional.
            </p>
            <p><strong>In an emergency, call 000.</strong> For health advice any time, call healthdirect on 1800 022 222.</p>
          </>
        ),
      },
      {
        heading: 'Questionnaires',
        body: (
          <p>
            The checks in the app are conversation starters to help you organise what you've noticed. They are not validated screening tests and
            their results are not a diagnosis.
          </p>
        ),
      },
      {
        heading: 'Your records',
        body: (
          <>
            <p>
              You're responsible for the information you enter and for keeping it accurate. Records are stored only on your device; keep regular
              backups, because records can't be recovered if your device or browser data is lost, or if you forget your passcode.
            </p>
            <p>Only enter information about children you care for or have permission to record.</p>
          </>
        ),
      },
      {
        heading: 'Pilot software',
        body: (
          <p>
            {LEGAL.appName} is a pilot. It is provided "as is" and may change, contain errors or stop being available. Its regulatory status has not
            been assessed by the Therapeutic Goods Administration.
          </p>
        ),
      },
      {
        heading: 'Liability',
        body: (
          <p>
            To the extent permitted by law, {LEGAL.operator} is not liable for any loss arising from use of the app or reliance on its content.
            Nothing in these terms excludes rights you have under the Australian Consumer Law that can't be excluded.
          </p>
        ),
      },
      {
        heading: 'Other websites',
        body: <p>Links to other websites are provided for information. We aren't responsible for their content.</p>,
      },
      {
        heading: 'Changes',
        body: <p>We may update these terms. The date at the top shows when they last changed. Continuing to use the app means you accept the updated terms.</p>,
      },
    ]}
  />
);
