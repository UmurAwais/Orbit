
import React, { useState, useEffect, useCallback, memo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import SegmentedHub from './components/SegmentedHub';
import NewTab from './components/NewTab';
import OrbitLogo from './components/OrbitLogo';
import { Search, ArrowRight, Bookmark, X, Plus, History, Puzzle, Settings } from 'lucide-react';
import TabSearch from './components/TabSearch';
import AISidekick from './components/AISidekick';


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
  
  useEffect(() => {
    window.orbit.ipcRenderer.send('ui:toggle-sidekick', isAISidekickOpen);
  }, [isAISidekickOpen]);

  const [recentlyClosed, setRecentlyClosed] = useState([]);
  
  const [bookmarks] = useState([
    { id: '1', title: 'Google', url: 'https://google.com' },
    { id: '2', title: 'YouTube', url: 'https://youtube.com' },
    { id: '3', title: 'GitHub', url: 'https://github.com' }
  ]);

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

    setIsOverview(false);
    window.orbit.ipcRenderer.send('ui:toggle-overview', false);
    
    const isUrl = query.startsWith('http') || (query.includes('.') && !query.includes(' '));
    const url = isUrl ? (query.startsWith('http') ? query : `https://${query}`) : `https://www.google.com/search?q=${encodeURIComponent(query)}`;
    
    window.orbit.tabs.navigate({ id: activeTabId, url });
    setTabs(prev => prev.map(t => t.id === activeTabId ? { ...t, url, isLoading: true } : t));
  }, [activeTabId]);

  return (
    <div className={`w-full h-screen overflow-hidden relative transition-colors duration-500 pointer-events-none ${isHome || isOverview ? 'bg-white' : 'bg-transparent'}`}>
      <div className="absolute top-0 left-0 right-0 h-16 drag-area z-0 pointer-events-none" />
      
      {/* Header Layer */}
      <div className="fixed top-0 left-0 right-0 h-12 z-1000 flex items-center justify-between pointer-events-none px-4">
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
             className={`h-9 px-4 rounded-xl flex items-center gap-2.5 transition-all duration-300 cursor-pointer ${
               isAISidekickOpen 
                 ? 'bg-orbit-accent text-white shadow-lg' 
                 : 'bg-black/5 hover:bg-black/10 text-black/70 hover:text-black'
             }`}
             style={{ WebkitAppRegion: 'no-drag' }}
           >
             <img src="/assets/orbit.png" className="w-5 h-5 object-contain" alt="" />
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
            tabCount={tabs.length}
          />
        </div>

        {/* Right Side: Navigation Tools */}
        <div className="flex items-center gap-1 pointer-events-auto">
          <button className="h-9 w-9 rounded-lg hover:bg-black/5 active:bg-black/10 flex items-center justify-center text-black/60 hover:text-black transition-all cursor-pointer" title="History" style={{ WebkitAppRegion: 'no-drag' }}>
            <History size={16} strokeWidth={1.5} />
          </button>
          <button className="h-9 w-9 rounded-lg hover:bg-black/5 active:bg-black/10 flex items-center justify-center text-black/60 hover:text-black transition-all cursor-pointer" title="Bookmarks" style={{ WebkitAppRegion: 'no-drag' }}>
            <Bookmark size={16} strokeWidth={1.5} />
          </button>
          <button className="h-9 w-9 rounded-lg hover:bg-black/5 active:bg-black/10 flex items-center justify-center text-black/60 hover:text-black transition-all cursor-pointer" title="Extensions" style={{ WebkitAppRegion: 'no-drag' }}>
            <Puzzle size={16} strokeWidth={1.5} />
          </button>
          <button className="h-9 w-9 rounded-lg hover:bg-black/5 active:bg-black/10 flex items-center justify-center text-black/60 hover:text-black transition-all cursor-pointer" title="Settings" style={{ WebkitAppRegion: 'no-drag' }}>
            <Settings size={16} strokeWidth={1.5} />
          </button>
        </div>
      </div>
      
      <main className={`w-full h-full pt-12 flex relative overflow-hidden pointer-events-auto transition-colors duration-300 ${isHome || isOverview ? 'bg-white' : 'bg-transparent'}`}>
        {/* Browser Content / WebContentsView Section */}
        <motion.div 
          layout
          className={`flex-1 h-full relative z-0 ${isHome || isOverview ? 'pointer-events-auto' : 'pointer-events-none'}`}
        >
          <AnimatePresence mode="wait">
            {isHome && !isOverview && (
              <motion.div 
                key="newtab"
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full h-full flex flex-col items-center justify-center bg-white"
              >
                <NewTab onNavigate={handleNavigate} bookmarks={bookmarks} />
              </motion.div>
            )}

            {isOverview && (
              <motion.div 
                key="overview"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="absolute inset-0 z-50 overflow-y-auto bg-white/80 backdrop-blur-3xl p-24"
              >
                {/* Overview Content ... */}
                <div className="max-w-7xl mx-auto">
                  <div className="flex items-center justify-between mb-12">
                    <h2 className="text-3xl font-bold tracking-tight text-black">Active Spaces</h2>
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
                          aspect-4/3 bg-black/5 rounded-4xl border-[0.5px] border-black/10 overflow-hidden group 
                          transition-all hover:scale-[1.03] hover:bg-black/10 relative cursor-pointer
                          ${tab.id === activeTabId ? 'ring-2 ring-orbit-accent border-transparent' : ''}
                        `}
                      >
                        <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
                          <div className="px-3 py-1 rounded-full bg-white/40 backdrop-blur-xl border border-white/20 text-[10px] font-bold truncate max-w-30">
                            {tab.title || 'New Space'}
                          </div>
                          <button 
                             onClick={(e) => { e.stopPropagation(); handleCloseTab(tab.id); }}
                             className="w-6 h-6 rounded-full bg-black/5 hover:bg-red-500 hover:text-white flex items-center justify-center transition-colors text-black/40"
                          >
                            <X size={12} />
                          </button>
                        </div>
                        <div className="w-full h-full flex items-center justify-center opacity-10">
                           <Plus size={64} className="text-black" />
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
