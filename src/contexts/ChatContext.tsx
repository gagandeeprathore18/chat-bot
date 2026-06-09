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

export function ChatProvider({ children }: { children: ReactNode }) {
  const { user, session } = useAuth();

  const [conversations, setConversations] = useState<conversation[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [loading, setLoading] = useState(true);

  const activeConversation = conversations.find(
    (chat) => chat.id === activeChatId
  );

  // Load conversations from Supabase
  useEffect(() => {
    const loadChats = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      setLoading(true);

      const { data, error } = await supabase
        .from('conversations')
        .select('id, title, created_at, messages')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading conversations:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
        });
        setLoading(false);
        return;
      }

      if (data?.length) {
        const chats = data.map((row) => ({
          id: row.id,
          title: row.title || 'New Chat',
          createdAt: row.created_at,
          messages: Array.isArray(row.messages) ? row.messages : [],
        }));

        setConversations(chats);
        setActiveChatId(chats[0].id);
      } else {
        await createNewChat();
      }

      setLoading(false);
    };

    loadChats();
  }, [user]);

  const saveConversation = async (chat: conversation) => {
    if (!user) {
      console.warn('Cannot save conversation: no user session');
      return;
    }

    try {
      const { error, data } = await supabase.from('conversations').upsert(
        {
          id: chat.id,
          user_id: user.id,
          title: chat.title,
          messages: chat.messages || [],
          created_at: chat.createdAt,
        },
        { onConflict: 'id' }
      );

      if (error) {
        console.log('Error saving conversation:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
          chatId: chat.id,
          userId: user.id,
        });
        return;
      }

      console.log('Conversation saved successfully:', {
        id: chat.id,
        messageCount: chat.messages.length,
      });
    } catch (err) {
      console.error('Unexpected error saving conversation:', err);
    }
  };

  const fetchBotResponse = async (text: string, history: message[]) => {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        history,
      }),
    });

    if (!res.ok) {
      throw new Error(`API error: ${res.statusText}`);
    }

    return res.json();
  };

  const createNewChat = async () => {
    if (!user) {
      console.warn('Cannot create chat: no user session');
      return;
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

    try {
      const { error } = await supabase.from('conversations').insert({
        id: newChat.id,
        user_id: user.id,
        title: newChat.title,
        messages: newChat.messages,
        created_at: newChat.createdAt,
      });

      if (error) {
        console.log('Error creating conversation:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
          chatId: newChat.id,
          userId: user.id,
        });
      } else {
        console.log('New chat created:', newChat.id);
      }
    } catch (err) {
      console.error('Unexpected error creating conversation:', err);
    }
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || !activeChatId) {
      console.warn('Cannot send message: empty text or no active chat');
      return;
    }

    // chat history to send to the backend for context (last 10 messages)
    const chathistory = activeConversation?.messages.slice(-10) || [];

    const userMsg: message = {
      id: genId(),
      sender: 'user',
      text,
      timestamp: new Date().toISOString(),
    };

    let updatedChat: conversation | undefined;

    // Add user message to UI immediately
    setConversations((prev) =>
      prev.map((chat) => {
        if (chat.id !== activeChatId) return chat;

        const nextChat = {
          ...chat,
          title: chat.title === 'New Chat' ? text.slice(0, 30) : chat.title,
          messages: [...(chat.messages || []), userMsg],
        };

        updatedChat = nextChat;
        return nextChat;
      })
    );

    // Save user message to database
    if (updatedChat) {
      await saveConversation(updatedChat);
    }

    setIsTyping(true);

    try {
      const data = await fetchBotResponse(text, chathistory);

      const botMsg: message = {
        id: genId(),
        sender: 'bot',
        text: data.text || 'Sorry, I did not understand that.',
        timestamp: new Date().toISOString(),
        isFallback: Boolean(data.isFallback),
        source: data.source,
      };

      let savedChat: conversation | undefined;

      // Add bot response to UI
      setConversations((prev) =>
        prev.map((chat) => {
          if (chat.id !== activeChatId) return chat;

          const nextChat = {
            ...chat,
            messages: [...(chat.messages || []), botMsg],
          };

          savedChat = nextChat;
          return nextChat;
        })
      );

      // Save bot response to database
      if (savedChat) {
        await saveConversation(savedChat);
      }
    } catch (error) {
      console.error('Error sending message:', error);

      const errorMsg: message = {
        id: genId(),
        sender: 'bot',
        text: 'Something went wrong. Please try again.',
        timestamp: new Date().toISOString(),
        isFallback: true,
        source: 'client-error',
      };

      let failedChat: conversation | undefined;

      setConversations((prev) =>
        prev.map((chat) => {
          if (chat.id !== activeChatId) return chat;

          const nextChat = {
            ...chat,
            messages: [...(chat.messages || []), errorMsg],
          };

          failedChat = nextChat;
          return nextChat;
        })
      );

      if (failedChat) {
        await saveConversation(failedChat);
      }
    } finally {
      setIsTyping(false);
    }
  };

  const regenerateMessage = async (userMessageId: string) => {
    if (!activeChatId || isTyping) {
      return;
    }

    const chat = conversations.find((item) => item.id === activeChatId);
    const messages = chat?.messages || [];
    const userMessageIndex = messages.findIndex(
      (msg) => msg.id === userMessageId && msg.sender === 'user'
    );

    if (!chat || userMessageIndex === -1) {
      return;
    }

    const userMessage = messages[userMessageIndex];
    const nextMessage = messages[userMessageIndex + 1];
    const shouldRemoveFallback =
      nextMessage?.sender === 'bot' &&
      (nextMessage.isFallback ||
        nextMessage.text.toLowerCase().includes('heavy traffic') ||
        nextMessage.text.toLowerCase().includes('temporarily unavailable'));

    const messagesWithoutFallback = shouldRemoveFallback
      ? messages.filter((_, index) => index !== userMessageIndex + 1)
      : messages;

    const history = messages.slice(0, userMessageIndex).slice(-10);
    const chatWithoutFallback = {
      ...chat,
      messages: messagesWithoutFallback,
    };

    setConversations((prev) =>
      prev.map((item) =>
        item.id === activeChatId ? chatWithoutFallback : item
      )
    );
    await saveConversation(chatWithoutFallback);

    setIsTyping(true);

    try {
      const data = await fetchBotResponse(userMessage.text, history);

      const botMsg: message = {
        id: genId(),
        sender: 'bot',
        text: data.text || 'Sorry, I did not understand that.',
        timestamp: new Date().toISOString(),
        isFallback: Boolean(data.isFallback),
        source: data.source,
      };

      const refreshedMessages = [...chatWithoutFallback.messages];
      refreshedMessages.splice(userMessageIndex + 1, 0, botMsg);

      const refreshedChat = {
        ...chatWithoutFallback,
        messages: refreshedMessages,
      };

      setConversations((prev) =>
        prev.map((item) =>
          item.id === activeChatId ? refreshedChat : item
        )
      );
      await saveConversation(refreshedChat);
    } catch (error) {
      console.error('Error regenerating message:', error);

      const errorMsg: message = {
        id: genId(),
        sender: 'bot',
        text: 'Something went wrong. Please try again.',
        timestamp: new Date().toISOString(),
        isFallback: true,
        source: 'client-error',
      };

      const failedMessages = [...chatWithoutFallback.messages];
      failedMessages.splice(userMessageIndex + 1, 0, errorMsg);

      const failedChat = {
        ...chatWithoutFallback,
        messages: failedMessages,
      };

      setConversations((prev) =>
        prev.map((item) =>
          item.id === activeChatId ? failedChat : item
        )
      );
      await saveConversation(failedChat);
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
