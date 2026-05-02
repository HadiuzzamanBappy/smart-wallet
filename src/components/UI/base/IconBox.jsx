import React from 'react';

/**
 * IconBox - Standardized icon container with themed backgrounds.
 */
const IconBox = ({ 
    icon: Icon, 
    colorClass = 'text-teal-500', 
    bgClass = '', 
    size = 'md', 
    variant = 'soft', 
    className = '' 
}) => {
    if (!Icon) return null;

    const sizes = {
        xs: 'p-1.5 rounded-lg',
        sm: 'p-2 rounded-xl',
        md: 'p-2.5 rounded-xl',
        lg: 'p-3 rounded-2xl',
        xl: 'p-4 rounded-[2rem]'
    };
    
    const iconSizes = {
        xs: 'w-3.5 h-3.5',
        sm: 'w-4 h-4',
        md: 'w-5 h-5',
        lg: 'w-6 h-6',
        xl: 'w-8 h-8'
    };

    const variants = {
        glass: 'bg-white/5 backdrop-blur-md border border-white/10 shadow-xl',
        soft: bgClass || 'bg-current/10',
        solid: bgClass || 'bg-current',
        ghost: 'bg-transparent border border-white/5'
    };

    const variantStyle = variants[variant] || variants.soft;

    return (
        <div 
            className={`
                shrink-0 flex items-center justify-center 
                transition-all duration-300
                ${sizes[size] || sizes.md} 
                ${variantStyle} 
                ${className}
            `}
        >
            <Icon className={`${iconSizes[size] || iconSizes.md} ${colorClass}`} />
        </div>
    );
};

export default IconBox;
