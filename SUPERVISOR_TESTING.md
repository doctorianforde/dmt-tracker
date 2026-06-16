# Supervisor Dashboard Testing Guide

## Your Invite Codes (from .env.local)

```
SUPERVISOR 1: sup1-change-me
SUPERVISOR 2: sup2-change-me
DR. PAUL:     drpaul-change-me
```

---

## Step 1: Create Supervisor Accounts

### Create Supervisor 1
1. Go to `http://localhost:3000/supervisor-signup`
2. Click "Supervisor 1" role
3. Fill in:
   - **Full Name**: `Dr. Davin Powdhar`
   - **Email**: `supervisor1@test.edu`
   - **Password**: `Test1234!`
   - **Invite Code**: `sup1-change-me`
4. Click "Create Supervisor Account"

### Create Supervisor 2
1. Go to `http://localhost:3000/supervisor-signup`
2. Click "Supervisor 2" role
3. Fill in:
   - **Full Name**: `Dr. Windale`
   - **Email**: `supervisor2@test.edu`
   - **Password**: `Test1234!`
   - **Invite Code**: `sup2-change-me`
4. Click "Create Supervisor Account"

### Create Dr. Paul
1. Go to `http://localhost:3000/supervisor-signup`
2. Click "Dr. Paul (Lead Supervisor)" role
3. Fill in:
   - **Full Name**: `Dr. Paul`
   - **Email**: `drpaul@test.edu`
   - **Password**: `Test1234!`
   - **Invite Code**: `drpaul-change-me`
4. Click "Create Supervisor Account"

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
4. In "Case Sections": Check **ALL** sections (5/5) ✅
5. Click "Save Progress"

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
4. In "Case Sections": Check **ALL** sections (5/5) ✅
5. Click "Save Progress"

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
4. In "Case Sections": Check **ALL** sections (5/5) ✅
5. Click "Save Progress"

---

## Step 3: Set Case Approval Stages in Firebase

You need to manually update the Firestore database to show different approval stages:

### Firebase Console Setup

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Go to **Firestore Database** → **Collections** → **cases**

### Case 1: DMT-2024-001 (Pending)
- **approvalStage**: `pending`
- (Leave other approval fields empty)

### Case 2: DMT-2024-002 (Supervisor 1 Review)
- **approvalStage**: `supervisor1`
- **supervisor1Approval**: Add this object:
  ```
  {
    approved: false
  }
  ```
- Add fields: **supervisor1Name**: `Dr. Davin Powdhar`

### Case 3: DMT-2024-003 (Supervisor 2 Review)
- **approvalStage**: `supervisor2`
- **supervisor1Approval**: 
  ```
  {
    approved: true,
    approvedAt: (set to 2 days ago)
  }
  ```
- **supervisor1Name**: `Dr. Davin Powdhar`
- **supervisor2Name**: `Dr. Windale`

### Case 4: DMT-2024-004 (Dr. Paul Review)
- **approvalStage**: `drpaul`
- **supervisor1Approval**:
  ```
  {
    approved: true,
    approvedAt: (set to 3 days ago)
  }
  ```
- **supervisor2Approval**:
  ```
  {
    approved: true,
    approvedAt: (set to 1 day ago)
  }
  ```
- **supervisor1Name**: `Dr. Davin Powdhar`
- **supervisor2Name**: `Dr. Windale`

---

## Step 4: Test the Supervisor Dashboard

### Test as Supervisor 1

1. Go to `http://localhost:3000/` and sign in:
   - **Email**: `supervisor1@test.edu`
   - **Password**: `Test1234!`
2. You're redirected to `/supervisor` dashboard
3. You should see:

   **Header Banner** (Orange):
   - "Supervisor 1 — Primary Reviewer"
   - Description of your responsibilities

   **Case Table** showing 4 students:
   - **DMT-2024-001** (Alice): Gray pending status
   - **DMT-2024-002** (Bob): Orange "Supervisor 1" status with **🟠 ACCEPT FOR REVIEW** button
   - **DMT-2024-003** (Carol): Amber status, showing "✅ Approved by Sup. 1"
   - **DMT-2024-004** (David): Yellow status, showing "✅ Approved by Sup. 1"

---

### Test as Supervisor 2

1. Sign in with:
   - **Email**: `supervisor2@test.edu`
   - **Password**: `Test1234!`
2. Go to `/supervisor` dashboard
3. You should see:

   **Header Banner** (Amber):
   - "Supervisor 2 — Secondary Reviewer"
   - Description of your role

   **Case Table**:
   - **DMT-2024-001 & 002**: No action buttons (not at your stage)
   - **DMT-2024-003** (Carol): Amber "Supervisor 2" status with **🟡 APPROVE & SEND TO DR. PAUL** button
   - **DMT-2024-004** (David): Yellow status, showing "✅ Approved by Sup. 2"

---

### Test as Dr. Paul

1. Sign in with:
   - **Email**: `drpaul@test.edu`
   - **Password**: `Test1234!`
2. Go to `/supervisor` dashboard
3. You should see:

   **Header Banner** (Green):
   - "Dr. Paul — Lead Supervisor"
   - Information about final approval authority

   **Case Table**:
   - **DMT-2024-001, 002, 003**: No action buttons (both supervisors haven't approved)
   - **DMT-2024-004** (David): Yellow "Dr. Paul" status with **✅ GRANT FINAL APPROVAL** button

---

## What the Tiered System Enforces

✅ **Supervisor 1 Must Approve First**
- Only Supervisor 1 can approve cases in the "supervisor1" stage
- Case cannot move to "supervisor2" without Supervisor 1's approval

✅ **Supervisor 2 Requires Prior Approval**
- Supervisor 2 can only see approval buttons for cases Supervisor 1 already approved
- Case cannot move to "drpaul" without Supervisor 2's approval

✅ **Dr. Paul Requires Both Approvals**
- Dr. Paul can only approve if both supervisors have already approved
- Case cannot be marked "approved" without all prior approvals

✅ **All Supervisors See All Cases**
- Every supervisor role can see all student cases
- They just can only act on cases at their approval stage

---

## Visual Guide: Status Indicators

| Stage | Color | Icon | Meaning |
|-------|-------|------|---------|
| `pending` | Gray | ◇ | Awaiting Supervisor 1 review |
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

**Q: Cases aren't appearing**
- Make sure you saved the student profile (saves to Firestore)
- Check the case document exists in Firestore → collections → cases

**Q: Want to reset and start over?**
- Delete the test user accounts from Firebase Auth
- Delete the case records from Firestore
- Start from Step 1 again

