# VIS — Changes Summary

How the system has evolved, newest first. Commit hashes are in brackets.

## Security hardening (2026-09)
- **Firestore rules tightened**, with 60 emulator tests in `rules-tests/`:
  - A supervisor can only move a case from *supervisor* to *lecturer* (by approving it), or keep it at *supervisor* (by rejecting it). Previously they could jump a case straight to *approved*.
  - The green light can only be set together with the *approved* stage.
  - Students can't create a case that is already reviewed or approved, can't create one under a different id, and can't change `studentUid` or `caseNumber`.
  - A student's case number is locked once set. Previously a student could clear it to reopen their supervisor pick after submitting.
  - Access-log entries must carry the writer's real role and a server timestamp.
- **Test data:** `TEST_ACCOUNTS.txt` has been removed from git and is now ignored.
- **Seed scripts fixed:**
  - Test accounts are created with their email already confirmed.
  - Cases are linked to the right student.
  - Supervisors get staff-directory entries.

## Accounts and legal pages (2026-09)
- Email confirmation, forgot password, change password [49ad58b]
- Privacy Policy and Terms pages, the VIS logo, the favicon and footer links [3ab8788, 8446124, 3dc7fae]

## Staff directory (2026-09)
- `staff` collection: students pick their supervisor from it, and staff claim their listed name at sign-up [fea8705]
- Supervisors can add students who have no supervisor yet [7cdda22]
- Staff choose Supervisor or Lecturer at sign-up; the invite code must match the choice [78ecc21]

## Three-role model (2026-09)
- **Roles** are now student / supervisor / lecturer, replacing the earlier `supervisor1 / supervisor2 / drpaul` design [2b8c3e0].
- **Pipeline** is now `pending → supervisor → lecturer → approved`.
- **Access** is based on assignment: a supervisor sees only the cases assigned to them.
- **Access log:** only the Lecturer can read it, and it is append-only.
- **Deadlines:** set by staff on the student's profile, with calendars and profile photos [be4fcee].

## Server-side invite codes
- Staff sign-up goes through `/api/supervisor-signup`. It checks `SUPERVISOR_INVITE_CODE` / `LECTURER_INVITE_CODE` on the server and creates the account with the Admin SDK. The old `NEXT_PUBLIC_CODE_*` variables, which shipped the codes to the browser, are gone [cd23227].

## Deployment fixes
- Build with webpack instead of Turbopack, pin Node 22, and override `jose` to a CommonJS-compatible version [5c153c8, 1a3fb5b, c480cff]

## Earlier
- Renamed from "DMT Case Tracker" to **VIS**; added themes and the accountability box [5b0f857]
- Six themes, including football, Mario and flower, with background photos [eeab162]
- Initial DM Emergency Medicine case tracker [a3842cb]
