import { describe, it, expect, vi, beforeEach } from 'vitest';

const verifyIdToken = vi.fn();
const profileGet = vi.fn();
const listUnassignedStudents = vi.fn();
const addStudentToSupervisor = vi.fn();
const removeStudentFromSupervisor = vi.fn();

vi.mock('@/lib/firebase-admin', () => ({
  getAdminAuth: () => ({ verifyIdToken }),
  getAdminDb: () => ({
    collection: () => ({ doc: () => ({ get: profileGet }) }),
  }),
}));

vi.mock('@/lib/supervisor-students-server', () => {
  class StudentActionError extends Error {
    constructor(message: string, public status = 409) {
      super(message);
    }
  }
  return {
    StudentActionError,
    listUnassignedStudents: (...a: unknown[]) => listUnassignedStudents(...a),
    addStudentToSupervisor: (...a: unknown[]) => addStudentToSupervisor(...a),
    removeStudentFromSupervisor: (...a: unknown[]) => removeStudentFromSupervisor(...a),
  };
});

import { GET, POST } from '@/app/api/supervisor/students/route';
import { StudentActionError } from '@/lib/supervisor-students-server';

function req(method: 'GET' | 'POST', body?: unknown, token: string | null = 'good-token') {
  return new Request('http://localhost/api/supervisor/students', {
    method,
    headers: token ? { authorization: `Bearer ${token}` } : {},
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
}

function signedInAs(role: string, name = 'Dr. Mapp') {
  verifyIdToken.mockResolvedValue({ uid: 'sup-1' });
  profileGet.mockResolvedValue({ data: () => ({ role, name }) });
}

describe('/api/supervisor/students', () => {
  beforeEach(() => vi.clearAllMocks());

  it('rejects requests without a token', async () => {
    const res = await GET(req('GET', undefined, null));
    expect(res.status).toBe(401);
    expect(listUnassignedStudents).not.toHaveBeenCalled();
  });

  it('rejects an invalid token', async () => {
    verifyIdToken.mockRejectedValueOnce(new Error('bad'));
    const res = await GET(req('GET'));
    expect(res.status).toBe(401);
  });

  it('only lets supervisors in', async () => {
    signedInAs('student');
    const res = await POST(req('POST', { studentUid: 'stu-1', action: 'add' }));
    expect(res.status).toBe(403);
    expect(addStudentToSupervisor).not.toHaveBeenCalled();
  });

  it('lists unassigned students for a supervisor', async () => {
    signedInAs('supervisor');
    listUnassignedStudents.mockResolvedValue([{ uid: 'stu-1', name: 'Jane' }]);
    const res = await GET(req('GET'));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ students: [{ uid: 'stu-1', name: 'Jane' }] });
  });

  it('adds a student to the calling supervisor', async () => {
    signedInAs('supervisor');
    const res = await POST(req('POST', { studentUid: 'stu-1', action: 'add' }));
    expect(res.status).toBe(200);
    expect(addStudentToSupervisor).toHaveBeenCalledWith(expect.anything(), { uid: 'sup-1', name: 'Dr. Mapp' }, 'stu-1');
  });

  it('removes a student from the calling supervisor', async () => {
    signedInAs('supervisor');
    const res = await POST(req('POST', { studentUid: 'stu-1', action: 'remove' }));
    expect(res.status).toBe(200);
    expect(removeStudentFromSupervisor).toHaveBeenCalledWith(expect.anything(), 'sup-1', 'stu-1');
  });

  it('passes through a refusal such as an already-assigned student', async () => {
    signedInAs('supervisor');
    addStudentToSupervisor.mockRejectedValueOnce(new StudentActionError('That student already has a supervisor.'));
    const res = await POST(req('POST', { studentUid: 'stu-1', action: 'add' }));
    expect(res.status).toBe(409);
    expect((await res.json()).error).toMatch(/already has a supervisor/);
  });

  it('rejects a malformed request', async () => {
    signedInAs('supervisor');
    const res = await POST(req('POST', { studentUid: 'stu-1', action: 'steal' }));
    expect(res.status).toBe(400);
  });
});
