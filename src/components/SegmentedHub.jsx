import React, { memo, useState, useEffect } from 'react';
import { 
  ChevronLeft, ChevronRight, RefreshCw, Search, Plus, 
  DownloadCloud, Bookmark, LayoutGrid, Maximize 
} from 'lucide-react';
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
  const [suggestions, setSuggestions] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  useEffect(() => {
    if (!isFocused) {
      setInputValue(activeTab?.url === 'about:blank' ? '' : activeTab?.url || '');
      setSuggestions([]);
      setSelectedIndex(-1);
    }
  }, [activeTab?.url, isFocused]);

  useEffect(() => {
    if (isFocused || inputValue.length > 0) return;
    const timer = setInterval(() => {
      setCommandIndex((prev) => (prev + 1) % COMMANDS.length);
    }, 3000);
    return () => clearInterval(timer);
  }, [isFocused, inputValue]);

  // Handle Chromium-style autocomplete
  useEffect(() => {
    if (!isFocused || !inputValue || inputValue.startsWith('http')) {
      setSuggestions([]);
      return;
    }

    const fetchSuggestions = async () => {
      try {
        const results = await window.orbit.ipcRenderer.invoke('tab:getSuggestions', inputValue);
        const processed = results.map(s => ({ type: 'search', text: s }));
        
        // Add "Go to URL" suggestion if it looks like one
        const isUrl = inputValue.includes('.') && !inputValue.includes(' ');
        if (isUrl) {
          processed.unshift({ type: 'url', text: inputValue });
        }
        
        setSuggestions(processed.slice(0, 8));
        setSelectedIndex(-1);
      } catch (e) {
        setSuggestions([]);
      }
    };

    const debounce = setTimeout(fetchSuggestions, 100);
    return () => clearTimeout(debounce);
  }, [inputValue, isFocused]);

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > -1 ? prev - 1 : -1));
    } else if (e.key === 'Escape') {
      setIsFocused(false);
      setSuggestions([]);
    } else if (e.key === 'Enter') {
      if (selectedIndex >= 0 && suggestions[selectedIndex]) {
        e.preventDefault();
        onNavigate(suggestions[selectedIndex].text);
        setIsFocused(false);
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const finalValue = (selectedIndex >= 0 && suggestions[selectedIndex]) 
      ? suggestions[selectedIndex].text 
      : inputValue;
    onNavigate(finalValue);
    setIsFocused(false);
    e.target.querySelector('input').blur();
  };

  const showPlaceholder = !isFocused && inputValue.length === 0;

  return (
    <div className={`segmented-hub group no-drag transition-all duration-500 ease-[cubic-bezier(0.2,0,0,1)] relative ${
      isFocused ? 'w-180 h-12 bg-white shadow-2xl' : 'w-140 h-10'
    } ${!isVisible && !isFocused ? 'segmented-hub-hidden' : ''}`}>
      {activeTab?.isLoading && (
        <div className="absolute bottom-0 left-0 w-full h-0.5 bg-orbit-accent animate-pulse z-10 rounded-b-[10px]" />
      )}
      
      <div className="w-20 flex items-center gap-2 pl-2">
        <button 
          onClick={onBack}
          disabled={!activeTab?.canGoBack}
          className="p-1.5 rounded-lg hover:bg-black/5 text-black/60 hover:text-black disabled:opacity-20 transition-colors"
        >
          <ChevronLeft size={20} />
        </button>
        <button 
          onClick={onForward}
          disabled={!activeTab?.canGoForward}
          className="p-1.5 rounded-lg hover:bg-black/5 text-black/60 hover:text-black disabled:opacity-20 transition-colors"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex-1 flex items-center h-full px-4 relative">
        <div className="absolute left-4 opacity-40">
          <Search size={17} className={isFocused ? 'text-orbit-accent opacity-100' : ''} />
        </div>
        <input
          type="text"
          value={selectedIndex >= 0 ? suggestions[selectedIndex].text : inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            setSelectedIndex(-1);
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 200)}
          className={`bg-transparent border-none outline-none w-full pl-7 text-[14px] text-black/90 z-10 transition-all duration-300 ${
            isFocused ? 'text-left font-medium' : 'text-center font-medium opacity-70'
          }`}
          spellCheck={false}
          autoComplete="off"
          style={{ letterSpacing: '-0.01em', fontFamily: 'Satoshi, sans-serif' }}
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
                className="text-[13px] font-medium text-[#989898] pl-7"
                style={{ letterSpacing: '-0.02em', fontFamily: 'Satoshi, sans-serif' }}
              >
                {COMMANDS[commandIndex]}
              </motion.span>
            )}
          </AnimatePresence>
        </div>


        {/* Chromium-style Dropdown */}
        <AnimatePresence>
          {isFocused && suggestions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              className="absolute top-[calc(100%+8px)] -left-4 -right-4 bg-white border border-black/5 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-3xl z-2000"
            >
              <div className="py-2">
                {suggestions.map((item, index) => (
                  <div
                    key={index}
                    onClick={() => {
                      onNavigate(item.text);
                      setIsFocused(false);
                    }}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={`px-6 py-3 flex items-center gap-4 cursor-pointer transition-colors ${
                      selectedIndex === index ? 'bg-black/5' : 'bg-transparent'
                    }`}
                  >
                    <div className={`opacity-40 ${selectedIndex === index ? 'opacity-100 text-orbit-accent' : ''}`}>
                      {item.type === 'url' ? <Plus size={14} /> : <Search size={14} />}
                    </div>
                    <div className="flex flex-col">
                      <span className={`text-[14px] ${selectedIndex === index ? 'font-bold' : 'font-medium'}`}>
                        {item.text}
                      </span>
                      {item.type === 'url' && (
                        <span className="text-[10px] uppercase tracking-widest opacity-40 font-bold">Go to Website</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </form>

      <div className="flex items-center justify-end gap-3 px-2">
        <button 
          onClick={activeTab?.isLoading ? onStop : onReload}
          className="p-1.5 rounded-md hover:bg-black/5 text-black/60 hover:text-black transition-colors"
        >
          <RefreshCw size={17} className={activeTab?.isLoading ? 'animate-spin' : ''} />
        </button>
        <div className="w-px h-4 bg-black/10 mx-1" />
        
        <button 
          onClick={onToggleOverview}
          className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-black/5 text-black/60 hover:text-black transition-all relative"
        >
          <div className="w-4.5 h-4.5 border-[1.5px] border-current rounded-sm flex items-center justify-center">
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
