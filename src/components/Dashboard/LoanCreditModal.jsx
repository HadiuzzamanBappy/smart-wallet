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
import Button from '../UI/base/Button';
import IconBox from '../UI/base/IconBox';

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
            else showToast(result.error || 'Audit failure', 'error');
        } catch (error) {
            console.error('Error loading data:', error);
            showToast('Audit failure', 'error');
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
            showToast('Invalid repayment volume', 'error');
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
                showToast(result.error || 'Record failure', 'error');
                loadData(true);
            }
        } catch {
            showToast('Record failure', 'error');
            loadData(true);
        } finally {
            setProcessing(prev => ({ ...prev, [itemId]: false }));
        }
    };

    const handleAdjustmentSubmit = async () => {
        if (!showAdjustmentModal || !adjustmentAmount) return;
        const adjustment = parseFloat(adjustmentAmount);
        if (isNaN(adjustment) || adjustment === 0) {
            showToast('Invalid adjustment delta', 'error');
            return;
        }

        const itemId = showAdjustmentModal.id;
        const newAmount = (Number(showAdjustmentModal.amount) || 0) + adjustment;
        if (newAmount <= 0) {
            showToast('Adjusted floor must be > 0', 'error');
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
                showToast(result.error || 'Adjustment failure', 'error');
                loadData(true);
            }
        } catch {
            showToast('Adjustment failure', 'error');
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
                showToast(result.error || 'Record failure', 'error');
                loadData(true);
            }
        } catch {
            showToast('Record failure', 'error');
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
                showToast(result.error || 'Reset failure', 'error');
                loadData(true);
            }
        } catch {
            showToast('Reset failure', 'error');
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
                    <div className="px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-paper-100 dark:border-white/5">
                        <div className="flex items-center gap-3">
                            <div className="px-4 py-3 rounded-2xl bg-surface-card dark:bg-surface-card-dark border border-paper-100 dark:border-white/5 shadow-sm">
                                <div className="text-overline text-ink-400 dark:text-paper-700 mb-1 opacity-60">Capital Principal</div>
                                <div className="text-label text-ink-900 dark:text-paper-50">{formatCurrencyWithUser(totalOriginalAmount, userProfile)}</div>
                            </div>
                            <div className="px-4 py-3 rounded-2xl bg-warning-500/5 border border-warning-500/20 shadow-sm">
                                <div className="text-overline text-warning-500 mb-1">Outstanding Due</div>
                                <div className="text-h5 text-warning-600 dark:text-warning-400">{formatCurrencyWithUser(totalRemaining, userProfile)}</div>
                            </div>
                        </div>

                        {/* Modern Toggle System */}
                        <div className="flex p-1 bg-paper-100/30 dark:bg-white/5 border border-paper-100 dark:border-white/5 rounded-2xl w-full sm:w-auto">
                            <button
                                onClick={() => setShowAllItems(false)}
                                className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-overline transition-all duration-300 ${!showAllItems
                                    ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/20'
                                    : 'text-ink-400 dark:text-paper-700 hover:text-ink-900 dark:hover:text-paper-50'}`}
                            >
                                <User className={`w-3 h-3 ${!showAllItems ? 'text-white' : ''}`} />
                                <span className={!showAllItems ? 'text-white' : ''}>Unpaid</span>
                                <span className={`px-1.5 py-0.5 rounded-md text-nano ml-1 ${!showAllItems ? 'bg-white/20 text-white' : 'bg-paper-100 dark:bg-white/10 text-ink-400'}`}>{unpaidCount}</span>
                            </button>
                            <button
                                onClick={() => setShowAllItems(true)}
                                className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-overline transition-all duration-300 ${showAllItems
                                    ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/20'
                                    : 'text-ink-400 dark:text-paper-700 hover:text-ink-900 dark:hover:text-paper-50'}`}
                            >
                                <CheckCircle className={`w-3 h-3 ${showAllItems ? 'text-white' : ''}`} />
                                <span className={showAllItems ? 'text-white' : ''}>Paid</span>
                                <span className={`px-1.5 py-0.5 rounded-md text-nano ml-1 ${showAllItems ? 'bg-white/20 text-white' : 'bg-paper-100 dark:bg-white/10 text-ink-400'}`}>{paidCount}</span>
                            </button>
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex-1 flex items-center justify-center p-10"><LoadingSpinner /></div>
                    ) : displayedItems.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
                            <div className="w-16 h-16 rounded-3xl bg-paper-100 dark:bg-white/[0.02] border border-paper-100 dark:border-white/5 flex items-center justify-center mb-5 opacity-40">
                                <AlertCircle className="w-8 h-8 text-ink-400" />
                            </div>
                            <p className="text-overline text-ink-400 dark:text-paper-700">{showAllItems ? emptyMessage : `No active ${isLoans ? 'loans' : 'credits'}`}</p>
                        </div>
                    ) : (
                        <div className="flex-1 overflow-y-auto p-5 space-y-3 custom-scrollbar">
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
                title={`Reset ${isLoans ? 'Liability' : 'Credit'}`}
                message={`Are you sure you want to purge all settlement logs for "${resetConfirmItem?.description}"? This operation will restore the full principal balance.`}
                confirmText="Confirm Purge"
                type="danger"
            />
        </>
    );
};

export default LoanCreditModal;