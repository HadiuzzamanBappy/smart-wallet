import React from 'react';
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
    ...props
}) => {
    return (
        <div className={`${fullWidth ? 'w-full' : ''} ${className}`}>
            {label && (
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 px-1">
                    {label}
                </label>
            )}
            
            <div className="relative group">
                <select
                    value={value}
                    onChange={onChange}
                    className={`
                        appearance-none w-full px-3 pr-10 py-2
                        bg-white dark:bg-gray-800 
                        border border-gray-300 dark:border-gray-600 
                        rounded-lg text-xs sm:text-sm text-gray-900 dark:text-gray-100
                        outline-none transition-all cursor-pointer
                        hover:bg-gray-50 dark:hover:bg-gray-700/50
                        focus:ring-2 focus:ring-teal-500 dark:focus:ring-teal-400
                        focus:border-transparent
                    `}
                    {...props}
                >
                    {options.map((opt) => (
                        <option 
                            key={opt.value} 
                            value={opt.value}
                            className="bg-white dark:bg-slate-900 text-gray-900 dark:text-white font-sans font-medium text-sm py-2"
                        >
                            {opt.label}
                        </option>
                    ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500 group-hover:text-teal-500 transition-colors">
                    <ChevronDown className="w-3.5 h-3.5" />
                </div>
            </div>
        </div>
    );
};

export default Select;
