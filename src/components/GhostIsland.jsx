import React, { memo, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Globe, Shield, Star, RefreshCw, X } from 'lucide-react';
import OrbitLogo from './OrbitLogo';

const GhostIsland = ({
  activeTab,
  onNavigate,
  onBack,
  onForward,
  onReload,
  onStop,
  onToggleBookmark,
  isOverview,
  onToggleOverview
}) => {
  const [inputValue, setInputValue] = useState(activeTab?.url || '');
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (!isFocused) {
      setInputValue(activeTab?.url === 'about:blank' ? '' : activeTab?.url || '');
    }
  }, [activeTab?.url, isFocused]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onNavigate(inputValue);
    e.target.querySelector('input').blur();
  };

  return (
    <div className="fixed top-6 left-0 right-0 z-50 flex justify-center pointer-events-none">
      <div className="ghost-island w-[400px] h-[52px] rounded-2xl flex items-center px-4 gap-3 pointer-events-auto relative overflow-hidden group">
        {/* Loading Progress Line */}
        {activeTab?.isLoading && (
          <div className="loading-bar absolute top-0 left-0 w-full animate-pulse" />
        )}
        
        {/* Navigation Controls */}
        <div className="flex items-center gap-1 no-drag">
          <button 
            onClick={onBack}
            disabled={!activeTab?.canGoBack}
            className="p-1.5 rounded-lg hover:bg-white/10 text-white/50 hover:text-white disabled:opacity-20 transition-all"
          >
            <ChevronLeft size={16} strokeWidth={2.5} />
          </button>
          <button 
            onClick={onForward}
            disabled={!activeTab?.canGoForward}
            className="p-1.5 rounded-lg hover:bg-white/10 text-white/50 hover:text-white disabled:opacity-20 transition-all"
          >
            <ChevronRight size={16} strokeWidth={2.5} />
          </button>
        </div>

        {/* URL Input */}
        <form onSubmit={handleSubmit} className="flex-1 flex items-center gap-2 px-2 no-drag h-full">
          <div className="flex items-center text-white/30">
            {activeTab?.url?.startsWith('https') ? <Shield size={12} fill="currentColor" /> : <Globe size={12} />}
          </div>
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="Search or enter URL"
            className="w-full bg-transparent border-none outline-none text-[13px] text-active text-white placeholder:text-white/20"
            spellCheck={false}
          />
        </form>

        {/* Action Buttons */}
        <div className="flex items-center gap-1 no-drag">
          <button 
            onClick={onToggleBookmark}
            className="p-1.5 rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition-all"
          >
            <Star size={14} strokeWidth={2} />
          </button>
          <button 
            onClick={onToggleOverview}
            className={`p-1.5 rounded-lg hover:bg-white/10 transition-all ${isOverview ? 'text-indigo-400 bg-white/5' : 'text-white/50 hover:text-white'}`}
          >
            <RefreshCw size={14} strokeWidth={2} className={activeTab?.isLoading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default memo(GhostIsland);
