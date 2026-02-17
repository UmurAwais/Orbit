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

  const isBookmarked = useMemo(() => {
    return bookmarks.some(b => b.url === activeTab?.url);
  }, [bookmarks, activeTab?.url]);

  // Robustly handle URL changes without clobbering user input
  useEffect(() => {
    if (!isFocused) {
      const targetUrl = activeTab?.url === 'about:blank' ? '' : activeTab?.url || '';
      setInputValue(targetUrl);
    }
  }, [activeTab?.url, isFocused]);

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

  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    const query = inputValue.trim();
    if (query) {
      onNavigate(query);
      setIsFocused(false);
      // Force immediate blur to prevent sync lag
      const input = e.target.querySelector('input');
      if (input) input.blur();
    }
  }, [inputValue, onNavigate]);

  const handleInputFocus = useCallback(() => {
    setIsFocused(true);
    // Preserving current URL in input for editing
    setInputValue(activeTab?.url === 'about:blank' ? '' : activeTab?.url || '');
  }, [activeTab?.url]);

  return (
    <div className="flex flex-col w-full select-none bg-white relative z-9999 border-b border-slate-200">
      
      {/* Upper Layer: Integrated Tab Bar */}
      <div className="h-11 flex items-center px-4 drag bg-[#F1F3F4] border-b border-black/5">
        
        {/* Left: Sidebar Toggle */}
        <div className="flex items-center no-drag mr-3">
          <button className="p-1.5 rounded-lg hover:bg-black/5 text-slate-500 transition-all active:scale-95">
            <PanelLeftClose size={16} strokeWidth={2} />
          </button>
        </div>

        {/* Center: Tabs Container */}
        <div className="flex-1 flex items-center no-drag h-full overflow-hidden">
          <div className="flex items-center gap-1.5 py-2 overflow-x-auto custom-scrollbar-hide max-w-full">
            <AnimatePresence initial={false} mode="popLayout">
              {tabs.map(tab => {
                const isActive = tab.id === activeTab?.id;
                const faviconUrl = tab.url && tab.url !== 'about:blank' 
                  ? `https://www.google.com/s2/favicons?domain=${tab.url}&sz=64` 
                  : null;

                return (
                  <motion.div 
                    layout
                    key={tab.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ type: "spring", bounce: 0, duration: 0.2 }}
                    onClick={() => onSelectTab(tab.id)}
                    className={`
                      relative group flex items-center h-8 px-3.5 rounded-2xl transition-all duration-200 cursor-pointer min-w-36 max-w-50 border border-transparent will-change-transform
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
                             <OrbitLogo size={14} className={isActive ? 'text-blue-500' : 'text-slate-400'} />
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
                        shrink-0 ml-1.5 w-4 h-4 flex items-center justify-center rounded-md hover:bg-black/10 transition-all
                        ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}
                      `}
                    >
                      <X size={10} strokeWidth={3} className="text-slate-400 hover:text-slate-600" />
                    </button>
                  </motion.div>
                );
              })}
            </AnimatePresence>
            
            <button 
              onClick={onAddTab}
              className="w-8 h-8 flex items-center justify-center hover:bg-black/5 rounded-xl text-slate-400 transition-all shrink-0 active:scale-95"
            >
              <PlusIcon size={18} strokeWidth={2} />
            </button>
          </div>
        </div>

        {/* Right: Windows Controls Spacing */}
        <div className="w-35 shrink-0" />
      </div>

      {/* Lower Layer: Address Bar */}
      <div className="h-12 flex items-center px-4 gap-4 bg-slate-50">
        
        {/* Navigation & AI Hub */}
        <div className="flex items-center gap-1 no-drag h-full py-2 shrink-0">
          <div className="flex items-center gap-0.5 mr-1">
            <button 
              onClick={onBack}
              disabled={!activeTab?.canGoBack}
              className="p-1.5 rounded-lg text-slate-600 disabled:text-slate-200 hover:bg-black/5 active:scale-90 transition-all cursor-pointer disabled:cursor-not-allowed"
              title="Go back"
            >
              <ChevronLeft size={19} strokeWidth={2.2} />
            </button>
            <button 
              onClick={onForward}
              disabled={!activeTab?.canGoForward}
              className="p-1.5 rounded-lg text-slate-600 disabled:text-slate-200 hover:bg-black/5 active:scale-90 transition-all cursor-pointer disabled:cursor-not-allowed"
              title="Go forward"
            >
              <ChevronRight size={19} strokeWidth={2.2} />
            </button>
            <button 
              onClick={activeTab?.isLoading ? onStop : onReload} 
              className="p-1.5 rounded-lg text-slate-600 hover:bg-black/5 active:scale-90 transition-all cursor-pointer"
              title={activeTab?.isLoading ? "Stop loading" : "Reload page"}
            >
              <AnimatePresence mode="wait" initial={false}>
                {activeTab?.isLoading ? (
                  <motion.div
                    key="stop"
                    initial={{ opacity: 0, scale: 0.5, rotate: -45 }}
                    animate={{ opacity: 1, scale: 1, rotate: 0 }}
                    exit={{ opacity: 0, scale: 0.5, rotate: 45 }}
                    transition={{ duration: 0.2 }}
                  >
                    <X size={18} strokeWidth={2.5} />
                  </motion.div>
                ) : (
                  <motion.div
                    key="reload"
                    initial={{ opacity: 0, scale: 0.5, rotate: 45 }}
                    animate={{ opacity: 1, scale: 1, rotate: 0 }}
                    exit={{ opacity: 0, scale: 0.5, rotate: -45 }}
                    transition={{ duration: 0.2 }}
                  >
                    <RotateCw size={17} strokeWidth={2.2} />
                  </motion.div>
                )}
              </AnimatePresence>
            </button>
          </div>

          <AnimatePresence mode="popLayout">
            {activeTab?.url && activeTab.url !== 'about:blank' && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, x: -5 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.9, x: -5 }}
                className="pl-1 flex items-center"
              >
                <button 
                  onClick={() => onNavigate('https://gemini.google.com')}
                  className="flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white text-slate-900 border border-slate-200 shadow-[0_4px_15px_rgba(0,0,0,0.06)] hover:shadow-[0_12px_25px_rgba(0,0,0,0.12)] hover:border-blue-400 hover:text-blue-600 transition-all duration-300 active:scale-95 group cursor-pointer pointer-events-auto"
                >
                  <OrbitLogo size={14} className="group-hover:scale-110 transition-transform duration-300" />
                  <span className="text-[10px] font-bold tracking-widest uppercase">Ask Orbit</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Address Bar */}
        <div className="flex-1 flex justify-center no-drag min-w-0">
          <form 
            onSubmit={handleSubmit}
            className="w-full max-w-4xl relative group"
          >
            <div className={`
              h-9 flex items-center rounded-2xl border transition-all duration-300 px-4 gap-2.5
              ${isFocused 
                ? 'bg-white border-slate-300 shadow-lg shadow-slate-100 ring-4 ring-slate-100' 
                : 'bg-slate-100/50 border-slate-200/60 hover:border-slate-300 shadow-xs'
              }
            `}>
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                {activeTab?.url?.startsWith('https') && !isFocused && (
                  <ShieldCheck size={14} className="text-green-600 shrink-0" strokeWidth={2.5} />
                )}
                {!isFocused && <Search size={14} className="text-slate-500 shrink-0" strokeWidth={2} />}
                
                <input
                  type="text"
                  value={isFocused ? inputValue : (displayUrl || 'Ask Orbit or Type URL')}
                  onChange={(e) => setInputValue(e.target.value)}
                  onFocus={() => {
                    setIsFocused(true);
                    setInputValue(activeTab?.url === 'about:blank' ? '' : activeTab?.url || '');
                  }}
                  onBlur={() => setIsFocused(false)}
                  className="w-full bg-transparent text-[13px] outline-none text-slate-900 font-medium placeholder:text-slate-400"
                  spellCheck={false}
                  placeholder="Ask Orbit or Type URL"
                />
              </div>

              {!isFocused && (
                <div className="flex items-center gap-2">
                  <button 
                    type="button" 
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleBookmark();
                    }}
                    className={`p-1 rounded-md transition-all active:scale-90 ${isBookmarked ? 'text-yellow-500 fill-yellow-500' : 'hover:bg-black/5 text-slate-500'}`}
                  >
                     <Star size={16} strokeWidth={2} />
                  </button>
                </div>
              )}
            </div>
          </form>
        </div>

        {/* Right Section Tools */}
        <div className="flex items-center gap-1 no-drag">
           <button className="p-1.5 rounded-lg hover:bg-black/5 text-slate-500 transition-all active:scale-95">
             <Download size={18} strokeWidth={2} />
           </button>
           <div className="mx-1 h-4 w-px bg-black/10" />
           <div className="flex items-center pl-1">
             <div className="w-7.5 h-7.5 rounded-full bg-linear-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white border border-white shadow-sm cursor-pointer hover:shadow-md transition-shadow active:scale-95">
               <User size={12} fill="currentColor" />
             </div>
             <button className="p-1 rounded-md hover:bg-black/5 text-slate-400 transition-all active:scale-95">
               <ChevronDown size={14} />
             </button>
           </div>
           <button className="p-1.5 rounded-lg hover:bg-black/5 text-slate-600 transition-all active:scale-95 ml-1">
             <MoreVertical size={18} strokeWidth={2} />
           </button>
        </div>
      </div>

      {/* Bookmarks Bar */}
      <div className="h-10 flex items-center px-6 gap-2 bg-white border-b border-slate-100 overflow-x-auto custom-scrollbar-hide no-drag shadow-sm">
        {bookmarks.length === 0 ? (
          <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">No bookmarks yet</span>
        ) : (
          bookmarks.map(bookmark => (
            <button
              key={bookmark.id}
              onClick={() => onNavigate(bookmark.url)}
              className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl hover:bg-slate-100 transition-all group whitespace-nowrap cursor-pointer active:scale-95"
            >
              <img 
                src={`https://www.google.com/s2/favicons?domain=${bookmark.url}&sz=64`} 
                className="w-4 h-4 object-contain shadow-xs group-hover:scale-110 transition-transform" 
                alt="" 
              />
              <span className="text-[12px] font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                {bookmark.title}
              </span>
            </button>
          ))
        )}
      </div>
    </div>
  );
};

export default memo(AppleHeader);
