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
    try { await navigator.clipboard.writeText(activeTab?.url || ''); } catch { }
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
        const results = (await window.orbit?.ipcRenderer?.invoke('tab:getSuggestions', inputValue)) || [];
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

  // URL display when not focused
  const displayUrl = useMemo(() => {
    if (!activeTab?.url || activeTab.url === 'about:blank') return '';
    try {
      const urlObject = new URL(activeTab.url);
      if (urlObject.protocol === 'http:' || urlObject.protocol === 'https:') {
        const path = (urlObject.pathname === '/' || !urlObject.pathname) ? '' : urlObject.pathname;
        const search = urlObject.search || '';
        return urlObject.hostname + path + search;
      }
      return activeTab.url;
    } catch (e) {
      return activeTab.url;
    }
  }, [activeTab?.url]);

  return (
    <div
      onClick={() => {
        setIsFocused(true);
        inputRef.current?.focus();
        inputRef.current?.select();
      }}
      className={`nexus-hub group no-drag relative w-full ${!isVisible && !isFocused ? 'opacity-0' : 'opacity-100'} ${isFocused ? 'focused' : ''}`}
    >
      {/* Left Icon: Lock when browsing website, Search when typing or on New Tab */}
      <div className="flex items-center justify-center shrink-0 mr-2 pointer-events-none text-nexus-text">
        {!isFocused && activeTab?.url && activeTab.url !== 'about:blank' ? (
          <Lock size={12} className="opacity-50 stroke-[2.2]" />
        ) : (
          <Search size={12.5} className="opacity-45 stroke-[2.2]" />
        )}
      </div>

      {/* Main input & form container */}
      <form onSubmit={handleSubmit} className="flex-1 flex items-center h-full relative min-w-0">
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
          className="nexus-hub-input bg-transparent border-none outline-none w-full text-[12.5px] text-nexus-text font-normal text-center truncate"
          placeholder={isFocused ? "Search Google or enter address" : ""}
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
            className="w-4 h-4 flex items-center justify-center rounded-full hover:bg-black/10 dark:hover:bg-white/15 text-nexus-text opacity-40 hover:opacity-100 mr-1 shrink-0 transition-all cursor-pointer z-20"
            title="Clear"
          >
            <X size={11} strokeWidth={2.4} />
          </button>
        )}

        {/* Animated Rotating Placeholder when on New Tab and not focused */}
        {showPlaceholder && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <AnimatePresence mode="wait">
              <motion.span
                key={commandIndex}
                initial={{ opacity: 0, y: 2 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -2 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="text-[12px] font-normal text-nexus-text-dim opacity-50 truncate text-center"
                style={{ letterSpacing: '-0.01em' }}
              >
                {COMMANDS[commandIndex]}
              </motion.span>
            </AnimatePresence>
          </div>
        )}

        {/* Dropdown Suggestions matching New Tab style */}
        {isFocused && suggestions.length > 0 && (
          <div className="nexus-hub-dropdown">
            <div className="py-1.5 px-1.5">
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
                  className={`nexus-hub-dropdown-row ${selectedIndex === index ? 'active' : ''}`}
                >
                  <div className={`nexus-hub-dropdown-icon ${selectedIndex === index ? 'active' : ''}`}>
                    {item.type === 'url' ? <Globe size={14} /> : <Search size={14} />}
                  </div>
                  <div className="flex items-center justify-between min-w-0 flex-1 gap-2">
                    <span className="nexus-hub-dropdown-text truncate">
                      {item.text}
                    </span>
                    {item.type === 'url' && (
                      <span className="nexus-hub-dropdown-badge">Visit</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </form>

      {/* Trailing Utility Pod - Appears when on a website */}
      <AnimatePresence>
        {!isFocused && activeTab?.url && activeTab.url !== 'about:blank' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.15 }}
            className="flex items-center gap-0.5 pl-1.5 shrink-0 z-10 no-drag"
          >
            <TooltipWrapper text={isPinned ? "Remove Bookmark" : "Bookmark this tab"}>
              <button
                type="button"
                onClick={toggleBookmark}
                className={`w-6 h-6 flex items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-all cursor-pointer ${isPinned ? 'text-orbit-accent opacity-100' : 'text-nexus-text opacity-60 hover:opacity-100'}`}
              >
                <Bookmark size={12} strokeWidth={2.2} className={isPinned ? 'fill-current' : ''} />
              </button>
            </TooltipWrapper>

            {/* Share / Copy URL */}
            <TooltipWrapper text={copied ? 'Copied!' : 'Copy URL'}>
              <button
                type="button"
                onClick={handleCopyUrl}
                className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-nexus-text opacity-60 hover:opacity-100 transition-all cursor-pointer"
              >
                {copied ? <Check size={12} strokeWidth={2.2} className="text-emerald-500" /> : <Share size={12} strokeWidth={2.2} />}
              </button>
            </TooltipWrapper>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading Progress Bar */}
      <div className="absolute inset-0 pointer-events-none rounded-full overflow-hidden z-20" style={{ transform: 'translateZ(0)' }}>
        <AnimatePresence>
          {activeTab?.isLoading && (
            <motion.div
              initial={{ width: "5%", opacity: 1 }}
              animate={{ width: "85%", opacity: 1 }}
              exit={{ width: "100%", opacity: 0 }}
              transition={{ width: { duration: 4, ease: "easeOut" }, opacity: { duration: 0.3 } }}
              className="absolute bottom-0 left-0 h-[2px] bg-orbit-accent"
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
});

export default memo(SegmentedHub);
