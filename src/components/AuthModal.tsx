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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-[1px] px-4 py-6"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-3xl bg-cream border border-border-comic p-6 shadow-md"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-4 mb-6">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-sky-blue font-bold">
              {mode === "login" ? "Sign in" : "Sign up"}
            </p>
            <h2 className="text-2xl font-bold text-ink">
              {mode === "login" ? "Access Live Support" : "Create an account"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-ink-light hover:text-ink transition font-bold text-2xl cursor-pointer"
          >
            ×
          </button>
        </div>

        <div className="flex gap-2 mb-6">
          <button
            type="button"
            onClick={() => setMode("login")}
            className={`flex-1 rounded-full px-4 py-2 text-sm font-bold transition border cursor-pointer ${
              mode === "login"
                ? "bg-powder-blue text-ink border-border-comic shadow-sm"
                : "bg-beige text-ink-light border-transparent hover:bg-powder-blue/40 hover:text-ink"
            }`}
          >
            Sign in
          </button>
          <button
            type="button"
            onClick={() => setMode("signup")}
            className={`flex-1 rounded-full px-4 py-2 text-sm font-bold transition border cursor-pointer ${
              mode === "signup"
                ? "bg-powder-blue text-ink border-border-comic shadow-sm"
                : "bg-beige text-ink-light border-transparent hover:bg-powder-blue/40 hover:text-ink"
            }`}
          >
            Sign up
          </button>
        </div>

        <form onSubmit={submit} className="space-y-4">
          {mode === "signup" && (
            <label className="block text-sm text-ink">
              <span className="mb-2 block font-semibold">Full name</span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-2xl border border-border-comic bg-cream px-4 py-3 text-sm text-ink outline-none transition focus:border-sky-blue focus:ring-1 focus:ring-sky-blue"
                placeholder="Jane Doe"
              />
            </label>
          )}

          <label className="block text-sm text-ink">
            <span className="mb-2 block font-semibold">Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-2xl border border-border-comic bg-cream px-4 py-3 text-sm text-ink outline-none transition focus:border-sky-blue focus:ring-1 focus:ring-sky-blue"
              placeholder="you@example.com"
            />
          </label>

          <label className="block text-sm text-ink">
            <span className="mb-2 block font-semibold">Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-2xl border border-border-comic bg-cream px-4 py-3 text-sm text-ink outline-none transition focus:border-sky-blue focus:ring-1 focus:ring-sky-blue"
              placeholder="Enter password"
            />
          </label>

          {error && (
            <p className="text-sm text-rose-600 font-semibold">{error}</p>
          )}

          <button
            type="submit"
            className="w-full rounded-2xl bg-pastel-blue border border-border-comic px-4 py-3 text-sm font-bold text-ink shadow-sm transition hover:bg-sky-blue hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70 cursor-pointer"
            disabled={loading}
          >
            {loading ? "Working…" : mode === "login" ? "Sign in" : "Create account"}
          </button>
        </form>
      </div>
    </div>
  );
}
