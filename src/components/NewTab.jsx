import React, { memo, useState, useCallback, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Search,
  History,
  Settings,
  Download,
  DownloadCloud,
  Sparkles,
  Loader2,
  Shield,
  Puzzle,
  User,
  Share2,
  Bell
} from 'lucide-react';

import OrbitLogo from './OrbitLogo';
import { getSmartSearchInsights } from '../services/ai';
import BookmarkCard from './BookmarkCard';
import AddBookmarkCard from './AddBookmarkCard';
import DashboardHeader from './DashboardHeader';


const NewTab = ({ onNavigate, bookmarks = [], onUpdateBookmarks }) => {
  const [localQuery, setLocalQuery] = useState('');
  const [time, setTime] = useState(new Date());
  const [aiInsight, setAiInsight] = useState(null);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (localQuery.trim().length < 4) {
      setAiInsight(null);
      setIsSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      const insight = await getSmartSearchInsights(localQuery);
      setAiInsight(insight);
      setIsSearching(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [localQuery]);

  const handleInternalSubmit = useCallback((e) => {
    if (e) e.preventDefault();
    const val = localQuery.trim();
    if (!val) return;
    onNavigate(val);
  }, [localQuery, onNavigate]);

  const handleAddBookmark = useCallback((newBookmark) => {
    onUpdateBookmarks([...bookmarks, newBookmark]);
  }, [bookmarks, onUpdateBookmarks]);

  const handleDeleteBookmark = useCallback((id) => {
    onUpdateBookmarks(bookmarks.filter(b => b.id !== id));
  }, [bookmarks, onUpdateBookmarks]);

  const timeString = time.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit', 
    hour12: true 
  });

  return (
    <div className="h-full w-full relative flex flex-col items-center bg-orbit-bg overflow-hidden font-sans">
      <DashboardHeader onNavigate={onNavigate} />







      <div className="w-full max-w-4xl h-full flex flex-col items-center z-10 pt-24">
        
        {/* Dynamic Time Centerpiece */}
        <div className="mb-12 flex flex-col items-center">
            <h1 className="text-[96px] font-medium text-orbit-text tracking-[-0.04em] leading-none mb-2">
              {timeString.split(' ')[0]}
              <span className="text-[32px] font-normal text-orbit-text-dim ml-2 uppercase">{timeString.split(' ')[1]}</span>
            </h1>
            <div className="flex items-center gap-3">
               <OrbitLogo size={30} />
               <span className="text-[12px] font-bold text-orbit-text-dim tracking-widest uppercase">System Active</span>
            </div>
        </div>

        {/* The Orbit Hub Search */}
        <div className="w-full max-w-xl mb-16 z-20">
          <form 
            onSubmit={handleInternalSubmit}
            className="group relative"
          >
            <div className="h-14 w-full bg-orbit-surface rounded-2xl border border-orbit-border flex items-center px-5 gap-4 shadow-[0_4px_24px_rgba(0,0,0,0.04),0_0_0_1px_rgba(0,0,0,0.02)] focus-within:shadow-[0_12px_48px_rgba(0,0,0,0.08)] focus-within:border-orbit-border transition-all duration-500 ease-out">
              <Search size={18} className="text-orbit-text opacity-60 group-focus-within:text-orbit-accent group-focus-within:opacity-100 transition-colors" />
              <input 
                type="text" 
                placeholder="Search Orbit or enter URL..."
                value={localQuery}
                onChange={(e) => setLocalQuery(e.target.value)}
                className="bg-transparent border-none outline-none w-full text-[16px] font-medium text-orbit-text placeholder:text-orbit-text-dim"
                autoFocus
                spellCheck={false}
              />
              <div className="flex items-center gap-2">
                 {isSearching && (
                   <Loader2 size={16} className="text-orbit-accent animate-spin" />
                 )}
                 {localQuery.length > 0 && (
                   <button className="p-2 rounded-full hover:bg-orbit-card text-orbit-text opacity-70 hover:opacity-100 transition-colors animate-in fade-in zoom-in duration-200">
                      <DownloadCloud size={18} />
                   </button>
                 )}
              </div>
            </div>

            {/* AI Search Insight Card */}
            <AnimatePresence>
              {aiInsight && localQuery.length >= 4 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 10 }}
                  className="absolute top-full left-0 right-0 mt-4 p-5 bg-orbit-surface shadow-[0_32px_64px_-16px_rgba(0,0,0,0.12)] border border-orbit-border rounded-4xl z-50 overflow-hidden"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles size={14} className="text-orbit-accent" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-orbit-accent">AI Insight</span>
                  </div>
                  
                  <p className="text-[14px] text-orbit-text/90 mb-4 leading-relaxed font-medium">
                    {aiInsight.fact}
                  </p>
                  
                  <div className="flex flex-wrap gap-2">
                    {aiInsight.suggestions?.map((s, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => { setLocalQuery(s); onNavigate(s); }}
                        className="px-4 py-2 rounded-full bg-orbit-accent/10 border border-orbit-accent/5 text-orbit-accent text-[11px] font-bold hover:bg-orbit-accent hover:text-orbit-bg transition-all shadow-sm active:scale-95"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </form>
        </div>

        {/* Semantic Shortcuts Grid */}
        <main className="w-full max-w-4xl px-8 flex justify-center">
          <div className="flex flex-wrap justify-center gap-x-2 gap-y-3">
            <AnimatePresence mode="popLayout">
              {bookmarks.map((item) => (
                <BookmarkCard 
                  key={item.id}
                  title={item.title}
                  url={item.url}
                  onClick={onNavigate}
                  onDelete={() => handleDeleteBookmark(item.id)}
                />
              ))}
              <AddBookmarkCard onAdd={handleAddBookmark} />
            </AnimatePresence>
          </div>
        </main>


        <footer className="w-full h-16 mt-auto flex justify-between items-center text-orbit-text-dim text-[11px] font-bold uppercase tracking-widest px-8">
           <div className="flex gap-8">
              <span className="hover:text-orbit-text cursor-pointer transition-colors">Settings</span>
              <span className="hover:text-orbit-text cursor-pointer transition-colors">Privacy</span>
           </div>
           <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-[#34A853] animate-pulse" />
              <span>Orbit Logic Engine v2.0</span>
           </div>
        </footer>
      </div>
    </div>
  );
};

export default memo(NewTab);

