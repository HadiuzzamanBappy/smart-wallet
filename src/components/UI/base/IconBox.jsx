/**
 * IconBox - Standardized icon container with themed backgrounds.
 */
const IconBox = ({
    icon: Icon,
    color = 'primary',
    bgClass = '',
    size = 'md',
    variant = 'soft',
    className = ''
}) => {
    if (!Icon) return null;

    const colorConfigs = {
        primary: {
            text: "text-primary-600 dark:text-primary-400",
            bg: "bg-primary-500/10",
            border: "border-primary-500/30"
        },
        secondary: {
            text: "text-secondary-600 dark:text-secondary-400",
            bg: "bg-secondary-500/10",
            border: "border-secondary-500/30"
        },
        success: {
            text: "text-success-600 dark:text-success-400",
            bg: "bg-success-500/10",
            border: "border-success-500/30"
        },
        error: {
            text: "text-error-600 dark:text-error-400",
            bg: "bg-error-500/10",
            border: "border-error-500/30"
        },
        warning: {
            text: "text-warning-600 dark:text-warning-400",
            bg: "bg-warning-500/10",
            border: "border-warning-500/30"
        },
        info: {
            text: "text-info-600 dark:text-info-400",
            bg: "bg-info-500/10",
            border: "border-info-500/30"
        },
        ink: {
            text: "text-ink-600 dark:text-paper-400",
            bg: "bg-ink-500/10",
            border: "border-ink-500/20"
        },
        white: {
            text: "text-white",
            bg: "bg-white/10",
            border: "border-white/20"
        }
    };

    const config = colorConfigs[color] || colorConfigs.primary;

    const sizes = {
        xs: 'p-1.5 rounded-xl',
        sm: 'p-2 rounded-xl',
        md: 'p-2.5 rounded-2xl',
        lg: 'p-3.5 rounded-3xl',
        xl: 'p-5 rounded-3xl'
    };

    const iconSizes = {
        xs: 'w-3.5 h-3.5',
        sm: 'w-4 h-4',
        md: 'w-5 h-5',
        lg: 'w-6 h-6',
        xl: 'w-8 h-8'
    };

    const variants = {
        glass: `bg-surface-card dark:bg-surface-card-dark backdrop-blur-md border ${config.border} shadow-sm`,
        soft: bgClass || `${config.bg} border ${config.border}`,
        solid: bgClass || `${config.bg.replace('/10', '')} border ${config.border}`,
        ghost: `bg-transparent border ${config.border}`
    };

    const variantStyle = variants[variant] || variants.soft;

    return (
        <div
            className={`
                shrink-0 flex items-center justify-center 
                transition-all duration-300
                ${sizes[size] || sizes.md} 
                ${variantStyle} 
                ${variant === 'solid' ? 'text-white' : config.text}
                ${className}
            `}
        >
            <Icon className={`${iconSizes[size] || iconSizes.md} text-inherit`} />
        </div>
    );
};

export default IconBox;
