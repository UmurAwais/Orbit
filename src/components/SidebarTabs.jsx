import React, { memo } from 'react';
import { Plus, X, Globe } from 'lucide-react';
import OrbitLogo from './OrbitLogo';

const SidebarTabs = ({
  tabs,
  activeTabId,
  onSelectTab,
  onCloseTab,
  onAddTab
}) => {
  return (
    <div className="sidebar-tabs no-drag">
      <div className="mb-4 drag-area p-1">
        <OrbitLogo size={32} variant="icon" />
      </div>

      <div className="flex-1 flex flex-col items-center gap-3 overflow-y-auto custom-scrollbar-hide w-full px-2">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            onClick={() => onSelectTab(tab.id)}
            className={`tab-square group relative ${tab.id === activeTabId ? 'active' : ''}`}
            title={tab.title}
          >
            {tab.favicon ? (
              <img src={tab.favicon} className="w-4 h-4 object-contain" alt="" />
            ) : (
              <Globe size={14} className="text-black/50" />
            )}
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                onCloseTab(tab.id);
              }}
              className="absolute inset-0 bg-white/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
            >
              <X size={12} className="text-black" />
            </button>
          </div>
        ))}

        <button
          onClick={onAddTab}
          className="tab-square border-dashed border-black/20 hover:border-black/40 hover:bg-black/5"
        >
          <Plus size={14} className="text-black/60" />
        </button>

        <div className="w-8 h-px bg-black/5 my-2" />

        <button
          onClick={() => window.orbit.ipcRenderer.send('ui:toggle-overview')}
          className="tab-square text-black/50 hover:text-black"
        >
          <div className="grid grid-cols-2 gap-0.5">
            <div className="w-1.5 h-1.5 bg-current rounded-[1px]" />
            <div className="w-1.5 h-1.5 bg-current rounded-[1px]" />
            <div className="w-1.5 h-1.5 bg-current rounded-[1px]" />
            <div className="w-1.5 h-1.5 bg-current rounded-[1px]" />
          </div>
        </button>
      </div>

      <div className="mt-auto p-4 flex flex-col items-center gap-4 text-black/20">
        <div className="w-1 h-1 rounded-full bg-green-500 animate-pulse" />
      </div>
    </div>
  );
};

export default memo(SidebarTabs);
