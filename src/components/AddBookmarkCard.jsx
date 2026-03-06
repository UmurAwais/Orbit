import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Check, Globe, Type } from 'lucide-react';

const AddBookmarkCard = ({ onAdd }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle]         = useState('');
  const [url, setUrl]             = useState('');
  const [error, setError]         = useState('');
  const inputRef                  = useRef(null);

  useEffect(() => {
    if (isEditing && inputRef.current) inputRef.current.focus();
  }, [isEditing]);

  const submit = (e) => {
    if (e) e.preventDefault();
    if (!title.trim() || !url.trim()) { setError('Both fields required'); return; }
    let finalUrl = url.trim();
    if (!finalUrl.startsWith('http')) finalUrl = `https://${finalUrl}`;
    onAdd({ id: Date.now().toString(), title: title.trim(), url: finalUrl });
    setTitle(''); setUrl(''); setIsEditing(false); setError('');
  };

  const cancel = () => { setIsEditing(false); setTitle(''); setUrl(''); setError(''); };

  return (
    <div className="bm-add-wrap">
      {!isEditing ? (
        <div
          className="bm-card bm-add-btn group"
          onClick={() => setIsEditing(true)}
        >
          <div className="bm-tile bm-tile--add">
            <Plus size={20} strokeWidth={2} className="bm-add-icon" />
          </div>
          <span className="bm-label">Add</span>
        </div>
      ) : (
        <div
          className="bm-panel"
        >
          <div className="bm-field">
            <Type size={13} className="bm-field-icon" />
            <input
              ref={inputRef}
              className="bm-field-input"
              type="text"
              placeholder="Name"
              value={title}
              onChange={e => setTitle(e.target.value)}
              onKeyDown={e => e.key === 'Escape' && cancel()}
            />
          </div>
          <div className="bm-field">
            <Globe size={13} className="bm-field-icon" />
            <input
              className="bm-field-input"
              type="text"
              placeholder="URL"
              value={url}
              onChange={e => setUrl(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') submit(); if (e.key === 'Escape') cancel(); }}
            />
          </div>
          {error && <p className="bm-error">{error}</p>}
          <div className="bm-actions">
            <button className="bm-btn-save" onClick={submit}>
              <Check size={14} strokeWidth={3} /> Save
            </button>
            <button className="bm-btn-cancel" onClick={cancel}>
              <X size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddBookmarkCard;
