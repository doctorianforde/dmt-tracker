import { NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin';
import {
  StudentActionError,
  addStudentToSupervisor,
  listUnassignedStudents,
  removeStudentFromSupervisor,
} from '@/lib/supervisor-students-server';

export const dynamic = 'force-dynamic';

// Verifies the caller's Firebase ID token and that they're a supervisor.
async function requireSupervisor(request: Request): Promise<{ uid: string; name: string } | NextResponse> {
  const token = request.headers.get('authorization')?.match(/^Bearer (.+)$/)?.[1];
  if (!token) return NextResponse.json({ error: 'Not signed in.' }, { status: 401 });

  let uid: string;
  try {
    const decoded = await getAdminAuth().verifyIdToken(token);
    if (!decoded.email_verified) {
      return NextResponse.json({ error: 'Please confirm your email address first.' }, { status: 403 });
    }
    uid = decoded.uid;
  } catch {
    return NextResponse.json({ error: 'Your session has expired. Please sign in again.' }, { status: 401 });
  }

  const profile = (await getAdminDb().collection('users').doc(uid).get()).data();
  if (profile?.role !== 'supervisor') {
    return NextResponse.json({ error: 'Only supervisors can do this.' }, { status: 403 });
  }
  return { uid, name: String(profile.name ?? '') };
}

// Students with no supervisor yet, for the "Add students" panel.
export async function GET(request: Request) {
  const supervisor = await requireSupervisor(request);
  if (supervisor instanceof NextResponse) return supervisor;
  try {
    return NextResponse.json({ students: await listUnassignedStudents(getAdminDb()) });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Failed to load students' }, { status: 500 });
  }
}

// { studentUid, action: 'add' | 'remove' }
export async function POST(request: Request) {
  const supervisor = await requireSupervisor(request);
  if (supervisor instanceof NextResponse) return supervisor;

  const body = (await request.json().catch(() => null)) as { studentUid?: string; action?: string } | null;
  const studentUid = body?.studentUid?.trim();
  if (!studentUid || (body?.action !== 'add' && body?.action !== 'remove')) {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  try {
    const db = getAdminDb();
    if (body.action === 'add') await addStudentToSupervisor(db, supervisor, studentUid);
    else await removeStudentFromSupervisor(db, supervisor.uid, studentUid);
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    if (err instanceof StudentActionError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Something went wrong' }, { status: 500 });
  }
}
