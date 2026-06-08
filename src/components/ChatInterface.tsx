'use client';

import { useState, useEffect, useRef } from 'react';
import { Send, Bot, User } from 'lucide-react';

interface Message {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: Date;
}

let counter = 0;
const genId = () => `msg-${Date.now()}-${counter++}`;

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);

  // 🔹 Welcome message
  useEffect(() => {
    setMessages([
      {
        id: 'welcome',
        sender: 'bot',
        text: 'Hi 👋 Ask me anything and I will help you!',
        timestamp: new Date()
      }
    ]);
  }, []);

  // 🔹 auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // 🔥 API CALL (FAQ + GEMINI handled in backend)
  const sendMessage = async (text: string) => {
    if (!text.trim()) return;

    const userMsg: Message = {
      id: genId(),
      sender: 'user',
      text,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsTyping(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });

      const data = await res.json();

      setIsTyping(false);

      const botMsg: Message = {
        id: genId(),
        sender: 'bot',
        text: data.text,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMsg]);

    } catch (err) {
      setIsTyping(false);

      setMessages(prev => [
        ...prev,
        {
          id: genId(),
          sender: 'bot',
          text: 'Something went wrong. Please try again.',
          timestamp: new Date()
        }
      ]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(inputValue);
  };

  return (
    <div className="flex flex-col h-[80vh] w-full border rounded-xl">

      {/* CHAT AREA */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">

        {messages.map(msg => (
          <div
            key={msg.id}
            className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
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

        {/* typing indicator */}
        {isTyping && (
          <div className="text-sm text-gray-500">Bot is typing...</div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* INPUT BOX */}
      <form onSubmit={handleSubmit} className="flex p-3 border-t gap-2">
        <input
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
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
  );
}