/**
 * SectionHeader - Standardized header for dashboard sections.
 */
const SectionHeader = ({ icon: Icon, title, subtitle, children, titleSize = 'text-h4', subtitleColor = 'text-stone-400', className = '' }) => {
    return (
        <div className={`flex items-center justify-between mb-3 ${className}`}>
            <div className="flex flex-col">
                {subtitle && (
                    <span className={`text-overline ${subtitleColor} opacity-60 mb-0.5 px-0.5`}>
                        {subtitle}
                    </span>
                )}
                <h2 className="flex items-center gap-2">
                    {Icon && <Icon className="w-5 h-5 text-stone-300 opacity-90" />}
                    <span className={`${titleSize} text-stone-200`}>
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
