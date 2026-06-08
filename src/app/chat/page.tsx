import ChatInterface from '../../components/ChatInterface';
import ThemeToggle from '../../components/ThemeToggle';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function ChatPage() {
  return (
    <div className="min-h-screen flex flex-col justify-between bg-zinc-50/40 dark:bg-zinc-950/80 transition-colors duration-300">
      
      {/* Background Decorative Gradients */}
      <div className="absolute top-0 left-0 right-0 h-[450px] bg-gradient-to-b from-emerald-500/5 via-transparent to-transparent pointer-events-none -z-10" />

      {/* Mini Header */}
      <header className="w-full max-w-7xl mx-auto px-6 py-4 flex items-center justify-between border-b border-zinc-200/50 dark:border-zinc-800/30">
        <Link
          href="/"
          className="flex items-center gap-1.5 text-xs font-semibold text-zinc-650 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Help Center</span>
        </Link>
        <ThemeToggle />
      </header>

      {/* Main Chat Frame */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-center">
        <ChatInterface />
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-zinc-200/50 dark:border-zinc-800/30 py-4">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between text-[11px] text-zinc-400 dark:text-zinc-500">
          <p>© {new Date().getFullYear()} Antigravity Systems. Support Chat Client.</p>
        </div>
      </footer>
    </div>
  );
}
