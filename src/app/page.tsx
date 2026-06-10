'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ThemeToggle from '../components/ThemeToggle';
import AuthModal from '../components/AuthModal';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { 
  MessageSquare, Terminal, ChevronRight 
} from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const { session, signOut } = useAuth();
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
    <div className="min-h-screen flex flex-col justify-between comic-grid-bg transition-colors duration-300 text-ink">
      
      {/* Background Decorative Accent */}
      <div className="absolute top-1/4 right-[10%] w-[350px] h-[350px] rounded-full bg-powder-blue/20 blur-[100px] pointer-events-none -z-10" />
      <div className="absolute bottom-1/4 left-[5%] w-[400px] h-[400px] rounded-full bg-sky-blue/15 blur-[110px] pointer-events-none -z-10" />

      {/* Main Navigation Header */}
      <header className="sticky top-3 mx-auto mt-4 mb-2 w-[95%] max-w-7xl rounded-full border border-border-comic bg-cream px-10 py-3.5 flex items-center justify-between shadow-sm z-50">
        <div> 
          <span className="font-bold text-2xl tracking-tight text-ink uppercase block leading-none">Nomi</span>
          <span className="text-ink-light text-[12px] block flex justify-center mt-0.5 font-semibold">AI ChatBot</span>
        </div>

        {/* Right Side Action Button */}
        <div className="flex items-center">
          {session ? (
            <button
              type="button"
              onClick={signOut}
              className="rounded-full border border-border-comic bg-[#2E4A62] hover:bg-[#1E3A52] px-4 py-2 text-xs font-bold text-white transition-all cursor-pointer shadow-sm hover:scale-[1.02] active:scale-[0.98]"
            >
              Sign out
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setAuthOpen(true)}
              className="rounded-full border border-border-comic bg-[#2E4A62] hover:bg-[#1E3A52] px-4 py-2 text-xs font-bold text-white transition-all cursor-pointer shadow-sm hover:scale-[1.02] active:scale-[0.98]"
            >
              Sign in
            </button>
          )}
        </div>
      </header>

      {/* Hero Header & Help Portal Search */}
      <main className="flex-1 w-full px-6 pt-6 pb-10 md:pt-8 md:pb-16 flex flex-col items-center gap-15 justify-center">
        
        {/* Hero Copy Split Section */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 items-center w-full max-w-4xl px-4">
          
          {/* Left Column: Heading and copy */}
          <div className="md:col-span-7 text-left space-y-5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pastel-blue text-[#041e49] border border-border-comic text-[11px] font-bold uppercase tracking-wider">
              <Terminal className="w-3.5 h-3.5" />
              <span>Your second brain online</span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-7xl font-bold tracking-tight text-ink leading-[0.97]">
              How can I help you today?
            </h1>
            <p className="text-sm md:text-base text-ink-light leading-relaxed font-bold">
              Search our dynamic knowledge base or start a live chatbot session for immediate technical support.
            </p>
          </div>

          {/* Right Column: Floating Chatbot Illustration & Speech Bubble */}
          <div className="md:col-span-5 flex justify-center md:justify-end">
            <div className="relative animate-bob max-w-[320px] md:max-w-[420px]">
              <img
                src="/chatbot_illustration.png"
                alt="Nomi Chatbot"
                className="w-full object-cover hover:scale-[1.02] transition-transform duration-300"
              />
              {/* Comic Speech Bubble */}
              <div className="absolute bottom-[25px] right-[-15px] bg-[#FFFDF7] px-4 py-2 rounded-2xl border border-border-comic text-xs font-bold text-ink shadow-sm rotate-[5deg] whitespace-nowrap">
                "Beep Boop! I'm here!"
              </div>
            </div>
          </div>

        </div>

        {/* Action Panel: Launch Chat */}
        <div className="w-full max-w-4xl p-6 md:p-8 rounded-2xl border border-border-comic bg-cream flex flex-col md:flex-row items-center justify-between gap-6 shadow-md hover:scale-[1.005] transition-all">
          <div className="space-y-1.5 text-center md:text-left">
            <h2 className="font-bold text-lg md:text-xl text-ink flex items-center justify-center md:justify-start gap-2">
              <MessageSquare className="w-5 h-5 text-sky-blue" />
              <span>Need Immediate support?</span>
            </h2>
            <p className="text-xs md:text-sm text-ink-light leading-relaxed font-medium">
              Launch our interactive support chat assistant to resolve issues, get codes, and query details instantly.
            </p>
          </div>
          <button
            type="button"
            onClick={handleLaunchSupport}
            className="w-full md:w-auto px-6 py-3 rounded-xl bg-pastel-blue hover:bg-sky-blue text-ink border border-border-comic font-bold text-sm text-center shadow-sm hover:-translate-y-0.5 hover:scale-[1.02] active:translate-y-0 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <span>Launch Live Support Chat</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Browse All FAQs Panel (replaces categories) */}
        <div className="w-full max-w-4xl">
          <h3 className="font-bold text-sm text-ink-light uppercase tracking-wider">Browse All FAQs</h3>

          <div className="mt-4 p-6 rounded-2xl border border-border-comic bg-cream flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm hover:scale-[1.005] transition-all">
            <div>
              <h4 className="text-lg font-bold text-ink">Explore our full knowledge base</h4>
              <p className="text-sm text-ink-light mt-2 font-medium">Find answers to common developer questions, troubleshooting steps, and API guidance in one place.</p>
            </div>

            <div className="flex-shrink-0">
              <Link
                href="/faq"
                className="px-5 py-3 rounded-xl bg-pastel-blue hover:bg-sky-blue text-ink border border-border-comic font-bold shadow-sm hover:-translate-y-0.5 hover:scale-[1.02] active:translate-y-0 active:scale-[0.98] transition-all"
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
      <footer className="w-full border-t border-border-comic bg-cream py-6 mt-12">
        <div className="w-full px-6 flex flex-col md:flex-row items-center justify-center gap-4 text-s text-ink-light font-medium">
          <p>© {new Date().getFullYear()} Your Internet Sidekick.</p>
        </div>
      </footer>
    </div>
  );
}
