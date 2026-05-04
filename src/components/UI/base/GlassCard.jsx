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
    groupName = 'group',
    backgroundIcon: BackgroundIcon,
    iconColor = 'primary'
}) => {
    const isClickable = !!onClick;
    
    const glassStyles = {
        card: "bg-surface-card dark:bg-surface-card-dark backdrop-blur-xl border border-paper-200 dark:border-paper-900/10 shadow-glass dark:shadow-glass-dark",
        thick: "bg-surface-card dark:bg-surface-card-dark backdrop-blur-2xl border border-paper-200 dark:border-paper-900/20 shadow-xl",
        flat: "bg-paper-100/50 dark:bg-ink-900/10 border border-paper-200/30 dark:border-paper-900/10",
        elevated: "bg-surface-card dark:bg-surface-card-dark border border-paper-200 dark:border-paper-900/20 shadow-lg shadow-ink-950/5"
    };

    const iconColorClasses = {
        primary: "text-primary-500",
        error: "text-red-500",
        info: "text-blue-500",
        warning: "text-amber-500",
        ink: "text-ink-400 dark:text-paper-700"
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
            {/* Background Icon Texture */}
            {BackgroundIcon && (
                <div className={`absolute -right-6 -bottom-6 transition-all duration-700 pointer-events-none rotate-[15deg] group-hover:rotate-[5deg] group-hover:scale-110 opacity-[0.03] dark:opacity-[0.05] group-hover:opacity-[0.07] dark:group-hover:opacity-[0.1] ${iconColorClasses[iconColor] || iconColorClasses.primary}`}>
                    <BackgroundIcon size={128} strokeWidth={1} />
                </div>
            )}

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
