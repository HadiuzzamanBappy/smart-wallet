import React from 'react';

/**
 * SectionHeader - Standardized header for dashboard sections.
 */
const SectionHeader = ({ icon: Icon, title, subtitle, children, className = '' }) => {
    return (
        <div className={`flex items-center justify-between mb-4 ${className}`}>
            <div className="flex flex-col">
                {subtitle && (
                    <div className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-0.5">
                        {subtitle}
                    </div>
                )}
                <h2 className="text-sm font-black uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500 flex items-center gap-2">
                    {Icon && <Icon className="w-4 h-4 text-teal-500" />}
                    <span className={subtitle ? "text-xl font-black text-gray-900 dark:text-white tracking-tight normal-case" : "text-gray-900 dark:text-white"}>
                        {title}
                    </span>
                </h2>
            </div>
            <div className="flex items-center gap-2">
                {children}
            </div>
        </div>
    );
};

export default SectionHeader;
