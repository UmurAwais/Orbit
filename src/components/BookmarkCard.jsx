import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';

const BookmarkCard = memo(({ title, url, onClick, onDelete }) => {
  const domain = new URL(url).hostname;
  
  return (
    <motion.div 
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{ y: -4 }}
      className="group relative flex flex-col items-center gap-3 p-4 rounded-4xl hover:bg-orbit-card transition-colors duration-300 cursor-pointer"
    >
      {/* Delete Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        className="absolute top-2 right-2 w-6 h-6 rounded-full bg-orbit-card hover:bg-red-500 hover:text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 z-10"
      >
        <X size={12} />
      </button>

      <div 
        onClick={() => onClick(url)}
        className="relative w-18 h-18 rounded-[1.75rem] bg-orbit-surface shadow-[0_4px_12px_rgba(0,0,0,0.03),0_0_0_1px_rgba(0,0,0,0.02)] flex items-center justify-center group-hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)] group-hover:ring-1 group-hover:ring-orbit-border transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] overflow-hidden"
      >
        <div className="absolute inset-0 rounded-[1.75rem] from-orbit-surface via-orbit-surface to-orbit-border/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        <img 
          src={`https://www.google.com/s2/favicons?sz=128&domain=${domain}`} 
          className="w-9 h-9 object-contain opacity-90 group-hover:scale-110 group-hover:opacity-100 transition-all duration-500 z-1" 
          alt={title}
          onError={(e) => {
            e.target.src = `https://ui-avatars.com/api/?name=${title}&background=random&color=fff&size=128`;
          }}
        />
      </div>
      
      <span className="text-[13px] font-medium text-orbit-text-dim group-hover:text-orbit-text transition-colors tracking-tight text-center truncate w-24">
        {title}
      </span>
    </motion.div>
  );
});

export default BookmarkCard;
