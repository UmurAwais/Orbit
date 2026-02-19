import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Check, Globe, Type } from 'lucide-react';

const AddBookmarkCard = ({ onAdd }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    
    if (!title.trim() || !url.trim()) {
      setError('Please fill all fields');
      return;
    }

    // Basic URL validation/auto-protocol
    let finalUrl = url.trim();
    if (!finalUrl.startsWith('http')) {
      finalUrl = `https://${finalUrl}`;
    }

    onAdd({
      id: Date.now().toString(),
      title: title.trim(),
      url: finalUrl
    });

    // Reset and close
    setTitle('');
    setUrl('');
    setIsEditing(false);
    setError('');
  };

  const handleCancel = () => {
    setIsEditing(false);
    setTitle('');
    setUrl('');
    setError('');
  };

  return (
    <div className="relative">
      <AnimatePresence mode="wait">
        {!isEditing ? (
          <motion.div 
            key="add-button"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            whileHover={{ y: -4 }}
            onClick={() => setIsEditing(true)}
            className="group flex flex-col items-center gap-3 p-4 rounded-4xl hover:bg-black/2 transition-colors duration-300 cursor-pointer"
          >
            <div className="w-18 h-18 rounded-[1.75rem] bg-black/3 border-2 border-dashed border-black/5 flex items-center justify-center group-hover:bg-white group-hover:border-solid group-hover:border-black/5 group-hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)] transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]">
              <Plus size={24} className="text-black/20 group-hover:text-black/60 transition-colors" />
            </div>
            <span className="text-[13px] font-medium text-black/30 group-hover:text-black/60 transition-colors tracking-tight">Add shortcut</span>
          </motion.div>
        ) : (
          <motion.div
            key="add-form"
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="group flex flex-col items-center gap-3 p-4 rounded-4xl bg-white shadow-[0_32px_64px_-16px_rgba(0,0,0,0.12)] border border-black/5 z-50 absolute -top-4 -left-4 -right-4 min-w-50"
          >
            <div className="w-full flex flex-col gap-2">
              <div className="flex items-center gap-2 px-3 py-2 bg-black/5 rounded-2xl focus-within:bg-black/8 transition-colors">
                <Type size={14} className="text-black/40" />
                <input 
                  ref={inputRef}
                  type="text"
                  placeholder="Title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="bg-transparent border-none outline-none text-[13px] font-medium w-full placeholder:text-black/30"
                  onKeyDown={(e) => e.key === 'Escape' && handleCancel()}
                />
              </div>
              <div className="flex items-center gap-2 px-3 py-2 bg-black/5 rounded-2xl focus-within:bg-black/8 transition-colors">
                <Globe size={14} className="text-black/40" />
                <input 
                  type="text"
                  placeholder="URL"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="bg-transparent border-none outline-none text-[13px] font-medium w-full placeholder:text-black/30"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSubmit();
                    if (e.key === 'Escape') handleCancel();
                  }}
                />
              </div>
              
              {error && <span className="text-[10px] text-red-500 font-bold px-2">{error}</span>}

              <div className="flex gap-2 mt-1">
                <button 
                  onClick={handleSubmit}
                  className="flex-1 h-9 rounded-xl bg-orbit-accent text-white flex items-center justify-center hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shadow-lg shadow-orbit-accent/20"
                >
                  <Check size={16} strokeWidth={3} />
                </button>
                <button 
                  onClick={handleCancel}
                  className="w-9 h-9 rounded-xl bg-black/5 text-black/60 flex items-center justify-center hover:bg-black/10 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AddBookmarkCard;
