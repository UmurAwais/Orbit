import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Download, 
  Search, 
  X, 
  Folder, 
  File, 
  Trash2, 
  ExternalLink,
  ChevronRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  MoreVertical,
  ArrowDownToLine,
  Filter
} from 'lucide-react';

const DownloadsPage = ({ onClose }) => {
  const [downloads, setDownloads] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all'); // all, completed, in-progress

  useEffect(() => {
    // Initial load
    window.orbit.downloads.list().then(setDownloads);

    // Dynamic listeners
    const unsubStarted = window.orbit.downloads.onStarted((item) => {
      setDownloads(prev => [item, ...prev]);
    });

    const unsubUpdated = window.orbit.downloads.onUpdated((updatedItem) => {
      setDownloads(prev => prev.map(item => item.id === updatedItem.id ? updatedItem : item));
    });

    const unsubList = window.orbit.downloads.onListUpdated((newList) => {
      setDownloads(newList);
    });

    return () => {
      unsubStarted();
      unsubUpdated();
      unsubList();
    };
  }, []);

  const formatSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (timestamp) => {
    const d = new Date(timestamp);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const filteredDownloads = downloads.filter(item => {
    const matchesSearch = item.filename.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = 
      filter === 'all' || 
      (filter === 'completed' && item.state === 'completed') ||
      (filter === 'in-progress' && item.state === 'progressing');
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="w-full h-full bg-orbit-bg flex flex-col font-sans select-none overflow-hidden text-orbit-text">
      {/* Premium Header */}
      <header className="w-full h-16 border-b border-orbit-border flex items-center shrink-0 z-10 bg-orbit-bg/80 backdrop-blur-xl px-12">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-2xl bg-orbit-accent flex items-center justify-center text-white shadow-lg shadow-orbit-accent/20">
            <Download size={20} strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight leading-none">Downloads</h1>
            <p className="text-[11px] font-bold text-orbit-text-dim uppercase tracking-widest mt-1">Files & Media Library</p>
          </div>
        </div>

        <div className="flex-1 max-w-xl mx-auto px-8">
          <div className="relative group">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-orbit-text-dim group-focus-within:text-orbit-accent transition-colors" />
            <input 
              type="text"
              placeholder="Search downloads history"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-11 bg-orbit-surface border border-transparent rounded-2xl pl-12 pr-4 text-[13.5px] font-medium outline-none focus:bg-orbit-bg focus:border-orbit-accent/30 focus:shadow-xl transition-all"
            />
          </div>
        </div>

        <button 
          onClick={onClose}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-orbit-card text-orbit-text-dim hover:text-orbit-text transition-all"
        >
          <X size={20} />
        </button>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Filters */}
        <aside className="w-64 border-r border-orbit-border bg-orbit-surface/30 p-6 flex flex-col gap-1">
          <button 
            onClick={() => setFilter('all')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-[13.5px] font-bold transition-all ${filter === 'all' ? 'bg-orbit-accent text-white shadow-lg shadow-orbit-accent/20' : 'text-orbit-text-dim hover:bg-orbit-card hover:text-orbit-text'}`}
          >
            <Clock size={16} />
            All Downloads
          </button>
          <button 
            onClick={() => setFilter('completed')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-[13.5px] font-bold transition-all ${filter === 'completed' ? 'bg-orbit-accent text-white shadow-lg shadow-orbit-accent/20' : 'text-orbit-text-dim hover:bg-orbit-card hover:text-orbit-text'}`}
          >
            <CheckCircle2 size={16} />
            Completed
          </button>
          <button 
            onClick={() => setFilter('in-progress')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-[13.5px] font-bold transition-all ${filter === 'in-progress' ? 'bg-orbit-accent text-white shadow-lg shadow-orbit-accent/20' : 'text-orbit-text-dim hover:bg-orbit-card hover:text-orbit-text'}`}
          >
            <ArrowDownToLine size={16} />
            In Progress
          </button>
        </aside>

        {/* Downloads List */}
        <main className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-orbit-bg">
          <div className="max-w-4xl mx-auto space-y-4 pb-20">
            {filteredDownloads.length === 0 ? (
              <div className="py-40 flex flex-col items-center justify-center text-orbit-text-dim opacity-30 gap-4">
                <Download size={64} strokeWidth={1} />
                <h3 className="text-xl font-bold uppercase tracking-[0.2em]">No downloads found</h3>
              </div>
            ) : (
              filteredDownloads.map((item, idx) => (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  key={item.id}
                  className="group bg-orbit-card hover:bg-orbit-bg border border-orbit-border hover:border-orbit-accent/30 p-5 rounded-3xl transition-all hover:shadow-2xl hover:shadow-black/5"
                >
                  <div className="flex items-center gap-6">
                    <div className="w-14 h-14 rounded-2xl bg-orbit-bg border border-orbit-border flex items-center justify-center text-orbit-text group-hover:scale-105 transition-transform shadow-sm">
                      {item.state === 'completed' ? <File size={24} strokeWidth={1.5} /> : <Download size={24} strokeWidth={1.5} className="animate-pulse text-orbit-accent" />}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 
                            className={`text-[15px] font-bold truncate leading-none transition-colors ${item.state === 'completed' ? 'text-orbit-text group-hover:text-orbit-accent cursor-pointer' : 'text-orbit-text'}`}
                            onClick={() => item.state === 'completed' && window.orbit.downloads.openFile(item.id)}
                          >
                            {item.filename}
                          </h3>
                          <div className="flex items-center gap-3 mt-2">
                            <span className="text-[12px] font-medium text-orbit-text-dim">
                              {item.totalBytes > 0 ? formatSize(item.totalBytes) : formatSize(item.receivedBytes)}
                            </span>
                            <span className="w-1 h-1 rounded-full bg-orbit-border" />
                            <span className="text-[12px] font-medium text-orbit-text-dim">
                              {formatDate(item.startTime)}
                            </span>
                            {item.state !== 'progressing' && (
                              <>
                                <span className="w-1 h-1 rounded-full bg-orbit-border" />
                                <span className={`text-[11px] font-black uppercase tracking-widest ${item.state === 'completed' ? 'text-green-500' : 'text-red-500'}`}>
                                  {item.state}
                                </span>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                          <button 
                            onClick={() => window.orbit.downloads.showInFolder(item.id)}
                            className="p-2.5 rounded-xl bg-orbit-surface border border-orbit-border hover:bg-orbit-accent hover:text-white transition-all text-orbit-text-dim"
                            title="Show in Folder"
                          >
                            <Folder size={16} />
                          </button>
                          <button 
                            onClick={() => window.orbit.downloads.remove(item.id)}
                            className="p-2.5 rounded-xl bg-orbit-surface border border-orbit-border hover:bg-red-500 hover:text-white transition-all text-orbit-text-dim"
                            title="Delete from history"
                          >
                            <Trash2 size={16} />
                          </button>
                          <button className="p-2.5 rounded-xl bg-orbit-surface border border-orbit-border hover:bg-orbit-card transition-all text-orbit-text-dim">
                             <MoreVertical size={16} />
                          </button>
                        </div>
                      </div>

                      {item.state === 'progressing' && (
                        <div className="mt-4">
                          <div className="flex items-center justify-between text-[11px] font-bold text-orbit-text-dim mb-1.5 uppercase tracking-wider">
                            <span>{item.percentage}% Downloading</span>
                            <span>{formatSize(item.receivedBytes)} / {formatSize(item.totalBytes)}</span>
                          </div>
                          <div className="h-2 w-full bg-orbit-surface rounded-full overflow-hidden relative border border-orbit-border/50">
                            {item.totalBytes > 0 ? (
                               <motion.div 
                                 initial={{ width: 0 }}
                                 animate={{ width: `${item.percentage}%` }}
                                 className="h-full bg-orbit-accent shadow-[0_0_12px_rgba(var(--orbit-accent-rgb),0.5)]"
                               />
                            ) : (
                               <motion.div 
                                 initial={{ x: '-100%' }}
                                 animate={{ x: '100%' }}
                                 transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
                                 className="absolute inset-y-0 w-1/3 bg-orbit-accent"
                               />
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default DownloadsPage;
