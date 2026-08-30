"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/firebase/authContext";
import { UserPlus, LogIn, AlertCircle } from "lucide-react";

export const RegisterForm: React.FC = () => {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { memberProfile, signUpWithEmail, signInWithGoogle } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (memberProfile && memberProfile.status === "active") {
      router.push("/dashboard");
    }
  }, [memberProfile, router]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!fullName.trim() || !email.trim() || !password) {
      setError("Please complete all required fields.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters in length.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match. Please re-enter.");
      return;
    }

    setLoading(true);
    const res = await signUpWithEmail(fullName.trim(), email.trim(), password);
    setLoading(false);

    if (res.success) {
      router.push("/dashboard");
    } else {
      setError(res.error || "Failed to create account.");
    }
  };

  const handleGoogleSignUp = async () => {
    setError(null);
    setLoading(true);
    const res = await signInWithGoogle();
    setLoading(false);

    if (res.success) {
      router.push("/dashboard");
    } else {
      setError(res.error || "Google Sign-In failed.");
    }
  };

  return (
    <div className="card-glow-wrapper relative w-full max-w-[480px] mx-auto bg-[#111111]/80 backdrop-blur-2xl border border-white/15 rounded-[32px] p-8 md:p-10 shadow-[0_0_50px_rgba(0,0,0,0.6)]">
      {/* Background Subtle Ambience */}
      <div className="absolute -top-24 -left-24 w-60 h-60 bg-[#4bfcde]/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-60 h-60 bg-[#c5a059]/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Top Home Navigation Bar */}
      <div className="flex justify-between items-center mb-6 pb-4 border-b border-white/10 relative z-10">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#94A3B8] hover:text-[#4bfcde] transition-colors group"
          title="Return to Home Page"
        >
          <span className="material-symbols-outlined text-sm group-hover:-translate-x-1 transition-transform">
            arrow_back
          </span>
          <span>Back to Home</span>
        </Link>

        <Link
          href="/"
          className="px-3 py-1 rounded-full bg-white/5 border border-white/15 text-xs font-mono text-[#4bfcde] hover:bg-[#4bfcde] hover:text-black transition-all"
        >
          Home
        </Link>
      </div>

      {/* Brand & Header Anchor */}
      <div className="text-center mb-8 relative z-10">
        <Link href="/" className="inline-block mb-3 hover:opacity-90 transition-opacity" title="Diseño Divino Home">
          <h1 className="font-display text-3xl font-bold text-white tracking-tight">
            Diseño <span className="text-[#4bfcde]">Divino.</span>
          </h1>
        </Link>
        <h2 className="font-display text-2xl font-bold text-white mb-2">Create Account</h2>
        <p className="text-xs text-[#94A3B8] font-sans">
          Join the internal portal and event workspace.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Signup Form */}
      <form onSubmit={handleRegister} className="space-y-4 relative z-10">
        {/* Full Name Field */}
        <div>
          <label
            className="block text-xs uppercase tracking-wider font-semibold text-[#bacac5] mb-1.5"
            htmlFor="fullName"
          >
            Full Name
          </label>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#94A3B8] text-lg select-none">
              person
            </span>
            <input
              id="fullName"
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your Full Name"
              className="w-full bg-[#1b1b1b]/80 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white text-sm placeholder:text-[#94A3B8]/40 focus:outline-none focus:border-[#4bfcde] focus:ring-1 focus:ring-[#4bfcde] transition-all"
            />
          </div>
        </div>

        {/* Email Field */}
        <div>
          <label
            className="block text-xs uppercase tracking-wider font-semibold text-[#bacac5] mb-1.5"
            htmlFor="email"
          >
            Email Address
          </label>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#94A3B8] text-lg select-none">
              mail
            </span>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full bg-[#1b1b1b]/80 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white text-sm placeholder:text-[#94A3B8]/40 focus:outline-none focus:border-[#4bfcde] focus:ring-1 focus:ring-[#4bfcde] transition-all"
            />
          </div>
        </div>

        {/* Password Field */}
        <div>
          <label
            className="block text-xs uppercase tracking-wider font-semibold text-[#bacac5] mb-1.5"
            htmlFor="password"
          >
            Password
          </label>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#94A3B8] text-lg select-none">
              lock
            </span>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-[#1b1b1b]/80 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white text-sm placeholder:text-[#94A3B8]/40 focus:outline-none focus:border-[#4bfcde] focus:ring-1 focus:ring-[#4bfcde] transition-all"
            />
          </div>
        </div>

        {/* Confirm Password Field */}
        <div>
          <label
            className="block text-xs uppercase tracking-wider font-semibold text-[#bacac5] mb-1.5"
            htmlFor="confirmPassword"
          >
            Confirm Password
          </label>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#94A3B8] text-lg select-none">
              lock_reset
            </span>
            <input
              id="confirmPassword"
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-[#1b1b1b]/80 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white text-sm placeholder:text-[#94A3B8]/40 focus:outline-none focus:border-[#4bfcde] focus:ring-1 focus:ring-[#4bfcde] transition-all"
            />
          </div>
        </div>

        {/* Primary Action Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full mt-6 bg-[#4bfcde] text-[#00382f] font-bold text-xs uppercase tracking-widest py-3.5 rounded-xl hover:shadow-[0_0_25px_rgba(75,252,222,0.5)] hover:bg-white transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-[#00382f] border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <>
              <UserPlus className="w-4 h-4" />
              <span>Create Account</span>
            </>
          )}
        </button>
      </form>

      {/* Divider */}
      <div className="my-6 flex items-center gap-4 relative z-10">
        <div className="flex-1 h-px bg-white/10"></div>
        <span className="text-[11px] font-mono text-[#94A3B8] uppercase tracking-widest">
          Or continue with
        </span>
        <div className="flex-1 h-px bg-white/10"></div>
      </div>

      {/* Social Action (Google) */}
      <button
        onClick={handleGoogleSignUp}
        type="button"
        disabled={loading}
        className="w-full bg-[#1b1b1b]/60 border border-white/15 text-white text-xs font-medium py-3.5 rounded-xl hover:bg-white/10 hover:border-[#4bfcde] transition-all flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50 relative z-10"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
        <span>Sign up with Google</span>
      </button>

      {/* Login Link */}
      <p className="mt-6 text-center text-xs text-[#94A3B8] relative z-10">
        Already have an account?{" "}
        <Link
          href="/login"
          className="text-[#4bfcde] hover:text-white hover:underline transition-colors ml-1 font-semibold"
        >
          Log in
        </Link>
      </p>
    </div>
  );
};
