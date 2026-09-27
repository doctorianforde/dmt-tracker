# VIS — Progress

The plan is in [plan.md](plan.md). Update this file whenever a task is finished.

_Last updated: 2026-09-27_

## Current status

- **Unit and component tests:** 80 passing, in 10 files (`npm test`).
- **Firestore rules tests:** 60 passing on the emulator (`npm run test:rules`, needs Java 21).
- **Build and checks:** `tsc`, `eslint` and `next build` are clean.
- **Not yet done:** the changes below are **not committed**, and the rules are **not yet deployed** (`npm run deploy:rules`).

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

- [ ] Commit and push these changes.
- [ ] Deploy the tightened rules: `npm run test:rules && npm run deploy:rules`.
- [ ] Parent-folder leftovers still waiting on you. All are unused by the app:
  - `venv/` (1.2 GB): delete.
  - root `node_modules/`: orphaned, since there's no `package.json` there. Delete.
  - `medical_vault.json`: empty. Delete.
  - `firebase_key.json` and `dmt-tracker-a80f2-firebase-adminsdk-*.json`: two copies of an **old** service-account key. The app uses a different key in `.env.local`. Revoke this key in Google Cloud Console → IAM → Service Accounts → Keys, then delete both files.
- [ ] Rotate the test passwords, or delete the test accounts before delivery.
- [ ] Phase 3: GitHub Actions CI (lint, types, tests, rules tests, build).
- [ ] Phase 5 backlog: see [plan.md](plan.md).
