
import React, { useState, useEffect, useCallback, memo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import SegmentedHub from './components/SegmentedHub';
import NewTab from './components/NewTab';
import OrbitLogo from './components/OrbitLogo';
import { Search, ArrowRight, Bookmark, X, Plus, History, Puzzle, Settings, Minus, Square } from 'lucide-react';
import TabSearch from './components/TabSearch';
import AISidekick from './components/AISidekick';
import ExtensionsManager from './components/ExtensionsManager';
import SettingsManager from './components/SettingsManager';


const App = () => {
  const [tabs, setTabs] = useState([{
    id: 'default',
    title: 'New Tab',
    url: 'about:blank',
    isLoading: false,
    canGoBack: false,
    canGoForward: false,
  }]);
  const [activeTabId, setActiveTabId] = useState('default');
  const [isOverview, setIsOverview] = useState(false);
  const [isAISidekickOpen, setIsAISidekickOpen] = useState(false);
  const [isExtensionsOpen, setIsExtensionsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [pinnedExtensions, setPinnedExtensions] = useState(() => {
    const saved = localStorage.getItem('orbit-pinned-extensions');
    return saved ? JSON.parse(saved) : ['1']; // Default pin
  });

  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('orbit-theme') || 'system';
  });

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

  
  useEffect(() => {
    window.orbit.ipcRenderer.send('ui:toggle-sidekick', isAISidekickOpen);
  }, [isAISidekickOpen]);

  const [recentlyClosed, setRecentlyClosed] = useState([]);
  
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

  useEffect(() => {
    localStorage.setItem('orbit-pinned-extensions', JSON.stringify(pinnedExtensions));
  }, [pinnedExtensions]);

  const togglePinExtension = useCallback((id) => {
    setPinnedExtensions(prev => 
      prev.includes(id) ? prev.filter(extId => extId !== id) : [...prev, id]
    );
  }, []);

  const handleUpdateBookmarks = useCallback((newBookmarks) => {
    setBookmarks(newBookmarks);
  }, []);


  const activeTab = React.useMemo(() => tabs.find(t => t.id === activeTabId), [tabs, activeTabId]);
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

  // Removed ghost header visibility logic to keep it permanent

  const handleSelectTab = useCallback((id) => {
    setActiveTabId(id);
    setIsOverview(false);
    setIsExtensionsOpen(false);
    setIsSettingsOpen(false);
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

  const handleCloseTab = useCallback(async (id) => {
    // Save to recently closed
    const tabToClose = tabs.find(t => t.id === id);
    if (tabToClose) {
      setRecentlyClosed(prev => [{...tabToClose, closedAt: Date.now()}, ...prev].slice(0, 20));
    }

    await window.orbit.tabs.close({ id });
    setTabs(prev => {
      const filtered = prev.filter(t => t.id !== id);
      if (activeTabId === id && filtered.length > 0) {
        handleSelectTab(filtered[filtered.length - 1].id);
      } else if (filtered.length === 0) {
        handleAddTab();
      }
      return filtered;
    });
  }, [tabs, activeTabId, handleSelectTab, handleAddTab]);

  const handleRestoreTab = useCallback((tab) => {
    const newId = Date.now().toString();
    const restoredTab = { ...tab, id: newId, isLoading: true };
    setRecentlyClosed(prev => prev.filter(t => t.id !== tab.id));
    setTabs(prev => [...prev, restoredTab]);
    window.orbit.tabs.create({ id: newId, url: tab.url });
    handleSelectTab(newId);
  }, [handleSelectTab]);

  const handleNavigate = useCallback((input) => {
    const query = input?.trim();
    if (!query) return;

    if (query.toLowerCase() === 'orbit://extensions') {
      setIsExtensionsOpen(true);
      setIsOverview(false);
      return;
    }

    if (query.toLowerCase() === 'orbit://settings') {
      setIsSettingsOpen(true);
      setIsExtensionsOpen(false);
      setIsOverview(false);
      return;
    }

    setIsOverview(false);
    setIsExtensionsOpen(false);
    setIsSettingsOpen(false);
    
    const isUrl = query.startsWith('http') || (query.includes('.') && !query.includes(' '));
    const url = isUrl ? (query.startsWith('http') ? query : `https://${query}`) : `https://www.google.com/search?q=${encodeURIComponent(query)}`;
    
    window.orbit.tabs.navigate({ id: activeTabId, url });
    setTabs(prev => prev.map(t => t.id === activeTabId ? { ...t, url, isLoading: true } : t));
  }, [activeTabId]);

  return (
    <div className={`w-full h-screen overflow-hidden relative transition-colors duration-200 pointer-events-none ${isHome || isOverview || isExtensionsOpen || isSettingsOpen ? 'bg-orbit-bg' : 'bg-transparent'}`}>
      <div className="absolute top-0 left-0 right-0 h-16 drag-area z-0 pointer-events-none" />
      
      {/* Header Layer */}
      <div className="fixed top-0 left-0 right-0 h-14 z-1000 flex items-center justify-between pointer-events-none px-4 border-b border-orbit-border">
        {/* Left Side: Search & AI Trigger */}
        <div className="flex items-center gap-2 pointer-events-auto h-full">
          <TabSearch 
             tabs={tabs}
             activeTabId={activeTabId}
             onSelectTab={handleSelectTab}
             onCloseTab={handleCloseTab}
             recentlyClosed={recentlyClosed}
             onRestoreTab={handleRestoreTab}
           />
           
           {/* Ask Orbit Button */}
           <button 
             onClick={() => setIsAISidekickOpen(prev => !prev)}
             className={`h-9.5 pl-1.5 pr-4 rounded-xl flex items-center gap-2.5 transition-all duration-300 cursor-pointer border border-orbit-border shadow-sm hover:shadow-md ${
               isAISidekickOpen 
                 ? 'bg-orbit-accent text-white border-transparent' 
                 : 'bg-orbit-surface/90 backdrop-blur-md text-orbit-text hover:bg-orbit-bg'
             }`}
             style={{ WebkitAppRegion: 'no-drag' }}
           >
             <div className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${isAISidekickOpen ? 'bg-white/20' : 'bg-orbit-bg shadow-sm'}`}>
               <img src="/assets/orbit.png" className="w-4.5 h-4.5 object-contain" alt="" />
             </div>
             <span className="text-[13px] font-bold tracking-tight">Ask Orbit</span>
           </button>
        </div>

        {/* Center: Search Bar */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-auto">
          <SegmentedHub
            activeTab={activeTab}
            onNavigate={handleNavigate}
            onReload={() => window.orbit.tabs.reload({ id: activeTabId })}
            onStop={() => window.orbit.tabs.stop({ id: activeTabId })}
            onBack={() => window.orbit.tabs.goBack({ id: activeTabId })}
            onForward={() => window.orbit.tabs.goForward({ id: activeTabId })}
            isVisible={true}
            onToggleOverview={() => {
              const nextState = !isOverview;
              setIsOverview(nextState);
              window.orbit.ipcRenderer.send('ui:toggle-overview', nextState);
            }}
            onAddTab={() => handleAddTab()}
            tabCount={tabs.length}
            pinnedExtensions={pinnedExtensions}
            onTogglePin={togglePinExtension}
          />
        </div>

        {/* Right Side: Navigation Tools */}
        <div className="flex items-center gap-1 pointer-events-auto">
          <button className="h-9 w-9 rounded-full hover:bg-orbit-card active:bg-orbit-border flex items-center justify-center text-orbit-text opacity-70 hover:opacity-100 transition-all cursor-pointer" title="History" style={{ WebkitAppRegion: 'no-drag' }}>
            <History size={18} strokeWidth={1.8} />
          </button>
          <button className="h-9 w-9 rounded-full hover:bg-orbit-card active:bg-orbit-border flex items-center justify-center text-orbit-text opacity-70 hover:opacity-100 transition-all cursor-pointer" title="Bookmarks" style={{ WebkitAppRegion: 'no-drag' }}>
            <Bookmark size={18} strokeWidth={1.8} />
          </button>
          <button className="h-9 w-9 rounded-full hover:bg-orbit-card active:bg-orbit-border flex items-center justify-center text-orbit-text opacity-70 hover:opacity-100 transition-all cursor-pointer" title="Extensions" style={{ WebkitAppRegion: 'no-drag' }} onClick={() => handleNavigate('orbit://extensions')}>
            <Puzzle size={18} strokeWidth={1.8} />
          </button>

          <button className="h-9 w-9 rounded-full hover:bg-orbit-card active:bg-orbit-border flex items-center justify-center text-orbit-text opacity-70 hover:opacity-100 transition-all cursor-pointer" title="Settings" style={{ WebkitAppRegion: 'no-drag' }} onClick={() => handleNavigate('orbit://settings')}>
            <Settings size={18} strokeWidth={1.8} />
          </button>
        </div>
      </div>
      
      <main className={`w-full h-full pt-14 flex relative overflow-hidden pointer-events-auto transition-colors duration-200 ${isHome || isOverview || isExtensionsOpen || isSettingsOpen ? 'bg-orbit-bg' : 'bg-transparent'}`}>
        {/* Browser Content / WebContentsView Section */}
        <motion.div 
          layout
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
                />
              </motion.div>
            )}

            {isExtensionsOpen && (
              <motion.div
                key="extensions"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full h-full"
              >
                <ExtensionsManager onNavigate={handleNavigate} />
              </motion.div>
            )}

            {isHome && !isOverview && !isExtensionsOpen && (
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
                  onUpdateBookmarks={handleUpdateBookmarks}
                />

              </motion.div>
            )}

            {isOverview && (
              <motion.div 
                key="overview"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="absolute inset-0 z-50 overflow-y-auto bg-orbit-bg/80 backdrop-blur-3xl p-24"
              >
                {/* Overview Content ... */}
                <div className="max-w-7xl mx-auto">
                  <div className="flex items-center justify-between mb-12">
                    <h2 className="text-3xl font-bold tracking-tight text-orbit-text">Active Spaces</h2>
                    <button 
                      onClick={() => handleAddTab()}
                      className="px-6 py-2.5 rounded-2xl bg-orbit-accent text-white font-bold text-sm hover:scale-105 transition-transform"
                    >
                      New Space
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                    {tabs.map(tab => (
                      <div 
                        key={tab.id} 
                        onClick={() => handleSelectTab(tab.id)}
                        className={`
                          aspect-4/3 bg-orbit-card rounded-4xl border-[0.5px] border-orbit-border overflow-hidden group 
                          transition-all hover:scale-[1.03] hover:bg-orbit-surface relative cursor-pointer
                          ${tab.id === activeTabId ? 'ring-2 ring-orbit-accent border-transparent' : ''}
                        `}
                      >
                        <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
                          <div className="px-3 py-1 rounded-full bg-orbit-surface/40 backdrop-blur-xl border border-orbit-border/20 text-[10px] font-bold truncate max-w-30 text-orbit-text">
                            {tab.title || 'New Space'}
                          </div>
                          <button 
                             onClick={(e) => { e.stopPropagation(); handleCloseTab(tab.id); }}
                             className="w-6 h-6 rounded-full bg-orbit-card hover:bg-red-500 hover:text-white flex items-center justify-center transition-colors text-orbit-text-dim"
                          >
                            <X size={12} />
                          </button>
                        </div>
                        <div className="w-full h-full flex items-center justify-center opacity-10">
                           <Plus size={64} className="text-orbit-text" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* AI Sidekick Section (The Built-in Sidebar) */}
        <AISidekick 
          isOpen={isAISidekickOpen} 
          onClose={() => setIsAISidekickOpen(false)} 
          activeTab={activeTab} 
        />
      </main>
    </div>
  );
};

export default memo(App);
