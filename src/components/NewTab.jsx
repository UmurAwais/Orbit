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
    hour12: false 
  });

  return (
    <div className="relative w-full h-full flex flex-col bg-orbit-bg overflow-hidden font-sans selection:bg-orbit-accent selection:text-white">
      
      {/* Subtle Animated Background - Zen Mode */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-50%] left-[-20%] w-[80vw] h-[80vw] bg-orbit-accent/5 rounded-full blur-[150px] animate-pulse duration-10000" />
        <div className="absolute bottom-[-50%] right-[-20%] w-[80vw] h-[80vw] bg-blue-500/5 rounded-full blur-[150px] animate-pulse duration-75" />
      </div>

      {/* <DashboardHeader onNavigate={onNavigate} /> */}

      <main className="flex-1 flex flex-col items-center justify-center relative z-10 px-6 pb-24 w-full max-w-7xl mx-auto">
        
        {/* Typographic Centerpiece */}
        <div className="flex flex-col items-center mb-16 select-none">
          <h1 className="text-[12rem] leading-none font-thin text-orbit-text tracking-tighter opacity-90" style={{ fontVariationSettings: '"wght" 100' }}>
            {timeString}
          </h1>
          <p className="text-sm font-bold uppercase tracking-[0.3em] text-orbit-text-dim mt-4">
            {time.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* The Omni-Bar (Simplified/Static) */}
        <div className="w-full max-w-2xl relative group z-20 mb-20">
          <form onSubmit={handleInternalSubmit} className="relative">
            {/* Static container without scaling or glows */}
            <div className="relative h-16 w-full bg-orbit-surface/80 backdrop-blur-3xl rounded-full border border-orbit-border flex items-center px-8 gap-5 transition-colors focus-within:bg-orbit-surface">
              <Search size={24} strokeWidth={1.5} className="text-orbit-text-dim" />
              
              <input 
                type="text" 
                placeholder="Search or enter URL..."
                value={localQuery}
                onChange={(e) => setLocalQuery(e.target.value)}
                className="bg-transparent border-none outline-none w-full text-xl text-orbit-text placeholder:text-orbit-text-dim/50 font-medium h-full"
                autoFocus
                spellCheck={false}
              />
              
              <div className="flex items-center gap-3">
                 {isSearching ? (
                   <Loader2 size={20} className="text-orbit-accent animate-spin" />
                 ) : localQuery.length > 0 && (
                   <button className="p-2.5 rounded-full bg-orbit-text text-orbit-bg hover:scale-110 active:scale-95 transition-all text-sm font-bold">
                      <Share2 size={16} strokeWidth={2.5} className="rotate-90" />
                   </button>
                 )}
              </div>
            </div>

            {/* Intelligent Suggestions */}
            <AnimatePresence>
              {aiInsight && localQuery.length >= 4 && (
                <motion.div
                  initial={{ opacity: 0, y: 10, filter: 'blur(10px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, y: 5, filter: 'blur(10px)' }}
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  className="absolute top-full left-4 right-4 mt-6 p-1 bg-orbit-bg/80 backdrop-blur-3xl border border-orbit-border/50 rounded-3xl shadow-2xl overflow-hidden"
                >
                  <div className="p-6 bg-linear-to-b from-white/5 to-transparent rounded-[20px]">
                    <div className="flex gap-4">
                      <div className="mt-1">
                        <Sparkles size={18} className="text-orbit-accent animate-pulse" />
                      </div>
                      <div className="space-y-4 w-full">
                        <p className="text-sm text-orbit-text/90 leading-relaxed font-medium">
                          {aiInsight.fact}
                        </p>
                        
                        {aiInsight.suggestions?.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {aiInsight.suggestions.map((s, i) => (
                              <button
                                key={i}
                                type="button"
                                onClick={() => { setLocalQuery(s); onNavigate(s); }}
                                className="px-4 py-2 rounded-xl bg-orbit-surface hover:bg-orbit-text hover:text-orbit-bg border border-orbit-border hover:border-transparent text-orbit-text text-xs font-semibold tracking-wide transition-all duration-300"
                              >
                                {s}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </form>
        </div>

        {/* Minimalist Shortcuts */}
        <div className="w-full">
          <div className="flex flex-wrap justify-center gap-6">
            <AnimatePresence layout>
              {bookmarks.map((item) => (
                <BookmarkCard 
                  key={item.id}
                  title={item.title}
                  url={item.url}
                  onClick={onNavigate}
                  onDelete={() => handleDeleteBookmark(item.id)}
                  variant="minimal"
                />
              ))}
              <AddBookmarkCard onAdd={handleAddBookmark} variant="minimal" />
            </AnimatePresence>
          </div>
        </div>
      </main>

      {/* Floating Status Bar */}
      <footer className="absolute bottom-8 w-full flex justify-center pointer-events-none">
         <div className="px-6 py-2 rounded-full bg-orbit-surface/50 backdrop-blur-md border border-orbit-border/50 text-[10px] font-bold uppercase tracking-widest text-orbit-text-dim flex items-center gap-4 shadow-sm">
            <span className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]" />
              Connected
            </span>
            <span className="w-px h-3 bg-orbit-border" />
            <span>v2.5.0</span>
         </div>
      </footer>
    </div>
  );
};

export default memo(NewTab);

