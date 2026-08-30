import React from "react";
import { Palette, Code2, Mic2, Users } from "lucide-react";

export const About: React.FC = () => {
  return (
    <section
      id="about"
      className="py-24 px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto relative z-10"
    >
      {/* Section Heading */}
      <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
        <span className="font-label-caps text-xs text-primary tracking-widest uppercase bg-primary/10 px-4 py-1.5 rounded-full border border-primary/20">
          Who We Are
        </span>

        <h2 className="font-display text-4xl sm:text-5xl md:text-6xl font-bold text-white tracking-tight">
          About Diseño Divino
        </h2>
      </div>

      {/* Our Story */}
      <div className="glass-card rounded-3xl p-8 sm:p-10 md:p-12 border border-white/10 mb-8 relative overflow-hidden group glow-hover">
        {/* Background Glow */}
        <div className="absolute -right-20 -top-20 w-72 h-72 bg-primary/10 rounded-full blur-3xl pointer-events-none group-hover:scale-125 transition-transform duration-700" />

        <div className="relative z-10 max-w-4xl">
          <span className="font-label-caps text-xs text-primary tracking-widest uppercase">
            Our Story
          </span>

          <h3 className="font-display text-3xl sm:text-4xl font-bold text-white mt-4 mb-6">
            Creativity, Collaboration & Learning
          </h3>

          <div className="space-y-5">
            <p className="font-body text-base sm:text-lg text-on-surface-variant leading-relaxed">
              Diseño Divino is a student-led organization dedicated to
              fostering a vibrant community of designers, artists, and
              developers. We believe in the power of collaboration and
              hands-on learning to push the boundaries of digital creativity.
            </p>

            <p className="font-body text-base sm:text-lg text-on-surface-variant leading-relaxed">
              Our goal is to provide a platform for students to grow their
              skills, connect with peers, and prepare for a career in the
              creative industries.
            </p>
          </div>
        </div>
      </div>

      {/* What We Do */}
      <div className="mt-16">
        <div className="text-center mb-10">
          <span className="font-label-caps text-xs text-primary tracking-widest uppercase">
            What We Do?
          </span>

          <h3 className="font-display text-3xl sm:text-4xl font-bold text-white mt-3">
            Learn. Create. Collaborate.
          </h3>
        </div>

        {/* Activity Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Design Workshops */}
          <div className="glass-card rounded-3xl p-8 border border-white/10 relative overflow-hidden group glow-hover">
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-primary/10 rounded-full blur-3xl pointer-events-none group-hover:scale-125 transition-transform duration-700" />

            <div className="relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center text-primary mb-6">
                <Palette className="w-6 h-6" />
              </div>

              <h4 className="font-display text-2xl font-bold text-white mb-3">
                Design Workshops
              </h4>

              <p className="font-body text-on-surface-variant text-base leading-relaxed">
                Hands-on sessions covering UI/UX, graphic design, and 3D
                modeling.
              </p>
            </div>
          </div>

          {/* Creative Coding */}
          <div className="glass-card rounded-3xl p-8 border border-white/10 relative overflow-hidden group glow-hover">
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-secondary/10 rounded-full blur-3xl pointer-events-none group-hover:scale-125 transition-transform duration-700" />

            <div className="relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-secondary/10 border border-secondary/30 flex items-center justify-center text-secondary mb-6">
                <Code2 className="w-6 h-6" />
              </div>

              <h4 className="font-display text-2xl font-bold text-white mb-3">
                Creative Coding
              </h4>

              <p className="font-body text-on-surface-variant text-base leading-relaxed">
                Explore the intersection of art and technology with generative
                art and interactive projects.
              </p>
            </div>
          </div>

          {/* Industry Talks */}
          <div className="glass-card rounded-3xl p-8 border border-white/10 relative overflow-hidden group glow-hover">
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl pointer-events-none group-hover:scale-125 transition-transform duration-700" />

            <div className="relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-400/30 flex items-center justify-center text-purple-300 mb-6">
                <Mic2 className="w-6 h-6" />
              </div>

              <h4 className="font-display text-2xl font-bold text-white mb-3">
                Industry Talks
              </h4>

              <p className="font-body text-on-surface-variant text-base leading-relaxed">
                Learn from professionals who are leading and shaping the
                design industry.
              </p>
            </div>
          </div>

          {/* Collaborative Projects */}
          <div className="glass-card rounded-3xl p-8 border border-white/10 relative overflow-hidden group glow-hover">
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-cyan-400/10 rounded-full blur-3xl pointer-events-none group-hover:scale-125 transition-transform duration-700" />

            <div className="relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-cyan-400/10 border border-cyan-400/30 flex items-center justify-center text-cyan-300 mb-6">
                <Users className="w-6 h-6" />
              </div>

              <h4 className="font-display text-2xl font-bold text-white mb-3">
                Collaborative Projects
              </h4>

              <p className="font-body text-on-surface-variant text-base leading-relaxed">
                Team up to build real-world projects, honing your skills and
                building your portfolio.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};