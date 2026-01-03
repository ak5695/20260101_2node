'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, Plus, ChevronUp, ChevronDown, User, Bot, X } from 'lucide-react';
import { clsx } from 'clsx';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatInterfaceProps {
  onPromoteToNode: (message: string) => void;
}

export function ChatInterface({ onPromoteToNode }: ChatInterfaceProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);
    setIsOpen(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: input }),
      });

      if (!response.ok) throw new Error('Failed to fetch');

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantAnswer = '';

      // Initialize assistant message
      setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const dataStr = line.slice(6);
              if (dataStr === '[DONE]') break;
              try {
                const data = JSON.parse(dataStr);
                const content = data.choices[0]?.delta?.content || '';
                assistantAnswer += content;

                setMessages((prev) => {
                  const newMessages = [...prev];
                  newMessages[newMessages.length - 1].content = assistantAnswer;
                  return newMessages;
                });
              } catch (e) {}
            }
          }
        }
      }
    } catch (error) {
      console.error('Chat error:', error);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 w-full max-w-2xl px-4 z-50 transition-all duration-300">
      {/* Chat History Popover */}
      {isOpen && (
        <div className="bg-[#252526]/95 backdrop-blur-xl border border-white/10 rounded-t-2xl shadow-2xl flex flex-col max-h-[400px] mb-[-1px] animate-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-center justify-between p-3 border-b border-white/5">
            <span className="text-xs font-semibold text-[#858585] uppercase tracking-wider px-2 flex items-center gap-2">
              <Bot size={14} /> Quick Chat
            </span>
            <button 
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-white/5 rounded text-[#858585] hover:text-white transition-colors"
            >
              <ChevronDown size={18} />
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
            {messages.length === 0 && (
              <div className="text-center text-[#858585] py-8 text-sm italic">
                Start a conversation to map your thoughts...
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={clsx('flex flex-col gap-2', msg.role === 'user' ? 'items-end' : 'items-start')}>
                <div className={clsx(
                    'max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed relative group',
                    msg.role === 'user' 
                        ? 'bg-[#3b82f6] text-white rounded-br-none' 
                        : 'bg-[#2d2d2d] text-[#e0e0e0] border border-white/5 rounded-bl-none'
                )}>
                  {msg.content || (isTyping && i === messages.length - 1 ? '...' : '')}
                  
                  {/* Promote to Node Button - Only for assistant messages */}
                  {msg.role === 'assistant' && msg.content && (
                    <button
                        onClick={() => onPromoteToNode(msg.content)}
                        className="absolute -right-10 top-0 p-2 bg-[#2d2d2d] hover:bg-[#3b82f6] text-[#858585] hover:text-white rounded-full border border-white/10 shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-200"
                        title="Add to Canvas"
                    >
                        <Plus size={14} strokeWidth={3} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Input Bar */}
      <div className={clsx(
          "bg-[#2d2d2d] border border-white/10 shadow-2xl flex items-center p-2 transition-all",
          isOpen ? "rounded-b-2xl" : "rounded-2xl"
      )}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Ask something to start chaining..."
          className="flex-1 bg-transparent text-[#e0e0e0] px-4 py-2 outline-none text-sm"
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || isTyping}
          className="p-2 bg-[#3b82f6] hover:bg-[#2563eb] disabled:bg-gray-600 text-white rounded-xl transition-all active:scale-95 flex items-center justify-center ml-2"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}
