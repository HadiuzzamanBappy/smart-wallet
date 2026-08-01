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
  className = '',
  block = false
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
    top: 'top-full left-1/2 -translate-x-1/2 border-t-white/95 dark:border-t-stone-900/90',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-white/95 dark:border-b-stone-900/90',
    left: 'left-full top-1/2 -translate-y-1/2 border-l-white/95 dark:border-l-stone-900/90',
    right: 'right-full top-1/2 -translate-y-1/2 border-r-white/95 dark:border-r-stone-900/90',
  };

  return (
    <div
      className={`relative ${block ? 'block' : 'inline-block'} ${className}`}
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
            <div className="bg-white/95 dark:bg-stone-900/90 text-stone-800 dark:text-stone-200 px-3 py-2 rounded-xl shadow-2xl border border-stone-200 dark:border-stone-800/50 backdrop-blur-xl min-w-[180px] max-w-[240px]">
              <div className="text-nano leading-relaxed ">
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
