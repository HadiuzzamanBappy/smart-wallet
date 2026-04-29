export function calculatePlan(form) {
  const n = (v) => parseFloat(v) || 0;

  // ── BASE INCOME ──────────────────────────────────────────────
  const salary        = n(form.salary);
  const extra         = n(form.extra);
  const totalIncome   = salary + extra;

  // ── FIXED COSTS ──────────────────────────────────────────────
  const rent          = form.hasRent ? n(form.rent) : 0;
  const familySend    = form.hasFamilySend ? n(form.familySend) : 0;
  const bills         = n(form.bills);
  const transport     = n(form.transport);
  const totalEMI      = (form.loans || []).reduce((s, l) => s + n(l.emi), 0);
  const totalFixed    = rent + familySend + bills + totalEMI;
  // Note: bills and transport excluded from "fixed" for 50/30/20 — they go into needs bucket

  // ── DISPOSABLE & 50/30/20 ────────────────────────────────────
  // Rule: Elizabeth Warren — "All Your Worth" (2005)
  const disposable    = Math.max(totalIncome - rent - familySend - totalEMI, 0);
  const needsBudget   = disposable * 0.50;   // Food, transport, personal
  const wantsBudget   = disposable * 0.30;   // Entertainment, shopping
  const savingsTarget = disposable * 0.20;   // Must save/invest

  // ── ACTUAL SAVINGS ───────────────────────────────────────────
  const actualSavings   = (form.deposits || []).reduce((s, d) => s + n(d.monthly), 0);
  const currentSavings  = n(form.currentSavings);
  const savingsRate     = totalIncome > 0 ? actualSavings / totalIncome : 0;
  const savingsGap      = Math.max(savingsTarget - actualSavings, 0);
  const untrackedMoney  = Math.max(disposable - needsBudget - wantsBudget - actualSavings, 0);

  // ── RENT SAFETY ──────────────────────────────────────────────
  // Rule: U.S. HUD 30% Housing Standard
  const rentRatio       = totalIncome > 0 ? rent / totalIncome : 0;
  const safeRentMax     = totalIncome * 0.30;

  // ── LOAN / DEBT-TO-INCOME RATIO ──────────────────────────────
  // Rule: Standard bank DTI — danger above 36%
  const dtiRatio        = totalIncome > 0 ? totalEMI / totalIncome : 0;
  // Individual loan payoff dates
  const loanDetails     = (form.loans || []).map(l => ({
    ...l,
    monthsLeft: n(l.remaining),
    totalLeft: n(l.emi) * n(l.remaining),
    payoffDate: new Date(Date.now() + n(l.remaining) * 30 * 24 * 60 * 60 * 1000)
      .toLocaleDateString("en-GB", { month: "short", year: "numeric" }),
  }));

  // ── EMERGENCY FUND ───────────────────────────────────────────
  // Rule: Standard CFP guideline — 6 months of expenses
  const monthlyExpenses = totalFixed + needsBudget;
  const efTarget        = monthlyExpenses * 6;
  const efGap           = Math.max(efTarget - currentSavings, 0);
  const efProgress      = efTarget > 0 ? Math.min(currentSavings / efTarget, 1) : 1;
  const efMonths        = actualSavings > 0
    ? Math.ceil(efGap / actualSavings)
    : 999;

  // ── DAILY & CATEGORY LIMITS ──────────────────────────────────
  const foodBudget      = Math.max(needsBudget - transport - bills, 0);
  const dailyFoodMax    = foodBudget / 30;
  const personalMax     = needsBudget * 0.30;
  const entertainmentMax = wantsBudget * 0.50;
  const clothingMax     = wantsBudget * 0.30;

  // ── GOAL SAVINGS ─────────────────────────────────────────────
  const goal            = n(form.goal);
  const goalMonths      = n(form.goalMonths) || 12;
  const monthlyForGoal  = goal > 0 ? goal / goalMonths : 0;
  const canAffordGoal   = monthlyForGoal <= savingsGap + actualSavings;

  // ── RULE FLAGS ───────────────────────────────────────────────
  const flags = [];
  const pct = v => `${Math.round(v * 100)}%`;

  if (rentRatio > 0.50) flags.push({ type: "danger", rule: "HUD", msg: `Rent is ${pct(rentRatio)} of income — CRITICAL. Reduce to under ৳${Math.round(safeRentMax).toLocaleString()}/mo.` });
  else if (rentRatio > 0.30) flags.push({ type: "warn", rule: "HUD", msg: `Rent is ${pct(rentRatio)} of income. Safe max: ৳${Math.round(safeRentMax).toLocaleString()}.` });
  else if (rent > 0) flags.push({ type: "ok", rule: "HUD", msg: `Rent ratio ${pct(rentRatio)} is healthy.` });
  
  if (dtiRatio > 0.36) flags.push({ type: "danger", rule: "DTI", msg: `Loan burden ${pct(dtiRatio)} exceeds 36% — bank stress threshold breached.` });
  else if (dtiRatio > 0.20) flags.push({ type: "warn", rule: "DTI", msg: `Loan burden ${pct(dtiRatio)} — manageable but watch new debt.` });
  else if (totalEMI > 0) flags.push({ type: "ok", rule: "DTI", msg: `Loan-to-income ${pct(dtiRatio)} is safe.` });

  if (savingsRate === 0) flags.push({ type: "danger", rule: "50/30/20", msg: "Zero monthly savings. One emergency will destabilise you." });
  else if (savingsRate < 0.10) flags.push({ type: "warn", rule: "50/30/20", msg: `Savings rate ${pct(savingsRate)} — below 20% target. Gap: ৳${Math.round(savingsGap).toLocaleString()}/mo.` });
  else if (savingsRate >= 0.20) flags.push({ type: "ok", rule: "50/30/20", msg: `Savings rate ${pct(savingsRate)} — on target.` });

  if (untrackedMoney > totalIncome * 0.15) flags.push({ type: "warn", rule: "Zero-based", msg: `৳${Math.round(untrackedMoney).toLocaleString()} unassigned monthly — money leaking with no job.` });
  if (efMonths > 36) flags.push({ type: "warn", rule: "EF", msg: `Emergency fund takes ${efMonths > 500 ? "∞" : efMonths} months at current rate. Increase savings.` });

  return {
    // Income
    salary, extra, totalIncome,
    // Fixed
    rent, familySend, bills, transport, totalEMI, totalFixed,
    // 50/30/20
    disposable, needsBudget, wantsBudget, savingsTarget,
    // Savings
    actualSavings, currentSavings, savingsRate, savingsGap, untrackedMoney,
    // Ratios
    rentRatio, safeRentMax, dtiRatio, loanDetails,
    // Emergency fund
    efTarget, efGap, efProgress, efMonths, monthlyExpenses,
    // Daily limits
    foodBudget, dailyFoodMax, personalMax, entertainmentMax, clothingMax,
    // Goal
    goal, goalMonths, monthlyForGoal, canAffordGoal,
    // Meta
    flags, currency: form.currency,
    calculatedAt: new Date().toISOString(),
  };
}
