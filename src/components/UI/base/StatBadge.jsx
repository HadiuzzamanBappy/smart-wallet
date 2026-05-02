import React from 'react';

/**
 * StatBadge - Small themed badges for showing sub-stats (e.g. DUE amount).
 */
const StatBadge = ({ label, value, variant = 'gray', className = '' }) => {
    const variants = {
        gray: 'bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-white/10',
        orange: 'bg-orange-500/10 text-orange-600 dark:text-orange-500 border-orange-500/20',
        emerald: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 border-emerald-500/20',
        red: 'bg-red-500/10 text-red-600 dark:text-red-500 border-red-500/20',
        teal: 'bg-teal-500/10 text-teal-600 dark:text-teal-500 border-teal-500/20'
    };

    return (
        <div className={`px-2 py-0.5 rounded-lg border text-[8px] font-black uppercase tracking-widest flex items-center gap-1.5 ${variants[variant]} ${className}`}>
            {label && <span className="opacity-60">{label}</span>}
            <span className="truncate">{value}</span>
        </div>
    );
};

export default StatBadge;
