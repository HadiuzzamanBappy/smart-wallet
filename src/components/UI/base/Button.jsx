import React from 'react';
import { Loader2 } from 'lucide-react';

/**
 * Button - Centralized button component for the app's premium design system.
 * Now supports advanced variants: filled, outlined, soft, text, ghost, and icon.
 */
const Button = ({
    children,
    onClick,
    variant = 'filled', // 'filled', 'outlined', 'soft', 'text', 'ghost', 'icon'
    color = 'teal',      // 'teal', 'emerald', 'purple', 'red', 'gray'
    size = 'md',        // 'sm', 'md', 'lg', 'icon'
    className = '',
    disabled = false,
    loading = false,
    icon: Icon,
    fullWidth = false,
    type = 'button'
}) => {

    const baseStyles = "flex items-center justify-center gap-2 font-black uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100 disabled:cursor-not-allowed overflow-hidden";

    // Color Mappings
    const colors = {
        teal: {
            filled: "bg-teal-500 hover:bg-teal-600 text-white shadow-lg shadow-teal-500/20",
            outlined: "bg-transparent border border-teal-500/50 text-teal-500 hover:bg-teal-500 hover:text-white",
            soft: "bg-teal-500/10 text-teal-500 hover:bg-teal-500/20 border border-teal-500/10",
            text: "text-teal-500 hover:bg-teal-500/10"
        },
        emerald: {
            filled: "bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20",
            outlined: "bg-transparent border border-emerald-500/50 text-emerald-500 hover:bg-emerald-500 hover:text-white",
            soft: "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border border-emerald-500/10",
            text: "text-emerald-500 hover:bg-emerald-500/10"
        },
        purple: {
            filled: "bg-purple-500 hover:bg-purple-600 text-white shadow-lg shadow-purple-500/20",
            outlined: "bg-transparent border border-purple-500/50 text-purple-500 hover:bg-purple-500 hover:text-white",
            soft: "bg-purple-500/10 text-purple-500 hover:bg-purple-500/20 border border-purple-500/10",
            text: "text-purple-500 hover:bg-purple-500/10"
        },
        red: {
            filled: "bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/20",
            outlined: "bg-transparent border border-red-500/50 text-red-500 hover:bg-red-500 hover:text-white",
            soft: "bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/10",
            text: "text-red-500 hover:bg-red-500/10"
        },
        gray: {
            filled: "bg-gray-800 dark:bg-gray-700 hover:bg-gray-900 dark:hover:bg-gray-800 text-white shadow-lg shadow-gray-500/20",
            outlined: "bg-transparent border border-gray-200 dark:border-white/20 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white",
            soft: "bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10 border border-gray-200 dark:border-white/10",
            text: "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white"
        }
    };

    // Special Variants
    const specialVariants = {
        ghost: "bg-transparent hover:bg-gray-100 dark:hover:bg-white/5 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors",
        icon: "p-2 rounded-xl bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 border border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
    };

    const sizes = {
        xsm: "px-2 py-1 text-[8px] rounded-lg",
        sm: "px-3 py-1.5 text-[9px] rounded-xl",
        md: "px-5 py-2.5 text-[10px] rounded-2xl",
        lg: "px-6 py-3.5 text-xs rounded-2xl",
        icon: "p-2.5 rounded-xl aspect-square" // Ensures square shape for icons
    };

    // If variant is 'icon' but a color is provided, we use 'soft' of that color but keep it square
    const finalVariant = (variant === 'icon' && color !== 'gray') ? 'soft' : variant;
    const variantStyles = specialVariants[finalVariant] || (colors[color]?.[finalVariant] || colors.teal.filled);
    
    // Handle icon-only buttons with specific sizes
    const getIconSizeStyles = () => {
        if (variant === 'icon' || size === 'icon') {
            if (size === 'xsm') return "p-1.5 rounded-lg aspect-square";
            if (size === 'sm') return "p-2 rounded-xl aspect-square";
            return sizes.icon;
        }
        return sizes[size];
    };

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled || loading}
            className={`
                ${baseStyles}
                ${variantStyles}
                ${getIconSizeStyles()}
                ${fullWidth ? 'w-full' : ''}
                ${className}
            `}
        >
            {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
                <>
                    {Icon && <Icon className={`${(size === 'sm' || size === 'xsm') ? 'w-3 h-3' : 'w-4 h-4'} shrink-0`} />}
                    {children}
                </>
            )}
        </button>
    );
};

export default Button;
