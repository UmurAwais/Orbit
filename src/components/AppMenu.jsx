import React, { useState, useEffect, useRef } from 'react';
import { 
  MoreVertical, ChevronLeft, ChevronRight, Bookmark,
  ZoomIn, ZoomOut, Printer, Search as SearchIcon, Download,
  History, Settings, Star, HelpCircle, Plus as PlusIcon, Monitor, Puzzle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { TooltipWrapper } from './Tooltip';

export default function AppMenu({
  activeTab,
  onNavigate,
  onAddTab,
  bookmarks = [],
  historyItems = [],
  onOpenSettings,
  onOpenDownloads,
  onOpenExtensions,
  isUpdateReady = false,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [menuPage, setMenuPage] = useState('main'); // 'main' | 'history' | 'bookmarks'
  const menuBtnRef = useRef(null);

  // Close menu when tab changes
  useEffect(() => { 
    setMenuOpen(false); 
    setMenuPage('main'); 
  }, [activeTab?.id]);

  const openMenu = () => { 
    setMenuPage('main'); 
    setMenuOpen(v => !v); 
  };
  
  const closeMenu = () => { 
    setMenuOpen(false); 
    setMenuPage('main'); 
  };

  // Sync real zoom level when menu opens or tab changes
  useEffect(() => {
    if (menuOpen && activeTab?.id) {
      window.orbit?.tabs?.getZoom({ id: activeTab.id })
        .then(val => { if (val) setZoom(val); })
        .catch(() => setZoom(100));
    }
  }, [menuOpen, activeTab?.id]);

  const handleZoom = async (e, direction) => {
    e?.stopPropagation();
    if (!activeTab?.id) return;
    try {
      let newZoom;
      if (direction === 'in') {
        newZoom = await window.orbit?.tabs?.zoomIn({ id: activeTab.id });
      } else {
        newZoom = await window.orbit?.tabs?.zoomOut({ id: activeTab.id });
      }
      if (newZoom) setZoom(newZoom);
    } catch (err) {
      console.error('Zoom failed:', err);
    }
  };

  const resetZoom = async (e) => {
    e?.stopPropagation();
    if (!activeTab?.id) return;
    try {
      const newZoom = await window.orbit?.tabs?.resetZoom({ id: activeTab.id });
      setZoom(newZoom || 100);
    } catch (err) {
      setZoom(100);
    }
  };

  const menuAction = (fn) => {
    closeMenu();
    fn?.();
  };

  return (
    <div className="relative" ref={menuBtnRef}>
      <TooltipWrapper text="Customize and control Orbit">
        <button
          type="button"
          onClick={openMenu}
          className={`w-7 h-7 flex items-center justify-center rounded-full transition-all duration-200 cursor-pointer relative ${
            menuOpen 
              ? 'bg-black/10 dark:bg-white/15 text-nexus-text opacity-100' 
              : 'hover:bg-black/5 dark:hover:bg-white/5 text-nexus-text opacity-60 hover:opacity-100'
          }`}
        >
          <MoreVertical size={16} strokeWidth={2} />
          {isUpdateReady && (
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-[#635BFF] rounded-full border-2 border-orbit-bg shadow-[0_0_8px_#635BFF] animate-pulse" />
          )}
        </button>
      </TooltipWrapper>

      <AnimatePresence>
        {menuOpen && (
          <>
            {/* Backdrop */}
            <div className="fixed inset-0 z-99990" onClick={closeMenu} />

            {/* Menu panel */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -6 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -6 }}
              transition={{ duration: 0.13, ease: 'easeOut' }}
              className="absolute right-0 z-99999 mt-2 w-64 rounded-xl bg-white/95 dark:bg-[#28292d]/95 backdrop-blur-xl border border-black/8 dark:border-white/10 shadow-2xl overflow-hidden"
              style={{ top: '100%' }}
            >
              {/* Zoom row */}
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-black/5 dark:border-white/5">
                <span className="text-[12px] font-medium text-nexus-text opacity-70">Zoom</span>
                <div className="flex items-center gap-1">
                  <button 
                    onClick={(e) => handleZoom(e, 'out')} 
                    className="cursor-pointer w-7 h-7 flex items-center justify-center rounded-lg hover:bg-nexus-text/10 text-nexus-text transition-all text-lg font-light active:scale-95"
                  >
                    −
                  </button>
                  <button 
                    onClick={resetZoom} 
                    className="cursor-pointer min-w-11 h-7 px-2 rounded-lg hover:bg-nexus-text/10 text-[12px] font-semibold text-nexus-text transition-all active:scale-95"
                  >
                    {zoom}%
                  </button>
                  <button 
                    onClick={(e) => handleZoom(e, 'in')} 
                    className="cursor-pointer w-7 h-7 flex items-center justify-center rounded-lg hover:bg-nexus-text/10 text-nexus-text transition-all text-lg active:scale-95"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Sub-page: History */}
              {menuPage === 'history' && (
                <div className="py-1.5 max-h-72 overflow-y-auto">
                  <button 
                    onClick={() => setMenuPage('main')} 
                    className="cursor-pointer w-full flex items-center gap-2 px-4 py-2 text-[12px] font-semibold text-nexus-text opacity-60 hover:opacity-100 transition-colors"
                  >
                    <ChevronLeft size={13} /> Back
                  </button>
                  {historyItems.length === 0 ? (
                    <p className="px-4 py-3 text-[12px] text-nexus-text opacity-40">No history yet.</p>
                  ) : historyItems.slice().reverse().map((h, i) => (
                    <button 
                      key={i} 
                      onClick={() => menuAction(() => onNavigate(h.url))} 
                      className="cursor-pointer w-full flex flex-col items-start px-4 py-1.5 hover:bg-nexus-text/5 transition-colors"
                    >
                      <span className="text-[12px] font-medium text-nexus-text truncate w-full text-left">{h.title || h.url}</span>
                      <span className="text-[10px] text-nexus-text opacity-40 truncate w-full text-left">{h.url}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Sub-page: Bookmarks */}
              {menuPage === 'bookmarks' && (
                <div className="py-1.5 max-h-72 overflow-y-auto">
                  <button 
                    onClick={() => setMenuPage('main')} 
                    className="cursor-pointer w-full flex items-center gap-2 px-4 py-2 text-[12px] font-semibold text-nexus-text opacity-60 hover:opacity-100 transition-colors"
                  >
                    <ChevronLeft size={13} /> Back
                  </button>
                  {bookmarks.length === 0 ? (
                    <p className="px-4 py-3 text-[12px] text-nexus-text opacity-40">No bookmarks yet.</p>
                  ) : bookmarks.map((b) => (
                    <button 
                      key={b.id} 
                      onClick={() => menuAction(() => onNavigate(b.url))} 
                      className="cursor-pointer w-full flex items-center gap-3 px-4 py-2 hover:bg-nexus-text/5 transition-colors group"
                    >
                      <Bookmark size={13} strokeWidth={2} className="text-nexus-text opacity-50 group-hover:opacity-100 shrink-0" />
                      <span className="flex-1 text-left text-[13px] font-medium text-nexus-text truncate">{b.title}</span>
                      <span className="text-[10px] text-nexus-text opacity-30 truncate max-w-20">{b.url.replace(/^https?:\/\//, '')}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Main menu items */}
              {menuPage === 'main' && (
                <>
                  <div className="py-1.5">
                    {[
                      { icon: PlusIcon,   label: 'New Tab',        shortcut: '⌘T', action: () => onAddTab?.() },
                      { icon: SearchIcon, label: 'Find in Page',   shortcut: '⌘F', action: () => window.orbit?.ipcRenderer?.send('page:find') },
                      { icon: Printer,    label: 'Print…',         shortcut: '⌘P', action: () => window.orbit?.ipcRenderer?.send('page:print', { id: activeTab?.id }) },
                      { icon: Download,   label: 'Save Page As…',  shortcut: '⌘S', action: () => window.orbit?.ipcRenderer?.send('page:save', { id: activeTab?.id }) },
                      { icon: Monitor,    label: 'Cast…',          action: () => alert('Cast is not available in this version of Orbit.') },
                    ].map(({ icon: Icon, label, shortcut, action }) => (
                      <button 
                        key={label} 
                        onClick={() => menuAction(action)}
                        className="cursor-pointer w-full flex items-center gap-3 px-4 py-2 hover:bg-nexus-text/8 dark:hover:bg-white/8 transition-colors group"
                      >
                        <Icon size={14} strokeWidth={2} className="text-nexus-text opacity-60 group-hover:opacity-100 shrink-0" />
                        <span className="flex-1 text-left text-[13px] font-medium text-nexus-text">{label}</span>
                        {shortcut && <span className="text-[11px] text-nexus-text opacity-40">{shortcut}</span>}
                      </button>
                    ))}
                  </div>

                  <div className="border-t border-black/5 dark:border-white/5 py-1.5">
                    <button 
                      onClick={() => setMenuPage('history')}
                      className="cursor-pointer w-full flex items-center gap-3 px-4 py-2 hover:bg-nexus-text/8 dark:hover:bg-white/8 transition-colors group"
                    >
                      <History size={14} strokeWidth={2} className="text-nexus-text opacity-60 group-hover:opacity-100 shrink-0" />
                      <span className="flex-1 text-left text-[13px] font-medium text-nexus-text">History</span>
                      <div className="flex items-center gap-1">
                        <span className="text-[11px] text-nexus-text opacity-40">⌘Y</span>
                        <ChevronRight size={12} className="text-nexus-text opacity-30" />
                      </div>
                    </button>
                    <button 
                      onClick={() => menuAction(() => {
                        if (onOpenDownloads) onOpenDownloads(true);
                        else window.orbit?.ipcRenderer?.send('ui:open-downloads');
                      })}
                      className="cursor-pointer w-full flex items-center gap-3 px-4 py-2 hover:bg-nexus-text/8 dark:hover:bg-white/8 transition-colors group"
                    >
                      <Download size={14} strokeWidth={2} className="text-nexus-text opacity-60 group-hover:opacity-100 shrink-0" />
                      <span className="flex-1 text-left text-[13px] font-medium text-nexus-text">Downloads</span>
                      <span className="text-[11px] text-nexus-text opacity-40">⌘J</span>
                    </button>
                    <button 
                      onClick={() => setMenuPage('bookmarks')}
                      className="cursor-pointer w-full flex items-center gap-3 px-4 py-2 hover:bg-nexus-text/8 dark:hover:bg-white/8 transition-colors group"
                    >
                      <Bookmark size={14} strokeWidth={2} className="text-nexus-text opacity-60 group-hover:opacity-100 shrink-0" />
                      <span className="flex-1 text-left text-[13px] font-medium text-nexus-text">Bookmarks</span>
                      <ChevronRight size={12} className="text-nexus-text opacity-30" />
                    </button>
                  </div>

                  <div className="border-t border-black/5 dark:border-white/5 py-1.5">
                    <button 
                      onClick={() => menuAction(() => {
                        if (onOpenExtensions) onOpenExtensions(true);
                        else window.orbit?.ipcRenderer?.send('ui:open-extensions');
                      })}
                      className="cursor-pointer w-full flex items-center gap-3 px-4 py-2 hover:bg-nexus-text/8 dark:hover:bg-white/8 transition-colors group"
                    >
                      <Puzzle size={14} strokeWidth={2} className="text-nexus-text opacity-60 group-hover:opacity-100 shrink-0" />
                      <span className="flex-1 text-left text-[13px] font-medium text-nexus-text">Extensions</span>
                    </button>
                    <button 
                      onClick={() => menuAction(() => {
                        if (onOpenSettings) onOpenSettings(true);
                        else window.orbit?.ipcRenderer?.send('ui:open-settings');
                      })}
                      className="cursor-pointer w-full flex items-center gap-3 px-4 py-2 hover:bg-nexus-text/8 dark:hover:bg-white/8 transition-colors group"
                    >
                      <Settings size={14} strokeWidth={2} className="text-nexus-text opacity-60 group-hover:opacity-100 shrink-0" />
                      <span className="flex-1 text-left text-[13px] font-medium text-nexus-text">Settings</span>
                    </button>
                    <button 
                      onClick={() => menuAction(() => onNavigate('https://google.com/search?q=Orbit+browser+help'))}
                      className="cursor-pointer w-full flex items-center gap-3 px-4 py-2 hover:bg-nexus-text/8 dark:hover:bg-white/8 transition-colors group"
                    >
                      <HelpCircle size={14} strokeWidth={2} className="text-nexus-text opacity-60 group-hover:opacity-100 shrink-0" />
                      <span className="flex-1 text-left text-[13px] font-medium text-nexus-text">Help</span>
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
