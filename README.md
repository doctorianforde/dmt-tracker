# VIS

VIS tracks DM Emergency Medicine case reports from first draft to final sign-off.

Students record their case and tick off its sections. Their supervisor reviews
it, and the Lecturer gives final approval. Staff set deadlines, and every
reviewer action is recorded in an audit log that only the Lecturer can read.

**Stack:** Next.js 16 (App Router) · React 18 · Tailwind · Firebase Auth +
Firestore · Firebase Admin SDK in API routes · deployed on Vercel.

## Roles

| Role | How they join | What they can do |
|---|---|---|
| Student | Self-register on `/` | Edit their own profile and case, pick a supervisor from the staff directory (until they submit), submit and resubmit |
| Supervisor | `/supervisor-signup` with the supervisor invite code | Review cases for students assigned to them, set those students' deadlines, add students who have no supervisor |
| Lecturer | `/supervisor-signup` with the lecturer invite code | See all students and cases, assign supervisors, set deadlines, give or revoke final approval, read the access log |

Every account must confirm its email address before it can do anything past
sign-in.

## Approval pipeline

```
pending ──submit──▶ supervisor ──approve──▶ lecturer ──approve──▶ approved (green light)
                        │                       │
                     reject                  reject
                 (stays here, with a reason; the student fixes the case and resubmits)
```

- Only the Lecturer sets `greenLight`, and only together with `approved`.
- A rejection records `rejectionReason` and keeps the case at the same stage.
- Case sections: intro, case report, discussion, conclusion, references.

## Security model

Access is enforced in [firestore.rules](firestore.rules), not just hidden in
the UI. Accounts that need more privilege (staff sign-up, supervisor adding a
student) go through API routes that use the Admin SDK after checking an
invite code or ID token. The rules have their own test suite (see below).
Whenever you change the data model, update the rules and their tests too.

## Getting started

```bash
npm install
cp .env.local.example .env.local   # fill in Firebase + invite codes
npm run dev
```

For the full Firebase and Vercel setup, see [SETUP.md](SETUP.md).

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Development server |
| `npm run build` | Production build (webpack) |
| `npm run lint` | ESLint |
| `npm test` | Unit and component tests (Vitest + jsdom) |
| `npm run test:rules` | Firestore rules tests on the emulator (needs Java 21) |
| `npm run deploy:rules` | Publish `firestore.rules` to Firebase |
| `npm run seed:staff` | Add the real staff names to the directory |
| `npm run seed:test` | Create test accounts and one case at each stage |

## Project layout

```
app/          pages (/, /student, /supervisor, /supervisor-signup, /privacy, /tos) and API routes
components/   dashboards, case table, calendar, theme picker, shared UI
lib/          Firestore client (firestore.ts), auth context, Admin SDK helpers, themes, deadlines
types/        shared TypeScript types
scripts/      admin/seed scripts (Admin SDK)
tests/        unit and component tests
rules-tests/  Firestore security-rules tests
```

## More docs

- [SETUP.md](SETUP.md): Firebase, environment variables and deployment
- [TEST_GUIDE.md](TEST_GUIDE.md): automated tests and a manual walkthrough of each role
- [CHANGES_SUMMARY.md](CHANGES_SUMMARY.md): how the system has evolved
- [plan.md](plan.md) / [progress.md](progress.md): roadmap and status
