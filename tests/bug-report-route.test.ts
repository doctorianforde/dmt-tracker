import { describe, it, expect, vi, beforeEach } from 'vitest';

const verifyIdToken = vi.fn();
const sendMail = vi.fn();
const reportUpdate = vi.fn();

// A minimal in-memory Firestore: enough for the transaction in saveBugReport.
let store: Record<string, Record<string, unknown>>;

function docRef(collection: string, id: string) {
  const key = `${collection}/${id}`;
  return {
    key,
    get: async () => ({ data: () => store[key] }),
    update: (data: Record<string, unknown>) => {
      reportUpdate(key, data);
      store[key] = { ...store[key], ...data };
      return Promise.resolve();
    },
  };
}

vi.mock('@/lib/firebase-admin', () => ({
  getAdminAuth: () => ({ verifyIdToken }),
  getAdminDb: () => ({
    collection: (c: string) => ({ doc: (id: string) => docRef(c, id) }),
    runTransaction: async (fn: (tx: unknown) => Promise<unknown>) => {
      const writes: [string, Record<string, unknown>][] = [];
      const result = await fn({
        get: (ref: ReturnType<typeof docRef>) => ref.get(),
        set: (ref: ReturnType<typeof docRef>, data: Record<string, unknown>) => writes.push([ref.key, data]),
      });
      for (const [key, data] of writes) store[key] = data;
      return result;
    },
  }),
}));

vi.mock('firebase-admin/firestore', () => ({
  FieldValue: { serverTimestamp: () => 'MOCK_TIMESTAMP' },
}));

vi.mock('nodemailer', () => ({
  default: { createTransport: () => ({ sendMail }) },
}));

import { POST } from '@/app/api/bug-report/route';
import { MAX_REPORTS_PER_HOUR, formatIssueNumber } from '@/lib/bug-report-server';

function makeRequest(body: unknown, token: string | null = 'good-token') {
  return new Request('http://localhost/api/bug-report', {
    method: 'POST',
    headers: token ? { authorization: `Bearer ${token}` } : {},
    body: JSON.stringify(body),
  });
}

const REPORT = { summary: 'Save does nothing', description: 'I click save and nothing happens.', steps: '1. Edit case', page: '/student' };

describe('POST /api/bug-report', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    store = { 'users/u1': { name: 'Jane Student', role: 'student' } };
    process.env.GMAIL_USER = 'vis@gmail.com';
    process.env.GMAIL_APP_PASSWORD = 'abcd efgh ijkl mnop';
    delete process.env.BUG_REPORT_TO;
    verifyIdToken.mockResolvedValue({ uid: 'u1', email: 'jane@test.edu', email_verified: true });
    sendMail.mockResolvedValue({});
  });

  it('numbers the report, emails the developers and confirms to the reporter', async () => {
    const res = await POST(makeRequest(REPORT));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ issueNumber: 'VIS-0001', confirmationSent: true });

    expect(sendMail).toHaveBeenCalledTimes(2);
    const [dev, confirm] = sendMail.mock.calls.map((c) => c[0]);
    expect(dev).toMatchObject({ to: 'vistracker2026@gmail.com', replyTo: 'jane@test.edu', subject: '[VIS-0001] Save does nothing' });
    expect(dev.text).toContain('Jane Student <jane@test.edu> (student');
    expect(confirm).toMatchObject({ to: 'jane@test.edu' });
    expect(confirm.subject).toContain('VIS-0001');
    expect(confirm.text).toContain('has been sent to the developers');

    expect(store['bugReports/VIS-0001']).toMatchObject({
      summary: 'Save does nothing', reporterUid: 'u1', developersEmailed: true, confirmationEmailed: true,
    });
  });

  it('gives each report the next number', async () => {
    await POST(makeRequest(REPORT));
    const res = await POST(makeRequest(REPORT));
    expect((await res.json()).issueNumber).toBe('VIS-0002');
  });

  it('escapes HTML in the developer email', async () => {
    await POST(makeRequest({ ...REPORT, description: '<script>alert(1)</script>' }));
    expect(sendMail.mock.calls[0][0].html).toContain('&lt;script&gt;');
    expect(sendMail.mock.calls[0][0].html).not.toContain('<script>');
  });

  it('requires a signed-in user with a confirmed email', async () => {
    expect((await POST(makeRequest(REPORT, null))).status).toBe(401);
    verifyIdToken.mockResolvedValue({ uid: 'u1', email: 'jane@test.edu', email_verified: false });
    expect((await POST(makeRequest(REPORT))).status).toBe(403);
    expect(sendMail).not.toHaveBeenCalled();
  });

  it('rejects a report without a summary or description', async () => {
    const res = await POST(makeRequest({ ...REPORT, description: '   ' }));
    expect(res.status).toBe(400);
    expect(sendMail).not.toHaveBeenCalled();
  });

  it('rate-limits a user to a few reports an hour', async () => {
    for (let i = 0; i < MAX_REPORTS_PER_HOUR; i++) expect((await POST(makeRequest(REPORT))).status).toBe(200);
    const res = await POST(makeRequest(REPORT));
    expect(res.status).toBe(429);
    expect(store['counters/bugReports']).toEqual({ last: MAX_REPORTS_PER_HOUR });
  });

  it('reports an error, with the saved issue number, when the developer email fails', async () => {
    sendMail.mockRejectedValueOnce(new Error('SMTP down'));
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const res = await POST(makeRequest(REPORT));
    expect(res.status).toBe(502);
    expect((await res.json()).error).toContain('VIS-0001');
    expect(sendMail).toHaveBeenCalledTimes(1);
  });

  it('still succeeds when only the confirmation email fails', async () => {
    sendMail.mockResolvedValueOnce({}).mockRejectedValueOnce(new Error('bad address'));
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const res = await POST(makeRequest(REPORT));
    expect(await res.json()).toEqual({ issueNumber: 'VIS-0001', confirmationSent: false });
  });

  it('says so when email sending is not configured', async () => {
    delete process.env.GMAIL_APP_PASSWORD;
    expect((await POST(makeRequest(REPORT))).status).toBe(503);
  });
});

describe('formatIssueNumber', () => {
  it('pads to four digits', () => {
    expect(formatIssueNumber(7)).toBe('VIS-0007');
    expect(formatIssueNumber(12345)).toBe('VIS-12345');
  });
});
