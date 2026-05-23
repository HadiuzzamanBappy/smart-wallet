import { addTransaction } from './transactionService';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

const activeGenerations = new Set();

/**
 * Generate baseline transaction records for the new month based on the user's active Salary Plan.
 * This commits actual encrypted entries to the database, ensuring perfect historical analytics.
 * 
 * @param {string} userId - User identifier
 * @param {Object} salaryPlan - Decrypted Salary Plan containing plan details and form values
 * @param {string} targetMonthStr - The current month string (format: "YYYY-MM")
 * @returns {Promise<Object>} Status and details of generated baseline
 */
export const generateMonthlyBaselineTransactions = async (userId, salaryPlan, targetMonthStr) => {
  const lockKey = `${userId}_${targetMonthStr}`;
  if (activeGenerations.has(lockKey)) {
    console.warn(`[ROLLOVER] Aborting concurrent execution: baseline generation already in progress for key: ${lockKey}`);
    return { success: true, count: 0, alreadyGenerated: true };
  }
  activeGenerations.add(lockKey);

  try {
    if (!salaryPlan || !salaryPlan.plan || !salaryPlan.form) {
      return { success: false, error: 'No active Salary Plan configured' };
    }

    // 1. Immediately update lastGeneratedMonth in Firestore to act as a database-level lock.
    // If a refresh or another concurrent call reads the plan from the database, it will see the lock is set.
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      'salary.lastGeneratedMonth': targetMonthStr
    });

    const { form } = salaryPlan;
    const generatedTxs = [];

    // Parse values safely
    const n = (v) => parseFloat(v) || 0;
    const salary = n(form.salary);
    const extra = n(form.extra);
    const rent = form.hasRent ? n(form.rent) : 0;
    const familySend = form.hasFamilySend ? n(form.familySend) : 0;
    const bills = n(form.bills);
    const transport = n(form.transport);

    // Baseline Date (Normalize to the 1st of the target month at midnight local time)
    const [yearStr, monthStr] = targetMonthStr.split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10) - 1; // 0-indexed JS Month
    const baselineDate = new Date(year, month, 1, 0, 0, 0);

    // Helper to log baseline
    const logBaseline = async (data) => {
      const tx = {
        ...data,
        date: baselineDate,
        source: 'salary-plan-baseline'
      };
      const res = await addTransaction(userId, tx);
      if (res.success) {
        generatedTxs.push(res.id);
      } else {
        console.warn(`Rollover: Failed to log baseline transaction for ${data.description}:`, res.error);
      }
    };

    // ── 1. FIXED INCOME BASELINES ──────────────────────────────
    if (salary > 0) {
      await logBaseline({
        type: 'income',
        amount: salary,
        description: 'Salary (Auto-generated Baseline)',
        category: 'salary'
      });
    }

    if (extra > 0) {
      await logBaseline({
        type: 'income',
        amount: extra,
        description: 'Extra Monthly Income (Baseline)',
        category: 'freelance'
      });
    }

    // ── 2. FIXED EXPENSE BASELINES ─────────────────────────────
    if (rent > 0) {
      await logBaseline({
        type: 'expense',
        amount: rent,
        description: 'Rent (Auto-generated Baseline)',
        category: 'bills'
      });
    }

    if (familySend > 0) {
      await logBaseline({
        type: 'expense',
        amount: familySend,
        description: 'Family Support Allowance (Baseline)',
        category: 'other'
      });
    }

    if (bills > 0) {
      await logBaseline({
        type: 'expense',
        amount: bills,
        description: 'Utility Bills (Baseline)',
        category: 'bills'
      });
    }

    if (transport > 0) {
      await logBaseline({
        type: 'expense',
        amount: transport,
        description: 'Transport (Baseline)',
        category: 'transport'
      });
    }

    // ── 3. LOAN EMIs AS EXPENSES ──────────────────────────────
    const loans = form.loans || [];
    for (const loan of loans) {
      const emi = n(loan.emi);
      if (emi > 0) {
        await logBaseline({
          type: 'expense',
          amount: emi,
          description: `Loan EMI - ${loan.name || 'Debt'} (Baseline)`,
          category: 'bills'
        });
      }
    }

    // ── 4. MONTHLY SAVINGS DEPOSITS AS EXPENSES ────────────────
    const deposits = form.deposits || [];
    for (const dep of deposits) {
      const monthly = n(dep.monthly);
      if (dep.type === 'Deposit' && monthly > 0) {
        await logBaseline({
          type: 'expense',
          amount: monthly,
          description: `Monthly Deposit - ${dep.name || 'Savings'} (Baseline)`,
          category: 'investment'
        });
      }
    }

    console.debug(`[ROLLOVER] Successfully generated ${generatedTxs.length} baseline transactions for ${targetMonthStr}`);
    return { success: true, count: generatedTxs.length };
  } catch (error) {
    console.error('Error generating monthly baseline transactions:', error);
    // Rollback the database-level lock so that it can be retried on a subsequent load/refresh
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        'salary.lastGeneratedMonth': salaryPlan.lastGeneratedMonth || null
      });
    } catch (rollbackError) {
      console.error('Failed to rollback lastGeneratedMonth lock in Firestore:', rollbackError);
    }
    return { success: false, error: error.message };
  } finally {
    activeGenerations.delete(lockKey);
  }
};
