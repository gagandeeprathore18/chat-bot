'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import ThemeToggle from '../../components/ThemeToggle';
import {
  ArrowLeft,
  Search,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  MessageSquare
} from 'lucide-react';

interface FAQ {
  question: string;
  answer: string;
  keywords: string[];
}

function FAQContent() {
  const searchParams = useSearchParams();

  const query = searchParams.get('query') || '';

  const [searchInput, setSearchInput] = useState(query);
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  // sync input with URL
  useEffect(() => {
    setSearchInput(searchParams.get('query') || '');
  }, [searchParams]);

  // fetch FAQs from backend
  useEffect(() => {
    const fetchFaqs = async () => {
      try {
        const res = await fetch(
          `/api/faqs?query=${encodeURIComponent(query)}`
        );

        if (res.ok) {
          const data = await res.json();
          setFaqs(data);
        }
      } catch (err) {
        console.error('Error fetching FAQs:', err);
      }
    };

    fetchFaqs();
  }, [query]);

  const toggleFaq = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="w-full max-w-4xl space-y-8 font-sans text-ink">

      {/* SEARCH ONLY (no categories anymore) */}
      <div className="bg-cream p-5 rounded-2xl border border-border-comic shadow-md">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const params = new URLSearchParams();

            if (searchInput.trim()) {
              params.set('query', searchInput.trim());
            }

            window.history.pushState({}, '', `/faq?${params.toString()}`);
          }}
        >
          <div className="relative w-full">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-sky-blue" />
            <input
              type="text"
              placeholder="Search FAQs..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm rounded-lg bg-cream border border-border-comic text-ink font-semibold outline-none focus:border-sky-blue focus:ring-1 focus:ring-sky-blue"
            />
          </div>
        </form>
      </div>

      {/* FAQ LIST */}
      <div className="space-y-3">
        {faqs.length > 0 ? (
          faqs.map((faq, index) => {
            const isOpen = openIndex === index;

            return (
              <div
                key={index}
                className="bg-cream border border-border-comic rounded-xl overflow-hidden shadow-sm hover:scale-[1.005] transition-all"
              >
                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full flex justify-between px-6 py-4 text-left font-bold text-ink hover:bg-beige/40 transition-colors cursor-pointer"
                >
                  <span className="text-sm">
                    {faq.question}
                  </span>

                  {isOpen ? (
                    <ChevronUp className="w-5 h-5 text-sky-blue" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-ink-light" />
                  )}
                </button>

                {isOpen && (
                  <div className="px-6 pb-5 pt-3 text-sm text-ink-light leading-relaxed">
                    <p>{faq.answer}</p>

                    <div className="mt-4 flex justify-between items-center">
                      <Link
                        href="/chat"
                        className="text-xs text-sky-blue font-bold flex items-center gap-1 hover:underline"
                      >
                        <MessageSquare className="w-3 h-3" />
                        Ask in chat
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="text-center py-12">
            <HelpCircle className="w-10 h-10 mx-auto text-ink-light mb-2" />
            <p className="text-sm font-semibold text-ink-light">No FAQs found</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function FAQPage() {
  return (
    <div className="min-h-screen flex flex-col bg-cream text-ink comic-grid-bg">

      <header className="mx-auto mt-4 mb-2 w-[95%] max-w-6xl rounded-full border border-border-comic bg-cream px-6 py-3 flex items-center justify-between shadow-sm relative z-30">
        <Link href="/" className="flex items-center gap-1.5 text-xs font-bold text-ink-light hover:text-ink transition-colors cursor-pointer">
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>

        {/* Center: Title */}
        <div className="text-sm font-bold text-ink uppercase tracking-wider">
          Nomi
        </div>

        <ThemeToggle />
      </header>

      <main className="flex-1 flex justify-center p-6">
        <Suspense fallback={<div className="font-semibold text-ink">Loading FAQs...</div>}>
          <FAQContent />
        </Suspense>
      </main>

      <footer className="text-center p-4 text-xs text-ink-light border-t border-border-comic bg-cream font-semibold">
        FAQ System
      </footer>
    </div>
  );
}