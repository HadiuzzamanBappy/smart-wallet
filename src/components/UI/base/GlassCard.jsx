/**
 * GlassCard - The fundamental glassmorphic container for the app.
 */
const GlassCard = ({ 
    children, 
    className = '', 
    onClick, 
    hover = false, 
    padding = 'p-5',
    variant = 'card'
}) => {
    const isClickable = !!onClick;
    
    const glassStyles = {
        card: "bg-surface-card/70 dark:bg-surface-card-dark/40 backdrop-blur-xl border border-paper-200/20 dark:border-paper-900/10 shadow-glass dark:shadow-glass-dark",
        thick: "bg-paper-50 dark:bg-surface-card-dark/95 backdrop-blur-2xl border border-paper-200 dark:border-paper-900/20 shadow-xl",
        flat: "bg-paper-100/50 dark:bg-ink-900/20 border border-paper-200/50 dark:border-paper-900/10",
        elevated: "bg-paper-50 dark:bg-surface-card-dark border border-paper-200 dark:border-paper-900/20 shadow-lg"
    };
    
    return (
        <div
            onClick={onClick}
            className={`
                relative overflow-hidden transition-all duration-300
                rounded-3xl ${glassStyles[variant] || glassStyles.card}
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
            <div className={`absolute -bottom-10 -right-10 w-24 h-24 rounded-full blur-3xl opacity-0 transition-opacity duration-500 group-hover:opacity-[0.1] bg-primary-500`} />
        </div>
    );
};

export default GlassCard;
