"use client";

import React, { useState, useEffect, useRef } from "react";
import { Member } from "@/types/member";
import { getActiveMembers } from "@/lib/services/memberService";
import { SEED_MEMBERS } from "@/lib/services/seedData";
import {
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Crown,
  Github,
  Linkedin,
  Globe,
  Layers,
} from "lucide-react";

/**
 * Clean member display name by removing parenthetical suffixes like "(President)", "(Lead)", etc.
 */
function formatMemberName(name: string): string {
  if (!name) return "";
  return name.replace(/\s*\([^)]*\)/g, "").trim();
}

/**
 * Determine a clean, editorial uppercase role title
 */
function formatMemberRole(member: Member): string {
  if (member.role === "president") return "PRESIDENT";
  if (member.designation) return member.designation.toUpperCase();
  if (member.role === "lead") return `${member.domain.toUpperCase()} LEAD`;
  if (member.role === "admin") return "DESIGN LEAD";
  return "CORE MEMBER";
}

/**
 * Extract 2-letter uppercase initials for avatar fallback
 */
function getInitials(name: string): string {
  const cleaned = formatMemberName(name);
  const parts = cleaned.split(" ").filter(Boolean);
  if (parts.length === 0) return "DD";
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const DOMAIN_FILTERS = [
  "All",
  "UI/UX",
  "Tech",
  "Graphics",
  "Social Media",
  "PR / Marketing & Sponsorship",
  "Operations",
] as const;

export const Team: React.FC = () => {
  const [members, setMembers] = useState<Member[]>(SEED_MEMBERS);
  const [selectedDomain, setSelectedDomain] = useState<string>("All");
  const [canScrollLeft, setCanScrollLeft] = useState<boolean>(false);
  const [canScrollRight, setCanScrollRight] = useState<boolean>(true);
  const [scrollProgress, setScrollProgress] = useState<number>(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getActiveMembers()
      .then((data) => {
        if (data && data.length > 0) {
          setMembers(data);
        }
      })
      .catch((err) => {
        console.warn("Could not load active members from Firestore:", err);
      });
  }, []);

  // Separate President from supporting members
  const president =
    members.find((m) => m.role === "president") ||
    members.find((m) => m.name.toLowerCase().includes("president")) ||
    members[0];

  const supportingMembers = members.filter((m) => m.uid !== president?.uid);

  // Filter supporting members by selected domain
  const filteredSupportingMembers =
    selectedDomain === "All"
      ? supportingMembers
      : supportingMembers.filter((m) =>
          m.domain.toLowerCase().includes(selectedDomain.toLowerCase())
        );

  // Gradient styles for supporting avatar rings
  const avatarGradients = [
    "from-primary via-secondary to-tertiary",
    "from-secondary via-primary to-cyan-bright",
    "from-tertiary via-secondary to-primary",
    "from-cyan-bright via-primary to-secondary",
    "from-secondary via-tertiary to-primary",
    "from-primary via-cyan-bright to-secondary",
  ];

  // Update scroll navigation states
  const checkScroll = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    const maxScroll = scrollWidth - clientWidth;
    setScrollProgress(maxScroll > 0 ? (scrollLeft / maxScroll) * 100 : 0);
  };

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    checkScroll();
    el.addEventListener("scroll", checkScroll, { passive: true });
    window.addEventListener("resize", checkScroll);
    return () => {
      el.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
    };
  }, [filteredSupportingMembers]);

  const handleScroll = (direction: "left" | "right") => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const scrollAmount = Math.min(el.clientWidth * 0.8, 380);
    el.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  return (
    <section
      id="team"
      className="py-24 px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto relative z-10 overflow-hidden"
    >
      {/* Ambient Lighting Background Accents */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-primary/10 rounded-full blur-[140px] pointer-events-none -z-10" />
      <div className="absolute bottom-10 right-10 w-[400px] h-[300px] bg-secondary/10 rounded-full blur-[120px] pointer-events-none -z-10" />

      {/* Section Header */}
      <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
        <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/25 px-4 py-1.5 rounded-full shadow-[0_0_20px_rgba(95,243,232,0.15)]">
          <Sparkles className="w-3.5 h-3.5 text-primary" />
          <span className="font-label-caps text-xs text-primary tracking-[0.25em] uppercase font-bold">
            The People & Collective
          </span>
        </div>

        <h2 className="font-display text-4xl sm:text-5xl md:text-6xl font-bold text-white tracking-tight">
          Meet Our Team
        </h2>

        <p className="font-body text-base sm:text-lg text-on-surface-variant max-w-xl mx-auto leading-relaxed">
          The creative minds, engineers, and visionaries behind every pixel, event, and experience at Diseño Divino.
        </p>
      </div>

      {/* FEATURED MEMBER: PRESIDENT */}
      {president && (
        <div className="mb-20">
          <div className="relative max-w-3xl mx-auto">
            {/* Glow Halo behind President Card */}
            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-secondary/15 to-tertiary/20 rounded-[2.5rem] blur-2xl -z-10 opacity-70 transform scale-105" />

            <div className="rounded-[2.5rem] border border-primary/30 bg-[#0e1514]/85 backdrop-blur-2xl p-8 sm:p-12 shadow-[0_16px_48px_rgba(0,0,0,0.5),0_0_40px_rgba(95,243,232,0.12)] relative overflow-hidden group">
              {/* Corner Watermark / Accent Badge */}
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-gradient-to-br from-primary/15 to-transparent rounded-full blur-xl pointer-events-none" />

              <div className="flex flex-col md:flex-row items-center gap-8 md:gap-10 text-center md:text-left">
                {/* Large Featured Avatar */}
                <div className="relative shrink-0">
                  <div className="w-32 h-32 sm:w-36 sm:h-36 rounded-full p-1.5 bg-gradient-to-tr from-primary via-secondary to-[#ffd6ad] shadow-[0_0_35px_rgba(95,243,232,0.35)] transition-transform duration-500 group-hover:scale-105">
                    <div className="w-full h-full bg-[#090f0f] rounded-full flex items-center justify-center overflow-hidden">
                      {president.avatarUrl ? (
                        <img
                          src={president.avatarUrl}
                          alt={formatMemberName(president.name)}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="font-display text-3xl sm:text-4xl font-extrabold text-white tracking-wider">
                          {getInitials(president.name)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Crown / Leadership Badge */}
                  <div
                    className="absolute -bottom-2 -right-1 bg-gradient-to-tr from-primary to-secondary p-2 rounded-full shadow-lg border-2 border-[#0e1514]"
                    title="Club President"
                  >
                    <Crown className="w-4 h-4 text-[#003734]" />
                  </div>
                </div>

                {/* President Details */}
                <div className="flex-1 space-y-3">
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                    <span className="inline-flex items-center gap-1.5 rounded-full px-4 py-1 text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-primary/20 via-primary/10 to-transparent text-primary border border-primary/40 shadow-[0_0_15px_rgba(95,243,232,0.2)]">
                      <Crown className="w-3.5 h-3.5 text-primary" />
                      PRESIDENT
                    </span>

                    <span className="text-xs font-label-caps text-secondary bg-secondary/10 px-3 py-1 rounded-full border border-secondary/20">
                      {president.domain}
                    </span>
                  </div>

                  <h3 className="font-display text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                    {formatMemberName(president.name)}
                  </h3>

                  <p className="font-body text-xs sm:text-sm text-on-surface-variant font-medium">
                    {president.branch} {president.semester ? `• ${president.semester}` : ""}
                  </p>

                  {president.bio && (
                    <p className="font-body text-sm sm:text-base text-[#dde4e2]/90 leading-relaxed max-w-xl pt-1">
                      &ldquo;{president.bio}&rdquo;
                    </p>
                  )}

                  {/* Social & Contact Links */}
                  <div className="flex items-center justify-center md:justify-start gap-3 pt-3">
                    {president.github && (
                      <a
                        href={president.github}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-9 h-9 rounded-full bg-white/5 hover:bg-primary/20 border border-white/10 hover:border-primary/40 flex items-center justify-center text-white/70 hover:text-primary transition-all duration-300"
                        aria-label="GitHub Profile"
                      >
                        <Github className="w-4 h-4" />
                      </a>
                    )}
                    {president.linkedin && (
                      <a
                        href={president.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-9 h-9 rounded-full bg-white/5 hover:bg-secondary/20 border border-white/10 hover:border-secondary/40 flex items-center justify-center text-white/70 hover:text-secondary transition-all duration-300"
                        aria-label="LinkedIn Profile"
                      >
                        <Linkedin className="w-4 h-4" />
                      </a>
                    )}
                    {president.portfolio && (
                      <a
                        href={president.portfolio}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-9 h-9 rounded-full bg-white/5 hover:bg-tertiary/20 border border-white/10 hover:border-tertiary/40 flex items-center justify-center text-white/70 hover:text-tertiary transition-all duration-300"
                        aria-label="Portfolio Website"
                      >
                        <Globe className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUPPORTING MEMBERS SECTION */}
      <div className="space-y-6">
        {/* Header & Filter Controls */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 pb-2">
          <div>
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-primary" />
              <h3 className="font-display text-2xl sm:text-3xl font-bold text-white tracking-tight">
                Core Leads & Builders
              </h3>
            </div>
            <p className="font-body text-xs sm:text-sm text-on-surface-variant mt-1">
              Showing {filteredSupportingMembers.length} member
              {filteredSupportingMembers.length === 1 ? "" : "s"} across specialized disciplines
            </p>
          </div>

          {/* Domain Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 lg:pb-0 max-w-full no-scrollbar">
            {DOMAIN_FILTERS.map((domain) => {
              const isActive = selectedDomain === domain;
              return (
                <button
                  key={domain}
                  type="button"
                  onClick={() => setSelectedDomain(domain)}
                  className={`shrink-0 text-xs font-semibold px-3.5 py-1.5 rounded-full transition-all duration-300 ${
                    isActive
                      ? "bg-primary text-[#003734] font-bold shadow-[0_0_20px_rgba(95,243,232,0.4)]"
                      : "bg-white/5 text-white/70 hover:text-white hover:bg-white/10 border border-white/10"
                  }`}
                >
                  {domain}
                </button>
              );
            })}
          </div>

          {/* Navigation Arrows */}
          <div className="hidden sm:flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => handleScroll("left")}
              disabled={!canScrollLeft}
              className={`w-10 h-10 rounded-full border flex items-center justify-center transition-all duration-300 ${
                canScrollLeft
                  ? "border-white/20 text-white hover:border-primary hover:text-primary hover:bg-primary/10 shadow-sm"
                  : "border-white/5 text-white/20 cursor-not-allowed"
              }`}
              aria-label="Scroll left"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => handleScroll("right")}
              disabled={!canScrollRight}
              className={`w-10 h-10 rounded-full border flex items-center justify-center transition-all duration-300 ${
                canScrollRight
                  ? "border-white/20 text-white hover:border-primary hover:text-primary hover:bg-primary/10 shadow-sm"
                  : "border-white/5 text-white/20 cursor-not-allowed"
              }`}
              aria-label="Scroll right"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Horizontal Editorial Carousel Track */}
        <div
          ref={scrollContainerRef}
          className="flex gap-5 overflow-x-auto pb-6 pt-2 snap-x snap-mandatory scroll-smooth no-scrollbar"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {filteredSupportingMembers.length > 0 ? (
            filteredSupportingMembers.map((member, idx) => {
              const grad = avatarGradients[idx % avatarGradients.length];
              const roleTitle = formatMemberRole(member);
              const displayName = formatMemberName(member.name);
              const initials = getInitials(member.name);

              return (
                <div
                  key={member.uid}
                  className="flex-shrink-0 w-[270px] sm:w-[290px] md:w-[310px] snap-center rounded-3xl border border-white/10 bg-[#0e1514]/70 backdrop-blur-xl p-6 sm:p-7 flex flex-col items-center text-center transition-all duration-400 hover:-translate-y-2 hover:border-primary/40 hover:shadow-[0_16px_40px_rgba(95,243,232,0.12)] group relative"
                >
                  {/* Subtle Top Glow Border Accent */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-[1px] bg-gradient-to-r from-transparent via-primary/40 to-transparent group-hover:w-40 transition-all duration-500" />

                  {/* Avatar Pill with Glowing Gradient Ring */}
                  <div
                    className={`w-24 h-24 rounded-full mb-5 p-1 bg-gradient-to-tr ${grad} shadow-[0_4px_20px_rgba(0,0,0,0.3)] transition-transform duration-400 group-hover:scale-105`}
                  >
                    <div className="w-full h-full bg-[#090f0f] rounded-full flex items-center justify-center overflow-hidden">
                      {member.avatarUrl ? (
                        <img
                          src={member.avatarUrl}
                          alt={displayName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="font-display text-xl font-bold text-white tracking-wider">
                          {initials}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Member Name */}
                  <h4 className="font-display text-xl font-bold text-white mb-1.5 group-hover:text-primary transition-colors line-clamp-1">
                    {displayName}
                  </h4>

                  {/* Editorial Role Pill */}
                  <span className="inline-block rounded-full bg-primary/10 border border-primary/20 px-3 py-0.5 text-[10px] font-bold text-primary tracking-wider uppercase mb-2">
                    {roleTitle}
                  </span>

                  {/* Domain & Academic info */}
                  <p className="font-body text-xs text-on-surface-variant mb-3 line-clamp-1">
                    <span className="text-[#dde4e2] font-medium">{member.domain}</span>
                    {member.branch ? ` • ${member.branch}` : ""}
                  </p>

                  {/* Bio */}
                  {member.bio ? (
                    <p className="font-body text-xs text-[#859491] leading-relaxed line-clamp-2 mb-4 flex-1">
                      {member.bio}
                    </p>
                  ) : (
                    <p className="font-body text-xs text-[#859491]/60 italic mb-4 flex-1">
                      Crafting divine experiences at Diseño Divino.
                    </p>
                  )}

                  {/* Optional Social / Portfolio Icons */}
                  <div className="flex items-center gap-2 pt-3 border-t border-white/5 w-full justify-center text-white/40">
                    {member.github && (
                      <a
                        href={member.github}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-primary transition-colors p-1"
                        aria-label={`${displayName} GitHub`}
                      >
                        <Github className="w-3.5 h-3.5" />
                      </a>
                    )}
                    {member.linkedin && (
                      <a
                        href={member.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-secondary transition-colors p-1"
                        aria-label={`${displayName} LinkedIn`}
                      >
                        <Linkedin className="w-3.5 h-3.5" />
                      </a>
                    )}
                    {member.portfolio && (
                      <a
                        href={member.portfolio}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-tertiary transition-colors p-1"
                        aria-label={`${displayName} Portfolio`}
                      >
                        <Globe className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="w-full py-12 text-center text-on-surface-variant font-body">
              No members found for domain &ldquo;{selectedDomain}&rdquo;.
            </div>
          )}
        </div>

        {/* Scroll Progress Bar for Mobile & Desktop */}
        <div className="w-full max-w-xs mx-auto h-1 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-200 rounded-full"
            style={{ width: `${Math.max(15, scrollProgress)}%` }}
          />
        </div>
      </div>
    </section>
  );
};
