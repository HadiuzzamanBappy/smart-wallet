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
} from '../../services/debtService';
import { formatCurrencyWithUser } from '../../utils/helpers';
import Modal from '../UI/base/Modal';
import LoadingSpinner from '../UI/LoadingSpinner';
import Toast from '../UI/base/Toast';
import ConfirmDialog from '../UI/base/ConfirmDialog';
import {
    User,
    CheckCircle,
    AlertCircle
} from 'lucide-react';
import { APP_EVENTS } from '../../config/constants';

// Base UI Components
import { THEME } from '../../config/theme';
import Button from '../UI/base/Button';

// Atomic Debt Components
import DebtItem from './Debt/DebtItem';
import PaymentDialog from './Debt/PaymentDialog';
import AdjustmentDialog from './Debt/AdjustmentDialog';

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
                <div className="flex flex-col h-full">
                    {/* Summary Header - Executive Metrics */}
                    <div className="px-5 pt-5 pb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5 border-b border-gray-100 dark:border-white/5">
                        <div className="flex items-center gap-3">
                            <div className="px-4 py-3 rounded-2xl bg-gray-50/50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/5">
                                <div className={`${THEME.typography.label} mb-1.5`}>Capital Principal</div>
                                <div className={THEME.typography.value}>{formatCurrencyWithUser(totalOriginalAmount, userProfile)}</div>
                            </div>
                            <div className="px-4 py-3 rounded-2xl bg-orange-500/5 dark:bg-orange-500/[0.02] border border-orange-500/10">
                                <div className={`${THEME.typography.label} text-orange-500 mb-1.5`}>Outstanding Due</div>
                                <div className="text-sm font-bold text-orange-600 dark:text-orange-400 tracking-tight">{formatCurrencyWithUser(totalRemaining, userProfile)}</div>
                            </div>
                        </div>

                        {/* Modern Toggle System */}
                        <div className="flex p-1 bg-gray-100/50 dark:bg-white/5 border border-gray-200/50 dark:border-white/5 rounded-2xl w-full sm:w-auto">
                            <button
                                onClick={() => setShowAllItems(false)}
                                className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl ${THEME.typography.label} transition-all duration-300 ${!showAllItems
                                    ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/20'
                                    : 'text-gray-400 dark:text-gray-600 hover:text-gray-900 dark:hover:text-gray-400'}`}
                            >
                                <User className="w-3.5 h-3.5" />
                                <span>Unpaid</span>
                                <span className={`px-1.5 py-0.5 rounded-md text-[9px] ml-1 ${!showAllItems ? 'bg-white/20 text-white' : 'bg-gray-200 dark:bg-white/10 text-gray-500'}`}>{unpaidCount}</span>
                            </button>
                            <button
                                onClick={() => setShowAllItems(true)}
                                className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl ${THEME.typography.label} transition-all duration-300 ${showAllItems
                                    ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/20'
                                    : 'text-gray-400 dark:text-gray-600 hover:text-gray-900 dark:hover:text-gray-400'}`}
                            >
                                <CheckCircle className="w-3.5 h-3.5" />
                                <span>Paid</span>
                                <span className={`px-1.5 py-0.5 rounded-md text-[9px] ml-1 ${showAllItems ? 'bg-white/20 text-white' : 'bg-gray-200 dark:bg-white/10 text-gray-500'}`}>{paidCount}</span>
                            </button>
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex-1 flex items-center justify-center p-10"><LoadingSpinner /></div>
                    ) : displayedItems.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
                            <div className="w-16 h-16 rounded-full bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/5 flex items-center justify-center mb-5 opacity-40">
                                <AlertCircle className="w-8 h-8 text-gray-400" />
                            </div>
                            <p className={THEME.typography.label}>{showAllItems ? emptyMessage : `No active ${isLoans ? 'loans' : 'credits'}`}</p>
                        </div>
                    ) : (
                        <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">
                            {displayedItems.map((item) => (
                                <DebtItem
                                    key={item.id}
                                    item={item}
                                    type={type}
                                    userProfile={userProfile}
                                    onMarkAsPaid={handleMarkAsPaid}
                                    onAdjust={handleAdjust}
                                    onReset={handleResetTrigger}
                                    onExpressSettle={handleExpressSettlement}
                                    isProcessing={processing[item.id]}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </Modal>

            {/* Inlined Sub-Dialogs for Recording Payments/Adjustments */}
            {showPaymentModal && (
                <PaymentDialog
                    item={showPaymentModal}
                    type={type}
                    userProfile={userProfile}
                    amount={paymentAmount}
                    setAmount={setPaymentAmount}
                    description={paymentDescription}
                    setDescription={setPaymentDescription}
                    onCancel={() => setShowPaymentModal(null)}
                    onSubmit={handlePaymentSubmit}
                    isProcessing={processing[showPaymentModal.id]}
                />
            )}

            {showAdjustmentModal && (
                <AdjustmentDialog
                    item={showAdjustmentModal}
                    type={type}
                    userProfile={userProfile}
                    amount={adjustmentAmount}
                    setAmount={setAdjustmentAmount}
                    reason={adjustmentReason}
                    setReason={setAdjustmentReason}
                    onCancel={() => setShowAdjustmentModal(null)}
                    onSubmit={handleAdjustmentSubmit}
                    isProcessing={processing[showAdjustmentModal.id]}
                />
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