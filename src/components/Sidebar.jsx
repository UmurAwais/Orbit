import React, { memo } from 'react';
import { Plus, X, Globe, Library, Settings, Star, History, Download, Bookmark } from 'lucide-react';
import OrbitLogo from './OrbitLogo';

const TabItem = memo(({ tab, isActive, onSelect, onClose }) => {
  return (
    <div
      onClick={() => onSelect(tab.id)}
      className={`
        group relative flex items-center gap-2.5 px-3 py-2 mx-2 my-0.5 rounded-lg cursor-pointer
        ${isActive 
          ? 'bg-blue-600/10 text-blue-700 shadow-sm' 
          : 'text-slate-600 hover:bg-slate-200/60 hover:text-slate-900'
        }
      `}
    >
      <div className={`
        shrink-0 w-6 h-6 flex items-center justify-center rounded-md
        ${isActive ? 'bg-blue-600 text-white shadow-md shadow-blue-200' : 'bg-slate-100 text-slate-400'}
        overflow-hidden
      `}>
        {tab.favicon ? (
          <img src={tab.favicon} className="w-full h-full object-cover" alt="" />
        ) : (
          <Globe size={13} strokeWidth={2.5} />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className={`text-[13px] font-medium truncate ${isActive ? 'translate-x-0.5' : ''}`}>
          {tab.title || tab.url || 'New Tab'}
        </p>
      </div>

      <button
        onClick={(e) => {
          e.stopPropagation();
          onClose(tab.id);
        }}
        className="
          opacity-0 group-hover:opacity-100 p-1 rounded-md
          hover:bg-slate-300/50 text-slate-400 hover:text-slate-600
          scale-90
        "
      >
        <X size={12} strokeWidth={3} />
      </button>
    </div>
  );
});

const Sidebar = ({ tabs, activeTabId, onSelectTab, onAddTab, onCloseTab }) => {
  return (
    <div className="w-60 h-full flex flex-col glass-sidebar">
      {/* Chrome/Edge Style Hybrid Header */}
      <div className="p-4 flex items-center justify-between drag">
        <div className="flex items-center gap-2 no-drag">
          <OrbitLogo size={32} />
          <div className="flex flex-col -gap-1 ml-1">
            <span className="font-extrabold text-sm tracking-tight text-slate-900 leading-tight uppercase">Orbit</span>
            <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Browser</span>
          </div>
        </div>
        <button 
          onClick={onAddTab}
          className="p-2 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-blue-600 hover:border-blue-200 hover:shadow-sm no-drag"
          title="New Tab"
        >
          <Plus size={16} strokeWidth={2.5} />
        </button>
      </div>

      {/* Firefox Density Tabs List */}
      <div className="flex-1 overflow-y-auto py-2 no-drag custom-scrollbar">
        <div className="px-4 mb-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Active Now</span>
        </div>
        {tabs.map((tab) => (
          <TabItem
            key={tab.id}
            tab={tab}
            isActive={tab.id === activeTabId}
            onSelect={onSelectTab}
            onClose={onCloseTab}
          />
        ))}
      </div>

      {/* Quick Access Grid (Edge Style) */}
      <div className="p-3 mt-auto bg-slate-50/50 border-t border-slate-200/50 no-drag grid grid-cols-4 gap-1">
        <button className="p-2 text-slate-500 hover:bg-white hover:text-blue-600 rounded-lg" title="Bookmarks"><Bookmark size={18} /></button>
        <button className="p-2 text-slate-500 hover:bg-white hover:text-blue-600 rounded-lg" title="History"><History size={18} /></button>
        <button className="p-2 text-slate-500 hover:bg-white hover:text-blue-600 rounded-lg" title="Downloads"><Download size={18} /></button>
        <button className="p-2 text-slate-500 hover:bg-white hover:text-blue-600 rounded-lg" title="Settings"><Settings size={18} /></button>
      </div>
    </div>
  );
};

export default memo(Sidebar);
