import React, { memo, useState, useCallback, useEffect } from 'react';
import {
  Plus,
  Search,
  ArrowUpRight,
  Monitor,
  Cloud,
  Mail,
  Calendar,
  MoreVertical,
  Settings,
  Grid,
  History,
  Download,
  DownloadCloud
} from 'lucide-react';
import OrbitLogo from './OrbitLogo';

const OrbitShortcut = memo(({ title, url, onClick }) => {
  const domain = new URL(url).hostname;
  
  return (
    <div 
      onClick={() => onClick(url)}
      className="group flex flex-col items-center gap-3 p-4 rounded-3xl hover:bg-white transition-all duration-300 cursor-pointer"
    >
      <div className="w-18 h-18 rounded-3xl bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)] ring-1 ring-black/3 flex items-center justify-center group-hover:scale-105 group-hover:shadow-[0_12px_24px_rgba(0,0,0,0.08)] group-hover:ring-black/6 transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]">
        <img 
          src={`https://www.google.com/s2/favicons?sz=64&domain=${domain}`} 
          className="w-9 h-9 object-contain opacity-95 group-hover:opacity-100 transition-opacity" 
          alt={title}
        />
      </div>
      <span className="text-[13px] font-medium text-black/60 group-hover:text-black group-hover:font-semibold transition-all tracking-wide">{title}</span>
    </div>
  );
});

const NewTab = ({ onNavigate, bookmarks = [] }) => {
  const [localQuery, setLocalQuery] = useState('');
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleInternalSubmit = useCallback((e) => {
    if (e) e.preventDefault();
    const val = localQuery.trim();
    if (!val) return;
    onNavigate(val);
  }, [localQuery, onNavigate]);

  const timeString = time.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit', 
    hour12: true 
  });

  const displayItems = bookmarks.length > 0 ? bookmarks : [
    { title: 'Google Mail', url: 'https://mail.google.com' },
    { title: 'Drive', url: 'https://drive.google.com' },
    { title: 'Calendar', url: 'https://calendar.google.com' },
    { title: 'Cloud', url: 'https://console.cloud.google.com' }
  ];

  return (
    <div className="h-full w-full relative flex flex-col items-center bg-orbit-bg overflow-hidden font-sans">
      {/* Orbit Header Detail */}
      <div className="w-full h-16 flex items-center justify-end px-8 gap-4 z-20">
        {/* <div className="flex items-center bg-[#F1F3F4] rounded-full p-1 pr-2 gap-1">
          <div className="px-4 py-1.5 rounded-full hover:bg-white text-[13px] font-medium text-black/60 hover:text-black hover:shadow-sm transition-all cursor-pointer">Canvas</div>
          <div className="w-px h-3 bg-black/10" />
          <div className="px-4 py-1.5 rounded-full hover:bg-white text-[13px] font-medium text-black/60 hover:text-black hover:shadow-sm transition-all cursor-pointer">Spaces</div>
          <div className="w-px h-3 bg-black/10" />
          <div className="px-4 py-1.5 rounded-full hover:bg-white text-[13px] font-medium text-black/60 hover:text-black hover:shadow-sm transition-all cursor-pointer">Library</div>
        </div> */}
        
        <div className="flex items-center bg-[#F1F3F4] rounded-full p-1 gap-1">
             <div className="w-10 h-10 rounded-full hover:bg-white flex items-center justify-center text-black/60 hover:text-black hover:shadow-sm transition-all cursor-pointer" title="History">
                <History size={18} />
             </div>
             <div className="w-10 h-10 rounded-full hover:bg-white flex items-center justify-center text-black/60 hover:text-black hover:shadow-sm transition-all cursor-pointer" title="Downloads">
                <Download size={18} />
             </div>
             <div className="w-10 h-10 rounded-full hover:bg-white flex items-center justify-center text-black/60 hover:text-black hover:shadow-sm transition-all cursor-pointer" title="Settings">
                <Settings size={18} />
             </div>
        </div>
      </div>

      <div className="w-full max-w-4xl h-full flex flex-col items-center z-10 pt-24">
        
        {/* Dynamic Time Centerpiece */}
        <div className="mb-12 flex flex-col items-center">
            <h1 className="text-[96px] font-medium text-[#202124] tracking-[-0.04em] leading-none mb-2">
              {timeString.split(' ')[0]}
              <span className="text-[32px] font-normal text-black/20 ml-2 uppercase">{timeString.split(' ')[1]}</span>
            </h1>
            <div className="flex items-center gap-3">
               <OrbitLogo size={30} />
               <span className="text-[12px] font-bold text-black/30 tracking-widest uppercase">System Active</span>
            </div>
        </div>

        {/* The Orbit Hub Search */}
        <div className="w-full max-w-xl mb-20 z-20">
          <form 
            onSubmit={handleInternalSubmit}
            className="group relative"
          >
            <div className="h-12 w-full bg-white rounded-[10px] border border-black/10 flex items-center px-4 gap-3 shadow-[0_4px_12px_rgba(0,0,0,0.05),0_0_0_1px_rgba(0,0,0,0.02)] focus-within:shadow-[0_8px_24px_rgba(0,0,0,0.12)] focus-within:border-black/5 transition-all duration-300 ease-out">
              <Search size={16} className="text-black/40 group-focus-within:text-orbit-accent group-focus-within:opacity-100 transition-colors" />
              <input 
                type="text" 
                placeholder="Search Workspace or enter URL..."
                value={localQuery}
                onChange={(e) => setLocalQuery(e.target.value)}
                className="bg-transparent border-none outline-none w-full text-[15px] font-medium text-[#1D1D1F] placeholder:text-black/30"
                autoFocus
                spellCheck={false}
              />
              <div className="flex items-center gap-2">
                 {localQuery.length > 0 && (
                   <button className="p-1.5 rounded-md hover:bg-black/5 text-black/40 hover:text-black transition-colors animate-in fade-in zoom-in duration-200">
                      <DownloadCloud size={16} />
                   </button>
                 )}
              </div>
            </div>
          </form>
        </div>

        {/* Semantic Shortcuts Grid */}
        <main className="w-full overflow-y-auto custom-scrollbar-hide pb-20 px-8">
          <div className="grid grid-cols-4 gap-2 max-w-160 mx-auto">
            {displayItems.map((item, i) => (
              <OrbitShortcut 
                key={item.id || i}
                title={item.title}
                url={item.url}
                onClick={onNavigate}
              />
            ))}
            
            <div className="group flex flex-col items-center gap-3 p-4 rounded-3xl hover:bg-white transition-all duration-300 cursor-pointer">
               <div className="w-18 h-18 rounded-3xl bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)] ring-1 ring-black/3 flex items-center justify-center group-hover:scale-105 group-hover:shadow-[0_12px_24px_rgba(0,0,0,0.08)] group-hover:ring-black/6 transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]">
                  <Plus size={28} className="text-black/30 group-hover:text-black/60 transition-colors" />
               </div>
               <span className="text-[13px] font-medium text-black/40 group-hover:text-black/60 transition-colors tracking-wide">Add</span>
            </div>
          </div>
        </main>

        <footer className="w-full h-16 flex justify-between items-center text-black/30 text-[11px] font-bold uppercase tracking-widest px-8">
           <div className="flex gap-8">
              <span className="hover:text-black cursor-pointer">Settings</span>
              <span className="hover:text-black cursor-pointer">Privacy</span>
           </div>
           <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-[#34A853]" />
              <span>Orbit Logic Engine</span>
           </div>
        </footer>
      </div>
    </div>
  );
};

export default memo(NewTab);
