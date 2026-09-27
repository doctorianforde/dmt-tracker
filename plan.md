# VIS — Project Plan

VIS is a case-report tracker for DM Emergency Medicine students. It runs on
Next.js 16 and Firebase (Auth + Firestore), is deployed on Vercel, and the
repo is `doctorianforde/dmt-tracker`.

Track status in [progress.md](progress.md).

## What the app does today

- **Roles:** student / supervisor / lecturer.
  - Students sign up themselves.
  - Staff sign up at `/supervisor-signup` with a server-checked invite code.
- **Staff directory:** stored in the `staff` collection.
  - A student picks their supervisor from it. The pick locks once the case is submitted.
  - Staff claim their listed name when they sign up.
- **Approval pipeline:** `pending → supervisor → lecturer → approved`.
  - Only the lecturer sets `greenLight`.
  - A rejection keeps the case at its current stage and records `rejectionReason`.
- **Case sections:** intro, caseReport, discussion, conclusion, references.
- **Deadlines:** set by staff on the student's profile, with a countdown and a calendar.
- **Access log:** only the lecturer can read it, and it is append-only (`accessLogs`).
- **Other features:**
  - 6 themes
  - Profile photos (stored as data URLs)
  - Email verification
  - Forgot and change password
  - Privacy Policy and Terms of Service pages
- **Security model:** lives in `firestore.rules` and is deployed with `npm run deploy:rules`.

## Status (2026-09-27)

Phases 1–4 are largely done. See [progress.md](progress.md) for what changed.
Still open:

- **CI.** Add a GitHub Actions workflow that runs `npm ci`, `lint`, `tsc --noEmit`, `test`, `test:rules` (with Java 21) and `build` on every push and PR.
- **Old key.** Revoke the old service-account key in Google Cloud Console. Its local files are already deleted.
- **Test accounts.** Delete all of them before delivery.

## Phase 5 — Feature backlog (to prioritise with users)

- **Email notifications:**
  - to the supervisor or lecturer when a case reaches their stage
  - to the student on approval or rejection
  - approaching-deadline reminders
- **Case content:** decide whether students should upload drafts again (upload was removed in `531a7b1`) or link out, for example to Google Docs.
- **Server-side access log:** write log entries through an API route so a client can't skip logging. This is the gap noted in `lib/firestore.ts`.
- **Deadline extensions:** a request-and-approve workflow for `extensionReason`, in place of free text.
- **Lecturer exports:** CSV or PDF of cohort progress.
- **Legacy data migration:** a script that moves any `customDeadline` still on cases onto profiles, then drops the fallback.
