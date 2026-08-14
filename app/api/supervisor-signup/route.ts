import { NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin';
import type { UserRole } from '@/types';

interface SupervisorSignupBody {
  name?: string;
  email?: string;
  password?: string;
  code?: string;
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

  const role = roleForInviteCode(submittedCode);
  if (!role) {
    return NextResponse.json({ error: 'Incorrect invite code. Please check with your administrator.' }, { status: 403 });
  }
  if (!name) {
    return NextResponse.json({ error: 'Please enter your full name.' }, { status: 400 });
  }
  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
  }

  try {
    const auth = getAdminAuth();
    const userRecord = await auth.createUser({ email, password, displayName: name });

    await getAdminDb().collection('users').doc(userRecord.uid).set({
      name,
      email,
      role,
      createdAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
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
