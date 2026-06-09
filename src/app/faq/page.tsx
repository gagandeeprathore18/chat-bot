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
    <div className="w-full max-w-4xl space-y-8">

      {/* SEARCH ONLY (no categories anymore) */}
      <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border shadow-md">
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
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Search FAQs..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800"
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
                className="bg-white dark:bg-zinc-900 border rounded-xl overflow-hidden"
              >
                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full flex justify-between px-6 py-4 text-left"
                >
                  <span className="text-sm font-medium">
                    {faq.question}
                  </span>

                  {isOpen ? (
                    <ChevronUp className="w-5 h-5 text-sky-500" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-zinc-400" />
                  )}
                </button>

                {isOpen && (
                  <div className="px-6 pb-5 pt-3 text-sm text-zinc-600 dark:text-zinc-300">
                    <p>{faq.answer}</p>

                    <div className="mt-4 flex justify-between items-center">
                      <Link
                        href="/chat"
                        className="text-xs text-sky-600 flex items-center gap-1"
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
            <HelpCircle className="w-10 h-10 mx-auto text-zinc-400 mb-2" />
            <p className="text-sm">No FAQs found</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function FAQPage() {
  return (
    <div className="min-h-screen flex flex-col bg-zinc-50 dark:bg-zinc-950">

      <header className="flex justify-between p-4 border-b">
        <Link href="/" className="flex items-center gap-2 text-sm">
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>
        <ThemeToggle />
      </header>

      <main className="flex-1 flex justify-center p-6">
        <Suspense fallback={<div>Loading...</div>}>
          <FAQContent />
        </Suspense>
      </main>

      <footer className="text-center p-4 text-xs text-zinc-500 border-t">
        FAQ System
      </footer>
    </div>
  );
}