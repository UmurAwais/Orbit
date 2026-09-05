import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const TabContextMenu = ({
  menu,
  onClose,
  onNewTabRight,
  onReload,
  onDuplicate,
  onTogglePin,
  onToggleMute,
  onCloseTab,
  onCloseOther,
  onCloseRight,
}) => {
  if (!menu) return null;

  const posX = Math.max(8, Math.min(menu.x, window.innerWidth - 240));
  const posY = Math.max(8, Math.min(menu.y, window.innerHeight - 320));

  return (
    <AnimatePresence>
      {/* Invisible backdrop to dismiss menu on click outside */}
      <div
        className="fixed inset-0 z-[29990] bg-transparent"
        onClick={onClose}
        onContextMenu={(e) => {
          e.preventDefault();
          onClose();
        }}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: -4 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.12, ease: "easeOut" }}
        style={{
          position: "fixed",
          left: posX,
          top: posY,
          zIndex: 30000,
        }}
        onMouseDown={(e) => e.stopPropagation()}
        className="w-60 bg-white/95 dark:bg-[#28282b]/95 border border-black/10 dark:border-white/10 rounded-2xl shadow-[0_16px_40px_rgba(0,0,0,0.25)] p-1.5 backdrop-blur-2xl text-[13px] text-nexus-text flex flex-col font-medium select-none"
      >
        <button
          onClick={() => {
            onClose();
            if (onNewTabRight) onNewTabRight(menu.id);
            else window.orbit.ipcRenderer.send('tab:new-right', menu.id);
          }}
          className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 active:bg-black/10 dark:active:bg-white/15 transition-colors cursor-pointer"
        >
          New tab to the right
        </button>

        <div className="h-px bg-nexus-border/20 my-1 mx-1" />

        <button
          onClick={() => {
            onClose();
            if (onReload) onReload(menu.id);
            else window.orbit.tabs.reload({ id: menu.id });
          }}
          className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 active:bg-black/10 dark:active:bg-white/15 transition-colors cursor-pointer"
        >
          <span>Reload</span>
          <span className="text-nexus-text-dim/60 text-[11px] font-semibold tracking-wider">Ctrl+R</span>
        </button>

        <button
          onClick={() => {
            onClose();
            if (onDuplicate) onDuplicate(menu.id);
            else window.orbit.ipcRenderer.send('tab:duplicate', menu.id);
          }}
          className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 active:bg-black/10 dark:active:bg-white/15 transition-colors cursor-pointer"
        >
          Duplicate
        </button>

        <button
          onClick={() => {
            onClose();
            if (onTogglePin) onTogglePin(menu.id);
            else window.orbit.ipcRenderer.send('tab:toggle-pin', menu.id);
          }}
          className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 active:bg-black/10 dark:active:bg-white/15 transition-colors cursor-pointer"
        >
          {menu.isPinned ? "Unpin tab" : "Pin tab"}
        </button>

        <button
          onClick={() => {
            onClose();
            if (onToggleMute) onToggleMute(menu.id);
            else window.orbit.ipcRenderer.send('tab:mute', menu.id);
          }}
          className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 active:bg-black/10 dark:active:bg-white/15 transition-colors cursor-pointer"
        >
          {menu.isMuted ? "Unmute site" : "Mute site"}
        </button>

        <div className="h-px bg-nexus-border/20 my-1 mx-1" />

        <button
          onClick={() => {
            onClose();
            if (onCloseTab) onCloseTab(menu.id);
            else window.orbit.ipcRenderer.send('tab:close-specific', menu.id);
          }}
          className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 active:bg-black/10 dark:active:bg-white/15 transition-colors cursor-pointer"
        >
          <span>Close</span>
          <span className="text-nexus-text-dim/60 text-[11px] font-semibold tracking-wider">Ctrl+W</span>
        </button>

        <button
          onClick={() => {
            onClose();
            if (onCloseOther) onCloseOther(menu.id);
            else window.orbit.ipcRenderer.send('tab:close-other', menu.id);
          }}
          className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 active:bg-black/10 dark:active:bg-white/15 transition-colors cursor-pointer"
        >
          Close other tabs
        </button>

        <button
          onClick={() => {
            onClose();
            if (onCloseRight) onCloseRight(menu.id);
            else window.orbit.ipcRenderer.send('tab:close-right', menu.id);
          }}
          className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 active:bg-black/10 dark:active:bg-white/15 transition-colors cursor-pointer"
        >
          Close tabs to the right
        </button>
      </motion.div>
    </AnimatePresence>
  );
};

export default TabContextMenu;
