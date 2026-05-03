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
    ...props
}) => {
    const Component = multiline ? 'textarea' : 'input';

    return (
        <div className={`w-full ${className}`}>
            {label && (
                <label className="text-xs font-semibold text-ink-500 dark:text-paper-400 mb-1.5 block px-1">
                    {label}
                </label>
            )}

            <div className="relative group">
                {Icon && (
                    <div className={`absolute left-4 ${multiline ? 'top-4' : 'top-1/2 -translate-y-1/2'} text-ink-400 group-focus-within:text-primary-500 transition-colors pointer-events-none`}>
                        <Icon className="w-4.5 h-4.5" />
                    </div>
                )}

                <Component
                    type={type}
                    rows={multiline ? rows : undefined}
                    className={`
                        w-full ${multiline ? 'py-3' : 'py-3'} bg-paper-100/50 dark:bg-ink-800/40 backdrop-blur-sm
                        border ${error ? 'border-error-500' : 'border-paper-200 dark:border-paper-900/10'} 
                        rounded-2xl ${Icon ? 'pl-12' : 'px-4'} pr-4 
                        text-[14px] font-medium text-ink-900 dark:text-paper-50
                        outline-none transition-all 
                        focus:ring-4 ${error ? 'focus:ring-error-500/10' : 'focus:ring-primary-500/10'}
                        placeholder:text-ink-300 dark:placeholder:text-paper-700
                        focus:border-primary-500/50
                        shadow-sm resize-none
                    `}
                    {...props}
                />
            </div>

            {(error || helperText) && (
                <p className={`mt-1.5 px-1 text-[11px] font-medium ${error ? 'text-error-600' : 'text-ink-400 dark:text-paper-500'}`}>
                    {error || helperText}
                </p>
            )}
        </div>
    );
};

export default GlassInput;
