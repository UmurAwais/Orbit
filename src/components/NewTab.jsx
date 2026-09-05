import React, { memo, useState, useCallback, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Search, ArrowUpRight, Shield, Zap, Globe, TrendingUp,
  Plus, Bookmark, History, Download
} from 'lucide-react';

import OrbitLogo from './OrbitLogo';
import BookmarkCard from './BookmarkCard';
import AddBookmarkCard from './AddBookmarkCard';
import worccoWordmark from '../assets/worcco_wordmark.png';

const NewTab = ({ onNavigate, bookmarks = [], onUpdateBookmarks }) => {
  const [query, setQuery]     = useState('');
  const [focused, setFocused] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [selIdx, setSelIdx]   = useState(-1);
  const inputRef              = useRef(null);

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
      <div className="nt-body">

        {/* ── Brand Hero (Chrome NTP style) ── */}
        <div className="nt-hero">
          <OrbitLogo size={46} />
          <span className="nt-brand-name">Orbit</span>
        </div>

        {/* ── Omnibox Search (Chrome + Edge hybrid) ── */}
        <div className="nt-omnibox-wrap">
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
            {query.length > 0 && (
              <button
                type="submit"
                className="nt-omnibox-go"
              >
                <ArrowUpRight size={15} strokeWidth={2.5} />
              </button>
            )}
          </form>

          {/* Chrome-style Suggestion Dropdown */}
          {focused && suggestions.length > 0 && (
            <div className="nt-suggestions">
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
            </div>
          )}
        </div>

        {/* ── Top Sites (Chrome + Firefox style) ── */}
        <section className="nt-topsites">
          {/* {bookmarks.length > 0 && (
            <div className="nt-section-label">Favourites</div>
          )} */}
          <div className="nt-topsites-grid">
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
            <AddBookmarkCard onAdd={addBookmark} variant="minimal" />
          </div>
        </section>

        {/* ── Privacy + Performance Stats (Brave + Edge) ── */}
        {/* <div className="nt-stats-row">
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
        </div> */}

      </div>

      {/* ── "from Worcco" Footer ── */}
      <div 
        className="nt-status"
        onClick={() => onNavigate('https://worcco.com')}
        style={{ cursor: 'pointer' }}
        title="Visit Worcco"
      >
        <span className="nt-from-text">from</span>
        <img
          src={worccoWordmark}
          alt="Worcco"
          className="nt-worcco-logo"
        />
      </div>
    </div>
  );
};

export default memo(NewTab);
