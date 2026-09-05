import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Puzzle, 
  ExternalLink, 
  Trash2, 
  Settings, 
  ShieldCheck, 
  Download,
  Search,
  Plus
} from 'lucide-react';

const ExtensionsManager = ({ onNavigate }) => {
  const [activeTab, setActiveTab] = useState('installed');
  
  const installedExtensions = [
    {
      id: '1',
      name: 'Orbit Dark Mode Pro',
      version: '1.2.0',
      description: 'Advanced dark mode for every website with customizable contrast.',
      icon: '🌙',
      enabled: true,
      author: 'Orbit Team'
    },
    {
      id: '2',
      name: 'AdBlock Ultimate',
      version: '4.5.1',
      description: 'Remove all intrusive ads and trackers for a cleaner browsing experience.',
      icon: '🛡️',
      enabled: true,
      author: 'Security First'
    }
  ];

  const stores = [
    {
      name: 'Chrome Web Store',
      url: 'https://chrome.google.com/webstore',
      description: 'Access millions of extensions from the worlds largest library.',
      color: 'bg-blue-500'
    },
    {
      name: 'Edge Add-ons',
      url: 'https://microsoftedge.microsoft.com/addons',
      description: 'Premium extensions curated for the modern web.',
      color: 'bg-emerald-500'
    }
  ];

  return (
    <div className="w-full h-full bg-orbit-bg text-orbit-text flex flex-col p-12 overflow-y-auto">
      <div className="max-w-5xl mx-auto w-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-12">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-orbit-text mb-2 flex items-center gap-3">
              <Puzzle className="text-orbit-accent" size={32} />
              Extensions
            </h1>
            <p className="text-orbit-text-dim font-medium">Manage your browser enhancements and productivity tools.</p>
          </div>
          
          <div className="flex bg-orbit-surface p-1 rounded-2xl border border-orbit-border">
            <button 
              onClick={() => setActiveTab('installed')}
              className={`px-6 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer ${activeTab === 'installed' ? 'bg-orbit-bg shadow-sm text-orbit-text' : 'text-orbit-text-dim hover:text-orbit-text'}`}
            >
              Installed
            </button>
            <button 
              onClick={() => setActiveTab('discover')}
              className={`px-6 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer ${activeTab === 'discover' ? 'bg-orbit-bg shadow-sm text-orbit-text' : 'text-orbit-text-dim hover:text-orbit-text'}`}
            >
              Discover
            </button>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'installed' ? (
            <motion.div 
              key="installed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              {installedExtensions.map(ext => (
                <div key={ext.id} className="group p-6 bg-orbit-surface border border-orbit-border rounded-3xl shadow-sm hover:shadow-xl hover:border-orbit-accent/30 transition-all duration-500">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-orbit-card flex items-center justify-center text-3xl border border-orbit-border">
                        {ext.icon}
                      </div>
                      <div>
                        <h3 className="font-bold text-orbit-text text-lg leading-tight">{ext.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] font-black uppercase text-orbit-text-dim tracking-widest">{ext.version}</span>
                          <span className="w-1 h-1 rounded-full bg-orbit-border" />
                          <span className="text-[10px] font-bold text-orbit-accent">By {ext.author}</span>
                        </div>
                      </div>
                    </div>
                    <div className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" checked={ext.enabled} className="sr-only peer" readOnly />
                      <div className="w-11 h-6 bg-orbit-card border border-orbit-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orbit-accent peer-checked:border-orbit-accent"></div>
                    </div>
                  </div>
                  
                  <p className="text-orbit-text-dim text-sm leading-relaxed mb-6">
                    {ext.description}
                  </p>
                  
                  <div className="flex items-center justify-between pt-4 border-t border-orbit-border">
                    <div className="flex items-center gap-4">
                      <button className="text-orbit-text-dim hover:text-orbit-text transition-colors cursor-pointer" title="Settings">
                        <Settings size={18} />
                      </button>
                      <button className="text-orbit-text-dim hover:text-red-500 transition-colors cursor-pointer" title="Remove">
                        <Trash2 size={18} />
                      </button>
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/10 text-emerald-400 border border-green-500/20">
                      <ShieldCheck size={12} strokeWidth={3} />
                      <span className="text-[10px] font-black uppercase tracking-wider">Verified</span>
                    </div>
                  </div>
                </div>
              ))}
              
              <button 
                onClick={() => setActiveTab('discover')}
                className="p-6 border-2 border-dashed border-orbit-border rounded-3xl flex flex-col items-center justify-center gap-3 text-orbit-text-dim hover:text-orbit-accent hover:border-orbit-accent/40 hover:bg-orbit-accent/5 transition-all duration-500 group cursor-pointer"
              >
                <div className="w-12 h-12 rounded-full border-2 border-current flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Plus size={24} />
                </div>
                <span className="font-bold text-sm">Add New Extension</span>
              </button>
            </motion.div>
          ) : (
            <motion.div 
              key="discover"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {stores.map(store => (
                  <div 
                    key={store.name}
                    onClick={() => onNavigate(store.url)}
                    className="group relative p-8 bg-orbit-surface border border-orbit-border rounded-[2.5rem] shadow-sm hover:shadow-2xl transition-all duration-700 cursor-pointer overflow-hidden"
                  >
                    <div className={`absolute top-0 right-0 w-32 h-32 ${store.color} opacity-[0.05] rounded-bl-full group-hover:opacity-[0.12] transition-opacity`} />
                    
                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-8">
                        <div className={`w-14 h-14 rounded-2xl ${store.color} flex items-center justify-center text-white shadow-lg`}>
                          <Download size={24} />
                        </div>
                        <ExternalLink size={20} className="text-orbit-text-dim group-hover:text-orbit-text transition-colors" />
                      </div>
                      
                      <h2 className="text-2xl font-bold text-orbit-text mb-3">{store.name}</h2>
                      <p className="text-orbit-text-dim text-sm leading-relaxed mb-6 max-w-xs">{store.description}</p>
                      
                      <div className="flex items-center gap-2 text-orbit-accent font-bold text-sm">
                        <span>Browse Add-ons</span>
                        <div className="w-5 h-px bg-orbit-accent group-hover:w-8 transition-all" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-10 bg-orbit-surface border border-orbit-border rounded-[3rem] text-orbit-text flex items-center justify-between overflow-hidden relative">
                <div className="absolute top-0 right-0 w-1/2 h-full bg-orbit-accent opacity-15 blur-[100px]" />
                <div className="relative z-10 max-w-md">
                  <h3 className="text-2xl font-bold mb-4 italic">Orbit Cross-Platform Compatibility</h3>
                  <p className="text-orbit-text-dim text-sm leading-relaxed mb-6">
                    Orbit uses an advanced translation layer that allows you to install extensions from both the Chrome and Edge ecosystems. Just navigate to their stores and click 'Add to Orbit'.
                  </p>
                  <button 
                     onClick={() => onNavigate('https://chrome.google.com/webstore')}
                     className="px-8 py-3 bg-orbit-accent text-white rounded-2xl font-bold text-sm hover:scale-105 transition-transform cursor-pointer shadow-lg shadow-orbit-accent/25"
                  >
                    Open Store
                  </button>
                </div>
                <div className="relative hidden lg:block">
                  <Puzzle size={160} className="text-orbit-text/5 -rotate-12 translate-x-12 translate-y-12" strokeWidth={0.5} />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ExtensionsManager;
