import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const Tooltip = ({ text, isVisible, targetRef }) => {
  const [coords, setCoords] = React.useState(null);
  const tooltipRef = React.useRef(null);

  React.useLayoutEffect(() => {
    if (isVisible && targetRef.current) {
      const targetRect = targetRef.current.getBoundingClientRect();
      const tooltipRect = tooltipRef.current
        ? tooltipRef.current.getBoundingClientRect()
        : { width: 80, height: 26 };

      let left = targetRect.left + targetRect.width / 2;

      // Position DOWN (below the element)
      let top = targetRect.bottom + 6;

      // Only flip up if overflowing bottom of the window
      if (top + (tooltipRect.height || 26) > window.innerHeight - 8) {
        top = Math.max(4, targetRect.top - (tooltipRect.height || 26) - 6);
      }

      // Clamp to screen edges
      const padding = 12;
      const halfW = (tooltipRect.width || 80) / 2;
      if (left - halfW < padding) {
        left = halfW + padding;
      } else if (left + halfW > window.innerWidth - padding) {
        left = window.innerWidth - halfW - padding;
      }

      setCoords({ top, left });
    } else {
      setCoords(null);
    }
  }, [isVisible, text]);

  if (!text) return null;

  return (
    <AnimatePresence>
      {isVisible && coords && (
        <motion.div
          ref={tooltipRef}
          initial={{ opacity: 0, scale: 0.92, y: -3 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: -3 }}
          transition={{ duration: 0.14, ease: [0.22, 1, 0.36, 1] }}
          className="fixed z-[1000000] pointer-events-none px-3.5 py-1 bg-white dark:bg-[#28282b] border border-black/10 dark:border-white/10 rounded-full shadow-[0_8px_24px_rgba(0,0,0,0.22)] flex items-center justify-center -translate-x-1/2"
          style={{
            top: coords.top,
            left: coords.left,
            zIndex: 1000000,
          }}
        >
          <span className="text-[11.5px] font-bold text-[#1d1d1f] dark:text-[#e8eaed] whitespace-nowrap tracking-tight">
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
  const enterTimerRef = React.useRef(null);

  const handleMouseEnter = () => {
    if (enterTimerRef.current) clearTimeout(enterTimerRef.current);
    enterTimerRef.current = setTimeout(() => {
      setIsVisible(true);
    }, 120);
  };

  const handleMouseLeave = () => {
    if (enterTimerRef.current) clearTimeout(enterTimerRef.current);
    setIsVisible(false);
  };

  React.useEffect(() => {
    return () => {
      if (enterTimerRef.current) clearTimeout(enterTimerRef.current);
    };
  }, []);

  return (
    <div
      className="relative flex items-center justify-center"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      ref={ref}
    >
      {children}
      <Tooltip text={text} isVisible={isVisible} targetRef={ref} />
    </div>
  );
};

export default Tooltip;
