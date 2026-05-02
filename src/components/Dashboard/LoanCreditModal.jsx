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
                <div className="flex flex-col h-full">
                    {/* Summary Header - Executive Metrics */}
                    <div className="px-5 pt-5 pb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5 border-b border-gray-100 dark:border-white/5">
                        <div className="flex items-center gap-3">
                            <div className="px-4 py-3 rounded-2xl bg-gray-50/50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/5">
                                <div className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 dark:text-gray-600 mb-1.5">Capital Principal</div>
                                <div className="text-sm font-black text-gray-900 dark:text-white tracking-tight">{formatCurrencyWithUser(totalOriginalAmount, userProfile)}</div>
                            </div>
                            <div className="px-4 py-3 rounded-2xl bg-orange-500/5 dark:bg-orange-500/[0.02] border border-orange-500/10">
                                <div className="text-[9px] font-black uppercase tracking-[0.2em] text-orange-500 mb-1.5">Outstanding Due</div>
                                <div className="text-sm font-black text-orange-600 dark:text-orange-400 tracking-tight">{formatCurrencyWithUser(totalRemaining, userProfile)}</div>
                            </div>
                        </div>

                        {/* Modern Toggle System */}
                        <div className="flex p-1 bg-gray-100/50 dark:bg-white/5 border border-gray-200/50 dark:border-white/5 rounded-2xl w-full sm:w-auto">
                            <button
                                onClick={() => setShowAllItems(false)}
                                className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${!showAllItems 
                                    ? 'bg-teal-500 text-white shadow-lg shadow-teal-500/20' 
                                    : 'text-gray-400 dark:text-gray-600 hover:text-gray-900 dark:hover:text-gray-400'}`}
                            >
                                <User className="w-3.5 h-3.5" />
                                <span>Unpaid</span>
                                <span className={`px-1.5 py-0.5 rounded-md text-[9px] ml-1 ${!showAllItems ? 'bg-white/20 text-white' : 'bg-gray-200 dark:bg-white/10 text-gray-500'}`}>{unpaidCount}</span>
                            </button>
                            <button
                                onClick={() => setShowAllItems(true)}
                                className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${showAllItems 
                                    ? 'bg-teal-500 text-white shadow-lg shadow-teal-500/20' 
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
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 dark:text-gray-600">{showAllItems ? emptyMessage : `No active ${isLoans ? 'loans' : 'credits'}`}</p>
                        </div>
                    ) : (
                        <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">
                            {displayedItems.map((item) => (
                                <div key={item.id} className="relative p-5 rounded-2xl bg-white/50 dark:bg-white/[0.01] border border-gray-100/50 dark:border-white/5 hover:bg-white dark:hover:bg-white/[0.03] transition-all group">
                                    <div className="flex items-start justify-between mb-5">
                                        <div className="flex items-center gap-4 min-w-0">
                                            <div className={`w-11 h-11 flex items-center justify-center rounded-2xl border ${isLoans ? 'bg-rose-500/5 border-rose-500/10 text-rose-600 dark:text-rose-400' : 'bg-emerald-500/5 border-emerald-500/10 text-emerald-600 dark:text-emerald-400'}`}>
                                                {isLoans ? <CreditCard className="w-5 h-5" /> : <DollarSign className="w-5 h-5" />}
                                            </div>
                                            <div className="min-w-0">
                                                <h4 className="text-sm font-black text-gray-900 dark:text-white truncate leading-tight tracking-tight">{item.description}</h4>
                                                <div className="flex items-center gap-4 mt-2">
                                                    <div className="flex items-center gap-1.5">
                                                        <Calendar className="w-3 h-3 text-gray-400" />
                                                        <span className="text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">{formatDate(item.date)}</span>
                                                    </div>
                                                    {item.category && (
                                                        <div className="flex items-center gap-1.5">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                                                            <span className="text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">{item.category}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                            {item.paidAmount > 0 && (
                                                <button
                                                    onClick={() => handleResetTrigger(item)}
                                                    className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-xl text-gray-400 hover:text-gray-900 dark:hover:text-white transition-all border border-transparent hover:border-gray-200/50 dark:hover:border-white/10"
                                                    title="Reset all payments"
                                                >
                                                    <RotateCcw className="w-3.5 h-3.5" />
                                                </button>
                                            )}
                                            {item.remainingAmount > 0 && (
                                                <button
                                                    onClick={() => handleAdjust(item)}
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
                                            <div className="text-[9px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-600">Principal</div>
                                            <div className="text-sm font-black text-gray-500 dark:text-gray-400 tracking-tight">{formatCurrencyWithUser(item.amount, userProfile)}</div>
                                        </div>
                                        <div className="space-y-1">
                                            <div className="text-[9px] font-black uppercase tracking-widest text-orange-500">Remaining</div>
                                            <div className="text-sm font-black text-orange-600 dark:text-orange-400 tracking-tight">{formatCurrencyWithUser(item.remainingAmount, userProfile)}</div>
                                        </div>
                                    </div>

                                    {item.adjustmentHistory?.length > 0 && (
                                        <div className="mb-5 p-4 bg-indigo-500/[0.03] dark:bg-indigo-500/[0.01] rounded-xl border border-indigo-500/10">
                                            <div className="text-[9px] font-black uppercase tracking-[0.2em] text-indigo-500 mb-3">Adjustment History</div>
                                            <div className="space-y-2">
                                                {item.adjustmentHistory.slice(-2).map((adj, idx) => (
                                                    <div key={idx} className="flex justify-between items-center text-[10px]">
                                                        <span className="text-gray-500 dark:text-gray-400 truncate mr-3 font-black uppercase tracking-widest opacity-70">{adj.reason || 'Correction'}</span>
                                                        <span className={`font-black ${adj.amount > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
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
                                            variant={item.remainingAmount <= 0 ? 'soft' : 'filled'}
                                            disabled={item.remainingAmount <= 0 || processing[item.id]}
                                            loading={processing[item.id]}
                                            onClick={() => handleMarkAsPaid(item)}
                                            icon={item.remainingAmount <= 0 ? CheckCircle : Plus}
                                            className="flex-1 h-11"
                                        >
                                            <span className="text-[10px] font-black uppercase tracking-widest">
                                                {item.remainingAmount <= 0 ? `Fully ${isLoans ? 'Repaid' : 'Collected'}` : `Record ${isLoans ? 'Repayment' : 'Collection'}`}
                                            </span>
                                        </Button>
                                        {item.remainingAmount > 0 && (
                                            <Button
                                                variant="icon"
                                                color="emerald"
                                                onClick={() => handleExpressSettlement(item)}
                                                loading={processing[item.id]}
                                                title="Express Settle All"
                                                icon={Zap}
                                                className="w-11 h-11 flex-shrink-0"
                                            />
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </Modal>

            {/* Inlined Sub-Dialogs for Recording Payments/Adjustments */}
            {(showPaymentModal || showAdjustmentModal) && (
                <div className="fixed inset-0 bg-white/20 dark:bg-black/80 backdrop-blur-xl flex items-center justify-center p-5 z-[70] animate-in fade-in duration-300">
                    <div className="w-full max-w-md shadow-2xl rounded-[2.5rem] border border-gray-100 dark:border-white/10 bg-white dark:bg-gray-900 p-8">
                        {showPaymentModal ? (
                            <>
                                <div className="flex items-center justify-between mb-8">
                                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-900 dark:text-white">
                                        {isLoans ? 'Record Repayment' : 'Record Collection'}
                                    </h3>
                                    <button onClick={() => setShowPaymentModal(null)} className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-colors">
                                        <X className="w-4 h-4 text-gray-400" />
                                    </button>
                                </div>
                                <div className="space-y-6">
                                    <div className="grid grid-cols-2 gap-5 p-5 rounded-2xl bg-gray-50/50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/5">
                                        <div>
                                            <div className="text-[9px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-600 mb-1.5">Capital</div>
                                            <div className="text-xs font-black text-gray-900 dark:text-white opacity-60 tracking-tight">{formatCurrencyWithUser(showPaymentModal.amount, userProfile)}</div>
                                        </div>
                                        <div>
                                            <div className="text-[9px] font-black uppercase tracking-widest text-orange-500 mb-1.5">Outstanding</div>
                                            <div className="text-sm font-black text-orange-600 dark:text-orange-400 tracking-tight">{formatCurrencyWithUser(showPaymentModal.remainingAmount, userProfile)}</div>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest px-1">Amount</label>
                                        <GlassInput
                                            type="number"
                                            placeholder="0.00"
                                            value={paymentAmount}
                                            onChange={(e) => setPaymentAmount(e.target.value)}
                                            icon={DollarSign}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest px-1">Description (Optional)</label>
                                        <GlassInput
                                            placeholder="Audit note..."
                                            value={paymentDescription}
                                            onChange={(e) => setPaymentDescription(e.target.value)}
                                        />
                                    </div>
                                    <div className="flex gap-3 pt-4">
                                        <Button fullWidth variant="soft" color="gray" onClick={() => setShowPaymentModal(null)}>Cancel</Button>
                                        <Button fullWidth color="emerald" onClick={handlePaymentSubmit} loading={processing[showPaymentModal.id]}>Confirm</Button>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="flex items-center justify-between mb-8">
                                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-900 dark:text-white">Adjust {isLoans ? 'Loan' : 'Credit'}</h3>
                                    <button onClick={() => setShowAdjustmentModal(null)} className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-colors">
                                        <X className="w-4 h-4 text-gray-400" />
                                    </button>
                                </div>
                                <div className="space-y-6">
                                    <div className="bg-gray-50/50 dark:bg-white/[0.02] p-5 rounded-2xl border border-gray-100 dark:border-white/5">
                                        <div className="text-[9px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-600 mb-1.5">Net Principal</div>
                                        <div className="text-xl font-black text-gray-900 dark:text-white tracking-tighter">{formatCurrencyWithUser(showAdjustmentModal.amount, userProfile)}</div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest px-1">Adjustment Delta</label>
                                        <GlassInput
                                            type="number"
                                            placeholder="+/- 0.00"
                                            value={adjustmentAmount}
                                            onChange={(e) => setAdjustmentAmount(e.target.value)}
                                        />
                                        <p className="text-[9px] font-black uppercase tracking-tight text-gray-400 dark:text-gray-600 px-1 mt-1">+ Increase / - Decrease</p>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest px-1">Adjustment Reason</label>
                                        <GlassInput
                                            placeholder="Note for audit log..."
                                            value={adjustmentReason}
                                            onChange={(e) => setAdjustmentReason(e.target.value)}
                                        />
                                    </div>
                                    <div className="flex gap-3 pt-4">
                                        <Button fullWidth variant="soft" color="gray" onClick={() => setShowAdjustmentModal(null)}>Cancel</Button>
                                        <Button fullWidth color="purple" onClick={handleAdjustmentSubmit} loading={processing[showAdjustmentModal.id]}>Apply Adjustment</Button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
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