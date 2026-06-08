import { conversation } from '@/types/chat';

export const saveChats = (
  chats: conversation[]
) => {
  localStorage.setItem(
    'conversations',
    JSON.stringify(chats)
  );
};

export const loadChats = () => {
  const data =
    localStorage.getItem('conversations');

  return data ? JSON.parse(data) : [];
};