"use client";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ChatInterface from '../../components/ChatInterface';
import ThemeToggle from '../../components/ThemeToggle';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft } from 'lucide-react';

export default function ChatPage() {
  const router = useRouter();
  const { session, loading, signOut } = useAuth();

  useEffect(() => {
    if (!loading && !session) {
      router.replace('/');
    }
  }, [session, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-zinc-500">Loading...</p>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-zinc-50/40 dark:bg-zinc-950/80 transition-colors duration-300">

      {/* Background Decorative Gradients */}
      <div className="absolute top-0 left-0 right-0 h-[450px] bg-gradient-to-b from-sky-500/5 via-transparent to-transparent pointer-events-none -z-10" />

      {/* Mini Header */}
      <header className="w-full shrink-0 px-4 md:px-6 py-4 flex items-center justify-between border-b border-zinc-200/50 dark:border-zinc-800/30">

        {/* Left Side */}
        <Link
          href="/"
          className="flex items-center gap-1.5 text-s font-semibold text-zinc-650 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Home</span>
        </Link>

        {/* Right Side */}
        <div className="flex items-center gap-4">

          {session && (
            <button
              type="button"
              onClick={signOut}
              className="text-s font-semibold px-3 py-1 rounded-md bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-200 dark:text-zinc-950 dark:hover:bg-zinc-100 transition-all"
            >
              Sign out
            </button>
          )}

          <ThemeToggle />

        </div>

      </header>

      {/* Main Chat Frame */}
      <main className="flex-1 min-h-0 w-full flex items-stretch justify-start">
        <ChatInterface />
      </main>

      {/* Footer */}
      <footer className="w-full shrink-0 border-t border-zinc-200/50 dark:border-zinc-800/30 py-4">
        <div className="w-full px-0 flex items-center justify-between text-[11px] text-zinc-400 dark:text-zinc-500">
          <p className="px-4">© {new Date().getFullYear()} ChatBot.</p>
        </div>
      </footer>
    </div>
  );
}
