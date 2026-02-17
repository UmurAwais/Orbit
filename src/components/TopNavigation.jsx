import React, { useState, useEffect, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, 
  ChevronRight, 
  RotateCw, 
  Shield, 
  Plus, 
  X, 
  Search, 
  Globe,
  Terminal,
  MoreVertical
} from 'lucide-react';

const TopNavigation = ({ 
  tabs, 
  activeTabId, 
  onAddTab, 
  onSelectTab, 
  onCloseTab,
  onNavigate,
  onReload,
  onBack,
  onForward,
  onInspect
}) => {
  const activeTab = tabs.find(t => t.id === activeTabId);
  const [urlInput, setUrlInput] = useState(activeTab?.url || '');
  const [isShieldActive, setIsShieldActive] = useState(true);

  useEffect(() => {
    if (activeTab) setUrlInput(activeTab.url);
  }, [activeTab?.url]);

  const handleSubmit = (e) => {
    e.preventDefault();
    let target = urlInput.trim();
    if (target.startsWith('>')) {
      // Quick Action Handling
      console.log('Action:', target.substring(1));
    } else {
      onNavigate(target);
    }
  };

  return (
    <div className="h-[80px] w-full flex flex-col bg-orbit-base border-b border-white/5 select-none overflow-hidden">
      {/* Tab Bar (Chrome/Firefox Style) */}
      <div className="flex-1 flex items-center px-4 pt-2 gap-1 drag">
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar max-w-full">
          <AnimatePresence mode="popLayout">
            {tabs.map((tab) => (
              <motion.div
                key={tab.id}
                layout
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.8 }}
                onClick={() => onSelectTab(tab.id)}
                className={`
                  group relative flex items-center gap-2 px-4 py-1.5 rounded-full cursor-pointer no-drag
                  min-w-[120px] max-w-[200px] transition-all-smooth
                  ${tab.id === activeTabId 
                    ? 'bg-orbit-surface text-white tab-active' 
                    : 'text-slate-400 hover:bg-white/5'
                  }
                `}
              >
                <Globe size={13} className={tab.id === activeTabId ? 'text-orbit-accent' : 'text-slate-500'} />
                <span className="text-xs font-medium truncate flex-1">
                  {tab.title || 'New Tab'}
                </span>
                <button
                  onClick={(e) => { e.stopPropagation(); onCloseTab(tab.id); }}
                  className="opacity-0 group-hover:opacity-100 p-0.5 rounded-full hover:bg-white/10 transition-opacity"
                >
                  <X size={12} />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
          
          <button 
            onClick={onAddTab}
            className="p-1.5 rounded-full text-slate-500 hover:text-white hover:bg-white/5 transition-all no-drag"
          >
            <Plus size={16} />
          </button>
        </div>
      </div>

      {/* Toolbar (Firefox/Brave Style) */}
      <div className="h-10 flex items-center gap-3 px-4 pb-2 no-drag">
        <div className="flex items-center gap-1">
          <button onClick={onBack} className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400 disabled:opacity-20"><ChevronLeft size={18} /></button>
          <button onClick={onForward} className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 disabled:opacity-20"><ChevronRight size={18} /></button>
          <button onClick={onReload} className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400"><RotateCw size={16} /></button>
        </div>

        <div className="flex-1 flex justify-center">
          <form onSubmit={handleSubmit} className="w-full max-w-3xl relative group omnibox-focus flex items-center bg-slate-800/50 border border-white/5 rounded-xl px-3 py-1 transition-all">
            <div className="flex items-center gap-2 mr-2">
              <button 
                type="button"
                onClick={() => setIsShieldActive(!isShieldActive)}
                className={`transition-colors ${isShieldActive ? 'text-orange-500' : 'text-slate-500'}`}
              >
                <Shield size={14} fill={isShieldActive ? 'currentColor' : 'none'} fillOpacity={0.2} />
              </button>
            </div>
            
            <input
              type="text"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onFocus={(e) => e.target.select()}
              placeholder="Search or type a command (>settings)"
              className="flex-1 bg-transparent text-sm focus:outline-none text-slate-200 placeholder:text-slate-600"
            />
            
            <div className="flex items-center gap-2 ml-2">
              <button type="button" onClick={onInspect} className="text-slate-500 hover:text-orbit-accent"><Terminal size={14} /></button>
              <button type="button" className="text-slate-500 hover:text-white"><MoreVertical size={14} /></button>
            </div>
          </form>
        </div>

        <div className="w-[100px] flex justify-end">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]" />
            <span className="text-[10px] font-bold text-slate-500 tracking-tighter uppercase">Orbit Pro</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default memo(TopNavigation);
