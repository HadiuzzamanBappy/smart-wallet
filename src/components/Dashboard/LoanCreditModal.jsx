import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useTransactions } from '../../hooks/useTransactions';
import {
    getAllLoans,
    getAllCredits,
    markLoanAsRepaid,
    markCreditAsCollected,
    adjustLoanCreditAmount,
    resetLoanCreditPayments
} from '../../services/transactionService';
import { formatCurrencyWithUser, formatDate } from '../../utils/helpers';
import Modal from '../UI/base/Modal';
import LoadingSpinner from '../UI/LoadingSpinner';
import Toast from '../UI/base/Toast';
import ConfirmDialog from '../UI/base/ConfirmDialog';
import {
    CreditCard,
    DollarSign,
    Calendar,
    User,
    CheckCircle,
    AlertCircle,
    X,
    Edit3,
    Plus,
    Zap,
    RotateCcw
} from 'lucide-react';
import { APP_EVENTS } from '../../config/constants';

// Base UI Components
import GlassCard from '../UI/base/GlassCard';
import Button from '../UI/base/Button';
import GlassInput from '../UI/base/GlassInput';
import IconBox from '../UI/base/IconBox';
import StatBadge from '../UI/base/StatBadge';

const LoanCreditModal = ({ open, onClose, type = 'loans' }) => {
    const { user, userProfile } = useAuth();
    const { refreshTransactions } = useTransactions();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState({});
    const [resetConfirmItem, setResetConfirmItem] = useState(null);
    const [showPaymentModal, setShowPaymentModal] = useState(null);
    const [showAdjustmentModal, setShowAdjustmentModal] = useState(null);

    // Controlled inputs for sub-dialogs
    const [paymentAmount, setPaymentAmount] = useState('');
    const [paymentDescription, setPaymentDescription] = useState('');
    const [adjustmentAmount, setAdjustmentAmount] = useState('');
    const [adjustmentReason, setAdjustmentReason] = useState('');

    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
    const [showAllItems, setShowAllItems] = useState(false);

    const isLoans = type === 'loans';
    const title = isLoans ? 'All Loans' : 'All Credits';
    const emptyMessage = isLoans ? 'No loans found' : 'No credits found';

    const displayedItems = showAllItems
        ? items.filter(it => (Number(it.remainingAmount) || 0) <= 0)
        : items.filter(it => (Number(it.remainingAmount) || 0) > 0);

    const unpaidCount = items.filter(it => (Number(it.remainingAmount) || 0) > 0).length;
    const paidCount = items.filter(it => (Number(it.remainingAmount) || 0) <= 0).length;

    const totalOriginalAmount = displayedItems.reduce((s, it) => s + (Number(it.amount) || 0), 0);
    const totalRemaining = displayedItems.reduce((s, it) => s + (Number(it.remainingAmount) || 0), 0);

    const loadData = useCallback(async (silent = false) => {
        if (!user?.uid) return;
        if (!silent) setLoading(true);
        try {
            const result = isLoans ? await getAllLoans(user.uid) : await getAllCredits(user.uid);
            if (result.success) setItems(result.data || []);
            else showToast(result.error || 'Failed to load data', 'error');
        } catch (error) {
            console.error('Error loading data:', error);
            showToast('Failed to load data', 'error');
        } finally {
            if (!silent) setLoading(false);
        }
    }, [user?.uid, isLoans]);

    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
    };

    const handleMarkAsPaid = (item) => {
        setShowPaymentModal(item);
        setPaymentAmount(item.remainingAmount?.toString() || '');
        setPaymentDescription('');
    };

    const handleAdjust = (item) => {
        setShowAdjustmentModal(item);
        setAdjustmentAmount('');
        setAdjustmentReason('');
    };

    const handlePaymentSubmit = async () => {
        if (!showPaymentModal || !paymentAmount) return;
        const amount = parseFloat(paymentAmount);
        if (isNaN(amount) || amount <= 0 || amount > showPaymentModal.remainingAmount) {
            showToast('Please enter a valid amount', 'error');
            return;
        }

        const itemId = showPaymentModal.id;
        setProcessing(prev => ({ ...prev, [itemId]: true }));



        try {
            const result = isLoans
                ? await markLoanAsRepaid(user.uid, itemId, amount, paymentDescription)
                : await markCreditAsCollected(user.uid, itemId, amount, paymentDescription);

            if (result.success) {
                showToast(`${formatCurrencyWithUser(amount, userProfile)} recorded successfully`);
                setShowPaymentModal(null);
                window.dispatchEvent(new CustomEvent(APP_EVENTS.TRANSACTION_ADDED, {
                    detail: { type: isLoans ? 'expense' : 'income', amount, isRepayment: true }
                }));
                loadData(true);
                refreshTransactions(true);
            } else {
                showToast(result.error || 'Failed to record', 'error');
                loadData(true);
            }
        } catch {
            showToast('Failed to record', 'error');
            loadData(true);
        } finally {
            setProcessing(prev => ({ ...prev, [itemId]: false }));
        }
    };

    const handleAdjustmentSubmit = async () => {
        if (!showAdjustmentModal || !adjustmentAmount) return;
        const adjustment = parseFloat(adjustmentAmount);
        if (isNaN(adjustment) || adjustment === 0) {
            showToast('Please enter a valid amount', 'error');
            return;
        }

        const itemId = showAdjustmentModal.id;
        const newAmount = (Number(showAdjustmentModal.amount) || 0) + adjustment;
        if (newAmount <= 0) {
            showToast('Adjusted amount must be > 0', 'error');
            return;
        }



        setProcessing(prev => ({ ...prev, [itemId]: true }));

        try {
            const result = await adjustLoanCreditAmount(user.uid, itemId, adjustment, adjustmentReason);
            if (result.success) {
                showToast(`Amount adjusted by ${formatCurrencyWithUser(Math.abs(adjustment), userProfile)}`);
                setShowAdjustmentModal(null);
                window.dispatchEvent(new CustomEvent(APP_EVENTS.TRANSACTION_EDITED, {
                    detail: { transactionId: itemId, adjustment }
                }));
                loadData(true);
                refreshTransactions(true);
            } else {
                showToast(result.error || 'Failed to adjust', 'error');
                loadData(true);
            }
        } catch {
            showToast('Failed to adjust', 'error');
            loadData(true);
        } finally {
            setProcessing(prev => ({ ...prev, [itemId]: false }));
        }
    };

    const handleExpressSettlement = async (item) => {
        const amount = Number(item.remainingAmount || 0);
        if (amount <= 0) return;

        const itemId = item.id;
        setProcessing(prev => ({ ...prev, [itemId]: true }));

        try {
            const result = isLoans
                ? await markLoanAsRepaid(user.uid, itemId, amount, 'Full Settlement (Express)')
                : await markCreditAsCollected(user.uid, itemId, amount, 'Full Settlement (Express)');

            if (result.success) {
                showToast(`Full ${isLoans ? 'repayment' : 'collection'} of ${formatCurrencyWithUser(amount, userProfile)} recorded`);
                window.dispatchEvent(new CustomEvent(APP_EVENTS.TRANSACTION_ADDED, {
                    detail: { type: isLoans ? 'expense' : 'income', amount, isRepayment: true }
                }));
                loadData(true);
                refreshTransactions(true);
            } else {
                showToast(result.error || 'Failed to record', 'error');
                loadData(true);
            }
        } catch {
            showToast('Failed to record', 'error');
            loadData(true);
        } finally {
            setProcessing(prev => ({ ...prev, [itemId]: false }));
        }
    };

    const handleResetTrigger = (item) => {
        setResetConfirmItem(item);
    };

    const confirmReset = async () => {
        if (!resetConfirmItem) return;

        const item = resetConfirmItem;
        const itemId = item.id;

        setResetConfirmItem(null); // Close dialog
        setProcessing(prev => ({ ...prev, [itemId]: true }));

        try {
            const result = await resetLoanCreditPayments(user.uid, itemId);
            if (result.success) {
                showToast('Payment history reset successfully');
                loadData(true);
                refreshTransactions(true);
            } else {
                showToast(result.error || 'Failed to reset', 'error');
                loadData(true);
            }
        } catch {
            showToast('Failed to reset', 'error');
            loadData(true);
        } finally {
            setProcessing(prev => ({ ...prev, [itemId]: false }));
        }
    };

    useEffect(() => {
        if (open && user?.uid) loadData();
    }, [open, user?.uid, type, loadData]);

    return (
        <>
            <Modal isOpen={open} onClose={onClose} title={title} size="lg" disableScroll={true}>
                <div className="flex flex-col h-full p-4 sm:p-5">
                    {/* Summary Header */}
                    <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <GlassCard padding="px-4 py-2" border="border-white/5" bgColor="bg-white/5">
                                <div className="text-[9px] font-black uppercase tracking-widest text-gray-500 mb-0.5 text-center">Total</div>
                                <div className="text-sm font-black text-gray-900 dark:text-white">{formatCurrencyWithUser(totalOriginalAmount, userProfile)}</div>
                            </GlassCard>
                            <GlassCard padding="px-4 py-2" border="border-orange-500/10" bgColor="bg-orange-500/10">
                                <div className="text-[9px] font-black uppercase tracking-widest text-orange-500 mb-0.5 text-center">Due</div>
                                <div className="text-sm font-black text-orange-400">{formatCurrencyWithUser(totalRemaining, userProfile)}</div>
                            </GlassCard>
                        </div>

                        <div className="flex items-center gap-1.5 p-1 bg-white/5 border border-white/5 rounded-2xl w-fit">
                            <Button
                                variant={!showAllItems ? 'filled' : 'ghost'}
                                color="teal"
                                size="sm"
                                onClick={() => setShowAllItems(false)}
                                className="!rounded-xl"
                            >
                                <User className="w-3 h-3" />
                                <span>Unpaid</span>
                                <StatBadge value={unpaidCount} variant={!showAllItems ? 'teal' : 'gray'} className="ml-1" />
                            </Button>
                            <Button
                                variant={showAllItems ? 'filled' : 'ghost'}
                                color="teal"
                                size="sm"
                                onClick={() => setShowAllItems(true)}
                                className="!rounded-xl"
                            >
                                <CheckCircle className="w-3 h-3" />
                                <span>Paid</span>
                                <StatBadge value={paidCount} variant={showAllItems ? 'teal' : 'gray'} className="ml-1" />
                            </Button>
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex-1 flex items-center justify-center"><LoadingSpinner /></div>
                    ) : displayedItems.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center opacity-40 border-2 border-dashed border-white/5 rounded-3xl p-12">
                            <AlertCircle className="w-12 h-12 mb-4" />
                            <p className="text-xs font-black uppercase tracking-widest">{showAllItems ? emptyMessage : `No active ${isLoans ? 'loans' : 'credits'}`}</p>
                        </div>
                    ) : (
                        <div className="flex-1 overflow-y-auto pr-1 space-y-4 scroll-smooth">
                            {displayedItems.map((item) => (
                                <GlassCard key={item.id} hover className="relative" padding="p-4">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <IconBox
                                                icon={isLoans ? CreditCard : DollarSign}
                                                colorClass={isLoans ? 'text-red-400' : 'text-emerald-400'}
                                                bgClass={isLoans ? 'bg-red-400/10' : 'bg-emerald-400/10'}
                                            />
                                            <div className="min-w-0">
                                                <h4 className="text-sm font-black text-gray-900 dark:text-white truncate">{item.description}</h4>
                                                <div className="flex items-center gap-3 mt-0.5">
                                                    <StatBadge label="DATE" value={formatDate(item.date)} />
                                                    {item.category && <StatBadge label="CAT" value={item.category} />}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            {item.paidAmount > 0 && (
                                                <Button
                                                    variant="icon"
                                                    size="sm"
                                                    color="gray"
                                                    onClick={() => handleResetTrigger(item)}
                                                    loading={processing[item.id]}
                                                    title="Reset all payments"
                                                    icon={RotateCcw}
                                                />
                                            )}
                                            {item.remainingAmount > 0 && (
                                                <Button
                                                    variant="icon"
                                                    size="sm"
                                                    onClick={() => handleAdjust(item)}
                                                    loading={processing[item.id]}
                                                    title="Adjust amount"
                                                    icon={Edit3}
                                                />
                                            )}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 mb-4">
                                        <div className="space-y-1">
                                            <div className="text-[9px] font-black uppercase tracking-widest text-gray-500">Original</div>
                                            <div className="text-sm font-black text-gray-400">{formatCurrencyWithUser(item.amount, userProfile)}</div>
                                        </div>
                                        <div className="space-y-1">
                                            <div className="text-[9px] font-black uppercase tracking-widest text-orange-500">Remaining</div>
                                            <div className="text-sm font-black text-orange-400">{formatCurrencyWithUser(item.remainingAmount, userProfile)}</div>
                                        </div>
                                    </div>

                                    {item.adjustmentHistory?.length > 0 && (
                                        <div className="mb-4 p-3 bg-purple-500/5 rounded-xl border border-purple-500/10">
                                            <div className="text-[9px] font-black uppercase tracking-widest text-purple-400 mb-2">Adjustment History</div>
                                            <div className="space-y-1.5">
                                                {item.adjustmentHistory.slice(-2).map((adj, idx) => (
                                                    <div key={idx} className="flex justify-between items-center text-[10px]">
                                                        <span className="text-gray-500 truncate mr-2">{adj.reason || 'Correction'}</span>
                                                        <span className={`font-black ${adj.amount > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
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
                                            color={isLoans ? 'red' : 'emerald'}
                                            variant={item.remainingAmount <= 0 ? 'soft' : 'filled'}
                                            disabled={item.remainingAmount <= 0 || processing[item.id]}
                                            loading={processing[item.id]}
                                            onClick={() => handleMarkAsPaid(item)}
                                            icon={item.remainingAmount <= 0 ? CheckCircle : Plus}
                                            className="flex-1"
                                        >
                                            {item.remainingAmount <= 0 ? `Fully ${isLoans ? 'Repaid' : 'Collected'}` : `Record ${isLoans ? 'Repayment' : 'Collection'}`}
                                        </Button>
                                        {item.remainingAmount > 0 && (
                                            <Button
                                                variant="icon"
                                                color="emerald"
                                                onClick={() => handleExpressSettlement(item)}
                                                loading={processing[item.id]}
                                                title="Express Settle All"
                                                icon={Zap}
                                            />
                                        )}
                                    </div>
                                </GlassCard>
                            ))}
                        </div>
                    )}
                </div>
            </Modal>

            {/* Inlined Sub-Dialogs for Recording Payments/Adjustments (To prevent unmount flicker) */}
            {(showPaymentModal || showAdjustmentModal) && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-[70] animate-in fade-in duration-300">
                    <GlassCard className="w-full max-w-md shadow-2xl overflow-visible" padding="p-6">
                        {showPaymentModal ? (
                            <>
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-sm font-black uppercase tracking-widest text-white">
                                        {isLoans ? 'Record Repayment' : 'Record Collection'}
                                    </h3>
                                    <Button variant="icon" size="sm" onClick={() => setShowPaymentModal(null)}><X /></Button>
                                </div>
                                <div className="space-y-5">
                                    <div className="flex gap-4">
                                        <div className="flex-1">
                                            <div className="text-[9px] font-black uppercase tracking-widest text-gray-500 mb-1">Total</div>
                                            <div className="text-xs font-black text-white opacity-60">{formatCurrencyWithUser(showPaymentModal.amount, userProfile)}</div>
                                        </div>
                                        <div className="flex-1">
                                            <div className="text-[9px] font-black uppercase tracking-widest text-orange-500 mb-1">Due</div>
                                            <div className="text-sm font-black text-orange-400">{formatCurrencyWithUser(showPaymentModal.remainingAmount, userProfile)}</div>
                                        </div>
                                    </div>
                                    <GlassInput
                                        label={`${isLoans ? 'Repayment' : 'Collection'} Amount`}
                                        type="number"
                                        placeholder="0.00"
                                        value={paymentAmount}
                                        onChange={(e) => setPaymentAmount(e.target.value)}
                                        icon={DollarSign}
                                    />
                                    <GlassInput
                                        label="Notes (Optional)"
                                        placeholder="Any details?"
                                        value={paymentDescription}
                                        onChange={(e) => setPaymentDescription(e.target.value)}
                                    />
                                    <div className="flex gap-3 pt-4">
                                        <Button fullWidth variant="soft" color="gray" onClick={() => setShowPaymentModal(null)}>Cancel</Button>
                                        <Button fullWidth color="emerald" onClick={handlePaymentSubmit} loading={processing[showPaymentModal.id]}>Record</Button>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-sm font-black uppercase tracking-widest text-white">Adjust {isLoans ? 'Loan' : 'Credit'}</h3>
                                    <Button variant="icon" size="sm" onClick={() => setShowAdjustmentModal(null)}><X /></Button>
                                </div>
                                <div className="space-y-5">
                                    <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                                        <div className="text-[9px] font-black uppercase tracking-widest text-gray-500 mb-1">Current Balance</div>
                                        <div className="text-xl font-black text-white">{formatCurrencyWithUser(showAdjustmentModal.amount, userProfile)}</div>
                                    </div>
                                    <GlassInput
                                        label="Adjustment Amount"
                                        type="number"
                                        placeholder="+/- 0.00"
                                        helperText="+ for increase, - for decrease"
                                        value={adjustmentAmount}
                                        onChange={(e) => setAdjustmentAmount(e.target.value)}
                                    />
                                    <GlassInput
                                        label="Reason"
                                        placeholder="Why this adjustment?"
                                        value={adjustmentReason}
                                        onChange={(e) => setAdjustmentReason(e.target.value)}
                                    />
                                    <div className="flex gap-3 pt-4">
                                        <Button fullWidth variant="soft" color="gray" onClick={() => setShowAdjustmentModal(null)}>Cancel</Button>
                                        <Button fullWidth color="purple" onClick={handleAdjustmentSubmit} loading={processing[showAdjustmentModal.id]}>Apply</Button>
                                    </div>
                                </div>
                            </>
                        )}
                    </GlassCard>
                </div>
            )}

            <Toast
                show={toast.show}
                message={toast.message}
                type={toast.type}
                onClose={() => setToast({ show: false, message: '', type: 'success' })}
            />
            <ConfirmDialog
                isOpen={!!resetConfirmItem}
                onClose={() => setResetConfirmItem(null)}
                onConfirm={confirmReset}
                title={`Reset ${isLoans ? 'Loan' : 'Credit'}`}
                message={`Are you sure you want to reset all payments for "${resetConfirmItem?.description}"? This will delete all repayment history and restore the full balance.`}
                confirmText="Reset All"
                type="danger"
            />
        </>
    );
};

export default LoanCreditModal;