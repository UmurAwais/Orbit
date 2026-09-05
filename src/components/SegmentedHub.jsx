import React, { memo, useState, useEffect, useMemo, useRef } from 'react';
import { 
  Search, X, Lock, Bookmark, Share, Check, Globe
} from 'lucide-react';

import { motion, AnimatePresence } from 'framer-motion';
import { TooltipWrapper } from './Tooltip';

const COMMANDS = [
  "Ask Orbit to plan your trip...",
  "Summarize this article instantly...",
  "Search, command, or explore...",
  "Type a goal, not just a URL..."
];

const SegmentedHub = memo(({
  activeTab,
  onNavigate,
  onAddTab,
  isVisible = true,
  tabCount = 1,
  bookmarks = [],
  onUpdateBookmarks,
  onFocusChange,
  historyItems = [],
}) => {
  const [inputValue, setInputValue] = useState(activeTab?.url || '');
  const [isFocused, setIsFocused] = useState(false);
  const [commandIndex, setCommandIndex] = useState(0);
  const [suggestions, setSuggestions] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [copied, setCopied] = useState(false);
  const inputRef = useRef(null);

  const handleCopyUrl = async () => {
    try { await navigator.clipboard.writeText(activeTab?.url || ''); } catch {}
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  useEffect(() => {
    const focus = () => {
      setIsFocused(true);
      setTimeout(() => {
        const input = document.querySelector('.nexus-hub-input');
        if (input) {
          input.focus();
          input.select();
        }
      }, 50);
    };
    window.addEventListener('orbit:focus-url', focus);
    return () => window.removeEventListener('orbit:focus-url', focus);
  }, []);


  useEffect(() => {
    if (!isFocused) {
      setInputValue(activeTab?.url === 'about:blank' ? '' : activeTab?.url || '');
      setSuggestions([]);
      setSelectedIndex(-1);
    }
  }, [activeTab?.url, isFocused]);

  const isPinned = useMemo(() => {
    if (!activeTab?.url || activeTab.url === 'about:blank') return false;
    return bookmarks.some(b => b.url === activeTab.url);
  }, [bookmarks, activeTab?.url]);

  const toggleBookmark = () => {
    if (!activeTab?.url || activeTab.url === 'about:blank') return;
    if (isPinned) {
      onUpdateBookmarks(bookmarks.filter(b => b.url !== activeTab.url));
    } else {
      onUpdateBookmarks([...bookmarks, {
        id: Date.now().toString(),
        title: activeTab.title || 'New Bookmark',
        url: activeTab.url
      }]);
    }
  };

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
        
        const isUrl = inputValue.includes('.') && !inputValue.includes(' ');
        if (isUrl) {
          processed.unshift({ type: 'url', text: inputValue });
        }
        
        const newSuggestions = processed.slice(0, 8);
        setSuggestions(newSuggestions);
        setSelectedIndex(-1);
        // Dynamically compute how far the dropdown extends:
        // header(80) + gap(8) + bar(32) + rows(count × 48px) + padding(16)
        if (newSuggestions.length > 0) {
          const dynamicBottom = 80 + 8 + 32 + newSuggestions.length * 48 + 16;
          window.orbit?.ipcRenderer?.send('ui:dropdown-toggle', { isOpen: true, dropdownBottom: dynamicBottom });
        }
      } catch (e) {
        setSuggestions([]);
        window.orbit?.ipcRenderer?.send('ui:dropdown-toggle', { isOpen: false, dropdownBottom: 0 });
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
      window.orbit?.ipcRenderer?.send('ui:dropdown-toggle', { isOpen: false, dropdownBottom: 0 });
    } else if (e.key === 'Enter') {
      if (selectedIndex >= 0 && suggestions[selectedIndex]) {
        e.preventDefault();
        onNavigate(suggestions[selectedIndex].text);
        setIsFocused(false);
        setSuggestions([]);
        window.orbit?.ipcRenderer?.send('ui:dropdown-toggle', { isOpen: false, dropdownBottom: 0 });
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
    onFocusChange?.(false);
    setSuggestions([]);
    window.orbit?.ipcRenderer?.send('ui:dropdown-toggle', { isOpen: false, dropdownBottom: 0 });
    e.target.querySelector('input')?.blur();
  };

  const showPlaceholder = !isFocused && inputValue.length === 0;

  // Safari style: Show only domain when not focused
  const displayUrl = useMemo(() => {
    if (isFocused || !activeTab?.url || activeTab.url === 'about:blank') return inputValue;
    try {
      const urlObject = new URL(activeTab.url);
      return urlObject.hostname;
    } catch (e) {
      return activeTab.url;
    }
  }, [activeTab?.url, isFocused, inputValue]);

  return (
    <div className={`nexus-hub group no-drag relative w-full ${!isVisible && !isFocused ? 'opacity-0' : 'opacity-100'} ${isFocused ? 'focused' : ''}`}>

      <form onSubmit={handleSubmit} className="flex-1 flex items-center h-full relative min-w-0">
        {/* Visual URL Display (Centered with Icon when unfocused) */}
        {!isFocused && activeTab?.url && activeTab.url !== 'about:blank' && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20 gap-1.5 px-3">
             <Lock size={11} className="text-nexus-text opacity-50 stroke-[2.5]" />
             <AnimatePresence mode="wait">
               <motion.span 
                 key={displayUrl}
                 initial={{ opacity: 0, y: 3 }}
                 animate={{ opacity: 0.9, y: 0 }}
                 exit={{ opacity: 0, y: -3 }}
                 transition={{ duration: 0.25, ease: "easeOut" }}
                 className="text-[13px] font-medium text-nexus-text truncate max-w-[80%]"
               >
                 {displayUrl}
               </motion.span>
             </AnimatePresence>
          </div>
        )}

        {/* Search Icon when focused */}
        {isFocused && (
          <Search size={14} className="text-orbit-accent ml-3 mr-1 shrink-0 opacity-80 pointer-events-none" />
        )}

        <input
          ref={inputRef}
          type="text"
          value={selectedIndex >= 0 ? suggestions[selectedIndex].text : (isFocused ? inputValue : displayUrl)}
          onChange={(e) => {
            setInputValue(e.target.value);
            setSelectedIndex(-1);
          }}
          onKeyDown={handleKeyDown}
          onFocus={(e) => {
            setIsFocused(true);
            onFocusChange?.(true);
            e.target.select();
          }}
          onBlur={() => {
            setTimeout(() => {
              setIsFocused(false);
              setSuggestions([]);
              onFocusChange?.(false);
              window.orbit?.ipcRenderer?.send('ui:dropdown-toggle', { isOpen: false, dropdownBottom: 0 });
            }, 200);
          }}
          className={`nexus-hub-input bg-transparent border-none outline-none w-full text-[13px] text-nexus-text z-10 font-medium ${
            isFocused ? 'text-left pl-1.5 pr-2' : 'text-center text-transparent'
          }`}
          placeholder={isFocused ? "Search or enter address" : ""}
          spellCheck={false}
          autoComplete="off"
          style={{ letterSpacing: '-0.01em' }}
        />
        
        {/* Clear Button when typing */}
        {isFocused && inputValue.length > 0 && (
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              setInputValue('');
              inputRef.current?.focus();
            }}
            className="w-5 h-5 flex items-center justify-center rounded-full hover:bg-black/10 dark:hover:bg-white/15 text-nexus-text opacity-50 hover:opacity-100 mr-2 shrink-0 transition-all cursor-pointer z-20"
            title="Clear"
          >
            <X size={11} strokeWidth={2.5} />
          </button>
        )}

        {/* Orbit Placeholder */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none top-1/2 -translate-y-1/2 h-full">
          <AnimatePresence mode="wait">
            {showPlaceholder && (
              <motion.span
                key={commandIndex}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="text-[12px] font-medium text-nexus-text-dim text-center"
                style={{ letterSpacing: '-0.02em' }}
              >
                {COMMANDS[commandIndex]}
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        {/* Chromium-style Dropdown */}
        {isFocused && suggestions.length > 0 && (
          <div className="absolute top-[calc(100%+6px)] left-0 right-0 bg-nexus-hub-bg border border-nexus-border rounded-xl shadow-[0_12px_36px_rgba(0,0,0,0.35)] overflow-hidden backdrop-blur-3xl z-5000">
            <div className="py-1.5 px-1">
              {suggestions.map((item, index) => (
                <div
                  key={index}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    onNavigate(item.text);
                    setIsFocused(false);
                    setSuggestions([]);
                    window.orbit?.ipcRenderer?.send('ui:dropdown-toggle', { isOpen: false, dropdownBottom: 0 });
                  }}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`px-3 py-2 rounded-lg flex items-center gap-3 cursor-pointer transition-colors ${
                    selectedIndex === index ? 'bg-nexus-tab-active' : 'hover:bg-white/5 bg-transparent'
                  }`}
                >
                  <div className={`opacity-40 text-nexus-text ${selectedIndex === index ? 'opacity-100 text-nexus-accent' : ''}`}>
                    {item.type === 'url' ? <Globe size={14} /> : <Search size={14} />}
                  </div>
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className={`text-[13px] text-nexus-text truncate ${selectedIndex === index ? 'font-semibold text-nexus-accent' : 'font-medium'}`}>
                      {item.text}
                    </span>
                    {item.type === 'url' && (
                      <span className="text-[9px] uppercase tracking-widest opacity-40 font-bold text-nexus-text-dim">Go to Website</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </form>

      {/* Trailing Utility Pod - Appears when searching or on a website */}
      <AnimatePresence>
        {!isFocused && activeTab?.url && activeTab.url !== 'about:blank' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.15 }}
            className="flex items-center gap-0.5 pr-2 z-10 no-drag"
          >
            <TooltipWrapper text={isPinned ? "Remove Bookmark" : "Bookmark this page"}>
              <button 
                type="button" 
                onClick={toggleBookmark}
                className={`w-7 h-7 flex items-center justify-center rounded-full hover:bg-nexus-text/5 transition-all cursor-pointer ${isPinned ? 'text-orbit-accent opacity-100' : 'text-nexus-text opacity-70 hover:opacity-100'}`}
              >
                <Bookmark size={13} strokeWidth={2.5} className={isPinned ? 'fill-current' : ''} />
              </button>
            </TooltipWrapper>
            
            {/* Share / Copy URL */}
            <TooltipWrapper text={copied ? 'Copied!' : 'Copy URL'}>
              <button
                type="button"
                onClick={handleCopyUrl}
                className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-nexus-text/5 text-nexus-text opacity-70 hover:opacity-100 transition-all cursor-pointer"
              >
                {copied ? <Check size={13} strokeWidth={2.5} className="text-emerald-500" /> : <Share size={13} strokeWidth={2.5} />}
              </button>
            </TooltipWrapper>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute inset-0 pointer-events-none rounded-[8px] overflow-hidden z-20" style={{ transform: 'translateZ(0)' }}>
        <AnimatePresence>
          {activeTab?.isLoading && (
            <motion.div
              initial={{ width: "5%", opacity: 1 }}
              animate={{ width: "85%", opacity: 1 }}
              exit={{ width: "100%", opacity: 0 }}
              transition={{ width: { duration: 4, ease: "easeOut" }, opacity: { duration: 0.3 } }}
              className="absolute bottom-0 left-0 h-[2.5px] bg-orbit-accent"
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
});

export default memo(SegmentedHub);
