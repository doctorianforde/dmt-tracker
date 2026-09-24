import type { Metadata } from 'next';
import Link from 'next/link';
import LegalPage, { LEGAL_CONTACT_EMAIL } from '@/components/LegalPage';

export const metadata: Metadata = {
  title: 'Privacy Policy — VIS',
  description: 'How VIS collects, uses and protects your personal information.',
};

export default function PrivacyPage() {
  const mail = <a href={`mailto:${LEGAL_CONTACT_EMAIL}`}>{LEGAL_CONTACT_EMAIL}</a>;

  return (
    <LegalPage eyebrow="Legal" title="Privacy Policy">
      <p>
        VIS (the “VIS EM DM Case Manager”) is run by the VIS Team (“we”, “us”). It helps students, supervisors and
        lecturers in the DM Emergency Medicine programme track the progress and approval of case reports. This policy
        explains what personal information we collect, why, and the choices you have. We handle personal information in
        line with the General Privacy Principles of the Data Protection Act, 2011 (Chap. 22:04) of the Republic of
        Trinidad and Tobago.
      </p>

      <h2>1. Information we collect</h2>
      <ul>
        <li><strong>Account details:</strong> your name, email address, role (student, supervisor or lecturer) and password. Passwords are handled by Firebase Authentication and are never visible to us.</li>
        <li><strong>Programme details:</strong> for students, your case number, start year, class year, assigned supervisor and submission deadline.</li>
        <li><strong>Progress and review records:</strong> which case report sections are marked complete, approval status, approval and rejection dates, reviewer notes, rejection reasons and deadline extension reasons.</li>
        <li><strong>Profile photo:</strong> only if you choose to upload one.</li>
        <li><strong>Preferences:</strong> your chosen display theme.</li>
        <li><strong>Activity log:</strong> a record of certain actions (such as signing in, viewing cases, approving, rejecting, assigning supervisors and setting deadlines), with the name and role of the person who took them and the time.</li>
        <li><strong>Technical data:</strong> our hosting and authentication providers automatically process data such as IP address, browser type and request times to deliver and secure the service.</li>
      </ul>

      <h2>2. No patient information</h2>
      <p>
        VIS tracks the <em>progress</em> of case reports. It does not store case report content, and it is not designed
        to hold patient information. You must not enter any information that could identify a patient (such as names,
        hospital or record numbers, dates of birth or addresses) anywhere in VIS, including notes, rejection reasons or
        extension reasons. Health information is “sensitive personal information” under the Data Protection Act, and
        patient confidentiality remains your professional responsibility.
      </p>

      <h2>3. How we use your information</h2>
      <ul>
        <li>To create and secure your account, confirm your email address and let you reset your password.</li>
        <li>To show students, their assigned supervisor and the lecturer the progress, deadlines and approval status of case reports.</li>
        <li>To support supervision and assessment within the DM Emergency Medicine programme.</li>
        <li>To keep an activity log for accountability and to detect and investigate misuse.</li>
        <li>To maintain, fix and improve VIS.</li>
      </ul>
      <p>
        We use your information only for these purposes. We do not sell it, rent it or use it for advertising, and we
        do not use tracking or advertising cookies.
      </p>

      <h2>4. Who can see your information</h2>
      <ul>
        <li><strong>Students</strong> see their own records.</li>
        <li><strong>Supervisors</strong> see the records of the students assigned to them.</li>
        <li><strong>The lecturer</strong> sees all student records and the activity log for programme administration.</li>
        <li><strong>The VIS Team</strong> can access data where needed to run, support and secure the service.</li>
      </ul>
      <p>
        We do not share your information with anyone else unless you ask us to, or where the law requires it (for
        example, a court order).
      </p>

      <h2>5. Service providers and transfers outside Trinidad and Tobago</h2>
      <p>We use these providers to run VIS:</p>
      <ul>
        <li><strong>Google Firebase</strong> (Google LLC): user accounts, sign-in, account emails and the database.</li>
        <li><strong>Vercel Inc.</strong>: website hosting.</li>
      </ul>
      <p>
        These providers may store and process data on servers outside Trinidad and Tobago, including in the United
        States. They process data only on our behalf, under contractual security and data protection commitments that we
        rely on to keep your information protected to a standard comparable to Trinidad and Tobago law.
      </p>

      <h2>6. How long we keep information</h2>
      <p>
        We keep your account and records while you are part of the programme and for up to 12 months after you
        complete or leave it, so that programme records can be verified. After that, or sooner if you ask and we have no
        overriding reason to keep it, we delete or anonymise your information. Activity log entries are kept for the
        same period.
      </p>

      <h2>7. Security</h2>
      <p>
        Data is encrypted in transit (HTTPS) and at rest by our providers. Access is limited by role through database
        security rules, and passwords are managed by Firebase Authentication. No online service is completely secure,
        so please use a strong, unique password and tell us straight away if you think your account has been accessed
        without your permission.
      </p>

      <h2>8. Browser storage</h2>
      <p>
        VIS stores a small amount of data in your browser: Firebase keeps you signed in, and your theme choice is
        remembered so the page loads in your theme. These are essential to how VIS works and are not used for tracking.
      </p>

      <h2>9. Your rights</h2>
      <p>Under the Data Protection Act you may ask us to:</p>
      <ul>
        <li>tell you what personal information we hold about you and give you a copy;</li>
        <li>correct information that is inaccurate or incomplete;</li>
        <li>delete your account and information, subject to any programme record-keeping needs described above; and</li>
        <li>explain how your information has been used or shared.</li>
      </ul>
      <p>
        Email {mail} to make a request. We will respond within 30 days. If you are not satisfied with our response, you
        may raise a complaint with the Office of the Information Commissioner of Trinidad and Tobago once that office is
        in operation.
      </p>

      <h2>10. Who can use VIS</h2>
      <p>VIS is for doctors and academic staff of the DM Emergency Medicine programme. It is not intended for anyone under 18.</p>

      <h2>11. Changes to this policy</h2>
      <p>
        We may update this policy. We will change the date at the top, and tell you about significant changes by email or
        in the app before they take effect.
      </p>

      <h2>12. Contact</h2>
      <p>
        Questions about this policy or your information: {mail}. See also our{' '}
        <Link href="/tos">Terms of Service</Link>.
      </p>
    </LegalPage>
  );
}
