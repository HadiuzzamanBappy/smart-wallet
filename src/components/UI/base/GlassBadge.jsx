/**
 * GlassBadge - A simple, single-value glassmorphic badge.
 */
const GlassBadge = ({ children, color = 'ink', className = '' }) => {
    const colors = {
        primary: 'bg-primary-500/10 text-primary-600 dark:text-primary-400 border-primary-500/20',
        secondary: 'bg-secondary-500/10 text-secondary-600 dark:text-secondary-400 border-secondary-500/20',
        success: 'bg-success-500/10 text-success-600 dark:text-success-400 border-success-500/20',
        error: 'bg-error-500/10 text-error-600 dark:text-error-400 border-error-500/20',
        warning: 'bg-warning-500/10 text-warning-600 dark:text-warning-400 border-warning-500/20',
        info: 'bg-info-500/10 text-info-600 dark:text-info-400 border-info-500/20',
        ink: 'bg-ink-100 dark:bg-ink-800 text-ink-600 dark:text-paper-400 border-ink-200 dark:border-ink-700',
        paper: 'bg-paper-50 dark:bg-ink-700 text-ink-500 dark:text-paper-100 border-paper-200 dark:border-ink-600'
    };

    const isCustom = className.includes('text-') || className.includes('bg-');

    return (
        <span className={`
            inline-flex items-center px-2 py-0.5 
            rounded-full border backdrop-blur-sm
            text-[10px] font-bold uppercase tracking-wider gap-1.5
            ${!isCustom ? (colors[color] || colors.ink) : 'border-paper-200/20'}
            ${className}
        `}>
            {children}
        </span>
    );
};

export default GlassBadge;
