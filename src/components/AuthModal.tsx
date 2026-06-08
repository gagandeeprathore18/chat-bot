"use client";

import { useEffect, useState } from "react";
import { supabase } from '@/lib/supabaseClient';

type AuthMode = "login" | "signup";

interface AuthModalProps {
  open: boolean;
  initialMode?: AuthMode;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AuthModal({
  open,
  initialMode = "login",
  onClose,
  onSuccess,
}: AuthModalProps) {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setMode(initialMode);
      setName("");
      setEmail("");
      setPassword("");
      setError("");
      setLoading(false);
    }
  }, [open, initialMode]);

  if (!open) {
    return null;
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password.trim()) {
      setError("Please enter both email and password.");
      return;
    }

    if (mode === "signup" && !name.trim()) {
      setError("Please enter your name.");
      return;
    }

    setLoading(true);

    try {
      if (mode === "signup") {
        const {
          data: { user, session },
          error,
        } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              full_name: name.trim(),
            },
          },
        });

        if (error) {
          setError(error.message);
          setLoading(false);
          return;
        }

        if (session) {
          onSuccess();
        } else {
          setError("Please verify your email before signing in.");
        }
      } else {
        const {
          data: { session },
          error,
        } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (error) {
          setError(error.message);
          setLoading(false);
          return;
        }

        if (session) {
          onSuccess();
        } else {
          setError("Unable to sign in. Please try again.");
        }
      }
    } catch (authError) {
      setError("Unable to authenticate. Please try again.");
      console.error(authError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-3xl bg-white dark:bg-[#08101f] border border-zinc-200/80 dark:border-zinc-800 p-6 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-4 mb-6">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-400 font-semibold">
              {mode === "login" ? "Sign in" : "Sign up"}
            </p>
            <h2 className="text-2xl font-bold text-zinc-950 dark:text-white">
              {mode === "login" ? "Access Live Support" : "Create an account"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition"
          >
            ×
          </button>
        </div>

        <div className="flex gap-2 mb-6">
          <button
            type="button"
            onClick={() => setMode("login")}
            className={`flex-1 rounded-full px-4 py-2 text-sm font-semibold transition ${
              mode === "login"
                ? "bg-zinc-950 text-white dark:bg-white dark:text-zinc-950"
                : "bg-zinc-100 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
            }`}
          >
            Sign in
          </button>
          <button
            type="button"
            onClick={() => setMode("signup")}
            className={`flex-1 rounded-full px-4 py-2 text-sm font-semibold transition ${
              mode === "signup"
                ? "bg-zinc-950 text-white dark:bg-white dark:text-zinc-950"
                : "bg-zinc-100 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
            }`}
          >
            Sign up
          </button>
        </div>

        <form onSubmit={submit} className="space-y-4">
          {mode === "signup" && (
            <label className="block text-sm text-zinc-700 dark:text-zinc-200">
              <span className="mb-2 block">Full name</span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-2xl border border-zinc-200 bg-transparent px-4 py-3 text-sm outline-none transition focus:border-emerald-500"
                placeholder="Jane Doe"
              />
            </label>
          )}

          <label className="block text-sm text-zinc-700 dark:text-zinc-200">
            <span className="mb-2 block">Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-2xl border border-zinc-200 bg-transparent px-4 py-3 text-sm outline-none transition focus:border-emerald-500"
              placeholder="you@example.com"
            />
          </label>

          <label className="block text-sm text-zinc-700 dark:text-zinc-200">
            <span className="mb-2 block">Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-2xl border border-zinc-200 bg-transparent px-4 py-3 text-sm outline-none transition focus:border-emerald-500"
              placeholder="Enter password"
            />
          </label>

          {error && (
            <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p>
          )}

          <button
            type="submit"
            className="w-full rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-70"
            disabled={loading}
          >
            {loading ? "Working…" : mode === "login" ? "Sign in" : "Create account"}
          </button>
        </form>
      </div>
    </div>
  );
}
