'use client';

import { useRef, useEffect } from 'react';
import { Send, Plus } from 'lucide-react';
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-zinc-500">Loading conversations...</p>
      </div>
    );
  }

  return (
    <div className="flex h-[80vh] border rounded-xl overflow-hidden">
      {/* Sidebar */}
      <div className="w-64 border-r bg-gray-50 flex flex-col">
        <button
          onClick={createNewChat}
          className="m-3 flex items-center justify-center gap-2 bg-black text-white rounded p-2"
        >
          <Plus size={16} />
          New Chat
        </button>

        <div className="flex-1 overflow-y-auto">
          {conversations.map((chat) => (
            <button
              key={chat.id}
              onClick={() => setActiveChatId(chat.id)}
              className={`w-full text-left p-3 border-b hover:bg-gray-100 ${
                activeChatId === chat.id ? 'bg-gray-200' : ''
              }`}
            >
              {chat.title}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {activeConversation?.messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${
                msg.sender === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`px-4 py-2 rounded-lg max-w-[70%] text-sm ${
                  msg.sender === 'user'
                    ? 'bg-black text-white'
                    : 'bg-gray-200 text-black'
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="text-sm text-gray-500">Bot is typing...</div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSubmit} className="flex p-3 border-t gap-2">
          <input
            ref={inputRef}
            type="text"
            placeholder="Type your message..."
            className="flex-1 border rounded px-3 py-2"
          />

          <button
            type="submit"
            className="bg-black text-white px-4 rounded flex items-center"
          >
            <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  );
}