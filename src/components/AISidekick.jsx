import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, MessageSquare, BookOpen, Send, Loader2, Bot, User, Trash2 } from 'lucide-react';
import { summarizeText, askAI } from '../services/ai';

const AISidekick = ({ isOpen, onClose, activeTab }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [summary, setSummary] = useState('');
  const [isSummarizing, setIsSummarizing] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  useEffect(() => {
    if (isOpen && activeTab?.url !== 'about:blank' && !summary) {
      handleSummarize();
    }
  }, [isOpen, activeTab?.id]);

  const handleSummarize = async () => {
    if (!activeTab || activeTab.url === 'about:blank') return;
    setIsSummarizing(true);
    try {
      const text = await window.orbit.ipcRenderer.invoke('tab:getPageText', { id: activeTab.id });
      const result = await summarizeText(text);
      setSummary(result);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleSend = async (e) => {
    if (e) e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      let context = "";
      if (activeTab && activeTab.url !== 'about:blank') {
        context = await window.orbit.ipcRenderer.invoke('tab:getPageText', { id: activeTab.id });
      }
      
      const response = await askAI(userMessage, context);
      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: "I encountered an error processing your request." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
    setSummary('');
  };

  const lastSentWidth = useRef(0);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="orbit-ai-sidebar"
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 384, opacity: 1 }}
          exit={{ width: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }} 
          onUpdate={(latest) => {
            const roundedWidth = Math.round(latest.width);
            if (roundedWidth !== lastSentWidth.current) {
              lastSentWidth.current = roundedWidth;
              window.orbit.ipcRenderer.send('ui:sidekick-resize', roundedWidth);
            }
          }}
          onAnimationComplete={() => {
            if (isOpen) {
              window.orbit.ipcRenderer.send('ui:sidekick-resize', 384);
            } else {
              window.orbit.ipcRenderer.send('ui:sidekick-resize', 0);
            }
          }}
          className="h-full bg-white border-l border-black/5 flex flex-col overflow-hidden relative pointer-events-auto shadow-[-20px_0_40px_rgba(0,0,0,0.02)]"
        >
          {/* Internal wrapper to prevent content squishing during width animation */}
          <div className="w-96 h-full flex flex-col shrink-0">
            {/* Header (ChatGPT Atlas Inspired) */}
            <div className="h-13 px-4 border-b border-black/5 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-10">
              <div className="flex items-center gap-2.5">
                <img src="/assets/orbit.png" className="w-8 h-8 object-contain" alt="Orbit" />
                <div className="flex flex-col">
                  <span className="text-[13px] font-bold text-black tracking-tight leading-tight">Orbit AI</span>
                  <span className="text-[10px] font-medium text-black/50 tracking-tight">Supercharge your browsing</span>
                </div>
              </div>
              
              <div className="flex items-center gap-0.5">
                <button 
                  onClick={clearChat}
                  className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-black/5 text-black/40 hover:text-black transition-all cursor-pointer"
                  title="Clear Chat"
                >
                  <Trash2 size={14} strokeWidth={2} />
                </button>
                <button 
                  onClick={onClose}
                  className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-black/5 text-black/40 hover:text-black transition-all cursor-pointer"
                  title="Close"
                >
                  <X size={15} strokeWidth={2.5} />
                </button>
              </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar" ref={scrollRef}>
              {/* Quick Summary Section */}
              {activeTab?.url !== 'about:blank' && (
                <div className="bg-orbit-surface/50 rounded-xl p-3 border border-black/5">
                  <div className="flex items-center gap-2 mb-2">
                    <BookOpen size={13} className="text-orbit-accent" />
                    <span className="text-[11px] font-bold uppercase tracking-wider text-black/60">Intelligence</span>
                  </div>
                  {isSummarizing ? (
                    <div className="flex items-center gap-2 py-1">
                      <Loader2 size={14} className="animate-spin text-orbit-accent" />
                      <span className="text-[12px] text-black/40 italic">Synthesizing...</span>
                    </div>
                  ) : summary ? (
                    <div className="text-[13px] text-black/80 leading-relaxed max-w-none whitespace-pre-wrap">
                      {summary}
                    </div>
                  ) : (
                    <button 
                      onClick={handleSummarize}
                      className="text-[12px] font-bold text-orbit-accent hover:underline flex items-center gap-2"
                    >
                      Analyze Page
                    </button>
                  )}
                </div>
              )}

              {messages.map((msg, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                >
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                    msg.role === 'user' ? 'bg-black text-white' : 'bg-orbit-accent text-white'
                  }`}>
                    {msg.role === 'user' ? <User size={12} /> : <Bot size={12} />}
                  </div>
                  <div className={`max-w-[85%] rounded-xl p-3 text-[13px] leading-relaxed whitespace-pre-wrap ${
                    msg.role === 'user' 
                      ? 'bg-black text-white rounded-tr-none' 
                      : 'bg-white border border-black/5 shadow-sm rounded-tl-none text-black/90'
                  }`}>
                    {msg.content}
                  </div>
                </motion.div>
              ))}

              {isLoading && (
                <div className="flex gap-3">
                  <div className="w-7 h-7 rounded-full bg-orbit-accent text-white flex items-center justify-center shrink-0">
                    <Bot size={12} />
                  </div>
                  <div className="bg-white border border-black/5 shadow-sm rounded-xl rounded-tl-none p-3">
                    <Loader2 size={14} className="animate-spin text-orbit-accent" />
                  </div>
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="p-3 bg-white/50 border-t border-black/5">
              <form onSubmit={handleSend} className="relative">
                <input 
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask Orbit..."
                  className="w-full bg-white border border-black/10 rounded-xl py-2.5 pl-3 pr-10 text-[13px] outline-none focus:ring-2 focus:ring-orbit-accent/10 focus:border-orbit-accent transition-all"
                />
                <button 
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 w-7 h-7 bg-black text-white rounded-lg flex items-center justify-center hover:bg-orbit-accent transition-all disabled:opacity-20"
                >
                  <Send size={12} />
                </button>
              </form>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AISidekick;
