import React from 'react';
import { CreditCard, DollarSign, Calendar, Edit3, Zap, RotateCcw, CheckCircle, Plus } from 'lucide-react';
import { formatDate, formatCurrencyWithUser } from '../../../utils/helpers';
import Button from '../../UI/base/Button';
import IconBox from '../../UI/base/IconBox';
import Badge from '../../UI/base/Badge';

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
        <div className="relative p-4 rounded-3xl bg-surface-card dark:bg-surface-card-dark border border-paper-100 dark:border-white/5 hover:border-primary-500/30 transition-all group overflow-hidden">
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3 min-w-0">
                    <IconBox
                        icon={isLoans ? CreditCard : DollarSign}
                        variant="soft"
                        color={isLoans ? 'error' : 'success'}
                        size="sm"
                    />
                    <div className="min-w-0">
                        <h4 className="text-label font-bold text-ink-900 dark:text-paper-50 truncate leading-tight tracking-tight">{item.description}</h4>
                        <div className="flex items-center gap-3 mt-1.5">
                            <div className="flex items-center gap-1">
                                <Calendar className="w-3 h-3 text-ink-400 dark:text-paper-700 opacity-40" />
                                <span className="text-overline text-ink-400 dark:text-paper-700 font-black leading-none">{formatDate(item.date)}</span>
                            </div>
                            {item.category && (
                                <div className="flex items-center gap-1.5">
                                    <div className="w-1 h-1 rounded-full bg-primary-500" />
                                    <span className="text-overline text-ink-400 dark:text-paper-700 font-black leading-none">{item.category}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    {hasPaidAmount && (
                        <button
                            onClick={() => onReset(item)}
                            className="p-1.5 bg-paper-100/30 dark:bg-white/5 hover:bg-paper-100 dark:hover:bg-white/10 rounded-xl text-ink-400 hover:text-ink-900 dark:hover:text-white transition-all border border-paper-100 dark:border-white/10"
                            title="Reset all payments"
                        >
                            <RotateCcw className="w-3 h-3" />
                        </button>
                    )}
                    {hasRemainingAmount && (
                        <button
                            onClick={() => onAdjust(item)}
                            className="p-1.5 bg-paper-100/30 dark:bg-white/5 hover:bg-warning-500/10 rounded-xl text-warning-500 hover:text-warning-600 dark:hover:text-warning-400 transition-all border border-paper-100 dark:border-white/10"
                            title="Adjust amount"
                        >
                            <Edit3 className="w-3 h-3" />
                        </button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4 bg-paper-100/30 dark:bg-white/[0.02] p-3 rounded-2xl border border-paper-100 dark:border-white/5">
                <div className="space-y-1">
                    <div className="text-overline text-ink-400 dark:text-paper-700 font-black leading-none">Principal</div>
                    <div className="text-label font-bold text-ink-900 dark:text-paper-50 tracking-tight leading-none opacity-40">{formatCurrencyWithUser(item.amount, userProfile)}</div>
                </div>
                <div className="space-y-1">
                    <div className="text-overline text-warning-500 font-black leading-none">Remaining</div>
                    <div className="text-h5 font-black text-warning-600 dark:text-warning-400 tracking-tighter leading-none">{formatCurrencyWithUser(item.remainingAmount, userProfile)}</div>
                </div>
            </div>

            {item.adjustmentHistory?.length > 0 && (
                <div className="mb-4 p-3 bg-primary-500/[0.03] dark:bg-primary-500/[0.01] rounded-2xl border border-primary-500/10">
                    <div className="text-overline text-primary-600 dark:text-primary-400 font-black mb-2 opacity-60 leading-none">Adjustment History</div>
                    <div className="space-y-1.5">
                        {item.adjustmentHistory.slice(-2).map((adj, idx) => (
                            <div key={idx} className="flex justify-between items-center text-[10px]">
                                <span className="text-ink-400 dark:text-paper-700 truncate mr-3 font-bold opacity-70 leading-none">{adj.reason || 'Correction'}</span>
                                <span className={`font-black tracking-widest leading-none ${adj.amount > 0 ? 'text-primary-600 dark:text-primary-400' : 'text-error-600 dark:text-error-400'}`}>
                                    {adj.amount > 0 ? '+' : ''}{formatCurrencyWithUser(adj.amount, userProfile)}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="flex gap-2">
                <Button
                    fullWidth
                    color={isLoans ? 'error' : 'primary'}
                    variant={!hasRemainingAmount ? 'soft' : 'filled'}
                    disabled={!hasRemainingAmount || isProcessing}
                    loading={isProcessing}
                    onClick={() => onMarkAsPaid(item)}
                    icon={!hasRemainingAmount ? CheckCircle : Plus}
                    className="flex-1 h-10"
                >
                    <span className="text-overline font-black tracking-widest">
                        {!hasRemainingAmount ? `Settled` : `Record ${isLoans ? 'Repayment' : 'Collection'}`}
                    </span>
                </Button>
                {hasRemainingAmount && (
                    <Button
                        variant="soft"
                        color="primary"
                        onClick={() => onExpressSettle(item)}
                        loading={isProcessing}
                        title="Express Settle All"
                        icon={Zap}
                        className="w-10 h-10 flex-shrink-0 !p-0"
                    />
                )}
            </div>
        </div>
    );
};

export default DebtItem;
