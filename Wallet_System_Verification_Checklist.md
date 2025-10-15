# 🧾 Wallet System Comprehensive Verification Checklist (for VS Code Agent)

> **Goal:** Ensure all wallet transactions (income, expense, credit, loan, adjustments, edits, deletions) maintain consistency and follow the financial logic model.

---

## ⚙️ 1. Initialization & Structure

### ✅ Database & Model Checks
- [ ] Ensure a **Transactions table** exists with columns:  
  `id`, `type`, `amount`, `date`, `note`, `related_user_id`, `status`, `created_at`, `updated_at`.
- [ ] Ensure a **Wallet table** exists with columns:  
  `id`, `balance`, `total_income`, `total_expense`, `total_credit_given`, `total_loan_taken`.
- [ ] Ensure each transaction `type` is one of:  
  `income`, `expense`, `credit_given`, `loan_taken`, `credit_adjustment`, `loan_adjustment`.
- [ ] Verify `amount` values are **positive numbers**.
- [ ] Ensure **foreign keys** or relationships (if any) are valid (e.g., user or agent link).
- [ ] Ensure **all transaction types are logged** — even adjustments must be stored separately.

---

## 🔄 2. Transaction Logic Validation

### ➕ **Add Transaction Rules**
For each transaction type, verify that wallet updates are correct:

| Type | Expected Wallet Effect |
|------|------------------------|
| income | `balance += amount` |
| expense | `balance -= amount` |
| credit_given | `balance -= amount`, `credit_given += amount` |
| loan_taken | `balance += amount`, `loan_taken += amount` |
| credit_adjustment | `balance += amount`, `credit_given -= amount` |
| loan_adjustment | `balance -= amount`, `loan_taken -= amount` |

✅ **Checkpoints for Agent:**
- [ ] After each new transaction, recompute:  
  `computed_balance = total_income - total_expense - total_credit_given + total_loan_taken`  
  and verify it equals `wallet.balance`.
- [ ] Ensure **no negative values** for credit_given or loan_taken.

---

### ✏️ **Edit Transaction Rules**
Agent should simulate edit operations:
1. Reverse the old transaction effect.
2. Apply the new one.
3. Check final balance integrity.

✅ **Checkpoints:**
- [ ] Verify old transaction reversal logic works (balance returns to pre-edit state).
- [ ] Verify applying the new amount updates all relevant fields correctly.
- [ ] Check recalculated wallet totals after edit match expected results.

---

### ❌ **Delete Transaction Rules**
For each type, verify delete reverses its effect:

| Type | Reverse Effect on Delete |
|------|--------------------------|
| income | `balance -= amount` |
| expense | `balance += amount` |
| credit_given | `balance += amount`, `credit_given -= amount` |
| loan_taken | `balance -= amount`, `loan_taken -= amount` |
| credit_adjustment | `balance -= amount`, `credit_given += amount` |
| loan_adjustment | `balance += amount`, `loan_taken += amount` |

✅ **Checkpoints:**
- [ ] Confirm each delete restores balance to state before addition.
- [ ] Ensure totals never go below zero.
- [ ] Verify the deleted record no longer affects wallet calculations.

---

## ⚖️ 3. Adjustment-Specific Validation

### 🔹 **Credit Adjustment**
- [ ] Adding a credit adjustment increases balance and decreases credit_given.
- [ ] Deleting a credit adjustment decreases balance and increases credit_given.
- [ ] Editing a credit adjustment properly reverses and reapplies changes.

### 🔹 **Loan Adjustment**
- [ ] Adding a loan adjustment decreases balance and decreases loan_taken.
- [ ] Deleting a loan adjustment increases balance and increases loan_taken.
- [ ] Editing a loan adjustment properly reverses and reapplies changes.

### 🔹 **Boundary Checks**
- [ ] Adjustment amount cannot exceed remaining credit/loan.
- [ ] Adjustment amount must be positive.
- [ ] After adjustments, credit_given or loan_taken cannot go below zero.

---

## 🔍 4. Consistency Validation

Agent should run integrity checks after all operations:

| Check | Expected Outcome |
|--------|------------------|
| Balance Equation | `balance == total_income - total_expense - total_credit_given + total_loan_taken` |
| Totals Validation | Sum of transaction types == Wallet stored totals |
| Negative Protection | No negative totals unless overdraft mode enabled |
| Adjustment Impact | Adjustments correctly affect related fields |
| Edit/Delete | No double count or missing effect |

✅ **Checkpoints:**
- [ ] Recompute all totals from transactions table and match wallet table.
- [ ] Confirm no inconsistencies after bulk add/edit/delete.

---

## 🧪 5. Transaction Flow Testing

Agent should simulate the following **test sequences**:

### Scenario 1: Basic Flow
1. Add income ₹1000  
2. Add expense ₹200  
3. Expected balance = ₹800

### Scenario 2: Credit Flow
1. Add credit_given ₹500 → balance = ₹300  
2. Add credit_adjustment ₹200 (repayment) → balance = ₹500  
3. Delete credit_adjustment → balance = ₹300 (restored)  
4. Expected credit_given = ₹500 again

### Scenario 3: Loan Flow
1. Add loan_taken ₹1000 → balance = ₹1300  
2. Add loan_adjustment ₹400 (repay) → balance = ₹900  
3. Delete loan_adjustment → balance = ₹1300  
4. Expected loan_taken = ₹1000 again

### Scenario 4: Edit Case
1. Add expense ₹100  
2. Edit expense → ₹300  
3. Check if balance decreased by only additional ₹200, not total ₹300.

### Scenario 5: Mixed Transactions
1. Income ₹2000, Expense ₹500, Credit Given ₹300, Loan Taken ₹400  
→ Expected balance = 2000 - 500 - 300 + 400 = ₹1600

✅ **Agent Tasks:**
- [ ] Run all above scenarios automatically.
- [ ] Compare computed vs. stored balances.
- [ ] Log mismatches or rounding issues.

---

## 🧮 6. Data Integrity & Validation Rules

- [ ] Ensure all transaction IDs are unique.
- [ ] Prevent duplicate transactions on same timestamp + amount + type.
- [ ] Validate that updates/deletions are logged with timestamps.
- [ ] Audit log: store all changes for review.

---

## 📊 7. Reporting Verification

- [ ] Each transaction category total matches sum of all relevant transactions.
- [ ] Adjustment transactions labeled distinctly (`is_adjustment = true` or separate type).
- [ ] Filters (by type/date/user) return correct subsets.
- [ ] Balance shown in UI equals computed backend balance.

---

## 🧱 8. Agent Meta-Tasks

If your agent can read or simulate database logic:
- [ ] Parse SQL or ORM queries to confirm arithmetic follows rules.
- [ ] Simulate CRUD actions using test data.
- [ ] Check for rounding issues in floating-point math.
- [ ] Confirm all `DELETE` or `UPDATE` triggers properly reverse effects.
- [ ] Ensure unit tests cover all transaction types.

---

## 🧠 9. Optional Deep Validation

If your agent supports advanced validation:
- [ ] Generate a transaction timeline chart to visualize changes.
- [ ] Detect anomalies (e.g., sudden large jumps).
- [ ] Compare recomputed historical balances vs. stored snapshots.
- [ ] Detect orphaned adjustments (no linked credit/loan).

---

## ✅ 10. Pass/Fail Criteria

| Category | Criteria | Status |
|-----------|-----------|--------|
| Balance Accuracy | All balance checks match computed totals | ☐ |
| Edit/Delete Correctness | Reverse logic works as expected | ☐ |
| Adjustment Integrity | Adjustments and deletions consistent | ☐ |
| Transaction Validation | All CRUD types work independently | ☐ |
| Data Consistency | No negative or orphan totals | ☐ |
