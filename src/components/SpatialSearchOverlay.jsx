import React, { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { 
  Sparkles, 
  Search, 
  X,
  ExternalLink,
  Bookmark,
  Clock
} from 'lucide-react';
import OrbitLogo from './OrbitLogo';

const SmartCard = memo(({ title, snippet, url, onOpen }) => {
  let hostname = 'unknown';
  try {
    hostname = new URL(url).hostname;
  } catch (e) {}

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, scale: 1.01 }}
      className="bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[2rem] p-6 hover:bg-white/10 transition-all duration-500 group"
    >
      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-[#635BFF]" />
          <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-white/30">Verified Insight</span>
        </div>
        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button className="p-2 rounded-xl bg-white/5 hover:bg-[#635BFF]/20 text-[#635BFF] transition-all"><Bookmark size={14} /></button>
          <button className="p-2 rounded-xl bg-white/5 hover:bg-[#635BFF]/20 text-[#635BFF] transition-all"><Clock size={14} /></button>
        </div>
      </div>
      
      <button 
        onClick={() => onOpen(url)}
        className="text-left block w-full"
      >
        <h3 className="text-[18px] font-bold text-[#635BFF] mb-3 leading-tight tracking-tight group-hover:underline transition-all">
          {title}
        </h3>
        <p className="text-[14px] font-light text-white/60 leading-relaxed line-clamp-3">
          {snippet}
        </p>
      </button>
      
      <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between">
        <span className="text-[11px] text-white/20 font-medium truncate max-w-[200px]">{hostname}</span>
        <ExternalLink size={12} className="text-white/10 group-hover:text-[#635BFF] transition-colors" />
      </div>
    </motion.div>
  );
});

const SpatialSearchOverlay = ({ isOpen, query, onClose, onNavigate }) => {
  if (!isOpen) return null;

  const mockResults = [
    {
      title: "Explaining Spatial UI Architecture in 2026",
      snippet: "Spatial computing is redefining how we interact with digital surfaces. By moving beyond traditional windows, we create immersive 'glass panes' that follow user intent rather than rigid grids.",
      url: "https://orbit-docs.ai/spatial-arch"
    },
    {
      title: "The Rise of Agentic Browser Engines",
      snippet: "Next-generation browser engines are shifting from passive rendering to active goal fulfillment. Orbit leads this change with its native search mesh and liquid glass design language.",
      url: "https://tech-future.net/agentic-browsers"
    },
    {
      title: "Design Principles for Liquid Glass Interfaces",
      snippet: "Achieving the perfect balance of translucency and legibility requires multiple layers of Gaussian blur and precise border illumination. This prevents 'UI soup' in complex overlays.",
      url: "https://minimal-design.io/liquid-glass"
    }
  ];

  return createPortal(
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[2000] flex items-center justify-center pointer-events-none"
    >
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto"
        onClick={onClose}
      />

      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        className="relative w-[90%] h-[90%] bg-black/30 backdrop-blur-3xl border border-white/10 rounded-[3rem] shadow-[0_40px_100px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden pointer-events-auto"
      >
        <div className="flex justify-center pt-8 pb-4 px-12 shrink-0">
          <div className="w-full max-w-2xl bg-white/10 backdrop-blur-2xl border border-white/10 h-14 rounded-2xl flex items-center px-6 gap-4">
            <OrbitLogo size={24} variant="icon" />
            <span className="flex-1 text-lg font-medium text-white/50">{query}</span>
            <button 
              onClick={onClose}
              className="p-1 rounded-full hover:bg-white/10 text-white/40 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar-hide px-12 pb-12">
          <div className="max-w-6xl mx-auto py-8">
            <div className="flex items-center gap-4 mb-12">
              <div className="p-4 rounded-[2rem] bg-[#635BFF]/10 border border-[#635BFF]/20">
                <Sparkles size={32} className="text-[#635BFF]" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-white tracking-tight mb-1">Spatial Results</h1>
                <p className="text-white/30 font-medium tracking-widest uppercase text-[11px]">Orbit Engine // AI Curation</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {mockResults.map((result, i) => (
                <SmartCard 
                  key={i} 
                  {...result} 
                  onOpen={(url) => {
                    onNavigate(url);
                    onClose();
                  }}
                />
              ))}
              
              <div className="bg-white/2 border border-dashed border-white/5 rounded-[2rem] flex flex-col items-center justify-center p-8 opacity-40 hover:opacity-100 transition-opacity cursor-pointer">
                <Search size={32} className="text-white mb-4" />
                <span className="text-[13px] font-bold text-white uppercase tracking-widest">Load More Perspectives</span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-8 flex justify-center border-t border-white/5">
           <span className="text-[11px] font-bold text-white/10 tracking-[0.5em] uppercase">Architecture // Spatial // Orbit</span>
        </div>
      </motion.div>
    </motion.div>,
    document.body
  );
};

export default memo(SpatialSearchOverlay);
