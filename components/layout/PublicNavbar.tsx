"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/firebase/authContext";

export const PublicNavbar: React.FC = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const { memberProfile } = useAuth();

  return (
    <>
      <header className="fixed top-0 w-full z-50 px-margin-mobile md:px-margin-desktop py-6 flex justify-between items-center pointer-events-none">
        {/* Brand Logo Pill */}
        <Link
          href="/"
          className="pointer-events-auto bg-[#111111] border border-white/20 rounded-full px-6 py-2 flex items-center gap-1 hover:border-primary hover:shadow-[0_0_20px_rgba(95,243,232,0.3)] transition-all animate-float"
        >
          <span className="font-display text-[22px] md:text-[24px] text-[#F5F5F5] font-bold">
            Diseño
          </span>
          <span className="font-display text-[22px] md:text-[24px] text-primary font-bold">
            Divino.
          </span>
        </Link>

        {/* Action Controls */}
        <div className="flex items-center gap-3 pointer-events-auto">
          {memberProfile ? (
            <Link
              href="/dashboard"
              className="hidden sm:inline-flex items-center gap-2 bg-primary/10 border border-primary/40 text-primary px-5 py-2 rounded-full font-label-caps text-xs hover:bg-primary hover:text-black transition-all"
            >
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
              Portal Dashboard
            </Link>
          ) : (
            <Link
              href="/login"
              className="hidden sm:inline-flex items-center gap-2 bg-[#111111] border border-white/20 text-[#dde4e2] px-5 py-2 rounded-full font-label-caps text-xs hover:border-primary hover:text-primary transition-all"
            >
              Member Login
            </Link>
          )}

          {/* Hamburger Trigger */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="w-12 h-12 rounded-full bg-[#111111] border border-white/20 flex flex-col justify-center items-center gap-1.5 hover:border-primary hover:shadow-[0_0_20px_rgba(95,243,232,0.3)] hover:bg-primary/10 transition-all group z-50 animate-float cursor-pointer"
            aria-label="Toggle navigation menu"
          >
            <div
              className={`w-5 h-[2px] bg-[#F5F5F5] group-hover:bg-primary transition-all ${
                menuOpen ? "rotate-45 translate-y-[4px]" : ""
              }`}
            ></div>
            <div
              className={`w-5 h-[2px] bg-[#F5F5F5] group-hover:bg-primary transition-all ${
                menuOpen ? "-rotate-45 -translate-y-[4px]" : ""
              }`}
            ></div>
          </button>
        </div>
      </header>

      {/* Fullscreen Navigation Overlay with Tilted Pills */}
      <div
        className={`fixed inset-0 bg-[#050505]/95 backdrop-blur-xl z-40 transition-all duration-500 flex flex-col items-center justify-center ${
          menuOpen ? "opacity-100 visible" : "opacity-0 invisible pointer-events-none"
        }`}
      >
        <nav className="flex flex-col gap-5 items-center max-w-sm w-full px-6">
          <Link
            onClick={() => setMenuOpen(false)}
            href="/"
            className="nav-pill w-full bg-[#111111] border border-white/20 rounded-[40px] px-10 py-5 text-[#F5F5F5] font-headline text-2xl text-center hover:text-primary"
          >
            Home
          </Link>
          <Link
            onClick={() => setMenuOpen(false)}
            href="/#about"
            className="nav-pill w-full bg-[#111111] border border-white/20 rounded-[40px] px-10 py-5 text-[#F5F5F5] font-headline text-2xl text-center hover:text-primary"
          >
            About
          </Link>
          <Link
            onClick={() => setMenuOpen(false)}
            href="/#domains"
            className="nav-pill w-full bg-[#111111] border border-white/20 rounded-[40px] px-10 py-5 text-[#F5F5F5] font-headline text-2xl text-center hover:text-primary"
          >
            Domains
          </Link>
          <Link
            onClick={() => setMenuOpen(false)}
            href="/#events"
            className="nav-pill w-full bg-[#111111] border border-white/20 rounded-[40px] px-10 py-5 text-[#F5F5F5] font-headline text-2xl text-center hover:text-primary"
          >
            Events
          </Link>
          <Link
            onClick={() => setMenuOpen(false)}
            href="/#team"
            className="nav-pill w-full bg-[#111111] border border-white/20 rounded-[40px] px-10 py-5 text-[#F5F5F5] font-headline text-2xl text-center hover:text-primary"
          >
            Team
          </Link>
          <Link
            onClick={() => setMenuOpen(false)}
            href="/#join"
            className="nav-pill w-full bg-primary/20 border border-primary/50 text-primary rounded-[40px] px-10 py-5 font-headline text-2xl text-center hover:bg-primary hover:text-black"
          >
            Join Club
          </Link>

          <div className="pt-4 flex gap-4 w-full justify-center">
            {memberProfile ? (
              <Link
                onClick={() => setMenuOpen(false)}
                href="/dashboard"
                className="w-full text-center py-3 bg-primary text-black font-bold rounded-full font-label-caps"
              >
                Go to Portal →
              </Link>
            ) : (
              <Link
                onClick={() => setMenuOpen(false)}
                href="/login"
                className="w-full text-center py-3 bg-[#161d1c] border border-white/20 text-[#dde4e2] font-medium rounded-full font-label-caps hover:border-primary"
              >
                Member Login
              </Link>
            )}
          </div>
        </nav>
      </div>
    </>
  );
};
