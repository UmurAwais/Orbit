import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, BookOpen, Send, Loader2, User, Trash2 } from 'lucide-react';
import Markdown from 'markdown-to-jsx';

const AISidekick = ({ isOpen, onClose, activeTab }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [summaryData, setSummaryData] = useState(null);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  useEffect(() => {
    if (isOpen && activeTab?.url !== 'about:blank' && !summaryData) {
      handleSummarize();
    }
  }, [isOpen, activeTab?.id]);

  const handleSummarize = async () => {
    if (!activeTab || activeTab.url === 'about:blank') return;
    setIsSummarizing(true);
    try {
      const text = await window.orbit.ipcRenderer.invoke('tab:getPageText', { id: activeTab.id });
      const result = await window.orbit.ipcRenderer.invoke('ai:summarize', text);
      setSummaryData(result);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleSend = async (e, forcedInput = null) => {
    if (e) e.preventDefault();
    const messageToSend = forcedInput || input.trim();
    if (!messageToSend || isLoading) return;

    if (!forcedInput) setInput('');
    setMessages(prev => [...prev, { role: 'user', content: messageToSend }]);
    setIsLoading(true);

    try {
      let context = "";
      if (activeTab && activeTab.url !== 'about:blank') {
        context = await window.orbit.ipcRenderer.invoke('tab:getPageText', { id: activeTab.id });
      }
      
      const response = await window.orbit.ipcRenderer.invoke('ai:ask', { question: messageToSend, context });
      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: "I encountered an error processing your request." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
    setSummaryData(null);
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
          className="absolute right-0 top-0 bottom-0 h-full bg-[#fcfcfc] dark:bg-[#202124] border-l border-black/5 dark:border-white/8 flex flex-col overflow-hidden pointer-events-auto shadow-2xl z-9999"
        >
          {/* Internal wrapper to prevent content squishing during width animation */}
          <div className="w-96 h-full flex flex-col shrink-0">
            <div className="flex items-center justify-between bg-white/80 dark:bg-[#28292d]/90 backdrop-blur-md sticky top-0 z-10 px-4 h-13 border-b border-black/5 dark:border-white/8">
              <div className="flex items-center gap-2.5">
                <img src="/assets/orbit.png" className="w-8 h-8 object-contain" alt="Orbit" />
                <div className="flex flex-col">
                  <span className="text-[13px] font-bold text-black dark:text-[#f1f3f4] tracking-tight leading-tight">Orbit AI</span>
                  <span className="text-[10px] font-medium text-black/50 dark:text-[#9aa0a6] tracking-tight">Supercharge your browsing</span>
                </div>
              </div>
              
              <div className="flex items-center gap-0.5">
                <button 
                  onClick={clearChat}
                  className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-black/5 dark:hover:bg-white/10 text-black/40 dark:text-white/60 hover:text-black dark:hover:text-white transition-all cursor-pointer"
                  title="Clear Chat"
                >
                  <Trash2 size={14} strokeWidth={2} />
                </button>
                <button 
                  onClick={onClose}
                  className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-black/5 dark:hover:bg-white/10 text-black/40 dark:text-white/60 hover:text-black dark:hover:text-white transition-all cursor-pointer"
                  title="Close"
                >
                  <X size={15} strokeWidth={2.5} />
                </button>
              </div>

            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-[#f8f8f8] dark:bg-[#1e1f23]" ref={scrollRef}>
              {/* Quick Summary Section */}
              {activeTab?.url !== 'about:blank' && (
                <div className="bg-white dark:bg-[#28292d] rounded-xl p-3.5 border border-black/5 dark:border-white/8 shadow-sm">
                  <div className="flex items-center gap-2 mb-2.5">
                    <BookOpen size={13} className="text-orbit-accent" />
                    <span className="text-[11px] font-bold uppercase tracking-wider text-black/50 dark:text-white/50">Intelligence</span>
                  </div>
                  {isSummarizing ? (
                    <div className="flex items-center gap-2.5 py-2">
                      <Loader2 size={14} className="animate-spin text-orbit-accent" />
                      <span className="text-[12px] text-black/40 dark:text-white/40 italic">Analyzing page...</span>
                    </div>
                  ) : summaryData ? (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex flex-col gap-3"
                    >
                      <div className="text-[13px] text-black/80 dark:text-white/80 leading-relaxed max-w-none prose prose-sm dark:prose-invert">
                        <Markdown>{summaryData.summary}</Markdown>
                      </div>
                      
                      {summaryData.questions && summaryData.questions.length > 0 && (
                        <div className="flex flex-col gap-1.5 mt-3 pt-3 border-t border-black/5 dark:border-white/5">
                          <div className="flex items-center gap-1.5 mb-1">
                            <Sparkles size={11} className="text-orbit-accent animate-pulse" />
                            <span className="text-[10px] font-bold text-black/40 dark:text-white/40 uppercase tracking-widest">Suggested For You</span>
                          </div>
                          <div className="flex flex-col gap-2">
                            {summaryData.questions.map((q, idx) => (
                              <motion.button
                                key={idx}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.1 * idx }}
                                onClick={() => handleSend(null, q)}
                                className="text-left bg-white dark:bg-white/5 hover:bg-orbit-accent hover:text-white dark:hover:bg-orbit-accent border border-black/5 dark:border-white/10 rounded-xl px-3 py-2.5 text-[12.5px] font-medium text-black/70 dark:text-white/80 transition-all duration-200 group shadow-sm hover:shadow-md"
                              >
                                {q}
                              </motion.button>
                            ))}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-6 gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-orbit-accent/10 flex items-center justify-center text-orbit-accent">
                        <BookOpen size={24} />
                      </div>
                      <button 
                        onClick={handleSummarize}
                        className="text-[13px] font-bold text-orbit-accent hover:bg-orbit-accent/10 px-4 py-2 rounded-lg transition-all"
                      >
                        Deep Scan Page
                      </button>
                    </div>
                  )}
                </div>
              )}

              {messages.map((msg, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  {/* Avatar */}
                  {msg.role === 'user' ? (
                    <div className="w-7 h-7 rounded-full bg-black dark:bg-[#35363a] flex items-center justify-center shrink-0">
                      <User size={13} className="text-white dark:text-[#f1f3f4]" />
                    </div>
                  ) : (
                    <div className="w-7 h-7 rounded-full overflow-hidden shrink-0 bg-orbit-accent/10 flex items-center justify-center border border-orbit-accent/20">
                      <img src="/assets/orbit.png" alt="Orbit" className="w-5 h-5 object-contain" />
                    </div>
                  )}

                  {/* Bubble: user = plain text (no prose overrides), AI = markdown */}
                  {msg.role === 'user' ? (
                    <div className="max-w-[82%] rounded-2xl rounded-tr-sm px-3.5 py-2.5 text-[13px] leading-relaxed bg-black dark:bg-orbit-accent text-white shadow-sm">
                      {msg.content}
                    </div>
                  ) : (
                    <div className="max-w-[82%] rounded-2xl rounded-tl-sm px-3.5 py-2.5 text-[13px] leading-relaxed bg-white dark:bg-[#28292d] border border-black/6 dark:border-white/10 shadow-sm text-black/90 dark:text-[#f1f3f4] prose prose-sm dark:prose-invert">
                      <Markdown>{msg.content}</Markdown>
                    </div>
                  )}
                </motion.div>

              ))}

              {isLoading && (
                <div className="flex gap-2.5">
                  <div className="w-7 h-7 rounded-full overflow-hidden shrink-0 bg-orbit-accent/10 flex items-center justify-center border border-orbit-accent/20">
                    <img src="/assets/orbit.png" alt="Orbit" className="w-5 h-5 object-contain" />
                  </div>
                  <div className="bg-white dark:bg-[#28292d] border border-black/6 dark:border-white/10 shadow-sm rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-orbit-accent animate-bounce" style={{animationDelay: '0ms'}} />
                    <span className="w-1.5 h-1.5 rounded-full bg-orbit-accent animate-bounce" style={{animationDelay: '150ms'}} />
                    <span className="w-1.5 h-1.5 rounded-full bg-orbit-accent animate-bounce" style={{animationDelay: '300ms'}} />
                  </div>
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="p-3 bg-white/60 dark:bg-[#202124] border-t border-black/5 dark:border-white/8">
              <form onSubmit={handleSend} className="relative">
                <input 
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask Orbit anything..."
                  className="w-full bg-white dark:bg-[#28292d] border border-black/10 dark:border-white/10 rounded-xl py-2.5 pl-3.5 pr-11 text-[13px] text-black dark:text-[#f1f3f4] placeholder-black/30 dark:placeholder-white/30 outline-none focus:ring-2 focus:ring-orbit-accent/20 focus:border-orbit-accent transition-all"
                />
                <button 
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 w-7 h-7 bg-black dark:bg-[#35363a] text-white dark:text-[#f1f3f4] rounded-lg flex items-center justify-center hover:bg-orbit-accent dark:hover:bg-orbit-accent dark:hover:text-white transition-all disabled:opacity-20"
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
