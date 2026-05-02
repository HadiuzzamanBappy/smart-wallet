import React from 'react';

/**
 * GlassBadge - A simple, single-value glassmorphic badge.
 */
const GlassBadge = ({ children, color = 'gray', className = '' }) => {
    const colors = {
        gray: 'bg-white/10 text-gray-300 border-white/10',
        teal: 'bg-teal-500/10 text-teal-400 border-teal-500/20',
        emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        rose: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
        amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
        blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
        purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
        indigo: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
        orange: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
        cyan: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
        lime: 'bg-lime-500/10 text-lime-400 border-lime-500/20'
    };

    const isCustom = className.includes('text-') || className.includes('bg-');

    return (
        <span className={`
            inline-flex items-center px-2 py-0.5 
            rounded-full border backdrop-blur-sm
            text-[9px] font-black uppercase tracking-[0.15em] gap-1.5
            ${!isCustom ? (colors[color] || colors.gray) : 'border-white/10'}
            ${className}
        `}>
            {children}
        </span>
    );
};

export default GlassBadge;
