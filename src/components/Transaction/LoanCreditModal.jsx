import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useTransactions } from '../../hooks/useTransactions';
import {
    getAllLoans,
    getAllCredits,
    markLoanAsRepaid,
    markCreditAsCollected,
    adjustLoanCreditAmount
} from '../../services/transactionService';
import { formatCurrencyWithUser, formatDate } from '../../utils/helpers';
import Modal from '../UI/Modal';
import LoadingSpinner from '../UI/LoadingSpinner';
import Toast from '../UI/Toast';
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
    Loader2
} from 'lucide-react';
import { APP_EVENTS } from '../../config/constants';

const LoanCreditModal = ({ open, onClose, type = 'loans' }) => {
    const { user, userProfile } = useAuth();
    const { refreshTransactions } = useTransactions();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState({});
    const [showPaymentModal, setShowPaymentModal] = useState(null);
    const [showAdjustmentModal, setShowAdjustmentModal] = useState(null);
    // useRef to keep the input uncontrolled so cursor doesn't jump on re-renders
    const paymentAmountRef = useRef(null);
    const adjustmentAmountRef = useRef(null);
    const [paymentInputHasValue, setPaymentInputHasValue] = useState(false);
    const [adjustmentInputHasValue, setAdjustmentInputHasValue] = useState(false);
    const [paymentDescription, setPaymentDescription] = useState('');
    const [adjustmentReason, setAdjustmentReason] = useState('');
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
    const [showAllItems, setShowAllItems] = useState(false);

    const isLoans = type === 'loans';
    const title = isLoans ? 'All Loans' : 'All Credits';
    const emptyMessage = isLoans
        ? 'No loans found'
        : 'No credits found';

    // By default show only items that are not fully paid/collected. User can toggle to show fully paid only.
    const displayedItems = showAllItems
        ? items.filter(it => (Number(it.remainingAmount) || 0) <= 0)  // Show only fully paid/collected
        : items.filter(it => (Number(it.remainingAmount) || 0) > 0);   // Show only unpaid

    // whether any item is fully paid/collected (remainingAmount <= 0)
    const hasFullyPaid = items.some(it => (Number(it.remainingAmount) || 0) <= 0);

    // counts for badge
    const unpaidCount = items.filter(it => (Number(it.remainingAmount) || 0) > 0).length;
    const paidCount = items.filter(it => (Number(it.remainingAmount) || 0) <= 0).length;

    // totals for header summary (based on displayed items)
    const totalOriginalAmount = displayedItems.reduce((s, it) => s + (Number(it.amount) || 0), 0);
    const totalRemaining = displayedItems.reduce((s, it) => s + (Number(it.remainingAmount) || 0), 0);

    const loadData = React.useCallback(async () => {
        if (!user?.uid) return;

        setLoading(true);
        try {
            const result = isLoans
                ? await getAllLoans(user.uid)
                : await getAllCredits(user.uid);

            if (result.success) {
                setItems(result.data || []);
            } else {
                showToast(result.error || 'Failed to load data', 'error');
            }
        } catch (error) {
            console.error('Error loading data:', error);
            showToast('Failed to load data', 'error');
        } finally {
            setLoading(false);
        }
    }, [user?.uid, isLoans]);

    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
    };

    const handleMarkAsPaid = (item) => {
        setShowPaymentModal(item);
        // we set the input value in an effect when the modal opens (ref will be available then)
        setPaymentDescription('');
    };

    const handleAdjust = (item) => {
        setShowAdjustmentModal(item);
        setAdjustmentReason('');
    };

    // When payment modal opens, populate the uncontrolled input with remaining amount
    useEffect(() => {
        if (showPaymentModal && paymentAmountRef.current) {
            paymentAmountRef.current.value = showPaymentModal.remainingAmount?.toString() || '';
            setPaymentInputHasValue(Boolean(String(paymentAmountRef.current.value).trim()));
        }
    }, [showPaymentModal]);

    // When adjustment modal opens, clear the input
    useEffect(() => {
        if (showAdjustmentModal && adjustmentAmountRef.current) {
            adjustmentAmountRef.current.value = '';
            setAdjustmentInputHasValue(false);
        }
    }, [showAdjustmentModal]);

    const handlePaymentSubmit = async () => {
        if (!showPaymentModal) return;

        const raw = paymentAmountRef.current?.value;
        if (!raw) {
            showToast('Please enter a valid amount', 'error');
            return;
        }

        const amount = parseFloat(raw);
        if (isNaN(amount) || amount <= 0) {
            showToast('Please enter a valid amount', 'error');
            return;
        }

        if (amount > showPaymentModal.remainingAmount) {
            showToast('Amount cannot exceed remaining amount', 'error');
            return;
        }

        const itemId = showPaymentModal.id;
        setProcessing(prev => ({ ...prev, [itemId]: true }));

        try {
            const result = isLoans
                ? await markLoanAsRepaid(user.uid, itemId, amount, paymentDescription)
                : await markCreditAsCollected(user.uid, itemId, amount, paymentDescription);

            if (result.success) {
                const actionText = isLoans ? 'repayment' : 'collection';
                showToast(`${formatCurrencyWithUser(amount, userProfile)} ${actionText} recorded successfully`);
                setShowPaymentModal(null);
                if (paymentAmountRef.current) paymentAmountRef.current.value = '';
                setPaymentDescription('');

                // Dispatch transaction added event to notify other components
                window.dispatchEvent(new CustomEvent(APP_EVENTS.TRANSACTION_ADDED, {
                    detail: {
                        transactionId: result.repaymentTransactionId || result.collectionTransactionId,
                        type: isLoans ? 'expense' : 'income',
                        amount: amount,
                        isRepayment: true
                    }
                }));

                // Refresh data and transactions
                await Promise.all([loadData(), refreshTransactions()]);
            } else {
                showToast(result.error || `Failed to record ${isLoans ? 'repayment' : 'collection'}`, 'error');
            }
        } catch (error) {
            console.error('Error processing payment:', error);
            showToast(`Failed to record ${isLoans ? 'repayment' : 'collection'}`, 'error');
        } finally {
            setProcessing(prev => ({ ...prev, [itemId]: false }));
        }
    };

    const handleAdjustmentSubmit = async () => {
        if (!showAdjustmentModal) return;

        const raw = adjustmentAmountRef.current?.value;
        if (!raw || raw.trim() === '') {
            showToast('Please enter an adjustment amount', 'error');
            return;
        }

        const adjustment = parseFloat(raw);
        if (isNaN(adjustment) || adjustment === 0) {
            showToast('Please enter a valid non-zero amount', 'error');
            return;
        }

        const itemId = showAdjustmentModal.id;
        const currentAmount = Number(showAdjustmentModal.amount || 0);
        const newAmount = currentAmount + adjustment;

        if (newAmount <= 0) {
            showToast('Adjusted amount must be greater than zero', 'error');
            return;
        }

        setProcessing(prev => ({ ...prev, [itemId]: true }));

        try {
            const result = await adjustLoanCreditAmount(user.uid, itemId, adjustment, adjustmentReason);

            if (result.success) {
                const actionText = adjustment > 0 ? 'increased' : 'decreased';
                showToast(`Amount ${actionText} by ${formatCurrencyWithUser(Math.abs(adjustment), userProfile)}`);
                setShowAdjustmentModal(null);
                if (adjustmentAmountRef.current) adjustmentAmountRef.current.value = '';
                setAdjustmentReason('');

                // Dispatch transaction edited event to notify other components (summary, analytics, etc.)
                window.dispatchEvent(new CustomEvent(APP_EVENTS.TRANSACTION_EDITED, {
                    detail: {
                        transactionId: itemId,
                        type: isLoans ? 'loan' : 'credit',
                        adjustment: adjustment
                    }
                }));

                // Refresh data and transactions to update summary
                await Promise.all([loadData(), refreshTransactions()]);
            } else {
                showToast(result.error || 'Failed to adjust amount', 'error');
            }
        } catch (error) {
            console.error('Error adjusting amount:', error);
            showToast('Failed to adjust amount', 'error');
        } finally {
            setProcessing(prev => ({ ...prev, [itemId]: false }));
        }
    };

    useEffect(() => {
        if (open && user?.uid) {
            loadData();
        }
    }, [open, user?.uid, type, loadData]);

    const PaymentModal = () => {
        if (!showPaymentModal) return null;

        return (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[60] animate-in fade-in">
                <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 w-full max-w-md shadow-2xl border border-white/10">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-sm font-black uppercase tracking-widest text-gray-900 dark:text-white">
                            {isLoans ? 'Record Repayment' : 'Record Collection'}
                        </h3>
                        <button
                            onClick={() => setShowPaymentModal(null)}
                            className="p-2 hover:bg-white/10 rounded-xl transition-colors"
                        >
                            <X className="w-5 h-5 text-gray-500" />
                        </button>
                    </div>

                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-white/5 p-3 rounded-2xl border border-white/5">
                                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">
                                    Original
                                </label>
                                <div className="text-sm font-black text-gray-700 dark:text-gray-300">
                                    {formatCurrencyWithUser(showPaymentModal.amount, userProfile)}
                                </div>
                            </div>

                            <div className="bg-orange-500/5 p-3 rounded-2xl border border-orange-500/10">
                                <label className="block text-[10px] font-black uppercase tracking-widest text-orange-500 mb-1">
                                    Remaining
                                </label>
                                <div className="text-sm font-black text-orange-500">
                                    {formatCurrencyWithUser(showPaymentModal.remainingAmount, userProfile)}
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">
                                {isLoans ? 'Repayment' : 'Collection'} Amount
                            </label>
                            <input
                                ref={paymentAmountRef}
                                type="number"
                                className="w-full h-12 bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-white/10 rounded-2xl px-4 text-sm outline-none transition-all focus:ring-2 focus:ring-teal-500/50"
                                placeholder="0.00"
                                defaultValue={showPaymentModal.remainingAmount}
                                max={showPaymentModal.remainingAmount}
                                step="0.01"
                                onInput={(e) => setPaymentInputHasValue(String(e.target.value).trim() !== '')}
                            />
                        </div>

                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">
                                Notes (Optional)
                            </label>
                            <input
                                type="text"
                                value={paymentDescription}
                                onChange={(e) => setPaymentDescription(e.target.value)}
                                className="w-full h-12 bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-white/10 rounded-2xl px-4 text-sm outline-none transition-all focus:ring-2 focus:ring-teal-500/50"
                                placeholder="Any additional details?"
                            />
                        </div>

                        <div className="flex gap-3 pt-4">
                            <button
                                onClick={() => setShowPaymentModal(null)}
                                className="flex-1 h-12 bg-white/5 hover:bg-white/10 text-gray-400 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handlePaymentSubmit}
                                disabled={!paymentInputHasValue || processing[showPaymentModal.id]}
                                className="flex-[2] h-12 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-[0.98]"
                            >
                                {processing[showPaymentModal.id] ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                                Record {isLoans ? 'Repayment' : 'Collection'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const AdjustmentModal = () => {
        if (!showAdjustmentModal) return null;

        return (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[60] animate-in fade-in">
                <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 w-full max-w-md shadow-2xl border border-white/10">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-sm font-black uppercase tracking-widest text-gray-900 dark:text-white">
                            Adjust {isLoans ? 'Loan' : 'Credit'}
                        </h3>
                        <button
                            onClick={() => setShowAdjustmentModal(null)}
                            className="p-2 hover:bg-white/10 rounded-xl transition-colors"
                        >
                            <X className="w-5 h-5 text-gray-500" />
                        </button>
                    </div>

                    <div className="space-y-4">
                        <div className="bg-white/5 p-3 rounded-2xl border border-white/5 mb-4">
                            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">
                                Current Balance
                            </label>
                            <div className="text-lg font-black text-gray-700 dark:text-gray-300">
                                {formatCurrencyWithUser(showAdjustmentModal.amount, userProfile)}
                            </div>
                        </div>

                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">
                                Adjustment Amount
                            </label>
                            <input
                                ref={adjustmentAmountRef}
                                type="number"
                                className="w-full h-12 bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-white/10 rounded-2xl px-4 text-sm outline-none transition-all focus:ring-2 focus:ring-teal-500/50"
                                placeholder="+/- 0.00"
                                step="0.01"
                                onInput={(e) => setAdjustmentInputHasValue(String(e.target.value).trim() !== '')}
                            />
                            <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mt-2 px-1">
                                + for increase, - for decrease
                            </p>
                        </div>

                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">
                                Reason
                            </label>
                            <input
                                type="text"
                                value={adjustmentReason}
                                onChange={(e) => setAdjustmentReason(e.target.value)}
                                className="w-full h-12 bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-white/10 rounded-2xl px-4 text-sm outline-none transition-all focus:ring-2 focus:ring-teal-500/50"
                                placeholder="Why this adjustment?"
                            />
                        </div>

                        <div className="flex gap-3 pt-4">
                            <button
                                onClick={() => setShowAdjustmentModal(null)}
                                className="flex-1 h-12 bg-white/5 hover:bg-white/10 text-gray-400 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAdjustmentSubmit}
                                disabled={!adjustmentInputHasValue || processing[showAdjustmentModal.id]}
                                className="flex-[2] h-12 bg-purple-500 hover:bg-purple-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20 active:scale-[0.98]"
                            >
                                {processing[showAdjustmentModal.id] ? <Loader2 className="w-4 h-4 animate-spin" /> : <Edit3 className="w-4 h-4" />}
                                Apply Adjustment
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <>
            <Modal isOpen={open} onClose={onClose} title={title} size="lg" disableScroll={true}>
                <div className="flex flex-col h-full p-4 sm:p-5">
                    {/* Header totals summary with toggle */}
                    <div className="mb-4 flex-shrink-0">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="flex items-center gap-3 flex-wrap">
                            <div className="bg-white/5 px-3 py-2 rounded-xl border border-white/10">
                                <div className="text-[9px] font-black uppercase tracking-widest text-gray-500 mb-0.5">Total</div>
                                <div className="text-sm font-black text-gray-900 dark:text-white">{formatCurrencyWithUser(totalOriginalAmount, userProfile)}</div>
                            </div>
                            <div className="bg-orange-500/10 px-3 py-2 rounded-xl border border-orange-500/20">
                                <div className="text-[9px] font-black uppercase tracking-widest text-orange-500 mb-0.5">Due</div>
                                <div className="text-sm font-black text-orange-600 dark:text-orange-400">{formatCurrencyWithUser(totalRemaining, userProfile)}</div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            {hasFullyPaid ? (
                                <div className="inline-flex items-center rounded-2xl bg-gray-100 dark:bg-white/[0.03] border border-gray-200 dark:border-white/10 p-1">
                                    <button
                                        type="button"
                                        onClick={() => setShowAllItems(false)}
                                        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${!showAllItems ? 'bg-white dark:bg-gray-700 text-teal-500 shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                                    >
                                        <User className="w-3 h-3" />
                                        <span>Unpaid</span>
                                        <span className={`ml-1 px-1.5 py-0.5 rounded-lg text-[9px] ${!showAllItems ? 'bg-teal-500/10' : 'bg-gray-500/10'}`}>{unpaidCount}</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setShowAllItems(true)}
                                        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${showAllItems ? 'bg-white dark:bg-gray-700 text-teal-500 shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                                    >
                                        <CheckCircle className="w-3 h-3" />
                                        <span>Paid</span>
                                        <span className={`ml-1 px-1.5 py-0.5 rounded-lg text-[9px] ${showAllItems ? 'bg-teal-500/10' : 'bg-gray-500/10'}`}>{paidCount}</span>
                                    </button>
                                </div>
                            ) : (
                                <span className="px-3 py-1.5 rounded-xl bg-gray-100 dark:bg-white/[0.03] border border-gray-200 dark:border-white/10 text-[10px] font-black uppercase tracking-widest text-gray-500">{unpaidCount} ACTIVE</span>
                            )}
                        </div>
                    </div>
                </div>
                {loading ? (
                    <div className="flex items-center justify-center py-8">
                        <LoadingSpinner />
                    </div>
                ) : displayedItems.length === 0 ? (
                    <div className="text-center py-12 text-gray-500 bg-white/[0.02] rounded-2xl border border-dashed border-white/10">
                        <AlertCircle className="w-10 h-10 mx-auto mb-3 opacity-20" />
                        <p className="text-[10px] font-black uppercase tracking-widest opacity-50">{showAllItems ? emptyMessage : `No active ${isLoans ? 'loans' : 'credits'}`}</p>
                    </div>
                ) : (
                    <div className="flex-1 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent space-y-3">
                        {displayedItems.map((item) => (
                            <div
                                key={item.id}
                                className="relative group border border-white/10 rounded-2xl p-3 dark:bg-white/[0.02] hover:bg-white/[0.04] transition-all overflow-hidden"
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-start gap-3 flex-1">
                                        <div className={`p-2 rounded-xl shrink-0 ${isLoans
                                            ? 'bg-red-500/10 text-red-500'
                                            : 'bg-emerald-500/10 text-emerald-500'
                                            }`}>
                                            {isLoans ? <CreditCard className="w-4 h-4" /> : <DollarSign className="w-4 h-4" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="text-sm font-black text-gray-900 dark:text-white truncate">
                                                {item.description}
                                            </h4>
                                            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wide flex items-center gap-3 mt-0.5">
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="w-3 h-3" />
                                                    {formatDate(item.date)}
                                                </span>
                                                {item.category && (
                                                    <span className="opacity-60">{item.category}</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    {item.remainingAmount > 0 && (
                                        <button
                                            onClick={() => handleAdjust(item)}
                                            disabled={processing[item.id]}
                                            className="p-1.5 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50"
                                            title="Adjust amount"
                                        >
                                            <Edit3 className="w-3.5 h-3.5 text-gray-500" />
                                        </button>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-3 mb-3">
                                    <div className="bg-white/5 p-2 rounded-xl border border-white/5">
                                        <div className="text-[9px] text-gray-500 uppercase font-black tracking-widest mb-0.5">Original</div>
                                        <div className="text-sm font-black text-gray-700 dark:text-gray-300">
                                            {formatCurrencyWithUser(item.amount, userProfile)}
                                        </div>
                                    </div>
                                    <div className="bg-orange-500/5 p-2 rounded-xl border border-orange-500/10">
                                        <div className="text-[9px] text-orange-500 uppercase font-black tracking-widest mb-0.5">Remaining</div>
                                        <div className="text-sm font-black text-orange-500">
                                            {formatCurrencyWithUser(item.remainingAmount, userProfile)}
                                        </div>
                                    </div>
                                </div>

                                {item.adjustmentHistory && item.adjustmentHistory.length > 0 && (
                                    <div className="mb-3 p-2 bg-purple-500/5 dark:bg-purple-900/10 rounded-xl border border-purple-500/10">
                                        <div className="text-[9px] font-black text-purple-500 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                                            <div className="w-1 h-1 rounded-full bg-purple-500" />
                                            History
                                        </div>
                                        <div className="space-y-1">
                                            {item.adjustmentHistory.slice(-2).map((adj, idx) => {
                                                const isIncrease = adj.amount > 0;
                                                return (
                                                    <div key={idx} className="text-[10px] text-gray-500 flex items-center justify-between">
                                                        <span className="truncate max-w-[70%]">{adj.reason || (isIncrease ? 'Increase' : 'Decrease')}</span>
                                                        <span className={`font-bold ${isIncrease ? 'text-emerald-500' : 'text-red-500'}`}>
                                                            {isIncrease ? '+' : ''}{formatCurrencyWithUser(adj.amount, userProfile)}
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                <button
                                    onClick={() => handleMarkAsPaid(item)}
                                    disabled={processing[item.id] || item.remainingAmount <= 0}
                                    className={`w-full h-10 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all flex items-center justify-center gap-2 active:scale-[0.98] ${item.remainingAmount <= 0
                                        ? 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/20'
                                        : isLoans
                                            ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/20'
                                            : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20'
                                        }`}
                                >
                                    {processing[item.id] ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                                        item.remainingAmount <= 0 ? <CheckCircle className="w-4 h-4" /> : <Plus className="w-4 h-4" />
                                    )}
                                    {item.remainingAmount <= 0 ? `Fully ${isLoans ? 'Repaid' : 'Collected'}` : `Record ${isLoans ? 'Repayment' : 'Collection'}`}
                                </button>

                                {/* Subtle decorative background gradient */}
                                <div className={`absolute -bottom-6 -right-6 w-16 h-16 rounded-full blur-3xl opacity-10 ${isLoans ? 'bg-red-500' : 'bg-emerald-500'}`} />
                            </div>
                        ))}
                    </div>
                )}
                </div>
            </Modal>

            <PaymentModal />
            <AdjustmentModal />

            <Toast
                show={toast.show}
                message={toast.message}
                type={toast.type}
                onClose={() => setToast({ show: false, message: '', type: 'success' })}
            />
        </>
    );
};

export default LoanCreditModal;