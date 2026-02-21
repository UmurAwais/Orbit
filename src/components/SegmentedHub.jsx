import React, { memo, useState, useEffect, useMemo } from 'react';
import { 
  Plus, Search, X, Lock, Shield, RefreshCw, Share, MoreHorizontal, ChevronDown,
  ChevronLeft, ChevronRight, Bookmark, ShieldCheck
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
  isVisible = true,
  tabCount = 1,
  bookmarks = [],
  onUpdateBookmarks,
  onFocusChange,
}) => {
  const [inputValue, setInputValue] = useState(activeTab?.url || '');
  const [isFocused, setIsFocused] = useState(false);
  const [commandIndex, setCommandIndex] = useState(0);
  const [suggestions, setSuggestions] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [shieldHovered, setShieldHovered] = useState(false);

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
        // header(92) + gap(8) + bar(32) + rows(count × 48px) + padding(16)
        if (newSuggestions.length > 0) {
          const dynamicBottom = 92 + 8 + 32 + newSuggestions.length * 48 + 16;
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
    setSuggestions([]);
    window.orbit?.ipcRenderer?.send('ui:dropdown-toggle', { isOpen: false, dropdownBottom: 0 });
    e.target.querySelector('input').blur();
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
    <div className={`nexus-hub group no-drag relative w-full ${!isVisible && !isFocused ? 'opacity-0' : 'opacity-100'}`}>
      
      {/* 1. Interior Navigation (Integrated arrows) */}
      <div className="nexus-hub-inner-nav no-drag">
        <button 
           onClick={() => window.orbit.tabs.goBack({ id: activeTab?.id })}
           disabled={!activeTab?.canGoBack}
           className="nexus-hub-nav-btn disabled:opacity-30 text-orbit-text"
        >
          <ChevronLeft size={16} strokeWidth={2.5} />
        </button>
        <button 
           onClick={() => window.orbit.tabs.goForward({ id: activeTab?.id })}
           disabled={!activeTab?.canGoForward}
           className="nexus-hub-nav-btn disabled:opacity-30 text-orbit-text"
        >
          <ChevronRight size={16} strokeWidth={2.5} />
        </button>
      </div>

      {/* Premium Privacy Indicator - Apple Safari Style */}
      <div className="relative ml-1">
        <button
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-emerald-500/5 transition-all duration-300"
          onMouseEnter={() => { setShieldHovered(true); onFocusChange?.(true); }}
          onMouseLeave={() => { setShieldHovered(false); onFocusChange?.(false); }}
        >
          <ShieldCheck size={16} strokeWidth={2.2} className={`text-emerald-500 transition-transform duration-200 ${shieldHovered ? 'scale-110' : ''}`} />
        </button>
        {shieldHovered && (
          <div
            className="absolute left-1/2 -translate-x-1/2 z-[99999] pointer-events-none"
            style={{ top: 'calc(100% + 10px)', minWidth: '220px', maxWidth: '300px' }}
          >
            <div className="bg-white/90 dark:bg-[#1c1c1e]/90 backdrop-blur-xl border border-black/8 dark:border-white/10 rounded-2xl px-4 py-2.5 shadow-xl text-center">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <ShieldCheck size={12} className="text-emerald-500" strokeWidth={2.5} />
                <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">Anonymous & Secure</span>
              </div>
              <p className="text-[11px] text-nexus-text opacity-70 leading-snug">
                No account, no tracking — just Orbit. Pure speed.
              </p>
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex-1 flex items-center h-full relative">
        {/* Visual URL Display (Centered with Icon) */}
        {!isFocused && activeTab?.url && activeTab.url !== 'about:blank' && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20 gap-1.5">
             <Lock size={11} className="text-nexus-text opacity-50 stroke-[2.5]" />
             <span className="text-[13px] font-medium text-nexus-text opacity-90">{displayUrl}</span>
          </div>
        )}

        <input
          type="text"
          value={selectedIndex >= 0 ? suggestions[selectedIndex].text : (isFocused ? inputValue : displayUrl)}
          onChange={(e) => {
            setInputValue(e.target.value);
            setSelectedIndex(-1);
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            setIsFocused(true);
            onFocusChange?.(true);
          }}
          onBlur={() => {
            setTimeout(() => {
              setIsFocused(false);
              setSuggestions([]);
              onFocusChange?.(false);
              window.orbit?.ipcRenderer?.send('ui:dropdown-toggle', { isOpen: false, dropdownBottom: 0 });
            }, 200);
          }}
          className={`bg-transparent border-none outline-none w-full text-[13px] text-nexus-text z-10 font-medium ${
            isFocused ? 'text-left pl-4' : 'text-center text-transparent'
          }`}
          spellCheck={false}
          autoComplete="off"
          style={{ letterSpacing: '-0.01em' }}
        />
        
        {/* Orbit Placeholder */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none top-1/2 -translate-y-1/2 h-full">
          {showPlaceholder && (
            <span
              className="text-[12px] font-medium text-nexus-text-dim pl-7"
              style={{ letterSpacing: '-0.02em' }}
            >
              {COMMANDS[commandIndex]}
            </span>
          )}
        </div>

        {/* Chromium-style Dropdown */}
        {isFocused && suggestions.length > 0 && (
          <div className="absolute top-[calc(100%+8px)] -left-4 -right-4 bg-nexus-hub-bg border border-nexus-border rounded-2xl shadow-2xl overflow-hidden backdrop-blur-3xl z-5000">
            <div className="py-2">
              {suggestions.map((item, index) => (
                <div
                  key={index}
                  onClick={() => {
                    onNavigate(item.text);
                    setIsFocused(false);
                    setSuggestions([]);
                    window.orbit?.ipcRenderer?.send('ui:dropdown-toggle', { isOpen: false, dropdownBottom: 0 });
                  }}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`px-6 py-3 flex items-center gap-4 cursor-pointer transition-colors ${
                    selectedIndex === index ? 'bg-nexus-tab-active' : 'bg-transparent'
                  }`}
                >
                  <div className={`opacity-40 text-nexus-text ${selectedIndex === index ? 'opacity-100 text-nexus-accent' : ''}`}>
                    {item.type === 'url' ? <Plus size={14} /> : <Search size={14} />}
                  </div>
                  <div className="flex flex-col">
                    <span className={`text-[14px] text-nexus-text ${selectedIndex === index ? 'font-bold' : 'font-medium'}`}>
                      {item.text}
                    </span>
                    {item.type === 'url' && (
                      <span className="text-[10px] uppercase tracking-widest opacity-40 font-bold text-nexus-text-dim">Go to Website</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </form>

      {/* Trailing Utility Pod */}
      <div className="flex items-center gap-0.5 pr-2 z-10 no-drag">
        {!isFocused && activeTab?.url && activeTab.url !== 'about:blank' && (
          <>
            <button 
              type="button"
              onClick={(e) => { e.stopPropagation(); window.orbit.tabs.reload({ id: activeTab.id }); }}
              className={`w-7 h-7 flex items-center justify-center rounded-full hover:bg-nexus-text/5 text-nexus-text opacity-70 hover:opacity-100 transition-all ${activeTab?.isLoading ? 'opacity-100 text-nexus-accent' : ''}`}
              title="Reload Page"
            >
              <RefreshCw size={13} strokeWidth={2.5} className={activeTab?.isLoading ? 'animate-spin' : ''} />
            </button>

            <button 
              type="button" 
              onClick={toggleBookmark}
              className={`w-7 h-7 flex items-center justify-center rounded-full hover:bg-nexus-text/5 transition-all ${isPinned ? 'text-orbit-accent opacity-100' : 'text-nexus-text opacity-70 hover:opacity-100'}`}
              title={isPinned ? "Remove Bookmark" : "Bookmark this page"}
            >
              <Bookmark size={13} strokeWidth={2.5} className={isPinned ? 'fill-current' : ''} />
            </button>
          </>
        )}
        
        <button type="button" className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-nexus-text/5 text-nexus-text opacity-70 hover:opacity-100 transition-all">
          <Share size={13} strokeWidth={2.5} />
        </button>
        
        <div className="w-1" />
        
        <button type="button" className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-nexus-text/5 text-nexus-text opacity-70 hover:opacity-100 transition-all" data-orbit-tooltip="Menu">
          <MoreHorizontal size={15} strokeWidth={2.2} />
        </button>
      </div>

      {activeTab?.isLoading && (
        <div className="absolute bottom-0 left-0 w-full h-0.5 bg-orbit-accent animate-pulse z-20" />
      )}
    </div>
  );
});

export default memo(SegmentedHub);
