/**
 * IconBox - Standardized icon container with themed backgrounds.
 */
const IconBox = ({
    icon: Icon,
    color = 'primary',
    bgClass = '',
    size = 'md',
    variant = 'soft',
    className = '',
    ...props
}) => {
    if (!Icon) return null;

    const colorConfigs = {
        primary: {
            text: "text-emerald-500",
            bg: "bg-emerald-500/10",
            border: "border-emerald-500/30"
        },
        secondary: {
            text: "text-amber-500",
            bg: "bg-amber-500/10",
            border: "border-amber-500/30"
        },
        success: {
            text: "text-emerald-400",
            bg: "bg-emerald-500/10",
            border: "border-emerald-500/30"
        },
        error: {
            text: "text-red-500",
            bg: "bg-red-500/10",
            border: "border-red-500/30"
        },
        warning: {
            text: "text-amber-500",
            bg: "bg-amber-500/10",
            border: "border-amber-500/30"
        },
        info: {
            text: "text-cyan-500",
            bg: "bg-cyan-500/10",
            border: "border-cyan-500/30"
        },
        ink: {
            text: "text-stone-400",
            bg: "bg-stone-500/10",
            border: "border-stone-500/20"
        },
        white: {
            text: "text-stone-200",
            bg: "bg-white/5",
            border: "border-white/10"
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
        glass: `bg-stone-800/60 backdrop-blur-md border ${config.border} shadow-sm`,
        soft: bgClass || `${config.bg} border ${config.border}`,
        solid: bgClass || `${config.bg.replace('/10', '')} border ${config.border}`,
        ghost: `bg-transparent border ${config.border}`
    };

    const variantStyle = variants[variant] || variants.soft;

    return (
        <div
            {...props}
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
