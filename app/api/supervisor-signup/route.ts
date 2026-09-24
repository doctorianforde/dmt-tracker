import { NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin';
import {
  assertStaffEntryClaimable,
  claimStaffEntry,
  StaffEntryUnavailableError,
} from '@/lib/staff-directory-server';
import type { UserRole } from '@/types';

interface SupervisorSignupBody {
  name?: string;
  email?: string;
  password?: string;
  code?: string;
  // The staff-directory entry they say they are; omitted for "I'm not on
  // this list yet".
  directoryId?: string;
  // The role they chose on the form; must match the invite code's role.
  role?: string;
}

// The submitted invite code determines the role — the client never gets to
// name its own role directly, so there's nothing to spoof by editing the form.
function roleForInviteCode(code: string): UserRole | null {
  const supervisorCode = process.env.SUPERVISOR_INVITE_CODE?.trim();
  const lecturerCode = process.env.LECTURER_INVITE_CODE?.trim();
  if (supervisorCode && code === supervisorCode) return 'supervisor';
  if (lecturerCode && code === lecturerCode) return 'lecturer';
  return null;
}

export async function POST(request: Request) {
  if (!process.env.SUPERVISOR_INVITE_CODE && !process.env.LECTURER_INVITE_CODE) {
    return NextResponse.json(
      { error: 'Invite codes are not configured. Contact the administrator.' },
      { status: 500 }
    );
  }

  const body = (await request.json().catch(() => null)) as SupervisorSignupBody | null;
  const name = body?.name?.trim();
  const email = body?.email?.trim();
  const password = body?.password;
  const submittedCode = body?.code?.trim() ?? '';
  const directoryId = body?.directoryId?.trim() || undefined;

  const role = roleForInviteCode(submittedCode);
  if (!role) {
    return NextResponse.json({ error: 'Incorrect invite code. Please check with your administrator.' }, { status: 403 });
  }
  if (body?.role && body.role !== role) {
    return NextResponse.json(
      { error: `That isn’t the ${body.role} invite code. Check the code, or switch to ${role === 'lecturer' ? 'Lecturer' : 'Supervisor'} above.` },
      { status: 403 }
    );
  }
  if (!name) {
    return NextResponse.json({ error: 'Please enter your full name.' }, { status: 400 });
  }
  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
  }

  let createdUid: string | null = null;
  try {
    const auth = getAdminAuth();
    const db = getAdminDb();
    if (directoryId) await assertStaffEntryClaimable(db, directoryId);

    const userRecord = await auth.createUser({ email, password, displayName: name });
    createdUid = userRecord.uid;

    await db.collection('users').doc(userRecord.uid).set({
      name,
      email,
      role,
      createdAt: FieldValue.serverTimestamp(),
    });

    // Supervisors always get a staff-directory entry (so students can pick
    // them). Lecturers only if they claimed a listed name, i.e. they also
    // supervise students.
    if (directoryId || role === 'supervisor') {
      await claimStaffEntry(db, { directoryId, uid: userRecord.uid, name, role });
    }

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    if (err instanceof StaffEntryUnavailableError) {
      // Lost a race for the same name after the account was created — undo it.
      if (createdUid) await rollbackAccount(createdUid);
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    const errorCode = (err as { code?: string })?.code;
    if (errorCode === 'auth/email-already-exists') {
      return NextResponse.json({ error: 'An account with this email already exists. Try signing in.' }, { status: 409 });
    }
    if (errorCode === 'auth/invalid-password') {
      return NextResponse.json({ error: 'Password must be at least 6 characters.' }, { status: 400 });
    }
    const message = err instanceof Error ? err.message : 'Sign-up failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

async function rollbackAccount(uid: string) {
  try {
    await getAdminDb().collection('users').doc(uid).delete();
    await getAdminAuth().deleteUser(uid);
  } catch (err) {
    console.error('Failed to roll back account', uid, err);
  }
}
