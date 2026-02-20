import React, { useState, useEffect, useCallback, memo, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import SegmentedHub from './components/SegmentedHub';
import NewTab from './components/NewTab';
import OrbitLogo from './components/OrbitLogo';
import { Search, ArrowRight, Bookmark, X, Plus, History, Puzzle, Settings, Minus, Square, Key,
  ChevronLeft, ChevronRight, LayoutGrid, Share, MoreHorizontal, User, Download
} from 'lucide-react';
import TabSearch from './components/TabSearch';
import AISidekick from './components/AISidekick';
import ExtensionsManager from './components/ExtensionsManager';
import SettingsManager from './components/SettingsManager';
import TabOverview from './components/TabOverview';
import DownloadsManager from './components/DownloadsManager';

const App = () => {
  const [tabs, setTabs] = useState([{
    id: 'default',
    title: 'New Tab',
    url: 'about:blank',
    isLoading: false,
    canGoBack: false,
    canGoForward: false,
    preview: null,
  }]);
  const [activeTabId, setActiveTabId] = useState('default');
  const [hoveredTabId, setHoveredTabId] = useState(null);
  const [previewPos, setPreviewPos] = useState({ x: 0, y: 0 });
  const [isOverview, setIsOverview] = useState(false);
  const [isAISidekickOpen, setIsAISidekickOpen] = useState(false);
  const [isExtensionsOpen, setIsExtensionsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isDownloadsOpen, setIsDownloadsOpen] = useState(false);
  const [pinnedExtensions, setPinnedExtensions] = useState(() => {
    const saved = localStorage.getItem('orbit-pinned-extensions');
    return saved ? JSON.parse(saved) : ['1'];
  });

  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('orbit-theme') || 'system';
  });

  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const cleanup = window.orbit.ipcRenderer.on('viewport:scroll', (scrollY) => {
      setIsScrolled(scrollY > 20);
    });
    return () => cleanup();
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;
    const applyTheme = (currentTheme) => {
      let activeTheme = currentTheme;
      if (currentTheme === 'system') {
        activeTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }
      root.classList.remove('light', 'dark');
      root.classList.add(activeTheme);
      window.orbit?.ipcRenderer?.send('theme:update', currentTheme);
      localStorage.setItem('orbit-theme', currentTheme);
    };

    applyTheme(theme);

    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => applyTheme('system');
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [theme]);

  const [passwordPrompt, setPasswordPrompt] = useState(null);

  useEffect(() => {
    const handlePasswordPrompt = (data) => {
      setPasswordPrompt(data);
      setTimeout(() => setPasswordPrompt(null), 10000);
    };
    window.orbit.ipcRenderer.on('password-prompt', handlePasswordPrompt);
  }, []);

  const [bookmarks, setBookmarks] = useState(() => {
    const saved = localStorage.getItem('orbit-bookmarks');
    return saved ? JSON.parse(saved) : [
      { id: '1', title: 'Google', url: 'https://google.com' },
      { id: '2', title: 'YouTube', url: 'https://youtube.com' },
      { id: '3', title: 'GitHub', url: 'https://github.com' }
    ];
  });

  useEffect(() => {
    localStorage.setItem('orbit-bookmarks', JSON.stringify(bookmarks));
  }, [bookmarks]);

  const activeTab = useMemo(() => tabs.find(t => t.id === activeTabId), [tabs, activeTabId]);
  const isHome = activeTab?.url === 'about:blank';

  useEffect(() => {
    window.orbit.tabs.create({ id: 'default', url: 'about:blank' });
    window.orbit.tabs.select({ id: 'default' });

    const unsubscribe = window.orbit.tabs.onUpdate((data) => {
      setTabs(prev => prev.map(t => t.id === data.id ? { ...t, ...data } : t));
    });

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  const handleSelectTab = useCallback((id) => {
    setActiveTabId(id);
    setIsOverview(false);
    setIsExtensionsOpen(false);
    setIsSettingsOpen(false);
    setIsDownloadsOpen(false);
    window.orbit.tabs.select({ id });
    window.orbit.ipcRenderer.send('ui:toggle-overview', false);
  }, []);

  const handleAddTab = useCallback((url = 'about:blank') => {
    const id = Date.now().toString();
    const newTab = { id, title: 'New Tab', url, isLoading: false, canGoBack: false, canGoForward: false };
    setTabs(prev => [...prev, newTab]);
    window.orbit.tabs.create({ id, url });
    handleSelectTab(id);
  }, [handleSelectTab]);

  const handleCloseTab = useCallback((id) => {
    if (hoveredTabId === id) setHoveredTabId(null);
    setTabs(prev => {
      const newTabs = prev.filter(t => t.id !== id);
      if (newTabs.length === 0) {
        window.orbit.ipcRenderer.send('window-close');
        return prev; // Window will close, state change doesn't matter much
      }
      if (activeTabId === id) {
        const nextId = newTabs[newTabs.length - 1].id;
        setActiveTabId(nextId);
        window.orbit.tabs.select({ id: nextId });
      }
      return newTabs;
    });
    window.orbit.tabs.close({ id });
  }, [activeTabId, hoveredTabId]);

  const handleNavigate = useCallback((url) => {
    window.orbit.tabs.navigate({ id: activeTabId, url });
  }, [activeTabId]);

  return (
    <div className={`w-full h-screen overflow-hidden relative transition-colors duration-200 bg-orbit-bg`}>
      <div className="absolute top-0 left-0 right-0 h-24 drag-area z-0 pointer-events-none" />

      {/* Orbital Nexus - Global Hybrid Header (Modern Matte Rebuild) */}
      <header className="nexus-chassis drag-area no-drag">
        <div className="nexus-chassis-bg" />
        {/* Tier 1: The Command Deck (Top Row) - Primary Navigation */}
        <div className="nexus-row nexus-top-row pointer-events-auto px-4">
           {/* Left Section: Balanced Spacer */}
           <div className="flex-1 flex items-center no-drag">
              <div className="flex items-center gap-2">
                 <OrbitLogo size={20} />
                 <span className="text-[11px] font-black tracking-[0.2em] text-black">Orbit</span>
              </div>
           </div>

           {/* Center Section: Expansive Search Hub */}
           <div className="flex-4 flex justify-center no-drag">
             <div className="w-full max-w-225">
               <SegmentedHub 
                 activeTab={activeTab}
                 onNavigate={handleNavigate}
                 tabCount={tabs.length}
                 isVisible={true}
                 bookmarks={bookmarks}
                 onUpdateBookmarks={setBookmarks}
               />
             </div>
           </div>

           {/* Right Section: System Control Pod */}
           <div className="flex-1 flex justify-end h-full no-drag">
              <div className="flex items-center h-full">
                 {/* Native Windows Controls Area */}
              </div>
           </div>
        </div>

        {/* Tier 2: The Tab Deck (Bottom Row) - Integrated Stream */}
        <div className="nexus-row nexus-bottom-row pointer-events-auto px-4">
          {/* Left-Aligned Control Stream: Overview -> Tabs -> Add */}
          <div className="flex-1 flex items-center gap-1 no-drag">
            {/* Apple-style Tab Overview Toggle */}
            <button 
              onClick={() => {
                const newState = !isOverview;
                setIsOverview(newState);
                window.orbit.ipcRenderer.send('ui:toggle-overview', newState);
              }}
              className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all duration-300 ${isOverview ? 'bg-orbit-accent text-white shadow-lg' : 'hover:bg-gray-200/60 dark:hover:bg-white/10 text-nexus-text opacity-70 hover:opacity-100'}`}
              title="Show Tab Overview"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" rx="1.5" />
                <rect x="14" y="3" width="7" height="7" rx="1.5" />
                <rect x="14" y="14" width="7" height="7" rx="1.5" />
                <rect x="3" y="14" width="7" height="7" rx="1.5" />
              </svg>
            </button>

            <div className="w-px h-4 bg-nexus-border/20 mx-0.5 shrink-0" />


            {/* Seamless Tab Tray */}
            <div className="flex items-center gap-1.5 overflow-x-auto hide-scrollbar z-9999">
              <div className="nexus-tabs-tray">
                {tabs.map((tab) => (
                  <div 
                    key={tab.id}
                    onClick={() => handleSelectTab(tab.id)}
                    onMouseEnter={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      setHoveredTabId(tab.id);
                      setPreviewPos({ x: rect.left, y: rect.bottom }); // Tighter upward positioning
                    }}
                    onMouseLeave={() => setHoveredTabId(null)}
                    className={`nexus-tab ${activeTabId === tab.id ? 'active' : ''} no-drag group/tab relative`}
                  >
                    {tab.favicon ? (
                      <img src={tab.favicon} className="w-3.5 h-3.5 object-contain rounded-sm" alt="" />
                    ) : (
                      <div className="w-3.5 h-3.5 rounded-full bg-nexus-text/10" />
                    )}
                    <span className="flex-1 truncate text-[11px] font-bold tracking-tight">
                      {tab.title || 'New Tab'}
                    </span>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleCloseTab(tab.id); }}
                      className="nexus-tab-close"
                    >
                      <X size={10} strokeWidth={3} />
                    </button>
                  </div>
                ))}
              </div>

              {/* Authentic Chrome-style New Tab Button */}
              <button 
                onClick={() => handleAddTab()}
                className="w-6 h-6 flex items-center justify-center rounded-full bg-transparent hover:bg-gray-200 text-nexus-text-dim hover:text-nexus-text transition-colors duration-200 no-drag shrink-0"
                title="New Tab"
              >
                <Plus size={18} strokeWidth={2} />
              </button>
            </div>
          </div>

          {/* Right-Aligned Global Tools */}
          <div className="flex items-center gap-0.5 no-drag pl-4">
             <button 
                onClick={() => setIsExtensionsOpen(true)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-200/60 dark:hover:bg-white/10 text-nexus-text opacity-70 hover:opacity-100 transition-all duration-200 cursor-pointer"
                title="Extensions"
             >
               <Puzzle size={15} strokeWidth={2.2} />
             </button>
             <button 
                onClick={() => setIsDownloadsOpen(!isDownloadsOpen)}
                className={`w-8 h-8 flex items-center justify-center rounded-full transition-all duration-200 cursor-pointer ${isDownloadsOpen ? 'bg-orbit-accent text-white shadow-lg' : 'hover:bg-gray-200/60 dark:hover:bg-white/10 text-nexus-text opacity-70 hover:opacity-100'}`}
                title="Downloads"
             >
               <Download size={15} strokeWidth={2.2} />
             </button>
             <button 
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-200/60 dark:hover:bg-white/10 text-nexus-text opacity-70 hover:opacity-100 transition-all duration-200 cursor-pointer"
                title="History"
             >
               <History size={15} strokeWidth={2.2} />
             </button>
             <button 
                onClick={() => setIsSettingsOpen(true)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-200/60 dark:hover:bg-white/10 text-nexus-text opacity-70 hover:opacity-100 transition-all duration-200 cursor-pointer"
                title="Settings"
             >
               <Settings size={15} strokeWidth={2.2} />
             </button>
             
             <div className="w-px h-4 bg-nexus-border mx-2" />

             <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-full hover:bg-gray-200/60 dark:hover:bg-white/10 border border-nexus-border text-[10px] font-bold text-nexus-text opacity-60 hover:opacity-100 transition-all cursor-pointer">
                <User size={12} strokeWidth={2.5} className="opacity-40" />
                <span className="opacity-70 tracking-tight">sample@gmail.com</span>
             </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="w-full h-[calc(100vh-92px)] mt-23 relative z-0">
        <div 
          className={`flex-1 h-full relative z-0 ${isHome || isOverview || isExtensionsOpen || isSettingsOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}
        >
          <AnimatePresence mode="wait">
            {isSettingsOpen && (
              <motion.div
                key="settings"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full h-full"
              >
                <SettingsManager 
                  onNavigate={handleNavigate} 
                  theme={theme}
                  setTheme={setTheme}
                  onClose={() => setIsSettingsOpen(false)}
                />
              </motion.div>
            )}

            {isOverview && (
              <TabOverview 
                tabs={tabs}
                activeTabId={activeTabId}
                onSelectTab={handleSelectTab}
                onCloseTab={handleCloseTab}
                onAddTab={handleAddTab}
                onClose={() => setIsOverview(false)}
              />
            )}

            {isHome && !isOverview && !isExtensionsOpen && !isSettingsOpen && (
              <motion.div 
                key="newtab"
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full h-full flex flex-col items-center justify-center bg-orbit-bg"
              >
                <NewTab 
                  onNavigate={handleNavigate} 
                  bookmarks={bookmarks}
                  onUpdateBookmarks={setBookmarks}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <AISidekick 
          isOpen={isAISidekickOpen} 
          onClose={() => setIsAISidekickOpen(false)} 
          activeTab={activeTab} 
        />
      </main>

      {/* Password Save Prompt */}
      <AnimatePresence>
        {passwordPrompt && (
          <motion.div 
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed top-24 right-4 w-80 bg-white dark:bg-[#1e1e1e] rounded-xl shadow-2xl border border-orbit-border z-3000 p-4 text-orbit-text"
          >
             <div className="flex items-start gap-4">
               <div className="w-10 h-10 rounded-full bg-orbit-accent/10 flex items-center justify-center text-orbit-accent">
                  <Key size={20} />
               </div>
               <div className="flex-1">
                  <h3 className="font-bold text-sm mb-1">Save password?</h3>
                  <p className="text-xs text-orbit-text-dim mb-3">Orbit can save your password for this site.</p>
                  <div className="flex justify-end gap-2">
                     <button onClick={() => setPasswordPrompt(null)} className="px-3 py-1.5 rounded-lg hover:bg-orbit-card text-xs font-bold">Never</button>
                     <button onClick={() => setPasswordPrompt(null)} className="px-4 py-1.5 bg-orbit-accent text-white rounded-lg text-xs font-bold">Save</button>
                  </div>
               </div>
             </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Global Tab Preview Overlay (Top-Level Portal) */}
      <AnimatePresence>
        {hoveredTabId && tabs.some(t => t.id === hoveredTabId) && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            style={{ 
              position: 'fixed',
              left: previewPos.x,
              top: previewPos.y,
              zIndex: 20000, // Highest priority
              pointerEvents: 'none'
            }}
            className="w-56 overflow-visible rounded-xl bg-orbit-bg border border-orbit-accent/30 shadow-[0_20px_50px_rgba(0,0,0,0.3)] backdrop-blur-3xl"
          >
            {/* Decorative Arrow */}
            <div className="absolute -top-1.5 left-6 w-3 h-3 bg-orbit-bg border-t border-l border-orbit-accent/30 rotate-45 z-10" />
            
            <div className="h-32 w-full bg-orbit-card relative overflow-hidden rounded-t-xl">
              {tabs.find(t => t.id === hoveredTabId)?.preview ? (
                <img 
                  src={tabs.find(t => t.id === hoveredTabId).preview} 
                  className="w-full h-full object-cover"
                  alt="Preview"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-2 opacity-20">
                  <div className="w-12 h-12 rounded-full border-2 border-dashed border-orbit-text" />
                  <span className="text-[10px] uppercase tracking-widest font-bold">Capturing...</span>
                </div>
              )}
              {/* Glass Overlay */}
              <div className="absolute inset-0 bg-linear-to-b from-transparent to-orbit-surface/50" />
            </div>
            <div className="p-3 bg-orbit-surface/90 rounded-b-xl">
              <div className="flex items-center gap-2 truncate">
                {tabs.find(t => t.id === hoveredTabId)?.favicon && (
                  <img src={tabs.find(t => t.id === hoveredTabId).favicon} className="w-3 h-3 object-contain" alt="" />
                )}
                <span className="text-[11px] font-bold truncate text-orbit-text">
                  {tabs.find(t => t.id === hoveredTabId)?.title || 'New Tab'}
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isDownloadsOpen && (
          <DownloadsManager onClose={() => setIsDownloadsOpen(false)} />
        )}
      </AnimatePresence>

    </div>
  );
};

export default memo(App);
