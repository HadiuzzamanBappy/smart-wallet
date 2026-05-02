import React from 'react';
import { THEME } from '../../../config/theme';

/**
 * SectionHeader - Standardized header for dashboard sections.
 */
const SectionHeader = ({ icon: Icon, title, subtitle, children, className = '' }) => {
    return (
        <div className={`flex items-center justify-between mb-4 ${className}`}>
            <div className="flex flex-col">
                {subtitle && (
                    <div className={`${THEME.typography.label} mb-0.5`}>
                        {subtitle}
                    </div>
                )}
                <h2 className="flex items-center gap-2">
                    {Icon && <Icon className="w-4 h-4 text-primary-500" />}
                    <span className={subtitle ? "text-xl font-bold text-gray-900 dark:text-white tracking-tight" : "text-gray-900 dark:text-white font-bold"}>
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
