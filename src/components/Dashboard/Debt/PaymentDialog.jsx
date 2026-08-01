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
            <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-stone-50 dark:bg-stone-900/60 border border-stone-200 dark:border-stone-800">
                    <div className="space-y-1">
                        <div className="text-overline text-stone-500 dark:text-stone-400 mb-1 opacity-60">Principal</div>
                        <div className="text-label text-stone-800 dark:text-stone-200 opacity-60 dark:opacity-40">{formatCurrencyWithUser(item.amount, userProfile)}</div>
                    </div>
                    <div>
                        <div className="text-overline text-warning-500 mb-1">Outstanding</div>
                        <div className="text-h5 text-warning-600 dark:text-warning-400">{formatCurrencyWithUser(item.remainingAmount, userProfile)}</div>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="block text-overline text-stone-500 dark:text-stone-400 px-1">Repayment Amount</label>
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
                    <label className="block text-overline text-stone-500 dark:text-stone-400 px-1">Audit Note (Optional)</label>
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
