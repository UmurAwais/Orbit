import React from 'react';
import { motion } from 'framer-motion';
import { 
  History, 
  Settings, 
  Bell, 
  User,
  Search,
  LayoutGrid,
  ChevronRight,
  Puzzle
} from 'lucide-react';

const DashboardHeader = ({ onNavigate }) => {
  return (
    <header className="w-full h-20 flex items-center justify-between px-12 z-50">
      {/* Precision Breadcrumb & Version */}
      <div className="flex items-center gap-4 select-none">
        <div className="flex items-center gap-3 group cursor-pointer" onClick={() => onNavigate && onNavigate('about:blank')}>
          <img src="/assets/orbit.png" alt="Orbit" className="w-9 h-9 rounded-2xl bg-orbit-text flex items-center justify-center text-orbit-bg transition-all group-hover:bg-orbit-accent shadow-lg shadow-black/5" />
          <div className="flex flex-col">
            <span className="text-[14px] font-extrabold tracking-tight text-orbit-text leading-none">Orbit</span>
            <span className="text-[9px] font-bold text-orbit-text-dim uppercase tracking-[0.15em] mt-1">Beyond the Horizon</span>
          </div>
        </div>
        
        <div className="h-5 w-px bg-orbit-border" />
        
        {/* Version Badge */}
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-orbit-card border border-orbit-border">
          <Zap size={10} className="text-orbit-accent fill-orbit-accent" />
          <span className="text-[10px] font-bold text-orbit-text-dim tracking-wider">v2.5.0</span>
        </div>
      </div>

      {/* Dynamic Control Pod - Matched to Search Bar Height (h-14) */}
      <div className="h-12 flex items-center bg-orbit-surface/80 backdrop-blur-3xl border border-orbit-border rounded-2xl px-2 shadow-[0_12px_40px_rgba(0,0,0,0.04)] ring-1 ring-orbit-border/50">
        {/* Prominent Utilities - Fixed Hover BG */}
        <div className="flex items-center gap-1 pr-2 pl-1">
          <button className="w-10 h-10 rounded-full flex items-center justify-center text-orbit-text opacity-70 hover:opacity-100 hover:bg-orbit-card transition-all duration-300 cursor-pointer group" title="Search">
            <Search size={18} strokeWidth={1.8} />
          </button>
          <button className="w-10 h-10 rounded-full flex items-center justify-center text-orbit-text opacity-70 hover:opacity-100 hover:bg-orbit-card transition-all duration-300 cursor-pointer group" title="History">
            <History size={18} strokeWidth={1.8} />
          </button>
          <button className="w-10 h-10 rounded-full flex items-center justify-center text-orbit-text opacity-70 hover:opacity-100 hover:bg-orbit-card transition-all duration-300 cursor-pointer relative group" title="Alerts">
            <Bell size={18} strokeWidth={1.8} />
            <div className="absolute top-2.5 right-2.5 w-2 h-2 bg-orbit-accent rounded-full border-2 border-orbit-bg shadow-sm" />
          </button>
          <button 
            className="w-10 h-10 rounded-full flex items-center justify-center text-orbit-text opacity-70 hover:opacity-100 hover:bg-orbit-card transition-all duration-300 cursor-pointer group" 
            title="Extensions"
            onClick={() => onNavigate && onNavigate('orbit://extensions')}
          >
            <Puzzle size={18} strokeWidth={1.8} />
          </button>
          <button 
            className="w-10 h-10 rounded-full flex items-center justify-center text-orbit-text opacity-70 hover:opacity-100 hover:bg-orbit-card transition-all duration-300 cursor-pointer group" 
            title="Settings"
            onClick={() => onNavigate && onNavigate('orbit://settings')}
          >
            <Settings size={18} strokeWidth={1.8} />
          </button>
        </div>

        <div className="w-px h-6 bg-orbit-border mx-1" />

        {/* User Identity */}
        <button className="flex items-center gap-3 pl-2 pr-4 rounded-xl transition-all group cursor-pointer">
          <div className="relative">
            <div className="w-8 h-8 rounded-xl bg-orbit-text flex items-center justify-center text-orbit-bg shadow-md shadow-black/10 transition-all duration-500">
              <User size={18} strokeWidth={2} />
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-[#34A853] border-2 border-orbit-bg shadow-sm" />
          </div>
          <div className="flex flex-col items-start leading-none gap-1">
            <span className="text-[13px] font-bold text-orbit-text transition-colors">Personal</span>
            <span className="text-[8px] font-black uppercase tracking-widest text-orbit-text-dim">Active</span>
          </div>
        </button>

      </div>
    </header>
  );
};

export default DashboardHeader;
