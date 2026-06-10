'use client';

import { useEffect, useRef, useState, ReactNode } from 'react';
import {
  Plus,
  ArrowUp,
  PanelLeftClose,
  PanelLeftOpen,
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { useChat } from '@/contexts/ChatContext';

// Normalizes common Gemini markdown quirks before rendering.
function formatBotText(text: string) {
  return text
    .replace(/\s+\*\s+(?=\*\*)/g, '\n\n* ')
    .replace(/\s+(\d+\.\s+)(?=\*\*|[A-Z])/g, '\n\n$1')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// Handles the inline markdown styles this chat UI supports.
function renderInlineMarkdown(text: string) {
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g);

  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={index} className="font-semibold">
          {part.slice(2, -2)}
        </strong>
      );
    }

    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code
          key={index}
          className="rounded bg-[#eef2f7] px-1.5 py-0.5 font-mono text-[0.92em]"
        >
          {part.slice(1, -1)}
        </code>
      );
    }

    return part;
  });
}

// Renders bot markdown in a ChatGPT/Gemini-like readable layout.
function BotMessage({ text }: { text: string }) {
  const lines = formatBotText(text).split('\n');
  const blocks: ReactNode[] = [];
  let listItems: ReactNode[] = [];

  const flushList = () => {
    if (!listItems.length) return;

    blocks.push(
      <ul key={`list-${blocks.length}`} className="my-2 list-disc space-y-1.5 pl-5">
        {listItems}
      </ul>
    );
    listItems = [];
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();

    if (!trimmed) {
      flushList();
      return;
    }

    if (/^#{1,3}\s+/.test(trimmed)) {
      flushList();
      blocks.push(
        <p key={index} className="mt-3 first:mt-0 font-semibold">
          {renderInlineMarkdown(trimmed.replace(/^#{1,3}\s+/, ''))}
        </p>
      );
      return;
    }

    if (/^[-*]\s+/.test(trimmed)) {
      listItems.push(
        <li key={index}>{renderInlineMarkdown(trimmed.replace(/^[-*]\s+/, ''))}</li>
      );
      return;
    }

    if (/^\d+\.\s+/.test(trimmed)) {
      flushList();
      blocks.push(
        <p key={index} className="mt-2 first:mt-0">
          {renderInlineMarkdown(trimmed)}
        </p>
      );
      return;
    }

    flushList();
    blocks.push(
      <p key={index} className="mt-2 first:mt-0">
        {renderInlineMarkdown(trimmed)}
      </p>
    );
  });

  flushList();

  return <div className="max-w-3xl space-y-1 leading-7">{blocks}</div>;
}

export default function ChatInterface() {
  const {
    conversations,
    activeChatId,
    setActiveChatId,
    createNewChat,
    sendMessage,
    regenerateMessage,
    isTyping,
    loading,
    activeConversation,
  } = useChat();

  const bottomRef = useRef<HTMLDivElement>(null);
  const [inputValue, setInputValue] = useState('');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Auto scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: 'smooth',
    });
  }, [activeConversation?.messages, isTyping]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = inputValue.trim();
    if (text) {
      setInputValue('');
      await sendMessage(text);
    }
  };

  const isChatEmpty = !activeConversation?.messages || activeConversation.messages.length === 0;

  if (loading) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <Sparkles className="animate-pulse text-blue-500" size={32} />
          <p className="text-zinc-500 font-medium">Loading conversations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex h-full min-h-0 w-full bg-white text-[#1f1f1f] font-sans overflow-hidden selection:bg-blue-200">

      {/* Sidebar collapse toggle, styled like the reference divider button. */}
      <button
        type="button"
        onClick={() => setIsSidebarCollapsed((value) => !value)}
        aria-label={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        title={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        className={`absolute top-5 z-30 hidden h-9 w-9 items-center justify-center rounded-full border border-[#dadce0] bg-white text-[#444746] shadow-sm transition-[left,background-color,box-shadow] duration-300 hover:bg-[#f8fafd] hover:shadow-md md:flex ${isSidebarCollapsed ? 'left-4' : 'left-[298px]'
          }`}
      >
        {isSidebarCollapsed ? (
          <PanelLeftOpen size={18} strokeWidth={1.8} />
        ) : (
          <PanelLeftClose size={18} strokeWidth={1.8} />
        )}
      </button>

      {/* Sidebar */}
      <div
        className={`hidden shrink-0 overflow-hidden border-r border-[#dde3ea] bg-[#f0f4f9] transition-[width] duration-300 ease-out md:flex ${isSidebarCollapsed ? 'w-0 border-r-0' : 'w-[280px]'
          }`}
      >
        <div className="flex h-full w-[280px] shrink-0 flex-col">
          <div className="flex items-center text-xl font-bold text-[#1f1f1f] mt-4 px-4" > Welcome to ChatBot!  </div>
          <div className="h-2 shrink-0" />

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
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col relative h-full min-h-0 w-full">

        {/* Subtle background gradient for empty state */}
        {isChatEmpty && (
          <div className="absolute inset-0 z-0 pointer-events-none flex items-center justify-center opacity-40">
            <div className="w-[800px] h-[800px] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#e8f0fe] via-transparent to-transparent blur-3xl"></div>
          </div>
        )}

        <div className="flex-1 min-h-0 overflow-y-auto z-10 w-full flex flex-col">

          {isChatEmpty ? (
            <div className="w-full h-full flex flex-col items-center justify-center mt-[-10vh]">
              <h1 className="text-[2.5rem] text-center font-normal text-[#1f1f1f] mb-8 tracking-tight">
                Hi, let's get into it
              </h1>
            </div>
          ) : (
            <div className="w-full px-4 md:px-8 lg:px-12 pt-16 pb-32 space-y-8">
              {activeConversation?.messages.map((msg, index) => {
                const nextMessage = activeConversation.messages[index + 1];
                const nextMessageText = nextMessage?.text.toLowerCase() || '';
                // Show retry only when this user message received a fallback response.
                const canRegenerate =
                  msg.sender === 'user' &&
                  nextMessage?.sender === 'bot' &&
                  (nextMessage.isFallback ||
                    nextMessageText.includes('heavy traffic') ||
                    nextMessageText.includes('temporarily unavailable'));

                return (
                  <div
                    key={msg.id}
                    className={`flex w-full flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'
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
                        {msg.sender === 'bot' ? (
                          <BotMessage text={msg.text} />
                        ) : (
                          msg.text
                        )}
                      </div>
                    </div>
                    {canRegenerate && (
                      <button
                        type="button"
                        onClick={() => regenerateMessage(msg.id)}
                        disabled={isTyping}
                        className="mt-2 mr-1 inline-flex h-8 items-center gap-1.5 rounded-full border border-[#d7dde5] bg-white px-3 text-xs font-medium text-[#444746] shadow-sm transition-colors hover:bg-[#f0f4f9] disabled:cursor-not-allowed disabled:opacity-50"
                        title="Regenerate response"
                      >
                        <RotateCcw size={14} />
                        Regenerate
                      </button>
                    )}
                  </div>
                );
              })}

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
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
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
