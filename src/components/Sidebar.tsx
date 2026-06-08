import { conversation   } from '@/types/chat';

interface Props {
  chats: conversation[];
  activeChatId: string | null;
  onSelect: (id: string) => void;
  onNewChat: () => void;
}

export default function Sidebar({
  chats,
  activeChatId,
  onSelect,
  onNewChat
}: Props) {
  return (
    <div className="w-72 border-r p-4">

      <button
        onClick={onNewChat}
        className="w-full bg-black text-white p-2 rounded"
      >
        + New Chat
      </button>

      <div className="mt-4 space-y-2">
        {chats.map(chat => (
          <button
            key={chat.id}
            onClick={() => onSelect(chat.id)}
            className={`w-full text-left p-2 rounded ${
              activeChatId === chat.id
                ? 'bg-gray-200'
                : ''
            }`}
          >
            {chat.title}
          </button>
        ))}
      </div>
    </div>
  );
}