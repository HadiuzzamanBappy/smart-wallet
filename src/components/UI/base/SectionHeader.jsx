/**
 * SectionHeader - Standardized header for dashboard sections.
 */
const SectionHeader = ({ icon: Icon, title, subtitle, children, titleSize = 'text-h3', subtitleColor = 'text-ink-400 dark:text-paper-500', className = '' }) => {
    return (
        <div className={`flex items-center justify-between mb-3 ${className}`}>
            <div className="flex flex-col">
                {subtitle && (
                    <span className={`text-overline ${subtitleColor} opacity-60 mb-0.5 px-0.5`}>
                        {subtitle}
                    </span>
                )}
                <h2 className="flex items-center gap-2">
                    {Icon && <Icon className="w-5 h-5 text-primary-500 opacity-90" />}
                    <span className={`${titleSize} text-ink-900 dark:text-paper-50 leading-none font-bold tracking-tight`}>
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
