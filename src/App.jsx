import React, { useState, useEffect, useCallback, memo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import SegmentedHub from './components/SegmentedHub';
import NewTab from './components/NewTab';
import OrbitLogo from './components/OrbitLogo';
import { Search, Sparkles, ArrowRight, Bookmark, Clock, X, Plus } from 'lucide-react';

const ResultCard = memo(({ title, snippet, onOpen }) => (
  <motion.div 
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-white/5 backdrop-blur-xl border-[0.5px] border-black/10 rounded-2xl p-6 hover:bg-white/10 transition-all cursor-pointer group shadow-[0_4px_12px_rgba(0,0,0,0.02)]"
    onClick={onOpen}
  >
    <div className="flex items-center gap-2 mb-4 opacity-40 group-hover:opacity-100 transition-opacity">
      <Sparkles size={14} className="text-[#635BFF]" />
      <span className="text-[10px] font-bold uppercase tracking-widest text-[#635BFF]">Verified Insight</span>
    </div>
    <h3 className="text-[18px] font-bold text-[#635BFF] mb-2 leading-tight tracking-tight">
      {title}
    </h3>
    <p className="text-[14px] font-light text-black/60 leading-relaxed line-clamp-2">
      {snippet}
    </p>
  </motion.div>
));

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
  const [searchQuery, setSearchQuery] = useState('');
  const [isOverview, setIsOverview] = useState(false);
  
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
  }, [activeTabId, handleSelectTab, handleAddTab]);

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
      
      {/* Permanent Hub Layer */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 pt-3 pb-8 px-8 z-[1000] pointer-events-auto">
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
      
      <main className={`w-full h-full relative overflow-hidden flex flex-col items-center ${isHome || isOverview ? 'pointer-events-auto' : 'pointer-events-none'}`}>
        {isHome && !isOverview && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pt-20">
            <NewTab onNavigate={handleNavigate} bookmarks={bookmarks} />
          </div>
        )}

        {isOverview && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute inset-0 z-50 overflow-y-auto bg-white/80 backdrop-blur-3xl p-24"
          >
            <div className="max-w-7xl mx-auto">
              <div className="flex items-center justify-between mb-12">
                <h2 className="text-3xl font-bold tracking-tight text-black">Active Spaces</h2>
                <button 
                  onClick={() => handleAddTab()}
                  className="px-6 py-2.5 rounded-2xl bg-[#635BFF] text-white font-bold text-sm hover:scale-105 transition-transform"
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
                      aspect-[4/3] bg-black/5 rounded-[32px] border-[0.5px] border-black/10 overflow-hidden group 
                      transition-all hover:scale-[1.03] hover:bg-black/10 relative cursor-pointer
                      ${tab.id === activeTabId ? 'ring-2 ring-[#635BFF] border-transparent' : ''}
                    `}
                  >
                    <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
                      <div className="px-3 py-1 rounded-full bg-white/40 backdrop-blur-xl border border-white/20 text-[10px] font-bold truncate max-w-[120px]">
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
      </main>
    </div>
  );
};

export default memo(App);
