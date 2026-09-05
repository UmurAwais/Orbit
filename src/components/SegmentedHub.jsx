import React, { memo, useState, useEffect, useMemo, useRef } from 'react';
import { 
  Plus, Search, X, Lock, Shield, RefreshCw, Share, MoreHorizontal, ChevronDown,
  ChevronLeft, ChevronRight, Bookmark, ShieldCheck, ZoomIn, ZoomOut, Printer,
  Search as SearchIcon, Download, History, Settings, Star, BookOpen,
  Monitor, HelpCircle, Plus as PlusIcon, Copy, Check
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
  const [shieldHovered, setShieldHovered] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [copied, setCopied] = useState(false);
  const [menuPage, setMenuPage] = useState('main'); // 'main' | 'history' | 'bookmarks'
  const menuBtnRef = useRef(null);

  // Close menu when tab changes
  useEffect(() => { setMenuOpen(false); setMenuPage('main'); }, [activeTab?.id]);

  // Expand/collapse uiView when menu opens/closes
  useEffect(() => { onFocusChange?.(menuOpen); }, [menuOpen]);

  const openMenu = () => { setMenuPage('main'); setMenuOpen(v => !v); };
  const closeMenu = () => { setMenuOpen(false); setMenuPage('main'); };

  // Sync real zoom level when menu opens or tab changes
  useEffect(() => {
    if (menuOpen && activeTab?.id) {
      window.orbit.tabs.getZoom({ id: activeTab.id })
        .then(val => { if (val) setZoom(val); })
        .catch(() => setZoom(100));
    }
  }, [menuOpen, activeTab?.id]);

  const handleZoom = async (e, direction) => {
    e?.stopPropagation();
    if (!activeTab?.id) return;
    try {
      let newZoom;
      if (direction === 'in') {
        newZoom = await window.orbit.tabs.zoomIn({ id: activeTab.id });
      } else {
        newZoom = await window.orbit.tabs.zoomOut({ id: activeTab.id });
      }
      if (newZoom) setZoom(newZoom);
    } catch (err) {
      console.error('Zoom failed:', err);
    }
  };

  const resetZoom = async (e) => {
    e?.stopPropagation();
    if (!activeTab?.id) return;
    try {
      const newZoom = await window.orbit.tabs.resetZoom({ id: activeTab.id });
      setZoom(newZoom || 100);
    } catch (err) {
      setZoom(100);
    }
  };

  const handleCopyUrl = async () => {
    try { await navigator.clipboard.writeText(activeTab?.url || ''); } catch {}
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const menuAction = (fn) => { closeMenu(); fn(); };

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
    <div className={`nexus-hub group no-drag relative w-full ${!isVisible && !isFocused ? 'opacity-0' : 'opacity-100'} ${isFocused ? 'focused' : ''}`}>
      
      {/* 1. Interior Navigation (Integrated arrows) */}
      <div className="nexus-hub-inner-nav no-drag">
        <TooltipWrapper text="Go back">
          <button 
             onClick={() => window.orbit.tabs.goBack({ id: activeTab?.id })}
             disabled={!activeTab?.canGoBack}
             className="nexus-hub-nav-btn disabled:opacity-30 text-orbit-text outline-none"
          >
            <ChevronLeft size={16} strokeWidth={2.5} />
          </button>
        </TooltipWrapper>
        <TooltipWrapper text="Go forward">
          <button 
             onClick={() => window.orbit.tabs.goForward({ id: activeTab?.id })}
             disabled={!activeTab?.canGoForward}
             className="nexus-hub-nav-btn disabled:opacity-30 text-orbit-text outline-none"
          >
            <ChevronRight size={16} strokeWidth={2.5} />
          </button>
        </TooltipWrapper>
      </div>

      {/* Premium Privacy Indicator - Apple Safari Style */}
      <div className="relative ml-1">
        <button
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-emerald-500/5 transition-all duration-300 outline-none"
          onMouseEnter={() => { setShieldHovered(true); onFocusChange?.(true); }}
          onMouseLeave={() => { setShieldHovered(false); onFocusChange?.(false); }}
        >
          <ShieldCheck size={16} strokeWidth={2.2} className={`text-emerald-500 transition-transform duration-200 ${shieldHovered ? 'scale-110' : ''}`} />
        </button>
        {shieldHovered && (
          <div
            className="absolute left-1/2 -translate-x-1/2 z-99999 pointer-events-none"
            style={{ top: 'calc(100% + 10px)', minWidth: '220px', maxWidth: '300px' }}
          >
            <div className="bg-white/90 dark:bg-[#28292d]/95 backdrop-blur-xl border border-black/8 dark:border-white/10 rounded-2xl px-4 py-2.5 shadow-xl text-center">
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
             <AnimatePresence mode="wait">
               <motion.span 
                 key={displayUrl}
                 initial={{ opacity: 0, y: 3 }}
                 animate={{ opacity: 0.9, y: 0 }}
                 exit={{ opacity: 0, y: -3 }}
                 transition={{ duration: 0.25, ease: "easeOut" }}
                 className="text-[13px] font-medium text-nexus-text"
               >
                 {displayUrl}
               </motion.span>
             </AnimatePresence>
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
          <AnimatePresence mode="wait">
            {showPlaceholder && (
              <motion.span
                key={commandIndex}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="text-[12px] font-medium text-nexus-text-dim pl-7"
                style={{ letterSpacing: '-0.02em' }}
              >
                {COMMANDS[commandIndex]}
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        {/* Chromium-style Dropdown */}
        {isFocused && suggestions.length > 0 && (
          <div className="absolute top-[calc(100%+8px)] -left-4 -right-4 bg-nexus-hub-bg border border-nexus-border rounded-xl shadow-2xl overflow-hidden backdrop-blur-3xl z-5000">
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
            <TooltipWrapper text="Reload Page">
              <button 
                type="button"
                onClick={(e) => { e.stopPropagation(); window.orbit.tabs.reload({ id: activeTab.id }); }}
                className={`w-7 h-7 flex items-center justify-center rounded-full hover:bg-nexus-text/5 text-nexus-text opacity-70 hover:opacity-100 transition-all ${activeTab?.isLoading ? 'opacity-100 text-nexus-accent' : ''}`}
              >
                <RefreshCw size={13} strokeWidth={2.5} className={activeTab?.isLoading ? 'animate-spin' : ''} />
              </button>
            </TooltipWrapper>

            <TooltipWrapper text={isPinned ? "Remove Bookmark" : "Bookmark this page"}>
              <button 
                type="button" 
                onClick={toggleBookmark}
                className={`w-7 h-7 flex items-center justify-center rounded-full hover:bg-nexus-text/5 transition-all ${isPinned ? 'text-orbit-accent opacity-100' : 'text-nexus-text opacity-70 hover:opacity-100'}`}
              >
                <Bookmark size={13} strokeWidth={2.5} className={isPinned ? 'fill-current' : ''} />
              </button>
            </TooltipWrapper>
          </>
        )}
        
        {/* Share / Copy URL */}
        <TooltipWrapper text={copied ? 'Copied!' : 'Copy URL'}>
          <button
            type="button"
            onClick={handleCopyUrl}
            className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-nexus-text/5 text-nexus-text opacity-70 hover:opacity-100 transition-all"
          >
            {copied ? <Check size={13} strokeWidth={2.5} className="text-emerald-500" /> : <Share size={13} strokeWidth={2.5} />}
          </button>
        </TooltipWrapper>
        
        <div className="w-1" />
        
        {/* ⋮ Page Menu */}
        <div className="relative" ref={menuBtnRef}>
          <TooltipWrapper text="More options">
            <button
              type="button"
              onClick={openMenu}
              className={`w-7 h-7 flex items-center justify-center rounded-full transition-all ${
                menuOpen ? 'bg-nexus-text/10 text-nexus-text opacity-100' : 'hover:bg-nexus-text/5 text-nexus-text opacity-70 hover:opacity-100'
              }`}
            >
              <MoreHorizontal size={15} strokeWidth={2.2} />
            </button>
          </TooltipWrapper>

          <AnimatePresence>
            {menuOpen && (
              <>
                {/* Backdrop */}
                <div className="fixed inset-0 z-99990" onClick={closeMenu} />

                {/* Menu panel */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -6 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -6 }}
                  transition={{ duration: 0.13, ease: 'easeOut' }}
                  className="absolute right-0 z-99999 mt-2 w-64 rounded-xl bg-white/95 dark:bg-[#28292d]/95 backdrop-blur-xl border border-black/8 dark:border-white/10 shadow-2xl overflow-hidden"
                  style={{ top: '100%' }}
                >
                   {/* Zoom row */}
                  <div className="flex items-center justify-between px-4 py-2.5 border-b border-black/5 dark:border-white/5">
                    <span className="text-[12px] font-medium text-nexus-text opacity-70">Zoom</span>
                    <div className="flex items-center gap-1">
                      <button onClick={(e) => handleZoom(e, 'out')} className="cursor-pointer w-7 h-7 flex items-center justify-center rounded-lg hover:bg-nexus-text/10 text-nexus-text transition-all text-lg font-light active:scale-95">−</button>
                      <button onClick={resetZoom} className="cursor-pointer min-w-11 h-7 px-2 rounded-lg hover:bg-nexus-text/10 text-[12px] font-semibold text-nexus-text transition-all active:scale-95">{zoom}%</button>
                      <button onClick={(e) => handleZoom(e, 'in')} className="cursor-pointer w-7 h-7 flex items-center justify-center rounded-lg hover:bg-nexus-text/10 text-nexus-text transition-all text-lg active:scale-95">+</button>
                    </div>
                  </div>

                  {/* Sub-page: History */}
                  {menuPage === 'history' && (
                    <div className="py-1.5 max-h-72 overflow-y-auto">
                      <button onClick={() => setMenuPage('main')} className="cursor-pointer w-full flex items-center gap-2 px-4 py-2 text-[12px] font-semibold text-nexus-text opacity-60 hover:opacity-100 transition-colors">
                        <ChevronLeft size={13} /> Back
                      </button>
                      {historyItems.length === 0 ? (
                        <p className="px-4 py-3 text-[12px] text-nexus-text opacity-40">No history yet.</p>
                      ) : historyItems.slice().reverse().map((h, i) => (
                        <button key={i} onClick={() => menuAction(() => onNavigate(h.url))} className="cursor-pointer w-full flex flex-col items-start px-4 py-1.5 hover:bg-nexus-text/5 transition-colors">
                          <span className="text-[12px] font-medium text-nexus-text truncate w-full text-left">{h.title || h.url}</span>
                          <span className="text-[10px] text-nexus-text opacity-40 truncate w-full text-left">{h.url}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Sub-page: Bookmarks */}
                  {menuPage === 'bookmarks' && (
                    <div className="py-1.5 max-h-72 overflow-y-auto">
                      <button onClick={() => setMenuPage('main')} className="cursor-pointer w-full flex items-center gap-2 px-4 py-2 text-[12px] font-semibold text-nexus-text opacity-60 hover:opacity-100 transition-colors">
                        <ChevronLeft size={13} /> Back
                      </button>
                      {bookmarks.length === 0 ? (
                        <p className="px-4 py-3 text-[12px] text-nexus-text opacity-40">No bookmarks yet.</p>
                      ) : bookmarks.map((b) => (
                        <button key={b.id} onClick={() => menuAction(() => onNavigate(b.url))} className="cursor-pointer w-full flex items-center gap-3 px-4 py-2 hover:bg-nexus-text/5 transition-colors group">
                          <Bookmark size={13} strokeWidth={2} className="text-nexus-text opacity-50 group-hover:opacity-100 shrink-0" />
                          <span className="flex-1 text-left text-[13px] font-medium text-nexus-text truncate">{b.title}</span>
                          <span className="text-[10px] text-nexus-text opacity-30 truncate max-w-20">{b.url.replace(/^https?:\/\//, '')}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Main menu items */}
                  {menuPage === 'main' && (
                    <>
                      <div className="py-1.5">
                        {[
                          { icon: PlusIcon,   label: 'New Tab',        shortcut: '⌘T', action: () => onAddTab?.() },
                          { icon: SearchIcon, label: 'Find in Page',   shortcut: '⌘F', action: () => window.orbit?.ipcRenderer?.send('page:find') },
                          { icon: Printer,    label: 'Print…',         shortcut: '⌘P', action: () => window.orbit?.ipcRenderer?.send('page:print', { id: activeTab?.id }) },
                          { icon: Download,   label: 'Save Page As…',  shortcut: '⌘S', action: () => window.orbit?.ipcRenderer?.send('page:save', { id: activeTab?.id }) },
                          { icon: Monitor,    label: 'Cast…',          action: () => alert('Cast is not available in this version of Orbit.') },
                        ].map(({ icon: Icon, label, shortcut, action }) => (
                          <button key={label} onClick={() => menuAction(action)}
                            className="cursor-pointer w-full flex items-center gap-3 px-4 py-2 hover:bg-nexus-text/8 dark:hover:bg-white/8 transition-colors group">
                            <Icon size={14} strokeWidth={2} className="text-nexus-text opacity-60 group-hover:opacity-100 shrink-0" />
                            <span className="flex-1 text-left text-[13px] font-medium text-nexus-text">{label}</span>
                            {shortcut && <span className="text-[11px] text-nexus-text opacity-40">{shortcut}</span>}
                          </button>
                        ))}
                      </div>

                      <div className="border-t border-black/5 dark:border-white/5 py-1.5">
                        <button onClick={() => setMenuPage('history')}
                          className="cursor-pointer w-full flex items-center gap-3 px-4 py-2 hover:bg-nexus-text/8 dark:hover:bg-white/8 transition-colors group">
                          <History size={14} strokeWidth={2} className="text-nexus-text opacity-60 group-hover:opacity-100 shrink-0" />
                          <span className="flex-1 text-left text-[13px] font-medium text-nexus-text">History</span>
                          <div className="flex items-center gap-1">
                            <span className="text-[11px] text-nexus-text opacity-40">⌘Y</span>
                            <ChevronRight size={12} className="text-nexus-text opacity-30" />
                          </div>
                        </button>
                        <button onClick={() => menuAction(() => window.orbit?.ipcRenderer?.send('ui:open-downloads'))}
                          className="cursor-pointer w-full flex items-center gap-3 px-4 py-2 hover:bg-nexus-text/8 dark:hover:bg-white/8 transition-colors group">
                          <Download size={14} strokeWidth={2} className="text-nexus-text opacity-60 group-hover:opacity-100 shrink-0" />
                          <span className="flex-1 text-left text-[13px] font-medium text-nexus-text">Downloads</span>
                          <span className="text-[11px] text-nexus-text opacity-40">⌘J</span>
                        </button>
                        <button onClick={() => setMenuPage('bookmarks')}
                          className="cursor-pointer w-full flex items-center gap-3 px-4 py-2 hover:bg-nexus-text/8 dark:hover:bg-white/8 transition-colors group">
                          <Bookmark size={14} strokeWidth={2} className="text-nexus-text opacity-60 group-hover:opacity-100 shrink-0" />
                          <span className="flex-1 text-left text-[13px] font-medium text-nexus-text">Bookmarks</span>
                          <ChevronRight size={12} className="text-nexus-text opacity-30" />
                        </button>
                      </div>

                      <div className="border-t border-black/5 dark:border-white/5 py-1.5">
                        <button onClick={() => menuAction(() => window.orbit?.ipcRenderer?.send('ui:open-settings'))}
                          className="cursor-pointer w-full flex items-center gap-3 px-4 py-2 hover:bg-nexus-text/8 dark:hover:bg-white/8 transition-colors group">
                          <Settings size={14} strokeWidth={2} className="text-nexus-text opacity-60 group-hover:opacity-100 shrink-0" />
                          <span className="flex-1 text-left text-[13px] font-medium text-nexus-text">Settings</span>
                        </button>
                        <button onClick={() => menuAction(() => onNavigate('https://google.com/search?q=Orbit+browser+help'))}
                          className="cursor-pointer w-full flex items-center gap-3 px-4 py-2 hover:bg-nexus-text/8 dark:hover:bg-white/8 transition-colors group">
                          <HelpCircle size={14} strokeWidth={2} className="text-nexus-text opacity-60 group-hover:opacity-100 shrink-0" />
                          <span className="flex-1 text-left text-[13px] font-medium text-nexus-text">Help</span>
                        </button>
                      </div>
                    </>
                  )}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="absolute inset-0 pointer-events-none rounded-[50px] overflow-hidden z-20" style={{ transform: 'translateZ(0)' }}>
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
