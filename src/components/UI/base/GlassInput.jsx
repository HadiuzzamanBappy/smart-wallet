/**
 * GlassInput - Centralized input component with glassmorphic styling.
 * Supports both standard inputs and textareas (via multiline prop).
 */
const GlassInput = ({
    label,
    icon: Icon,
    error,
    helperText,
    className = '',
    type = 'text',
    multiline = false,
    rows = 3,
    size = 'md',
    ...props
}) => {
    const Component = multiline ? 'textarea' : 'input';

    return (
        <div className={`w-full ${className}`}>
            {label && (
                <label className="text-overline text-stone-600 dark:text-stone-500 dark:text-stone-400 mb-1.5 block px-1">
                    {label}
                </label>
            )}

            <div className="relative group">
                <Component
                    type={type}
                    rows={multiline ? rows : undefined}
                    className={`
                        w-full bg-stone-50 dark:bg-stone-900/60 backdrop-blur-sm
                        border ${error ? 'border-red-500/50' : 'border-stone-200 dark:border-stone-800'} 
                        ${size === 'sm' ? 'rounded-xl py-2 px-3 text-label' : 'rounded-2xl py-3 px-4 text-body'}
                        ${Icon ? (size === 'sm' ? 'pl-9' : 'pl-12') : ''}
                        text-stone-800 dark:text-stone-200
                        outline-none transition-all 
                        focus:ring-4 ${error ? 'focus:ring-red-500/10' : 'focus:ring-emerald-500/10'}
                        placeholder:text-stone-600 dark:text-stone-500
                        focus:border-emerald-500/50
                        shadow-sm resize-none
                    `}
                    {...props}
                />

                {Icon && (
                    <div className={`
                        absolute left-4 ${multiline ? 'top-4' : 'top-1/2 -translate-y-1/2'} 
                        text-stone-600 dark:text-stone-500 
                        group-focus-within:text-emerald-500 
                        transition-colors pointer-events-none z-10
                    `}>
                        <Icon className="w-5 h-5" />
                    </div>
                )}
            </div>

            {(error || helperText) && (
                <p className={`mt-1.5 px-1 text-label ${error ? 'text-red-400' : 'text-stone-600 dark:text-stone-500 dark:text-stone-400'}`}>
                    {error || helperText}
                </p>
            )}
        </div>
    );
};

export default GlassInput;
