import React, { memo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Globe, Terminal, Cpu, Github, Youtube, MessageSquare, Zap, ExternalLink, LayoutGrid } from 'lucide-react';
import OrbitLogo from './OrbitLogo';

const BentoCard = ({ children, className, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay }}
    className={`bg-white/60 backdrop-blur-xl border border-white/40 rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:shadow-blue-200/40 transition-all duration-500 overflow-hidden ${className}`}
  >
    {children}
  </motion.div>
);

const QuickLink = ({ icon: Icon, title, url, color, onClick }) => (
  <div 
    onClick={() => onClick(url)}
    className="flex flex-col items-center gap-3 transition-transform hover:scale-110 cursor-pointer group"
  >
    <div className={`w-16 h-16 rounded-2xl ${color} flex items-center justify-center text-white shadow-lg shadow-inherit transition-all`}>
      <Icon size={28} />
    </div>
    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{title}</span>
  </div>
);

const Dashboard = ({ onNavigate }) => {
  const [query, setQuery] = useState('');
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) onNavigate(query);
  };

  const devPorts = [3000, 5173, 8080];

  return (
    <div className="h-full w-full bg-[#f8fafc] p-10 overflow-y-auto custom-scrollbar relative">
      {/* Abstract Background Elements */}
      <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] bg-blue-400/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[30%] h-[50%] bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-7xl mx-auto grid grid-cols-12 gap-8 pb-10">
        
        {/* Main Search Bento */}
        <BentoCard className="col-span-12 lg:col-span-8 aspect-video lg:aspect-auto min-h-100 flex flex-col justify-center items-center relative overflow-hidden bg-linear-to-br from-white/80 to-blue-50/50">
          <div className="absolute top-0 right-0 p-8 opacity-5">
             <OrbitLogo size={300} />
          </div>
          <form onSubmit={handleSearch} className="w-full max-w-xl relative group z-10 px-4">
            <div className="flex justify-center mb-8">
               <OrbitLogo size={80} />
            </div>
            <h2 className="text-4xl font-black text-slate-900 mb-8 tracking-tighter text-center">Orbiting the Universe<span className="text-blue-600">.</span></h2>
            <div className="relative">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={24} />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Where to next?"
                className="w-full h-20 bg-white/90 border-2 border-slate-100/50 rounded-4xl pl-16 pr-8 text-xl font-bold text-slate-800 shadow-2xl shadow-blue-200/20 focus:outline-none focus:border-blue-400 focus:ring-8 focus:ring-blue-100/50 transition-all placeholder:text-slate-300"
              />
            </div>
          </form>
        </BentoCard>

        {/* MERN Dev Widget */}
        <BentoCard className="col-span-12 lg:col-span-4 flex flex-col gap-6" delay={0.1}>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-100 text-emerald-600 rounded-2xl">
              <Terminal size={24} />
            </div>
            <div>
              <h3 className="font-black text-slate-900 leading-none">Dev Console</h3>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Local Services</p>
            </div>
          </div>
          <div className="flex flex-col gap-3">
            {devPorts.map(port => (
              <div 
                key={port} 
                onClick={() => onNavigate(`http://localhost:${port}`)}
                className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-emerald-400 hover:bg-emerald-50 transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="font-mono text-sm font-bold text-slate-700">localhost:{port}</span>
                </div>
                <ExternalLink size={14} className="text-slate-300 group-hover:text-emerald-600" />
              </div>
            ))}
          </div>
          <div className="mt-auto p-4 bg-slate-900 rounded-2xl text-slate-400 font-mono text-xs overflow-hidden h-32">
             <p className="text-emerald-400">$ orbit sync --active</p>
             <p className="opacity-50 mt-1">&gt; Ready to develop</p>
             <p className="opacity-30 mt-1">&gt; Listening on ports...</p>
             <p className="opacity-20 mt-1">&gt; Gpu acceleration: enabled</p>
          </div>
        </BentoCard>

        {/* Top Sites Bento */}
        <BentoCard className="col-span-12 lg:col-span-7 flex flex-col gap-8" delay={0.2}>
          <div className="flex items-center justify-between">
             <div className="flex items-center gap-3">
                <LayoutGrid size={24} className="text-blue-600" />
                <h3 className="font-black text-slate-900 tracking-tighter">Your Launchpad</h3>
             </div>
             <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 px-3 py-1 rounded-full border border-blue-100">Frequently Visited</span>
          </div>
          <div className="grid grid-cols-4 gap-4">
            <QuickLink icon={Github} title="GitHub" url="https://github.com" color="bg-slate-900 shadow-slate-200" onClick={onNavigate} />
            <QuickLink icon={Youtube} title="YouTube" url="https://youtube.com" color="bg-red-600 shadow-red-200" onClick={onNavigate} />
            <QuickLink icon={MessageSquare} title="Discord" url="https://discord.com" color="bg-indigo-600 shadow-indigo-200" onClick={onNavigate} />
            <QuickLink icon={Zap} title="ChatGPT" url="https://chat.openai.com" color="bg-teal-600 shadow-teal-200" onClick={onNavigate} />
          </div>
        </BentoCard>

        {/* Resource Monitor */}
        <BentoCard className="col-span-12 lg:col-span-5 flex flex-col justify-between p-8" delay={0.3}>
           <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                 <div className="p-3 bg-blue-100 text-blue-600 rounded-2xl">
                    <Cpu size={24} />
                 </div>
                 <h3 className="font-black text-slate-900 leading-none">Resource Monitor</h3>
              </div>
              <div className="text-right">
                <p className="text-2xl font-black text-slate-900">420MB</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Engine Usage</p>
              </div>
           </div>
           <div>
              <div className="flex justify-between mb-2">
                 <span className="text-[10px] font-bold text-slate-400 uppercase">Available Buffer</span>
                 <span className="text-[10px] font-bold text-blue-600 uppercase">65% Capacity</span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                 <motion.div 
                   initial={{ width: 0 }}
                   animate={{ width: "65%" }}
                   transition={{ duration: 1, delay: 0.5 }}
                   className="h-full bg-blue-500 rounded-full" 
                 />
              </div>
           </div>
           <div className="text-xs font-bold text-slate-500 italic flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
              "Peak performance mode active."
           </div>
        </BentoCard>

        {/* Clock/Time Bento */}
        <BentoCard className="col-span-12 bg-[#0B1120] text-white flex flex-col items-center justify-center py-16 relative shadow-2xl shadow-slate-900/20" delay={0.4}>
          <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/20 via-transparent to-indigo-600/10 pointer-events-none" />
          <motion.h1 
            key={time.toLocaleTimeString()}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-8xl font-black tracking-tighter z-10"
          >
            {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </motion.h1>
          <div className="flex items-center gap-3 z-10 mt-4">
             <div className="h-px w-8 bg-blue-500/50" />
             <p className="text-blue-400 font-bold uppercase tracking-[0.4em] text-[10px]">Station Time</p>
             <div className="h-px w-8 bg-blue-500/50" />
          </div>
        </BentoCard>

      </div>
    </div>
  );
};

export default memo(Dashboard);
