'use client';

import { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Determine the initial theme preference
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = savedTheme === 'dark' || (!savedTheme && systemPrefersDark);
    
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // Use a macro-task timer to set state asynchronously to satisfy React 19 rules
    const timer = setTimeout(() => {
      setTheme(isDark ? 'dark' : 'light');
      setMounted(true);
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  const toggleTheme = () => {
    if (theme === 'light') {
      setTheme('dark');
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      setTheme('light');
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  // Avoid hydration mismatch by rendering a placeholder of the same dimensions initially
  if (!mounted) {
    return <div className="w-10 h-10 rounded-full" />;
  }

  return (
    <button
      onClick={toggleTheme}
      className="relative flex items-center justify-center w-10 h-10 rounded-full bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-900 border border-zinc-200/55 dark:border-zinc-700/50 cursor-pointer shadow-sm hover:scale-105 active:scale-95"
      aria-label="Toggle theme"
    >
      {theme === 'light' ? (
        <Moon className="w-5 h-5 transition-transform duration-500 rotate-0 scale-100" />
      ) : (
        <Sun className="w-5 h-5 transition-transform duration-500 rotate-180 scale-100 text-amber-400" />
      )}
    </button>
  );
}
