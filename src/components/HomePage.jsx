import React, { memo } from 'react';
import { Search, Globe, Clock, Star, LayoutGrid, Plus } from 'lucide-react';
import { motion } from 'framer-motion';

const QuickLink = ({ icon: Icon, title, url, color }) => (
  <motion.button
    whileHover={{ y: -5, backgroundColor: 'rgba(255,255,255,0.8)' }}
    className="flex flex-col items-center gap-3 p-4 rounded-3xl transition-all duration-300 w-24 group"
  >
    <div className={`w-14 h-14 rounded-2xl ${color} flex items-center justify-center text-white shadow-lg group-hover:shadow-xl transition-all`}>
      <Icon size={24} />
    </div>
    <span className="text-xs font-semibold text-slate-600 truncate w-full text-center">{title}</span>
  </motion.button>
);

const HomePage = ({ onNavigate }) => {
  const [query, setQuery] = React.useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) onNavigate(query);
  };

  const quickLinks = [
    { icon: Globe, title: 'Google', url: 'https://google.com', color: 'bg-blue-500' },
    { icon: Globe, title: 'YouTube', url: 'https://youtube.com', color: 'bg-red-500' },
    { icon: Globe, title: 'GitHub', url: 'https://github.com', color: 'bg-slate-800' },
    { icon: Globe, title: 'Twitter', url: 'https://twitter.com', color: 'bg-sky-400' },
    { icon: Star, title: 'ChatGPT', url: 'https://chat.openai.com', color: 'bg-emerald-600' },
    { icon: LayoutGrid, title: 'Add Link', url: '#', color: 'bg-slate-200 !text-slate-400' },
  ];

  return (
    <div className="h-full w-full bg-gradient-to-b from-[#FDFDFF] to-[#F1F4F9] flex flex-col items-center justify-center p-8 overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-2xl flex flex-col items-center"
      >
        {/* Logo */}
        <div className="flex flex-col items-center gap-4 mb-12">
          <div className="w-20 h-20 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-[28px] flex items-center justify-center shadow-2xl shadow-blue-200">
            <Globe size={40} className="text-white" strokeWidth={2} />
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">
            Orbit<span className="text-blue-600">.</span>
          </h1>
          <p className="text-slate-400 font-medium">Your gateway to the universe of web.</p>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="w-full relative group mb-16">
          <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
            <Search size={20} />
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search with Google or type a URL"
            className="w-full h-16 bg-white border border-slate-200 rounded-3xl pl-16 pr-6 text-lg font-medium text-slate-800 shadow-sm focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50/50 transition-all placeholder:text-slate-300"
          />
        </form>

        {/* Quick Links Grid */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 w-full max-w-xl justify-center">
          {quickLinks.map((link, idx) => (
            <QuickLink key={idx} {...link} />
          ))}
        </div>

        {/* Footer Info */}
        <div className="mt-20 flex gap-8 text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em]">
          <span className="flex items-center gap-2 hover:text-slate-600 cursor-pointer transition-colors"><Clock size={14} /> History</span>
          <span className="flex items-center gap-2 hover:text-slate-600 cursor-pointer transition-colors"><Star size={14} /> Bookmarks</span>
          <span className="flex items-center gap-2 hover:text-slate-600 cursor-pointer transition-colors"><LayoutGrid size={14} /> Customise</span>
        </div>
      </motion.div>
    </div>
  );
};

export default memo(HomePage);
