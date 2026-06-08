'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ThemeToggle from '../components/ThemeToggle';
import AuthModal from '../components/AuthModal';
import { supabase } from '@/lib/supabaseClient';
import { 
  Search, MessageSquare, Layers, Terminal, 
  ChevronRight, Settings, CreditCard, ShieldAlert 
} from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [authOpen, setAuthOpen] = useState(false);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/faq?query=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleLaunchSupport = async () => {
    if (typeof window !== 'undefined') {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.push('/chat');
        return;
      }
    }
    setAuthOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-zinc-50/40 dark:bg-zinc-950/80 transition-colors duration-300">
      
      {/* Background Decorative Gradients */}
      <div className="absolute top-0 left-0 right-0 h-[450px] bg-gradient-to-b from-emerald-500/5 via-transparent to-transparent pointer-events-none -z-10" />
      <div className="absolute top-1/4 right-[10%] w-[350px] h-[350px] rounded-full bg-indigo-500/5 blur-[120px] pointer-events-none -z-10 dark:bg-indigo-400/5" />
      <div className="absolute bottom-1/4 left-[5%] w-[400px] h-[400px] rounded-full bg-emerald-500/5 blur-[130px] pointer-events-none -z-10 dark:bg-emerald-400/3" />

      {/* Main Navigation Header */}
      <header className="w-full max-w-7xl mx-auto px-6 py-5 flex items-center justify-between border-b border-zinc-200/50 dark:border-zinc-800/30">
        <div className="flex items-center gap-3">
          <div>
            <span className="font-bold text-sm tracking-tight text-zinc-900 dark:text-zinc-100 uppercase">ChatBot</span>
            <span className="text-zinc-400 dark:text-zinc-500 text-xs block -mt-0.5">Developer Support Hub</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <ThemeToggle />
        </div>
      </header>

      {/* Hero Header & Help Portal Search */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-6 py-10 md:py-16 flex flex-col items-center gap-10 justify-center">
        
        {/* Hero Copy */}
        <div className="text-center space-y-4 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 dark:bg-emerald-400/10 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 dark:border-emerald-400/20 uppercase tracking-wider">
            <Terminal className="w-3.5 h-3.5" />
            <span>Developer Support Hub</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
            How can we help you today?
          </h1>
          <p className="text-sm md:text-base text-zinc-500 dark:text-zinc-405 leading-relaxed">
            Search our dynamic knowledge base, browse categories below, or start a live chatbot session for immediate technical support.
          </p>
        </div>

        {/* Action Panel: Launch Chat */}
        <div className="w-full max-w-4xl p-6 md:p-8 rounded-2xl border border-emerald-500/20 bg-gradient-to-r from-emerald-500/5 to-teal-500/5 dark:from-emerald-500/10 dark:to-teal-500/10 flex flex-col md:flex-row items-center justify-between gap-6 shadow-lg">
          <div className="space-y-1.5 text-center md:text-left">
            <h2 className="font-extrabold text-lg md:text-xl text-zinc-850 dark:text-white flex items-center justify-center md:justify-start gap-2">
              <MessageSquare className="w-5 h-5 text-emerald-500 animate-pulse" />
              <span>Need Immediate support?</span>
            </h2>
            <p className="text-xs md:text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
              Launch our interactive support chat assistant to resolve issues, get codes, and query details instantly.
            </p>
          </div>
          <button
            type="button"
            onClick={handleLaunchSupport}
            className="w-full md:w-auto px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-zinc-950 font-bold text-sm text-center shadow-md shadow-emerald-500/10 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <span>Launch Live Support Chat</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Browse All FAQs Panel (replaces categories) */}
        <div className="w-full max-w-4xl">
          <h3 className="font-bold text-sm text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Browse All FAQs</h3>

          <div className="mt-4 p-6 rounded-2xl border bg-white/40 dark:bg-zinc-900/20 flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h4 className="text-lg font-semibold text-zinc-900 dark:text-white">Explore our full knowledge base</h4>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2">Find answers to common developer questions, troubleshooting steps, and API guidance in one place.</p>
            </div>

            <div className="flex-shrink-0">
              <Link
                href="/faq"
                className="px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-md"
              >
                Browse All FAQs
              </Link>
            </div>
          </div>
        </div>

        <AuthModal
          open={authOpen}
          onClose={() => setAuthOpen(false)}
          onSuccess={() => router.push('/chat')}
        />
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-zinc-200/50 dark:border-zinc-800/30 py-6 mt-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-zinc-400 dark:text-zinc-500">
          <p>© {new Date().getFullYear()} ChatBot for Developers.</p>
          <div className="flex items-center gap-6 font-medium">
            <a href="#" className="hover:text-zinc-700 dark:hover:text-zinc-350 transition-colors">Developer Docs</a>
            <a href="#" className="hover:text-zinc-700 dark:hover:text-zinc-350 transition-colors">API Reference</a>
            <a href="#" className="hover:text-zinc-700 dark:hover:text-zinc-350 transition-colors">Status Page</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
