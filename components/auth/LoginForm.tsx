"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/firebase/authContext";
import { LogIn, AlertCircle, Sparkles } from "lucide-react";

export const LoginForm: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { signInWithEmail, signInWithGoogle } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/dashboard";
  const urlError = searchParams.get("error");

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email.trim() || !password) {
      setError("Please provide both email and password.");
      return;
    }

    setLoading(true);
    const res = await signInWithEmail(email.trim(), password);
    setLoading(false);

    if (res.success) {
      router.push(redirect);
    } else {
      setError(res.error || "Authentication failed.");
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading(true);
    const res = await signInWithGoogle();
    setLoading(false);

    if (res.success) {
      router.push(redirect);
    } else {
      setError(res.error || "Google Sign-In failed.");
    }
  };

  const handleFillAdmin = () => {
    setEmail("jeevan@gmail.com");
    setPassword("jeevan@123");
  };

  const handleFillMember = () => {
    setEmail("praveen@gmail.com");
    setPassword("praveen@123");
  };

  return (
    <div className="w-full max-w-md mx-auto glass-card-heavy rounded-3xl p-8 sm:p-10 relative overflow-hidden border border-white/15 shadow-[0_0_50px_rgba(95,243,232,0.15)]">
      {/* Background Ambience */}
      <div className="absolute -top-20 -right-20 w-60 h-60 bg-primary/20 rounded-full blur-[90px] pointer-events-none" />
      <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-secondary/20 rounded-full blur-[90px] pointer-events-none" />

      {/* Header */}
      <div className="text-center mb-8 space-y-2 relative z-10">
        <Link href="/" className="inline-block mb-2">
          <span className="font-display text-2xl font-bold text-white">
            Diseño <span className="text-primary">Divino.</span>
          </span>
        </Link>
        <h1 className="font-display text-3xl font-bold text-white">Member Login</h1>
        <p className="font-body text-xs text-on-surface-variant">
          Access the internal portal, domains, To-Dos, and event workspace.
        </p>
      </div>

      {urlError === "disabled" && (
        <div className="mb-6 p-4 rounded-2xl bg-error/10 border border-error/30 text-error text-xs flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>Your account is currently disabled. Please contact the club administrator.</span>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 rounded-2xl bg-error/10 border border-error/30 text-error text-xs flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Email / Password Form */}
      <form onSubmit={handleEmailSubmit} className="space-y-4 relative z-10">
        <div className="space-y-1.5">
          <label className="block text-xs font-label-caps text-on-surface-variant uppercase">
            Login Email
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="jeevan@gmail.com"
            className="w-full form-input px-4 py-3 text-white text-sm"
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <label className="block text-xs font-label-caps text-on-surface-variant uppercase">
              Password
            </label>
            <Link
              href="/forgot-password"
              className="text-xs text-primary hover:underline font-label-caps"
            >
              Forgot password?
            </Link>
          </div>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full form-input px-4 py-3 text-white text-sm"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 rounded-full bg-primary text-[#003734] font-bold text-sm hover:shadow-[0_0_25px_rgba(95,243,232,0.5)] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <>
              <LogIn className="w-4 h-4" />
              <span>Enter Portal</span>
            </>
          )}
        </button>
      </form>

      {/* Google Login Separator */}
      <div className="relative my-6 text-center">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-white/10"></div>
        </div>
        <span className="relative bg-[#111111] px-4 text-xs font-label-caps text-on-surface-variant uppercase">
          Or continue with
        </span>
      </div>

      {/* Google Sign In Button */}
      <button
        onClick={handleGoogleSignIn}
        disabled={loading}
        className="w-full py-3 rounded-full bg-[#111111] border border-white/20 text-white font-medium text-xs hover:border-primary hover:bg-white/5 transition-all flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
          />
          <path
            fill="#34A853"
            d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"
          />
          <path
            fill="#FBBC05"
            d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
          />
          <path
            fill="#EA4335"
            d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
          />
        </svg>
        <span>Sign In with Google</span>
      </button>

      {/* Quick Fill Credentials */}
      <div className="mt-8 pt-6 border-t border-white/10 text-center space-y-2">
        <p className="text-[11px] font-label-caps text-[#859491] uppercase flex items-center justify-center gap-1">
          <Sparkles className="w-3 h-3 text-primary" /> Test Account Autofill
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleFillAdmin}
            className="flex-1 py-2 px-3 bg-primary/10 border border-primary/30 rounded-xl text-primary font-label-caps text-[10px] hover:bg-primary hover:text-black transition-all cursor-pointer"
          >
            Admin (Jeevan)
          </button>
          <button
            type="button"
            onClick={handleFillMember}
            className="flex-1 py-2 px-3 bg-secondary/10 border border-secondary/30 rounded-xl text-secondary font-label-caps text-[10px] hover:bg-secondary hover:text-black transition-all cursor-pointer"
          >
            Member (Praveen)
          </button>
        </div>
      </div>
    </div>
  );
};
