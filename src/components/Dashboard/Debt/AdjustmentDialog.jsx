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
            <div className="space-y-6">
                <div className="bg-paper-100/30 dark:bg-white/[0.02] p-4 rounded-2xl border border-paper-100 dark:border-white/5">
                    <div className="text-overline text-ink-400 dark:text-paper-700 font-black mb-1 opacity-60">Net Principal</div>
                    <div className="text-h4 font-black text-ink-900 dark:text-paper-50 tracking-tighter leading-none">{formatCurrencyWithUser(item.amount, userProfile)}</div>
                </div>

                <div className="space-y-2">
                    <label className="block text-overline text-ink-400 dark:text-paper-700 font-black uppercase tracking-widest px-1 leading-none">Adjustment Delta</label>
                    <GlassInput
                        type="number"
                        placeholder="+/- 0.00"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        icon={Settings2}
                        className="!rounded-2xl"
                    />
                    <p className="text-[9px] font-black uppercase tracking-tight text-ink-400 dark:text-paper-700 px-1 mt-1 opacity-50">+ Increase / - Decrease</p>
                </div>

                <div className="space-y-2">
                    <label className="block text-overline text-ink-400 dark:text-paper-700 font-black uppercase tracking-widest px-1 leading-none">Adjustment Reason</label>
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
