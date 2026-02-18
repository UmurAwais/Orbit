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
  Grid
} from 'lucide-react';

import OrbitLogo from './OrbitLogo';

const GoogleTile = memo(({ title, url, onClick }) => {
  const domain = new URL(url).hostname;
  
  return (
    <div 
      onClick={() => onClick(url)}
      className="bento-item group cursor-pointer"
    >
      <div className="google-icon-container mb-4 group-hover:shadow-md transition-shadow">
        <img 
          src={`https://www.google.com/s2/favicons?sz=64&domain=${domain}`} 
          className="w-6 h-6 object-contain" 
          alt={title}
        />
      </div>
      <span className="text-[14px] font-medium text-[#3C4043] tracking-tight">{title}</span>
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
    <div className="h-full w-full relative flex flex-col items-center bg-[#FFFFFF] overflow-hidden font-sans">
      {/* Search Header Detail */}
      <div className="w-full h-16 flex items-center justify-end px-8 gap-6 z-20">
        <span className="text-[13px] font-medium text-black/60 hover:underline cursor-pointer">Images</span>
        <span className="text-[13px] font-medium text-black/60 hover:underline cursor-pointer">Maps</span>
        <div className="p-2 rounded-full hover:bg-black/5 cursor-pointer text-black/60 transition-colors">
          <Grid size={20} />
        </div>
        <div className="w-8 h-8 rounded-full bg-[#4285F4] flex items-center justify-center text-white text-[12px] font-bold">U</div>
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
            <div className="h-[48px] w-full bg-white rounded-[10px] border border-black/10 flex items-center px-4 gap-3 shadow-[0_4px_12px_rgba(0,0,0,0.05),0_0_0_1px_rgba(0,0,0,0.02)] focus-within:shadow-[0_8px_24px_rgba(0,0,0,0.12)] focus-within:border-black/5 transition-all duration-300 ease-out">
              <Search size={16} className="text-black/40 group-focus-within:text-[#635BFF] group-focus-within:opacity-100 transition-colors" />
              <input 
                type="text" 
                placeholder="Search Workspace or enter URL..."
                value={localQuery}
                onChange={(e) => setLocalQuery(e.target.value)}
                className="bg-transparent border-none outline-none w-full text-[15px] font-medium text-[#1D1D1F] placeholder:text-black/30"
                autoFocus
                spellCheck={false}
              />
            </div>
          </form>
        </div>

        {/* Semantic Shortcuts Grid */}
        <main className="w-full overflow-y-auto custom-scrollbar-hide pb-20">
          <div className="bento-grid max-w-[700px] mx-auto">
            {displayItems.map((item, i) => (
              <GoogleTile 
                key={item.id || i}
                title={item.title}
                url={item.url}
                onClick={onNavigate}
              />
            ))}
            
            <div className="bento-item group hover:bg-[#F8F9FA] cursor-pointer">
               <div className="google-icon-container mb-4">
                  <Plus size={24} className="text-black/30 group-hover:text-black transition-colors" />
               </div>
               <span className="text-[14px] font-medium text-black/30 group-hover:text-black transition-colors">Add Label</span>
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
