/**
 * Theme configuration for the "Studio Executive" design system.
 * Centralizes all visual tokens, colors, and repeated Tailwind class patterns.
 */

export const THEME = {
    // Primary Color System (Mapped to Tailwind Config)
    colors: {
        primary: {
            from: 'brand-teal',
            to: 'brand-blue',
            text: 'text-primary-500',
            bg: 'bg-primary-500',
            border: 'border-primary-500/20',
            glow: 'shadow-primary-500/20'
        },
        danger: {
            from: 'brand-rose',
            to: 'brand-amber',
            text: 'text-brand-rose',
            bg: 'bg-brand-rose',
            border: 'border-brand-rose/20',
            glow: 'shadow-brand-rose/20'
        },
        emerald: {
            from: 'emerald-500',
            to: 'teal-600',
            text: 'text-brand-teal',
            bg: 'bg-brand-teal',
            border: 'border-brand-teal/20',
            glow: 'shadow-brand-teal/20'
        },
        purple: {
            from: 'purple-500',
            to: 'indigo-600',
            text: 'text-purple-500',
            bg: 'bg-purple-500',
            border: 'border-purple-500/20',
            glow: 'shadow-purple-500/20'
        },
        gray: {
            from: 'gray-400',
            to: 'gray-600',
            text: 'text-gray-500',
            bg: 'bg-gray-500',
            border: 'border-gray-500/20',
            glow: 'shadow-gray-500/10'
        }
    },

    // UI Patterns
    glass: {
        card: "bg-white/50 dark:bg-white/[0.01] border border-gray-100/50 dark:border-white/5 backdrop-blur-xl shadow-glass dark:shadow-glass-dark",
        cardHover: "hover:bg-white dark:hover:bg-white/[0.03] transition-all",
        input: "bg-gray-50/50 dark:bg-white/[0.01] border border-gray-200/50 dark:border-white/5 backdrop-blur-sm",
        badge: "bg-white/10 dark:bg-black/20 backdrop-blur-md border border-white/20 dark:border-white/5"
    },

    // Typography Tokens
    typography: {
        label: "text-[11px] font-bold text-gray-500 dark:text-gray-400 tracking-wide",
        value: "text-sm font-bold text-gray-900 dark:text-white tracking-tight",
        heading: "text-2xl font-black text-gray-900 dark:text-white tracking-tighter"
    },

    // Layout Tokens
    spacing: {
        modalPadding: "p-8",
        sectionGap: "gap-6",
        cardPadding: "p-5"
    }
};

/**
 * Utility to combine glass classes
 */
export const getGlassClass = (variant = 'card') => THEME.glass[variant] || THEME.glass.card;

/**
 * Utility to get gradient text classes
 */
export const getGradientText = (color = 'primary') => {
    const { from, to } = THEME.colors[color] || THEME.colors.primary;
    return `text-transparent bg-clip-text bg-gradient-to-tr from-${from} to-${to}`;
};
