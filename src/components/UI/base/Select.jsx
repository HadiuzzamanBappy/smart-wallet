import { ChevronDown } from 'lucide-react';

/**
 * Select - Standardized themed select/dropdown component.
 */
const Select = ({
    label,
    options = [],
    value,
    onChange,
    className = '',
    fullWidth = false,
    size = 'md',
    ...props
}) => {
    const sizeClasses = {
        sm: 'py-2 px-3 text-label h-9',
        md: 'py-2.5 px-4 text-body h-11',
        lg: 'py-3.5 px-5 text-h6 h-13'
    };

    return (
        <div className={`${fullWidth ? 'w-full' : ''} ${className}`}>
            {label && (
                <label className="text-overline text-ink-500 dark:text-paper-400 mb-1.5 block px-1">
                    {label}
                </label>
            )}
            
            <div className="relative group">
                <select
                    value={value}
                    onChange={onChange}
                    className={`
                        appearance-none w-full pr-10
                        bg-paper-100/30 dark:bg-white/[0.02] backdrop-blur-sm
                        border border-paper-200 dark:border-paper-900/10
                        ${size === 'sm' ? 'rounded-xl' : 'rounded-2xl'} text-ink-900 dark:text-paper-50
                        outline-none transition-all cursor-pointer
                        hover:bg-paper-200/50 dark:hover:bg-white/[0.04]
                        focus:ring-4 focus:ring-primary-500/10
                        focus:border-primary-500/50
                        shadow-sm
                        ${sizeClasses[size] || sizeClasses.md}
                    `}
                    {...props}
                >
                    {options.map((opt) => (
                        <option 
                            key={opt.value} 
                            value={opt.value}
                            className="bg-surface-card dark:bg-surface-card-dark text-ink-900 dark:text-paper-50"
                        >
                            {opt.label}
                        </option>
                    ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-ink-400 dark:text-paper-700 group-focus-within:text-primary-500 transition-colors">
                    <ChevronDown className="w-4 h-4" />
                </div>
            </div>
        </div>
    );
};

export default Select;
