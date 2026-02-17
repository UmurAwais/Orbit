import React, { memo, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Plus,
  Search,
  Sun,
  Layout,
  Settings,
  Shield,
  Clock,
  ExternalLink,
  Globe,
  User,
  LayoutGrid
} from 'lucide-react';
import OrbitLogo from './OrbitLogo';

const QuickLink = memo(({ title, url, onClick }) => {
  const [imgError, setImgError] = useState(false);
  const domain = new URL(url).hostname;
  const faviconUrl = `https://www.google.com/s2/favicons?sz=64&domain=${domain}`;

  return (
    <div 
      onClick={() => onClick(url)}
      className="flex flex-col items-center gap-4 cursor-pointer group"
    >
      <div className="w-16 h-16 rounded-[18px] bg-white border border-slate-100 flex items-center justify-center p-4 transition-all duration-500 group-hover:scale-110 group-hover:shadow-2xl group-hover:shadow-slate-200 group-active:scale-95 shadow-sm">
        {!imgError ? (
           <img 
            src={faviconUrl} 
            className="w-8 h-8 object-contain transition-all duration-500" 
            alt={title}
            onError={() => setImgError(true)}
           />
        ) : (
           <div className="w-8 h-8 flex items-center justify-center text-slate-400">
              <Globe size={24} strokeWidth={1.5} />
           </div>
        )}
      </div>
      <span className="text-[10px] font-semibold text-slate-500 group-hover:text-slate-900 transition-colors uppercase tracking-[0.2em] text-center max-w-20 truncate leading-tight">
        {title}
      </span>
    </div>
  );
});

const FAVORITES = [
  { title: 'Google', url: 'https://google.com' },
  { title: 'Apple', url: 'https://apple.com' },
  { title: 'YouTube', url: 'https://youtube.com' },
  { title: 'Amazon', url: 'https://amazon.com' },
  { title: 'ChatGPT', url: 'https://chat.openai.com' },
  { title: 'Facebook', url: 'https://facebook.com' },
];

const NewTab = ({ onNavigate }) => {
  const [localQuery, setLocalQuery] = useState('');

  const handleInternalSubmit = useCallback((e) => {
    if (e) e.preventDefault();
    const val = localQuery.trim();
    console.log('[NewTab] handleInternalSubmit called with:', val);
    if (!val) return;
    console.log('[NewTab] Calling onNavigate with:', val);
    onNavigate(val);
  }, [localQuery, onNavigate]);

  return (
    <div className="h-full w-full relative flex flex-col items-center overflow-y-auto overflow-x-hidden custom-scrollbar bg-white">
      <div className="bg-mesh opacity-5 fixed inset-0 pointer-events-none" />
      
      {/* Utility Bar */}
      <div className="w-full flex justify-between items-center p-6 z-30">
        <div className="flex items-center gap-3 text-slate-400">
           <Sun size={18} className="text-orange-400" />
           <span className="text-[10px] font-semibold tracking-widest uppercase">72° / Clean Sky</span>
        </div>
        
        <div className="flex items-center gap-2">
           {/* Text Links */}
           <div className="flex items-center gap-4">
             <button className="text-[13px] font-medium text-slate-600 hover:text-slate-900 transition-colors cursor-pointer px-2 py-1 rounded-md hover:bg-slate-100/50">Orbit Mail</button>
             <button className="text-[13px] font-medium text-slate-600 hover:text-slate-900 transition-colors cursor-pointer px-2 py-1 rounded-md hover:bg-slate-100/50">Images</button>
           </div>

           {/* Icons */}
           <button className="p-2 text-slate-500 hover:text-slate-900 rounded-full transition-all cursor-pointer">
             <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="none">
               <path d="M6,8c1.1,0,2-0.9,2-2s-0.9-2-2-2s-2,0.9-2,2S4.9,8,6,8z M12,8c1.1,0,2-0.9,2-2s-0.9-2-2-2s-2,0.9-2,2S10.9,8,12,8z M18,8 c1.1,0,2-0.9,2-2s-0.9-2-2-2s-2,0.9-2,2S16.9,8,18,8z M6,14c1.1,0,2-0.9,2-2s-0.9-2-2-2s-2,0.9-2,2S4.9,14,6,14z M12,14 c1.1,0,2-0.9,2-2s-0.9-2-2-2s-2,0.9-2,2S10.9,14,12,14z M18,14c1.1,0,2-0.9,2-2s-0.9-2-2-2s-2,0.9-2,2S16.9,14,18,14z M6,20 c1.1,0,2-0.9,2-2s-0.9-2-2-2s-2,0.9-2,2S4.9,20,6,20z M12,20c1.1,0,2-0.9,2-2s-0.9-2-2-2s-2,0.9-2,2S10.9,20,12,20z M18,20 c1.1,0,2-0.9,2-2s-0.9-2-2-2s-2,0.9-2,2S16.9,20,18,20z" />
             </svg>
           </button>

           {/* Profile with Orbit Logo-style Metallic Ring */}
           <div className="relative p-[2px] rounded-full bg-linear-to-tr from-[#2A2A2A] via-[#4A4A4A] to-[#666666] group cursor-pointer active:scale-95 transition-all shadow-lg hover:shadow-slate-300/50">
             <div className="w-8 h-8 rounded-full bg-white p-[2px]">
               <div className="w-full h-full rounded-full bg-linear-to-br from-slate-700 to-slate-900 flex items-center justify-center text-white shadow-inner">
                 <User size={14} fill="currentColor" />
               </div>
             </div>
           </div>
        </div>
      </div>

      <main className="w-full flex-1 px-12 z-20 flex flex-col items-center justify-center -mt-20">
        <section className="w-full max-w-4xl flex flex-col items-center">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
            className="mb-8"
          >
             <OrbitLogo size={110} />
          </motion.div>

          <form 
            onSubmit={handleInternalSubmit}
            className="w-full relative group max-w-2xl px-4"
          >
            <div className="relative flex items-center bg-slate-50 h-16 rounded-3xl px-8 border border-slate-200/50 shadow-xl shadow-slate-100/50 focus-within:ring-4 focus-within:ring-slate-100 focus-within:border-slate-300 transition-all duration-500">
              <Search size={22} className="text-slate-500 mr-5" strokeWidth={2} />
              <input 
                type="text" 
                placeholder="Ask Orbit or Type URL"
                value={localQuery}
                onChange={(e) => setLocalQuery(e.target.value)}
                className="bg-transparent border-none outline-none w-full text-xl font-medium text-slate-800 placeholder:text-slate-400 tracking-tight"
                autoFocus
                spellCheck={false}
              />
            </div>
          </form>

          <motion.div 
             initial={{ opacity: 0, y: 15 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ delay: 0.1, duration: 0.6 }}
             className="flex flex-wrap justify-center gap-x-8 gap-y-12 mt-16 w-full"
          >
            {FAVORITES.map((fav, i) => (
               <QuickLink key={i} title={fav.title} url={fav.url} onClick={(url) => onNavigate(url)} />
            ))}
            <div className="flex flex-col items-center gap-4 cursor-pointer group">
              <div className="w-16 h-16 rounded-[18px] border border-dashed border-slate-200 flex items-center justify-center text-slate-400 hover:border-slate-600 hover:text-slate-900 transition-all group-hover:bg-slate-50 group-hover:scale-105 group-active:scale-95 shadow-xs">
                <Plus size={24} strokeWidth={2} />
              </div>
              <span className="text-[10px] font-semibold text-slate-500 group-hover:text-slate-900 transition-colors uppercase tracking-[0.2em] text-center">Add Link</span>
            </div>
          </motion.div>
        </section>
      </main>

      <footer className="w-full mt-auto py-10 px-12 flex justify-between items-center z-20">
         <div className="flex items-center gap-8 text-[9px] font-semibold text-slate-400 uppercase tracking-[0.3em]">
            <span className="cursor-pointer hover:text-slate-900 transition-colors">Privacy</span>
            <span className="cursor-pointer hover:text-slate-900 transition-colors">Orbit Engine v1.0</span>
         </div>
         <div className="text-[9px] font-semibold text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            System Secure
         </div>
      </footer>
    </div>
  );
};

export default memo(NewTab);
