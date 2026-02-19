import React, { memo, useState, useEffect } from 'react';
import { 
  ArrowLeft, ArrowRight, RefreshCw, Search, Plus, 
  DownloadCloud, Bookmark, LayoutGrid, Maximize, Puzzle,
  Pin, MoreVertical, ExternalLink, X
} from 'lucide-react';

import { motion, AnimatePresence } from 'framer-motion';

const COMMANDS = [
  "Ask Orbit to plan your trip...",
  "Summarize this article instantly...",
  "Search, command, or explore...",
  "Type a goal, not just a URL..."
];

const INSTALLED_EXTENSIONS = [
  { id: '1', name: 'Orbit Dark Mode Pro', icon: '🌙' },
  { id: '2', name: 'AdBlock Ultimate', icon: '🛡️' }
];

const SegmentedHub = memo(({
  activeTab,
  onNavigate,
  onBack,
  onForward,
  onReload,
  onStop,
  onAddTab,
  isVisible = true,
  onToggleOverview,
  tabCount = 1,
  pinnedExtensions = [],
  onTogglePin
}) => {
  const [inputValue, setInputValue] = useState(activeTab?.url || '');
  const [isFocused, setIsFocused] = useState(false);
  const [commandIndex, setCommandIndex] = useState(0);
  const [suggestions, setSuggestions] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isExtensionsDropdownOpen, setIsExtensionsDropdownOpen] = useState(false);

  useEffect(() => {
    if (!isFocused) {
      setInputValue(activeTab?.url === 'about:blank' ? '' : activeTab?.url || '');
      setSuggestions([]);
      setSelectedIndex(-1);
    }
  }, [activeTab?.url, isFocused]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (isExtensionsDropdownOpen && !e.target.closest('.extensions-trigger')) {
        setIsExtensionsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isExtensionsDropdownOpen]);

  useEffect(() => {
    if (isFocused || inputValue.length > 0) return;
    const timer = setInterval(() => {
      setCommandIndex((prev) => (prev + 1) % COMMANDS.length);
    }, 3000);
    return () => clearInterval(timer);
  }, [isFocused, inputValue]);

  // Handle Chromium-style autocomplete
  useEffect(() => {
    if (!isFocused || !inputValue || inputValue.startsWith('http')) {
      setSuggestions([]);
      return;
    }

    const fetchSuggestions = async () => {
      try {
        const results = await window.orbit.ipcRenderer.invoke('tab:getSuggestions', inputValue);
        const processed = results.map(s => ({ type: 'search', text: s }));
        
        // Add "Go to URL" suggestion if it looks like one
        const isUrl = inputValue.includes('.') && !inputValue.includes(' ');
        if (isUrl) {
          processed.unshift({ type: 'url', text: inputValue });
        }
        
        setSuggestions(processed.slice(0, 8));
        setSelectedIndex(-1);
      } catch (e) {
        setSuggestions([]);
      }
    };

    const debounce = setTimeout(fetchSuggestions, 100);
    return () => clearTimeout(debounce);
  }, [inputValue, isFocused]);

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > -1 ? prev - 1 : -1));
    } else if (e.key === 'Escape') {
      setIsFocused(false);
      setSuggestions([]);
    } else if (e.key === 'Enter') {
      if (selectedIndex >= 0 && suggestions[selectedIndex]) {
        e.preventDefault();
        onNavigate(suggestions[selectedIndex].text);
        setIsFocused(false);
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const finalValue = (selectedIndex >= 0 && suggestions[selectedIndex]) 
      ? suggestions[selectedIndex].text 
      : inputValue;
    onNavigate(finalValue);
    setIsFocused(false);
    e.target.querySelector('input').blur();
  };

  const showPlaceholder = !isFocused && inputValue.length === 0;

  return (
    <div className={`segmented-hub group no-drag transition-all duration-200 ease-[cubic-bezier(0.2,0,0,1)] relative w-200 h-10 text-orbit-text border border-orbit-border ${
      isFocused ? 'bg-orbit-bg shadow-2xl shadow-orbit-border' : 'bg-orbit-surface'
    } ${!isVisible && !isFocused ? 'segmented-hub-hidden' : ''}`}>
      {activeTab?.isLoading && (
        <div className="absolute bottom-0 left-0 w-full h-0.5 bg-orbit-accent animate-pulse z-10 rounded-b-[10px]" />
      )}
      
      <div className="w-20 flex items-center gap-2 pl-2">
        <button 
          onClick={onBack}
          disabled={!activeTab?.canGoBack}
          className="p-1.5 rounded-full hover:bg-orbit-card text-orbit-text opacity-70 hover:opacity-100 disabled:opacity-20 transition-all"
        >
          <ArrowLeft size={18} />
        </button>
        <button 
          onClick={onForward}
          disabled={!activeTab?.canGoForward}
          className="p-1.5 rounded-full hover:bg-orbit-card text-orbit-text opacity-70 hover:opacity-100 disabled:opacity-20 transition-all"
        >
          <ArrowRight size={18} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex-1 flex items-center h-full px-4 relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 opacity-40">
          <Search size={17} className={isFocused ? 'text-orbit-accent opacity-100' : ''} />
        </div>
        <input
          type="text"
          value={selectedIndex >= 0 ? suggestions[selectedIndex].text : inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            setSelectedIndex(-1);
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 200)}
          className={`bg-transparent border-none outline-none w-full pl-7 text-[14px] text-orbit-text z-10 transition-all duration-300 ${
            isFocused ? 'text-left font-medium' : 'text-center font-medium opacity-70'
          }`}
          spellCheck={false}
          autoComplete="off"
          style={{ letterSpacing: '-0.01em', fontFamily: 'Satoshi, sans-serif' }}
        />
        

        
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none top-1/2 -translate-y-1/2 h-full">
          <AnimatePresence mode="wait">
            {showPlaceholder && (
              <motion.span
                key={commandIndex}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
                className="text-[13px] font-medium text-orbit-text-dim pl-7"
                style={{ letterSpacing: '-0.02em', fontFamily: 'Satoshi, sans-serif' }}
              >
                {COMMANDS[commandIndex]}
              </motion.span>
            )}
          </AnimatePresence>
        </div>


        {/* Chromium-style Dropdown */}
        <AnimatePresence>
          {isFocused && suggestions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              className="absolute top-[calc(100%+8px)] -left-4 -right-4 bg-orbit-surface border border-orbit-border rounded-2xl shadow-2xl overflow-hidden backdrop-blur-3xl z-2000"
            >
              <div className="py-2">
                {suggestions.map((item, index) => (
                  <div
                    key={index}
                    onClick={() => {
                      onNavigate(item.text);
                      setIsFocused(false);
                    }}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={`px-6 py-3 flex items-center gap-4 cursor-pointer transition-colors ${
                      selectedIndex === index ? 'bg-orbit-card' : 'bg-transparent'
                    }`}
                  >
                    <div className={`opacity-40 text-orbit-text ${selectedIndex === index ? 'opacity-100 text-orbit-accent' : ''}`}>
                      {item.type === 'url' ? <Plus size={14} /> : <Search size={14} />}
                    </div>
                    <div className="flex flex-col">
                      <span className={`text-[14px] text-orbit-text ${selectedIndex === index ? 'font-bold' : 'font-medium'}`}>
                        {item.text}
                      </span>
                      {item.type === 'url' && (
                        <span className="text-[10px] uppercase tracking-widest opacity-40 font-bold text-orbit-text-dim">Go to Website</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </form>

      <div className="flex items-center justify-end gap-3 px-2">
        <button 
          onClick={activeTab?.isLoading ? onStop : onReload}
          className="p-1.5 rounded-full hover:bg-orbit-card text-orbit-text opacity-70 hover:opacity-100 transition-all"
        >
          <RefreshCw size={18} className={activeTab?.isLoading ? 'animate-spin' : ''} />
        </button>
        <div className="w-px h-4 bg-orbit-border mx-1" />
        
        <button 
          onClick={onAddTab}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-orbit-card text-orbit-text opacity-70 hover:opacity-100 transition-all"
          title="New Space"
        >
          <Plus size={18} />
        </button>

        <button 
          onClick={onToggleOverview}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-orbit-card text-orbit-text opacity-70 hover:opacity-100 transition-all relative"
        >
          <div className="w-5 h-5 border-[1.8px] border-current rounded-md flex items-center justify-center">
            <span className="text-[10px] font-bold leading-none translate-y-[0.5px]">
              {tabCount || 1}
            </span>
          </div>
        </button>


        {/* Pinned Extensions */}
        {INSTALLED_EXTENSIONS.filter(ext => pinnedExtensions.includes(ext.id)).map(ext => (
          <button 
            key={ext.id}
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-orbit-card text-[14px] transition-all cursor-pointer"
            title={ext.name}
          >
            {ext.icon}
          </button>
        ))}

        <div className="relative extensions-trigger">
          <button 
            className={`w-8 h-8 flex items-center justify-center rounded-full transition-all ${isExtensionsDropdownOpen ? 'bg-orbit-card text-orbit-text' : 'hover:bg-orbit-card text-orbit-text opacity-70 hover:opacity-100'}`}
            title="Extensions"
            onClick={() => setIsExtensionsDropdownOpen(!isExtensionsDropdownOpen)}
          >
            <Puzzle size={18} strokeWidth={1.8} />
          </button>

          <AnimatePresence>
            {isExtensionsDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute top-full right-0 mt-2 w-72 bg-orbit-surface border border-orbit-border rounded-2xl shadow-2xl z-3000 overflow-hidden backdrop-blur-3xl"
              >
                <div className="p-3 border-b border-orbit-border flex items-center justify-between bg-orbit-card">
                  <span className="text-[11px] font-black uppercase tracking-widest text-orbit-text-dim pl-1">Exensions</span>
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={() => {
                        onNavigate('orbit://extensions');
                        setIsExtensionsDropdownOpen(false);
                      }}
                      className="text-[10px] font-bold text-orbit-accent hover:text-orbit-accent/80 transition-colors flex items-center gap-1 pr-2"
                    >
                      Manage Extensions
                    </button>
                    <button 
                      onClick={() => setIsExtensionsDropdownOpen(false)}
                      className="p-1 rounded-md hover:bg-orbit-card text-orbit-text-dim hover:text-orbit-text transition-all"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
                
                <div className="py-2">
                  {INSTALLED_EXTENSIONS.map(ext => (
                    <div key={ext.id} className="px-2 py-1">
                      <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-orbit-card group/item transition-colors">
                        <div className="w-8 h-8 rounded-lg bg-orbit-card flex items-center justify-center text-lg">
                          {ext.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-bold text-orbit-text truncate">{ext.name}</p>
                        </div>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            onTogglePin(ext.id);
                          }}
                          className={`p-1.5 rounded-lg transition-all ${pinnedExtensions.includes(ext.id) ? 'text-orbit-accent bg-orbit-accent/5' : 'text-orbit-text-dim hover:text-orbit-text hover:bg-orbit-card'}`}
                        >
                          <Pin size={14} className={pinnedExtensions.includes(ext.id) ? 'fill-current' : ''} />
                        </button>
                        <button className="p-1.5 rounded-lg text-orbit-text-dim hover:text-orbit-text hover:bg-orbit-card transition-all">
                          <MoreVertical size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>


      </div>
    </div>
  );
});

export default memo(SegmentedHub);
