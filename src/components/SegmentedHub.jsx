import React, { memo, useState, useEffect, useMemo } from 'react';
import { 
  Plus, Search, X, Lock, Shield, RefreshCw, Share, MoreHorizontal, ChevronDown,
  ChevronLeft, ChevronRight
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
    <div className={`nexus-hub group no-drag relative w-full overflow-hidden ${!isVisible && !isFocused ? 'opacity-0' : 'opacity-100'}`}>
      
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

      <form onSubmit={handleSubmit} className="flex-1 flex items-center h-full relative">
        <input
          type="text"
          value={selectedIndex >= 0 ? suggestions[selectedIndex].text : (isFocused ? inputValue : displayUrl)}
          onChange={(e) => {
            setInputValue(e.target.value);
            setSelectedIndex(-1);
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 200)}
          className={`bg-transparent border-none outline-none w-full text-[13px] text-nexus-text z-10 font-medium ${
            isFocused ? 'text-left pl-4' : 'text-center opacity-90'
          }`}
          spellCheck={false}
          autoComplete="off"
          style={{ letterSpacing: '-0.01em' }}
        />
        
        {/* Domain safe suffix (Only when not focused) */}
        {!isFocused && activeTab?.url && activeTab.url !== 'about:blank' && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
             <span className="text-[13px] font-medium text-nexus-text-dim ml-[180px]"> - safe</span>
          </div>
        )}
        
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
          <div className="absolute top-[calc(100%+8px)] -left-4 -right-4 bg-nexus-hub-bg border border-nexus-border rounded-2xl shadow-2xl overflow-hidden backdrop-blur-3xl z-2000">
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
          <button 
            type="button"
            onClick={(e) => { e.stopPropagation(); window.orbit.tabs.reload({ id: activeTab.id }); }}
            className={`w-7 h-7 flex items-center justify-center rounded-full hover:bg-nexus-text/5 text-nexus-text opacity-30 hover:opacity-100 transition-all ${activeTab?.isLoading ? 'opacity-100 text-nexus-accent' : ''}`}
            title="Reload Page"
          >
            <RefreshCw size={13} strokeWidth={2.5} className={activeTab?.isLoading ? 'animate-spin' : ''} />
          </button>
        )}
        
        <button type="button" className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-nexus-text/5 text-nexus-text opacity-30 hover:opacity-100 transition-all">
          <Share size={13} strokeWidth={2.5} />
        </button>
      </div>

      {activeTab?.isLoading && (
        <div className="absolute bottom-0 left-0 w-full h-0.5 bg-orbit-accent animate-pulse z-20" />
      )}
    </div>
  );
});

export default memo(SegmentedHub);
