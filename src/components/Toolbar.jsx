import React, { useState, useEffect, memo } from 'react';
import { ChevronLeft, ChevronRight, RotateCw, Globe, Search, ShieldCheck, MoreHorizontal, LayoutGrid, Star } from 'lucide-react';

const Toolbar = ({ url, onNavigate, onReload, onBack, onForward, canGoBack, canGoForward, isLoading }) => {
  const [inputValue, setInputValue] = useState(url);

  useEffect(() => {
    setInputValue(url);
  }, [url]);

  const handleSubmit = (e) => {
    e.preventDefault();
    let targetUrl = inputValue.trim();
    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
      if (targetUrl.includes('.') && !targetUrl.includes(' ')) {
        targetUrl = 'https://' + targetUrl;
      } else {
        targetUrl = `https://www.google.com/search?q=${encodeURIComponent(targetUrl)}`;
      }
    }
    onNavigate(targetUrl);
  };

  return (
    <div className="h-15 flex items-center gap-3 px-4 bg-white/80 backdrop-blur-lg border-b border-slate-200 drag transition-all duration-300">
      {/* Navigation Group (Clean UI) */}
      <div className="flex items-center gap-0.5 no-drag">
        <button 
          onClick={onBack}
          disabled={!canGoBack}
          className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-blue-600 disabled:opacity-20 transition-all duration-200"
        >
          <ChevronLeft size={18} strokeWidth={2.5} />
        </button>
        <button 
          onClick={onForward}
          disabled={!canGoForward}
          className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-blue-600 disabled:opacity-20 transition-all duration-200"
        >
          <ChevronRight size={18} strokeWidth={2.5} />
        </button>
        <button 
          onClick={onReload}
          className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-blue-600 transition-all duration-200"
        >
          <RotateCw size={17} strokeWidth={2.5} className={isLoading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Chrome Style Smart Address Bar */}
      <form onSubmit={handleSubmit} className="flex-1 max-w-4xl mx-auto no-drag">
        <div className="relative group omnibox-focus flex items-center rounded-xl bg-slate-100/80 border border-slate-200/50 hover:bg-slate-100 hover:border-slate-300 transition-all duration-200">
          <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none transition-colors">
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            ) : inputValue.startsWith('https') ? (
              <ShieldCheck size={16} className="text-green-600" />
            ) : (
              <Search size={16} className="text-slate-400 group-focus-within:text-blue-600" />
            )}
          </div>
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onFocus={(e) => e.target.select()}
            placeholder="Search with Google or enter address"
            className="
              w-full bg-transparent text-[13px] font-medium rounded-xl py-2 pl-11 pr-4
              focus:outline-none text-slate-700 placeholder:text-slate-400
            "
          />
          <div className="absolute right-3 flex items-center gap-2">
             <button type="button" className="p-1 hover:bg-slate-200/50 rounded-md text-slate-400 hover:text-slate-600 transition-all">
                <Star size={14} />
             </button>
          </div>
        </div>
      </form>

      {/* Edge/Firefox Style Secondary Actions */}
      <div className="flex items-center gap-1 no-drag">
        <button className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-blue-600 transition-all">
          <LayoutGrid size={18} strokeWidth={2} />
        </button>
        <button className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-blue-600 transition-all">
          <MoreHorizontal size={18} strokeWidth={2} />
        </button>
        <div className="w-px h-6 bg-slate-200 mx-1" />
        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center border border-blue-200 hover:scale-105 transition-transform cursor-pointer">
          <span className="text-[10px] font-bold text-blue-700">U</span>
        </div>
      </div>
    </div>
  );
};

export default memo(Toolbar);
