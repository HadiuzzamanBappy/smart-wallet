export function calculatePlan(form) {
  const n = (v) => parseFloat(v) || 0;

  // ── CURRENCY SYMBOL ──────────────────────────────────────────
  // Extract just the symbol part (e.g. "৳ BDT" → "৳", "$ USD" → "$")
  const currencySymbol = (form.currency || '৳ BDT').split(' ')[0];
  const fmt = (val) => `${currencySymbol}${Math.round(val || 0).toLocaleString()}`;

  // ── BASE INCOME ──────────────────────────────────────────────
  const salary      = n(form.salary);
  const extra       = n(form.extra);
  const totalIncome = salary + extra;

  // ── ALL FIXED / COMMITTED COSTS ──────────────────────────────
  // Everything the user has already committed to each month.
  const rent        = form.hasRent ? n(form.rent) : 0;
  const familySend  = form.hasFamilySend ? n(form.familySend) : 0;
  const bills       = n(form.bills);
  const transport   = n(form.transport);
  const totalFixedCosts = rent + familySend + bills + transport;
  const totalEMI        = (form.loans || []).reduce((s, l) => s + n(l.emi), 0);
  const totalFixed      = totalFixedCosts + totalEMI;

  // ── SAVINGS & ASSETS ──────────────────────────────────────────
  const totalAssets     = (form.deposits || []).reduce((s, d) => s + n(d.balance), 0);
  const goalAssets      = (form.deposits || []).filter(d => d.useForGoal !== false).reduce((s, d) => s + n(d.balance), 0);

  const actualSavings   = (form.deposits || []).reduce((s, d) => s + n(d.monthly), 0);
  
  // Calculate Goal Target (Deduct selected assets from goal)
  const goal            = n(form.goal);
  const goalMonths      = n(form.goalMonths) || 12;
  const remainingGoal   = Math.max(goal - goalAssets, 0);
  const monthlyForGoal  = remainingGoal > 0 ? remainingGoal / goalMonths : 0;

  // ── NET BALANCE (Everything Deducted) ────────────────────────
  // The user wants EVERYTHING (Fixed + EMI + Savings + Goal) deducted
  const totalDeductions = totalFixed + actualSavings + monthlyForGoal;
  const netBalance      = totalIncome - totalDeductions;
  const isDeficit       = netBalance < 0;

  const disposable      = Math.max(totalIncome - totalFixed, 0);
  const needsBudget     = disposable * 0.50;
  const wantsBudget     = disposable * 0.30;
  const savingsTarget   = disposable * 0.20;

  const fixedRatio     = totalIncome > 0 ? totalFixedCosts / totalIncome : 0;
  const loanRatio      = totalIncome > 0 ? totalEMI / totalIncome : 0;
  const savingsRatio   = totalIncome > 0 ? actualSavings / totalIncome : 0;
  const goalRatio      = totalIncome > 0 ? monthlyForGoal / totalIncome : 0;
  const freeRatio      = Math.max(0, 1 - (fixedRatio + loanRatio + savingsRatio + goalRatio));

  const savingsRate    = savingsRatio;
  const savingsGap     = Math.max(savingsTarget - actualSavings, 0);

  const untrackedMoney = Math.max(disposable - actualSavings, 0);

  // ── RENT SAFETY ──────────────────────────────────────────────
  // U.S. HUD 30% Housing Standard
  const rentRatio   = totalIncome > 0 ? rent / totalIncome : 0;
  const safeRentMax = totalIncome * 0.30;
  const rentOverage = Math.max(rent - safeRentMax, 0);

  // ── LOAN / DEBT-TO-INCOME RATIO ──────────────────────────────
  // Standard bank DTI — danger above 36%
  const dtiRatio    = totalIncome > 0 ? totalEMI / totalIncome : 0;
  const safeEMIMax  = totalIncome * 0.36;
  const emiOverage  = Math.max(totalEMI - safeEMIMax, 0);

  // Individual loan payoff projections
  const loanDetails = (form.loans || []).map(l => ({
    ...l,
    monthsLeft: n(l.remaining),
    totalLeft: n(l.emi) * n(l.remaining),
    payoffDate: new Date(Date.now() + n(l.remaining) * 30 * 24 * 60 * 60 * 1000)
      .toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }),
  }));

  // ── EMERGENCY FUND ───────────────────────────────────────────
  // CFP guideline — 6 months of total monthly expenses
  const monthlyExpenses = totalFixed + needsBudget;
  const efTarget        = monthlyExpenses * 6;
  const efGap           = Math.max(efTarget - totalAssets, 0); // Use totalAssets here
  const efProgress      = efTarget > 0 ? Math.min(totalAssets / efTarget, 1) : 1;
  const efMonths        = actualSavings > 0 ? Math.ceil(efGap / actualSavings) : 999;

  // ── DAILY & CATEGORY SPENDING LIMITS ─────────────────────────
  const dailyFoodMax      = needsBudget / 30;   // All of Needs ÷ 30 days for food budget
  const personalMax       = needsBudget * 0.30; // 30% of Needs for personal care
  const entertainmentMax  = wantsBudget * 0.50; // 50% of Wants for entertainment
  const clothingMax       = wantsBudget * 0.30; // 30% of Wants for clothing

  // ── GOAL AFFORDABILITY ───────────────────────────────────────
  const canAffordGoal  = monthlyForGoal <= savingsTarget;

  // ── RULE FLAGS (actionable, currency-aware) ───────────────────
  const flags = [];

  // Goal Achievement Flag
  if (goal > 0 && goalAssets >= goal) {
    flags.push({
      type: 'ok',
      rule: 'Purchase Goal',
      msg: `Your selected assets (${fmt(goalAssets)}) already cover your goal of ${fmt(goal)}. You are ready to purchase!`,
    });
  }

  // 1. Rent Rule (HUD standard)
  if (rent > 0) {
    if (rentRatio > 0.50) {
      flags.push({
        type: 'danger',
        rule: 'Housing',
        msg: `Your rent is ${Math.round(rentRatio * 100)}% of income — dangerously high. You need to reduce it by ${fmt(rentOverage)}/mo to stay under the 30% safe limit of ${fmt(safeRentMax)}.`,
      });
    } else if (rentRatio > 0.30) {
      flags.push({
        type: 'warn',
        rule: 'Housing',
        msg: `Rent is ${Math.round(rentRatio * 100)}% of income. That's ${fmt(rentOverage)}/mo over the safe 30% limit (${fmt(safeRentMax)}). Try to reduce or increase income.`,
      });
    } else {
      flags.push({
        type: 'ok',
        rule: 'Housing',
        msg: `Rent is ${Math.round(rentRatio * 100)}% of income — within the healthy 30% limit. You have ${fmt(safeRentMax - rent)}/mo of rent headroom.`,
      });
    }
  }

  // 2. Debt / Loan Rule (DTI standard)
  if (totalEMI > 0) {
    if (dtiRatio > 0.36) {
      flags.push({
        type: 'danger',
        rule: 'Debt Load',
        msg: `Your loan EMIs are ${Math.round(dtiRatio * 100)}% of income — above the 36% bank stress limit. You're overpaying by ${fmt(emiOverage)}/mo. Avoid all new debt.`,
      });
    } else if (dtiRatio > 0.20) {
      flags.push({
        type: 'warn',
        rule: 'Debt Load',
        msg: `Loan EMIs are ${Math.round(dtiRatio * 100)}% of income — manageable, but don't add new debt. Keep your EMI ceiling at ${fmt(safeEMIMax)}/mo.`,
      });
    } else {
      flags.push({
        type: 'ok',
        rule: 'Debt Load',
        msg: `EMIs are only ${Math.round(dtiRatio * 100)}% of income — healthy. You have ${fmt(safeEMIMax - totalEMI)}/mo of safe debt headroom.`,
      });
    }
  }

  // 3. Savings Rate Rule (50/30/20)
  if (savingsRate === 0) {
    flags.push({
      type: 'danger',
      rule: 'Savings',
      msg: `You're saving ${fmt(0)}/mo — zero. One emergency will destabilise your finances. Start with at least ${fmt(savingsTarget * 0.5)}/mo (10% of income).`,
    });
  } else if (savingsRate < 0.10) {
    flags.push({
      type: 'warn',
      rule: 'Savings',
      msg: `Savings rate is only ${Math.round(savingsRate * 100)}% — below the 20% target. You need ${fmt(savingsGap)} more/mo to hit ${fmt(savingsTarget)}/mo.`,
    });
  } else if (savingsRate < 0.20) {
    flags.push({
      type: 'warn',
      rule: 'Savings',
      msg: `Saving ${Math.round(savingsRate * 100)}% — halfway there. Add ${fmt(savingsGap)} more/mo to reach the 20% goal of ${fmt(savingsTarget)}.`,
    });
  } else {
    flags.push({
      type: 'ok',
      rule: 'Savings',
      msg: `Saving ${Math.round(savingsRate * 100)}% of income — above the 20% target. You're banking ${fmt(actualSavings)}/mo. Great discipline.`,
    });
  }

  // 4. Money leak / untracked spending
  if (disposable > 0 && untrackedMoney > totalIncome * 0.10) {
    flags.push({
      type: 'warn',
      rule: 'Spending Leak',
      msg: `${fmt(untrackedMoney)}/mo of your disposable income is unaccounted for — likely on impulse buys or cash spending. Assign it a job or it disappears.`,
    });
  }

  // 5. Deficit warning (most critical)
  if (isDeficit) {
    flags.push({
      type: 'danger',
      rule: 'Cash Flow',
      msg: `You are ${fmt(Math.abs(netBalance))}/mo in the RED. Your committed costs + savings exceed your income. Cut costs or reduce savings deposits immediately.`,
    });
  }

  // 6. Emergency fund
  if (efMonths > 36 && actualSavings > 0) {
    flags.push({
      type: 'warn',
      rule: 'Emergency Fund',
      msg: `At current savings rate it will take ${efMonths > 500 ? '∞' : efMonths} months to build your 6-month safety net (${fmt(efTarget)}). Consider boosting monthly deposits.`,
    });
  }

  return {
    // Income
    salary, extra, totalIncome,
    // Assets
    totalAssets,
    // Fixed costs (all-in)
    rent, familySend, bills, transport, totalEMI, totalFixed, totalFixedCosts,
    // Net balance
    netBalance, isDeficit, totalDeductions,
    // 50/30/20
    disposable, needsBudget, wantsBudget, savingsTarget,
    // Savings
    actualSavings, currentSavings: totalAssets, savingsRate, savingsGap, untrackedMoney,
    // Ratios
    rentRatio, safeRentMax, rentOverage,
    dtiRatio, safeEMIMax, emiOverage, loanDetails,
    // Bar chart ratios (actual)
    fixedRatio, loanRatio, savingsRatio, goalRatio, freeRatio,
    // Emergency fund
    efTarget, efGap, efProgress, efMonths, monthlyExpenses,
    // Spending limits
    dailyFoodMax, personalMax, entertainmentMax, clothingMax,
    // Goal
    goal, remainingGoal, goalMonths, monthlyForGoal, canAffordGoal,
    // Meta
    flags, currency: form.currency, currencySymbol,
    calculatedAt: new Date().toISOString(),
  };
}
