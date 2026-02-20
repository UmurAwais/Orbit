import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Search, LayoutGrid } from 'lucide-react';
import OrbitLogo from './OrbitLogo';

const TabOverview = ({ 
  tabs, 
  activeTabId, 
  onSelectTab, 
  onCloseTab, 
  onAddTab, 
  onClose 
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTabs = useMemo(() => {
    return tabs.filter(tab => 
      (tab.title || 'New Tab').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (tab.url || '').toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [tabs, searchQuery]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-6000 bg-orbit-bg/90 backdrop-blur-[50px] overflow-y-auto"
    >
      {/* Safari-style Command Center */}
      <div className="sticky top-0 left-0 right-0 z-50 px-12 py-8 bg-linear-to-b from-orbit-bg via-orbit-bg/80 to-transparent backdrop-blur-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex-1 flex items-center gap-4">
            <h2 className="text-xl font-bold tracking-tight text-orbit-text">Tabs</h2>
            <span className="px-2 py-0.5 rounded-full bg-orbit-accent/10 text-orbit-accent text-[11px] font-black uppercase tracking-widest">
              {tabs.length}
            </span>
          </div>

          <div className="flex-2 max-w-md mx-auto w-full group">
            <div className="relative">
              <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-orbit-text opacity-30 group-focus-within:text-orbit-accent group-focus-within:opacity-100 transition-all" />
              <input 
                type="text"
                placeholder="Search tabs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-10 pl-11 pr-4 rounded-xl bg-orbit-surface/50 border border-orbit-border focus:bg-orbit-surface focus:border-orbit-accent focus:ring-4 ring-orbit-accent/5 outline-none text-sm font-medium text-orbit-text transition-all"
              />
            </div>
          </div>

          <div className="flex-1 flex justify-end gap-3">
            <button 
              onClick={() => onAddTab()}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-orbit-surface border border-orbit-border hover:bg-orbit-accent hover:text-white transition-all shadow-soft cursor-pointer"
            >
              <Plus size={20} />
            </button>
            <button 
              onClick={onClose}
              className="px-6 h-10 flex items-center justify-center rounded-xl bg-orbit-surface border border-orbit-border hover:border-orbit-accent text-sm font-black text-orbit-text transition-all shadow-soft cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-12 pb-24 relative z-10">
        <motion.div 
          initial="hidden"
          animate="show"
          variants={{
            hidden: { opacity: 0 },
            show: {
              opacity: 1,
              transition: { staggerChildren: 0.04 }
            }
          }}
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8"
        >
          {filteredTabs.map((tab) => (
            <motion.div
              key={tab.id}
              variants={{
                hidden: { y: 20, opacity: 0, scale: 0.9 },
                show: { y: 0, opacity: 1, scale: 1 }
              }}
              onClick={() => onSelectTab(tab.id)}
              className={`group cursor-pointer relative rounded-3xl border-2 transition-all duration-500 flex flex-col overflow-hidden ${
                activeTabId === tab.id 
                  ? 'border-orbit-accent bg-orbit-accent/5 shadow-[0_32px_64px_-16px_rgba(var(--orbit-accent-rgb),0.4)]' 
                  : 'border-transparent bg-orbit-surface/80 shadow-2xl backdrop-blur-md hover:border-orbit-border'
              }`}
            >
              {/* Card Header (Safari-style top bar) */}
              <div className="px-5 py-3.5 flex items-center justify-between border-b border-orbit-border/30 bg-orbit-surface/50">
                <div className="flex items-center gap-3 truncate">
                  <div className="w-6 h-6 rounded-lg bg-white/50 dark:bg-black/20 flex items-center justify-center shrink-0 shadow-sm border border-orbit-border/20">
                    {tab.favicon ? (
                      <img src={tab.favicon} className="w-3.5 h-3.5 object-contain" alt="" />
                    ) : (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-20 text-orbit-text">
                        <rect x="3" y="3" width="7" height="7" rx="1.5" />
                        <rect x="14" y="3" width="7" height="7" rx="1.5" />
                        <rect x="14" y="14" width="7" height="7" rx="1.5" />
                        <rect x="3" y="14" width="7" height="7" rx="1.5" />
                      </svg>
                    )}
                  </div>
                  <span className="text-[13px] font-bold truncate text-orbit-text tracking-tight">
                    {tab.title || 'New Tab'}
                  </span>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); onCloseTab(tab.id); }}
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-orbit-text opacity-0 group-hover:opacity-40 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/10 transition-all cursor-pointer"
                >
                  <X size={14} strokeWidth={2.5} />
                </button>
              </div>

              {/* Preview Container - Widescreen Focus */}
              <div className="w-full aspect-video bg-orbit-card relative shadow-inner overflow-hidden">
                {tab.preview ? (
                  <img src={tab.preview} className="w-full h-full object-contain bg-black/5 dark:bg-white/5" alt="" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center opacity-20">
                    <OrbitLogo size={48} className="mb-2" />
                  </div>
                )}
                
                {/* Subtle overlay for inactive cards */}
                {activeTabId !== tab.id && (
                  <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                )}
              </div>

              {activeTabId === tab.id && (
                <div className="absolute -inset-0.5 rounded-[26px] border-2 border-orbit-accent/50 pointer-events-none" />
              )}
            </motion.div>
          ))}

        </motion.div>
      </div>
    </motion.div>
  );
};

export default TabOverview;
