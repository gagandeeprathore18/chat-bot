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
    <div className="w-72 border-r border-border-comic bg-beige p-4 flex flex-col h-full font-sans">
      <button
        onClick={onNewChat}
        className="w-full bg-[#c2e7ff] text-[#041e49] border border-border-comic hover:bg-[#b5e0fe] p-2 rounded-full font-semibold transition-all duration-200 shadow-sm hover:scale-[1.01] active:scale-[0.98]"
      >
        + New Chat
      </button>

      <div className="mt-4 space-y-2 flex-1 overflow-y-auto">
        {chats.map(chat => (
          <button
            key={chat.id}
            onClick={() => onSelect(chat.id)}
            className={`w-full text-left p-2 px-3 rounded-full text-sm transition-all duration-200 border ${
              activeChatId === chat.id
                ? 'bg-powder-blue text-ink border-border-comic font-semibold'
                : 'text-ink-light border-transparent hover:bg-powder-blue/40 hover:text-ink'
            }`}
          >
            {chat.title}
          </button>
        ))}
      </div>
    </div>
  );
}