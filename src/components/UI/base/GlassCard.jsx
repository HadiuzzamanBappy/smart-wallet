import React from 'react';

/**
 * GlassCard - The fundamental glassmorphic container for the app.
 */
const GlassCard = ({ 
    children, 
    className = '', 
    onClick, 
    hover = false, 
    padding = 'p-4',
    border = 'border-gray-200/60 dark:border-white/5',
    bgColor = 'bg-white/80 dark:bg-white/[0.03]',
    glowColor = 'bg-teal-500/20'
}) => {
    const isClickable = !!onClick;
    
    return (
        <div
            onClick={onClick}
            className={`
                relative overflow-hidden transition-all duration-300
                rounded-2xl border ${border} ${bgColor}
                ${padding} ${className}
                ${isClickable || hover ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-white/[0.06] hover:border-gray-300 dark:hover:border-white/20 active:scale-[0.98]' : ''}
                group
            `}
        >
            {/* Main Content */}
            <div className="relative z-10">
                {children}
            </div>

            {/* Subtle decorative background glow */}
            <div className={`absolute -bottom-10 -right-10 w-24 h-24 rounded-full blur-3xl opacity-0 transition-opacity duration-500 group-hover:opacity-20 ${glowColor}`} />
        </div>
    );
};

export default GlassCard;
