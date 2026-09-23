import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const createUser = vi.fn();
const deleteUser = vi.fn();
const docSet = vi.fn();
const docDelete = vi.fn();
const assertStaffEntryClaimable = vi.fn();
const claimStaffEntry = vi.fn();

vi.mock('@/lib/firebase-admin', () => ({
  getAdminAuth: () => ({ createUser, deleteUser }),
  getAdminDb: () => ({
    collection: () => ({
      doc: () => ({ set: docSet, delete: docDelete }),
    }),
  }),
}));

vi.mock('@/lib/staff-directory-server', () => {
  class StaffEntryUnavailableError extends Error {}
  return {
    StaffEntryUnavailableError,
    assertStaffEntryClaimable: (...args: unknown[]) => assertStaffEntryClaimable(...args),
    claimStaffEntry: (...args: unknown[]) => claimStaffEntry(...args),
  };
});

vi.mock('firebase-admin/firestore', () => ({
  FieldValue: { serverTimestamp: () => 'MOCK_TIMESTAMP' },
}));

import { POST } from '@/app/api/supervisor-signup/route';
import { StaffEntryUnavailableError } from '@/lib/staff-directory-server';

function makeRequest(body: unknown) {
  return new Request('http://localhost/api/supervisor-signup', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

describe('POST /api/supervisor-signup', () => {
  const ORIGINAL_SUPERVISOR_CODE = process.env.SUPERVISOR_INVITE_CODE;
  const ORIGINAL_LECTURER_CODE = process.env.LECTURER_INVITE_CODE;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.SUPERVISOR_INVITE_CODE = 'correct-code';
    process.env.LECTURER_INVITE_CODE = 'lecturer-code';
  });

  afterEach(() => {
    process.env.SUPERVISOR_INVITE_CODE = ORIGINAL_SUPERVISOR_CODE;
    process.env.LECTURER_INVITE_CODE = ORIGINAL_LECTURER_CODE;
  });

  it('rejects an incorrect invite code without creating an account', async () => {
    const res = await POST(makeRequest({ name: 'Dr. Jane', email: 'jane@test.edu', password: 'secret1', code: 'wrong' }));
    expect(res.status).toBe(403);
    expect(createUser).not.toHaveBeenCalled();
    expect(docSet).not.toHaveBeenCalled();
  });

  it('rejects a missing name', async () => {
    const res = await POST(makeRequest({ name: '', email: 'jane@test.edu', password: 'secret1', code: 'correct-code' }));
    expect(res.status).toBe(400);
    expect(createUser).not.toHaveBeenCalled();
  });

  it('rejects a missing email or password', async () => {
    const res = await POST(makeRequest({ name: 'Dr. Jane', email: '', password: '', code: 'correct-code' }));
    expect(res.status).toBe(400);
    expect(createUser).not.toHaveBeenCalled();
  });

  it('creates a supervisor account with the correct code', async () => {
    createUser.mockResolvedValue({ uid: 'uid-123' });
    docSet.mockResolvedValue(undefined);

    const res = await POST(makeRequest({ name: 'Dr. Jane', email: 'jane@test.edu', password: 'secret1', code: 'correct-code' }));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data).toEqual({ ok: true });
    expect(createUser).toHaveBeenCalledWith({ email: 'jane@test.edu', password: 'secret1', displayName: 'Dr. Jane' });
    expect(docSet).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Dr. Jane', email: 'jane@test.edu', role: 'supervisor' })
    );
  });

  it('creates a lecturer account when the lecturer code is submitted', async () => {
    createUser.mockResolvedValue({ uid: 'uid-456' });
    docSet.mockResolvedValue(undefined);

    const res = await POST(makeRequest({ name: 'Dr. Paul', email: 'paul@test.edu', password: 'secret1', code: 'lecturer-code' }));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data).toEqual({ ok: true });
    expect(docSet).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Dr. Paul', email: 'paul@test.edu', role: 'lecturer' })
    );
  });

  it('maps an existing-email error to a friendly 409', async () => {
    createUser.mockRejectedValue({ code: 'auth/email-already-exists' });

    const res = await POST(makeRequest({ name: 'Dr. Jane', email: 'jane@test.edu', password: 'secret1', code: 'correct-code' }));
    const data = await res.json();

    expect(res.status).toBe(409);
    expect(data.error).toMatch(/already exists/i);
    expect(docSet).not.toHaveBeenCalled();
  });

  it('returns 500 when no invite codes are configured', async () => {
    process.env.SUPERVISOR_INVITE_CODE = '';
    process.env.LECTURER_INVITE_CODE = '';
    const res = await POST(makeRequest({ name: 'Dr. Jane', email: 'jane@test.edu', password: 'secret1', code: 'anything' }));
    expect(res.status).toBe(500);
    expect(createUser).not.toHaveBeenCalled();
  });

  it('rejects the supervisor code when only the lecturer code is configured', async () => {
    process.env.SUPERVISOR_INVITE_CODE = '';
    const res = await POST(makeRequest({ name: 'Dr. Jane', email: 'jane@test.edu', password: 'secret1', code: 'correct-code' }));
    expect(res.status).toBe(403);
    expect(createUser).not.toHaveBeenCalled();
  });

  describe('staff directory', () => {
    const body = { name: 'Dr. Aisha Khan', email: 'khan@test.edu', password: 'secret1', code: 'correct-code' };

    it('claims the chosen directory entry, keeping the edited name', async () => {
      createUser.mockResolvedValue({ uid: 'uid-khan' });

      const res = await POST(makeRequest({ ...body, directoryId: 'entry-khan' }));

      expect(res.status).toBe(200);
      expect(assertStaffEntryClaimable).toHaveBeenCalledWith(expect.anything(), 'entry-khan');
      expect(claimStaffEntry).toHaveBeenCalledWith(expect.anything(), {
        directoryId: 'entry-khan',
        uid: 'uid-khan',
        name: 'Dr. Aisha Khan',
        role: 'supervisor',
      });
    });

    it('adds a new directory entry for someone not on the list', async () => {
      createUser.mockResolvedValue({ uid: 'uid-new' });

      const res = await POST(makeRequest(body));

      expect(res.status).toBe(200);
      expect(assertStaffEntryClaimable).not.toHaveBeenCalled();
      expect(claimStaffEntry).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ directoryId: undefined, uid: 'uid-new' }));
    });

    it('refuses an already-claimed name before creating any account', async () => {
      assertStaffEntryClaimable.mockRejectedValueOnce(new StaffEntryUnavailableError('taken'));

      const res = await POST(makeRequest({ ...body, directoryId: 'entry-khan' }));

      expect(res.status).toBe(409);
      expect(createUser).not.toHaveBeenCalled();
    });

    it('rolls back the new account if the name is claimed mid-signup', async () => {
      createUser.mockResolvedValue({ uid: 'uid-late' });
      claimStaffEntry.mockRejectedValueOnce(new StaffEntryUnavailableError('taken'));

      const res = await POST(makeRequest({ ...body, directoryId: 'entry-khan' }));

      expect(res.status).toBe(409);
      expect(docDelete).toHaveBeenCalled();
      expect(deleteUser).toHaveBeenCalledWith('uid-late');
    });
  });
});
