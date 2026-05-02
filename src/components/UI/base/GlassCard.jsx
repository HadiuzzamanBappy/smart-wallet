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
    border = 'border-white/10',
    bgColor = 'bg-white/[0.03] dark:bg-gray-800/40',
    glowColor = 'bg-teal-500/30'
}) => {
    const isClickable = !!onClick;
    
    return (
        <div
            onClick={onClick}
            className={`
                relative overflow-hidden transition-all duration-300
                rounded-2xl border ${border} ${bgColor}
                ${padding} ${className}
                ${isClickable || hover ? 'cursor-pointer hover:bg-white/[0.06] hover:border-white/20 active:scale-[0.98]' : ''}
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
