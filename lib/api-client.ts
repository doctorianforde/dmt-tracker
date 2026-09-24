import { getSafeAuth } from './firebase';
import type { UnassignedStudent } from './supervisor-students-server';

// Calls one of our API routes as the signed-in user (Firebase ID token in the
// Authorization header). Throws with the route's error message on failure.
async function authedFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const user = getSafeAuth().currentUser;
  if (!user) throw new Error('Not signed in.');
  const res = await fetch(path, {
    ...init,
    headers: {
      ...init.headers,
      Authorization: `Bearer ${await user.getIdToken()}`,
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
    },
  });
  const data = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) throw new Error(data.error ?? `Request failed (${res.status})`);
  return data;
}

export type { UnassignedStudent };

export async function getUnassignedStudents(): Promise<UnassignedStudent[]> {
  return (await authedFetch<{ students: UnassignedStudent[] }>('/api/supervisor/students')).students;
}

export async function updateMyStudents(studentUid: string, action: 'add' | 'remove'): Promise<void> {
  await authedFetch('/api/supervisor/students', {
    method: 'POST',
    body: JSON.stringify({ studentUid, action }),
  });
}
