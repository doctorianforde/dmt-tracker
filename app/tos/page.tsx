import type { Metadata } from 'next';
import Link from 'next/link';
import LegalPage, { LEGAL_CONTACT_EMAIL } from '@/components/LegalPage';

export const metadata: Metadata = {
  title: 'Terms of Service — VIS',
  description: 'The terms that apply when you use VIS.',
};

export default function TermsPage() {
  const mail = <a href={`mailto:${LEGAL_CONTACT_EMAIL}`}>{LEGAL_CONTACT_EMAIL}</a>;

  return (
    <LegalPage eyebrow="Legal" title="Terms of Service">
      <p>
        These terms apply to your use of VIS (the “VIS EM DM Case Manager”), run by the VIS Team (“we”, “us”). By
        creating an account or using VIS you agree to these terms and to our{' '}
        <Link href="/privacy">Privacy Policy</Link>. If you do not agree, do not use VIS. Under the Electronic
        Transactions Act (Chap. 22:05), accepting these terms electronically has the same effect as signing them.
      </p>

      <h2>1. What VIS is</h2>
      <p>
        VIS is a tool for tracking the progress, deadlines and approval of case reports in the DM Emergency Medicine
        programme. It is an administrative aid. It does not replace the programme’s official regulations, assessment
        decisions or records, and it is not a clinical system.
      </p>

      <h2>2. Who can use VIS</h2>
      <p>
        VIS is for students, supervisors and lecturers of the DM Emergency Medicine programme. You must be 18 or over.
        Staff accounts need a valid invitation code. You must give accurate information when you sign up and keep it up
        to date.
      </p>

      <h2>3. Your account</h2>
      <ul>
        <li>Keep your password private and do not share your account.</li>
        <li>You are responsible for what happens under your account.</li>
        <li>Tell us at {mail} straight away if you think someone else has used your account.</li>
      </ul>

      <h2>4. Acceptable use</h2>
      <p>You agree not to:</p>
      <ul>
        <li>enter any information that could identify a patient, anywhere in VIS;</li>
        <li>access, or try to access, accounts or records you are not authorised to see;</li>
        <li>mark work as complete, or approve or reject work, dishonestly or on someone else’s behalf without authority;</li>
        <li>interfere with, overload, probe or attempt to bypass the security of VIS;</li>
        <li>upload anything unlawful, offensive or that infringes someone else’s rights; or</li>
        <li>use VIS for any purpose other than the programme it supports.</li>
      </ul>
      <p>
        Unauthorised access to or interference with a computer system is an offence under the Computer Misuse Act
        (Chap. 11:17). Misuse may also be reported to the programme and dealt with under its academic and professional
        conduct rules.
      </p>

      <h2>5. Your content</h2>
      <p>
        You keep ownership of anything you add to VIS, such as notes and your profile photo. You allow us to store and
        display it to the people who need to see it, as described in the Privacy Policy, for as long as it is needed to
        run VIS. You are responsible for making sure the content you add is accurate and lawful.
      </p>

      <h2>6. Records and activity log</h2>
      <p>
        Actions such as approvals, rejections, supervisor assignments and deadline changes are recorded with the name of
        the person who took them. The official decision on any case report rests with the programme. If a record in VIS
        is wrong, contact your supervisor, the lecturer or us so it can be corrected.
      </p>

      <h2>7. Availability and changes</h2>
      <p>
        We aim to keep VIS available and accurate but provide it “as is” and “as available”. It may sometimes be
        unavailable for maintenance or reasons outside our control. We may change, add or remove features. Keep your own
        copies of your case reports; VIS does not store them.
      </p>

      <h2>8. Suspension and closing accounts</h2>
      <p>
        We may suspend or close an account that breaks these terms or puts VIS or its users at risk. You can ask us to
        close your account at any time by emailing {mail}. What happens to your information afterwards is set out in the
        Privacy Policy.
      </p>

      <h2>9. Limitation of liability</h2>
      <p>
        VIS is provided free of charge as an administrative aid. To the fullest extent permitted by the law of Trinidad
        and Tobago, we are not liable for any indirect or consequential loss, or for any loss arising from missed
        deadlines, assessment outcomes, lost data or the service being unavailable. Nothing in these terms excludes
        liability that cannot be excluded by law, including liability for fraud or for death or personal injury caused by
        negligence.
      </p>

      <h2>10. Governing law</h2>
      <p>
        These terms are governed by the laws of the Republic of Trinidad and Tobago. Any dispute will be dealt with by
        the courts of Trinidad and Tobago, although we will always try to resolve concerns informally first.
      </p>

      <h2>11. Changes to these terms</h2>
      <p>
        We may update these terms. We will change the date at the top and tell you about significant changes by email or
        in the app before they take effect. If you keep using VIS after that, you accept the updated terms.
      </p>

      <h2>12. Contact</h2>
      <p>Questions about these terms: {mail}.</p>
    </LegalPage>
  );
}
