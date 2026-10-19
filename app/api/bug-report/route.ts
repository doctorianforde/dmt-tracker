import { NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin';
import {
  BugReportError,
  DEFAULT_BUG_REPORT_TO,
  confirmationEmail,
  developerEmail,
  gmailSender,
  parseBugReport,
  saveBugReport,
  type BugReport,
  type Reporter,
} from '@/lib/bug-report-server';

export const dynamic = 'force-dynamic';

// Any signed-in user with a confirmed email (the confirmation goes there).
async function requireReporter(request: Request): Promise<Reporter | NextResponse> {
  const token = request.headers.get('authorization')?.match(/^Bearer (.+)$/)?.[1];
  if (!token) return NextResponse.json({ error: 'Not signed in.' }, { status: 401 });

  let uid: string;
  let email: string;
  try {
    const decoded = await getAdminAuth().verifyIdToken(token);
    if (!decoded.email_verified || !decoded.email) {
      return NextResponse.json({ error: 'Please confirm your email address first.' }, { status: 403 });
    }
    uid = decoded.uid;
    email = decoded.email;
  } catch {
    return NextResponse.json({ error: 'Your session has expired. Please sign in again.' }, { status: 401 });
  }

  const profile = (await getAdminDb().collection('users').doc(uid).get()).data();
  return { uid, email, name: String(profile?.name ?? ''), role: String(profile?.role ?? 'unknown') };
}

// { summary, description, steps?, page?, userAgent? } → { issueNumber, confirmationSent }
export async function POST(request: Request) {
  const reporter = await requireReporter(request);
  if (reporter instanceof NextResponse) return reporter;

  const send = gmailSender();
  if (!send) {
    return NextResponse.json({ error: 'Bug reporting isn’t set up yet. Please contact your lecturer.' }, { status: 503 });
  }

  try {
    const input = parseBugReport(await request.json().catch(() => null));
    const db = getAdminDb();
    const issueNumber = await saveBugReport(db, reporter, input);
    const report: BugReport = { ...input, issueNumber, reporter };
    const reportRef = db.collection('bugReports').doc(issueNumber);

    try {
      await send(developerEmail(report, process.env.BUG_REPORT_TO || DEFAULT_BUG_REPORT_TO));
    } catch (err) {
      console.error(`Bug report ${issueNumber}: developer email failed`, err);
      return NextResponse.json(
        { error: `Your report was saved as ${issueNumber}, but it couldn’t be emailed to the developers. Please try again later.` },
        { status: 502 }
      );
    }
    await reportRef.update({ developersEmailed: true });

    // The report has reached the developers; a failed confirmation shouldn't
    // turn that into an error for the user.
    let confirmationSent = false;
    try {
      await send(confirmationEmail(report));
      confirmationSent = true;
      await reportRef.update({ confirmationEmailed: true });
    } catch (err) {
      console.error(`Bug report ${issueNumber}: confirmation email failed`, err);
    }

    return NextResponse.json({ issueNumber, confirmationSent });
  } catch (err: unknown) {
    if (err instanceof BugReportError) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error('Bug report failed', err);
    return NextResponse.json({ error: 'Something went wrong sending your report. Please try again.' }, { status: 500 });
  }
}
