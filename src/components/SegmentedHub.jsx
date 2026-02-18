import React, { memo, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const COMMANDS = [
  "Ask Orbit to plan your trip...",
  "Summarize this article instantly...",
  "Search, command, or explore...",
  "Type a goal, not just a URL..."
];

const SegmentedHub = memo(({
  activeTab,
  onNavigate,
  onBack,
  onForward,
  onReload,
  onStop,
  isVisible = true,
  onToggleOverview,
  tabCount = 1
}) => {
  const [inputValue, setInputValue] = useState(activeTab?.url || '');
  const [isFocused, setIsFocused] = useState(false);
  const [commandIndex, setCommandIndex] = useState(0);

  useEffect(() => {
    if (!isFocused) {
      setInputValue(activeTab?.url === 'about:blank' ? '' : activeTab?.url || '');
    }
  }, [activeTab?.url, isFocused]);

  useEffect(() => {
    if (isFocused || inputValue.length > 0) return;

    const timer = setInterval(() => {
      setCommandIndex((prev) => (prev + 1) % COMMANDS.length);
    }, 3000);

    return () => clearInterval(timer);
  }, [isFocused, inputValue]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onNavigate(inputValue);
    e.target.querySelector('input').blur();
  };

  const showPlaceholder = !isFocused && inputValue.length === 0;

  return (
    <div className={`segmented-hub group no-drag ${!isVisible && !isFocused ? 'segmented-hub-hidden' : ''}`}>
      {activeTab?.isLoading && (
        <div className="loading-line absolute top-0 left-0 w-full animate-pulse" />
      )}
      
      <div className="w-20 flex items-center gap-2">
        <button 
          onClick={onBack}
          disabled={!activeTab?.canGoBack}
          className="p-1 rounded-md hover:bg-black/5 text-black/60 hover:text-black disabled:opacity-24 transition-colors"
        >
          <ChevronLeft size={14} />
        </button>
        <button 
          onClick={onForward}
          disabled={!activeTab?.canGoForward}
          className="p-1 rounded-md hover:bg-black/5 text-black/60 hover:text-black disabled:opacity-24 transition-colors"
        >
          <ChevronRight size={14} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex-1 flex items-center h-full px-4 relative">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className={`bg-transparent border-none outline-none w-full text-[13px] text-black/80 z-10 transition-all duration-300 ${
            isFocused || inputValue.length > 0 ? 'text-left font-bold' : 'text-center font-medium'
          }`}
          spellCheck={false}
          style={{ letterSpacing: '-0.02em', fontFamily: 'Satoshi, sans-serif' }}
        />
        
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <AnimatePresence mode="wait">
            {showPlaceholder && (
              <motion.span
                key={commandIndex}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
                className="text-[13px] font-medium text-[#989898]"
                style={{ letterSpacing: '-0.02em', fontFamily: 'Satoshi, sans-serif' }}
              >
                {COMMANDS[commandIndex]}
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </form>

      <div className="w-32 flex items-center justify-end gap-2">
        <button 
          onClick={activeTab?.isLoading ? onStop : onReload}
          className="p-1.5 rounded-md hover:bg-black/5 text-black/60 hover:text-black transition-colors"
        >
          <RefreshCw size={14} className={activeTab?.isLoading ? 'animate-spin' : ''} />
        </button>
        <div className="w-[1px] h-4 bg-black/10 mx-1" />
        <button 
          onClick={onToggleOverview}
          className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-black/5 text-black/60 hover:text-black transition-all relative"
        >
          <div className="w-[18px] h-[18px] border-[1.5px] border-current rounded-[4px] flex items-center justify-center">
            <span className="text-[9px] font-bold leading-none translate-y-[0.5px]">
              {tabCount || 1}
            </span>
          </div>
        </button>
      </div>
    </div>
  );
});

export default memo(SegmentedHub);
