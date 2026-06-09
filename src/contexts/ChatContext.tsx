'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { conversation, message } from '@/types/chat';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from './AuthContext';

interface ChatContextType {
  conversations: conversation[];
  activeChatId: string | null;
  setActiveChatId: (id: string | null) => void;
  createNewChat: () => Promise<void>;
  sendMessage: (text: string) => Promise<void>;
  regenerateMessage: (userMessageId: string) => Promise<void>;
  isTyping: boolean;
  loading: boolean;
  activeConversation: conversation | undefined;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

let counter = 0;
const genId = () => `msg-${Date.now()}-${counter++}`;
const WELCOME_MESSAGE_ID = 'welcome';
const WELCOME_MESSAGE_TEXT = 'Hi 👋 Ask me anything and I will help you!';

const hasUserConversation = (chat: conversation) =>
  chat.messages.some((msg) => msg.sender === 'user');

const createDraftChat = (): conversation => ({
  id: crypto.randomUUID(),
  title: 'New Chat',
  createdAt: new Date().toISOString(),
  messages: [
    {
      id: WELCOME_MESSAGE_ID,
      sender: 'bot',
      text: WELCOME_MESSAGE_TEXT,
      timestamp: new Date().toISOString(),
    },
  ],
  // ⭐ ROLLING SUMMARY CHANGE: Initialize empty summary for new chats
  summary: "", 
});

export function ChatProvider({ children }: { children: ReactNode }) {
  const { user, session } = useAuth();

  const [conversations, setConversations] = useState<conversation[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [loading, setLoading] = useState(true);

  const activeConversation = conversations.find(
    (chat) => chat.id === activeChatId
  );

  useEffect(() => {
    const loadChats = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      setLoading(true);

      // ⭐ ROLLING SUMMARY CHANGE: Select 'summary' column from database
      const { data, error } = await supabase
        .from('conversations')
        .select('id, title, created_at, messages, summary')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.log('Error loading conversations:', error);
        setLoading(false);
        return;
      }

      if (data?.length) {
        const chats = data.map((row) => ({
          id: row.id,
          title: row.title || 'New Chat',
          createdAt: row.created_at,
          messages: Array.isArray(row.messages) ? row.messages : [],
          // ⭐ ROLLING SUMMARY CHANGE: Load the existing summary from DB
          summary: row.summary || "", 
        })).filter(hasUserConversation);

        if (chats.length) {
          setConversations(chats);
          setActiveChatId(chats[0].id);
        } else {
          const draftChat = createDraftChat();
          setConversations([draftChat]);
          setActiveChatId(draftChat.id);
        }
      } else {
        const draftChat = createDraftChat();
        setConversations([draftChat]);
        setActiveChatId(draftChat.id);
      }

      setLoading(false);
    };

    loadChats();
  }, [user]);

  const saveConversation = async (chat: conversation) => {
    if (!user || !user.id) return;

    if (!hasUserConversation(chat)) return;

    try {
      // ⭐ ROLLING SUMMARY CHANGE: Include 'summary' in the database payload
      const payload = {
        id: chat.id,
        user_id: user.id,
        title: chat.title,
        messages: chat.messages || [],
        summary: chat.summary || "", 
        created_at: chat.createdAt,
      };
      
      const { error } = await supabase.from('conversations').upsert(payload, { onConflict: 'id' });
      if (error) throw error;

    } catch (err) {
      console.error('Error saving conversation:', err);
    }
  };

  // ⭐ ROLLING SUMMARY CHANGE: Function now accepts and passes the summary
  const fetchBotResponse = async (text: string, history: message[], summary: string) => {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, history, summary }),
    });

    if (!res.ok) throw new Error(`API error: ${res.statusText}`);
    return res.json();
  };

  const createNewChat = async () => {
    if (!user) return;
    if (activeConversation && !hasUserConversation(activeConversation)) {
      setActiveChatId(activeConversation.id);
      return;
    }
    const newChat = createDraftChat();
    setConversations((prev) => [newChat, ...prev]);
    setActiveChatId(newChat.id);
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || !activeChatId || !activeConversation) return;

    // ⭐ ROLLING SUMMARY CHANGE: Extract existing summary to pass to the API
    const chathistory = activeConversation.messages.slice(-10);
    const currentSummary = activeConversation.summary || "";

    const userMsg: message = {
      id: genId(),
      sender: 'user',
      text,
      timestamp: new Date().toISOString(),
    };

    const optimisticChat: conversation = {
      ...activeConversation,
      title: activeConversation.title === 'New Chat' ? text.slice(0, 30) : activeConversation.title,
      messages: [...(activeConversation.messages || []), userMsg],
      createdAt: new Date().toISOString(),
    };

    setConversations((prev) => prev.map((chat) => (chat.id === activeChatId ? optimisticChat : chat)));
    setIsTyping(true);

    try {
      // ⭐ ROLLING SUMMARY CHANGE: Send summary to the API
      const data = await fetchBotResponse(text, chathistory, currentSummary);

      const botMsg: message = {
        id: genId(),
        sender: 'bot',
        text: data.text || 'Sorry, I did not understand that.',
        timestamp: new Date().toISOString(),
        isFallback: Boolean(data.isFallback),
        source: data.source,
      };

      // ⭐ ROLLING SUMMARY CHANGE: Capture new summary if the API returns one
      const finalChatState: conversation = {
        ...optimisticChat,
        messages: [...optimisticChat.messages, botMsg],
        summary: data.summary || currentSummary, 
      };

      setConversations((prev) => prev.map((chat) => (chat.id === activeChatId ? finalChatState : chat)));
      await saveConversation(finalChatState);
      
    } catch (error) {
      console.error('Error:', error);
      // ... (error handling logic)
    } finally {
      setIsTyping(false);
    }
  };

  const regenerateMessage = async (userMessageId: string) => {
    if (!activeChatId || isTyping || !activeConversation) return;

    const messages = activeConversation.messages || [];
    const userMessageIndex = messages.findIndex((msg) => msg.id === userMessageId && msg.sender === 'user');
    if (userMessageIndex === -1) return;

    // ⭐ ROLLING SUMMARY CHANGE: Extract history and summary
    const history = messages.slice(0, userMessageIndex).slice(-10);
    const currentSummary = activeConversation.summary || "";

    const chatWithoutFallback = { ...activeConversation, messages: messages.filter((_, idx) => idx !== userMessageIndex + 1) };

    setIsTyping(true);
    try {
      // ⭐ ROLLING SUMMARY CHANGE: Send summary to API
      const data = await fetchBotResponse(messages[userMessageIndex].text, history, currentSummary);

      const botMsg: message = {
        id: genId(),
        sender: 'bot',
        text: data.text,
        timestamp: new Date().toISOString(),
        isFallback: Boolean(data.isFallback),
        source: data.source,
      };

      const refreshedMessages = [...chatWithoutFallback.messages];
      refreshedMessages.splice(userMessageIndex + 1, 0, botMsg);

      // ⭐ ROLLING SUMMARY CHANGE: Capture new summary from regeneration
      const refreshedChat: conversation = {
        ...chatWithoutFallback,
        messages: refreshedMessages,
        summary: data.summary || currentSummary,
      };

      setConversations((prev) => prev.map((item) => (item.id === activeChatId ? refreshedChat : item)));
      await saveConversation(refreshedChat);
    } catch (error) {
       // ...
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <ChatContext.Provider
      value={{
        conversations,
        activeChatId,
        setActiveChatId,
        createNewChat,
        sendMessage,
        regenerateMessage,
        isTyping,
        loading,
        activeConversation,
      }}
    > 
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within ChatProvider');
  }
  return context;
}