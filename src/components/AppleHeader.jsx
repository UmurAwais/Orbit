import React, { useState, useEffect, useCallback, memo, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import { 
  ChevronLeft, 
  ChevronRight, 
  RotateCw, 
  Plus, 
  ShieldCheck, 
  X,
  Globe,
  Plus as PlusIcon,
  Search,
  Sparkles,
  User,
  PanelLeftClose,
  Download,
  MoreVertical,
  ChevronDown,
  Star
} from 'lucide-react';

import OrbitLogo from './OrbitLogo';
import SearchDropdown from './SearchDropdown';

const AppleHeader = ({ 
  tabs = [],
  activeTab, 
  onSelectTab,
  onCloseTab,
  onNavigate, 
  onReload, 
  onStop,
  onBack, 
  onForward, 
  onAddTab, 
  onToggleOverview,
  isOverview,
  bookmarks = [],
  onToggleBookmark
}) => {
  const [inputValue, setInputValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [history, setHistory] = useState(() => {
    const saved = localStorage.getItem('orbit_search_history');
    return saved ? JSON.parse(saved) : [];
  });

  const TRENDING_SEARCHES = [
    "latest tech news",
    "best ai tools 2026",
    "orbit browser features",
    "how to use generative ai",
    "top 10 travel destinations",
    "stock market trends today"
  ];

  const isBookmarked = useMemo(() => {
    return bookmarks.some(b => b.url === activeTab?.url);
  }, [bookmarks, activeTab?.url]);

  // Handle suggestion fetching
  useEffect(() => {
    if (!isFocused || !inputValue.trim()) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const results = await window.orbit.ipcRenderer.invoke('tab:getSuggestions', inputValue);
        setSuggestions(results);
        setSelectedIndex(-1);
      } catch (e) {
        console.error('Failed to fetch suggestions:', e);
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [inputValue, isFocused]);

  useEffect(() => {
    localStorage.setItem('orbit_search_history', JSON.stringify(history));
  }, [history]);


  // Robustly handle URL changes without clobbering user input
  useEffect(() => {
    if (!isFocused) {
      const targetUrl = activeTab?.url === 'about:blank' ? '' : activeTab?.url || '';
      setInputValue(targetUrl);
    }
  }, [activeTab?.url, isFocused]);

  // Close search on navigation
  useEffect(() => {
    setIsFocused(false);
  }, [activeTab?.url]);

  // Safety net: Force loading state to clear after timeout
  useEffect(() => {
    if (activeTab?.isLoading) {
      const timeout = setTimeout(() => {
        // If still loading after 5 seconds, force it to stop
        if (activeTab?.isLoading && onStop) {
          onStop();
        }
      }, 5000);
      return () => clearTimeout(timeout);
    }
  }, [activeTab?.isLoading, activeTab?.id, onStop]);

  const displayUrl = useMemo(() => {
    const url = activeTab?.url;
    if (!url || url === 'about:blank') return '';
    try {
      if (url.startsWith('https://www.google.com/search')) {
        const params = new URLSearchParams(new URL(url).search);
        return params.get('q') || url;
      }
      return new URL(url).hostname.replace('www.', '');
    } catch {
      return url;
    }
  }, [activeTab?.url]);

  const handleSubmit = useCallback((queryToSubmit) => {
    const query = (queryToSubmit || inputValue).trim();
    if (query) {
      onNavigate(query);
      setIsFocused(false);
      
      // Update history
      setHistory(prev => {
        const filtered = prev.filter(item => item.toLowerCase() !== query.toLowerCase());
        return [query, ...filtered].slice(0, 15);
      });

      // Force blur
      const activeElement = document.activeElement;
      if (activeElement) activeElement.blur();
    }
  }, [inputValue, onNavigate]);

  const handleKeyDown = (e) => {
    const items = suggestions.length > 0 ? suggestions : (history.length > 0 ? history : TRENDING_SEARCHES);
    
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % items.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + items.length) % items.length);
    } else if (e.key === 'Enter') {
      if (selectedIndex >= 0) {
        e.preventDefault();
        const selected = items[selectedIndex];
        setInputValue(selected);
        handleSubmit(selected);
      }
    } else if (e.key === 'Escape') {
      setIsFocused(false);
      e.target.blur();
    }
  };


  const handleInputFocus = useCallback(() => {
    setIsFocused(true);
    // Preserving current URL in input for editing
    setInputValue(activeTab?.url === 'about:blank' ? '' : activeTab?.url || '');
  }, [activeTab?.url]);

  return (
    <div className="flex flex-col w-full select-none relative z-9999">
      
      {/* Upper Layer: Integrated Tab Bar */}
      <div className="h-11 flex items-center px-4 drag bg-[#efeeee] border-b border-black/5">
        
        {/* Left: Sidebar Toggle */}
        <div className="flex items-center no-drag mr-3">
          <button className="p-1.5 rounded-lg hover:bg-black/5 text-slate-500 transition-all active:scale-95">
            <PanelLeftClose size={16} strokeWidth={2} />
          </button>
        </div>

        {/* Center: Tabs Container */}
        <div className="flex-1 flex items-center no-drag h-full overflow-hidden">
          <div className="flex items-center gap-1.5 py-2 overflow-x-auto custom-scrollbar-hide max-w-full">
            {tabs.map((tab, index) => {
              const isActive = tab.id === activeTab?.id;
              const isNextActive = tabs[index + 1]?.id === activeTab?.id;
              const faviconUrl = tab.favicon || (tab.url && tab.url !== 'about:blank' 
                ? `https://www.google.com/s2/favicons?domain=${tab.url}&sz=64` 
                : null);

              return (
                <React.Fragment key={tab.id}>
                  <div 
                    onClick={() => onSelectTab(tab.id)}
                    className={`
                      relative group flex items-center h-8 px-3.5 rounded-2xl min-w-36 max-w-50 border border-transparent
                      ${isActive 
                        ? 'bg-white shadow-[0_2px_10px_rgba(0,0,0,0.06)] border-slate-200 z-20' 
                        : 'hover:bg-black/5 text-slate-500'
                      }
                    `}
                  >
                    <div className="flex items-center gap-2.5 flex-1 min-w-0">
                      <div className="shrink-0">
                        {faviconUrl ? (
                          <img src={faviconUrl} loading="lazy" className="w-3.5 h-3.5 object-contain" alt="" />
                        ) : (
                          <div className={`w-3.5 h-3.5 flex items-center justify-center`}>
                            <OrbitLogo size={14} variant="icon" className={isActive ? 'text-blue-500' : 'text-slate-400'} />
                          </div>
                        )}
                      </div>
                      <span className={`text-sm font-medium truncate tracking-tight ${isActive ? 'text-slate-800' : 'text-slate-500'}`}>
                        {tab.url === 'about:blank' ? 'New Tab' : tab.title}
                      </span>
                    </div>
                    
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        onCloseTab(tab.id);
                      }}
                      className={`
                        shrink-0 ml-1.5 w-4 h-4 flex items-center justify-center rounded-md hover:bg-black/10
                        ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}
                      `}
                    >
                      <X size={10} strokeWidth={3} className="text-slate-400 hover:text-slate-600" />
                    </button>
                  </div>
                  
                  {/* Chrome-style Separator */}
                  {index < tabs.length - 1 && !isActive && !isNextActive && (
                    <div className="w-px h-4 bg-black/15 shrink-0" />
                  )}
                </React.Fragment>
              );
            })}

            
            <button 
              onClick={onAddTab}
              className="w-8 h-8 flex items-center justify-center hover:bg-black/5 rounded-xl text-slate-400 shrink-0 active:scale-95"
            >
              <PlusIcon size={18} strokeWidth={2} />
            </button>
          </div>
        </div>

        {/* Right: Windows Controls Spacing */}
        <div className="w-35 shrink-0" />
      </div>

      {/* Lower Layer: Address Bar */}
      <div className={`relative h-12 flex items-center px-4 bg-slate-50 ${activeTab?.url !== 'about:blank' ? 'border-b border-slate-200' : ''}`}>
        
        {/* Navigation & AI Hub */}
        <div className="flex items-center gap-1 no-drag h-full py-2 shrink-0 z-20">
          <div className="flex items-center gap-0.5 mr-1">
            <button 
              onClick={onBack}
              disabled={!activeTab?.canGoBack}
              className="p-1.5 rounded-lg text-slate-600 disabled:text-slate-200 hover:bg-black/5 active:scale-90 cursor-pointer disabled:cursor-not-allowed"
              title="Go back"
            >
              <ChevronLeft size={19} strokeWidth={2.2} />
            </button>
            <button 
              onClick={onForward}
              disabled={!activeTab?.canGoForward}
              className="p-1.5 rounded-lg text-slate-600 disabled:text-slate-200 hover:bg-black/5 active:scale-90 cursor-pointer disabled:cursor-not-allowed"
              title="Go forward"
            >
              <ChevronRight size={19} strokeWidth={2.2} />
            </button>
            <button 
              onClick={activeTab?.isLoading ? onStop : onReload} 
              className="p-1.5 rounded-lg text-slate-600 hover:bg-black/5 active:scale-90 cursor-pointer"
              title={activeTab?.isLoading ? "Stop loading" : "Reload page"}
            >
              {activeTab?.isLoading ? (
                <div>
                  <X size={18} strokeWidth={2.5} />
                </div>
              ) : (
                <div>
                  <RotateCw size={17} strokeWidth={2.2} />
                </div>
              )}

            </button>
          </div>


        </div>

        <div className="absolute left-1/2 -translate-x-1/2 w-full max-w-3xl px-4 no-drag z-10">
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit();
            }}
            className="w-full relative group"
          >
            <div className={`
              h-9 flex items-center rounded-2xl border px-4 gap-2.5 transition-all
              ${isFocused 
                ? 'bg-white border-slate-300 shadow-lg shadow-slate-100 ring-4 ring-slate-100' 
                : 'bg-[#efeeee] border-slate-200/60 hover:border-slate-300 shadow-xs'
              }
            `}>
              <div className={`flex items-center gap-2.5 min-w-0 flex-1 ${!isFocused ? 'justify-center' : ''}`}>
                {activeTab?.url?.startsWith('https') && !isFocused && (
                  <ShieldCheck size={14} className="text-green-600 shrink-0" strokeWidth={2.5} />
                )}
                
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  onKeyDown={handleKeyDown}
                  className={`w-full bg-transparent text-[13px] outline-none text-slate-900 font-medium placeholder:text-slate-400 transition-all ${
                    !isFocused ? 'text-center' : ''
                  }`}
                  spellCheck={false}
                  placeholder="Ask Orbit or Type URL"
                />
              </div>
            </div>

            <SearchDropdown 
              isFocused={isFocused}
              inputValue={inputValue}
              suggestions={suggestions}
              history={history}
              trendingSearches={TRENDING_SEARCHES}
              selectedIndex={selectedIndex}
              setSelectedIndex={setSelectedIndex}
              setInputValue={setInputValue}
              handleSubmit={handleSubmit}
              onClose={() => setIsFocused(false)}
            />
          </form>
        </div>

        {/* Right Section Tools */}
        <div className="flex items-center gap-2 no-drag ml-auto z-20">
           {activeTab?.url && activeTab.url !== 'about:blank' && (
             <button 
               onClick={() => onNavigate('https://gemini.google.com')}
               className="h-9 flex items-center gap-3 px-4 rounded-xl bg-white text-slate-900 border border-slate-200/80 shadow-[0_2px_10px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_20px_rgba(0,0,0,0.08)] hover:border-slate-300 transition-all active:scale-95 group cursor-pointer"
             >
               <OrbitLogo size={15} variant="icon" className="group-hover:rotate-15 transition-transform duration-300" />
               <span className="text-[11px] font-bold uppercase tracking-widest">Ask Orbit</span>
             </button>
           )}

           <div className="mx-1 h-5 w-px bg-black/10" />

           <button className="h-9 w-9 flex items-center justify-center rounded-xl hover:bg-black/5 text-slate-500 transition-all active:scale-95">
             <Download size={18} strokeWidth={2} />
           </button>
           <button className="p-1.5 rounded-lg hover:bg-black/5 text-slate-600 transition-all active:scale-95 ml-1">
             <MoreVertical size={18} strokeWidth={2} />
           </button>
        </div>
      </div>

    </div>
  );
};

export default memo(AppleHeader);
