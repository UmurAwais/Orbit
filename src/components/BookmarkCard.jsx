import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';

const BookmarkCard = memo(({ title, url, onClick, onDelete }) => {
  const getDomain = (u) => {
    try { return new URL(u).hostname; } catch { return u; }
  };

  const domain = getDomain(url);
  const shortTitle = title.length > 12 ? title.slice(0, 12) + '…' : title;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.85 }}
      transition={{ type: 'spring', stiffness: 380, damping: 28 }}
      className="bm-card group"
    >
      {/* Delete */}
      <button
        className="bm-delete"
        onClick={(e) => { e.stopPropagation(); onDelete(); }}
        aria-label="Remove"
      >
        <X size={9} strokeWidth={3} />
      </button>

      {/* Favicon tile */}
      <div className="bm-tile" onClick={() => onClick(url)}>
        <div className="bm-tile-shine" />
        <img
          className="bm-favicon"
          src={`https://www.google.com/s2/favicons?sz=64&domain=${domain}`}
          alt={title}
          draggable={false}
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(title)}&background=6366f1&color=fff&size=64&bold=true`;
          }}
        />
      </div>

      {/* Label */}
      <span className="bm-label">{shortTitle}</span>
    </motion.div>
  );
});

export default BookmarkCard;
