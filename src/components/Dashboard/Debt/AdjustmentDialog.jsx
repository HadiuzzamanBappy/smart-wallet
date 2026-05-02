import React from 'react';
import { X } from 'lucide-react';
import Button from '../../UI/base/Button';
import GlassInput from '../../UI/base/GlassInput';
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
        <div className="fixed inset-0 bg-white/20 dark:bg-black/80 backdrop-blur-xl flex items-center justify-center p-5 z-[70] animate-in fade-in duration-300">
            <div className="w-full max-w-md shadow-2xl rounded-[2.5rem] border border-gray-100 dark:border-white/10 bg-white dark:bg-gray-900 p-8">
                <div className="flex items-center justify-between mb-8">
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-900 dark:text-white">Adjust {isLoans ? 'Loan' : 'Credit'}</h3>
                    <button onClick={onCancel} className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-colors">
                        <X className="w-4 h-4 text-gray-400" />
                    </button>
                </div>
                <div className="space-y-6">
                    <div className="bg-gray-50/50 dark:bg-white/[0.02] p-5 rounded-2xl border border-gray-100 dark:border-white/5">
                        <div className="text-[9px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-600 mb-1.5">Net Principal</div>
                        <div className="text-xl font-black text-gray-900 dark:text-white tracking-tighter">{formatCurrencyWithUser(item.amount, userProfile)}</div>
                    </div>
                    <div className="space-y-2">
                        <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest px-1">Adjustment Delta</label>
                        <GlassInput
                            type="number"
                            placeholder="+/- 0.00"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                        />
                        <p className="text-[9px] font-black uppercase tracking-tight text-gray-400 dark:text-gray-600 px-1 mt-1">+ Increase / - Decrease</p>
                    </div>
                    <div className="space-y-2">
                        <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest px-1">Adjustment Reason</label>
                        <GlassInput
                            placeholder="Note for audit log..."
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-3 pt-4">
                        <Button fullWidth variant="soft" color="gray" onClick={onCancel}>Cancel</Button>
                        <Button fullWidth color="purple" onClick={onSubmit} loading={isProcessing}>Apply Adjustment</Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdjustmentDialog;
