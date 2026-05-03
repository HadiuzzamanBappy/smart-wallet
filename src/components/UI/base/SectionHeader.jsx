/**
 * SectionHeader - Standardized header for dashboard sections.
 */
const SectionHeader = ({ icon: Icon, title, subtitle, children, className = '' }) => {
    return (
        <div className={`flex items-center justify-between mb-3 ${className}`}>
            <div className="flex flex-col">
                {subtitle && (
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-ink-400 dark:text-paper-500 mb-0.5 px-0.5">
                        {subtitle}
                    </span>
                )}
                <h2 className="flex items-center gap-3">
                    {Icon && <Icon className="w-5.5 h-5.5 text-primary-500" />}
                    <span className="text-xl font-bold text-ink-900 dark:text-paper-50 tracking-tight leading-none">
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
