import { Loader2 } from 'lucide-react';

/**
 * Button - Centralized button component for the app's premium design system.
 */
const Button = ({
    children,
    onClick,
    variant = 'filled', // 'filled', 'outlined', 'soft', 'text', 'ghost', 'icon'
    color = 'primary',   // 'primary', 'secondary', 'success', 'error', 'warning', 'info', 'ink'
    size = 'md',        // 'xsm', 'sm', 'md', 'lg', 'icon'
    className = '',
    disabled = false,
    loading = false,
    icon: Icon,
    fullWidth = false,
    type = 'button'
}) => {

    const baseStyles = "inline-flex items-center justify-center gap-2 font-bold transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100 disabled:cursor-not-allowed";

    // Semantic color configurations
    const colorConfigs = {
        primary: {
            bg: "bg-primary-500",
            text: "text-primary-600 dark:text-primary-400",
            contrast: "text-white",
            border: "border-primary-500/40",
            glow: "shadow-primary-500/20"
        },
        secondary: {
            bg: "bg-secondary-500",
            text: "text-secondary-600 dark:text-secondary-400",
            contrast: "text-white",
            border: "border-secondary-500/40",
            glow: "shadow-secondary-500/20"
        },
        success: {
            bg: "bg-success-500",
            text: "text-success-600 dark:text-success-400",
            contrast: "text-white",
            border: "border-success-500/40",
            glow: "shadow-success-500/20"
        },
        error: {
            bg: "bg-error-500",
            text: "text-error-600 dark:text-error-400",
            contrast: "text-white",
            border: "border-error-500/40",
            glow: "shadow-error-500/20"
        },
        warning: {
            bg: "bg-warning-500",
            text: "text-warning-600 dark:text-warning-400",
            contrast: "text-white",
            border: "border-warning-500/40",
            glow: "shadow-warning-500/20"
        },
        info: {
            bg: "bg-info-500",
            text: "text-info-600 dark:text-info-400",
            contrast: "text-white",
            border: "border-info-500/40",
            glow: "shadow-info-500/20"
        },
        ink: {
            bg: "bg-ink-800 dark:bg-ink-700",
            text: "text-paper-500 dark:text-paper-100",
            contrast: "text-white dark:text-paper-50",
            border: "border-ink-800 dark:border-ink-700",
            glow: "shadow-ink-950/10"
        }
    };

    const config = colorConfigs[color] || colorConfigs.primary;

    const variants = {
        filled: `${config.bg} ${config.contrast} hover:brightness-110 shadow-lg ${config.glow} hover:-translate-y-0.5`,
        outlined: `bg-transparent border ${config.border} ${config.text} hover:bg-current/10 hover:border-current/60 hover:brightness-110 hover:shadow-lg ${config.glow} hover:-translate-y-0.5`,
        soft: `${config.bg}/10 ${config.text} hover:bg-current/20 hover:brightness-110 hover:shadow-lg ${config.glow} hover:-translate-y-0.5`,
        text: `${config.text} hover:${config.bg}/10 hover:-translate-y-0.5`,
        ghost: "bg-transparent hover:bg-paper-100 dark:hover:bg-ink-800 text-ink-500 dark:text-paper-400 transition-colors hover:-translate-y-0.5",
        icon: `p-2 rounded-xl bg-paper-100 dark:bg-ink-800 border border-paper-200 dark:border-ink-700 ${config.text} hover:bg-current/10 hover:brightness-110 hover:shadow-lg ${config.glow} hover:-translate-y-0.5`
    };

    const sizes = {
        xsm: "px-2.5 py-1 text-overline rounded-xl",
        sm: "px-3.5 py-2 text-label rounded-xl",
        md: "px-5 py-3 text-body rounded-2xl",
        lg: "px-7 py-3.5 text-h6 rounded-2xl",
        icon: "p-2.5 rounded-xl aspect-square"
    };

    const getFinalSizeStyles = () => {
        if (variant === 'icon' || size === 'icon') {
            if (size === 'xsm') return "p-1.5 rounded-lg aspect-square";
            if (size === 'sm') return "p-2 rounded-xl aspect-square";
            return sizes.icon;
        }
        return sizes[size] || sizes.md;
    };

    const widthStyle = fullWidth ? "w-full" : "";

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled || loading}
            className={`${baseStyles} ${variants[variant] || variants.filled} ${getFinalSizeStyles()} ${widthStyle} ${className}`}
        >
            {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
                <>
                    {Icon && <Icon className={`${(size === 'sm' || size === 'xsm') ? 'w-4 h-4' : 'w-5 h-5'} shrink-0 text-inherit transition-colors duration-300`} />}
                    {children}
                </>
            )}
        </button>
    );
};

export default Button;
