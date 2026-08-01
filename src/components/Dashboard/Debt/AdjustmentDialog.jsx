import React from 'react';
import { Settings2, CheckCircle } from 'lucide-react';
import Button from '../../UI/base/Button';
import GlassInput from '../../UI/base/GlassInput';
import Modal from '../../UI/base/Modal';
import { formatCurrencyWithUser } from '../../../utils/helpers';

const AdjustmentDialog = ({
    item,
    type,
    userProfile,
    amount,
    setAmount,
    reason,
    setReason,
    onCancel,
    onSubmit,
    isProcessing
}) => {
    const isLoans = type === 'loans';

    return (
        <Modal 
            isOpen={true} 
            onClose={onCancel} 
            title={`Adjust ${isLoans ? 'Loan' : 'Credit'}`}
            size="sm"
            zIndex={160}
            footer={
                <div className="flex gap-3">
                    <Button fullWidth variant="ghost" color="ink" onClick={onCancel}>Cancel</Button>
                    <Button fullWidth color="primary" onClick={onSubmit} loading={isProcessing} icon={CheckCircle}>Apply</Button>
                </div>
            }
        >
            <div className="space-y-4">
                <div className="bg-stone-50 dark:bg-stone-900/60 p-4 rounded-2xl border border-stone-200 dark:border-stone-800">
                    <div className="text-overline text-stone-500 dark:text-stone-400 mb-1 opacity-60">Net Principal</div>
                    <div className="text-h4 text-stone-800 dark:text-stone-200">{formatCurrencyWithUser(item.amount, userProfile)}</div>
                </div>

                <div className="space-y-2 relative">
                    <label className="block text-overline text-stone-500 dark:text-stone-400 px-1">Adjustment Delta</label>
                    <div className="relative group">
                        <GlassInput
                            type="number"
                            placeholder="+/- 0.00"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            icon={Settings2}
                            className="!rounded-2xl"
                        />
                    </div>
                    <p className="text-nano uppercase text-stone-500 dark:text-stone-400 px-1 mt-1 opacity-50">+ Increase / - Decrease</p>
                </div>

                <div className="space-y-2">
                    <label className="block text-overline text-stone-500 dark:text-stone-400 px-1">Adjustment Reason</label>
                    <GlassInput
                        placeholder="Audit log correction..."
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        className="!rounded-2xl"
                    />
                </div>
            </div>
        </Modal>
    );
};

export default AdjustmentDialog;
