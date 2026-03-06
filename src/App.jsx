import React, {
  useState,
  useEffect,
  useCallback,
  memo,
  useMemo,
  useRef,
  useLayoutEffect,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import SegmentedHub from "./components/SegmentedHub";
import NewTab from "./components/NewTab";
import FindBar from "./components/FindBar";
import OrbitLogo from "./components/OrbitLogo";
import { TooltipWrapper } from "./components/Tooltip";
import {
  Search,
  ArrowRight,
  Bookmark,
  X,
  Plus,
  History,
  Puzzle,
  Settings,
  Minus,
  Square,
  Key,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  Share,
  MoreHorizontal,
  Download,
  ShieldCheck,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import TabSearch from "./components/TabSearch";
import AISidekick from "./components/AISidekick";
import ExtensionsManager from "./components/ExtensionsManager";
import SettingsManager from "./components/SettingsManager";
import TabOverview from "./components/TabOverview";
import DownloadsManager from "./components/DownloadsManager";
import DownloadsPage from "./components/DownloadsPage";
import TabContextMenu from "./components/TabContextMenu";

const App = () => {
  const [tabs, setTabs] = useState([
    {
      id: "default",
      title: "New Tab",
      url: "about:blank",
      isLoading: false,
      canGoBack: false,
      canGoForward: false,
      preview: null,
    },
  ]);
  const [activeTabId, setActiveTabId] = useState("default");
  const [hoveredTabId, setHoveredTabId] = useState(null);
  const [tabContextMenu, setTabContextMenu] = useState(null);
  const [previewPos, setPreviewPos] = useState({ x: 0, y: 0 });
  const [isOverview, setIsOverview] = useState(false);
  const [isAISidekickOpen, setIsAISidekickOpen] = useState(false);
  const [isExtensionsOpen, setIsExtensionsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isDownloadsOpen, setIsDownloadsOpen] = useState(false);
  const [isDownloadsPageOpen, setIsDownloadsPageOpen] = useState(false);
  const [isHubFocused, setIsHubFocused] = useState(false);
  const [isHeaderHovered, setIsHeaderHovered] = useState(false);
  const [isFindOpen, setIsFindOpen] = useState(false);
  const [isUpdateReady, setIsUpdateReady] = useState(false);
  const [historyItems, setHistoryItems] = useState([]); // { url, title }
  const openDownloads = (val) => setIsDownloadsOpen(val);

  const [pinnedExtensions, setPinnedExtensions] = useState(() => {
    const saved = localStorage.getItem("orbit-pinned-extensions");
    return saved ? JSON.parse(saved) : ["1"];
  });

  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("orbit-theme") || "system";
  });

  const [isScrolled, setIsScrolled] = useState(false);
  const tabTrayRef = useRef(null);
  const downloadBtnRef = useRef(null);
  const [showScrollLeft, setShowScrollLeft] = useState(false);
  const [showScrollRight, setShowScrollRight] = useState(false);

  const checkScroll = useCallback(() => {
    if (tabTrayRef.current) {
      const { scrollLeft, scrollWidth, offsetWidth } = tabTrayRef.current;
      setShowScrollLeft(scrollLeft > 0);
      setShowScrollRight(scrollLeft < scrollWidth - offsetWidth - 5);
    }
  }, []);

  useLayoutEffect(() => {
    checkScroll();
    const timer = setTimeout(checkScroll, 100);
    return () => clearTimeout(timer);
  }, [tabs, activeTabId, checkScroll]);

  useEffect(() => {
    window.addEventListener("resize", checkScroll);
    return () => window.removeEventListener("resize", checkScroll);
  }, [checkScroll]);

  const scrollTabs = (direction) => {
    if (tabTrayRef.current) {
      const scrollAmount = 300;
      tabTrayRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  const handleWheel = (e) => {
    if (tabTrayRef.current) {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        tabTrayRef.current.scrollLeft += e.deltaY;
      }
    }
  };

  useEffect(() => {
    const cleanup = window.orbit.ipcRenderer.on(
      "viewport:scroll",
      (scrollY) => {
        setIsScrolled(scrollY > 20);
      },
    );
    return () => cleanup();
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;
    const applyTheme = (currentTheme) => {
      let activeTheme = currentTheme;
      if (currentTheme === "system") {
        activeTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light";
      }
      root.classList.remove("light", "dark");
      root.classList.add(activeTheme);
      window.orbit?.ipcRenderer?.send("theme:update", currentTheme);
      localStorage.setItem("orbit-theme", currentTheme);
    };
    applyTheme(theme);
    if (theme === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const handleChange = () => applyTheme("system");
      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }
  }, [theme]);

  const [passwordPrompt, setPasswordPrompt] = useState(null);


  const [bookmarks, setBookmarks] = useState(() => {
    const saved = localStorage.getItem("orbit-bookmarks");
    return saved
      ? JSON.parse(saved)
      : [
          { id: "1", title: "Google", url: "https://google.com" },
          { id: "2", title: "YouTube", url: "https://youtube.com" },
          { id: "3", title: "GitHub", url: "https://github.com" },
        ];
  });

  useEffect(() => {
    localStorage.setItem("orbit-bookmarks", JSON.stringify(bookmarks));
  }, [bookmarks]);

  const activeTab = useMemo(
    () => tabs.find((t) => t.id === activeTabId),
    [tabs, activeTabId],
  );
  const isHome = activeTab?.url === "about:blank";

  // ── Critical Electron Fix: Mouse Click-Through ──────────────────────────
  // The React uiView is resized to 92px (header only) when browsing, so the
  // page WebContentsView at y:92 is directly reachable by mouse clicks.
  // When the sidekick is open, uiView expands to full height so the browser
  // header remains visible. The page becomes view-only while sidekick is open
  // (same behaviour as Arc, Edge Copilot, and other browser sidekicks).
  useEffect(() => {
    const isShowingOrbitUI =
      isHome ||
      isOverview ||
      isExtensionsOpen ||
      isSettingsOpen ||
      isAISidekickOpen ||
      isDownloadsOpen ||
      isHubFocused ||
      isHeaderHovered ||
      isFindOpen ||
      !!hoveredTabId ||
      !!tabContextMenu;
    window.orbit?.ipcRenderer?.send("ui:set-ignore-mouse", !isShowingOrbitUI);
  }, [isHome, isOverview, isExtensionsOpen, isSettingsOpen, isAISidekickOpen, isDownloadsOpen, isHubFocused, isHeaderHovered, isFindOpen, hoveredTabId, tabContextMenu]);




  useEffect(() => {
    window.orbit.tabs.create({ id: "default", url: "about:blank" });
    window.orbit.tabs.select({ id: "default" });
    const unsubscribe = window.orbit.tabs.onUpdate((data) => {
      setTabs((prev) =>
        prev.map((t) => (t.id === data.id ? { ...t, ...data } : t)),
      );
    });
    return () => {
      if (typeof unsubscribe === "function") unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (tabTrayRef.current) {
      const activeTabElement =
        tabTrayRef.current.querySelector(".nexus-tab.active");
      if (activeTabElement) {
        activeTabElement.scrollIntoView({
          behavior: "smooth",
          inline: "nearest",
          block: "nearest",
        });
      }
    }
    checkScroll();
  }, [activeTabId, checkScroll]);

  const handleSelectTab = useCallback((id) => {
    setActiveTabId(id);
    setIsOverview(false);
    setIsExtensionsOpen(false);
    setIsSettingsOpen(false);
    openDownloads(false);
    window.orbit.tabs.select({ id });
    window.orbit.ipcRenderer.send("ui:toggle-overview", false);
  }, []);

  const handleAddTab = useCallback(
    (url = "about:blank") => {
      const id = Date.now().toString();
      const newTab = {
        id,
        title: "New Tab",
        url,
        isLoading: false,
        canGoBack: false,
        canGoForward: false,
      };
      setTabs((prev) => [...prev, newTab]);
      window.orbit.tabs.create({ id, url });
      handleSelectTab(id);
    },
    [handleSelectTab],
  );

  const handleCloseTab = useCallback(
    (id) => {
      if (hoveredTabId === id) setHoveredTabId(null);
      setTabs((prev) => {
        const newTabs = prev.filter((t) => t.id !== id);
        if (newTabs.length === 0) {
          window.orbit.ipcRenderer.send("window-close");
          return prev;
        }
        if (activeTabId === id) {
          const nextId = newTabs[newTabs.length - 1].id;
          setActiveTabId(nextId);
          window.orbit.tabs.select({ id: nextId });
        }
        return newTabs;
      });
      window.orbit.tabs.close({ id });
    },
    [activeTabId, hoveredTabId],
  );

  const handleNavigate = useCallback(
    (url) => {
      openDownloads(false);
      window.orbit.tabs.navigate({ id: activeTabId, url });
    },
    [activeTabId],
  );


  // Track navigation history
  useEffect(() => {
    const tab = tabs.find(t => t.id === activeTabId);
    if (!tab?.url || tab.url === 'about:blank') return;
    setHistoryItems(prev => {
      const entry = { url: tab.url, title: tab.title || tab.url };
      const filtered = prev.filter(h => h.url !== tab.url);
      return [...filtered, entry].slice(-50);
    });
  }, [activeTab?.url, activeTab?.title]);

  // ── Keyboard Shortcuts & Global Events ─────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e) => {
      const isCmd = e.metaKey || e.ctrlKey;
      if (isCmd && e.key === 'f') {
        e.preventDefault();
        if (isFindOpen) {
          window.dispatchEvent(new CustomEvent('orbit:focus-find'));
        } else {
          setIsFindOpen(true);
        }
      } else if (isCmd && e.key === 't') {
        e.preventDefault();
        handleAddTab();
      } else if (isCmd && e.key === 'l') {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent('orbit:focus-url'));
      }
    };
    const handlePasswordPrompt = (data) => {
      setPasswordPrompt(data);
      setTimeout(() => setPasswordPrompt(null), 10000);
    };
    window.orbit.ipcRenderer.on("password-prompt", handlePasswordPrompt);

    const handleGlobalClick = () => {
      if (tabContextMenu) setTabContextMenu(null);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('mousedown', handleGlobalClick);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('mousedown', handleGlobalClick);
    };
  }, [isFindOpen, tabContextMenu]);

  // ── Menu Action IPC Listeners ──────────────────────────────────────────────
  // ── Download Animation & Progress Tracking ────────────────────────────────
  const [activeDownloads, setActiveDownloads] = useState(new Map());
  const [justStartedDownload, setJustStartedDownload] = useState(false);
  const [justFinishedDownload, setJustFinishedDownload] = useState(false);
  
  const totalDownloadProgress = useMemo(() => {
    const progressing = Array.from(activeDownloads.values()).filter(d => d.state === 'progressing');
    if (progressing.length === 0) return 0;
    
    // Check if we have any with real progress
    const withProgress = progressing.filter(d => d.totalBytes > 0);
    if (withProgress.length === 0) return -1; // -1 indicates Indeterminate

    const total = withProgress.reduce((acc, d) => acc + (d.percentage || 0), 0);
    return Math.round(total / withProgress.length);
  }, [activeDownloads]);

  const isDownloading = useMemo(() => {
    return Array.from(activeDownloads.values()).some(d => d.state === 'progressing');
  }, [activeDownloads]);

  useEffect(() => {
    const u1 = window.orbit.ipcRenderer.on('menu:open-downloads', () => {
      openDownloads(true);
    });
    const u2 = window.orbit.ipcRenderer.on('menu:open-settings', () => setIsSettingsOpen(true));
    const u3 = window.orbit.ipcRenderer.on('menu:new-tab', (url) => {
      const targetUrl = typeof url === 'string' ? url : "about:blank";
      handleAddTab(targetUrl);
    });
    const u4 = window.orbit.ipcRenderer.on('menu:open-find', () => setIsFindOpen(true));
    
    const u5 = window.orbit.ipcRenderer.on('menu:close-tab', () => {
      setActiveTabId(currentId => {
        handleCloseTab(currentId);
        return currentId;
      });
    });

    const u6 = window.orbit.ipcRenderer.on('menu:next-tab', () => {
      setTabs(currentTabs => {
        setActiveTabId(currentId => {
          const idx = currentTabs.findIndex(t => t.id === currentId);
          const nextId = currentTabs[(idx + 1) % currentTabs.length].id;
          window.orbit.tabs.select({ id: nextId });
          return nextId;
        });
        return currentTabs;
      });
    });

    const u7 = window.orbit.ipcRenderer.on('menu:prev-tab', () => {
      setTabs(currentTabs => {
        setActiveTabId(currentId => {
          const idx = currentTabs.findIndex(t => t.id === currentId);
          const prevId = currentTabs[(idx - 1 + currentTabs.length) % currentTabs.length].id;
          window.orbit.tabs.select({ id: prevId });
          return prevId;
        });
        return currentTabs;
      });
    });

    const u8 = window.orbit.ipcRenderer.on('menu:select-tab', (idx) => {
      setTabs(currentTabs => {
        const targetIdx = idx === -1 ? currentTabs.length - 1 : idx;
        if (currentTabs[targetIdx]) {
          const targetId = currentTabs[targetIdx].id;
          setActiveTabId(targetId);
          window.orbit.tabs.select({ id: targetId });
        }
        return currentTabs;
      });
    });

    const u9 = window.orbit.ipcRenderer.on('menu:bookmark-tab', () => {
      setTabs(currentTabs => {
        setActiveTabId(currentId => {
          const tab = currentTabs.find(t => t.id === currentId);
          if (tab && tab.url !== 'about:blank') {
            setBookmarks(prev => {
              const exists = prev.some(b => b.url === tab.url);
              if (exists) return prev.filter(b => b.url !== tab.url);
              return [...prev, { id: Date.now().toString(), title: tab.title || 'New Bookmark', url: tab.url }];
            });
          }
          return currentId;
        });
        return currentTabs;
      });
    });

    const unsubStarted = window.orbit.downloads.onStarted((item) => {
      setActiveDownloads(prev => new Map(prev).set(item.id, item));
      setJustStartedDownload(true);
      setTimeout(() => setJustStartedDownload(false), 3000);
    });

    const unsubUpdated = window.orbit.downloads.onUpdated((item) => {
      setActiveDownloads(prev => {
        const next = new Map(prev);
        if (item.state === 'completed' || item.state === 'failed') {
          if (item.state === 'completed') {
            setJustFinishedDownload(true);
            setTimeout(() => setJustFinishedDownload(false), 4000);
          }
          next.delete(item.id);
        } else {
          next.set(item.id, item);
        }
        return next;
      });
    });

    const u10 = window.orbit.ipcRenderer.on('tab:toggle-pin', (id) => {
      setHoveredTabId(null);
      setTabs(currentTabs => {
        const newTabs = currentTabs.map(t => t.id === id ? { ...t, isPinned: !t.isPinned } : t);
        return [...newTabs].sort((a, b) => {
          if (a.isPinned && !b.isPinned) return -1;
          if (!a.isPinned && b.isPinned) return 1;
          return 0;
        });
      });
    });

    const u11 = window.orbit.ipcRenderer.on('tab:new-right', (targetId) => {
      setTabs(currentTabs => {
        const idx = currentTabs.findIndex(t => t.id === targetId);
        if (idx !== -1) {
          const id = Date.now().toString();
          const newTab = { id, title: "New Tab", url: "about:blank", isLoading: false, canGoBack: false, canGoForward: false };
          window.orbit.tabs.create({ id, url: "about:blank" });
          setTimeout(() => handleSelectTab(id), 0);
          const newTabs = [...currentTabs];
          newTabs.splice(idx + 1, 0, newTab);
          return newTabs;
        }
        return currentTabs;
      });
    });

    const u12 = window.orbit.ipcRenderer.on('tab:duplicate', (targetId) => {
      setTabs(currentTabs => {
        const targetTab = currentTabs.find(t => t.id === targetId);
        if (targetTab) {
          const id = Date.now().toString();
          const newTab = { ...targetTab, id, isLoading: false };
          window.orbit.tabs.create({ id, url: targetTab.url });
          setTimeout(() => handleSelectTab(id), 0);
          const idx = currentTabs.findIndex(t => t.id === targetId);
          const newTabs = [...currentTabs];
          newTabs.splice(idx + 1, 0, newTab);
          return newTabs;
        }
        return currentTabs;
      });
    });

    const u13 = window.orbit.ipcRenderer.on('tab:close-specific', (targetId) => {
      setActiveTabId(currentId => {
        handleCloseTab(targetId);
        return currentId;
      });
    });

    const u14 = window.orbit.ipcRenderer.on('tab:close-other', (targetId) => {
      setTabs(currentTabs => {
        const tabsToClose = currentTabs.filter(t => t.id !== targetId && !t.isPinned);
        if (tabsToClose.length === 0) return currentTabs;
        tabsToClose.forEach(t => window.orbit.tabs.close({ id: t.id }));
        setTimeout(() => handleSelectTab(targetId), 0);
        return currentTabs.filter(t => t.id === targetId || t.isPinned);
      });
    });

    const u15 = window.orbit.ipcRenderer.on('tab:close-right', (targetId) => {
      setTabs(currentTabs => {
        const idx = currentTabs.findIndex(t => t.id === targetId);
        if (idx !== -1) {
          const tabsToClose = currentTabs.slice(idx + 1).filter(t => !t.isPinned);
          if (tabsToClose.length === 0) return currentTabs;
          tabsToClose.forEach(t => window.orbit.tabs.close({ id: t.id }));
          
          setActiveTabId(currentId => {
            const activeIsClosing = tabsToClose.some(t => t.id === currentId);
            if (activeIsClosing) {
              setTimeout(() => handleSelectTab(targetId), 0);
            }
            return currentId;
          });
          
          return currentTabs.filter(t => !tabsToClose.some(closing => closing.id === t.id));
        }
        return currentTabs;
      });
    });

    return () => {
      u1?.(); u2?.(); u3?.(); u4?.(); u5?.(); u6?.(); u7?.(); u8?.(); u9?.(); u10?.(); u11?.(); u12?.(); u13?.(); u14?.(); u15?.();
      unsubStarted?.();
      unsubUpdated?.();
    };
  }, [handleAddTab, handleCloseTab, activeTabId]);

  useEffect(() => {
    const unsubUpdate = window.orbit.ipcRenderer.on('update-ready', () => {
      console.log('[Orbit UI] Update ready for installation');
      setIsUpdateReady(true);
    });
    return () => unsubUpdate?.();
  }, []);

  return (
    <div
      className={`w-full h-screen overflow-hidden relative transition-colors duration-200`}
    >
      <div className="absolute top-0 left-0 right-0 h-24 drag-area z-0 pointer-events-none" />
      <header className="nexus-chassis drag-area no-drag">
        <div className="nexus-chassis-bg" />
        <div className="nexus-row nexus-top-row pointer-events-auto px-4">
          <div className="flex-1 flex items-center no-drag min-w-0">
            <div className="flex items-center gap-2 shrink-0">
              <OrbitLogo size={20} />
              <span className="text-[11px] font-black tracking-[0.2em] text-black">
                Orbit
              </span>
            </div>
          </div>
          <div className="flex-4 flex justify-center no-drag min-w-0">
            <div className="w-full max-w-225">
              <SegmentedHub
                activeTab={activeTab}
                onNavigate={handleNavigate}
                onAddTab={handleAddTab}
                tabCount={tabs.length}
                isVisible={true}
                bookmarks={bookmarks}
                onUpdateBookmarks={setBookmarks}
                onFocusChange={setIsHubFocused}
                historyItems={historyItems}
              />
            </div>
          </div>
          <div className="flex-1 flex justify-end h-full no-drag min-w-0">
            <div className="flex items-center h-full"></div>
          </div>
        </div>
        <div className="nexus-row nexus-bottom-row pointer-events-auto px-4">
          <div className="flex-1 flex items-center gap-1 no-drag min-w-0">
            <TooltipWrapper text="Show Tab Overview">
              <button
                onClick={() => {
                  const newState = !isOverview;
                  setIsOverview(newState);
                  window.orbit.ipcRenderer.send("ui:toggle-overview", newState);
                }}
                className={`tip-left w-8 h-8 flex items-center justify-center rounded-lg transition-all duration-300 ${isOverview ? "bg-orbit-accent text-white shadow-lg" : "hover:bg-gray-200/60 dark:hover:bg-white/10 text-nexus-text opacity-70 hover:opacity-100"}`}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="3" y="3" width="7" height="7" rx="1.5" />
                  <rect x="14" y="3" width="7" height="7" rx="1.5" />
                  <rect x="14" y="14" width="7" height="7" rx="1.5" />
                  <rect x="3" y="14" width="7" height="7" rx="1.5" />
                </svg>
              </button>
            </TooltipWrapper>
            <div className="w-px h-4 bg-nexus-border/20 mx-0.5 shrink-0" />
            <div className="flex-1 flex items-center min-w-0 z-10 px-1 overflow-hidden">
              <div className="nexus-tabs-container">
                <button
                  className={`nexus-tab-nav-btn left no-drag ${showScrollLeft ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
                  onClick={() => scrollTabs("left")}
                >
                  <ChevronLeft size={14} />
                </button>
                <div
                  ref={tabTrayRef}
                  onScroll={checkScroll}
                  onWheel={handleWheel}
                  onMouseMove={checkScroll}
                  className="nexus-tabs-tray"
                >
                  {tabs.map((tab) => (
                    <div
                      key={tab.id}
                      onClick={() => handleSelectTab(tab.id)}
                      onMouseEnter={(e) => {
                        if (activeTabId !== tab.id) {
                          const rect = e.currentTarget.getBoundingClientRect();
                          setHoveredTabId(tab.id);
                          setPreviewPos({ x: rect.left, y: rect.bottom });
                        }
                      }}
                      onMouseLeave={() => setHoveredTabId(null)}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        setHoveredTabId(null);
                        setTabContextMenu({ id: tab.id, isPinned: !!tab.isPinned, x: e.clientX, y: e.clientY });
                      }}
                      className={`nexus-tab ${activeTabId === tab.id ? "active" : ""} ${tab.isPinned ? "pinned" : ""} no-drag group/tab relative`}
                    >
                      {tab.url === "about:blank" ? (
                        <OrbitLogo size={14} variant="icon" />
                      ) : tab.favicon ? (
                        <img
                          src={tab.favicon}
                          className="w-3.5 h-3.5 object-contain rounded-sm"
                          alt=""
                        />
                      ) : (
                        <div className="w-3.5 h-3.5 rounded-full bg-nexus-text/10" />
                      )}
                      {!tab.isPinned && (
                        <span className="flex-1 truncate text-[11px] font-bold tracking-tight">
                          {tab.title || "New Tab"}
                        </span>
                      )}
                      {!tab.isPinned && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCloseTab(tab.id);
                          }}
                          className="nexus-tab-close"
                        >
                          <X size={10} strokeWidth={3} />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    onClick={() => handleAddTab()}
                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-transparent hover:bg-gray-200/60 dark:hover:bg-white/10 text-nexus-text-dim hover:text-nexus-text transition-all duration-200 no-drag shrink-0 ml-1"
                    data-orbit-tooltip="New Tab"
                  >
                    <Plus size={16} strokeWidth={2.5} />
                  </button>
                </div>
                <button
                  className={`nexus-tab-nav-btn right no-drag ${showScrollRight ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
                  onClick={() => scrollTabs("right")}
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </div>
          <div
            className="flex items-center gap-1 no-drag pl-6"
            onMouseEnter={() => setIsHeaderHovered(true)}
            onMouseLeave={() => setIsHeaderHovered(false)}
          >
            <TooltipWrapper text="Extensions">
              <button
                onClick={() => setIsExtensionsOpen(true)}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-nexus-text opacity-50 hover:opacity-100 transition-all duration-300 cursor-pointer"
              >
                <Puzzle size={16} strokeWidth={1.8} />
              </button>
            </TooltipWrapper>
            <TooltipWrapper text={isDownloading ? `Downloading (${totalDownloadProgress === -1 ? '...' : totalDownloadProgress + '%'})` : "Downloads"}>
              <button
                ref={downloadBtnRef}
                onClick={() => openDownloads(!isDownloadsOpen)}
                className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all duration-500 cursor-pointer relative ${isDownloadsOpen ? "bg-orbit-accent text-white shadow-xl opacity-100" : "hover:bg-black/5 dark:hover:bg-white/5 text-nexus-text opacity-70 hover:opacity-100"}`}
              >
              <AnimatePresence>
                {isDownloading && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.1 }}
                    className="absolute inset-0 flex items-center justify-center"
                  >
                    <svg className={`w-full h-full -rotate-90 p-0.5 ${totalDownloadProgress === -1 ? "animate-spin" : ""}`} style={{ animationDuration: '1.2s' }}>
                      <defs>
                        <filter id="progress-glow" x="-20%" y="-20%" width="140%" height="140%">
                          <feGaussianBlur stdDeviation="1" result="blur" />
                          <feComposite in="SourceGraphic" in2="blur" operator="over" />
                        </filter>
                      </defs>
                      <circle
                        cx="50%"
                        cy="50%"
                        r="38%"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        className="opacity-10 dark:opacity-20"
                      />
                      <motion.circle
                        cx="50%"
                        cy="50%"
                        r="38%"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        filter={isDownloadsOpen ? "" : "url(#progress-glow)"}
                        style={{
                          pathLength: totalDownloadProgress === -1 ? 0.35 : Math.max(0.05, totalDownloadProgress / 100),
                          stroke: isDownloadsOpen ? '#ffffff' : 'var(--orbit-accent)',
                          filter: isDownloadsOpen ? 'none' : 'drop-shadow(0 0 3px color-mix(in srgb, var(--orbit-accent) 40%, transparent))'
                        }}
                        transition={{ 
                          pathLength: { type: "spring", stiffness: 60, damping: 15 },
                          stroke: { duration: 0.3 }
                        }}
                        strokeDasharray="1 0"
                      />
                    </svg>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Success Checkmark overlay */}
              <AnimatePresence>
                {justFinishedDownload && !isDownloading && (
                  <motion.div
                    initial={{ scale: 0.4, opacity: 0, rotate: -20 }}
                    animate={{ scale: 1, opacity: 1, rotate: 0 }}
                    exit={{ scale: 1.2, opacity: 0 }}
                    className="absolute inset-0 flex items-center justify-center z-20"
                    style={{ color: '#34A853' }} // Using vibrant green for success check specifically
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Animated Download Icon */}
              <motion.div
                animate={{ 
                  y: justStartedDownload ? [0, 2, 0] : 0,
                  opacity: justFinishedDownload ? 0 : 1,
                  scale: isDownloading ? 0.7 : 1,
                  rotate: isDownloading ? [0, 5, -5, 0] : 0
                }}
                transition={{ 
                  rotate: { repeat: isDownloading ? Infinity : 0, duration: 2, ease: "easeInOut" },
                  default: { duration: 0.3 }
                }}
                className="relative z-10"
              >
                <Download 
                  size={18} 
                  strokeWidth={2.2} 
                />
              </motion.div>
              
              {/* Minimalist Start Dot - Pulses */}
              <AnimatePresence>
                {justStartedDownload && !isDownloadsOpen && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 2, opacity: 0 }}
                    className="absolute top-1 right-1 w-2.5 h-2.5 bg-orbit-accent rounded-full border-2 border-orbit-bg z-25 shadow-lg shadow-orbit-accent/40"
                  />
                )}
              </AnimatePresence>
            </button>
          </TooltipWrapper>

          <TooltipWrapper text="Settings">
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-nexus-text opacity-50 hover:opacity-100 transition-all duration-300 cursor-pointer relative"
            >
              <Settings size={16} strokeWidth={1.8} />
              {isUpdateReady && (
                <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-[#635BFF] rounded-full border-2 border-orbit-bg shadow-[0_0_8px_#635BFF] animate-pulse" />
              )}
            </button>
          </TooltipWrapper>

          <button
            onClick={() => {
              const newState = !isAISidekickOpen;
              setIsAISidekickOpen(newState);
              window.orbit.ipcRenderer.send('ui:toggle-sidekick', newState);
            }}
            className={`h-8 flex items-center gap-2 px-3 rounded-full transition-all duration-300 cursor-pointer border ${isAISidekickOpen ? 'bg-orbit-accent/10 border-orbit-accent/20 text-orbit-accent shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)]' : 'bg-white dark:bg-[#1c1c1e] border-black/10 dark:border-white/10 text-nexus-text shadow-sm hover:shadow hover:border-black/20 dark:hover:border-white/20'}`}
          >
            <img src="/assets/orbit.png" className="w-4 h-4 object-contain brightness-110" alt="Orbit Logo" />
            <span className="text-[12.5px] font-bold tracking-tight">Ask Orbit</span>
          </button>
        </div>
      </div>
          {isFindOpen && (
            <FindBar 
              activeTabId={activeTabId} 
              onClose={() => setIsFindOpen(false)} 
            />
          )}
      </header>

      <main className="w-full h-[calc(100vh-92px)] mt-23 relative z-0 pointer-events-none">
        {/* Only render UI panels when active — keeps the layer transparent for web content clicks */}
        <div
          className={`flex-1 h-full relative z-0 ${
            isHome || isOverview || isExtensionsOpen || isSettingsOpen || isDownloadsPageOpen
              ? "pointer-events-auto"
              : "pointer-events-none"
          }`}
        >
          {isSettingsOpen && (
                <div className="w-full h-full">
                  <SettingsManager
                    onNavigate={handleNavigate}
                    theme={theme}
                    setTheme={setTheme}
                    onClose={() => setIsSettingsOpen(false)}
                  />
                </div>
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
              {isDownloadsPageOpen && (
                <div className="w-full h-full">
                  <DownloadsPage onClose={() => setIsDownloadsPageOpen(false)} />
                </div>
              )}
              {isHome && !isOverview && !isExtensionsOpen && !isSettingsOpen && !isDownloadsPageOpen && (
                <div className="w-full h-full flex flex-col items-center justify-center bg-orbit-bg">
                  <NewTab
                    onNavigate={handleNavigate}
                    bookmarks={bookmarks}
                    onUpdateBookmarks={setBookmarks}
                  />
                </div>
              )}
        </div>




        <AISidekick
          isOpen={isAISidekickOpen}
          onClose={() => {
            setIsAISidekickOpen(false);
            window.orbit.ipcRenderer.send('ui:toggle-sidekick', false);
          }}
          activeTab={activeTab}
        />
      </main>

      {/* Page-click forwarding overlay — rendered at ROOT level (outside pointer-events-none main).
          Intercepts mouse events in the page area and forwards them via IPC to the
          page WebContentsView using sendInputEvent(). This is the only way to keep
          the page interactive while the full-height uiView is covering the window. */}
      {isAISidekickOpen && !isHome && !isOverview && (
        <div
          style={{
            position: 'fixed',
            top: 92,
            left: 0,
            right: 384,
            bottom: 0,
            zIndex: 5000,
            cursor: 'auto',
            background: 'transparent',
            pointerEvents: 'auto',
          }}
          onMouseDown={(e) => {
            e.stopPropagation();
            window.orbit.ipcRenderer.send('input:forward-to-page', {
              type: 'mouseDown', x: e.clientX, y: e.clientY,
              button: e.button === 2 ? 'right' : 'left', clickCount: 1,
            });
          }}
          onMouseUp={(e) => {
            e.stopPropagation();
            window.orbit.ipcRenderer.send('input:forward-to-page', {
              type: 'mouseUp', x: e.clientX, y: e.clientY,
              button: e.button === 2 ? 'right' : 'left', clickCount: 1,
            });
          }}
          onMouseMove={(e) => {
            const now = Date.now();
            if (!window._lastMoveTime || now - window._lastMoveTime > 16) {
              window._lastMoveTime = now;
              window.orbit.ipcRenderer.send('input:forward-to-page', {
                type: 'mouseMoved', x: e.clientX, y: e.clientY,
              });
            }
          }}
          onWheel={(e) => {
            window.orbit.ipcRenderer.send('input:forward-to-page', {
              type: 'mouseWheel', x: e.clientX, y: e.clientY,
              deltaX: -e.deltaX, deltaY: -e.deltaY,
            });
          }}
          onContextMenu={(e) => e.preventDefault()}
        />
      )}

        {passwordPrompt && (
          <div className="fixed top-24 right-4 w-80 bg-white dark:bg-[#1e1e1e] rounded-xl shadow-2xl border border-orbit-border z-3000 p-4 text-orbit-text">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-orbit-accent/10 flex items-center justify-center text-orbit-accent">
                <Key size={20} />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-sm mb-1">Save password?</h3>
                <p className="text-xs text-orbit-text-dim mb-3">
                  Orbit can save your password for this site.
                </p>
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setPasswordPrompt(null)}
                    className="px-3 py-1.5 rounded-lg hover:bg-orbit-card text-xs font-bold"
                  >
                    Never
                  </button>
                  <button
                    onClick={() => setPasswordPrompt(null)}
                    className="px-4 py-1.5 bg-orbit-accent text-white rounded-lg text-xs font-bold"
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {hoveredTabId && tabs.some((t) => t.id === hoveredTabId) && (
          <div
            style={{
              position: "fixed",
              left: previewPos.x,
              top: previewPos.y,
              zIndex: 20000,
              pointerEvents: "none",
            }}
            className="w-56 overflow-visible rounded-xl bg-orbit-bg border border-orbit-accent/30 shadow-[0_20px_50px_rgba(0,0,0,0.3)] backdrop-blur-3xl"
          >
            <div className="absolute -top-1.5 left-6 w-3 h-3 bg-orbit-bg border-t border-l border-orbit-accent/30 rotate-45 z-10" />
            <div className="h-32 w-full bg-orbit-card relative overflow-hidden rounded-t-xl">
              {tabs.find((t) => t.id === hoveredTabId)?.preview ? (
                <img
                  src={tabs.find((t) => t.id === hoveredTabId).preview}
                  className="w-full h-full object-cover"
                  alt="Preview"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-2 opacity-20">
                  <div className="w-12 h-12 rounded-full border-2 border-dashed border-orbit-text" />
                  <span className="text-[10px] uppercase tracking-widest font-bold">
                    Capturing...
                  </span>
                </div>
              )}
              <div className="absolute inset-0 bg-linear-to-b from-transparent to-orbit-surface/50" />
            </div>
            <div className="p-3 bg-orbit-surface/90 rounded-b-xl">
              <div className="flex items-center gap-2 truncate">
                {tabs.find((t) => t.id === hoveredTabId)?.url ===
                "about:blank" ? (
                  <OrbitLogo size={12} variant="icon" />
                ) : (
                  tabs.find((t) => t.id === hoveredTabId)?.favicon && (
                    <img
                      src={tabs.find((t) => t.id === hoveredTabId).favicon}
                      className="w-3 h-3 object-contain"
                      alt=""
                    />
                  )
                )}
                <span className="text-[11px] font-bold truncate text-orbit-text">
                  {tabs.find((t) => t.id === hoveredTabId)?.title || "New Tab"}
                </span>
              </div>
            </div>
          </div>
        )}

        <TabContextMenu 
          menu={tabContextMenu} 
          onClose={() => setTabContextMenu(null)} 
        />

        {isDownloadsOpen && (
           <DownloadsManager
            onClose={() => openDownloads(false)}
            anchorRef={downloadBtnRef}
            onOpenFullHistory={() => {
              setIsDownloadsPageOpen(true);
              setIsDownloadsOpen(false);
            }}
          />
        )}

        {isUpdateReady && (
          <div className="fixed top-24 left-1/2 -translate-x-1/2 z-10000 w-100">
            <div className="bg-white/40 dark:bg-black/40 backdrop-blur-2xl border border-white/20 dark:border-white/10 rounded-4xl p-6 shadow-[0_30px_100px_rgba(0,0,0,0.3)] relative overflow-hidden group">
              {/* Liquid Highlight Effect */}
              <div className="absolute -top-24 -left-24 w-48 h-48 bg-[#635BFF]/10 blur-[60px] rounded-full group-hover:translate-x-10 group-hover:translate-y-10 transition-transform duration-1000" />
              
              <div className="relative z-10 flex flex-col items-center text-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-[#635BFF] flex items-center justify-center text-white shadow-[0_10px_30px_rgba(99,91,255,0.4)]">
                  <RefreshCw size={24} className="animate-[spin_3s_linear_infinite]" />
                </div>
                
                <div className="space-y-1">
                  <h3 className="text-xl font-black text-orbit-text">New Version Ready</h3>
                  <p className="text-[13px] text-orbit-text-dim font-bold">Experience the next level of Orbit.</p>
                </div>

                <div className="flex gap-3 w-full mt-2">
                  <button 
                    onClick={() => setIsUpdateReady(false)}
                    className="flex-1 py-3.5 rounded-2xl bg-orbit-card border border-orbit-border text-[12px] font-black uppercase tracking-widest text-orbit-text-dim hover:text-orbit-text transition-all"
                  >
                    Later
                  </button>
                  <button 
                    onClick={() => window.orbit.ipcRenderer.send('update:restart-and-apply')}
                    className="flex-[1.5] py-3.5 rounded-2xl bg-[#635BFF] text-white text-[12px] font-black uppercase tracking-widest shadow-[0_0_0_0_rgba(99,91,255,0.4)] hover:shadow-[0_15px_40px_rgba(99,91,255,0.5)] transition-all relative overflow-hidden animate-[pulse-shadow_3s_infinite]"
                  >
                    Restart & Update
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
    </div>
  );
};

export default memo(App);
