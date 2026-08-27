import React from "react";
import { Sparkles, Compass, Cpu, Zap, Eye, Boxes } from "lucide-react";

export const About: React.FC = () => {
  return (
    <section id="about" className="py-24 px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto relative z-10">
      <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
        <span className="font-label-caps text-xs text-primary tracking-widest uppercase bg-primary/10 px-4 py-1.5 rounded-full border border-primary/20">
          Our Philosophy
        </span>
        <h2 className="font-display text-4xl sm:text-5xl md:text-6xl font-bold text-white tracking-tight">
          Where Design Meets Code.
        </h2>
        <p className="font-body text-base sm:text-lg text-on-surface-variant leading-relaxed">
          Diseño Divino is a multidisciplinary creative hub uniting designers, engineers, and digital artists. We break boundaries between aesthetic intuition and technical architecture.
        </p>
      </div>

      {/* Bento Grid Architecture */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Card 1: Atmospheric Depth */}
        <div className="md:col-span-8 glass-card rounded-3xl p-8 sm:p-10 relative overflow-hidden group glow-hover min-h-[300px] flex flex-col justify-between">
          <div className="absolute -right-16 -top-16 w-60 h-60 bg-primary/15 rounded-full blur-3xl pointer-events-none group-hover:scale-125 transition-transform duration-700"></div>
          <div>
            <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center text-primary mb-6">
              <Boxes className="w-6 h-6" />
            </div>
            <h3 className="font-display text-2xl sm:text-3xl font-bold text-white mb-3">
              Atmospheric & Spatial Depth
            </h3>
            <p className="font-body text-on-surface-variant text-base sm:text-lg max-w-xl leading-relaxed">
              We pioneer dark-mode-first experiences enriched by optical layering, generative 3D spheres, glassmorphic surfaces, and luminous high-saturation phosphors.
            </p>
          </div>
          <div className="mt-8 flex flex-wrap gap-2 text-xs font-label-caps text-primary">
            <span className="bg-[#111111] px-3 py-1.5 rounded-full border border-white/10">#ThreeJS</span>
            <span className="bg-[#111111] px-3 py-1.5 rounded-full border border-white/10">#Glassmorphism</span>
            <span className="bg-[#111111] px-3 py-1.5 rounded-full border border-white/10">#NextJS</span>
          </div>
        </div>

        {/* Card 2: Micro-Interactions */}
        <div className="md:col-span-4 glass-card rounded-3xl p-8 relative overflow-hidden group glow-hover min-h-[300px] flex flex-col justify-between">
          <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-secondary/20 rounded-full blur-2xl pointer-events-none"></div>
          <div>
            <div className="w-12 h-12 rounded-2xl bg-secondary/10 border border-secondary/30 flex items-center justify-center text-secondary mb-6">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="font-display text-2xl font-bold text-white mb-3">
              Micro-Interactions
            </h3>
            <p className="font-body text-on-surface-variant text-sm leading-relaxed">
              Every button, navigation pill, and card reacts organically to your cursor, touch impulse, and viewport motion.
            </p>
          </div>
          <div className="mt-6 text-xs font-label-caps text-secondary">
            <span>Fluid Physics & Spring Curves</span>
          </div>
        </div>

        {/* Card 3: Collaborative Domains */}
        <div className="md:col-span-4 glass-card rounded-3xl p-8 relative overflow-hidden group glow-hover min-h-[260px] flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-tertiary-container/10 border border-tertiary-container/30 flex items-center justify-center text-tertiary mb-6">
              <Compass className="w-6 h-6" />
            </div>
            <h3 className="font-display text-2xl font-bold text-white mb-3">
              6 Specialized Domains
            </h3>
            <p className="font-body text-on-surface-variant text-sm leading-relaxed">
              From UI/UX research to full-stack WebGL development, brand identity, social campaigns, sponsorships, and operations.
            </p>
          </div>
        </div>

        {/* Card 4: Open Sourced & Community Led */}
        <div className="md:col-span-8 glass-card rounded-3xl p-8 sm:p-10 relative overflow-hidden group glow-hover min-h-[260px] flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center text-primary mb-6">
                <Cpu className="w-6 h-6" />
              </div>
              <h3 className="font-display text-2xl sm:text-3xl font-bold text-white mb-2">
                Production-Ready Craftsmanship
              </h3>
              <p className="font-body text-on-surface-variant text-base max-w-xl">
                We don&apos;t just build prototypes. Our members ship live products, design systems, and real-world campus platforms.
              </p>
            </div>
            <div className="bg-[#111111] p-6 rounded-2xl border border-white/10 text-center shrink-0 w-full sm:w-48">
              <span className="font-display text-3xl font-bold text-primary block">2026</span>
              <span className="text-xs text-on-surface-variant">Active Season</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
