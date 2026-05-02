import React from 'react';
import { Loader2 } from 'lucide-react';
import { THEME } from '../../../config/theme';

/**
 * Button - Centralized button component for the app's premium design system.
 * Uses the centralized THEME tokens for colors, sizes, and effects.
 */
const Button = ({
    children,
    onClick,
    variant = 'filled', // 'filled', 'outlined', 'soft', 'text', 'ghost', 'icon'
    color = 'teal',      // 'teal', 'emerald', 'purple', 'red', 'gray'
    size = 'md',        // 'xsm', 'sm', 'md', 'lg', 'icon'
    className = '',
    disabled = false,
    loading = false,
    icon: Icon,
    fullWidth = false,
    type = 'button'
}) => {

    const baseStyles = "inline-flex items-center justify-center gap-2 font-black uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100 disabled:cursor-not-allowed";

    // Dynamic color mapping using THEME tokens
    const getThemeColor = (colorName) => {
        const colorMap = {
            teal: 'primary',
            emerald: 'emerald',
            purple: 'purple',
            red: 'danger',
            gray: 'gray'
        };
        return THEME.colors[colorMap[colorName]] || THEME.colors.primary;
    };

    const theme = getThemeColor(color);

    const variants = {
        filled: `${theme.bg} hover:brightness-110 text-white shadow-lg ${theme.glow}`,
        outlined: `bg-transparent border ${theme.border.replace('/20', '/50')} ${theme.text} hover:${theme.bg} hover:text-white`,
        soft: `${theme.bg}/10 ${theme.text} hover:${theme.bg}/20 border ${theme.border}`,
        text: `${theme.text} hover:${theme.bg}/10`,
        ghost: "bg-transparent hover:bg-gray-100 dark:hover:bg-white/5 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors",
        icon: "p-2 rounded-xl bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 border border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
    };

    const sizes = {
        xsm: "px-2 py-1 text-[8px] rounded-lg",
        sm: "px-3 py-1.5 text-[9px] rounded-xl",
        md: "px-5 py-2.5 text-[10px] rounded-2xl",
        lg: "px-6 py-3.5 text-xs rounded-2xl",
        icon: "p-2.5 rounded-xl aspect-square"
    };

    // Special logic for icon-only variant
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
                    {Icon && <Icon className={`${(size === 'sm' || size === 'xsm') ? 'w-3.5 h-3.5' : 'w-4.5 h-4.5'} shrink-0`} />}
                    {children}
                </>
            )}
        </button>
    );
};

export default Button;
