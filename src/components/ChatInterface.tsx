'use client';

import { useRef, useEffect } from 'react';
import {
  Plus,
  Menu,
  Mic,
  ArrowUp,
  ChevronDown,
  Sparkles
} from 'lucide-react';
import { useChat } from '@/contexts/ChatContext';

export default function ChatInterface() {
  const {
    conversations,
    activeChatId,
    setActiveChatId,
    createNewChat,
    sendMessage,
    isTyping,
    loading,
    activeConversation,
  } = useChat();

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: 'smooth',
    });
  }, [activeConversation?.messages, isTyping]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = inputRef.current?.value || '';
    if (text.trim()) {
      await sendMessage(text);
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    }
  };

  const isChatEmpty = !activeConversation?.messages || activeConversation.messages.length === 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-white">
        <div className="flex flex-col items-center gap-4">
          <Sparkles className="animate-pulse text-blue-500" size={32} />
          <p className="text-zinc-500 font-medium">Loading conversations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-white text-[#1f1f1f] font-sans overflow-hidden selection:bg-blue-200">

      {/* Sidebar */}
      <div className="w-[280px] bg-[#f0f4f9] flex-col hidden md:flex transition-all duration-300">
        <div className="p-4 flex items-center gap-4">
          <button className="p-2 hover:bg-[#e1e5ea] rounded-full transition-colors">
            <Menu size={20} className="text-[#444746]" />
          </button>
        </div>

        <div className="px-4 py-2">
          <button
            onClick={createNewChat}
            className="flex items-center gap-3 bg-[#dde3ea] hover:bg-[#c2c8d1] text-[#1f1f1f] text-sm font-medium px-4 py-3 rounded-full transition-colors shadow-sm"
          >
            <Plus size={18} />
            New chat
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 mt-6">
          <p className="text-xs font-semibold text-[#444746] mb-3 px-3">Recents</p>
          <div className="flex flex-col gap-1">
            {conversations.map((chat) => (
              <button
                key={chat.id}
                onClick={() => setActiveChatId(chat.id)}
                className={`w-full text-left px-3 py-2.5 rounded-full text-sm truncate transition-colors ${activeChatId === chat.id
                    ? 'bg-[#e1e5ea] text-[#1f1f1f] font-medium'
                    : 'text-[#444746] hover:bg-[#e1e5ea]'
                  }`}
              >
                {chat.title}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col relative h-full w-full">

        {/* Subtle background gradient for empty state */}
        {isChatEmpty && (
          <div className="absolute inset-0 z-0 pointer-events-none flex items-center justify-center opacity-40">
            <div className="w-[800px] h-[800px] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#e8f0fe] via-transparent to-transparent blur-3xl"></div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto z-10 w-full flex flex-col">

          {isChatEmpty ? (
            <div className="w-full h-full flex flex-col items-center justify-center mt-[-10vh]">
              <h1 className="text-[2.5rem] text-center font-normal text-[#1f1f1f] mb-8 tracking-tight">
                Hi, let's get into it
              </h1>
            </div>
          ) : (
            <div className="w-full px-4 md:px-8 lg:px-12 py-6 space-y-8 pb-32">
              {activeConversation?.messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex w-full ${msg.sender === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                >
                  <div
                    className={`flex gap-4 max-w-[100%] ${msg.sender === 'user'
                        ? 'bg-[#f0f4f9] px-5 py-3.5 rounded-3xl text-[15px] leading-relaxed text-[#1f1f1f]'
                        : 'text-[15px] leading-relaxed text-[#1f1f1f]'
                      }`}
                  >
                    {msg.sender !== 'user' && msg.id !== 'welcome' && (
                      <div className="mt-1 flex-shrink-0">
                        <Sparkles size={24} className="text-blue-500" />
                      </div>
                    )}
                    <div className="flex flex-col gap-2 pt-0.5">
                      {msg.text}
                    </div>
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex justify-start w-full">
                  <div className="flex gap-4 max-w-[85%]">
                    <div className="mt-1 flex-shrink-0">
                      <Sparkles size={24} className="text-blue-400 animate-pulse" />
                    </div>
                    <div className="pt-1.5 flex gap-1">
                      <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"></div>
                      <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={bottomRef} className="h-4" />
            </div>
          )}
        </div>

        {/* Input Form Box */}
        <div className={`w-full absolute left-0 right-0 z-20 flex justify-center px-4 md:px-6 pb-6 transition-all duration-500 ${isChatEmpty ? 'top-1/2 -translate-y-4' : 'bottom-0 bg-gradient-to-t from-white via-white to-transparent pt-6'
          }`}>
          <form
            onSubmit={handleSubmit}
            className="w-full max-w-4xl bg-white border border-[#e1e5ea] shadow-[0_4px_16px_rgba(0,0,0,0.06)] rounded-3xl p-2 md:p-3 flex items-center gap-2 md:gap-4 transition-all"
          >
            {/* <button 
              type="button"
              className="p-2 text-[#444746] hover:bg-[#f0f4f9] rounded-full transition-colors shrink-0"
            >
              <Plus size={24} />
            </button> */}

            <input
              ref={inputRef}
              type="text"
              placeholder={isChatEmpty ? "Enter a prompt here" : "Type your message..."}
              className="flex-1 bg-transparent text-[15px] focus:outline-none placeholder-gray-500 text-[#1f1f1f]"
            />

            <div className="flex items-center gap-1 md:gap-2 shrink-0">
              {/* <button type="button" className="hidden md:flex items-center gap-1 text-sm font-medium text-[#444746] hover:bg-[#f0f4f9] px-3 py-1.5 rounded-full transition-colors">
                Pro <ChevronDown size={16} />
              </button> */}

              {/* <button type="button" className="p-2 text-[#444746] hover:bg-[#f0f4f9] rounded-full transition-colors">
                <Mic size={20} />
              </button> */}

              <button
                type="submit"
                className="bg-[#c2e7ff] hover:bg-[#b5e0fe] text-[#041e49] p-2.5 rounded-full flex items-center justify-center transition-colors"
              >
                <ArrowUp size={20} strokeWidth={2.5} />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}