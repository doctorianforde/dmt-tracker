# Updated Supervisor System - Simplified Role Assignment

## Overview

The supervisor system has been refactored to be more flexible:

✅ **All supervisors sign up the same way** - No role selection during signup
✅ **Students assign supervisors** - Students select which supervisors will review their case  
✅ **Dynamic tier assignment** - The first supervisor selected is "Supervisor 1", the second is "Supervisor 2"
✅ **Dr. Paul is special** - Has final approval authority

---

## New Invite Codes (Updated `.env.local`)

```
NEXT_PUBLIC_CODE_SUPERVISOR=supervisor-secret-code
NEXT_PUBLIC_CODE_DRPAUL=drpaul-secret-code
```

---

## New Signup Flow

### Step 1: Create Supervisor Accounts

All supervisors use the **same** invite code at signup:

1. Go to `http://localhost:3000/supervisor-signup`
2. Fill in:
   - **Full Name**: `Dr. [Name]`
   - **Email**: `supervisor@test.edu`
   - **Password**: `Test1234!`
   - **Invite Code**: `supervisor-secret-code` (same for all supervisors)
3. Click "Create Supervisor Account"

**Example Supervisors:**
```
Dr. Davin Powdhar (supervisor1@test.edu)
Dr. Windale (supervisor2@test.edu)
Dr. Sally (supervisor3@test.edu)
Dr. Kyle (supervisor4@test.edu)
```

### Step 2: Create Dr. Paul Account

Dr. Paul has a separate invite code:

1. Go to `http://localhost:3000/supervisor-signup`
2. Fill in:
   - **Full Name**: `Dr. Paul`
   - **Email**: `drpaul@test.edu`
   - **Password**: `Test1234!`
   - **Invite Code**: `drpaul-secret-code`
3. Click "Create Supervisor Account"

### Step 3: Create Student Accounts

Students sign up normally on the main page:

1. Go to `http://localhost:3000/`
2. Sign up with student email/password
3. Go to `/student` dashboard
4. Fill in case details
5. **IMPORTANT**: Select which supervisors will review this case

---

## New Student Selection Flow

When setting up their case on the student dashboard:

```
Supervisor 1 (Primary Reviewer)
└─ Selects which supervisor
   (This person reviews first)
   
Supervisor 2 (Secondary Reviewer) - Optional
└─ Selects second supervisor
   (Only if needed)
```

**What students see:**
- Two dropdown menus to select supervisors
- Supervisor 1: Required (primary reviewer)
- Supervisor 2: Optional (secondary reviewer)
- Can select the same supervisor for both (one reviewer), or different supervisors (two reviewers)

---

## How the Tiered System Works

### Scenario 1: Single Supervisor Review

**Setup:**
- Student selects: `Dr. Davin Powdhar` for Supervisor 1
- Student leaves: Supervisor 2 empty

**Flow:**
1. Case goes to "supervisor1" stage
2. Dr. Davin reviews and approves
3. Case moves to "drpaul" stage (skips Supervisor 2)
4. Dr. Paul gives final approval

### Scenario 2: Two Supervisor Review (Tiered)

**Setup:**
- Student selects: `Dr. Davin Powdhar` for Supervisor 1
- Student selects: `Dr. Windale` for Supervisor 2

**Flow:**
1. Case goes to "supervisor1" stage
2. Dr. Davin (Supervisor 1) reviews and approves
3. Case moves to "supervisor2" stage
4. Dr. Windale (Supervisor 2) reviews and approves
5. Case moves to "drpaul" stage
6. Dr. Paul gives final approval

---

## Supervisor Dashboard - What They See

When supervisors sign in to `/supervisor`, they see:

### All Supervisors See:
- All student cases across the entire cohort
- Current approval stage for each case
- Who is assigned as Supervisor 1 and Supervisor 2

### They Can Only Approve:
- Cases where they are assigned as **Supervisor 1** (at "supervisor1" stage)
- Cases where they are assigned as **Supervisor 2** (at "supervisor2" stage, only if Supervisor 1 already approved)

### Example:
```
Case DMT-2024-001: Supervisor 1 = Dr. Davin, Supervisor 2 = (none)
  └─ Dr. Davin sees: "✅ Approve & Send to Dr. Paul" button
  └─ Dr. Sally sees: No action button (not assigned)

Case DMT-2024-002: Supervisor 1 = Dr. Davin, Supervisor 2 = Dr. Windale
  └─ Dr. Davin sees: "✅ Approve & Send to Sup. 2" button (to move to Windale)
  └─ Dr. Windale sees: No button yet (waiting for Davin)
  └─ After Dr. Davin approves:
  └─ Dr. Windale sees: "🟡 Approve & Send to Dr. Paul" button
```

---

## Dr. Paul Dashboard

Dr. Paul sees:
- All student cases
- "✅ Grant Final Approval" button for cases at the "drpaul" stage
- Only if **both** supervisors have already approved
- Can revoke approval if needed

---

## Key Differences from Old System

| Aspect | Old System | New System |
|--------|-----------|-----------|
| **Supervisor Signup** | Choose: Sup1, Sup2, or Dr.Paul | All supervisors the same, Dr.Paul separate |
| **Invite Codes** | 3 different codes | 2 codes (supervisor + drpaul) |
| **Supervisor Assignment** | Hardcoded to role | Student-selected per case |
| **Flexibility** | Fixed tiers | Dynamic - can use 1 or 2 supervisors |
| **Supervisor Visibility** | Only see own tier cases | See all cases, act on assigned ones |

---

## Testing the New System

### Quick Test Setup:

1. **Create 4 supervisors** (all with same code):
   - Dr. Davin (supervisor1@test.edu)
   - Dr. Windale (supervisor2@test.edu)
   - Dr. Sally (supervisor3@test.edu)
   - Dr. Kyle (supervisor4@test.edu)

2. **Create Dr. Paul** (different code):
   - Dr. Paul (drpaul@test.edu)

3. **Create test students** and assign supervisors:
   - **Student A**: Supervisor 1 = Dr. Davin, Supervisor 2 = Dr. Windale
   - **Student B**: Supervisor 1 = Dr. Sally, Supervisor 2 = (none)
   - **Student C**: Supervisor 1 = Dr. Kyle, Supervisor 2 = Dr. Sally

4. **Test approval flow**:
   - Sign in as Dr. Davin → See Student A case with approval button
   - Sign in as Dr. Windale → See Student A case but NO button (waiting for Davin)
   - Sign in as Dr. Sally → See Student B case, Student C case (different tier)

---

## Benefits of This System

🎯 **Flexibility**
- Can use 1 or 2 supervisors as needed
- Supervisors aren't locked into roles

🔄 **Scalability**
- Easy to add/remove supervisors
- Students pick who reviews their work

👥 **Fair Load Distribution**
- Can balance workload by assigning different supervisors to different students
- No supervisor stuck as "always first" or "always second"

📊 **Full Visibility**
- All supervisors can see all cases
- Transparency across the department

✅ **Clear Responsibility**
- Students explicitly choose their reviewers
- No ambiguity about who approved what

---

## Next Steps

The approval action buttons are now in place. The next implementation step would be:

1. Wire up the approve/reject button handlers
2. Add notes/feedback field when approving
3. Send notifications when case advances
4. Add audit log for tracking changes

