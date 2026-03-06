import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Settings, 
  User, 
  Shield, 
  Palette, 
  Globe, 
  Zap, 
  Bell, 
  Search,
  ChevronRight,
  ExternalLink,
  Github,
  Moon,
  Sun,
  Monitor,
  Key,
  Download,
  Clock,
  Layout,
  HelpCircle,
  X,
  Languages,
  Check,
  Smartphone,
  CreditCard,
  MapPin,
  EyeOff,
  Cookie,
  History,
  HardDrive,
  Cpu,
  RotateCcw,
  Puzzle,
  Accessibility,
  Info,
  Power,
  Gauge
} from 'lucide-react';

const SettingsManager = ({ onNavigate, theme: activeTheme, setTheme }) => {
  const [activeSection, setActiveSection] = useState('general');
  const [searchQuery, setSearchQuery] = useState('');

  // Mock Settings State
  const [settings, setSettings] = useState({
    startup: 'newtab',
    showBookmarks: true,
    showHomeButton: false,
    fontSize: 'medium',
    searchEngine: 'google',
    downloadLocation: 'C:\\Users\\Orbit\\Downloads',
    askEveryTime: false,
    hardwareAcceleration: true
  });

  const menuItems = [
    { id: 'general', label: 'On startup', icon: Power },
    { id: 'personalization', label: 'You and Orbit', icon: User },
    { id: 'autofill', label: 'Autofill and passwords', icon: Key },
    { id: 'privacy', label: 'Privacy & Security', icon: Shield },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'search-engine', label: 'Search engine', icon: Search },
    { id: 'default-browser', label: 'Default browser', icon: Globe },
    { id: 'languages', label: 'Languages', icon: Languages },
    { id: 'downloads', label: 'Downloads', icon: Download },
    { id: 'performance', label: 'Performance', icon: Gauge },
    { id: 'accessibility', label: 'Accessibility', icon: Accessibility },
    { id: 'system', label: 'System', icon: HardDrive },
    { id: 'reset', label: 'Reset settings', icon: RotateCcw },
    { id: 'about', label: 'About Orbit', icon: Info },
  ];

  const filteredMenuItems = useMemo(() => {
    return menuItems.filter(item => 
      item.label.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  const SettingRow = ({ label, description, children, onClick, icon: Icon }) => (
    <div 
      className={`flex items-center justify-between py-4 border-b border-orbit-border last:border-0 ${onClick ? 'cursor-pointer hover:bg-orbit-card -mx-4 px-4 transition-colors' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-center gap-4">
        {Icon && <Icon size={18} className="text-orbit-text-dim" />}
        <div className="flex flex-col">
          <span className="text-[14px] font-bold text-orbit-text">{label}</span>
          {description && <span className="text-[12px] text-orbit-text-dim font-medium mt-0.5">{description}</span>}
        </div>
      </div>
      <div>{children}</div>
    </div>
  );

  const SectionTitle = ({ children }) => (
    <h3 className="text-[11px] font-black uppercase tracking-widest text-orbit-text-dim mb-4 mt-10 first:mt-0 px-1">{children}</h3>
  );

  const Toggle = ({ active, onToggle }) => (
    <div 
      onClick={(e) => { e.stopPropagation(); onToggle(); }}
      className={`w-9 h-5 rounded-full relative cursor-pointer transition-colors duration-200 ${active ? 'bg-orbit-accent' : 'bg-orbit-border'}`}
    >
      <motion.div 
        animate={{ x: active ? 18 : 2 }}
        initial={false}
        className="absolute top-1 w-3 h-3 bg-white rounded-full shadow-sm" 
      />
    </div>
  );

  const Radio = ({ active, label, onClick }) => (
    <div className="flex items-center gap-3 px-1 py-2 cursor-pointer group" onClick={onClick}>
      <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${active ? 'border-orbit-accent bg-orbit-accent/10' : 'border-orbit-border group-hover:border-orbit-text-dim'}`}>
        {active && <div className="w-1.5 h-1.5 rounded-full bg-orbit-accent" />}
      </div>
      <span className={`text-[13.5px] font-medium transition-colors ${active ? 'text-orbit-text' : 'text-orbit-text-dim group-hover:text-orbit-text'}`}>{label}</span>
    </div>
  );

  return (
    <div className="w-full h-full bg-orbit-bg flex flex-col font-sans select-none overflow-hidden text-orbit-text">
      {/* Precision Navigation Header */}
      <header className="w-full h-16 border-b border-orbit-border flex items-center shrink-0 z-100 relative bg-orbit-bg">
        <div className="flex items-center gap-3 px-6 relative z-10">
          <img src="/assets/orbit.png" className="w-7 h-7" alt="O" />
          <h1 className="text-base font-black tracking-tight text-orbit-text">Settings</h1>
        </div>

        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl group px-4">
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-orbit-text-dim">
              <Search size={14} />
            </div>
            <input 
              type="text"
              placeholder="Search Orbit settings"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 bg-orbit-surface border-none rounded-xl px-12 text-[13px] font-medium placeholder:text-center placeholder:text-orbit-text-dim outline-none focus:bg-orbit-bg focus:shadow-md transition-all border border-transparent focus:border-orbit-border"
              style={{ fontFamily: 'Satoshi, sans-serif' }}
            />
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Navigation */}
        <aside className="w-64 h-full border-r border-orbit-border flex flex-col pt-4 bg-orbit-surface/30 overflow-y-auto custom-scrollbar">
          <nav className="space-y-0.5 pb-20">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`w-full flex items-center gap-4 px-6 py-3 text-left transition-all cursor-pointer relative rounded-r-full mr-2 ${
                  activeSection === item.id 
                    ? 'text-orbit-accent bg-orbit-accent/10 font-medium' 
                    : 'text-orbit-text/80 hover:bg-orbit-border/50 font-medium'
                }`}
              >
                <item.icon size={20} strokeWidth={2} />
                <span className="text-[14px]">{item.label}</span>
              </button>
            ))}
            
            <div className="my-2 border-t border-orbit-border mx-6" />

            <button 
              onClick={() => onNavigate('orbit://extensions')}
              className="w-full flex items-center gap-4 px-6 py-3 text-left transition-all cursor-pointer relative rounded-r-full mr-2 text-orbit-text/80 hover:bg-orbit-border/50 font-medium"
            >
              <Puzzle size={20} strokeWidth={2} />
              <span className="text-[14px]">Extensions</span>
            </button>
          </nav>
        </aside>

        {/* Dynamic Content Area */}
        <main className="flex-1 h-full overflow-y-auto bg-orbit-bg p-12 lg:p-20 scroll-smooth">
          <div className="max-w-3xl mx-auto pb-40">
            <div className="max-w-3xl mx-auto py-12 px-6">
                <h2 className="text-3xl font-black tracking-tight text-orbit-text mb-12">{menuItems.find(i => i.id === activeSection)?.label}</h2>

                {activeSection === 'general' && (
                  <div className="space-y-2">
                    <SectionTitle>On Startup</SectionTitle>
                    <div className="space-y-1 bg-orbit-card p-4 rounded-2xl border border-orbit-border">
                      <Radio 
                        active={settings.startup === 'newtab'} 
                        label="Open the New Tab page" 
                        onClick={() => setSettings({...settings, startup: 'newtab'})}
                      />
                      <Radio 
                        active={settings.startup === 'continue'} 
                        label="Continue where you left off" 
                        onClick={() => setSettings({...settings, startup: 'continue'})}
                      />
                      <Radio 
                        active={settings.startup === 'specific'} 
                        label="Open a specific page or set of pages" 
                        onClick={() => setSettings({...settings, startup: 'specific'})}
                      />
                    </div>
                  </div>
                )}

                {activeSection === 'personalization' && (
                  <div className="space-y-6">
                    <div className="flex items-center gap-6 p-8 bg-orbit-card border border-orbit-border rounded-[2.5rem] mb-12">
                       <div className="w-20 h-20 rounded-full bg-orbit-accent flex items-center justify-center text-white text-2xl font-black shadow-xl shadow-orbit-accent/20">UA</div>
                       <div className="flex-1">
                          <h4 className="text-xl font-black text-orbit-text">Umur Awais</h4>
                          <p className="text-[13px] text-orbit-text-dim font-bold">umurawais@orbit.cloud</p>
                       </div>
                       <button className="px-6 py-2.5 rounded-xl border border-orbit-border text-[12px] font-black uppercase tracking-widest hover:bg-orbit-card transition-all text-orbit-text-dim hover:text-orbit-text">Sync: On</button>
                    </div>

                    <SectionTitle>Orbit Services</SectionTitle>
                    <SettingRow label="Sync and Orbit services" description="Manage what you share with Orbit" />
                    <SettingRow label="Manage your Orbit ID" description="Update profile info, password, and security" />
                    <SettingRow label="Orbit Sidekick AI" description="Configure generative browsing experience" />
                  </div>
                )}

                {activeSection === 'autofill' && (
                  <div className="space-y-2">
                    <SettingRow icon={Key} label="Password Manager" description="Manage saved passwords and passkeys" onClick={() => {}} />
                    <SettingRow icon={CreditCard} label="Payment methods" description="Save and fill payment info" onClick={() => {}} />
                    <SettingRow icon={MapPin} label="Addresses and more" description="Save and fill addresses" onClick={() => {}} />
                  </div>
                )}

                {activeSection === 'privacy' && (
                  <div className="space-y-2">
                    <SectionTitle>Privacy Core</SectionTitle>
                    <SettingRow icon={History} label="Clear browsing data" description="Clear history, cookies, cache, and more" onClick={() => {}} />
                    <SettingRow icon={Shield} label="Security" description="Safe Browsing (protection from dangerous sites) and other security settings" onClick={() => {}} />
                    <SettingRow icon={Cookie} label="Third-party cookies" description="Cookies are allowed" onClick={() => {}} />
                    <SettingRow icon={EyeOff} label="Ad privacy" description="Manage info used by sites to show you ads" onClick={() => {}} />
                    <SettingRow icon={Settings} label="Site Settings" description="Controls what information sites can use and what content they can show you" onClick={() => {}} />
                  </div>
                )}

                {activeSection === 'appearance' && (
                  <div className="space-y-6">
                    <SectionTitle>Theme</SectionTitle>
                    <div className="flex bg-orbit-surface p-1 rounded-xl w-fit mb-8">
                       {[
                         { id: 'light', icon: Sun, label: 'Light' },
                         { id: 'dark', icon: Moon, label: 'Dark' },
                         { id: 'system', icon: Monitor, label: 'System' },
                       ].map(mode => (
                         <button 
                           key={mode.id}
                           onClick={() => setTheme(mode.id)}
                           className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[12px] font-black uppercase tracking-widest transition-all cursor-pointer ${activeTheme === mode.id ? 'bg-orbit-bg text-orbit-accent shadow-sm' : 'text-orbit-text-dim hover:text-orbit-text'}`}
                         >
                           <mode.icon size={14} strokeWidth={activeTheme === mode.id ? 3 : 2} />
                           {mode.label}
                         </button>
                       ))}
                    </div>

                    <SectionTitle>Visuals</SectionTitle>
                    <SettingRow label="Show bookmarks bar">
                       <Toggle active={settings.showBookmarks} onToggle={() => setSettings({...settings, showBookmarks: !settings.showBookmarks})} />
                    </SettingRow>

                    <SectionTitle>Typography</SectionTitle>
                    <SettingRow label="Font size">
                      <select 
                        value={settings.fontSize}
                        onChange={(e) => setSettings({...settings, fontSize: e.target.value})}
                        className="bg-orbit-surface border-none outline-none rounded-lg px-3 py-1.5 text-[12px] font-bold cursor-pointer transition-all text-orbit-text"
                      >
                        <option value="small">Small</option>
                        <option value="medium">Medium</option>
                        <option value="large">Large</option>
                        <option value="huge">Very Large</option>
                      </select>
                    </SettingRow>
                    <SettingRow label="Customize fonts" onClick={() => {}} />
                  </div>
                )}

                {activeSection === 'search-engine' && (
                  <div className="space-y-2">
                    <SettingRow label="Search engine used in the address bar">
                      <select 
                        value={settings.searchEngine}
                        onChange={(e) => setSettings({...settings, searchEngine: e.target.value})}
                        className="bg-orbit-surface border-none outline-none rounded-lg px-3 py-1.5 text-[12px] font-bold cursor-pointer text-orbit-text"
                      >
                        <option value="google">Google</option>
                        <option value="bing">Bing</option>
                        <option value="duckduckgo">DuckDuckGo</option>
                        <option value="ecosia">Ecosia</option>
                      </select>
                    </SettingRow>
                    <SettingRow label="Manage search engines and site search" onClick={() => {}} />
                  </div>
                )}

                {activeSection === 'default-browser' && (
                  <div className="bg-orbit-card border border-orbit-border rounded-4xl p-8 flex items-center justify-between">
                    <div>
                      <h4 className="text-lg font-black text-orbit-text">Orbit is your default browser</h4>
                      <p className="text-[13px] text-orbit-text-dim font-bold mt-1">Make Orbit the primary gateway for all links on your system.</p>
                    </div>
                    <button className="px-6 py-2.5 bg-orbit-text text-orbit-bg rounded-xl text-[11px] font-black uppercase tracking-widest hover:opacity-90 transition-all cursor-pointer">Manage</button>
                  </div>
                )}

                {activeSection === 'downloads' && (
                  <div className="space-y-2">
                    <SettingRow label="Location" description={settings.downloadLocation}>
                       <button className="px-4 py-1.5 border border-orbit-border rounded-lg text-[12px] font-bold hover:bg-orbit-card transition-colors text-orbit-text">Change</button>
                    </SettingRow>
                    <SettingRow label="Ask where to save each file before downloading">
                       <Toggle active={settings.askEveryTime} onToggle={() => setSettings({...settings, askEveryTime: !settings.askEveryTime})} />
                    </SettingRow>
                  </div>
                )}

                {activeSection === 'performance' && (
                  <div className="space-y-6">
                    <SectionTitle>Memory</SectionTitle>
                    <SettingRow label="Memory Saver" description="When on, Orbit frees up memory from inactive tabs. This gives active tabs and other apps more computer resources and keeps Orbit fast.">
                       <Toggle active={true} onToggle={() => {}} />
                    </SettingRow>
                  </div>
                )}

                {activeSection === 'system' && (
                  <div className="space-y-2">
                    <SettingRow label="Continue running background apps when Orbit is closed">
                       <Toggle active={true} onToggle={() => {}} />
                    </SettingRow>
                    <SettingRow label="Use hardware acceleration when available">
                       <Toggle active={settings.hardwareAcceleration} onToggle={() => setSettings({...settings, hardwareAcceleration: !settings.hardwareAcceleration})} />
                    </SettingRow>
                    <SettingRow label="Open your computer's proxy settings" onClick={() => {}} />
                  </div>
                )}

                {activeSection === 'reset' && (
                  <div className="space-y-2">
                    <SettingRow label="Restore settings to their original defaults" onClick={() => {}} />
                    <SettingRow label="Clean up computer" description="Orbit can find harmful software on your computer and remove it" onClick={() => {}} />
                  </div>
                )}

                {activeSection === 'about' && (
                  <div className="space-y-12">
                    <div className="flex items-start gap-8">
                       <div className="w-20 h-20 rounded-4xl bg-orbit-text flex items-center justify-center shadow-2xl shrink-0">
                          <img src="/assets/orbit.png" className="w-12 h-12 invert dark:invert-0" alt="" />
                       </div>
                       <div className="space-y-4">
                          <div className="space-y-1">
                            <h3 className="text-2xl font-black text-orbit-text italic">Orbit</h3>
                            <p className="text-[13.5px] text-orbit-text-dim font-bold">Version 2.5.0 (Official Build) stable (64-bit)</p>
                          </div>
                          <div className="flex items-center gap-2 text-green-500">
                             <Check size={16} strokeWidth={3} />
                             <span className="text-[12px] font-black uppercase tracking-widest">Orbit is up to date</span>
                          </div>
                          <button className="px-6 py-2.5 bg-orbit-text text-orbit-bg rounded-xl text-[11px] font-black uppercase tracking-widest hover:opacity-90 transition-all cursor-pointer">Relaunch</button>
                       </div>
                    </div>

                    <div className="space-y-1">
                       <SectionTitle>Legal & Resources</SectionTitle>
                       <SettingRow label="Get help with Orbit" onClick={() => {}} icon={HelpCircle} />
                       <SettingRow label="Report an issue" onClick={() => {}} icon={Zap} />
                       <SettingRow label="Terms of Service" onClick={() => {}} icon={Globe} />
                       <SettingRow label="Open source licenses" onClick={() => {}} icon={Github} />
                    </div>
                    
                    <p className="text-[11px] text-orbit-text-dim font-medium pt-8">
                       Built for the next horizon of high-precision browsing. <br/>
                      &copy; 2026 Orbit Technologies Inc. All rights reserved.
                    </p>
                  </div>
                )}

                {/* Construction view for empty/search results */}
                {searchQuery && filteredMenuItems.length === 0 && (
                  <div className="py-40 text-center">
                    <p className="text-xl font-bold text-orbit-text-dim">No matching settings found for "{searchQuery}"</p>
                  </div>
                )}
              </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default SettingsManager;
