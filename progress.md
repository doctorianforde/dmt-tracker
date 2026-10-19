# VIS — Progress

The plan is in [plan.md](plan.md). Update this file whenever a task is finished.

_Last updated: 2026-10-19_

## Pick up here (next session)

1. **Fix Vercel auto-deploy.** Pushes to `main` on 2026-10-19 (`c8b1353`, `4775dc6`) did **not** trigger a Vercel deploy; production was deployed by hand. Check Vercel → Project → Settings → Git: the repo `doctorianforde/dmt-tracker` should be connected and `main` should be the production branch. Reconnect GitHub if needed. Until then, check each push actually deployed (Vercel → Deployments, the commit SHA must match).
2. **Watch out:** "Redeploy" in Vercel rebuilds the *same* commit as the deployment you click on, not the latest one.
3. Then the open items under **To do** at the bottom.

## Current status

- **Live:** https://vis-tracker.vercel.app, deploying commit `4775dc6` (2026-10-19).
- **Unit and component tests:** 102 passing, in 12 files (`npm test`).
- **Firestore rules tests:** 66 passing on the emulator (`npm run test:rules`, needs Java 21: `PATH=/opt/homebrew/opt/openjdk@21/bin:$PATH npm run test:rules`; the default `java` on this Mac is 17).
- **Build and checks:** `tsc`, `eslint` and `next build` are clean.
- **Rules:** published to production on 2026-10-19 (`npm run deploy:rules`).
- **Git:** `main` is clean and pushed.

### Live data, as of 2026-10-19
- **Staff:** two accounts, both **Lecturers**: Dr. Varachhia and "Test Supervisor" (a test account). There are no Supervisor accounts yet.
- **Cases:** 7. Darrin Clement's (case `3`) is submitted, at the supervisor stage, with Dr. Varachhia as supervisor. The other six are drafts (`pending`) that the students haven't submitted.

## Bug reports (2026-10-19, deployed)
- [x] **Report a bug** button (🐞) in the top bar for every signed-in user, also in the profile menu (`components/BugReportForm.tsx`, `components/Navbar.tsx`).
- [x] `POST /api/bug-report` (`app/api/bug-report/route.ts`, `lib/bug-report-server.ts`):
  - requires a signed-in user with a confirmed email
  - gives each report the next issue number, `VIS-0001`, `VIS-0002`, … (counter in `counters/bugReports`, in a transaction)
  - saves it in `bugReports/{issueNumber}`, with `developersEmailed` and `confirmationEmailed` flags
  - emails it to **vistracker2026@gmail.com** (Reply-To the reporter) and sends the reporter a confirmation with the issue number
  - at most 5 reports per user per hour (`bugReportLimits/{uid}`)
- [x] Email is sent via Gmail (nodemailer) from **vistracker2026@gmail.com** with an app password. Env vars `GMAIL_USER` and `GMAIL_APP_PASSWORD` are set in `.env.local` and in Vercel. Optional `BUG_REPORT_TO` overrides the recipient. Gmail login verified locally.
- [x] Rules: clients can't read or write `bugReports`, `counters` or `bugReportLimits`; only the server (Admin SDK) does.
- [x] Privacy Policy and Terms pages now list **vistracker2026@gmail.com** as the contact (was VISTrackerTT@proton.me). That's now the one VIS email.
- [x] Setup steps in [SETUP.md](SETUP.md) → **Bug reports**.
- [x] **Tested live on 2026-10-19:** the report reached vistracker2026@gmail.com and the confirmation reached the reporter. The test used issue number `VIS-0001`, so real reports start at `VIS-0002`.

## Lecturer approval fix (2026-10-19, deployed)
- [x] **Problem:** the Lecturer reported no way to approve cases. Final approval needed a Supervisor's approval first, and there are no Supervisor accounts.
- [x] **Fix:** the Lecturer gets **Grant Final Approval** on any submitted case, at the supervisor or lecturer stage. Approving from the supervisor stage also records the supervisor approval. Supervisors still approve on to the Lecturer as before.
- [x] Draft rows now say "Draft — not submitted yet" instead of a blank action column.
- [x] No rules change was needed; a rules test covers the new write.

## Several cases per student and sections key (2026-09-27, deployed)
- [x] **Next case:** students start their next case once the current one is approved. Earlier cases are shown under **Your cases**.
- [x] **Approved-case counts:** shown to the student on their status card, and to staff in the roster and on each case row.
- [x] **Supervisor access:** supervisors can read every case of their assigned students, so their counts are complete.
- [x] **Sections key:** added under **Case reviews**: 1 Introduction, 2 Case report, 3 Discussion, 4 Conclusion, 5 References, plus what "n/5" means.
- [x] **Rules and tests:** 64 rules tests and 87 unit/component tests.
- [x] Rules deployed and code pushed together.

## Done: 2026-09-27

### Phase 1: Security and hygiene
- [x] `TEST_ACCOUNTS.txt` removed from git and added to `.gitignore`. All test accounts will be removed before delivery.
- [x] `.DS_Store` added to `.gitignore`. The `next-env.d.ts` diff turned out to be auto-generated noise, so it was restored.
- [x] `.env.local` checked: no invite codes are exposed as `NEXT_PUBLIC_*`.

### Phase 2: Documentation
- [x] New `README.md`: roles, pipeline, scripts, layout.
- [x] `SETUP.md` updated: VIS name, staff directory, rules deploy, all scripts.
- [x] `TEST_GUIDE.md` rewritten: automated tests, seeded test accounts, a manual walkthrough of each role.
- [x] `CHANGES_SUMMARY.md` rewritten as a changelog of how the system evolved.
- [x] `SUPERVISOR_TESTING.md` and `UPDATED_SUPERVISOR_SYSTEM.md` removed. They described the old drpaul/supervisor1/supervisor2 model, and their content now lives in the README and the test guide.

### Security rules
- [x] Rules test suite added (`rules-tests/`, run on the emulator via `npm run test:rules`).
- [x] Closed 10 gaps, each confirmed by a test that fails against the old rules:
  - **Supervisors:**
    - could jump a case straight to `approved`, skipping the Lecturer
    - could act on draft cases or on cases past their stage
    - could pass a case on without approving it
  - **Lecturer:** could set the green light without the `approved` stage.
  - **Students:**
    - could create a case that was already approved or reviewed, or under a mismatched id
    - could change `studentUid` or `caseNumber` on their case
    - could clear their case number to reopen the supervisor pick after submitting
  - **Access log:** entries could claim a false role or be backdated.

### Bugs fixed
- [x] **Revoked approvals left the case stuck.** The case went back to the Lecturer's stage still marked as approved, so it had no Approve or Reject button. `revokeApproval` now clears `lecturerApproval`.
- [x] **`scripts/create-test-data.js` was broken:**
  - accounts were unverified, so they were stuck on the confirm-email screen
  - cases were linked to a fake `studentUid`
  - `undefined` fields crashed the Admin SDK
  - it used no staff-directory entries, and one test name clashed with a real staff name

  It has been rewritten, is safe to re-run, and runs with `npm run seed:test`.
- [x] `scripts/create-supervisor.mjs` now creates verified accounts and adds supervisors to the staff directory.

### Phase 3: Refactor and tests
- [x] Pure state and derivation logic moved to `lib/case-state.ts`, with 16 unit tests.
- [x] `SupervisorDashboard.tsx` went from 812 to 384 lines. The roster, deadline editor, add-students panel and access log moved to `components/supervisor/`.
- [x] `StudentDashboard.tsx` went from 612 to 380 lines. The profile section, review feedback, accountability card and pipeline moved to `components/student/`.
- [x] Component tests added for both dashboards (16 tests): save, submit, resubmit, supervisor pick, approve, reject, revoke, reassign, error banner and access log.
- [x] `drpaul` test fixture renamed.

### Cleanup
- [x] Removed the unused `@fontsource/roboto` dependency and a dead re-export.
- [x] Moved `dmt_app.py`, `librarian.py` and `repomix-output.xml` to `DMT_Medical/_archive/`.

## To do

- [ ] **Fix Vercel auto-deploy from GitHub** (see **Pick up here**).
- [ ] Revoke the old service-account key in Google Cloud Console (IAM → Service Accounts → Keys). The local copies are deleted, but the key is still valid until it's revoked.
- [ ] Rotate the test passwords, or delete the test accounts before delivery. This includes the "Test Supervisor" Lecturer account on production.
- [ ] Optional: let the Lecturer approve drafts too (currently only submitted cases can be approved).
- [ ] Optional: a Lecturer view of bug reports (they're only in Firestore and the Gmail inbox for now).
- [ ] Phase 3: GitHub Actions CI (lint, types, tests, rules tests, build).
- [ ] Phase 5 backlog: see [plan.md](plan.md).
- [x] Committed and pushed (`f9d83e6`); rules deployed.
- [x] Parent-folder leftovers deleted: `venv/`, root `node_modules/`, `medical_vault.json`, old key files.
