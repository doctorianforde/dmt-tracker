# Supervisor Dashboard Testing Guide

## Your Invite Codes (from `.env.local`)

```
SUPERVISOR:   supervisor-secret-code
DR. PAUL:     drpaul-secret-code
```

---

## Step 1: Create Supervisor Accounts

### Create Supervisors

All supervisors use the **same** invite code at signup:

1. Go to `http://localhost:3000/supervisor-signup`
2. Fill in:
   - **Full Name**: `Dr. [Name]`
   - **Email**: `supervisor@test.edu`
   - **Password**: `Test1234!`
   - **Invite Code**: `supervisor-secret-code`
3. Click "Create Supervisor Account"

**Example Supervisors:**
```
Dr. Davin Powdhar (supervisor1@test.edu)
Dr. Windale (supervisor2@test.edu)
Dr. Sally (supervisor3@test.edu)
Dr. Kyle (supervisor4@test.edu)
```

### Create Dr. Paul

Dr. Paul has a separate invite code:

1. Go to `http://localhost:3000/supervisor-signup`
2. Fill in:
   - **Full Name**: `Dr. Paul`
   - **Email**: `drpaul@test.edu`
   - **Password**: `Test1234!`
   - **Invite Code**: `drpaul-secret-code`
3. Click "Create Supervisor Account"

---

## Step 2: Create Student Accounts

### Create Student 1 (Pending Status)

1. Go to `http://localhost:3000/`
2. Sign up with:
   - **Email**: `student1@test.edu`
   - **Password**: `Test1234!`
3. You're redirected to student dashboard
4. Fill in student profile:
   - **Case Number**: `DMT-2024-001`
   - **Start Year**: `2024`
   - **Class Year**: `4`
   - **Primary Supervisor**: `Dr. Davin Powdhar`
5. In "Case Sections": Check only **Intro** and **Report** (2/5)
6. Click "Save Progress"

### Create Student 2 (Supervisor 1 Review)

1. Go to `http://localhost:3000/`
2. Sign up with:
   - **Email**: `student2@test.edu`
   - **Password**: `Test1234!`
3. Fill in student profile:
   - **Case Number**: `DMT-2024-002`
   - **Start Year**: `2024`
   - **Class Year**: `4`
   - **Primary Supervisor**: `Dr. Davin Powdhar`
   - **Secondary Supervisor**: `Dr. Windale`
4. In "Case Sections": Check **ALL** sections (5/5) ✅
5. Click "Save Progress"
6. Click **Submit for Review**

### Create Student 3 (Supervisor 2 Review)

1. Go to `http://localhost:3000/`
2. Sign up with:
   - **Email**: `student3@test.edu`
   - **Password**: `Test1234!`
3. Fill in student profile:
   - **Case Number**: `DMT-2024-003`
   - **Start Year**: `2024`
   - **Class Year**: `3`
   - **Primary Supervisor**: `Dr. Davin Powdhar`
   - **Secondary Supervisor**: `Dr. Windale`
4. In "Case Sections": Check **ALL** sections (5/5) ✅
5. Click "Save Progress"
6. Click **Submit for Review**
7. Sign in as **Dr. Davin Powdhar** and approve the case

### Create Student 4 (Dr. Paul Review)

1. Go to `http://localhost:3000/`
2. Sign up with:
   - **Email**: `student4@test.edu`
   - **Password**: `Test1234!`
3. Fill in student profile:
   - **Case Number**: `DMT-2024-004`
   - **Start Year**: `2024`
   - **Class Year**: `3`
   - **Primary Supervisor**: `Dr. Davin Powdhar`
   - **Secondary Supervisor**: `Dr. Windale`
4. In "Case Sections": Check **ALL** sections (5/5) ✅
5. Click "Save Progress"
6. Click **Submit for Review**
7. Sign in as **Dr. Davin Powdhar** and approve the case
8. Sign in as **Dr. Windale** and approve the case

---

## Step 3: Test the Supervisor Dashboard

### Test as Supervisor 1

1. Go to `http://localhost:3000/` and sign in:
   - **Email**: `supervisor1@test.edu`
   - **Password**: `Test1234!`
2. You're redirected to `/supervisor` dashboard
3. You should see:

   **Header Banner**: Generic Supervisor banner with your responsibilities

   **Case Table** showing 4 students:
   - **DMT-2024-001** (Alice): Gray pending status, no action button
   - **DMT-2024-002** (Bob): Orange "Supervisor 1" status with approval button
   - **DMT-2024-003** (Carol): Amber status, showing "✅ Approved by Sup. 1"
   - **DMT-2024-004** (David): Yellow status, showing "✅ Approved by Sup. 1"

---

### Test as Supervisor 2

1. Sign in with:
   - **Email**: `supervisor2@test.edu`
   - **Password**: `Test1234!`
2. Go to `/supervisor` dashboard
3. You should see:

   **Header Banner**: Generic Supervisor banner

   **Case Table**:
   - **DMT-2024-001 & 002**: No action buttons (not at your stage)
   - **DMT-2024-003** (Carol): Amber "Supervisor 2" status with approval button
   - **DMT-2024-004** (David): Yellow status, showing "✅ Approved by Sup. 2"

---

### Test as Dr. Paul

1. Sign in with:
   - **Email**: `drpaul@test.edu`
   - **Password**: `Test1234!`
2. Go to `/supervisor` dashboard
3. You should see:

   **Header Banner**: Green "Dr. Paul — Lead Supervisor" banner

   **Case Table**:
   - **DMT-2024-001, 002, 003**: No action buttons (both supervisors haven't approved)
   - **DMT-2024-004** (David): Yellow "Dr. Paul" status with **✅ Grant Final Approval** button

---

## What the Tiered System Enforces

✅ **Supervisor 1 Must Approve First**
- Only the assigned Supervisor 1 can approve cases in the "supervisor1" stage
- Case cannot move to "supervisor2" without Supervisor 1's approval

✅ **Supervisor 2 Requires Prior Approval**
- Only the assigned Supervisor 2 can see approval buttons for cases Supervisor 1 already approved
- Case cannot move to "drpaul" without Supervisor 2's approval

✅ **Dr. Paul Requires Both Approvals**
- Dr. Paul can only approve if both supervisors have already approved
- Case cannot be marked "approved" without all prior approvals

✅ **All Supervisors See All Cases**
- Every supervisor role can see all student cases
- They just can only act on cases they are assigned to

---

## Visual Guide: Status Indicators

| Stage | Color | Icon | Meaning |
|-------|-------|------|---------|
| `pending` | Gray | ◇ | Awaiting student submission |
| `supervisor1` | Orange | 🟠 | Awaiting Supervisor 1 approval |
| `supervisor2` | Amber | 🟡 | Supervisor 1 approved, awaiting Supervisor 2 |
| `drpaul` | Yellow | 🔆 | Both supervisors approved, awaiting Dr. Paul |
| `approved` | Green | ✅ | Final approval granted |

---

## Troubleshooting

**Q: I don't see the supervisor dashboard**
- Make sure you signed up via `/supervisor-signup` (not the main page)
- Check you used the correct invite code

**Q: The approve buttons don't show**
- Check the `approvalStage` in Firestore matches the logic
- Verify `supervisor1Approval.approved` is `true` for Supervisor 2 to see buttons
- Verify `supervisor1Uid`/`supervisor2Uid` match the signed-in supervisor's UID

**Q: Cases aren't appearing**
- Make sure you saved the student profile (saves to Firestore)
- Check the case document exists in Firestore → collections → cases

**Q: Want to reset and start over?**
- Delete the test user accounts from Firebase Auth
- Delete the case records from Firestore
- Start from Step 1 again
