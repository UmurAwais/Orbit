import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';

const TabContextMenu = ({ menu, onClose }) => {
  if (!menu) return null;

  return (
    <div
      style={{
        position: "fixed",
        left: Math.min(menu.x, window.innerWidth - 250),
        top: menu.y,
        zIndex: 30000,
      }}
      onMouseDown={(e) => e.stopPropagation()}
      className="w-64 bg-white/80 dark:bg-[#28282b]/95 border border-black/5 dark:border-white/10 rounded-2xl shadow-[0_20px_40px_rgba(0,0,0,0.25)] p-1.5 backdrop-blur-2xl text-[13px] text-nexus-text flex flex-col font-medium"
    >
      <button 
        onClick={() => { onClose(); window.orbit.ipcRenderer.send('tab:new-right', menu.id); }} 
        className="w-full text-left px-3 py-1.5 rounded-md hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
      >
        New tab to the right
      </button>
      <div className="h-px bg-nexus-border/20 my-1.5 mx-1" />
      <div className="flex px-3 py-1.5 rounded-md hover:bg-black/5 dark:hover:bg-white/10 transition-colors justify-between cursor-pointer" onClick={() => { onClose(); window.orbit.tabs.reload({ id: menu.id }); }}>
        <span>Reload</span>
        <span className="text-nexus-text-dim/70 text-[11px] font-semibold tracking-wider">Ctrl+R</span>
      </div>
      <button 
        onClick={() => { onClose(); window.orbit.ipcRenderer.send('tab:duplicate', menu.id); }} 
        className="w-full text-left px-3 py-1.5 rounded-md hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
      >
        Duplicate
      </button>
      <button 
        onClick={() => { onClose(); window.orbit.ipcRenderer.send('tab:toggle-pin', menu.id); }} 
        className="w-full text-left px-3 py-1.5 rounded-md hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
      >
        {menu.isPinned ? "Unpin tab" : "Pin tab"}
      </button>
      <button 
        onClick={() => { onClose(); window.orbit.ipcRenderer.send('tab:mute', menu.id); }} 
        className="w-full text-left px-3 py-1.5 rounded-md hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
      >
        Mute site
      </button>
      <div className="h-px bg-nexus-border/20 my-1.5 mx-1" />
      <div className="flex px-3 py-1.5 rounded-md hover:bg-black/5 dark:hover:bg-white/10 transition-colors justify-between cursor-pointer" onClick={() => { onClose(); window.orbit.ipcRenderer.send('tab:close-specific', menu.id); }}>
        <span>Close</span>
        <span className="text-nexus-text-dim/70 text-[11px] font-semibold tracking-wider">Ctrl+W</span>
      </div>
      <button 
        onClick={() => { onClose(); window.orbit.ipcRenderer.send('tab:close-other', menu.id); }} 
        className="w-full text-left px-3 py-1.5 rounded-md hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
      >
        Close other tabs
      </button>
      <button 
        onClick={() => { onClose(); window.orbit.ipcRenderer.send('tab:close-right', menu.id); }} 
        className="w-full text-left px-3 py-1.5 rounded-md hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
      >
        Close tabs to the right
      </button>
    </div>
  );
};

export default TabContextMenu;
