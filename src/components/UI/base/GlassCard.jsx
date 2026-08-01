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
        card: "bg-stone-50 dark:bg-stone-900/60 backdrop-blur-xl border border-stone-300 dark:border-stone-700/50 shadow-[0_8px_30px_rgba(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.6)]",
        thick: "bg-white/95 dark:bg-stone-900/80 backdrop-blur-2xl border border-stone-200 dark:border-stone-600/50 shadow-[0_12px_40px_rgba(0,0,0,0.1)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.8)]",
        flat: "bg-stone-50 dark:bg-stone-800/40 border border-stone-300 dark:border-stone-700/30",
        elevated: "bg-white/90 dark:bg-stone-900/70 border border-stone-200 dark:border-stone-700/60 shadow-[0_10px_35px_rgba(0,0,0,0.1)] dark:shadow-[0_10px_35px_rgba(0,0,0,0.7)]"
    };

    const iconColorClasses = {
        primary: "text-emerald-500",
        error: "text-red-500",
        info: "text-cyan-500",
        warning: "text-amber-500",
        ink: "text-stone-600 dark:text-stone-500 dark:text-stone-400"
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
