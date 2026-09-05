import React, { useState, useEffect, useRef } from 'react';
import { Search, X, ChevronUp, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const FindBar = ({ activeTabId, onClose }) => {
  const [text, setText] = useState('');
  const [result, setResult] = useState({ activeMatchOrdinal: 0, matches: 0 });
  const inputRef = useRef(null);

  useEffect(() => {
    const focus = () => {
      inputRef.current?.focus();
      inputRef.current?.select();
    };
    
    focus();
    window.addEventListener('orbit:focus-find', focus);

    const unbind = window.orbit.ipcRenderer.on('page:found-in-page', (data) => {
      if (data.tabId === activeTabId) {
        setResult(data);
      }
    });
    
    return () => {
      window.removeEventListener('orbit:focus-find', focus);
      unbind?.();
      window.orbit.ipcRenderer.send('page:find-stop');
    };
  }, [activeTabId]);

  const handleSearch = (val) => {
    setText(val);
    if (val) {
      window.orbit.ipcRenderer.send('page:find-start', { text: val });
    } else {
      window.orbit.ipcRenderer.send('page:find-stop');
      setResult({ activeMatchOrdinal: 0, matches: 0 });
    }
  };

  const handleNext = () => {
    if (text) {
      window.orbit.ipcRenderer.send('page:find-next', { text });
    }
  };

  const handlePrev = () => {
    if (text) {
      window.orbit.ipcRenderer.send('page:find-prev', { text });
    }
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter') {
      if (e.shiftKey) handlePrev();
      else handleNext();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div
      className="absolute top-24 right-6 z-1000 no-drag"
    >
      <div className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-[#28282b] border border-black/10 dark:border-white/10 rounded-xl shadow-[0_4px_24px_rgba(0,0,0,0.25)]">
        <div className="flex items-center gap-2 border-r border-black/5 dark:border-white/5 pr-2 mr-1">
          <Search size={14} className="text-nexus-text opacity-40" />
          <input
            ref={inputRef}
            type="text"
            value={text}
            onChange={(e) => handleSearch(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Find in page..."
            className="w-48 bg-transparent text-[13px] font-medium text-nexus-text placeholder:text-nexus-text/30 outline-none"
          />
          {text && (
            <span className="text-[11px] font-bold text-nexus-text opacity-40 whitespace-nowrap min-w-12 text-right">
              {result.matches > 0 ? `${result.activeMatchOrdinal} of ${result.matches}` : '0 of 0'}
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-0.5">
          <button 
            onClick={handlePrev}
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-nexus-text/5 text-nexus-text opacity-60 hover:opacity-100 transition-all active:scale-90"
          >
            <ChevronUp size={16} />
          </button>
          <button 
            onClick={handleNext}
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-nexus-text/5 text-nexus-text opacity-60 hover:opacity-100 transition-all active:scale-90"
          >
            <ChevronDown size={16} />
          </button>
          <div className="w-1" />
          <button 
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-500/10 text-red-500 opacity-60 hover:opacity-100 transition-all active:scale-90"
          >
            <X size={15} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default FindBar;
