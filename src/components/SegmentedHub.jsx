import React, { memo, useState, useEffect, useMemo, useRef } from 'react';
import {
  Search, X, Link, Check, Globe
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { TooltipWrapper } from './Tooltip';

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
  onSearchChange,
}) => {
  const isHome = !activeTab?.url || activeTab.url === 'about:blank';
  const [inputValue, setInputValue] = useState(isHome ? '' : activeTab?.url || '');
  const [isFocused, setIsFocused] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [copied, setCopied] = useState(false);
  const inputRef = useRef(null);

  // Sync active search query to parent for "Ask Orbit" button visibility
  useEffect(() => {
    const rawActiveUrl = isHome ? '' : activeTab?.url || '';
    const isSearching = isFocused && inputValue.trim().length > 0 && inputValue.trim() !== rawActiveUrl.trim();
    onSearchChange?.({ isSearching, query: isSearching ? inputValue.trim() : '' });
  }, [isFocused, inputValue, activeTab?.url, isHome, onSearchChange]);

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(activeTab?.url || '');
    } catch { }
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  // Listen for global focus events (e.g. Cmd/Ctrl+L)
  useEffect(() => {
    const focus = () => {
      setIsFocused(true);
      onFocusChange?.(true);
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          inputRef.current.select();
        }
      }, 50);
    };
    window.addEventListener('orbit:focus-url', focus);
    return () => window.removeEventListener('orbit:focus-url', focus);
  }, [onFocusChange]);

  // Reset input value when active tab changes and not focused
  useEffect(() => {
    if (!isFocused) {
      setInputValue(isHome ? '' : activeTab?.url || '');
      setSuggestions([]);
      setSelectedIndex(-1);
    }
  }, [activeTab?.url, isHome, isFocused]);

  // Autocomplete suggestions
  useEffect(() => {
    if (!isFocused || !inputValue || inputValue.startsWith('http')) {
      if (!inputValue) setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const query = inputValue.trim();
        const results = [];

        // Match against history
        const historyMatches = historyItems
          .filter(h => (h.url?.toLowerCase().includes(query.toLowerCase()) || h.title?.toLowerCase().includes(query.toLowerCase())))
          .slice(0, 2)
          .map(h => ({ text: h.url, type: 'history' }));
        results.push(...historyMatches);

        // Fetch Google Autocomplete
        const res = await fetch(`https://suggestqueries.google.com/complete/search?client=chrome&q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = await res.json();
          const googleSuggestions = (data[1] || []).slice(0, 4).map(s => ({ text: s, type: 'search' }));
          results.push(...googleSuggestions);
        }

        // Add domain direct completion
        if (query.includes('.') && !query.includes(' ') && !results.some(r => r.text === query)) {
          results.unshift({ text: query.startsWith('http') ? query : `https://${query}`, type: 'url' });
        }

        setSuggestions(results);
      } catch { }
    }, 150);

    return () => clearTimeout(timer);
  }, [inputValue, isFocused, historyItems]);

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > -1 ? prev - 1 : -1));
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsFocused(false);
      onFocusChange?.(false);
      onSearchChange?.({ isSearching: false, query: '' });
      setSuggestions([]);
      setSelectedIndex(-1);
      inputRef.current?.blur();
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const finalVal = selectedIndex >= 0 ? suggestions[selectedIndex].text : inputValue;
    if (finalVal) {
      onNavigate(finalVal);
    }
    setIsFocused(false);
    onFocusChange?.(false);
    onSearchChange?.({ isSearching: false, query: '' });
    setSuggestions([]);
    inputRef.current?.blur();
  };

  // Clean URL breakdown for borderless idle display
  const urlParts = useMemo(() => {
    if (isHome) return { host: '', path: '' };
    try {
      const urlObject = new URL(activeTab.url);
      const host = urlObject.hostname.replace(/^www\./, '');
      const path = (urlObject.pathname === '/' || !urlObject.pathname) ? '' : urlObject.pathname;
      const search = urlObject.search || '';
      return { host, path: path + search };
    } catch {
      return { host: activeTab.url, path: '' };
    }
  }, [activeTab?.url, isHome]);

  // When on New Tab and not actively focused/searching, do not render top search bar
  if (isHome && !isFocused) {
    return null;
  }

  return (
    <div className="relative w-full flex justify-center items-center">
      {/* ── Idle State: No BG, No Border, Just URL & Link Copy Icon ─────── */}
      {!isFocused && (
        <div
          onClick={() => {
            setIsFocused(true);
            onFocusChange?.(true);
            setTimeout(() => {
              inputRef.current?.focus();
              inputRef.current?.select();
            }, 30);
          }}
          className="group no-drag relative flex items-center justify-center gap-1.5 px-3 py-1 cursor-pointer select-none"
          title="Click to edit or search (Ctrl+L)"
        >
          {/* Centered Domain Text (No BG, No Border) */}
          <span className="text-[13px] font-medium text-nexus-text/85 group-hover:text-nexus-text tracking-tight truncate select-none transition-colors">
            {urlParts.host || activeTab?.url}
          </span>

          {/* Just the Link icon for 1-Click Copy */}
          <TooltipWrapper text={copied ? 'Copied!' : 'Copy URL'} position="top">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleCopyUrl();
              }}
              className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-black/10 dark:hover:bg-white/15 text-nexus-text opacity-50 hover:opacity-100 transition-all cursor-pointer active:scale-95"
            >
              {copied ? (
                <Check size={13} strokeWidth={2.4} className="text-emerald-500" />
              ) : (
                <Link size={13} strokeWidth={2.2} />
              )}
            </button>
          </TooltipWrapper>
        </div>
      )}

      {/* ── Active Search / Edit Mode ───────────────────────────────────── */}
      {isFocused && (
        <div className="relative w-full h-[32px] rounded-full bg-white dark:bg-[#1e1e21] border border-black/15 dark:border-white/20 ring-2 ring-black/5 dark:ring-white/10 shadow-[0_4px_20px_rgba(0,0,0,0.12)] flex items-center px-3 no-drag">
          {/* Left Search Icon */}
          <div className="flex items-center justify-center shrink-0 mr-2 pointer-events-none text-nexus-text opacity-50">
            <Search size={13.5} strokeWidth={2.2} />
          </div>

          {/* Main editable input & form container */}
          <form onSubmit={handleSubmit} className="flex-1 flex items-center h-full relative min-w-0">
            <input
              ref={inputRef}
              type="text"
              value={selectedIndex >= 0 ? suggestions[selectedIndex].text : inputValue}
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
                }, 200);
              }}
              className="bg-transparent border-none outline-none w-full text-[13px] text-nexus-text font-normal text-left truncate placeholder:text-nexus-text/40"
              placeholder="Search Google or enter URL..."
              spellCheck={false}
              autoComplete="off"
            />

            {/* Clear Button when typing */}
            {inputValue.length > 0 && (
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  setInputValue('');
                  inputRef.current?.focus();
                }}
                className="w-5 h-5 flex items-center justify-center rounded-full hover:bg-black/10 dark:hover:bg-white/15 text-nexus-text opacity-40 hover:opacity-100 mr-0.5 shrink-0 transition-all cursor-pointer z-20"
                title="Clear"
              >
                <X size={12} strokeWidth={2.4} />
              </button>
            )}

            {/* Dropdown Suggestions */}
            {suggestions.length > 0 && (
              <div className="nexus-hub-dropdown" style={{ zIndex: 60000 }}>
                <div className="py-1.5 px-1.5">
                  {suggestions.map((item, index) => (
                    <div
                      key={index}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        onNavigate(item.text);
                        setIsFocused(false);
                        onFocusChange?.(false);
                        onSearchChange?.({ isSearching: false, query: '' });
                        setSuggestions([]);
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
        </div>
      )}

      {/* Loading Progress Bar */}
      <div className="absolute inset-x-0 bottom-0 pointer-events-none overflow-hidden z-20">
        <AnimatePresence>
          {activeTab?.isLoading && (
            <motion.div
              initial={{ width: "5%", opacity: 1 }}
              animate={{ width: "85%", opacity: 1 }}
              exit={{ width: "100%", opacity: 0 }}
              transition={{ width: { duration: 4, ease: "easeOut" }, opacity: { duration: 0.3 } }}
              className="h-[2px] bg-orbit-accent"
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
});

export default memo(SegmentedHub);
