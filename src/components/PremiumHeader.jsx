import React, { useState, useEffect, memo } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  RotateCw, 
  Share, 
  Plus, 
  LayoutGrid, 
  ShieldCheck, 
  BookOpen, 
  Search,
  MoreHorizontal
} from 'lucide-react';
import { motion } from 'framer-motion';

const PremiumHeader = ({ 
  activeTab, 
  onNavigate, 
  onReload, 
  onBack, 
  onForward, 
  onAddTab, 
  onToggleOverview,
  isOverview 
}) => {
  const [inputValue, setInputValue] = useState(activeTab?.url || '');
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (!isFocused) {
      setInputValue(activeTab?.url || '');
    }
  }, [activeTab?.url, isFocused]);

  const getDisplayUrl = (url) => {
    if (!url || url === 'about:blank') return 'Search or Enter URL';
    try {
      if (url.startsWith('https://www.google.com/search')) return 'Search Results';
      const hostname = new URL(url).hostname;
      return hostname.replace('www.', '');
    } catch {
      return url;
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onNavigate(inputValue);
    setIsFocused(false);
  };

  const isHomePage = !activeTab?.url || activeTab?.url === 'about:blank';

  return (
    <div className="h-[72px] w-full flex flex-col bg-white/40 backdrop-blur-[24px] border-b border-black/5 select-none drag">
      <div className="flex-1 flex items-center px-4 gap-6">
        
        {/* Navigation Group (Modern Edge style cluster) */}
        <div className="flex items-center gap-1.5 no-drag min-w-[100px]">
          <button 
            onClick={onBack}
            className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-black/5 text-slate-600 disabled:opacity-10 transition-all duration-300 active:scale-95"
          >
            <ChevronLeft size={20} />
          </button>
          <button 
            onClick={onForward}
            className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-black/5 text-slate-600 disabled:opacity-10 transition-all duration-300 active:scale-95"
          >
            <ChevronRight size={20} />
          </button>
          <button 
            onClick={onReload}
            className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-black/5 text-slate-600 transition-all duration-300"
          >
            <RotateCw size={18} className={activeTab?.isLoading ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* Central Smart Pill (Safari-lite) */}
        <div className="flex-1 flex justify-center no-drag">
          <form 
            onSubmit={handleSubmit}
            className={`
              relative w-full max-w-[640px] h-[40px] flex items-center rounded-2xl border transition-all duration-500
              ${isFocused 
                ? 'bg-white border-blue-500/30 shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-4 ring-blue-500/5' 
                : 'bg-black/5 border-transparent hover:bg-black/10'
              }
            `}
          >
            <div className="absolute left-3.5 flex items-center pointer-events-none text-slate-400">
               <ShieldCheck size={16} className={activeTab?.url?.startsWith('https') ? 'text-green-500' : ''} />
            </div>

            <input
              type="text"
              value={isFocused ? inputValue : getDisplayUrl(activeTab?.url)}
              onChange={(e) => setInputValue(e.target.value)}
              onFocus={() => { setIsFocused(true); setInputValue(isHomePage ? '' : activeTab?.url); }}
              onBlur={() => setIsFocused(false)}
              className="w-full bg-transparent text-[14px] font-semibold text-center focus:text-left focus:outline-none px-12 text-slate-800 tracking-tight"
              spellCheck={false}
              placeholder="Orbiting the web..."
            />

            <div className="absolute right-3.5 flex items-center gap-2 text-slate-400">
              <BookOpen size={16} className="cursor-pointer hover:text-slate-600 transition-colors" />
            </div>
          </form>
        </div>

        {/* Action Group */}
        <div className="flex items-center gap-1.5 no-drag min-w-[100px] justify-end pr-[140px]">
          <button className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-black/5 text-slate-600 transition-all">
            <Share size={20} />
          </button>
          <button 
            onClick={onAddTab}
            className="w-10 h-10 flex items-center justify-center bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-700 hover:shadow-blue-300 transition-all duration-300 active:scale-95"
          >
            <Plus size={22} strokeWidth={3} />
          </button>
          <button 
            onClick={onToggleOverview}
            className={`w-10 h-10 flex items-center justify-center rounded-xl hover:bg-black/5 text-slate-600 ${isOverview ? 'bg-black/5 text-blue-600' : ''}`}
          >
            <LayoutGrid size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default memo(PremiumHeader);
