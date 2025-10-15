import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useTransactions } from '../../hooks/useTransactions';
import {
    getAllLoans,
    getAllCredits,
    markLoanAsRepaid,
    markCreditAsCollected
} from '../../services/transactionService';
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
    X
} from 'lucide-react';

const LoanCreditModal = ({ open, onClose, type = 'loans' }) => {
    const { user, userProfile } = useAuth();
    const { refreshTransactions } = useTransactions();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState({});
    const [showPaymentModal, setShowPaymentModal] = useState(null);
    // useRef to keep the input uncontrolled so cursor doesn't jump on re-renders
    const paymentAmountRef = useRef(null);
    const [paymentInputHasValue, setPaymentInputHasValue] = useState(false);
    const [paymentDescription, setPaymentDescription] = useState('');
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
    const [showAllItems, setShowAllItems] = useState(false);

    const isLoans = type === 'loans';
    const title = isLoans ? 'All Loans' : 'All Credits';
    const emptyMessage = isLoans
        ? 'No loans found'
        : 'No credits found';

    // By default show only items that are not fully paid/collected. User can toggle to show all.
    const displayedItems = showAllItems ? items : items.filter(it => (Number(it.remainingAmount) || 0) > 0);

    // whether any item is fully paid/collected (remainingAmount <= 0)
    const hasFullyPaid = items.some(it => (Number(it.remainingAmount) || 0) <= 0);

    // counts for badge
    const unpaidCount = items.filter(it => (Number(it.remainingAmount) || 0) > 0).length;
    const totalCount = items.length;

    // totals for header summary (based on displayed items)
    const totalOriginalAmount = displayedItems.reduce((s, it) => s + (Number(it.amount) || 0), 0);
    const totalRemaining = displayedItems.reduce((s, it) => s + (Number(it.remainingAmount) || 0), 0);

    const formatCurrency = (amount) => {
        const currency = userProfile?.currency || 'BDT';
        const currencyLocales = {
            BDT: 'en-BD',
            USD: 'en-US',
            EUR: 'en-DE',
            GBP: 'en-GB',
            INR: 'en-IN'
        };

        const locale = currencyLocales[currency] || 'en-BD';

        return new Intl.NumberFormat(locale, {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: currency === 'BDT' ? 0 : 2
        }).format(amount || 0);
    };

    const formatDate = (timestamp) => {
        if (!timestamp) return 'N/A';
        try {
            const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        } catch {
            return 'N/A';
        }
    };

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

    // When payment modal opens, populate the uncontrolled input with remaining amount
    useEffect(() => {
        if (showPaymentModal && paymentAmountRef.current) {
            paymentAmountRef.current.value = showPaymentModal.remainingAmount?.toString() || '';
            setPaymentInputHasValue(Boolean(String(paymentAmountRef.current.value).trim()));
        }
    }, [showPaymentModal]);

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
                showToast(`${formatCurrency(amount)} ${actionText} recorded successfully`);
                setShowPaymentModal(null);
                if (paymentAmountRef.current) paymentAmountRef.current.value = '';
                setPaymentDescription('');

                // Dispatch transaction added event to notify other components
                window.dispatchEvent(new CustomEvent('wallet:transaction-added', {
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

    useEffect(() => {
        if (open && user?.uid) {
            loadData();
        }
    }, [open, user?.uid, type, loadData]);

    const PaymentModal = () => {
        if (!showPaymentModal) return null;

        return (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[60]">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold">
                            {isLoans ? 'Record Loan Repayment' : 'Record Credit Collection'}
                        </h3>
                        <button
                            onClick={() => setShowPaymentModal(null)}
                            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">
                                Original Amount
                            </label>
                            <div className="text-lg font-semibold text-gray-600 dark:text-gray-300">
                                {formatCurrency(showPaymentModal.amount)}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">
                                Remaining Amount
                            </label>
                            <div className="text-lg font-semibold text-orange-600 dark:text-orange-400">
                                {formatCurrency(showPaymentModal.remainingAmount)}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">
                                {isLoans ? 'Repayment' : 'Collection'} Amount *
                            </label>
                            <input
                                ref={paymentAmountRef}
                                type="number"
                                className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                                placeholder="Enter amount"
                                defaultValue={showPaymentModal.remainingAmount}
                                max={showPaymentModal.remainingAmount}
                                step="0.01"
                                onInput={(e) => setPaymentInputHasValue(String(e.target.value).trim() !== '')}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">
                                Description (optional)
                            </label>
                            <input
                                type="text"
                                value={paymentDescription}
                                onChange={(e) => setPaymentDescription(e.target.value)}
                                className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                                placeholder="Additional notes"
                            />
                        </div>

                        <div className="flex gap-3 pt-4">
                            <button
                                onClick={() => setShowPaymentModal(null)}
                                className="flex-1 px-4 py-2 border rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handlePaymentSubmit}
                                disabled={!paymentInputHasValue || processing[showPaymentModal.id]}
                                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {processing[showPaymentModal.id] && <LoadingSpinner size="sm" />}
                                Record {isLoans ? 'Repayment' : 'Collection'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <>
            <Modal isOpen={open} onClose={onClose} title={title}>
                {/* Header totals summary with toggle */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                        <div className="text-sm text-gray-600 dark:text-gray-300">Total: <span className="font-semibold">{formatCurrency(totalOriginalAmount)}</span></div>
                        <div className="text-sm text-orange-600 dark:text-orange-400">Due: <span className="font-semibold">{formatCurrency(totalRemaining)}</span></div>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-xs ml-2 inline-flex items-center px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200">{unpaidCount} / {totalCount}</span>
                        {hasFullyPaid && (
                            <button
                                onClick={() => setShowAllItems(s => !s)}
                                className="p-2 rounded-md border border-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
                                title={showAllItems ? 'Show unpaid only' : 'Show all items'}
                            >
                                {showAllItems ? (
                                    <CheckCircle className="w-4 h-4 text-green-600" />
                                ) : (
                                    <User className="w-4 h-4 text-gray-600" />
                                )}
                            </button>
                        )}
                    </div>
                </div>
                {loading ? (
                    <div className="flex items-center justify-center py-8">
                        <LoadingSpinner />
                    </div>
                ) : displayedItems.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>{showAllItems ? emptyMessage : `No ${isLoans ? 'loans' : 'credits'} match the filter. Try toggling 'Show all'.`}</p>
                    </div>
                ) : (
                    <div className="space-y-4 overflow-y-auto max-h-100 sm:max-h-96 min-h-0">
                        {displayedItems.map((item) => (
                            <div
                                key={item.id}
                                className="border rounded-lg p-4 dark:border-gray-700"
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-start gap-3">
                                        <div className={`p-2 rounded-lg ${isLoans
                                                ? 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400'
                                                : 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400'
                                            }`}>
                                            {isLoans ? <CreditCard className="w-5 h-5" /> : <DollarSign className="w-5 h-5" />}
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-semibold text-gray-900 dark:text-white">
                                                {item.description}
                                            </h4>
                                            <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-4 mt-1">
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="w-4 h-4" />
                                                    {formatDate(item.date)}
                                                </span>
                                                {item.category && (
                                                    <span className="capitalize">{item.category}</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                                            Original Amount
                                        </div>
                                        <div className="text-lg font-semibold">
                                            {formatCurrency(item.amount)}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                                            Remaining
                                        </div>
                                        <div className="text-lg font-semibold text-orange-600 dark:text-orange-400">
                                            {formatCurrency(item.remainingAmount)}
                                        </div>
                                    </div>
                                </div>

                                {item.paidAmount > 0 && (
                                    <div className="mb-4">
                                        <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                                            {isLoans ? 'Paid So Far' : 'Collected So Far'}
                                        </div>
                                        <div className="text-sm text-gray-600 dark:text-gray-300">
                                            {formatCurrency(item.paidAmount)}
                                            {item.lastPaymentDate && (
                                                <span className="text-xs text-gray-400 ml-2">
                                                    (Last: {formatDate(item.lastPaymentDate)})
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                )}

                                <button
                                    onClick={() => handleMarkAsPaid(item)}
                                    disabled={processing[item.id] || item.remainingAmount <= 0}
                                    className={`w-full px-4 py-2 rounded-md font-medium transition-colors flex items-center justify-center gap-2 ${item.remainingAmount <= 0
                                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-700'
                                            : isLoans
                                                ? 'bg-red-600 text-white hover:bg-red-700'
                                                : 'bg-green-600 text-white hover:bg-green-700'
                                        }`}
                                >
                                    {processing[item.id] && <LoadingSpinner size="sm" />}
                                    {item.remainingAmount <= 0 ? (
                                        <>
                                            <CheckCircle className="w-4 h-4" />
                                            Fully {isLoans ? 'Repaid' : 'Collected'}
                                        </>
                                    ) : (
                                        `Mark as ${isLoans ? 'Repaid' : 'Collected'}`
                                    )}
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </Modal>

            <PaymentModal />

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