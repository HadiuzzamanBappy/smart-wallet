/**
 * StatBadge - Small themed badges for showing sub-stats (e.g. DUE amount).
 */
const StatBadge = ({ label, value, variant = 'ink', className = '' }) => {
    const variants = {
        primary: 'bg-primary-500/10 text-primary-600 dark:text-primary-400 border-primary-500/20',
        success: 'bg-success-500/10 text-success-600 dark:text-success-400 border-success-500/20',
        error: 'bg-error-500/10 text-error-600 dark:text-error-400 border-error-500/20',
        warning: 'bg-warning-500/10 text-warning-600 dark:text-warning-400 border-warning-500/20',
        info: 'bg-info-500/10 text-info-600 dark:text-info-400 border-info-500/20',
        ink: 'bg-ink-100 dark:bg-ink-800 text-ink-600 dark:text-paper-400 border-ink-200 dark:border-ink-700'
    };

    return (
        <div className={`px-1.5 py-0.5 rounded-lg border backdrop-blur-sm text-[9px] font-bold uppercase tracking-widest flex items-center gap-1.5 ${variants[variant] || variants.ink} ${className}`}>
            {label && <span className="opacity-70">{label}</span>}
            <span className="truncate">{value}</span>
        </div>
    );
};

export default StatBadge;
