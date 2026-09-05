import React, { memo, useState, useCallback, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Search, ArrowUp, Globe, Plus, ChevronDown, Check, Mic, MicOff,
  X, FileText
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
  const [isPlusMenuOpen, setIsPlusMenuOpen] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [isDeepSearch, setIsDeepSearch] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [selIdx, setSelIdx] = useState(-1);
  const [displayedText, setDisplayedText] = useState(BADGE_PROMPTS[0]);
  const [promptIdx, setPromptIdx] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  const inputRef = useRef(null);
  const modelMenuRef = useRef(null);
  const plusMenuRef = useRef(null);
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const recognitionRef = useRef(null);

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

  /* Close dropdowns on outside click */
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (modelMenuRef.current && !modelMenuRef.current.contains(e.target)) {
        setIsModelMenuOpen(false);
      }
      if (plusMenuRef.current && !plusMenuRef.current.contains(e.target)) {
        setIsPlusMenuOpen(false);
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

  /* Handle File & Image Attachments */
  const handleFileUpload = (e, forcedType = null) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isImg = forcedType === 'image' || file.type.startsWith('image/');
    const reader = new FileReader();

    if (isImg) {
      const url = URL.createObjectURL(file);
      setAttachments(prev => [...prev, {
        id: Date.now().toString(),
        name: file.name,
        type: 'image',
        size: (file.size / 1024).toFixed(1) + ' KB',
        preview: url,
        file
      }]);
    } else {
      reader.onload = (event) => {
        const text = event.target?.result || '';
        setAttachments(prev => [...prev, {
          id: Date.now().toString(),
          name: file.name,
          type: 'document',
          size: (file.size / 1024).toFixed(1) + ' KB',
          content: text,
          file
        }]);
      };
      reader.readAsText(file);
    }

    e.target.value = '';
    setIsPlusMenuOpen(false);
    inputRef.current?.focus();
  };

  const removeAttachment = (id) => {
    setAttachments(prev => prev.filter(a => a.id !== id));
  };

  /* Voice Input Handling */
  const toggleVoiceInput = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice search is not supported in this browser environment.");
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => setIsListening(true);
      recognition.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map(result => result[0].transcript)
          .join('');
        setQuery(transcript);
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => {
        setIsListening(false);
        inputRef.current?.focus();
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error(err);
      setIsListening(false);
    }
  };

  const navigate = useCallback((val) => {
    let v = val?.trim() || query.trim();
    if (!v && attachments.length === 0) return;

    if (attachments.length > 0) {
      const fileContext = attachments
        .filter(a => a.content)
        .map(a => `[Attachment: ${a.name}]\n${a.content.slice(0, 3000)}`)
        .join('\n\n');
      if (fileContext) {
        v = v ? `${v}\n\n${fileContext}` : fileContext;
      }
    }

    if (isDeepSearch) {
      v = `[Deep Research] ${v}`;
    }

    const isUrl = (v.includes('.') && !v.includes(' ')) || v.startsWith('http://') || v.startsWith('https://');
    if (isUrl && attachments.length === 0 && !isDeepSearch) {
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
  }, [query, selectedModel, attachments, isDeepSearch, onNavigate]);

  const handleKey = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelIdx(p => Math.min(p + 1, suggestions.length - 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setSelIdx(p => Math.max(p - 1, -1)); }
    if (e.key === 'Escape') {
      setSuggestions([]);
      setIsModelMenuOpen(false);
      setIsPlusMenuOpen(false);
      inputRef.current?.blur();
    }
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
      {/* Hidden File Inputs */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={(e) => handleFileUpload(e, 'document')}
        accept=".pdf,.txt,.md,.json,.csv,.js,.jsx,.ts,.tsx,.py,.html,.css,.doc,.docx"
        className="hidden"
        style={{ display: 'none' }}
      />
      <input
        type="file"
        ref={imageInputRef}
        onChange={(e) => handleFileUpload(e, 'image')}
        accept="image/*"
        className="hidden"
        style={{ display: 'none' }}
      />

      <div className="nt-body">
        {/* ── Top Hero & Search Section with Localized Glow ── */}
        <div className="nt-hero-section">
          {/* Ambient Gradient Glow */}
          <div className="nt-ambient-glow" aria-hidden="true" />

          {/* Top Floating Capsule Pill Badge with Pointer Cursor */}
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

          {/* ── Chatbot-Style Search Bar ── */}
          <div className="nt-chatbox-wrap">
            <form onSubmit={handleSubmit} className={`nt-chatbox ${focused ? 'focused' : ''}`}>

              {/* Active Attachments & Mode Chips Row */}
              <AnimatePresence>
                {(attachments.length > 0 || isDeepSearch) && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="nt-attachments-bar"
                  >
                    {isDeepSearch && (
                      <span className="nt-badge-deep-search">
                        Deep Research
                        <button
                          type="button"
                          onClick={() => setIsDeepSearch(false)}
                          className="nt-badge-close"
                          title="Remove Deep Research mode"
                        >
                          <X size={10} />
                        </button>
                      </span>
                    )}

                    {attachments.map(att => (
                      <span key={att.id} className="nt-attachment-pill">
                        {att.type === 'image' ? (
                          <img src={att.preview} alt="" className="nt-attachment-thumb" />
                        ) : (
                          <FileText size={12} className="text-orbit-accent shrink-0" />
                        )}
                        <span className="nt-attachment-name truncate max-w-[120px]">{att.name}</span>
                        <span className="nt-attachment-size">{att.size}</span>
                        <button
                          type="button"
                          onClick={() => removeAttachment(att.id)}
                          className="nt-badge-close"
                          title="Remove attachment"
                        >
                          <X size={10} />
                        </button>
                      </span>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

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

                  {/* Plus (+) Action Menu Button */}
                  <div className="nt-plus-menu-container" ref={plusMenuRef}>
                    <button
                      type="button"
                      className={`nt-chat-plus-btn ${isPlusMenuOpen ? 'active' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsPlusMenuOpen(v => !v);
                        setIsModelMenuOpen(false);
                      }}
                      title="Attach File, Image, Tools & Quick Prompts"
                    >
                      <Plus
                        size={17}
                        strokeWidth={2.4}
                        style={{
                          transform: isPlusMenuOpen ? 'rotate(45deg)' : 'none',
                          transition: 'transform 0.2s cubic-bezier(0.2, 0.9, 0.3, 1)'
                        }}
                      />
                    </button>

                    {/* Upload Dropdown Menu (Clean, Pure Typography - No Icons) */}
                    <AnimatePresence>
                      {isPlusMenuOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: -6, scale: 0.96 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -6, scale: 0.96 }}
                          transition={{ duration: 0.14 }}
                          className="nt-plus-dropdown-menu"
                        >
                          <div className="nt-plus-menu-section-title">Add & Tools</div>

                          <div
                            className="nt-plus-menu-row"
                            onClick={() => { fileInputRef.current?.click(); }}
                          >
                            <div className="nt-plus-menu-label">
                              <span className="nt-plus-menu-name">Upload Document</span>
                              <span className="nt-plus-menu-desc">PDF, TXT, DOCX, Code, CSV</span>
                            </div>
                          </div>

                          <div
                            className="nt-plus-menu-row"
                            onClick={() => { imageInputRef.current?.click(); }}
                          >
                            <div className="nt-plus-menu-label">
                              <span className="nt-plus-menu-name">Upload Image</span>
                              <span className="nt-plus-menu-desc">Screenshot or photo</span>
                            </div>
                          </div>

                          <div
                            className={`nt-plus-menu-row ${isDeepSearch ? 'active-mode' : ''}`}
                            onClick={() => {
                              setIsDeepSearch(v => !v);
                              setIsPlusMenuOpen(false);
                              inputRef.current?.focus();
                            }}
                          >
                            <div className="nt-plus-menu-label">
                              <span className="nt-plus-menu-name">Deep Research</span>
                              <span className="nt-plus-menu-desc">{isDeepSearch ? 'Enabled' : 'Multi-step reasoning'}</span>
                            </div>
                            {isDeepSearch && <Check size={14} strokeWidth={2.5} className="nt-model-dropdown-check" />}
                          </div>

                          <div className="nt-plus-menu-divider" />
                          <div className="nt-plus-menu-section-title">Quick Prompts</div>

                          <div
                            className="nt-plus-menu-prompt-row"
                            onClick={() => {
                              setQuery("Summarize this: ");
                              setIsPlusMenuOpen(false);
                              inputRef.current?.focus();
                            }}
                          >
                            <span>Summarize text / article</span>
                          </div>

                          <div
                            className="nt-plus-menu-prompt-row"
                            onClick={() => {
                              setQuery("Write and explain code for ");
                              setIsPlusMenuOpen(false);
                              inputRef.current?.focus();
                            }}
                          >
                            <span>Code Assistant & Debug</span>
                          </div>

                          <div
                            className="nt-plus-menu-prompt-row"
                            onClick={() => {
                              setQuery("Draft a professional email about ");
                              setIsPlusMenuOpen(false);
                              inputRef.current?.focus();
                            }}
                          >
                            <span>Draft Email / Writing</span>
                          </div>

                          <div
                            className="nt-plus-menu-prompt-row"
                            onClick={() => {
                              setQuery("Translate the following to English: ");
                              setIsPlusMenuOpen(false);
                              inputRef.current?.focus();
                            }}
                          >
                            <span>Translate to English</span>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Vertical Divider Line */}
                  <div className="nt-chat-divider" />

                  {/* AI Models Dropdown */}
                  <div className="nt-chat-menu-container" ref={modelMenuRef}>
                    <button
                      type="button"
                      className={`nt-model-pill-btn ${isModelMenuOpen ? 'open' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsModelMenuOpen(v => !v);
                        setIsPlusMenuOpen(false);
                      }}
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
                  {/* Microphone Icon with Voice Recognition */}
                  <button
                    type="button"
                    onClick={toggleVoiceInput}
                    className={`nt-chat-mic-btn ${isListening ? 'listening' : ''}`}
                    title={isListening ? "Listening... (Click to stop)" : "Voice input"}
                  >
                    {isListening ? <MicOff size={17} strokeWidth={2.2} /> : <Mic size={17} strokeWidth={2.2} />}
                  </button>

                  {/* Submit Button */}
                  {(query.trim().length > 0 || attachments.length > 0) && (
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
