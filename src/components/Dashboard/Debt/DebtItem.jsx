import React from 'react';
import { CreditCard, DollarSign, Calendar, Edit3, Zap, RotateCcw, CheckCircle, Plus } from 'lucide-react';
import { formatDate, formatCurrencyWithUser } from '../../../utils/helpers';
import { THEME } from '../../../config/theme';
import Button from '../../UI/base/Button';

const DebtItem = ({
    item,
    type,
    userProfile,
    onMarkAsPaid,
    onAdjust,
    onReset,
    onExpressSettle,
    isProcessing
}) => {
    const isLoans = type === 'loans';
    const hasPaidAmount = (Number(item.paidAmount) || 0) > 0;
    const hasRemainingAmount = (Number(item.remainingAmount) || 0) > 0;

    return (
        <div className="relative p-5 rounded-2xl bg-white/50 dark:bg-white/[0.01] border border-gray-100/50 dark:border-white/5 hover:bg-white dark:hover:bg-white/[0.03] transition-all group">
            <div className="flex items-start justify-between mb-5">
                <div className="flex items-center gap-4 min-w-0">
                    <div className={`w-11 h-11 flex items-center justify-center rounded-2xl border ${isLoans ? 'bg-rose-500/5 border-rose-500/10 text-rose-600 dark:text-rose-400' : 'bg-emerald-500/5 border-emerald-500/10 text-emerald-600 dark:text-emerald-400'}`}>
                        {isLoans ? <CreditCard className="w-5 h-5" /> : <DollarSign className="w-5 h-5" />}
                    </div>
                    <div className="min-w-0">
                        <h4 className="text-[15px] font-bold text-gray-900 dark:text-white truncate leading-tight tracking-tight">{item.description}</h4>
                        <div className="flex items-center gap-4 mt-2">
                             <div className="flex items-center gap-1.5">
                                <Calendar className="w-3 h-3 text-gray-400" />
                                <span className={THEME.typography.label}>{formatDate(item.date)}</span>
                            </div>
                            {item.category && (
                                 <div className="flex items-center gap-1.5">
                                    <div className="w-1.5 h-1.5 rounded-full bg-primary-500" />
                                    <span className={THEME.typography.label}>{item.category}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    {hasPaidAmount && (
                        <button
                            onClick={() => onReset(item)}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-xl text-gray-400 hover:text-gray-900 dark:hover:text-white transition-all border border-transparent hover:border-gray-200/50 dark:hover:border-white/10"
                            title="Reset all payments"
                        >
                            <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                    )}
                    {hasRemainingAmount && (
                        <button
                            onClick={() => onAdjust(item)}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-xl text-gray-400 hover:text-gray-900 dark:hover:text-white transition-all border border-transparent hover:border-gray-200/50 dark:hover:border-white/10"
                            title="Adjust amount"
                        >
                            <Edit3 className="w-3.5 h-3.5" />
                        </button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-5 mb-5 bg-gray-50/50 dark:bg-white/[0.02] p-4 rounded-xl border border-gray-100 dark:border-white/5">
                <div className="space-y-1">
                    <div className={THEME.typography.label}>Principal</div>
                    <div className="text-sm font-bold text-gray-500 dark:text-gray-400 tracking-tight">{formatCurrencyWithUser(item.amount, userProfile)}</div>
                </div>
                <div className="space-y-1">
                    <div className={`${THEME.typography.label} text-orange-500`}>Remaining</div>
                    <div className="text-sm font-bold text-orange-600 dark:text-orange-400 tracking-tight">{formatCurrencyWithUser(item.remainingAmount, userProfile)}</div>
                </div>
            </div>

            {item.adjustmentHistory?.length > 0 && (
                <div className="mb-5 p-4 bg-indigo-500/[0.03] dark:bg-indigo-500/[0.01] rounded-xl border border-indigo-500/10">
                    <div className={`${THEME.typography.label} text-indigo-500 mb-3`}>Adjustment History</div>
                    <div className="space-y-2">
                        {item.adjustmentHistory.slice(-2).map((adj, idx) => (
                            <div key={idx} className="flex justify-between items-center text-[10px]">
                                <span className="text-gray-500 dark:text-gray-400 truncate mr-3 font-bold opacity-70">{adj.reason || 'Correction'}</span>
                                <span className={`font-bold ${adj.amount > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                                    {adj.amount > 0 ? '+' : ''}{formatCurrencyWithUser(adj.amount, userProfile)}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="flex gap-2.5">
                <Button
                    fullWidth
                    color={isLoans ? 'red' : 'emerald'}
                    variant={!hasRemainingAmount ? 'soft' : 'filled'}
                    disabled={!hasRemainingAmount || isProcessing}
                    loading={isProcessing}
                    onClick={() => onMarkAsPaid(item)}
                    icon={!hasRemainingAmount ? CheckCircle : Plus}
                    className="flex-1 h-11"
                >
                    <span className="text-[10px] font-black uppercase tracking-widest">
                        {!hasRemainingAmount ? `Fully ${isLoans ? 'Repaid' : 'Collected'}` : `Record ${isLoans ? 'Repayment' : 'Collection'}`}
                    </span>
                </Button>
                {hasRemainingAmount && (
                    <Button
                        variant="icon"
                        color="emerald"
                        onClick={() => onExpressSettle(item)}
                        loading={isProcessing}
                        title="Express Settle All"
                        icon={Zap}
                        className="w-11 h-11 flex-shrink-0"
                    />
                )}
            </div>
        </div>
    );
};

export default DebtItem;
