'use client';

import { useEffect, useRef, useState, ReactNode } from 'react';
import {
  Plus,
  ArrowUp,
  PanelLeftClose,
  PanelLeftOpen,
  RotateCcw,
  Bot,
  Paperclip,
  Send,
  ArrowLeft
} from 'lucide-react';
import { useChat } from '@/contexts/ChatContext';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

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
          className="rounded bg-beige px-1.5 py-0.5 border border-border-comic font-mono text-[0.92em] text-ink"
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

  const { signOut } = useAuth();

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
      <div className="flex h-full w-full items-center justify-center bg-cream">
        <div className="flex flex-col items-center gap-4">
          <Bot className="animate-pulse text-sky-blue" size={32} />
          <p className="text-ink font-semibold">Loading conversations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex h-full min-h-0 w-full bg-cream text-ink font-sans overflow-hidden selection:bg-powder-blue">


      {/* Sidebar */}
      <div
        className={`hidden shrink-0 overflow-hidden border-r border-border-comic bg-beige transition-[width] duration-300 ease-out md:flex ${isSidebarCollapsed ? 'w-0 border-r-0' : 'w-[280px]'
          }`}
      >
        <div className="flex h-full w-[280px] shrink-0 flex-col pt-6">
          <div className="flex items-center justify-between mt-4 px-4">
            <span className="text-xl font-bold text-ink">Welcome to NOMI!</span>
            <div className="relative h-8 w-8 flex items-center justify-center animate-button-bounce">
              {/* Blue gradient shade behind the button */}
              <div className="absolute inset-[-6px] rounded-full bg-gradient-to-br from-sky-blue to-powder-blue opacity-75 blur-sm" />
              <button
                type="button"
                onClick={() => setIsSidebarCollapsed(true)}
                aria-label="Collapse sidebar"
                title="Collapse sidebar"
                className="relative z-10 h-full w-full flex items-center justify-center rounded-full border border-border-comic bg-cream text-ink shadow-sm hover:scale-[1.05] active:scale-95 cursor-pointer"
              >
                <PanelLeftClose size={16} strokeWidth={1.8} />
              </button>
            </div>
          </div>
          <div className="h-2 shrink-0" />

          <div className="px-4 py-2">
            <button
              onClick={createNewChat}
              className="flex items-center gap-3 bg-[#c2e7ff] hover:bg-[#b5e0fe] text-[#041e49] border border-border-comic text-sm font-semibold px-4 py-3 rounded-full transition-all shadow-sm hover:scale-[1.01] active:scale-[0.98]"
            >
              <Plus size={18} />
              New chat
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 mt-6">
            <p className="text-xs font-bold text-ink-light mb-3 px-3 uppercase tracking-wider">Recents</p>
            <div className="flex flex-col gap-1">
              {conversations.map((chat) => (
                <button
                  key={chat.id}
                  onClick={() => setActiveChatId(chat.id)}
                  className={`w-full text-left px-3 py-2.5 rounded-full text-sm truncate transition-all border ${activeChatId === chat.id
                    ? 'bg-powder-blue text-ink font-semibold border-border-comic'
                    : 'text-ink-light border-transparent hover:bg-powder-blue/40 hover:text-ink'
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
      <div className="flex-1 flex flex-col relative h-full min-h-0 w-full comic-grid-bg">

        {/* Sidebar expand toggle, rendered only when collapsed, floating outside the navbar */}
        {isSidebarCollapsed && (
          <div className="absolute top-[80px] left-4 z-30 h-9 w-9 flex items-center justify-center animate-button-bounce">
            {/* Blue gradient shade behind the button */}
            <div className="absolute inset-[-6px] rounded-full bg-gradient-to-br from-sky-blue to-powder-blue opacity-75 blur-sm" />
            <button
              type="button"
              onClick={() => setIsSidebarCollapsed(false)}
              aria-label="Expand sidebar"
              title="Expand sidebar"
              className="relative z-10 h-full w-full flex items-center justify-center rounded-full border border-border-comic bg-cream text-ink shadow-sm hover:scale-[1.05] active:scale-95 cursor-pointer"
            >
              <PanelLeftOpen size={18} strokeWidth={1.8} />
            </button>
          </div>
        )}

        {/* Header/Navbar: Capsule shape restored, kept as static sibling to prevent overflow */}
        <header className="mx-auto mt-4 mb-2 w-[95%] max-w-5xl rounded-full border border-border-comic bg-cream px-6 py-3 flex items-center justify-between shadow-sm relative z-30 shrink-0">
          {/* Left Side */}
          <Link
            href="/"
            className="flex items-center gap-1.5 text-s font-bold text-ink-light hover:text-ink transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </Link>

          {/* Center: Title */}
          <div className="text-xl font-bold text-ink uppercase tracking-wider">
            Nomi
          </div>

          {/* Right Side */}
          <div className="flex items-center">
            <button
              type="button"
              onClick={signOut}
              className="rounded-full border border-border-comic bg-[#2E4A62] hover:bg-[#1E3A52] px-4 py-2 text-s font-bold text-white transition-all cursor-pointer shadow-sm hover:scale-[1.02] active:scale-[0.98]"
            >
              Sign out
            </button>
          </div>
        </header>

        {/* Subtle background gradient for empty state */}
        {isChatEmpty && (
          <div className="absolute inset-0 z-0 pointer-events-none flex items-center justify-center opacity-30">
            <div className="w-[800px] h-[800px] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-powder-blue via-transparent to-transparent blur-3xl"></div>
          </div>
        )}

        {/* Chat Messages scroll window */}
        <div className="flex-1 min-h-0 overflow-y-auto z-10 w-full flex flex-col scrollbar-thin">
          {isChatEmpty ? (
            <div className="flex-1 flex flex-col items-center justify-center">
              <h1 className="text-[2.5rem] text-center font-bold text-ink tracking-tight">
                Hi, let's get into it
              </h1>
            </div>
          ) : (
            <div className={`w-full pt-4 pb-8 space-y-8 pr-4 md:pr-8 lg:pr-12 transition-all ${isSidebarCollapsed ? 'pl-16 md:pl-20' : 'pl-4 md:pl-8 lg:pl-12'}`}>
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
                        ? 'bg-[#B9D4F1] px-5 py-3.5 rounded-2xl text-[15px] leading-relaxed text-ink border border-[#7FA3C7] shadow-sm hover:scale-[1.005]'
                        : 'bg-cream px-5 py-3.5 rounded-2xl text-[15px] leading-relaxed text-ink border border-border-comic/80 shadow-sm hover:scale-[1.005]'
                        }`}
                    >
                      {msg.sender !== 'user' && msg.id !== 'welcome' && (
                        <div className="mt-1 flex-shrink-0">
                          <Bot size={24} className="text-sky-blue" />
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
                        className="mt-2 mr-1 inline-flex h-8 items-center gap-1.5 rounded-full border border-border-comic bg-cream px-3 text-xs font-semibold text-ink-light shadow-sm transition-all hover:bg-beige hover:text-ink active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
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
                  <div className="flex gap-4 max-w-[85%] bg-cream px-5 py-3 rounded-3xl border border-border-comic/60 shadow-sm">
                    <div className="mt-0.5 flex-shrink-0">
                      <Bot size={20} className="text-sky-blue animate-pulse" />
                    </div>
                    <div className="pt-2 flex gap-1">
                      <div className="w-2 h-2 rounded-full bg-ink-light animate-bounce"></div>
                      <div className="w-2 h-2 rounded-full bg-ink-light animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      <div className="w-2 h-2 rounded-full bg-ink-light animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={bottomRef} className="h-4" />
            </div>
          )}
        </div>

        {/* Input Form Box - Transparent background so it sits cleanly on the grid */}
        <div className="w-full z-20 flex justify-center px-4 md:px-6 py-4 bg-transparent shrink-0">
          <form
            onSubmit={handleSubmit}
            className="w-full max-w-4xl bg-cream border border-border-comic shadow-sm rounded-2xl px-4 py-2.5 flex items-center gap-2.5 md:gap-4 hover:scale-[1.005] hover:shadow-md focus-within:border-sky-blue focus-within:scale-[1.005] transition-all"
          >
            <input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              type="text"
              placeholder={isChatEmpty ? "Enter a prompt here" : "Type your message..."}
              className="flex-1 bg-transparent text-[15px] focus:outline-none placeholder-ink-light/50 text-ink font-semibold"
            />

            <div className="flex items-center gap-1 md:gap-2 shrink-0">
              <button
                type="submit"
                className="bg-[#2E4A62] hover:bg-[#1E3A52] text-white p-2.5 rounded-xl border border-border-comic flex items-center justify-center shadow-sm hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
              >
                <Send size={16} />
              </button>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
}
