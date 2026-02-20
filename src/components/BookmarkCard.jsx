import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';

const BookmarkCard = memo(({ title, url, onClick, onDelete, variant }) => {
  const getDomain = (u) => {
    try {
      return new URL(u).hostname;
    } catch (e) {
      return u;
    }
  };

  const domain = getDomain(url);
  
  return (
    <motion.div 
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{ y: -4 }}
      className={`group relative flex flex-col items-center gap-3 rounded-2xl hover:bg-orbit-card transition-colors duration-300 cursor-pointer ${variant === 'minimal' ? 'p-2' : 'p-4'}`}
      title={title}
    >
      {/* Delete Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-orbit-card hover:bg-red-500 hover:text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 z-10 border border-orbit-border"
      >
        <X size={10} />
      </button>

      <div 
        onClick={() => onClick(url)}
        className={`relative rounded-2xl bg-orbit-surface shadow-sm flex items-center justify-center group-hover:shadow-md group-hover:-translate-y-0.5 transition-all duration-300 ease-out overflow-hidden border border-orbit-border ${variant === 'minimal' ? 'w-14 h-14' : 'w-16 h-16'}`}
      >
        <img 
          src={`https://www.google.com/s2/favicons?sz=64&domain=${domain}`} 
          className="w-8 h-8 object-contain opacity-90 group-hover:scale-110 group-hover:opacity-100 transition-all duration-300" 
          alt={title}
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = `https://ui-avatars.com/api/?name=${title}&background=random&color=fff&size=64`;
          }}
        />
      </div>
      
      <span className={`text-[11px] font-medium text-orbit-text-dim group-hover:text-orbit-text transition-colors tracking-tight text-center truncate w-20 ${variant === 'minimal' ? 'opacity-0 group-hover:opacity-100' : ''}`}>
        {title}
      </span>
    </motion.div>
  );
});

export default BookmarkCard;
