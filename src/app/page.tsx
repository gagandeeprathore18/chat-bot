'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ThemeToggle from '../components/ThemeToggle';
import { 
  Search, MessageSquare, Layers, Terminal, 
  ChevronRight, Settings, CreditCard, ShieldAlert 
} from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/faq?query=${encodeURIComponent(searchQuery.trim())}`);
    }
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
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 dark:from-emerald-500 dark:to-teal-300 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
            <span className="font-bold text-lg select-none">A</span>
          </div>
          <div>
            <span className="font-bold text-sm tracking-tight text-zinc-900 dark:text-zinc-100 uppercase">ChatBot</span>
            <span className="text-zinc-400 dark:text-zinc-500 text-xs block -mt-0.5">Developer Support Hub</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Link
            href="/faq"
            className="text-xs font-semibold text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors cursor-pointer"
          >
            Browse All FAQs
          </Link>
          <span className="text-zinc-250 dark:text-zinc-800">|</span>
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

          {/* Search bar */}
          <form 
            onSubmit={handleSearchSubmit} 
            className="pt-4 max-w-lg mx-auto relative flex items-center bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-xl p-1.5 shadow-md focus-within:ring-2 focus-within:ring-emerald-500/40 transition-all duration-300"
          >
            <Search className="w-5 h-5 text-zinc-400 ml-3 shrink-0" />
            <input
              type="text"
              placeholder="Search API keys, limits, 401 errors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 px-3 py-2 text-sm bg-transparent border-none outline-none text-zinc-800 dark:text-zinc-100 placeholder-zinc-400"
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-900 font-semibold text-xs transition-all cursor-pointer"
            >
              Search
            </button>
          </form>
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
          <Link
            href="/chat"
            className="w-full md:w-auto px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-zinc-950 font-bold text-sm text-center shadow-md shadow-emerald-500/10 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <span>Launch Live Support Chat</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {/* FAQ Categories Grid */}
        <div className="w-full max-w-4xl space-y-4">
          <h3 className="font-bold text-sm text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Browse Help Categories</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            
            <Link
              href="/faq?category=general"
              className="p-5 rounded-xl border border-zinc-200/60 dark:border-zinc-800/60 bg-white/40 dark:bg-zinc-900/20 hover:bg-white dark:hover:bg-zinc-900/40 hover:border-emerald-500/35 transition-all cursor-pointer group flex flex-col justify-between h-40"
            >
              <div className="w-10 h-10 rounded-lg bg-indigo-500/10 dark:bg-indigo-400/10 text-indigo-650 dark:text-indigo-400 flex items-center justify-center">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-semibold text-sm text-zinc-800 dark:text-zinc-200 group-hover:text-emerald-500 transition-colors">General</h4>
                <p className="text-[10px] text-zinc-450 dark:text-zinc-500 mt-1 leading-relaxed">Introduction, trial options, and platforms.</p>
              </div>
            </Link>

            <Link
              href="/faq?category=billing"
              className="p-5 rounded-xl border border-zinc-200/60 dark:border-zinc-800/60 bg-white/40 dark:bg-zinc-900/20 hover:bg-white dark:hover:bg-zinc-900/40 hover:border-emerald-500/35 transition-all cursor-pointer group flex flex-col justify-between h-40"
            >
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 dark:bg-emerald-400/10 text-emerald-650 dark:text-emerald-400 flex items-center justify-center">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-semibold text-sm text-zinc-800 dark:text-zinc-200 group-hover:text-emerald-500 transition-colors">Billing & Account</h4>
                <p className="text-[10px] text-zinc-450 dark:text-zinc-500 mt-1 leading-relaxed">Payment gateways, cancellation, and invoices.</p>
              </div>
            </Link>

            <Link
              href="/faq?category=technical"
              className="p-5 rounded-xl border border-zinc-200/60 dark:border-zinc-800/60 bg-white/40 dark:bg-zinc-900/20 hover:bg-white dark:hover:bg-zinc-900/40 hover:border-emerald-500/35 transition-all cursor-pointer group flex flex-col justify-between h-40"
            >
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 dark:bg-amber-400/10 text-amber-650 dark:text-amber-400 flex items-center justify-center">
                <Settings className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-semibold text-sm text-zinc-800 dark:text-zinc-200 group-hover:text-emerald-500 transition-colors">Technical & API</h4>
                <p className="text-[10px] text-zinc-450 dark:text-zinc-500 mt-1 leading-relaxed">Webhooks, rate limits, keys, and schemas.</p>
              </div>
            </Link>

            <Link
              href="/faq?category=troubleshoot"
              className="p-5 rounded-xl border border-zinc-200/60 dark:border-zinc-800/60 bg-white/40 dark:bg-zinc-900/20 hover:bg-white dark:hover:bg-zinc-900/40 hover:border-emerald-500/35 transition-all cursor-pointer group flex flex-col justify-between h-40"
            >
              <div className="w-10 h-10 rounded-lg bg-rose-500/10 dark:bg-rose-400/10 text-rose-650 dark:text-rose-400 flex items-center justify-center">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-semibold text-sm text-zinc-800 dark:text-zinc-200 group-hover:text-emerald-500 transition-colors">Troubleshooting</h4>
                <p className="text-[10px] text-zinc-450 dark:text-zinc-500 mt-1 leading-relaxed">401 Errors, passwords, and logs debugs.</p>
              </div>
            </Link>

          </div>
        </div>

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
