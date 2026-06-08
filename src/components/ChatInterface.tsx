'use client';

import { useState, useEffect, useRef } from 'react';
import { Send, Plus } from 'lucide-react';

import { conversation, message } from '@/types/chat';
import { supabase } from '@/lib/supabaseClient';

interface Conversation {
  id: string;
  title: string;
  messages: message[];
}

let counter = 0;

const genId = () => `msg-${Date.now()}-${counter++}`;

export default function ChatInterface() {
  const [conversations, setConversations] = useState<conversation[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);

  const activeConversation = conversations.find(
    chat => chat.id === activeChatId
  );

  // ------------------------
  // Load Chats
  // ------------------------
  useEffect(() => {
    const loadChats = async () => {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session) {
        return;
      }

      setUserId(session.user.id);

      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('user_id', session.user.id)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Error loading conversations:', error);
        return;
      }

      if (data?.length) {
        const chats = data.map((row) => ({
          id: row.id,
          title: row.title || 'New Chat',
          createdAt: row.created_at,
          messages: row.messages,
        }));

        setConversations(chats);
        setActiveChatId(chats[0].id);
      } else {
        await createNewChat(session.user.id);
      }
    };

    loadChats();
  }, []);

  // ------------------------
  // Auto scroll
  // ------------------------
  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: 'smooth'
    });
  }, [conversations, isTyping]);

  // ------------------------
  // New Chat
  // ------------------------
  const saveConversation = async (chat: conversation) => {
    if (!userId) return;

    const { error } = await supabase.from('conversations').upsert(
      {
        id: chat.id,
        user_id: userId,
        title: chat.title,
        messages: chat.messages,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    );

    if (error) {
      console.error('Error saving conversation:', error);
    }
  };

  const createNewChat = async (currentUserId?: string) => {
    if (!currentUserId) {
      currentUserId = userId ?? undefined;
    }

    const newChat: conversation = {
      id: crypto.randomUUID(),
      title: 'New Chat',
      createdAt: new Date().toISOString(),
      messages: [
        {
          id: 'welcome',
          sender: 'bot',
          text: 'Hi 👋 Ask me anything and I will help you!',
          timestamp: new Date().toISOString(),
        },
      ],
    };

    setConversations((prev) => [newChat, ...prev]);
    setActiveChatId(newChat.id);

    if (currentUserId) {
      await supabase.from('conversations').insert({
        id: newChat.id,
        user_id: currentUserId,
        title: newChat.title,
        messages: newChat.messages,
        created_at: newChat.createdAt,
        updated_at: newChat.createdAt,
      });
    }
  };

  // ------------------------
  // Send Message
  // ------------------------
  const sendMessage = async (text: string) => {
    if (!text.trim()) return;
    if (!activeChatId) return;

    const userMsg: message = {
      id: genId(),
      sender: 'user',
      text,
      timestamp: new Date().toISOString(),
    };

    let updatedChat: conversation | undefined;

    setConversations((prev) =>
      prev.map((chat) => {
        if (chat.id !== activeChatId) return chat;

        const nextChat = {
          ...chat,
          title: chat.title === 'New Chat' ? text.slice(0, 30) : chat.title,
          messages: [...chat.messages, userMsg],
        };

        updatedChat = nextChat;
        return nextChat;
      })
    );

    if (updatedChat) {
      await saveConversation(updatedChat);
    }

    setInputValue('');
    setIsTyping(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });

      const data = await res.json();

      const botMsg: message = {
        id: genId(),
        sender: 'bot',
        text: data.text,
        timestamp: new Date().toISOString(),
      };

      let savedChat: conversation | undefined;

      setConversations((prev) =>
        prev.map((chat) => {
          if (chat.id !== activeChatId) return chat;

          const nextChat = {
            ...chat,
            messages: [...chat.messages, botMsg],
          };

          savedChat = nextChat;
          return nextChat;
        })
      );

      if (savedChat) {
        await saveConversation(savedChat);
      }
    } catch {
      const errorMsg: message = {
        id: genId(),
        sender: 'bot',
        text: 'Something went wrong. Please try again.',
        timestamp: new Date().toISOString(),
      };

      setConversations((prev) =>
        prev.map((chat) => {
          if (chat.id !== activeChatId) return chat;

          return {
            ...chat,
            messages: [...chat.messages, errorMsg],
          };
        })
      );
    } finally {
      setIsTyping(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(inputValue);
  };

  return (
    <div className="flex h-[80vh] border rounded-xl overflow-hidden">

      {/* Sidebar */}
      <div className="w-64 border-r bg-gray-50 flex flex-col">

        <button
          onClick={() => createNewChat(userId ?? undefined)}
          disabled={!userId}
          className="m-3 flex items-center justify-center gap-2 bg-black text-white rounded p-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus size={16} />
          New Chat
        </button>

        <div className="flex-1 overflow-y-auto">
          {conversations.map(chat => (
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

          {activeConversation?.messages.map(msg => (
            <div
              key={msg.id}
              className={`flex ${
                msg.sender === 'user'
                  ? 'justify-end'
                  : 'justify-start'
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
            <div className="text-sm text-gray-500">
              Bot is typing...
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <form
          onSubmit={handleSubmit}
          className="flex p-3 border-t gap-2"
        >
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
    </div>
  );
}