import React, { memo, useState, useCallback, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Search, ArrowUpRight, Shield, Zap, Globe, TrendingUp,
  Plus, Bookmark, History, Download
} from 'lucide-react';

import OrbitLogo from './OrbitLogo';
import BookmarkCard from './BookmarkCard';
import AddBookmarkCard from './AddBookmarkCard';

/* ─── Greeting ─── */
const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 5)  return { text: 'Good Night',     emoji: '🌙' };
  if (h < 12) return { text: 'Good Morning',   emoji: '☀️' };
  if (h < 17) return { text: 'Good Afternoon', emoji: '🌤' };
  if (h < 21) return { text: 'Good Evening',   emoji: '🌆' };
  return       { text: 'Good Night',           emoji: '🌙' };
};

/* ─── Hardcoded session stats (like Brave/Edge) ─── */
const STATS = [
  { icon: Shield,      value: '2,847', label: 'Trackers Blocked',   accent: 'var(--orbit-accent)' },
  { icon: Zap,         value: '184ms', label: 'Avg. Page Load',      accent: 'var(--orbit-accent)' },
  { icon: Globe,       value: '99.9%', label: 'Secure Connections',  accent: 'var(--orbit-accent)' },
];


/* ─── Quick-nav items (inspired by Edge top bar links) ─── */
const QUICK_NAV = [
  { label: 'Bookmarks', icon: Bookmark,  action: null },
  { label: 'History',   icon: History,   action: null },
  { label: 'Downloads', icon: Download,  action: null },
];

const NewTab = ({ onNavigate, bookmarks = [], onUpdateBookmarks }) => {
  const [query, setQuery]     = useState('');
  const [focused, setFocused] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [selIdx, setSelIdx]   = useState(-1);
  const inputRef              = useRef(null);
  const { text: greeting }    = getGreeting();

  /* ── Suggestions (Chrome-style omnibox) ── */
  useEffect(() => {
    if (!focused || !query || query.startsWith('http')) { setSuggestions([]); return; }
    const t = setTimeout(async () => {
      try {
        const res = await window.orbit?.ipcRenderer?.invoke('tab:getSuggestions', query) ?? [];
        const isUrl = query.includes('.') && !query.includes(' ');
        const items = res.slice(0, 6).map(s => ({ type: 'search', text: s }));
        if (isUrl) items.unshift({ type: 'url', text: query });
        setSuggestions(items);
        setSelIdx(-1);
      } catch { setSuggestions([]); }
    }, 120);
    return () => clearTimeout(t);
  }, [query, focused]);

  const navigate = useCallback((val) => {
    const v = val?.trim() || query.trim();
    if (!v) return;
    onNavigate(v);
    setSuggestions([]);
    setFocused(false);
  }, [query, onNavigate]);

  const handleKey = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelIdx(p => Math.min(p + 1, suggestions.length - 1)); }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setSelIdx(p => Math.max(p - 1, -1)); }
    if (e.key === 'Escape')    { setSuggestions([]); inputRef.current?.blur(); }
    if (e.key === 'Enter' && selIdx >= 0 && suggestions[selIdx]) {
      e.preventDefault(); navigate(suggestions[selIdx].text);
    }
  };

  const handleSubmit = (e) => { e.preventDefault(); navigate(); };

  const addBookmark = useCallback((b) => onUpdateBookmarks([...bookmarks, b]), [bookmarks, onUpdateBookmarks]);
  const delBookmark = useCallback((id) => onUpdateBookmarks(bookmarks.filter(b => b.id !== id)), [bookmarks, onUpdateBookmarks]);

  return (
    <div className="nt">
      {/* ── Layered CSS Background ── */}
      <div className="nt-bg" aria-hidden="true">
        <div className="nt-bg-1" />
        <div className="nt-bg-2" />
        <div className="nt-bg-3" />
        <div className="nt-bg-grid" />
      </div>

      <div className="nt-body">

        {/* ── Greeting (Firefox NTP style) ── */}
        <motion.div
          className="nt-greeting-row"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="nt-brand">
            <OrbitLogo size={34} />
            <span className="nt-brand-name">Orbit</span>
          </div>
          <span className="nt-greeting-text">{greeting}</span>
        </motion.div>

        {/* ── Omnibox Search (Chrome + Edge hybrid) ── */}
        <motion.div
          className="nt-omnibox-wrap"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.06, ease: [0.22, 1, 0.36, 1] }}
        >
          <form onSubmit={handleSubmit} className={`nt-omnibox ${focused ? 'nt-omnibox--focus' : ''}`}>
            <Search size={17} strokeWidth={2} className="nt-omnibox-icon" />
            <input
              ref={inputRef}
              className="nt-omnibox-input"
              type="text"
              placeholder="Search or enter address"
              value={query}
              onChange={e => { setQuery(e.target.value); setSelIdx(-1); }}
              onFocus={() => setFocused(true)}
              onBlur={() => setTimeout(() => { setFocused(false); setSuggestions([]); }, 150)}
              onKeyDown={handleKey}
              autoFocus
              spellCheck={false}
              autoComplete="off"
            />
            <AnimatePresence>
              {query.length > 0 && (
                <motion.button
                  type="submit"
                  className="nt-omnibox-go"
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.6 }}
                  transition={{ duration: 0.12 }}
                >
                  <ArrowUpRight size={15} strokeWidth={2.5} />
                </motion.button>
              )}
            </AnimatePresence>
          </form>

          {/* Chrome-style Suggestion Dropdown */}
          <AnimatePresence>
            {focused && suggestions.length > 0 && (
              <motion.div
                className="nt-suggestions"
                initial={{ opacity: 0, y: 4, scaleY: 0.96 }}
                animate={{ opacity: 1, y: 0, scaleY: 1 }}
                exit={{ opacity: 0, y: 4, scaleY: 0.96 }}
                transition={{ duration: 0.15 }}
              >
                {suggestions.map((item, i) => (
                  <div
                    key={i}
                    className={`nt-suggestion-row ${selIdx === i ? 'nt-suggestion-row--active' : ''}`}
                    onMouseDown={() => navigate(item.text)}
                    onMouseEnter={() => setSelIdx(i)}
                  >
                    <div className="nt-suggestion-icon">
                      {item.type === 'url' ? <Globe size={13} /> : <Search size={13} />}
                    </div>
                    <span className="nt-suggestion-text">{item.text}</span>
                    {item.type === 'url' && <span className="nt-suggestion-tag">Visit</span>}
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* ── Top Sites (Chrome + Firefox style) ── */}
        <motion.section
          className="nt-topsites"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
        >
          {bookmarks.length > 0 && (
            <div className="nt-section-label">Favourites</div>
          )}
          <div className="nt-topsites-grid">
            <AnimatePresence mode="popLayout">
              {bookmarks.map(item => (
                <BookmarkCard
                  key={item.id}
                  title={item.title}
                  url={item.url}
                  onClick={onNavigate}
                  onDelete={() => delBookmark(item.id)}
                  variant="minimal"
                />
              ))}
            </AnimatePresence>
            <AddBookmarkCard onAdd={addBookmark} variant="minimal" />
          </div>
        </motion.section>

        {/* ── Privacy + Performance Stats (Brave + Edge) ── */}
        <motion.div
          className="nt-stats-row"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
        >
          {STATS.map(({ icon: Icon, value, label, accent }, i) => (
            <div className="nt-stat-card" key={i}>
              <div className="nt-stat-icon" style={{ '--accent': accent }}>
                <Icon size={14} strokeWidth={2} />
              </div>
              <div className="nt-stat-body">
                <span className="nt-stat-value" style={{ '--accent': accent }}>{value}</span>
                <span className="nt-stat-label">{label}</span>
              </div>
            </div>
          ))}
        </motion.div>

      </div>

      {/* ── Status ── */}
      <motion.div
        className="nt-status"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <span className="nt-status-dot" />
        <span className="nt-status-text">Orbit · Private & Fast</span>
      </motion.div>
    </div>
  );
};

export default memo(NewTab);
