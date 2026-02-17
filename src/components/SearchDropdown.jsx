import React, { memo } from 'react';
import { 
  Search, 
  History, 
  TrendingUp, 
  ArrowRight,
  ArrowUpRight
} from 'lucide-react';
import OrbitLogo from './OrbitLogo';

const SearchDropdown = ({ 
  isFocused, 
  inputValue, 
  suggestions, 
  history, 
  trendingSearches, 
  selectedIndex, 
  setSelectedIndex, 
  setInputValue, 
  handleSubmit,
  onClose
}) => {
  if (!isFocused) return null;

  return (
    <>
      {/* Click-outside Backdrop */}
      <div 
        className="fixed inset-0 z-9999" 
        onMouseDown={onClose}
      />
      
      <div className="absolute top-12 left-0 right-0 bg-white rounded-4xl shadow-[0_32px_120px_rgba(0,0,0,0.16)] overflow-hidden z-10000 border border-slate-100 flex flex-col animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modern Minimalist Metadata Header */}
        <div className="px-8 pt-6 pb-2">
            <div className="flex items-center gap-2 opacity-40">
               <OrbitLogo size={12} variant="icon" className="text-slate-900" />
               <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-900">Intelligence</span>
            </div>
        </div>

        {/* Search List - Focused & Clean */}
        <div className="max-h-125 overflow-y-auto pb-6 custom-scrollbar px-3">
          {suggestions.length > 0 ? (
            <div className="space-y-0.5">
              {suggestions.map((item, idx) => {
                const isYouTube = item.toLowerCase().includes('youtube');
                const isGoogle = item.toLowerCase().includes('google');
                
                return (
                  <div 
                    key={idx}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      setInputValue(item);
                      handleSubmit(item);
                    }}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`flex items-center px-6 py-2 gap-5 cursor-pointer rounded-2xl transition-all ${
                      selectedIndex === idx 
                        ? 'bg-slate-900 text-white shadow-xl shadow-slate-200 scale-[1.005]' 
                        : 'hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <div className={`shrink-0 w-8 h-8 flex items-center justify-center rounded-xl ${
                      selectedIndex === idx ? 'bg-white/10' : 'bg-slate-200/40'
                    }`}>
                      {isYouTube ? (
                        <OrbitLogo size={14} variant="icon" className={selectedIndex === idx ? 'text-white' : 'text-red-500'} />
                      ) : isGoogle ? (
                        <img src="https://www.google.com/s2/favicons?domain=google.com&sz=128" className="w-4 h-4" alt="" />
                      ) : (
                        <Search size={14} className={selectedIndex === idx ? 'text-white' : 'text-slate-400'} strokeWidth={2.5} />
                      )}
                    </div>
                    
                    <div className="flex flex-col min-w-0">
                      <span className={`text-[14px] font-semibold truncate tracking-tight transition-colors ${
                        selectedIndex === idx ? 'text-white' : 'text-slate-900 group-hover:text-black'
                      }`}>
                        {item}
                      </span>
                    </div>
                    
                    <div className={`ml-auto flex items-center gap-2 transition-all ${selectedIndex === idx ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-2'}`}>
                       <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">Go</span>
                       <ArrowUpRight size={14} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="space-y-6 pt-2">
              <section>
                <div className="px-6 py-2 mb-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <div className="w-1 h-1 rounded-full bg-slate-400" />
                  {history.length > 0 ? 'Recently Visited' : 'Suggested Topics'}
                </div>
                
                <div className="space-y-0.5">
                  {(history.length > 0 ? history : trendingSearches).map((item, idx) => (
                    <div 
                      key={idx}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setInputValue(item);
                        handleSubmit(item);
                      }}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={`flex items-center px-6 py-2 gap-5 cursor-pointer rounded-2xl transition-all ${
                        selectedIndex === idx 
                          ? 'bg-slate-900 text-white shadow-xl shadow-slate-200 scale-[1.005]' 
                          : 'hover:bg-slate-50 text-slate-600'
                      }`}
                    >
                      <div className={`shrink-0 w-8 h-8 flex items-center justify-center rounded-xl ${
                        selectedIndex === idx ? 'bg-white/10' : 'bg-slate-200/40'
                      }`}>
                        {history.length > 0 ? (
                          <History size={14} className={selectedIndex === idx ? 'text-white' : 'text-slate-400'} strokeWidth={2.5} />
                        ) : (
                          <TrendingUp size={14} className={selectedIndex === idx ? 'text-white' : 'text-slate-400'} strokeWidth={2.5} />
                        )}
                      </div>
                      <span className={`text-[14px] font-semibold truncate tracking-tight ${
                        selectedIndex === idx ? 'text-white' : 'text-slate-800'
                      }`}>
                        {item}
                      </span>
                      <ArrowRight size={14} className={`ml-auto transition-all ${selectedIndex === idx ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-2'}`} />
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}
        </div>

        {/* Minimal Footer */}
        <div className="px-8 py-4 bg-slate-50/50 border-t border-slate-100/50 flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-2">
              <kbd className="px-1.5 py-0.5 rounded border border-slate-200 bg-white text-[9px] font-sans">↑↓</kbd> Navigate
            </span>
            <span className="flex items-center gap-2">
              <kbd className="px-1.5 py-0.5 rounded border border-slate-200 bg-white text-[9px] font-sans">Enter</kbd> Open
            </span>
          </div>
          <div className="flex items-center gap-2">
            Orbit <OrbitLogo size={8} variant="icon" className="text-slate-400" /> <span className="opacity-50 tracking-tighter">v.4.0</span>
          </div>
        </div>
      </div>
    </>
  );
};

export default memo(SearchDropdown);
