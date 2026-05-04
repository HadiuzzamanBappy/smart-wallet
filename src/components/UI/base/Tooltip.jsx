import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Premium Tooltip component with Framer Motion animations
 */
const Tooltip = ({ 
  children, 
  content, 
  position = 'top',
  delay = 0.3,
  className = ''
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [timeoutId, setTimeoutId] = useState(null);
  const MotionDiv = motion.div;

  const showTooltip = () => {
    const id = setTimeout(() => {
      setIsVisible(true);
    }, delay * 1000);
    setTimeoutId(id);
  };

  const hideTooltip = () => {
    if (timeoutId) clearTimeout(timeoutId);
    setIsVisible(false);
  };

  const positions = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  const arrowPositions = {
    top: 'top-full left-1/2 -translate-x-1/2 border-t-white dark:border-t-ink-950',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-white dark:border-b-ink-950',
    left: 'left-full top-1/2 -translate-y-1/2 border-l-white dark:border-l-ink-950',
    right: 'right-full top-1/2 -translate-y-1/2 border-r-white dark:border-r-ink-950',
  };

  return (
    <div 
      className="relative inline-block"
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
    >
      {children}
      <AnimatePresence>
        {isVisible && (
          <MotionDiv
            initial={{ opacity: 0, scale: 0.95, y: position === 'top' ? 5 : -5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: position === 'top' ? 5 : -5 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className={`absolute z-[100] ${positions[position]} ${className} pointer-events-none`}
          >
            <div className="bg-white dark:bg-ink-950 text-ink-900 dark:text-paper-50 px-3 py-2 rounded-xl shadow-2xl border border-paper-200 dark:border-white/10 backdrop-blur-xl min-w-[180px] max-w-[240px]">
              <div className="text-[11px] leading-relaxed font-medium">
                {content}
              </div>
              {/* Arrow */}
              <div className={`absolute w-0 h-0 border-4 border-transparent ${arrowPositions[position]}`} />
            </div>
          </MotionDiv>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Tooltip;
