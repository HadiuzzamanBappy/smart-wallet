/**
 * GlassCard - The fundamental glassmorphic container for the app.
 */
const GlassCard = ({ 
    children, 
    className = '', 
    onClick, 
    hover = false, 
    padding = 'p-4',
    variant = 'card',
    groupName = 'group'
}) => {
    const isClickable = !!onClick;
    
    const glassStyles = {
        card: "bg-surface-light/80 dark:bg-surface-dark/40 backdrop-blur-xl border border-paper-200 dark:border-paper-900/10 shadow-glass dark:shadow-glass-dark",
        thick: "bg-surface-light dark:bg-surface-dark/95 backdrop-blur-2xl border border-paper-200 dark:border-paper-900/20 shadow-xl",
        flat: "bg-paper-100/50 dark:bg-ink-900/10 border border-paper-200/30 dark:border-paper-900/10",
        elevated: "bg-surface-light dark:bg-surface-dark border border-paper-200 dark:border-paper-900/20 shadow-lg shadow-ink-950/5"
    };
    
    return (
        <div
            onClick={onClick}
            className={`
                relative overflow-hidden transition-all duration-300
                rounded-3xl ${glassStyles[variant] || glassStyles.card}
                ${padding} ${className}
                ${isClickable || hover ? 'cursor-pointer hover:border-primary-500/30 hover:shadow-lg active:scale-[0.98]' : ''}
                ${groupName}
            `}
        >
            {/* Main Content */}
            <div className="relative z-10">
                {children}
            </div>

            {/* Subtle decorative background glow */}
            <div className={`absolute -bottom-10 -right-10 w-24 h-24 rounded-full blur-3xl opacity-0 transition-opacity duration-500 group-hover:opacity-[0.05] bg-primary-500`} />
        </div>
    );
};

export default GlassCard;
