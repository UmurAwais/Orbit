import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const Tooltip = ({ text, isVisible, targetRef }) => {
  const [coords, setCoords] = React.useState({ top: 0, left: 0 });
  const tooltipRef = React.useRef(null);

  React.useLayoutEffect(() => {
    if (isVisible && targetRef.current && tooltipRef.current) {
      const targetRect = targetRef.current.getBoundingClientRect();
      const tooltipRect = tooltipRef.current.getBoundingClientRect();
      
      let left = targetRect.left + targetRect.width / 2;
      let top = targetRect.bottom + 6;

      // Clamp to screen edges
      const padding = 12;
      if (left - tooltipRect.width / 2 < padding) {
        left = tooltipRect.width / 2 + padding;
      } else if (left + tooltipRect.width / 2 > window.innerWidth - padding) {
        left = window.innerWidth - tooltipRect.width / 2 - padding;
      }

      setCoords({ top, left });
    }
  }, [isVisible, text]);

  if (!text) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          ref={tooltipRef}
          initial={{ opacity: 0, scale: 0.9, y: -2 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: -2 }}
          transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
          className="fixed z-[1000000] pointer-events-none px-4 py-1.5 bg-white dark:bg-[#2c2c2e] border border-black/10 dark:border-white/10 rounded-full shadow-[0_12px_36px_rgba(0,0,0,0.15)] flex items-center justify-center -translate-x-1/2"
          style={{
            top: coords.top,
            left: coords.left,
          }}
        >
          <span className="text-[12px] font-bold text-[#1d1d1f] dark:text-white/95 whitespace-nowrap tracking-tight">
            {text}
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export const TooltipWrapper = ({ text, children }) => {
  const [isVisible, setIsVisible] = React.useState(false);
  const ref = React.useRef(null);

  return (
    <div 
      className="relative flex items-center justify-center" 
      onMouseEnter={() => setIsVisible(true)} 
      onMouseLeave={() => setIsVisible(false)}
      ref={ref}
    >
      {children}
      <Tooltip text={text} isVisible={isVisible} targetRef={ref} />
    </div>
  );
};

export default Tooltip;
