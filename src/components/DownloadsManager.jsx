import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Folder, File, Trash2, CheckCircle2, Clock, AlertCircle, ArrowRight } from 'lucide-react';

const DownloadsManager = ({ onClose, anchorRef, onOpenFullHistory }) => {
  const [downloads, setDownloads] = useState([]);

  // Compute position from the anchor button's bounding rect
  const getPosition = () => {
    if (anchorRef?.current) {
      const rect = anchorRef.current.getBoundingClientRect();
      return {
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right - 4,
      };
    }
    return { top: 88, right: 16 };
  };
  const pos = getPosition();

  useEffect(() => {
    // Initial load
    window.orbit.downloads.list().then(setDownloads);

    // Dynamic listeners
    const unsubStarted = window.orbit.downloads.onStarted((item) => {
      setDownloads(prev => [item, ...prev]);
    });

    const unsubUpdated = window.orbit.downloads.onUpdated((updatedItem) => {
      setDownloads(prev => prev.map(item => item.id === updatedItem.id ? updatedItem : item));
    });

    const unsubList = window.orbit.downloads.onListUpdated((newList) => {
      setDownloads(newList);
    });

    return () => {
      unsubStarted();
      unsubUpdated();
      unsubList();
    };
  }, []);

  const formatSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <>
      {/* Click-away backdrop */}
      <div 
        className="fixed inset-0 z-6999" 
        onClick={onClose}
      />
      
      <motion.div
        initial={{ opacity: 0, y: -10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10, scale: 0.95 }}
        style={{ top: pos.top, right: pos.right }}
        className="fixed w-90 max-h-120 bg-orbit-bg border border-orbit-border shadow-[0_20px_70px_rgba(0,0,0,0.4)] rounded-2xl z-9000 flex flex-col overflow-hidden backdrop-blur-3xl"
      >
        {/* Decorative Indicator Arrow - Perfectly aligned with the right edge of the icon */}
        <div className="absolute -top-1.5 right-2.5 w-3 h-3 bg-orbit-bg border-t border-l border-orbit-border rotate-45 z-20" />

        <div className="p-4 border-b border-orbit-border/50 flex items-center justify-between bg-orbit-surface/30 backdrop-blur-md">
          <h2 className="font-bold text-[14px] text-orbit-text tracking-tight">Recent download history</h2>
          <button 
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-orbit-card border border-orbit-border/50 text-orbit-text/70 transition-all hover:text-orbit-text group"
            title="Close"
          >
            <X size={16} strokeWidth={2.5} className="group-hover:scale-110 transition-transform" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-2 py-3 space-y-1 custom-scrollbar">
          {downloads.length === 0 ? (
            <div className="py-16 flex flex-col items-center justify-center opacity-20 gap-3">
              <Download size={32} strokeWidth={1.5} />
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">Empty history</span>
            </div>
          ) : (
            downloads.map((item) => (
              <div 
                key={item.id}
                className="p-3 rounded-xl hover:bg-orbit-surface/80 group transition-all cursor-default"
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-orbit-card border border-orbit-border/20 flex items-center justify-center text-orbit-text shrink-0 shadow-sm transition-transform group-hover:scale-105">
                    {item.state === 'completed' ? (
                       <File size={20} strokeWidth={1.5} /> 
                    ) : (
                       <Download size={20} strokeWidth={1.5} className="animate-pulse text-orbit-accent" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                       <div className="flex-1 min-w-0">
                          <h3 className="text-[13px] font-bold text-orbit-text truncate leading-relaxed" title={item.filename}>
                            {item.filename}
                          </h3>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className={`text-[11px] font-medium ${item.state === 'completed' ? 'text-orbit-text-dim' : 'text-orbit-accent'}`}>
                               {item.totalBytes > 0 ? formatSize(item.totalBytes) : formatSize(item.receivedBytes)} • {item.state === 'completed' ? 'Done' : item.state}
                            </span>
                          </div>
                       </div>
                       
                       <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={(e) => { e.stopPropagation(); window.orbit.downloads.showInFolder(item.id); }}
                            className="p-1.5 rounded-lg hover:bg-orbit-accent/10 hover:text-orbit-accent text-orbit-text/40 transition-all"
                            title="Show in Folder"
                          >
                            <Folder size={14} />
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); window.orbit.downloads.remove(item.id); }}
                            className="p-1.5 rounded-lg hover:bg-red-500/10 hover:text-red-500 text-orbit-text/40 transition-all"
                            title="Remove from history"
                          >
                            <Trash2 size={14} />
                          </button>
                       </div>
                    </div>

                    {item.state === 'progressing' && (
                      <div className="mt-2 h-1 w-full bg-orbit-card rounded-full overflow-hidden relative">
                        {item.totalBytes > 0 ? (
                          <motion.div 
                            className="h-full bg-orbit-accent shadow-[0_0_8px_rgba(var(--orbit-accent-rgb),0.5)]"
                            initial={{ width: 0 }}
                            animate={{ width: `${item.percentage}%` }}
                            transition={{ type: 'spring', bounce: 0, duration: 0.3 }}
                          />
                        ) : (
                          /* Indeterminate progress for unknown file size */
                          <motion.div 
                            className="absolute inset-0 bg-orbit-accent shadow-[0_0_8px_rgba(var(--orbit-accent-rgb),0.5)]"
                            initial={{ x: '-100%' }}
                            animate={{ x: '100%' }}
                            transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                            style={{ width: '40%' }}
                          />
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-3 bg-orbit-surface/30 backdrop-blur-md border-t border-orbit-border/50">
          <button 
            onClick={onOpenFullHistory}
            className="w-full py-2.5 rounded-xl hover:bg-orbit-accent hover:text-white text-orbit-accent text-[12px] font-bold transition-all flex items-center justify-between px-4 group"
          >
            Full download history
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-50 group-hover:opacity-100 transition-opacity">
               <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
               <polyline points="15 3 21 3 21 9" />
               <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
          </button>
        </div>
      </motion.div>
    </>
  );
};

export default DownloadsManager;
