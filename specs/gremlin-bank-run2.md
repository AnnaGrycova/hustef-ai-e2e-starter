# Gremlin Bank Test Plan

## Application Overview

Gremlin Bank is a demo banking application for the HUSTEF 2026 workshop. This test plan covers the core functionality: user authentication (sign in/out), dashboard account information and transactions, and domestic money transfers with comprehensive validation and fee calculation. The application has two test accounts (Everyday and Savings), saved payees for practice, and enforces transfer limits and fees.

## Test Scenarios

### 1. Sign In and Sign Out

**Seed:** `seed.spec.ts`

#### 1.1. Successful sign in

**File:** `tests/sign-in-out/successful-sign-in.spec.ts`

**Steps:**
  1. Navigate to /login
    - expect: Sign in page is displayed
    - expect: Username and Password fields are visible
  2. Fill Username with env('GREMLIN_USER')
    - expect: Username field contains the value
  3. Fill Password with env('GREMLIN_PASSWORD')
    - expect: Password field contains masked characters
  4. Click 'Sign in' button
    - expect: Navigates to /dashboard
    - expect: Page title is 'Accounts - Gremlin Bank'
    - expect: Heading 'Accounts' is visible
    - expect: User is shown as signed in (displays username)

#### 1.2. Failed sign in with wrong credentials

**File:** `tests/sign-in-out/failed-sign-in.spec.ts`

**Steps:**
  1. Navigate to /login
    - expect: Sign in page is displayed
  2. Fill Username with 'wronguser' and Password with 'wrongpass'
    - expect: Fields contain the values
  3. Click 'Sign in' button
    - expect: Stays on /login page
    - expect: Alert message 'Wrong username or password.' is displayed

#### 1.3. Sign out

**File:** `tests/sign-in-out/sign-out.spec.ts`

**Steps:**
  1. From the dashboard (after sign in), click 'Sign out' button
    - expect: Navigates to /login
    - expect: Page title is 'Sign in - Gremlin Bank'
    - expect: User is no longer signed in
  2. Attempt to navigate to /dashboard without signing in
    - expect: Redirects to /login (protected route)

### 2. Dashboard

**Seed:** `seed.spec.ts`

#### 2.1. Account information display

**File:** `tests/dashboard/account-information.spec.ts`

**Steps:**
  1. View the dashboard after sign in
    - expect: Heading 'Accounts' is visible
    - expect: Everyday Account is displayed with IBAN 'HU39 9992 0265 3141 5926 5358 9797' and balance '1,250,000 HUF'
    - expect: Savings Account is displayed with IBAN 'HU03 9992 0265 2718 2818 2845 9043' and balance '5,400,000 HUF'
    - expect: Session code is displayed in format 'GRM-XXXXX-XXXX' (assert format, not exact value)
    - expect: Security check image with code in format 'GRM-XXXX-XXXX' is displayed (assert format, not exact value)

#### 2.2. Recent transactions display

**File:** `tests/dashboard/recent-transactions.spec.ts`

**Steps:**
  1. View the 'Recent transactions' section on the dashboard
    - expect: Heading 'Recent transactions' is visible
    - expect: Table has columns: Date, Description, Amount
    - expect: Table contains at least one transaction
    - expect: Transaction '2026-09-30', 'Grocery store, Budapest', '-18,450 HUF' is displayed
    - expect: Transaction '2026-09-29', 'Salary, Gremlin Works Ltd.', '+685,000 HUF' is displayed
    - expect: Transaction '2026-09-27', 'Mobile phone bill', '-7,990 HUF' is displayed
    - expect: Positive amounts are prefixed with '+', negative with '-'

#### 2.3. Dashboard volatile content format

**File:** `tests/dashboard/volatile-content.spec.ts`

**Steps:**
  1. View the 'Tip of the day' and 'Exchange rate' sections
    - expect: Heading 'Tip of the day' is visible
    - expect: Tip text is displayed (assert presence, not exact content as it is random)
    - expect: Heading 'Exchange rate' is visible
    - expect: EUR/HUF rate is displayed in numeric format (assert format like XXX.XX, not exact value as it updates on every page load)
    - expect: Note 'Indicative rate. Updated on every page load.' is displayed

### 3. Domestic Transfer - Form Validation

**Seed:** `seed.spec.ts`

#### 3.1. Required field validation

**File:** `tests/transfer/required-fields.spec.ts`

**Steps:**
  1. Navigate to /transfer
    - expect: Transfer form is displayed
    - expect: Heading 'New transfer' is visible
  2. Leave Beneficiary name empty, fill IBAN with 'HU72 9990 1017 1618 0339 8874 9892', leave Amount empty, click 'Continue'
    - expect: Error 'Enter a beneficiary name.' is displayed for Beneficiary name field
    - expect: Error 'Check the IBAN first.' is displayed for IBAN field
    - expect: Error 'Enter an amount greater than 0.' is displayed for Amount field
    - expect: Form does not submit

#### 3.2. Invalid IBAN validation

**File:** `tests/transfer/invalid-iban.spec.ts`

**Steps:**
  1. Navigate to /transfer
    - expect: Transfer form is displayed
  2. Fill Beneficiary name with 'Test User'
    - expect: Field contains the value
  3. Fill IBAN with 'HU99 9999 9999 9999 9999 9999 9999' (invalid IBAN)
    - expect: Field contains the value
  4. Click 'Check IBAN' button
    - expect: Error 'Invalid IBAN' is displayed
    - expect: IBAN is not verified
  5. Try to continue with invalid IBAN
    - expect: Form does not proceed to review page

#### 3.3. Valid IBAN verification

**File:** `tests/transfer/valid-iban.spec.ts`

**Steps:**
  1. Navigate to /transfer and fill Beneficiary name with 'Kiss Péter'
    - expect: Field contains the value
  2. Fill IBAN with 'HU72 9990 1017 1618 0339 8874 9892' (valid IBAN from saved payees)
    - expect: Field contains the value
  3. Click 'Check IBAN' button
    - expect: Status 'IBAN verified: GRM-XXXXX-XXXX' is displayed (assert format, not exact code as it is generated)
    - expect: IBAN is marked as verified

#### 3.4. Amount validation - zero and boundary values

**File:** `tests/transfer/amount-validation.spec.ts`

**Steps:**
  1. Navigate to /transfer, fill Beneficiary name and valid IBAN, check IBAN
    - expect: IBAN is verified
  2. Fill Amount with '0' and click 'Continue'
    - expect: Error 'Enter an amount greater than 0.' is displayed
    - expect: Form does not submit
  3. Fill Amount with '1' (minimum valid amount) and click 'Continue'
    - expect: Form proceeds to review page
    - expect: Amount '1 HUF' is displayed

#### 3.5. Insufficient funds validation

**File:** `tests/transfer/insufficient-funds.spec.ts`

**Steps:**
  1. Navigate to /transfer
    - expect: 'From account' is set to 'Everyday Account'
    - expect: 'Available: 1,250,000 HUF' is displayed
  2. Fill valid Beneficiary name and IBAN, check IBAN, fill Amount with '2000000' (exceeds available balance of 1,250,000 + 200 fee)
    - expect: Field contains the value
  3. Click 'Continue'
    - expect: Error 'Insufficient funds.' is displayed
    - expect: Form does not proceed
  4. Change Amount to '1249800' (just under the available balance minus fee)
    - expect: No insufficient funds error

#### 3.6. Daily limit validation

**File:** `tests/transfer/daily-limit.spec.ts`

**Steps:**
  1. Navigate to /transfer and select 'Savings Account' from 'From account' dropdown
    - expect: 'Available: 5,400,000 HUF' is displayed
  2. Fill valid Beneficiary name and IBAN, check IBAN, fill Amount with '2000001' (exceeds daily limit of 2,000,000 HUF)
    - expect: Field contains the value
  3. Click 'Continue'
    - expect: Error 'Daily limit of 2,000,000 HUF exceeded.' is displayed
    - expect: Form does not proceed
  4. Note: limits displayed show 'Limits: up to 10,000,000 HUF per transfer and 2,000,000 HUF per day.'
    - expect: Limits text is visible in the Saved payees section

#### 3.7. Use saved payee

**File:** `tests/transfer/saved-payee.spec.ts`

**Steps:**
  1. Navigate to /transfer and view 'Saved payees' section
    - expect: Heading 'Saved payees' is visible
    - expect: Kiss Péter with IBAN 'HU72 9990 1017 1618 0339 8874 9892' is listed
    - expect: Nagy Eszter with IBAN 'HU71 9990 2025 1414 2135 6237 3099' is listed
    - expect: Tóth Bence with IBAN 'HU03 9990 3033 1732 0508 0756 8879' is listed
  2. Click 'Use' button for 'Nagy Eszter'
    - expect: Beneficiary name is filled with 'Nagy Eszter'
    - expect: IBAN is filled with 'HU71 9990 2025 1414 2135 6237 3099'
    - expect: IBAN is automatically verified

#### 3.8. Switch source account

**File:** `tests/transfer/switch-account.spec.ts`

**Steps:**
  1. Navigate to /transfer
    - expect: 'From account' dropdown is set to 'Everyday Account'
    - expect: 'Available: 1,250,000 HUF' is displayed
  2. Select 'Savings Account' from 'From account' dropdown
    - expect: 'Available: 5,400,000 HUF' is displayed
    - expect: Available balance updates to reflect the selected account
  3. Select 'Everyday Account' again
    - expect: 'Available: 1,250,000 HUF' is displayed

### 4. Domestic Transfer - Fees and Review

**Seed:** `seed.spec.ts`

#### 4.1. Fee calculation for various amounts

**File:** `tests/transfer/fee-calculation.spec.ts`

**Steps:**
  1. Create a transfer from Everyday Account with amount 100 HUF to Kiss Péter
    - expect: Review page displays Amount: 100 HUF
    - expect: Fee: 200 HUF (minimum fee)
    - expect: Total: 300 HUF
  2. Go back and create a transfer with amount 10,000 HUF
    - expect: Review page displays Amount: 10,000 HUF
    - expect: Fee: 200 HUF (minimum fee)
    - expect: Total: 10,200 HUF
  3. Go back and create a transfer with amount 70,000 HUF
    - expect: Review page displays Amount: 70,000 HUF
    - expect: Fee: 210 HUF (0.3% = 210 > 200 minimum)
    - expect: Total: 70,210 HUF
  4. Go back and create a transfer with amount 100,000 HUF
    - expect: Review page displays Amount: 100,000 HUF
    - expect: Fee: 300 HUF (0.3%)
    - expect: Total: 100,300 HUF
  5. Go back, switch to Savings Account, create a transfer with amount 1,000,000 HUF
    - expect: Review page displays Amount: 1,000,000 HUF
    - expect: Fee: 3,000 HUF (0.3%)
    - expect: Total: 1,003,000 HUF
  6. Go back and create a transfer with amount 2,000,000 HUF (at daily limit)
    - expect: Review page displays Amount: 2,000,000 HUF
    - expect: Fee: 6,000 HUF (0.3%)
    - expect: Total: 2,006,000 HUF
  7. Note: Fee structure is max(200 HUF, 0.3% of amount)
    - expect: Fee calculation follows this rule for all tested amounts

#### 4.2. Review page details

**File:** `tests/transfer/review-page.spec.ts`

**Steps:**
  1. Create a transfer: From Everyday Account, To 'Tóth Bence', IBAN 'HU03 9990 3033 1732 0508 0756 8879', Amount 50,000 HUF, Reference 'Test payment'
    - expect: Review page is displayed
    - expect: Page title is 'Review transfer - Gremlin Bank'
    - expect: Heading 'Review transfer' is visible
  2. Verify all transfer details in the table
    - expect: From: Everyday Account
    - expect: To: Tóth Bence
    - expect: IBAN: HU03 9990 3033 1732 0508 0756 8879
    - expect: Amount: 50,000 HUF
    - expect: Fee: 200 HUF
    - expect: Total: 50,200 HUF
  3. Check for Transaction PIN field and action buttons
    - expect: Transaction PIN field is visible with '4 digits' hint
    - expect: 'Confirm transfer' button is visible
    - expect: 'Change details' link is visible

#### 4.3. Change details from review page

**File:** `tests/transfer/change-details.spec.ts`

**Steps:**
  1. Create a transfer and reach the review page
    - expect: Review page is displayed with transfer details
  2. Click 'Change details' link
    - expect: Navigates back to /transfer with edit mode
    - expect: All previously entered values are preserved in the form fields
  3. Modify the Amount to a different value and click 'Continue'
    - expect: Returns to review page with updated Amount and recalculated Fee and Total

#### 4.4. Wrong PIN validation

**File:** `tests/transfer/wrong-pin.spec.ts`

**Steps:**
  1. Create a transfer and reach the review page
    - expect: Review page is displayed
  2. Fill Transaction PIN with '0000' (wrong PIN)
    - expect: Field contains masked characters
  3. Click 'Confirm transfer' button
    - expect: Alert 'Wrong PIN.' is displayed
    - expect: Transfer is not confirmed
    - expect: Stays on review page

#### 4.5. Successful transfer confirmation

**File:** `tests/transfer/successful-transfer.spec.ts`

**Steps:**
  1. Create a transfer: From Savings Account to Kiss Péter (HU72 9990 1017 1618 0339 8874 9892), Amount 25,000 HUF, Reference 'Monthly allowance'
    - expect: Review page displays Amount: 25,000 HUF, Fee: 200 HUF, Total: 25,200 HUF
  2. Fill Transaction PIN with env('GREMLIN_PIN')
    - expect: Field contains masked characters
  3. Click 'Confirm transfer' button
    - expect: Transfer is confirmed
    - expect: Navigates to confirmation/success page or dashboard
    - expect: Success message or confirmation is displayed with transfer reference (assert format, not exact value)
    - expect: Savings Account balance is reduced by 25,200 HUF (if verified on dashboard)
