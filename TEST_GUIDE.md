# VIS — Test Guide

## Automated tests

```bash
npm test             # unit + component tests (no setup needed)
npm run test:rules   # Firestore security rules, on the local emulator
```

`test:rules` starts the Firestore emulator, runs
[rules-tests/firestore.rules.test.ts](rules-tests/firestore.rules.test.ts)
against [firestore.rules](firestore.rules), then shuts the emulator down. It
uses a throwaway `demo-vis` project and never touches production data. It
needs Java 21 on your `PATH`:

```bash
brew install openjdk@21
export PATH="/opt/homebrew/opt/openjdk@21/bin:$PATH"   # add to ~/.zshrc to keep it
```

Run both suites before any change to the data model or the rules, and before
`npm run deploy:rules`.

## Test accounts

```bash
npm run seed:test
```

This command creates the accounts below with their emails already confirmed.
All of them use the password `Test1234!`. It is safe to re-run, and each run
resets these accounts' profiles and cases.

| Email | Role | Notes |
|---|---|---|
| `supervisor1@test.edu` | Supervisor | Dr. Test Supervisor A: Alice, Bob |
| `supervisor2@test.edu` | Supervisor | Dr. Test Supervisor B: Carol, Dave |
| `lecturer@test.edu` | Lecturer | Dr. Test Lecturer |
| `student1@test.edu` | Student | `TEST-001`, draft (`pending`) |
| `student2@test.edu` | Student | `TEST-002`, waiting on supervisor |
| `student3@test.edu` | Student | `TEST-003`, waiting on lecturer |
| `student4@test.edu` | Student | `TEST-004`, waiting on lecturer |

Keep any local notes of credentials in `TEST_ACCOUNTS.txt`. Git ignores that
file, so it is never committed. **Delete every test account before handing
the app over.**

## Manual walkthrough

### 1. Student: draft and submit (`student1`)
1. Sign in on `/`. You land on `/student`.
2. Under **Case sections**, tick a section and save.
3. Try to edit the case number. It should be locked ("Locked after first save").
4. Change your supervisor to Dr. Test Supervisor B, then back to A. This works while the case is a draft.
5. Click **Submit for review**. The pipeline moves to *Supervisor*, and the supervisor picker locks.

### 2. Supervisor: review (`supervisor1`)
1. Sign in. You land on `/supervisor`, where **Case reviews** shows only Alice and Bob.
2. **Reject** Bob's case with a reason. The case stays at *Supervisor* and shows the reason.
3. Click **Approve & Send to Lecturer** on Alice's case. It moves to *Lecturer*.
4. Under **Your students**, set a deadline for one student. It appears on the **Deadline calendar** and on the student's dashboard.
5. Sign in as `supervisor2`: Alice and Bob should not be visible.

### 3. Student: resubmit (`student2`)
1. You should see the rejection reason. Tick another section, save, then click **Mark as ready for re-review**.
2. As `supervisor1`, Bob's case is flagged as resubmitted. Approve it.

### 4. Lecturer: final approval (`lecturer`)
1. **Case reviews** lists every case. Click **Grant Final Approval** on Carol's case: the case shows *Approved* and the green light.
2. Revoke the approval. The case returns to *Lecturer*.
3. Under **Students & supervisors**, move Dave to Dr. Test Supervisor A. `supervisor1` should now see Dave's case.
4. **Access log** shows the sign-ins, approvals, rejections and assignments from the steps above.

### 5. Staff sign-up (`/supervisor-signup`)
1. Choose Supervisor, pick a name from the directory, and enter the supervisor invite code. The account is created, and the name disappears from the list for later sign-ups.
2. Choose Lecturer but enter the supervisor code. You should see an error explaining that it's the wrong code.
3. Enter a wrong code. You should see "Incorrect invite code".

### 6. Accounts
- **Sign-up:** a new student sign-up shows the verify-email screen until the link is clicked.
- **Forgot password:** the "Forgot password?" link on `/` sends a reset email.
- **Change password:** works from the dashboard.
- **Themes:** switching theme persists after a reload.
