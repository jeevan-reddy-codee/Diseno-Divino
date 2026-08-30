import React from "react";
import Link from "next/link";

export const Footer: React.FC = () => {
  return (
    <footer className="w-full border-t border-white/10 bg-[#050505] relative z-10 py-12 px-margin-mobile md:px-margin-desktop">
      <div className="max-w-container-max mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
        <div className="flex flex-col items-center md:items-start gap-2">
          <Link href="/" className="flex items-center gap-1">
            <span className="font-display text-2xl text-white font-bold">
              Diseño <span className="text-primary">Divino.</span>
            </span>
          </Link>
          <p className="text-xs text-on-surface-variant max-w-sm text-center md:text-left">
            The Official UI/UX & Creative Technology Club. Crafting next-generation digital interfaces, generative 3D web, and empowering creators.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-6 sm:gap-8 text-xs font-label-caps text-on-surface-variant">
          <Link href="/#about" className="hover:text-primary transition-colors">
            About Club
          </Link>
          <Link href="/#domains" className="hover:text-primary transition-colors">
            Domains
          </Link>
          <Link href="/rsvp" className="text-[#fed488] hover:text-white transition-colors">
            Register for Events ✨
          </Link>
          <Link href="/#team" className="hover:text-primary transition-colors">
            Core Team
          </Link>
          <Link href="/register" className="hover:text-primary transition-colors">
            Create Account
          </Link>
          <Link href="/login" className="text-primary hover:underline">
            Member Portal
          </Link>
        </div>

        <div className="text-xs text-[#71717a] text-center md:text-right">
          <p>© {new Date().getFullYear()} Diseño Divino.</p>
          <p className="text-[10px] mt-0.5">Crafted with Neo-Brutalist Minimalism & High-Energy Glows.</p>
        </div>
      </div>
    </footer>
  );
};
