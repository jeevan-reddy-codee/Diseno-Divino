"use client";

import React from "react";
import Link from "next/link";
import {
  Layout,
  Code,
  Brush,
  Share2,
  Megaphone,
  Workflow,
  ArrowUpRight,
} from "lucide-react";
import { DomainType } from "@/types/joinRequest";

interface DomainCardInfo {
  title: DomainType;
  description: string;
  icon: any;
  color: string;
  borderColor: string;
  glowClass: string;
  tags: string[];
}

const DOMAINS: DomainCardInfo[] = [
  {
    title: "UI/UX",
    description:
      "Crafting intuitive user journeys, wireframes, high-fidelity prototypes, and cohesive design systems with micro-animations.",
    icon: Layout,
    color: "text-primary",
    borderColor: "border-primary/40",
    glowClass: "group-hover:shadow-[0_0_35px_rgba(95,243,232,0.3)]",
    tags: ["Figma", "Design Systems", "Prototyping", "UX Research"],
  },
  {
    title: "Tech",
    description:
      "Engineering full-stack web applications, interactive WebGL shaders, Three.js 3D physics, and scalable cloud architectures.",
    icon: Code,
    color: "text-secondary",
    borderColor: "border-secondary/40",
    glowClass: "group-hover:shadow-[0_0_35px_rgba(210,187,255,0.3)]",
    tags: ["Next.js", "TypeScript", "Three.js", "Firebase", "Tailwind"],
  },
  {
    title: "Graphics",
    description:
      "3D spatial art, brand visual identities, generative illustrations, motion design, and event poster design.",
    icon: Brush,
    color: "text-[#ffd6ad]",
    borderColor: "border-[#ffb156]/40",
    glowClass: "group-hover:shadow-[0_0_35px_rgba(255,177,86,0.3)]",
    tags: ["Blender", "Spline", "After Effects", "Brand Identity"],
  },
  {
    title: "Social Media",
    description:
      "Storytelling, content strategy, reels, and digital engagement across YouTube, Instagram, and Discord.",
    icon: Share2,
    color: "text-primary",
    borderColor: "border-primary/40",
    glowClass: "group-hover:shadow-[0_0_35px_rgba(95,243,232,0.3)]",
    tags: ["Content Strategy", "Video Production", "Community"],
  },
  {
    title: "PR / Marketing & Sponsorship",
    description:
      "Building strategic industry partnerships, sponsorship pitches, student outreach, and public relations.",
    icon: Megaphone,
    color: "text-secondary",
    borderColor: "border-secondary/40",
    glowClass: "group-hover:shadow-[0_0_35px_rgba(210,187,255,0.3)]",
    tags: ["Sponsorship", "Outreach", "Press", "Partnerships"],
  },
  {
    title: "Operations",
    description:
      "Managing event execution, venue logistics, technical setups, hackathon management, and team alignment.",
    icon: Workflow,
    color: "text-[#ffd6ad]",
    borderColor: "border-[#ffb156]/40",
    glowClass: "group-hover:shadow-[0_0_35px_rgba(255,177,86,0.3)]",
    tags: ["Hackathon Ops", "Venue Logistics", "Event Coordination"],
  },
];

export const WhatWeDo: React.FC = () => {
  return (
    <section id="domains" className="py-24 px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto relative z-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 gap-6">
        <div>
          <span className="font-label-caps text-xs text-primary tracking-widest uppercase bg-primary/10 px-4 py-1.5 rounded-full border border-primary/20">
            Specializations
          </span>
          <h2 className="font-display text-4xl sm:text-5xl font-bold text-white mt-4">
            Our 6 Creative Domains
          </h2>
          <p className="font-body text-base text-on-surface-variant max-w-xl mt-2">
            Find your focus or collaborate across disciplines. Every domain operates in synergy to produce world-class digital experiences.
          </p>
        </div>

        <Link
          href="#join"
          className="btn-primary shrink-0"
        >
          Apply for a Domain →
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {DOMAINS.map((domain) => {
          const Icon = domain.icon;
          return (
            <div
              key={domain.title}
              className={`glass-card rounded-3xl p-8 flex flex-col justify-between group transition-all duration-300 hover:-translate-y-1.5 border border-white/10 ${domain.glowClass}`}
            >
              <div>
                <div className="flex justify-between items-start mb-6">
                  <div className={`w-14 h-14 rounded-2xl bg-[#111111] border ${domain.borderColor} flex items-center justify-center ${domain.color}`}>
                    <Icon className="w-7 h-7" />
                  </div>
                  <Link
                    href={`#join`}
                    className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/60 group-hover:text-primary group-hover:bg-primary/10 transition-colors"
                    aria-label={`Apply for ${domain.title}`}
                  >
                    <ArrowUpRight className="w-5 h-5" />
                  </Link>
                </div>

                <h3 className="font-display text-2xl font-bold text-white mb-2 group-hover:text-primary transition-colors">
                  {domain.title}
                </h3>
                <p className="font-body text-sm text-on-surface-variant leading-relaxed mb-6">
                  {domain.description}
                </p>
              </div>

              <div className="flex flex-wrap gap-2 pt-4 border-t border-white/10">
                {domain.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-[11px] font-label-caps bg-[#111111] px-3 py-1 rounded-full text-[#bbcac7] border border-white/5"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
