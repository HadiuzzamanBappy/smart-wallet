import React from 'react';
import { DollarSign, CheckCircle } from 'lucide-react';
import Button from '../../UI/base/Button';
import GlassInput from '../../UI/base/GlassInput';
import Modal from '../../UI/base/Modal';
import { formatCurrencyWithUser } from '../../../utils/helpers';

const PaymentDialog = ({
    item,
    type,
    userProfile,
    amount,
    setAmount,
    description,
    setDescription,
    onCancel,
    onSubmit,
    isProcessing
}) => {
    const isLoans = type === 'loans';

    return (
        <Modal
            isOpen={true}
            onClose={onCancel}
            title={isLoans ? 'Record Repayment' : 'Record Collection'}
            size="sm"
            footer={
                <div className="flex gap-3">
                    <Button fullWidth variant="ghost" color="ink" onClick={onCancel}>Cancel</Button>
                    <Button fullWidth color="primary" onClick={onSubmit} loading={isProcessing} icon={CheckCircle}>Confirm</Button>
                </div>
            }
        >
            <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-paper-100/30 dark:bg-white/[0.02] border border-paper-100 dark:border-white/5">
                    <div>
                        <div className="text-overline text-ink-400 dark:text-paper-700 mb-1 opacity-60">Principal</div>
                        <div className="text-label text-ink-900 dark:text-paper-50 opacity-40">{formatCurrencyWithUser(item.amount, userProfile)}</div>
                    </div>
                    <div>
                        <div className="text-overline text-warning-500 mb-1">Outstanding</div>
                        <div className="text-h5 text-warning-600 dark:text-warning-400">{formatCurrencyWithUser(item.remainingAmount, userProfile)}</div>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="block text-overline text-ink-400 dark:text-paper-700 px-1">Repayment Amount</label>
                    <GlassInput
                        type="number"
                        placeholder="0.00"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        icon={DollarSign}
                        className="!rounded-2xl"
                    />
                </div>

                <div className="space-y-2">
                    <label className="block text-overline text-ink-400 dark:text-paper-700 px-1">Audit Note (Optional)</label>
                    <GlassInput
                        placeholder="Internal correction..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="!rounded-2xl"
                    />
                </div>
            </div>
        </Modal>
    );
};

export default PaymentDialog;
