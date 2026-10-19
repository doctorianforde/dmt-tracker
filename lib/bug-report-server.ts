import { FieldValue, type Firestore } from 'firebase-admin/firestore';
import nodemailer from 'nodemailer';
import type { UserRole } from '@/types';

// Server-only. Bug reports are numbered and stored in Firestore (`bugReports`,
// which clients can't read or write — see firestore.rules), then emailed to
// the developers, with a confirmation to the reporter.

export const DEFAULT_BUG_REPORT_TO = 'vistracker2026@gmail.com';
export const MAX_REPORTS_PER_HOUR = 5;

export const LIMITS = { summary: 120, description: 5000, steps: 3000, page: 200, userAgent: 400 };

export class BugReportError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

export interface BugReportInput {
  summary: string;
  description: string;
  steps: string;
  page: string;
  userAgent: string;
}

export interface Reporter {
  uid: string;
  name: string;
  email: string;
  role: UserRole | string;
}

export interface BugReport extends BugReportInput {
  issueNumber: string;
  reporter: Reporter;
}

function text(value: unknown, max: number): string {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

export function parseBugReport(body: unknown): BugReportInput {
  const b = (body ?? {}) as Record<string, unknown>;
  const input = {
    summary: text(b.summary, LIMITS.summary),
    description: text(b.description, LIMITS.description),
    steps: text(b.steps, LIMITS.steps),
    page: text(b.page, LIMITS.page),
    userAgent: text(b.userAgent, LIMITS.userAgent),
  };
  if (!input.summary) throw new BugReportError('Please give the bug a short summary.', 400);
  if (!input.description) throw new BugReportError('Please describe what went wrong.', 400);
  return input;
}

export function formatIssueNumber(n: number): string {
  return `VIS-${String(n).padStart(4, '0')}`;
}

// Takes the next issue number and stores the report, in one transaction, so
// two reports can never share a number. Also enforces the per-user rate limit.
export async function saveBugReport(db: Firestore, reporter: Reporter, input: BugReportInput, now = Date.now()): Promise<string> {
  const counterRef = db.collection('counters').doc('bugReports');
  const limitRef = db.collection('bugReportLimits').doc(reporter.uid);

  return db.runTransaction(async (tx) => {
    const [counter, limit] = await Promise.all([tx.get(counterRef), tx.get(limitRef)]);

    const hourAgo = now - 60 * 60 * 1000;
    const recent = ((limit.data()?.sentAt as number[] | undefined) ?? []).filter((t) => t > hourAgo);
    if (recent.length >= MAX_REPORTS_PER_HOUR) {
      throw new BugReportError('You’ve sent several reports in the last hour. Please try again later.', 429);
    }

    const next = ((counter.data()?.last as number | undefined) ?? 0) + 1;
    const issueNumber = formatIssueNumber(next);

    tx.set(counterRef, { last: next });
    tx.set(limitRef, { sentAt: [...recent, now] });
    tx.set(db.collection('bugReports').doc(issueNumber), {
      ...input,
      issueNumber,
      reporterUid: reporter.uid,
      reporterName: reporter.name,
      reporterEmail: reporter.email,
      reporterRole: reporter.role,
      status: 'open',
      developersEmailed: false,
      confirmationEmailed: false,
      createdAt: FieldValue.serverTimestamp(),
    });
    return issueNumber;
  });
}

// ── Emails ──────────────────────────────────────────────────────────────────

export interface Email {
  to: string;
  replyTo?: string;
  subject: string;
  text: string;
  html: string;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}

function htmlBlock(label: string, value: string): string {
  return `<h3 style="margin:16px 0 4px;font-size:14px">${label}</h3><p style="margin:0;white-space:pre-wrap">${escapeHtml(value)}</p>`;
}

export function developerEmail(report: BugReport, to: string): Email {
  const { issueNumber, reporter } = report;
  const fields: [string, string][] = [
    ['Summary', report.summary],
    ['What went wrong', report.description],
    ['Steps to reproduce', report.steps || '—'],
    ['Reported by', `${reporter.name} <${reporter.email}> (${reporter.role}, uid ${reporter.uid})`],
    ['Page', report.page || '—'],
    ['Browser', report.userAgent || '—'],
  ];
  return {
    to,
    replyTo: reporter.email,
    subject: `[${issueNumber}] ${report.summary}`,
    text: `New VIS bug report ${issueNumber}\n\n` + fields.map(([l, v]) => `${l}:\n${v}`).join('\n\n'),
    html: `<h2 style="margin:0 0 8px">VIS bug report ${issueNumber}</h2>` + fields.map(([l, v]) => htmlBlock(l, v)).join(''),
  };
}

export function confirmationEmail(report: BugReport): Email {
  const { issueNumber, reporter } = report;
  const greeting = reporter.name ? `Hi ${reporter.name},` : 'Hi,';
  const body =
    `Thanks for reporting a problem with VIS. Your issue number is ${issueNumber}, ` +
    'and your report has been sent to the developers.\n\n' +
    'Please quote this number if you need to follow up about it.';
  return {
    to: reporter.email,
    subject: `We received your bug report — ${issueNumber}`,
    text: `${greeting}\n\n${body}\n\nYour report:\n${report.summary}\n\n— The VIS team`,
    html:
      `<p>${escapeHtml(greeting)}</p>` +
      `<p>Thanks for reporting a problem with VIS. Your issue number is <strong>${issueNumber}</strong>, and your report has been sent to the developers.</p>` +
      '<p>Please quote this number if you need to follow up about it.</p>' +
      htmlBlock('Your report', report.summary) +
      '<p style="margin-top:16px">— The VIS team</p>',
  };
}

export type SendEmail = (email: Email) => Promise<void>;

// Sends through a Gmail account with an app password (GMAIL_USER,
// GMAIL_APP_PASSWORD). Returns null when those aren't configured.
export function gmailSender(): SendEmail | null {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD?.replace(/\s+/g, '');
  if (!user || !pass) return null;
  const transport = nodemailer.createTransport({ service: 'gmail', auth: { user, pass } });
  return async (email) => {
    await transport.sendMail({ from: `"VIS Tracker" <${user}>`, ...email });
  };
}
