import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Copy, Check, Sparkles, AlertCircle, RefreshCw } from 'lucide-react';
import { ChatMessage } from '../types';
import { marked } from 'marked';

interface ChatFeedProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  isLoading: boolean;
  videoTitle?: string;
  subject?: string;
}

export const ChatFeed: React.FC<ChatFeedProps> = ({
  messages,
  onSendMessage,
  isLoading,
  videoTitle,
  subject,
}) => {
  const [inputText, setInputText] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputText.trim() && !isLoading) {
      onSendMessage(inputText.trim());
      setInputText('');
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const quickPrompts = [
    'Explain the core concept in simple terms',
    'What NCERT lines does NTA test from this topic?',
    'Show step-by-step derivation of the main formula',
    'What are the common calculation traps in this chapter?',
  ];

  return (
    <div className="flex flex-col h-full bg-[#0F172A] border border-[#334155] rounded-2xl overflow-hidden shadow-xl">
      {/* Feed Header */}
      <div className="px-4 py-3 bg-[#1E293B] border-b border-[#334155] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#38BDF8]/10 border border-[#38BDF8]/30 flex items-center justify-center text-[#38BDF8]">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs md:text-sm font-bold text-slate-100 flex items-center gap-1.5">
              <span>Interactive AI NEET Tutor</span>
              <span className="text-[10px] font-medium text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                Live
              </span>
            </h3>
            <p className="text-[10px] text-slate-400 truncate max-w-xs">
              Context locked to: {videoTitle || 'Active Lecture'}
            </p>
          </div>
        </div>

        <div className="text-[11px] font-mono text-slate-400">
          {messages.length} messages
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
            <div className="w-12 h-12 rounded-2xl bg-[#1E293B] border border-[#334155] flex items-center justify-center text-[#38BDF8] mb-3 shadow-lg">
              <Sparkles className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-200 mb-1">
              Fresh Lecture Session Initialized
            </h4>
            <p className="text-xs text-slate-400 max-w-sm mb-4">
              All previous session context has been wiped clean. Ask any doubt about this video, request formula derivations, or tap the quick presets above!
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-md">
              {quickPrompts.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => onSendMessage(q)}
                  className="text-left p-2.5 rounded-xl bg-[#1E293B] hover:bg-[#334155] border border-[#334155] text-xs text-slate-300 hover:text-white transition-colors"
                >
                  "{q}"
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg) => {
            const isUser = msg.sender === 'user';
            const htmlContent = isUser ? '' : (marked.parse(msg.text, { async: false }) as string);

            return (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-xl bg-[#1E293B] border border-[#38BDF8]/40 flex items-center justify-center text-[#38BDF8] shrink-0 mt-0.5 shadow-md">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`relative max-w-[85%] sm:max-w-[75%] rounded-2xl p-3.5 text-xs md:text-sm leading-relaxed shadow-md ${
                    isUser
                      ? 'bg-gradient-to-r from-[#0284C7] to-[#0369A1] text-white rounded-tr-none border border-[#38BDF8]/40'
                      : 'bg-[#1E293B] text-slate-100 rounded-tl-none border border-[#334155]'
                  }`}
                >
                  {/* Tutor Label & Copy button */}
                  {!isUser && (
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#334155]/60 text-[11px]">
                      <span className="font-bold text-[#38BDF8] flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        NEET AI Tutor ({subject || 'Lecture'})
                      </span>
                      <button
                        onClick={() => handleCopy(msg.id, msg.text)}
                        className="text-slate-400 hover:text-slate-200 transition-colors p-1"
                        title="Copy message"
                      >
                        {copiedId === msg.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  )}

                  {isUser ? (
                    <p className="whitespace-pre-wrap font-medium">{msg.text}</p>
                  ) : (
                    <div
                      className="prose prose-invert prose-slate max-w-none text-xs md:text-sm
                        prose-p:my-1.5 prose-p:text-slate-200
                        prose-headings:text-slate-100 prose-headings:font-bold
                        prose-h2:text-sm prose-h2:text-[#38BDF8]
                        prose-h3:text-xs prose-h3:text-sky-300
                        prose-ul:my-1.5 prose-ul:list-disc prose-ul:pl-4
                        prose-li:text-slate-300 prose-li:my-0.5
                        prose-strong:text-[#38BDF8]
                        prose-code:text-amber-300 prose-code:bg-[#0F172A] prose-code:px-1 prose-code:py-0.2 prose-code:rounded prose-code:font-mono
                        prose-pre:bg-[#0F172A] prose-pre:p-2 prose-pre:rounded-lg"
                      dangerouslySetInnerHTML={{ __html: htmlContent }}
                    />
                  )}

                  <div className="mt-1.5 text-[9px] text-right opacity-60">
                    {new Date(msg.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>

                {isUser && (
                  <div className="w-8 h-8 rounded-xl bg-[#0284C7] border border-[#38BDF8]/40 flex items-center justify-center text-white shrink-0 mt-0.5 shadow-md">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })
        )}

        {isLoading && (
          <div className="flex gap-2.5 justify-start">
            <div className="w-8 h-8 rounded-xl bg-[#1E293B] border border-[#38BDF8]/40 flex items-center justify-center text-[#38BDF8] shrink-0 shadow-md">
              <Bot className="w-4 h-4 animate-pulse" />
            </div>
            <div className="bg-[#1E293B] border border-[#334155] rounded-2xl rounded-tl-none p-3.5 shadow-md flex items-center gap-2">
              <div className="w-3.5 h-3.5 border-2 border-[#38BDF8] border-t-transparent rounded-full animate-spin" />
              <span className="text-xs text-slate-300 font-medium">
                Gemini is processing video context...
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts Strip */}
      {messages.length > 0 && (
        <div className="px-4 py-2 bg-[#1E293B]/60 border-t border-[#334155]/60 flex items-center gap-2 overflow-x-auto scrollbar-none">
          <span className="text-[10px] text-slate-400 uppercase font-semibold shrink-0">
            Suggested:
          </span>
          {quickPrompts.slice(0, 2).map((q, idx) => (
            <button
              key={idx}
              onClick={() => onSendMessage(q)}
              className="text-[11px] text-slate-300 hover:text-[#38BDF8] bg-[#0F172A] px-2.5 py-1 rounded-full border border-[#334155] shrink-0 whitespace-nowrap transition-colors"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Chat Input Bar */}
      <form onSubmit={handleSubmit} className="p-3 bg-[#1E293B] border-t border-[#334155]">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Ask doubt about this specific lecture (Physics, Chem, Bio)..."
            disabled={isLoading}
            className="flex-1 bg-[#0F172A] border border-[#334155] focus:border-[#38BDF8] text-slate-100 placeholder-slate-500 text-xs md:text-sm rounded-xl px-3.5 py-2.5 outline-none transition-all shadow-inner"
          />
          <button
            type="submit"
            disabled={isLoading || !inputText.trim()}
            className="p-2.5 rounded-xl bg-[#38BDF8] hover:bg-[#7dd3fc] disabled:bg-slate-700 disabled:text-slate-500 text-slate-950 font-bold transition-all shadow-md shadow-[#38BDF8]/20 active:scale-95 shrink-0"
            title="Send Message"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
};
