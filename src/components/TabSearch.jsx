import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Search, X, Clock, File, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import OrbitLogo from './OrbitLogo';

const TabSearch = ({ 
  tabs, 
  activeTabId, 
  onSelectTab, 
  onCloseTab, 
  recentlyClosed, 
  onRestoreTab 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  // Filter tabs based on search
  const filteredOpenTabs = useMemo(() => {
    if (!searchQuery) return tabs;
    return tabs.filter(tab => 
      (tab.title || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
      (tab.url || '').toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [tabs, searchQuery]);

  const filteredClosedTabs = useMemo(() => {
    if (!searchQuery) return recentlyClosed;
    return recentlyClosed.filter(tab => 
      (tab.title || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
      (tab.url || '').toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [recentlyClosed, searchQuery]);

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    window.addEventListener('mousedown', handleClickOutside);
    return () => window.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Autofocus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setSearchQuery('');
    }
  }, [isOpen]);

  const getFavicon = (url) => {
    if (!url || url === 'about:blank') return null;
    try {
      const domain = new URL(url).hostname;
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
    } catch (e) {
      return null;
    }
  };

  const getTimeAgo = (timestamp) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return `${seconds} secs ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} mins ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hours ago`;
    return `${Math.floor(hours / 24)} days ago`;
  };

  return (
    <div className="relative pointer-events-auto z-3000" ref={containerRef}>
      <button 
        className={`h-9 w-9 rounded-xl bg-black/5 hover:bg-white hover:shadow-sm flex items-center justify-center text-black/50 hover:text-black transition-all cursor-pointer ${isOpen ? 'bg-white text-black shadow-sm' : ''}`} 
        title="Search Tabs"
        onClick={() => setIsOpen(!isOpen)}
        style={{ WebkitAppRegion: 'no-drag' }}
      >
        <ChevronDown size={18} strokeWidth={2} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full left-0 mt-3 w-[320px] bg-white/90 backdrop-blur-3xl rounded-2xl shadow-[0_20px_60px_-10px_rgba(0,0,0,0.15)] border border-white/20 z-3000 overflow-hidden flex flex-col max-h-150 ring-1 ring-black/5"
          >
            <div className="p-4 border-b border-black/5 bg-white/50 backdrop-blur-md">
              <div className="relative flex items-center">
                <Search className="absolute left-3.5 text-black/40" size={16} />
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Search Tabs"
                  className="w-full bg-black/5 hover:bg-black/10 focus:bg-white transition-all rounded-xl pl-10 pr-4 py-2.5 text-sm text-black placeholder:text-black/40 outline-none border-[1.5px] border-transparent focus:border-orbit-accent/50 focus:shadow-sm font-medium"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <span className="absolute right-3 text-[10px] font-bold text-black/30 border border-black/10 rounded px-1.5 py-0.5">
                  Ctrl+Shift+A
                </span>
              </div>
            </div>

            <div className="overflow-y-auto flex-1 custom-scrollbar">
              {/* Open Tabs Section */}
              {filteredOpenTabs.length > 0 && (
                <div className="py-2">
                  <h3 className="px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-black/40">
                    Open Tabs
                  </h3>
                  <div className="space-y-0.5">
                    {filteredOpenTabs.map(tab => {
                      const isActive = tab.id === activeTabId;
                      const favicon = getFavicon(tab.url);

                      return (
                        <div 
                          key={tab.id}
                          onClick={() => {
                            onSelectTab(tab.id);
                            setIsOpen(false);
                          }}
                          className={`
                            group flex items-center gap-3 px-4 py-3 mx-2 rounded-xl cursor-pointer transition-all duration-200
                            ${isActive ? 'bg-orbit-accent/5' : 'hover:bg-black/5'}
                          `}
                        >
                          <div className="w-9 h-9 rounded-lg bg-white shadow-sm border border-black/5 flex items-center justify-center shrink-0 overflow-hidden relative">
                            {favicon ? (
                              <img src={favicon} alt="" className="w-5 h-5 object-contain" />
                            ) : (
                               <OrbitLogo size={18} variant="icon" />
                            )}
                            
                            {/* Loading Indicator */}
                            {tab.isLoading && (
                                <div className="absolute inset-x-0 bottom-0 h-0.5 bg-orbit-accent animate-pulse" />
                            )}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className={`text-sm font-semibold truncate mb-0.5 ${isActive ? 'text-orbit-accent' : 'text-black'}`}>
                              {tab.title || 'New Tab'}
                            </div>
                            <div className="text-[11px] text-black/40 truncate font-medium">
                              {tab.url === 'about:blank' ? 'Start Page' : new URL(tab.url).hostname}
                            </div>
                          </div>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onCloseTab(tab.id);
                            }}
                            className="opacity-0 group-hover:opacity-100 p-1.5 rounded-md hover:bg-black/10 text-black/40 hover:text-red-500 transition-all"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Recently Closed Section */}
              {filteredClosedTabs.length > 0 && (
                <div className="py-2 border-t border-black/5">
                  <h3 className="px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-black/40 flex items-center gap-2">
                    Recently Closed
                  </h3>
                  <div className="space-y-0.5">
                    {filteredClosedTabs.map((tab, idx) => {
                      return (
                        <div 
                          key={`${tab.id}-${idx}`}
                          onClick={() => {
                            onRestoreTab(tab);
                            setIsOpen(false);
                          }}
                          className="group flex items-center gap-3 px-4 py-3 mx-2 rounded-lg cursor-pointer hover:bg-black/5 transition-colors"
                        >
                          <div className="w-8 h-8 rounded-md bg-black/5 flex items-center justify-center shrink-0">
                             <Clock size={16} className="text-black/40" />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-black/70 truncate group-hover:text-black transition-colors">
                              {tab.title}
                            </div>
                            <div className="text-[11px] text-black/40 truncate flex items-center gap-1">
                              {tab.url !== 'about:blank' && new URL(tab.url).hostname}
                              <span>•</span>
                              <span>{getTimeAgo(tab.closedAt)}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              
              {filteredOpenTabs.length === 0 && filteredClosedTabs.length === 0 && (
                <div className="py-12 flex flex-col items-center justify-center text-center opacity-40">
                  <Search size={32} className="mb-2" />
                  <p className="text-sm">No tabs found</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TabSearch;
