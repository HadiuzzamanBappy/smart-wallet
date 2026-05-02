import React from 'react';
import { THEME } from '../../../config/theme';

/**
 * GlassCard - The fundamental glassmorphic container for the app.
 */
const GlassCard = ({ 
    children, 
    className = '', 
    onClick, 
    hover = false, 
    padding = THEME.spacing.cardPadding,
    variant = 'card'
}) => {
    const isClickable = !!onClick;
    
    return (
        <div
            onClick={onClick}
            className={`
                relative overflow-hidden transition-all duration-300
                rounded-3xl ${THEME.glass[variant]}
                ${padding} ${className}
                ${isClickable || hover ? 'cursor-pointer hover:brightness-105 active:scale-[0.98]' : ''}
                group
            `}
        >
            {/* Main Content */}
            <div className="relative z-10">
                {children}
            </div>

            {/* Subtle decorative background glow */}
            <div className={`absolute -bottom-10 -right-10 w-24 h-24 rounded-full blur-3xl opacity-0 transition-opacity duration-500 group-hover:opacity-[0.08] bg-primary-500`} />
        </div>
    );
};

export default GlassCard;
