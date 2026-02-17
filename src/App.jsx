import React, { useState, useEffect, useCallback, memo } from 'react';

import SafariHeader from './components/SafariHeader';
import NewTab from './components/NewTab';
import OrbitLogo from './components/OrbitLogo';
import { Globe, X } from 'lucide-react';

const App = () => {
  const [tabs, setTabs] = useState([{
    id: 'default',
    title: 'New Tab',
    url: 'about:blank',
    isLoading: false,
    canGoBack: false,
    canGoForward: false,
    zoomFactor: 1,
  }]);
  const [activeTabId, setActiveTabId] = useState('default');
  const [isOverview, setIsOverview] = useState(false);
  const [bookmarks, setBookmarks] = useState(() => {
    try {
      const saved = localStorage.getItem('orbit_bookmarks');
      const parsed = saved ? JSON.parse(saved) : null;
      return Array.isArray(parsed) ? parsed : [
        { id: '1', title: 'Google', url: 'https://google.com' },
        { id: '2', title: 'YouTube', url: 'https://youtube.com' },
        { id: '3', title: 'GitHub', url: 'https://github.com' }
      ];
    } catch (e) {
      console.error('Failed to parse bookmarks:', e);
      return [];
    }
  });

  const initialized = React.useRef(false);

  const [hoverUrl, setHoverUrl] = useState('');

  useEffect(() => {
    localStorage.setItem('orbit_bookmarks', JSON.stringify(bookmarks));
  }, [bookmarks]);

  // Initialize first tab
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    // Initialize backend for the default tab
    window.orbit.tabs.create({ id: 'default', url: 'about:blank' });
    window.orbit.tabs.select({ id: 'default' });

    const unsubscribe = window.orbit.tabs.onUpdate((data) => {
      // TRUST THE BACKEND: It sends the exact state we should display.
      // Force update all properties including url, title, isLoading.
      setTabs(prev => prev.map(t => {
        if (t.id === data.id) {
            return { ...t, ...data };
        }
        return t;
      }));
    });

    const handleTabOpenRequest = (data) => {
       handleAddTab(data.url);
    };
    window.orbit.ipcRenderer.on('tab:open-request', handleTabOpenRequest);
    window.orbit.ipcRenderer.on('tab:hover-update', ({ url }) => setHoverUrl(url));

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  const handleSelectTab = useCallback((id) => {
    setActiveTabId(id);
    setIsOverview(false);
    window.orbit.tabs.select({ id });
    window.orbit.ipcRenderer.send('ui:toggle-overview', false);
  }, []);

  const handleAddTab = useCallback((initialUrl = 'about:blank') => {
    const id = Date.now().toString();
    const newTab = {
      id,
      title: initialUrl === 'about:blank' ? 'New Tab' : 'Loading...',
      url: initialUrl,
      isLoading: false,
      canGoBack: false,
      canGoForward: false,
    };

    setTabs(prev => [...prev, newTab]);
    window.orbit.tabs.create({ id, url: initialUrl });
    handleSelectTab(id);
  }, [handleSelectTab]);

  const handleCloseTab = useCallback(async (id, e) => {
    if (e) e.stopPropagation();
    await window.orbit.tabs.close({ id });
    setTabs(prev => {
      const filtered = prev.filter(t => t.id !== id);
      if (activeTabId === id && filtered.length > 0) {
        const nextId = filtered[filtered.length - 1].id;
        handleSelectTab(nextId);
      } else if (filtered.length === 0) {
        handleAddTab('about:blank');
      }
      return filtered;
    });
  }, [activeTabId, handleAddTab, handleSelectTab]);

  const handleNavigate = useCallback((input) => {
    const query = input?.trim();
    if (!activeTabId || !query) return;
    
    let url = query;
    if (!url.startsWith('http') && url !== 'about:blank') {
       const isUrl = url.includes('.');
       url = isUrl ? `https://${url}` : `https://www.google.com/search?q=${encodeURIComponent(url)}&sourceid=chrome&ie=UTF-8`;
    }
    
    // 1. Fire IPC FIRST
    window.orbit.tabs.navigate({ id: activeTabId, url }).catch(err => {
      console.error('Navigation error:', err);
    });

    // 2. Instant state update: Update URL AND set Loading state
    // We set a temporary title to avoid showing 'New Tab' during navigation start
    setTabs(prev => prev.map(t => t.id === activeTabId ? { 
      ...t, 
      url, 
      title: url.includes('google.com/search') ? query : (url === 'about:blank' ? 'New Tab' : 'Loading...'),
      isLoading: true 
    } : t));
  }, [activeTabId]);

  const handleReload = useCallback(() => {
    if (activeTabId) window.orbit.tabs.reload({ id: activeTabId });
  }, [activeTabId]);

  const handleStop = useCallback(() => {
    if (activeTabId) window.orbit.tabs.stop({ id: activeTabId });
  }, [activeTabId]);

  const handleBack = useCallback(() => {
    if (activeTabId) window.orbit.tabs.goBack({ id: activeTabId });
  }, [activeTabId]);

  const handleForward = useCallback(() => {
    if (activeTabId) window.orbit.tabs.goForward({ id: activeTabId });
  }, [activeTabId]);

  const toggleOverview = useCallback(() => {
    setIsOverview(prev => {
      const nextState = !prev;
      window.orbit.ipcRenderer.send('ui:toggle-overview', nextState);
      return nextState;
    });
  }, []);

  const toggleBookmark = useCallback((tab) => {
    if (!tab || tab.url === 'about:blank') return;
    setBookmarks(prev => {
      const exists = prev.find(b => b.url === tab.url);
      if (exists) {
        return prev.filter(b => b.url !== tab.url);
      } else {
        return [...prev, { id: Date.now().toString(), title: tab.title || new URL(tab.url).hostname, url: tab.url }];
      }
    });
  }, []);

  const activeTab = React.useMemo(() => tabs.find(t => t.id === activeTabId), [tabs, activeTabId]);
  const isNewTab = activeTab?.url === 'about:blank';

  return (
    <div className="flex flex-col w-full h-screen bg-white overflow-hidden">
      <SafariHeader
        tabs={tabs}
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        onCloseTab={handleCloseTab}
        onNavigate={handleNavigate}
        onReload={handleReload}
        onStop={handleStop}
        onBack={handleBack}
        onForward={handleForward}
        onAddTab={() => handleAddTab('about:blank')}
        onToggleOverview={toggleOverview}
        isOverview={isOverview}
        bookmarks={bookmarks}
        onToggleBookmark={() => toggleBookmark(activeTab)}
      />
      
      
      <main className="flex-1 relative overflow-hidden bg-white">
        {/* New Tab Page rendered when URL is about:blank */}
        {isNewTab && !isOverview && (
          <div className="absolute inset-0 z-10">
            <NewTab onNavigate={handleNavigate} />
          </div>
        )}

        {/* Tab Overview (Grid) */}
          {isOverview && (
            <div 
              className="absolute inset-0 z-50 overflow-y-auto bg-slate-100/90 backdrop-blur-3xl p-12"
            >
              <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
                {tabs.map(tab => (
                  <div 
                    key={tab.id} 
                    onClick={() => handleSelectTab(tab.id)}
                    className={`
                      aspect-4/3 bg-white rounded-3xl shadow-sm border border-black/5 overflow-hidden group 
                      transition-all hover:shadow-xl
                      ${tab.id === activeTabId ? 'ring-4 ring-blue-500/30 border-blue-500/50' : ''}
                    `}
                  >
                    <div className="h-12 flex items-center px-4 gap-4 bg-slate-50 border-b border-black/3">
                      <OrbitLogo size={12} variant="icon" className="mr-2 text-slate-400" />
                      <span className="text-[11px] font-bold text-slate-600 truncate flex-1 uppercase tracking-tighter">
                        {tab.url === 'about:blank' ? 'New Tab' : tab.title}
                      </span>
                      <button 
                         onClick={(e) => handleCloseTab(tab.id, e)}
                         className="opacity-0 group-hover:opacity-100 p-1 hover:bg-black/5 rounded-full"
                      >
                        <X size={12} />
                      </button>
                    </div>
                    <div className="flex-1 flex items-center justify-center opacity-10">
                       <Globe size={64} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        {/* Status Bar for Link Hover */}
        {hoverUrl && !isOverview && (
          <div className="absolute bottom-0 left-0 m-0 z-50 bg-[#efeeee]/95 backdrop-blur-md px-3 py-1 rounded-tr-xl border-t border-r border-black/5 text-[11px] font-medium text-slate-600 shadow-sm max-w-[50vw] truncate transition-all duration-200 pointer-events-none">
            {hoverUrl}
          </div>
        )}
      </main>
    </div>
  );
};

export default memo(App);
