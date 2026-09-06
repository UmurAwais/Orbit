import React, {
  useState,
  useEffect,
  useCallback,
  memo,
  useMemo,
  useRef,
  useLayoutEffect,
} from "react";
import { AnimatePresence, motion, Reorder } from "framer-motion";
import SegmentedHub from "./components/SegmentedHub";
import NewTab from "./components/NewTab";
import FindBar from "./components/FindBar";
import OrbitLogo from "./components/OrbitLogo";
import orbitLogo from "./assets/orbit.png";
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
  Globe,
  Lock,
} from "lucide-react";
import TabSearch from "./components/TabSearch";
import AISidekick from "./components/AISidekick";
import ExtensionsManager from "./components/ExtensionsManager";
import SettingsManager from "./components/SettingsManager";
import TabOverview from "./components/TabOverview";
import DownloadsManager from "./components/DownloadsManager";
import DownloadsPage from "./components/DownloadsPage";
import TabContextMenu from "./components/TabContextMenu";
import AppMenu from "./components/AppMenu";

const getDomain = (url) => {
  if (!url || url === "about:blank") return "New Tab";
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
};

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
  const [draggedTabId, setDraggedTabId] = useState(null);
  const [dragOverTabId, setDragOverTabId] = useState(null);
  const [tabContextMenu, setTabContextMenu] = useState(null);
  const [previewPos, setPreviewPos] = useState({ x: 0, y: 0, caretX: 20 });
  const [isOverview, setIsOverview] = useState(false);
  const [isAISidekickOpen, setIsAISidekickOpen] = useState(false);
  const [isExtensionsOpen, setIsExtensionsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isDownloadsOpen, setIsDownloadsOpen] = useState(false);
  const [isDownloadsPageOpen, setIsDownloadsPageOpen] = useState(false);
  const [isHubFocused, setIsHubFocused] = useState(false);
  const [isFindOpen, setIsFindOpen] = useState(false);
  const [isAppMenuOpen, setIsAppMenuOpen] = useState(false);
  const [isHeaderHovered, setIsHeaderHovered] = useState(false);
  const headerLeaveTimerRef = useRef(null);

  const handleHeaderEnter = useCallback(() => {
    if (headerLeaveTimerRef.current) {
      clearTimeout(headerLeaveTimerRef.current);
      headerLeaveTimerRef.current = null;
    }
    setIsHeaderHovered(true);
  }, []);

  const handleHeaderLeave = useCallback(() => {
    if (headerLeaveTimerRef.current) clearTimeout(headerLeaveTimerRef.current);
    headerLeaveTimerRef.current = setTimeout(() => {
      setIsHeaderHovered(false);
    }, 100);
  }, []);

  const [isUpdateReady, setIsUpdateReady] = useState(false);
  const [historyItems, setHistoryItems] = useState([]); // { url, title }
  const openDownloads = (val) => setIsDownloadsOpen(val);

  const [omniboxSearch, setOmniboxSearch] = useState({ isSearching: false, query: '' });
  const [newTabSearch, setNewTabSearch] = useState({ isSearching: false, query: '' });

  const isSearchUrl = useCallback((url) => {
    if (!url || url === 'about:blank') return false;
    try {
      const parsed = new URL(url);
      const host = parsed.hostname.toLowerCase();
      const path = parsed.pathname.toLowerCase();
      const search = parsed.search.toLowerCase();

      if (host.includes('google.') && (path === '/search' || search.includes('q='))) return true;
      if (host.includes('bing.com') && (path === '/search' || search.includes('q='))) return true;
      if (host.includes('duckduckgo.com') && search.includes('q=')) return true;
      if (host.includes('yahoo.com') && (host.includes('search.') || search.includes('p='))) return true;
      if (host.includes('search.brave.com')) return true;
      if (host.includes('ecosia.org') && search.includes('q=')) return true;
      if (host.includes('baidu.com') && (search.includes('wd=') || search.includes('word='))) return true;
      if (host.includes('yandex.') && (path.includes('/search') || search.includes('text='))) return true;
      if (host.includes('kagi.com/search') || host.includes('perplexity.ai/search')) return true;
      if ((path.includes('/search') || path.includes('/results')) && (search.includes('q=') || search.includes('query=') || search.includes('search_query='))) return true;

      return false;
    } catch {
      return false;
    }
  }, []);

  const extractSearchQuery = useCallback((url) => {
    if (!url || url === 'about:blank') return '';
    try {
      const parsed = new URL(url);
      return (
        parsed.searchParams.get('q') ||
        parsed.searchParams.get('query') ||
        parsed.searchParams.get('search_query') ||
        parsed.searchParams.get('p') ||
        parsed.searchParams.get('wd') ||
        parsed.searchParams.get('text') ||
        ''
      );
    } catch {
      return '';
    }
  }, []);

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
      const { scrollLeft, scrollWidth, offsetWidth, clientWidth } = tabTrayRef.current;
      const totalTabsWidth = tabs.reduce(
        (acc, t) => acc + (t.isPinned ? 36 : 150) + 5,
        0
      );
      const isOverflowing = totalTabsWidth > offsetWidth + 20 && scrollWidth > offsetWidth + 20;
      setShowScrollLeft(isOverflowing && scrollLeft > 10);
      setShowScrollRight(isOverflowing && scrollLeft < scrollWidth - clientWidth - 20);
    }
  }, [tabs]);

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
    const defaultList = [
      { id: "1", title: "Worcco", url: "https://worcco.com" },
      { id: "2", title: "Google", url: "https://google.com" },
      { id: "3", title: "YouTube", url: "https://youtube.com" },
      { id: "4", title: "GitHub", url: "https://github.com" },
    ];
    if (!saved) return defaultList;
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        const hasWorcco = parsed.some((b) => b.url?.includes("worcco.com"));
        if (!hasWorcco) {
          return [{ id: "worcco-default", title: "Worcco", url: "https://worcco.com" }, ...parsed];
        }
        return parsed;
      }
      return defaultList;
    } catch {
      return defaultList;
    }
  });

  useEffect(() => {
    localStorage.setItem("orbit-bookmarks", JSON.stringify(bookmarks));
  }, [bookmarks]);

  const activeTab = useMemo(
    () => tabs.find((t) => t.id === activeTabId),
    [tabs, activeTabId],
  );
  const isHome = activeTab?.url === "about:blank";

  const isCurrentPageSearch = useMemo(() => {
    return isSearchUrl(activeTab?.url);
  }, [activeTab?.url, isSearchUrl]);

  const shouldShowAskOrbit = useMemo(() => {
    return (
      isAISidekickOpen ||
      omniboxSearch.isSearching ||
      newTabSearch.isSearching ||
      isCurrentPageSearch
    );
  }, [isAISidekickOpen, omniboxSearch.isSearching, newTabSearch.isSearching, isCurrentPageSearch]);

  const currentSearchQuery = useMemo(() => {
    if (omniboxSearch.isSearching && omniboxSearch.query) return omniboxSearch.query;
    if (newTabSearch.isSearching && newTabSearch.query) return newTabSearch.query;
    if (isCurrentPageSearch) return extractSearchQuery(activeTab?.url);
    return '';
  }, [omniboxSearch, newTabSearch, isCurrentPageSearch, activeTab?.url, extractSearchQuery]);


  // ── Critical Electron Fix: Mouse Click-Through ──────────────────────────
  // The React uiView is resized to 80px (header only) when browsing, so the
  // page WebContentsView at y:80 is directly reachable by mouse clicks.
  // Expand back to full height only when full-screen Orbit panels/overlays are open.
  useEffect(() => {
    const isShowingOrbitUI =
      isHome ||
      isOverview ||
      isExtensionsOpen ||
      isSettingsOpen ||
      isAISidekickOpen ||
      isDownloadsOpen ||
      isHubFocused ||
      isFindOpen ||
      isAppMenuOpen ||
      isHeaderHovered ||
      !!hoveredTabId ||
      !!tabContextMenu;
    window.orbit?.ipcRenderer?.send("ui:set-ignore-mouse", !isShowingOrbitUI);
  }, [isHome, isOverview, isExtensionsOpen, isSettingsOpen, isAISidekickOpen, isDownloadsOpen, isHubFocused, isFindOpen, isAppMenuOpen, isHeaderHovered, hoveredTabId, tabContextMenu]);




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
      setIsHubFocused(false);
      openDownloads(false);
      window.orbit.tabs.navigate({ id: activeTabId, url });
    },
    [activeTabId],
  );

  const showTabPreview = useCallback(
    (tab, targetElement) => {
      if (activeTabId === tab.id || draggedTabId) return;
      const rect = targetElement.getBoundingClientRect();
      const cardWidth = 280;
      const margin = 12;
      const tabCenter = rect.left + rect.width / 2;

      let cardLeft = tabCenter - cardWidth / 2;
      if (cardLeft < margin) cardLeft = margin;
      if (cardLeft + cardWidth > window.innerWidth - margin) {
        cardLeft = window.innerWidth - margin - cardWidth;
      }

      const caretLeft = Math.max(16, Math.min(cardWidth - 16, tabCenter - cardLeft));

      setHoveredTabId(tab.id);
      setPreviewPos({ x: cardLeft, y: rect.bottom + 8, caretX: caretLeft });
    },
    [activeTabId, draggedTabId],
  );

  const handleNewTabRight = useCallback((targetId) => {
    setTabs((currentTabs) => {
      const idx = currentTabs.findIndex((t) => t.id === targetId);
      if (idx !== -1) {
        const id = Date.now().toString();
        const newTab = {
          id,
          title: "New Tab",
          url: "about:blank",
          isLoading: false,
          canGoBack: false,
          canGoForward: false,
        };
        window.orbit.tabs.create({ id, url: "about:blank" });
        setTimeout(() => handleSelectTab(id), 0);
        const newTabs = [...currentTabs];
        newTabs.splice(idx + 1, 0, newTab);
        return newTabs;
      }
      return currentTabs;
    });
  }, [handleSelectTab]);

  const handleReloadTab = useCallback((targetId) => {
    window.orbit.tabs.reload({ id: targetId });
  }, []);

  const handleDuplicateTab = useCallback((targetId) => {
    setTabs((currentTabs) => {
      const targetTab = currentTabs.find((t) => t.id === targetId);
      if (targetTab) {
        const id = Date.now().toString();
        const newTab = { ...targetTab, id, isLoading: false };
        window.orbit.tabs.create({ id, url: targetTab.url });
        setTimeout(() => handleSelectTab(id), 0);
        const idx = currentTabs.findIndex((t) => t.id === targetId);
        const newTabs = [...currentTabs];
        newTabs.splice(idx + 1, 0, newTab);
        return newTabs;
      }
      return currentTabs;
    });
  }, [handleSelectTab]);

  const handleTogglePinTab = useCallback((targetId) => {
    setHoveredTabId(null);
    setTabs((currentTabs) => {
      const newTabs = currentTabs.map((t) =>
        t.id === targetId ? { ...t, isPinned: !t.isPinned } : t
      );
      return [...newTabs].sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return 0;
      });
    });
  }, []);

  const handleToggleMuteTab = useCallback((targetId) => {
    window.orbit.ipcRenderer.send('tab:mute', targetId);
    setTabs((currentTabs) =>
      currentTabs.map((t) =>
        t.id === targetId ? { ...t, isMuted: !t.isMuted } : t
      )
    );
  }, []);

  const handleCloseOtherTabs = useCallback((targetId) => {
    setTabs((currentTabs) => {
      const tabsToClose = currentTabs.filter(
        (t) => t.id !== targetId && !t.isPinned
      );
      if (tabsToClose.length === 0) return currentTabs;
      tabsToClose.forEach((t) => window.orbit.tabs.close({ id: t.id }));
      setTimeout(() => handleSelectTab(targetId), 0);
      return currentTabs.filter((t) => t.id === targetId || t.isPinned);
    });
  }, [handleSelectTab]);

  const handleCloseTabsToRight = useCallback((targetId) => {
    setTabs((currentTabs) => {
      const idx = currentTabs.findIndex((t) => t.id === targetId);
      if (idx !== -1) {
        const tabsToClose = currentTabs.slice(idx + 1).filter((t) => !t.isPinned);
        if (tabsToClose.length === 0) return currentTabs;
        tabsToClose.forEach((t) => window.orbit.tabs.close({ id: t.id }));

        setActiveTabId((currentId) => {
          const activeIsClosing = tabsToClose.some((t) => t.id === currentId);
          if (activeIsClosing) {
            setTimeout(() => handleSelectTab(targetId), 0);
          }
          return currentId;
        });

        return currentTabs.filter(
          (t) => !tabsToClose.some((closing) => closing.id === t.id)
        );
      }
      return currentTabs;
    });
  }, [handleSelectTab]);

  const handleReorderTabs = useCallback((sourceId, targetId) => {
    if (!sourceId || !targetId || sourceId === targetId) return;
    setTabs((prev) => {
      const sourceIdx = prev.findIndex((t) => t.id === sourceId);
      const targetIdx = prev.findIndex((t) => t.id === targetId);
      if (sourceIdx === -1 || targetIdx === -1) return prev;
      const next = [...prev];
      const [removed] = next.splice(sourceIdx, 1);
      next.splice(targetIdx, 0, removed);
      return next;
    });
  }, []);


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
      } else if (isCmd && e.key.toLowerCase() === 'i') {
        e.preventDefault();
        setIsAISidekickOpen(prev => {
          const next = !prev;
          window.orbit?.ipcRenderer?.send('ui:toggle-sidekick', next);
          return next;
        });
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
      handleTogglePinTab(id);
    });

    const u11 = window.orbit.ipcRenderer.on('tab:new-right', (targetId) => {
      handleNewTabRight(targetId);
    });

    const u12 = window.orbit.ipcRenderer.on('tab:duplicate', (targetId) => {
      handleDuplicateTab(targetId);
    });

    const u13 = window.orbit.ipcRenderer.on('tab:close-specific', (targetId) => {
      handleCloseTab(targetId);
    });

    const u14 = window.orbit.ipcRenderer.on('tab:close-other', (targetId) => {
      handleCloseOtherTabs(targetId);
    });

    const u15 = window.orbit.ipcRenderer.on('tab:close-right', (targetId) => {
      handleCloseTabsToRight(targetId);
    });

    return () => {
      u1?.(); u2?.(); u3?.(); u4?.(); u5?.(); u6?.(); u7?.(); u8?.(); u9?.(); u10?.(); u11?.(); u12?.(); u13?.(); u14?.(); u15?.();
      unsubStarted?.();
      unsubUpdated?.();
    };
  }, [handleAddTab, handleCloseTab, handleNewTabRight, handleDuplicateTab, handleTogglePinTab, handleCloseOtherTabs, handleCloseTabsToRight, activeTabId]);

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
      <div className="absolute top-0 left-0 right-0 h-[80px] drag-area z-0 pointer-events-none" />
      <header 
        className="nexus-chassis drag-area no-drag"
        onMouseEnter={handleHeaderEnter}
        onMouseLeave={handleHeaderLeave}
      >
        <div className="nexus-chassis-bg" />

        {/* Row 1: Tab Overview + Horizontal Tabs Strip + Draggable Window Region + 140px Window Controls Spacer */}
        <div className="nexus-row nexus-top-row pointer-events-auto px-2 flex items-center drag-area">
          <div className="flex items-center shrink-0 no-drag mr-1.5">
            <TooltipWrapper text="Show Tab Overview">
              <button
                onClick={() => {
                  const newState = !isOverview;
                  setIsOverview(newState);
                  window.orbit.ipcRenderer.send("ui:toggle-overview", newState);
                }}
                className={`tip-left w-7 h-7 flex items-center justify-center rounded-lg transition-all duration-300 cursor-pointer ${isOverview ? "bg-orbit-accent text-white" : "hover:bg-black/5 dark:hover:bg-white/10 text-nexus-text opacity-70 hover:opacity-100"}`}
              >
                <svg
                  width="15"
                  height="15"
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
          </div>

          {/* Tab Strip Container (fit to open tabs only) */}
          <div className="flex items-center min-w-0 max-w-[calc(100vw-360px)] h-full no-drag">
            <div className="nexus-tabs-container">
              <button
                className={`nexus-tab-nav-btn left no-drag ${showScrollLeft ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
                onClick={() => scrollTabs("left")}
              >
                <ChevronLeft size={14} />
              </button>
              <Reorder.Group
                as="div"
                axis="x"
                values={tabs}
                onReorder={setTabs}
                ref={tabTrayRef}
                onScroll={checkScroll}
                onWheel={handleWheel}
                onMouseMove={checkScroll}
                className="nexus-tabs-tray"
                layoutScroll
              >
                {tabs.map((tab) => (
                  <Reorder.Item
                    as="div"
                    key={tab.id}
                    value={tab}
                    id={tab.id}
                    initial={false}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, transition: { duration: 0 } }}
                    drag="x"
                    dragDirectionLock={true}
                    dragListener={true}
                    dragConstraints={tabTrayRef}
                    dragElastic={0}
                    dragMomentum={false}
                    onDragStart={() => setHoveredTabId(null)}
                    onClick={() => handleSelectTab(tab.id)}
                    onMouseEnter={(e) => showTabPreview(tab, e.currentTarget)}
                    onMouseLeave={() => setHoveredTabId(null)}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      setHoveredTabId(null);
                      setTabContextMenu({ id: tab.id, isPinned: !!tab.isPinned, isMuted: !!tab.isMuted, x: e.clientX, y: e.clientY });
                    }}
                    whileDrag={{
                      zIndex: 100,
                      boxShadow: "0 2px 8px rgba(0,0,0,0.14)",
                      cursor: "default",
                    }}
                    transition={{
                      duration: 0,
                    }}
                    className={`nexus-tab ${activeTabId === tab.id ? "active" : ""} ${tab.isPinned ? "pinned" : ""} no-drag group/tab relative cursor-default select-none`}
                  >
                    {tab.url === "about:blank" ? (
                      <OrbitLogo size={14} variant="icon" />
                    ) : tab.favicon ? (
                      <img
                        src={tab.favicon}
                        className="w-3.5 h-3.5 object-contain rounded-xs shrink-0 pointer-events-none"
                        alt=""
                      />
                    ) : (
                      <div className="w-3.5 h-3.5 rounded-full bg-nexus-text/15 shrink-0 pointer-events-none" />
                    )}
                    {!tab.isPinned && (
                      <span className="flex-1 truncate text-[11px] font-bold tracking-tight pointer-events-none">
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
                  </Reorder.Item>
                ))}
              </Reorder.Group>
              <button
                className={`nexus-tab-nav-btn right no-drag ${showScrollRight ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
                onClick={() => scrollTabs("right")}
              >
                <ChevronRight size={14} />
              </button>
            </div>
            {/* [+] New Tab button positioned directly adjacent to tabs */}
            <button
              onClick={() => handleAddTab()}
              className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-black/8 dark:hover:bg-white/10 active:bg-black/15 dark:active:bg-white/15 text-nexus-text-dim hover:text-nexus-text transition-all duration-150 no-drag shrink-0 ml-0.5 cursor-pointer"
              data-orbit-tooltip="New Tab"
            >
              <Plus size={15} strokeWidth={2.2} />
            </button>
          </div>

          {/* Draggable empty titlebar area */}
          <div className="flex-1 min-w-8 h-full drag-area" />

          {/* Ask Orbit AI - In Row 1 like Google Chrome / Gemini (Positioned before window controls) */}
          <div className="no-drag flex items-center pr-2 shrink-0">
            <button
              onClick={() => {
                const newState = !isAISidekickOpen;
                setIsAISidekickOpen(newState);
                window.orbit.ipcRenderer.send('ui:toggle-sidekick', newState);
              }}
              className={`h-7 flex items-center gap-1.5 px-3 rounded-full transition-all duration-200 cursor-pointer border shrink-0 whitespace-nowrap shadow-[0_1px_3px_rgba(0,0,0,0.08)] ${
                isAISidekickOpen
                  ? 'bg-white dark:bg-[#202124] border-orbit-accent/40 text-orbit-accent ring-2 ring-orbit-accent/20 shadow-sm'
                  : 'bg-white dark:bg-[#202124] hover:bg-white dark:hover:bg-[#28292d] border-black/10 dark:border-white/12 hover:border-black/25 dark:hover:border-white/25 text-nexus-text hover:shadow-[0_2px_8px_rgba(0,0,0,0.1)]'
              }`}
              title="Ask Orbit AI (Ctrl+I)"
            >
              <img src={orbitLogo} className="w-3.5 h-3.5 object-contain brightness-110 shrink-0" alt="Orbit Logo" />
              <span className="text-[11.5px] font-bold tracking-tight whitespace-nowrap text-[#1d1d1f] dark:text-[#f0f0f2]">Ask Orbit</span>
            </button>
          </div>

          {/* 140px spacer to protect Windows native Minimize / Maximize / Close overlay */}
          <div className="w-[140px] h-full shrink-0 drag-area pointer-events-none" />
        </div>

        {/* Row 2: Navigation Pod + Centered Omnibox / Search Hub + Action Pod */}
        <div className="nexus-row nexus-bottom-row pointer-events-auto px-3 flex items-center justify-between">
          {/* Left: Navigation Pod */}
          <div className="flex items-center justify-start gap-1 shrink-0 no-drag">
            <TooltipWrapper text="Click to go back">
              <button
                onClick={() => window.orbit?.tabs?.goBack({ id: activeTab?.id })}
                disabled={!activeTab?.canGoBack}
                className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/5 text-nexus-text opacity-70 hover:opacity-100 disabled:opacity-25 disabled:hover:bg-transparent transition-all duration-200 cursor-pointer disabled:cursor-default"
              >
                <ChevronLeft size={16} strokeWidth={2.2} />
              </button>
            </TooltipWrapper>
            <TooltipWrapper text="Click to go forward">
              <button
                onClick={() => window.orbit?.tabs?.goForward({ id: activeTab?.id })}
                disabled={!activeTab?.canGoForward}
                className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/5 text-nexus-text opacity-70 hover:opacity-100 disabled:opacity-25 disabled:hover:bg-transparent transition-all duration-200 cursor-pointer disabled:cursor-default"
              >
                <ChevronRight size={16} strokeWidth={2.2} />
              </button>
            </TooltipWrapper>
            <TooltipWrapper text={activeTab?.isLoading ? "Stop loading" : "Reload this page"}>
              <button
                onClick={() => {
                  if (activeTab?.isLoading) {
                    window.orbit?.tabs?.stop({ id: activeTab?.id });
                  } else {
                    window.orbit?.tabs?.reload({ id: activeTab?.id });
                  }
                }}
                className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/5 text-nexus-text opacity-70 hover:opacity-100 transition-all duration-200 cursor-pointer"
              >
                {activeTab?.isLoading ? (
                  <X size={14} strokeWidth={2.2} />
                ) : (
                  <RefreshCw size={14} strokeWidth={2.2} />
                )}
              </button>
            </TooltipWrapper>
          </div>

          {/* Center: Search Omnibox (Atlas Style - Spans between Left & Right) */}
          <div className="flex-1 max-w-[860px] mx-2 shrink min-w-0 flex justify-center items-center">
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
              onSearchChange={setOmniboxSearch}
            />
          </div>

          {/* Right: Action Pod */}
          <div className="flex items-center justify-end gap-1.5 shrink-0 no-drag pl-1">
            {/* Downloads */}
            <TooltipWrapper text={isDownloading ? `Downloading (${totalDownloadProgress === -1 ? '...' : totalDownloadProgress + '%'})` : "Downloads"}>
              <button
                ref={downloadBtnRef}
                onClick={() => openDownloads(!isDownloadsOpen)}
                className={`w-7 h-7 flex items-center justify-center rounded-full transition-all duration-500 cursor-pointer relative ${isDownloadsOpen ? "bg-orbit-accent text-white opacity-100" : "hover:bg-black/5 dark:hover:bg-white/5 text-nexus-text opacity-70 hover:opacity-100"}`}
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
                      style={{ color: '#34A853' }}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
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
                    size={16}
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


            {/* Main Menu (3-dots More options) */}
            <AppMenu
              activeTab={activeTab}
              onNavigate={handleNavigate}
              onAddTab={handleAddTab}
              bookmarks={bookmarks}
              historyItems={historyItems}
              onOpenSettings={setIsSettingsOpen}
              onOpenDownloads={openDownloads}
              onOpenExtensions={setIsExtensionsOpen}
              onOpenSidekick={() => {
                const newState = !isAISidekickOpen;
                setIsAISidekickOpen(newState);
                window.orbit.ipcRenderer.send('ui:toggle-sidekick', newState);
              }}
              onMenuOpenChange={setIsAppMenuOpen}
              isUpdateReady={isUpdateReady}
            />
          </div>
        </div>

        {isFindOpen && (
          <FindBar
            activeTabId={activeTabId}
            onClose={() => setIsFindOpen(false)}
          />
        )}
      </header>

      <main className="w-full h-[calc(100vh-80px)] mt-[80px] relative z-0 pointer-events-none">
        {/* Only render UI panels when active — keeps the layer transparent for web content clicks */}
        <div
          className={`flex-1 h-full relative z-0 ${isHome || isOverview || isExtensionsOpen || isSettingsOpen || isDownloadsPageOpen
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
                onSearchChange={setNewTabSearch}
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
          initialQuery={currentSearchQuery}
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
            top: 80,
            left: 0,
            right: 384,
            bottom: 0,
            zIndex: 1000,
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
        <div 
          className="fixed top-24 right-4 w-80 bg-white dark:bg-[#28282b] rounded-xl shadow-2xl border border-orbit-border p-4 text-orbit-text z-[85000]"
          style={{ zIndex: 85000 }}
        >
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

      <AnimatePresence>
        {hoveredTabId && !draggedTabId && tabs.some((t) => t.id === hoveredTabId) && (
          (() => {
            const hTab = tabs.find((t) => t.id === hoveredTabId);
            if (!hTab) return null;
            const isBlank = hTab.url === "about:blank";
            const domainName = isBlank ? "orbit://newtab" : getDomain(hTab.url);

            return (
              <motion.div
                key={`tab-preview-${hTab.id}`}
                initial={{ opacity: 0, y: 6, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 4, scale: 0.96 }}
                transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
                style={{
                  position: "fixed",
                  left: previewPos.x,
                  top: previewPos.y,
                  zIndex: 95000,
                  pointerEvents: "none",
                }}
                className="w-[280px] overflow-hidden rounded-2xl bg-white/95 dark:bg-[#202124]/95 border border-black/10 dark:border-white/12 shadow-[0_24px_50px_-10px_rgba(0,0,0,0.3),0_0_0_1px_rgba(0,0,0,0.06)] dark:shadow-[0_28px_60px_-10px_rgba(0,0,0,0.7),0_0_0_1px_rgba(255,255,255,0.08)] backdrop-blur-2xl flex flex-col p-2.5 gap-2"
              >
                {/* Dynamic Caret Arrow pointing to tab center */}
                <div
                  className="absolute -top-1.5 w-3 h-3 bg-white dark:bg-[#202124] border-t border-l border-black/10 dark:border-white/12 rotate-45 z-20"
                  style={{ left: (previewPos.caretX || 20) - 6 }}
                />

                {/* Top Header Bar: Favicon + Title + SSL/Domain */}
                <div className="flex items-center gap-2.5 px-1 pt-0.5">
                  <div className="w-7 h-7 rounded-lg bg-black/5 dark:bg-white/10 border border-black/5 dark:border-white/10 flex items-center justify-center shrink-0 shadow-xs">
                    {isBlank ? (
                      <OrbitLogo size={14} variant="icon" />
                    ) : hTab.favicon ? (
                      <img
                        src={hTab.favicon}
                        className="w-4 h-4 object-contain rounded-xs"
                        alt=""
                      />
                    ) : (
                      <Globe size={13} className="text-nexus-text opacity-60" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col">
                    <span className="text-[12.5px] font-bold truncate text-nexus-text leading-tight tracking-tight">
                      {hTab.title || "New Tab"}
                    </span>
                    <span className="text-[10.5px] text-nexus-text-dim truncate leading-tight mt-0.5 flex items-center gap-1 font-medium">
                      {!isBlank && <Lock size={9} className="opacity-50 inline shrink-0" />}
                      {domainName}
                    </span>
                  </div>
                  {hTab.isLoading && (
                    <RefreshCw size={13} className="animate-spin text-orbit-accent shrink-0" />
                  )}
                  {hTab.isPinned && !hTab.isLoading && (
                    <span className="text-[10px] font-semibold text-nexus-text-dim px-1.5 py-0.5 rounded-md bg-black/5 dark:bg-white/10 shrink-0">
                      Pinned
                    </span>
                  )}
                </div>

                {/* Framed Page Preview Viewport */}
                <div className="w-full rounded-xl bg-black/[0.03] dark:bg-black/30 border border-black/8 dark:border-white/8 relative overflow-hidden flex items-center justify-center min-h-[120px]">
                  {hTab.preview ? (
                    <>
                      <img
                        src={hTab.preview}
                        className="w-full h-auto max-h-[170px] object-contain rounded-xl"
                        alt="Tab Preview"
                      />
                      <div className="absolute inset-0 bg-linear-to-b from-transparent via-transparent to-black/10 dark:to-black/25 pointer-events-none" />
                    </>
                  ) : (
                    /* Clean Minimal Tab Preview Placeholder */
                    <div className="w-full h-36 flex flex-col items-center justify-center p-4 bg-linear-to-b from-black/[0.02] to-black/[0.05] dark:from-white/[0.02] dark:to-white/[0.04] gap-2.5">
                      <div className="w-11 h-11 rounded-2xl bg-white/80 dark:bg-white/10 border border-black/5 dark:border-white/10 shadow-xs flex items-center justify-center">
                        {isBlank ? (
                          <OrbitLogo size={22} variant="icon" />
                        ) : hTab.favicon ? (
                          <img
                            src={hTab.favicon}
                            className="w-6 h-6 object-contain rounded-xs"
                            alt=""
                          />
                        ) : (
                          <Globe size={20} className="text-nexus-text opacity-50" />
                        )}
                      </div>
                      <div className="w-24 h-2 rounded-full bg-black/10 dark:bg-white/15" />
                      <div className="w-16 h-1.5 rounded-full bg-black/6 dark:bg-white/10" />
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })()
        )}
      </AnimatePresence>

      <TabContextMenu
        menu={tabContextMenu}
        onClose={() => setTabContextMenu(null)}
        onNewTabRight={handleNewTabRight}
        onReload={handleReloadTab}
        onDuplicate={handleDuplicateTab}
        onTogglePin={handleTogglePinTab}
        onToggleMute={handleToggleMuteTab}
        onCloseTab={handleCloseTab}
        onCloseOther={handleCloseOtherTabs}
        onCloseRight={handleCloseTabsToRight}
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
        <div 
          className="fixed top-24 left-1/2 -translate-x-1/2 z-[90000] w-100"
          style={{ zIndex: 90000 }}
        >
          <div className="bg-white/40 dark:bg-[#202124]/80 backdrop-blur-2xl border border-white/20 dark:border-white/10 rounded-4xl p-6 shadow-[0_30px_100px_rgba(0,0,0,0.3)] relative overflow-hidden group">
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
