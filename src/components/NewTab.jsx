import React, { memo, useState, useCallback, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Search, ArrowUp, Globe, Plus, ChevronDown, Check, Mic
} from 'lucide-react';

import BookmarkCard from './BookmarkCard';
import AddBookmarkCard from './AddBookmarkCard';
import worccoWordmark from '../assets/worcco_wordmark.png';

const AI_MODELS = [
  { id: 'orbit', name: 'Orbit AI', badge: 'Default', url: null },
  { id: 'chatgpt', name: 'ChatGPT-4o', badge: 'OpenAI', url: 'https://chatgpt.com/?q=' },
  { id: 'claude', name: 'Claude 3.5 Sonnet', badge: 'Anthropic', url: 'https://claude.ai/new?q=' },
  { id: 'deepseek', name: 'DeepSeek R1', badge: 'Reasoning', url: 'https://chat.deepseek.com/' },
  { id: 'gemini', name: 'Gemini 1.5 Pro', badge: 'Google', url: 'https://gemini.google.com/app' },
  { id: 'perplexity', name: 'Perplexity AI', badge: 'Real-time Search', url: 'https://www.perplexity.ai/search?q=' },
];

const BADGE_PROMPTS = [
  'What should we do today?',
  'Where to next?',
  'What would you like to explore?',
  'What are we working on today?',
  'Ask anything or search the web',
  "What's on your mind?",
];

const NewTab = ({ onNavigate, bookmarks = [], onUpdateBookmarks }) => {
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const [selectedModel, setSelectedModel] = useState(AI_MODELS[0]);
  const [isModelMenuOpen, setIsModelMenuOpen] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [selIdx, setSelIdx] = useState(-1);
  const [displayedText, setDisplayedText] = useState(BADGE_PROMPTS[0]);
  const [promptIdx, setPromptIdx] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const inputRef = useRef(null);
  const modelMenuRef = useRef(null);

  /* Typewriter effect: types text, holds for 4.5s, backspaces, cycles */
  useEffect(() => {
    const currentFullText = BADGE_PROMPTS[promptIdx];
    let timer;

    if (!isDeleting) {
      if (displayedText.length < currentFullText.length) {
        timer = setTimeout(() => {
          setDisplayedText(currentFullText.slice(0, displayedText.length + 1));
        }, 55);
      } else {
        timer = setTimeout(() => {
          setIsDeleting(true);
        }, 4500);
      }
    } else {
      if (displayedText.length > 0) {
        timer = setTimeout(() => {
          setDisplayedText(currentFullText.slice(0, displayedText.length - 1));
        }, 28);
      } else {
        setIsDeleting(false);
        setPromptIdx((prev) => (prev + 1) % BADGE_PROMPTS.length);
      }
    }

    return () => clearTimeout(timer);
  }, [displayedText, isDeleting, promptIdx]);

  /* Close model dropdown on outside click */
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (modelMenuRef.current && !modelMenuRef.current.contains(e.target)) {
        setIsModelMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  /* ── Suggestions (Omnibox) ── */
  useEffect(() => {
    if (!focused || !query || query.startsWith('http')) { setSuggestions([]); return; }
    const t = setTimeout(async () => {
      try {
        const res = await window.orbit?.ipcRenderer?.invoke('tab:getSuggestions', query) ?? [];
        const isUrl = query.includes('.') && !query.includes(' ');
        const items = res.slice(0, 5).map(s => ({ type: 'search', text: s }));
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

    const isUrl = (v.includes('.') && !v.includes(' ')) || v.startsWith('http://') || v.startsWith('https://');
    if (isUrl) {
      onNavigate(v);
    } else {
      if (!selectedModel.url || selectedModel.id === 'orbit') {
        onNavigate(v);
      } else {
        onNavigate(`${selectedModel.url}${encodeURIComponent(v)}`);
      }
    }

    setSuggestions([]);
    setFocused(false);
  }, [query, selectedModel, onNavigate]);

  const handleKey = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelIdx(p => Math.min(p + 1, suggestions.length - 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setSelIdx(p => Math.max(p - 1, -1)); }
    if (e.key === 'Escape') { setSuggestions([]); setIsModelMenuOpen(false); inputRef.current?.blur(); }
    if (e.key === 'Enter') {
      e.preventDefault();
      if (selIdx >= 0 && suggestions[selIdx]) {
        navigate(suggestions[selIdx].text);
      } else {
        navigate();
      }
    }
  };

  const handleSubmit = (e) => { e.preventDefault(); navigate(); };

  return (
    <div className="nt">
      <div className="nt-body">

        {/* ── Top Hero & Search Section with Localized Glow ── */}
        <div className="nt-hero-section">
          {/* Ambient Gradient Glow (Strictly Localized at Top of Search Bar) */}
          <div className="nt-ambient-glow" aria-hidden="true" />

          {/* Top Floating Capsule Pill Badge with Pointer Cursor (Exact Match to Design) */}
          <div className="nt-badge-wrap">
            <div className="nt-badge-cursor" aria-hidden="true">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="#000000">
                <path
                  d="M3.5 1.5L18.5 11.5L10.5 13.5L7.5 20.5L3.5 1.5Z"
                  stroke="#ffffff"
                  strokeWidth="1.2"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div
              className="nt-badge-pill"
              onClick={() => inputRef.current?.focus()}
            >
              <span className="nt-badge-text">
                {displayedText}
                <span className="nt-badge-caret" />
              </span>
            </div>
          </div>

          {/* ── Chatbot-Style Search Bar (Exact Match) ── */}
          <div className="nt-chatbox-wrap">
            <form onSubmit={handleSubmit} className={`nt-chatbox ${focused ? 'focused' : ''}`}>

              {/* Top Input Row */}
              <div className="nt-chatbox-input-row">
                <input
                  ref={inputRef}
                  type="text"
                  className="nt-chatbox-input"
                  placeholder={`Ask ${selectedModel.name} or type URL`}
                  value={query}
                  onChange={e => { setQuery(e.target.value); setSelIdx(-1); }}
                  onFocus={() => setFocused(true)}
                  onBlur={() => setTimeout(() => { setFocused(false); setSuggestions([]); }, 200)}
                  onKeyDown={handleKey}
                  autoFocus
                  spellCheck={false}
                  autoComplete="off"
                />
              </div>

              {/* Bottom Actions Row */}
              <div className="nt-chatbox-bottom-bar">
                <div className="nt-chatbox-left-actions">

                  {/* Plus (+) Action Button */}
                  <button
                    type="button"
                    className="nt-chat-plus-btn"
                    onClick={() => { setIsModelMenuOpen(v => !v); }}
                    title="Add or Select Model"
                  >
                    <Plus size={17} strokeWidth={2.4} />
                  </button>

                  {/* Vertical Divider Line */}
                  <div className="nt-chat-divider" />

                  {/* Proper AI Models Dropdown (Clean, No Icons) */}
                  <div className="nt-chat-menu-container" ref={modelMenuRef}>
                    <button
                      type="button"
                      className={`nt-model-pill-btn ${isModelMenuOpen ? 'open' : ''}`}
                      onClick={(e) => { e.stopPropagation(); setIsModelMenuOpen(v => !v); }}
                      title="Select AI Model"
                    >
                      <span className="nt-model-pill-text">{selectedModel.name}</span>
                      <ChevronDown size={13} strokeWidth={2.2} className={`nt-model-pill-chevron ${isModelMenuOpen ? 'rotated' : ''}`} />
                    </button>

                    <AnimatePresence>
                      {isModelMenuOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: -6, scale: 0.96 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -6, scale: 0.96 }}
                          transition={{ duration: 0.14 }}
                          className="nt-model-dropdown-menu"
                        >
                          <div className="nt-model-dropdown-header">AI Model</div>
                          {AI_MODELS.map(m => {
                            const isSelected = m.id === selectedModel.id;
                            return (
                              <div
                                key={m.id}
                                className={`nt-model-dropdown-row ${isSelected ? 'selected' : ''}`}
                                onClick={() => { setSelectedModel(m); setIsModelMenuOpen(false); inputRef.current?.focus(); }}
                              >
                                <div className="nt-model-dropdown-label">
                                  <span className="nt-model-dropdown-title">{m.name}</span>
                                  <span className="nt-model-dropdown-badge">{m.badge}</span>
                                </div>
                                {isSelected && (
                                  <Check size={14} strokeWidth={2.5} className="nt-model-dropdown-check" />
                                )}
                              </div>
                            );
                          })}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                </div>

                <div className="nt-chatbox-right-actions">
                  {/* Microphone Icon */}
                  <button
                    type="button"
                    className="nt-chat-mic-btn"
                    title="Voice input"
                  >
                    <Mic size={17} strokeWidth={2.2} />
                  </button>

                  {/* Submit Button (appears when text is typed) */}
                  {query.trim().length > 0 && (
                    <button
                      type="submit"
                      className="nt-chat-submit-arrow"
                      title="Search or Go (Enter)"
                    >
                      <ArrowUp size={15} strokeWidth={2.6} />
                    </button>
                  )}
                </div>
              </div>
            </form>

            {/* Suggestions Dropdown */}
            <AnimatePresence>
              {focused && suggestions.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -4, scale: 0.99 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -4, scale: 0.99 }}
                  transition={{ duration: 0.15 }}
                  className="nt-search-suggestions"
                >
                  {suggestions.map((item, i) => (
                    <div
                      key={i}
                      className={`nt-search-suggestion-row ${selIdx === i ? 'active' : ''}`}
                      onMouseDown={() => navigate(item.text)}
                      onMouseEnter={() => setSelIdx(i)}
                    >
                      <div className="nt-search-suggestion-icon">
                        {item.type === 'url' ? <Globe size={14} /> : <Search size={14} />}
                      </div>
                      <span className="nt-search-suggestion-text">{item.text}</span>
                      {item.type === 'url' && <span className="nt-search-suggestion-tag">Visit</span>}
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* ── Top Sites / Favourites (Commented Out as Requested) ── */}
        {/* 
        <section className="nt-topsites">
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
        */}
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
