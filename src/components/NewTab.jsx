import React, { memo, useState, useCallback } from 'react';
import {
  Plus,
  Search,
  Globe,
  Settings,
  MoreVertical,
  ArrowUpRight
} from 'lucide-react';
import OrbitLogo from './OrbitLogo';

const BentoTile = memo(({ title, url, onClick, size = 'normal' }) => {
  const [imgError, setImgError] = useState(false);
  const domain = new URL(url).hostname;
  const faviconUrl = `https://www.google.com/s2/favicons?sz=128&domain=${domain}`;

  const sizeClass = 
    size === 'large' ? 'bento-item-large' : 
    size === 'wide' ? 'bento-item-wide' : '';

  return (
    <div 
      onClick={() => onClick(url)}
      className={`bento-item group flex flex-col p-6 ${sizeClass}`}
    >
      <div className="flex justify-between items-start mb-auto">
        <div className="w-12 h-12 rounded-2xl bg-black/3 flex items-center justify-center p-2.5 group-hover:bg-black/5 transition-colors">
          {!imgError ? (
            <img 
              src={faviconUrl} 
              className="w-full h-full object-contain" 
              alt={title}
              onError={() => setImgError(true)}
            />
          ) : (
            <Globe size={24} className="text-black/10" />
          )}
        </div>
        <ArrowUpRight size={18} className="text-black/0 group-hover:text-black/20 group-hover:translate-x-1 group-hover:-translate-y-1 transition-all" />
      </div>
      
      <div>
        <h3 className="text-[15px] font-medium text-[#1D1D1F] mb-1">{title}</h3>
        <p className="text-[12px] text-black/40 truncate">{domain}</p>
      </div>
    </div>
  );
});

const NewTab = ({ onNavigate, bookmarks = [] }) => {
  const [localQuery, setLocalQuery] = useState('');

  const handleInternalSubmit = useCallback((e) => {
    if (e) e.preventDefault();
    const val = localQuery.trim();
    if (!val) return;
    onNavigate(val);
  }, [localQuery, onNavigate]);

  return (
    <div className="h-full w-full relative flex flex-col items-center overflow-y-auto custom-scrollbar-hide bg-orbit-bg p-12 pt-32">
      <div className="w-full max-w-6xl space-y-20">
        
        {/* Minimal Search */}
        <div className="flex flex-col items-center space-y-8">
          <OrbitLogo size={100} />
          <form 
            onSubmit={handleInternalSubmit}
            className="w-full max-w-xl group"
          >
            <div className="relative flex items-center bg-black/3 h-14 rounded-2xl px-6 border border-black/5 hover:border-black/10 focus-within:border-black/20 transition-all">
              <Search size={20} className="text-black/20 mr-4" />
              <input 
                type="text" 
                placeholder="Where to next?"
                value={localQuery}
                onChange={(e) => setLocalQuery(e.target.value)}
                className="bg-transparent border-none outline-none w-full text-lg font-medium text-black/80 placeholder:text-black/20"
                autoFocus
                spellCheck={false}
              />
            </div>
          </form>
        </div>

        {/* Bento Dashboard */}
        <div className="space-y-6">
          <div className="flex justify-between items-end px-2">
            <div>
              <h2 className="text-[20px] font-medium text-[#1D1D1F] tracking-tight">Spaces</h2>
              <p className="text-[13px] text-black/40">Your digital architecture</p>
            </div>
          </div>
          
          <div className="bento-grid">
            {bookmarks.map((fav, i) => (
              <BentoTile 
                key={fav.id || i} 
                title={fav.title} 
                url={fav.url} 
                size={i === 0 ? 'large' : i % 5 === 0 ? 'wide' : 'normal'}
                onClick={onNavigate} 
              />
            ))}
            
            <div className="bento-item flex flex-col items-center justify-center gap-3 border-dashed border-black/10 opacity-60 hover:opacity-100 hover:border-black/20">
              <div className="w-12 h-12 rounded-2xl bg-black/3 flex items-center justify-center">
                <Plus size={24} className="text-black/20" />
              </div>
              <span className="text-[12px] font-medium text-black/40 uppercase tracking-widest">New Space</span>
            </div>
          </div>
        </div>
      </div>

      <footer className="mt-auto w-full max-w-6xl py-12 flex justify-between items-center text-black/30 text-[11px] uppercase tracking-[0.2em]">
        <span>Orbit Engine // Elite Minimalist</span>
        <div className="flex gap-8">
          <span className="cursor-pointer hover:text-black transition-colors">Safety</span>
          <span className="cursor-pointer hover:text-white transition-colors">Architecture</span>
        </div>
      </footer>
    </div>
  );
};

export default memo(NewTab);
