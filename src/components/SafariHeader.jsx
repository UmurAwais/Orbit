import React, { useState, useEffect, useCallback, memo, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, 
  ChevronRight, 
  RotateCw, 
  Plus, 
  ShieldCheck, 
  X,
  Globe,
  PanelLeft,
  Share,
  FileText,
  Lock,
  ArrowDownCircle,
  Layers,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Lock as LockIcon
} from 'lucide-react';

import OrbitLogo from './OrbitLogo';
import SearchDropdown from './SearchDropdown';

const SafariHeader = ({ 
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
  onToggleBookmark,
  onToggleHub,
  onZoomIn,
  onZoomOut,
  onResetZoom
}) => {
  const [inputValue, setInputValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef(null);
  const searchAreaRef = useRef(null);
  const [suggestions, setSuggestions] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [history, setHistory] = useState(() => {
    try {
      const saved = localStorage.getItem('orbit_search_history');
      const parsed = saved ? JSON.parse(saved) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  const TRENDING_SEARCHES = ["orbit browser", "safari pro layout", "nextjs guide", "premium ui"];

  const displayUrl = useMemo(() => {
    const url = activeTab?.url;
    if (!url || url === 'about:blank') return '';
    try {
      if (url.includes('google.com/search')) {
        const params = new URLSearchParams(new URL(url).search);
        return params.get('q') || url;
      }
      return url.replace(/^https?:\/\/(www\.)?/, '');
    } catch {
      return url;
    }
  }, [activeTab?.url]);

  useEffect(() => {
    if (!isFocused) setInputValue(displayUrl);
  }, [displayUrl, isFocused]);

  useEffect(() => {
    if (!isFocused || !inputValue.trim()) {
      setSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const results = await window.orbit.ipcRenderer.invoke('tab:getSuggestions', inputValue);
        setSuggestions(Array.isArray(results) ? results : []);
      } catch (e) {
        setSuggestions([]);
      }
    }, 150);
    return () => clearTimeout(timer);
  }, [inputValue, isFocused]);

  // Robust Outside Click Handling
  useEffect(() => {
    if (!isFocused) return;

    const handleOutsideClick = (e) => {
      // Check if the click is outside BOTH the input and the dropdown
      if (searchAreaRef.current && !searchAreaRef.current.contains(e.target)) {
        setIsFocused(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isFocused]);

  const handleSubmit = useCallback((queryToSubmit) => {
    const query = (queryToSubmit || inputValue).trim();
    if (query) {
      onNavigate(query);
      setIsFocused(false);
      setHistory(prev => [query, ...prev.filter(i => i !== query)].slice(0, 10));
      document.activeElement?.blur();
    }
  }, [inputValue, onNavigate]);

  const handleKeyDown = (e) => {
    const items = suggestions.length > 0 ? suggestions : history;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % items.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + items.length) % items.length);
    } else if (e.key === 'Enter') {
       if (selectedIndex >= 0) {
         setInputValue(items[selectedIndex]);
         handleSubmit(items[selectedIndex]);
       } else {
         handleSubmit();
       }
      setIsFocused(false);
      e.target.blur();
    }
  };

  const handleInputFocus = useCallback(() => {
    setIsFocused(true);
    // Preserving current URL in input for editing if it's not a generic page
    setInputValue(activeTab?.url === 'about:blank' ? '' : activeTab?.url || '');
  }, [activeTab?.url]);

  return (
    <div className="flex flex-col w-full select-none relative z-[1000] border-b border-black/5 bg-white">
      
      {/* Top Bar: Calibrated Reference Layout */}
      <div className="h-[52px] flex items-center px-3 drag">
        
        {/* Left Section: Utility Controls */}
        <div className="flex-1 flex items-center gap-0.5 no-drag shrink-0 relative z-20">
          <button className="p-2 rounded-lg hover:bg-black/5 text-slate-500 transition-all">
            <PanelLeft size={18} strokeWidth={1.5} />
          </button>
          
          <div className="flex items-center gap-0.5 ml-1">
             <button 
               disabled={!activeTab?.canGoBack}
               onClick={onBack}
               className="p-1.5 rounded-lg text-slate-400 disabled:opacity-20 hover:bg-black/5"
             >
               <ChevronLeft size={18} strokeWidth={2} />
             </button>
             <button 
               disabled={!activeTab?.canGoForward}
               onClick={onForward}
               className="p-1.5 rounded-lg text-slate-400 disabled:opacity-20 hover:bg-black/5"
             >
               <ChevronRight size={18} strokeWidth={2} />
             </button>
          </div>

          <div className="flex items-center gap-3.5 px-3">
             <OrbitLogo size={18} variant="icon" className="brightness-110 drop-shadow-sm" />
             {/* <ShieldCheck size={18} className="text-slate-500" strokeWidth={1.5} /> */}
          </div>
        </div>

        {/* Center Section: Elevated Search Wrapper */}
        <div 
          ref={searchAreaRef}
          className="absolute left-1/2 -translate-x-1/2 w-full max-w-2xl no-drag z-1001 py-2"
        >
            <div 
              key="search-container"
              onClick={() => inputRef.current?.focus()}
              className={`
              w-full h-8 flex items-center px-4 rounded-xl transition-all duration-300 relative group cursor-text
              ${isFocused ? 'bg-white shadow-[0_8px_30px_rgba(0,0,0,0.08)] ring-1 ring-black/5 scale-[1.01]' : 'bg-black/[0.05] hover:bg-black/[0.08]'}
            `}>
             <div className="flex items-center justify-center flex-1 min-w-0 h-full relative">
               
               {/* Fixed Privacy Shield on Far Left (Hidden when editing) */}
               {!isFocused && activeTab?.url && activeTab.url !== 'about:blank' && (
                 <div className="flex items-center shrink-0 absolute left-1 z-10 pointer-events-none">
                   <ShieldCheck size={16} className="text-blue-500/80" strokeWidth={2.5} />
                 </div>
               )}

               {/* Centered URL Display + Lock (Only when not focused) */}
               {!isFocused && activeTab?.url && activeTab.url !== 'about:blank' && (
                 <div className="flex items-center gap-1.5 pointer-events-none absolute left-1/2 -translate-x-1/2 whitespace-nowrap">
                   <Lock size={12} className={activeTab?.url?.startsWith('https') ? 'text-slate-400' : 'text-slate-300'} />
                   <span className="text-[13px] font-semibold tracking-tight text-slate-700">
                     {displayUrl}
                   </span>
                 </div>
               )}
               
                <input 
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onFocus={handleInputFocus}
                  onKeyDown={handleKeyDown}
                  className={`
                    w-full bg-transparent border-none outline-none text-[13px] font-medium tracking-tight text-slate-700 transition-all duration-300
                    ${isFocused 
                      ? 'text-left pl-10 opacity-100' 
                      : (activeTab?.url === 'about:blank' ? 'text-center opacity-100' : 'opacity-0 cursor-text')
                    }
                  `}
                  placeholder="Search or enter website name"
                  spellCheck={false}
                />

               {!isFocused && activeTab?.url !== 'about:blank' && (
                 <div className="flex items-center gap-1 shrink-0 ml-2">
                    {activeTab?.zoomFactor !== undefined && Math.round(activeTab.zoomFactor * 100) !== 100 && (
                      <span 
                        onClick={onResetZoom}
                        className="text-[10px] font-bold text-slate-400 mr-10 cursor-pointer hover:text-blue-500 transition-colors"
                      >
                        {Math.round(activeTab.zoomFactor * 100)}%
                      </span>
                    )}
                    <button 
                      onClick={onReload} 
                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-black/5 absolute right-0 transition-all active:scale-90"
                    >
                       <X size={13} className="text-slate-500" />
                    </button>
                 </div>
               )}
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
             handleSubmit={handleSubmit}
             setInputValue={setInputValue}
             onClose={() => setIsFocused(false)}
           />
        </div>

        {/* Right Section: Action Controls */}
        <div className="flex-1 flex items-center justify-end gap-0.5 no-drag shrink-0 pl-4 pr-35 relative z-20">
           <button className="p-2 rounded-lg hover:bg-black/5 text-slate-500">
             <ArrowDownCircle size={18} strokeWidth={1.5} />
           </button>
           {activeTab?.url && activeTab.url !== 'about:blank' && (
             <button className="p-2 rounded-lg hover:bg-black/5 text-slate-500">
               <Share size={18} strokeWidth={1.5} />
             </button>
           )}
           <button 
             onClick={onAddTab}
             className="p-2 rounded-lg hover:bg-black/5 text-slate-500 active:scale-95 transition-all"
           >
             <Plus size={20} strokeWidth={1.5} />
           </button>
           <button 
             onClick={onToggleOverview}
             className="p-2 rounded-lg hover:bg-black/5 text-slate-500"
           >
             <Layers size={19} strokeWidth={1.5} className={isOverview ? 'text-blue-600' : ''} />
           </button>
        </div>
      </div>

    </div>
  );
};

export default memo(SafariHeader);
