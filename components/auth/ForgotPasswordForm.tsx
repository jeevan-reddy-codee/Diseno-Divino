"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/firebase/authContext";
import { Mail, CheckCircle2, AlertCircle, ArrowLeft } from "lucide-react";

export const ForgotPasswordForm: React.FC = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { resetPassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email.trim()) {
      setError("Please enter your registered email address.");
      return;
    }

    setLoading(true);
    const res = await resetPassword(email.trim());
    setLoading(false);

    if (res.success) {
      setSent(true);
    } else {
      setError(res.error || "Could not send reset email. Please try again.");
    }
  };

  return (
    <div className="w-full max-w-md mx-auto glass-card-heavy rounded-3xl p-8 sm:p-10 relative overflow-hidden border border-white/15 shadow-[0_0_50px_rgba(95,243,232,0.15)]">
      {/* Ambience */}
      <div className="absolute -top-20 -right-20 w-60 h-60 bg-primary/20 rounded-full blur-[90px] pointer-events-none" />

      <div className="text-center mb-8 space-y-2 relative z-10">
        <Link href="/" className="inline-block mb-2">
          <span className="font-display text-2xl font-bold text-white">
            Diseño <span className="text-primary">Divino.</span>
          </span>
        </Link>
        <h1 className="font-display text-3xl font-bold text-white">Reset Password</h1>
        <p className="font-body text-xs text-on-surface-variant">
          Enter your registered member email to receive password reset instructions.
        </p>
      </div>

      {sent ? (
        <div className="text-center space-y-6 relative z-10">
          <div className="w-16 h-16 rounded-full bg-primary/15 border border-primary/40 flex items-center justify-center text-primary mx-auto">
            <CheckCircle2 className="w-8 h-8 text-primary" />
          </div>

          <div className="space-y-2">
            <h3 className="font-display text-xl font-bold text-white">
              Reset Link Dispatched
            </h3>
            <p className="font-body text-xs text-on-surface-variant leading-relaxed">
              We&apos;ve sent a password reset link to <strong className="text-primary">{email}</strong>. Check your inbox and spam folder, then follow the instructions.
            </p>
          </div>

          <Link
            href="/login"
            className="w-full py-3.5 rounded-full bg-primary text-[#003734] font-bold text-sm hover:shadow-[0_0_20px_rgba(95,243,232,0.4)] transition-all inline-flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Login</span>
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
          {error && (
            <div className="p-4 rounded-2xl bg-error/10 border border-error/30 text-error text-xs flex items-center gap-3">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="block text-xs font-label-caps text-on-surface-variant uppercase">
              Member Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="alex@disenodivino.org"
              className="w-full form-input px-4 py-3 text-white text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-full bg-primary text-[#003734] font-bold text-sm hover:shadow-[0_0_25px_rgba(95,243,232,0.5)] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <Mail className="w-4 h-4" />
                <span>Send Reset Link</span>
              </>
            )}
          </button>

          <div className="text-center pt-2">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-xs text-on-surface-variant hover:text-primary transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Login</span>
            </Link>
          </div>
        </form>
      )}
    </div>
  );
};
