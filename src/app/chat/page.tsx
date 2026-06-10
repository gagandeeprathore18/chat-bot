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
    <div className="relative h-screen w-screen overflow-hidden bg-cream text-ink">

      {/* Background Decorative Accent */}
      <div className="absolute top-0 left-0 right-0 h-[450px] bg-gradient-to-b from-powder-blue/10 via-transparent to-transparent pointer-events-none -z-10" />

      {/* Main Chat Frame - stretches full height */}
      <main className="h-full w-full flex items-stretch justify-start">
        <ChatInterface />
      </main>
    </div>
  );
}
