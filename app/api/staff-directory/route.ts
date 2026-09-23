import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { listUnclaimedStaff } from '@/lib/staff-directory-server';

// Public: the staff sign-up page (not yet signed in) uses this to offer the
// names nobody has claimed. Returns names only.
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    return NextResponse.json({ staff: await listUnclaimedStaff(getAdminDb()) });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to load staff list';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
