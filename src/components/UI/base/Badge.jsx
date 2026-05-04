import React from 'react';

/**
 * Badge - Unified glassmorphic badge for labels, statuses, and stats.
 * Replaces both GlassBadge and StatBadge.
 */
const Badge = ({
    children,
    label,
    value,
    icon: Icon,
    color = 'ink',
    variant = 'soft', // soft, glass, outline
    size = 'md',
    pill = true,
    className = ''
}) => {
    const colorConfigs = {
        primary: { text: 'text-primary-600 dark:text-primary-400', bg: 'bg-primary-500/10', border: 'border-primary-500/30' },
        secondary: { text: 'text-secondary-600 dark:text-secondary-400', bg: 'bg-secondary-500/10', border: 'border-secondary-500/30' },
        success: { text: 'text-success-600 dark:text-success-400', bg: 'bg-success-500/10', border: 'border-success-500/30' },
        error: { text: 'text-error-600 dark:text-error-400', bg: 'bg-error-500/10', border: 'border-error-500/30' },
        warning: { text: 'text-warning-600 dark:text-warning-400', bg: 'bg-warning-500/10', border: 'border-warning-500/30' },
        info: { text: 'text-info-600 dark:text-info-400', bg: 'bg-info-500/10', border: 'border-info-500/30' },
        ink: { text: 'text-ink-600 dark:text-paper-400', bg: 'bg-ink-500/10', border: 'border-ink-500/20' },
        paper: { text: 'text-ink-500 dark:text-paper-100', bg: 'bg-paper-100/30 dark:bg-ink-700/40', border: 'border-paper-200 dark:border-ink-600' }
    };

    const sizes = {
        sm: 'px-2 py-0.5 text-overline',
        md: 'px-2.5 py-1 text-label',
        lg: 'px-3.5 py-1.5 text-body'
    };

    const config = colorConfigs[color] || colorConfigs.ink;
    const isCustom = className.includes('text-') || className.includes('bg-');

    const variantStyles = {
        soft: `${config.bg} ${config.border}`,
        glass: `bg-surface-light/40 dark:bg-surface-dark/40 backdrop-blur-md ${config.border}`,
        outline: `bg-transparent ${config.border}`
    };

    const activeVariant = variantStyles[variant] || variantStyles.soft;

    return (
        <div className={`
            inline-flex items-center gap-1.5
            border backdrop-blur-sm transition-all duration-300
            ${pill ? 'rounded-full' : 'rounded-xl'}
            ${sizes[size] || sizes.md}
            ${!isCustom ? `${config.text} ${activeVariant}` : ''}
            ${className}
        `}>
            {Icon && <Icon className="w-3 h-3 opacity-80" />}

            {/* Stat Mode: Label + Value */}
            {(label || value) ? (
                <>
                    {label && <span className="opacity-60 font-medium">{label}</span>}
                    {value && <span className="font-bold tracking-normal">{value}</span>}
                </>
            ) : (
                /* Simple Mode: Children */
                <span className="font-semibold tracking-wide">{children}</span>
            )}
        </div>
    );
};

export default Badge;
