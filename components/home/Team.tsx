"use client";

import React, { useState, useEffect } from "react";
import { Member } from "@/types/member";
import { getActiveMembers } from "@/lib/services/memberService";
import { SEED_MEMBERS } from "@/lib/services/seedData";

export const Team: React.FC = () => {
  const [members, setMembers] = useState<Member[]>(SEED_MEMBERS);

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

  const gradientClasses = [
    "bg-gradient-to-tr from-primary via-secondary to-transparent",
    "bg-gradient-to-tr from-secondary via-primary to-transparent",
    "bg-gradient-to-tr from-[#ffd6ad] via-primary to-transparent",
    "bg-gradient-to-tr from-primary via-emerald-400 to-transparent",
  ];

  return (
    <section id="team" className="py-24 px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto relative z-10">
      <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
        <span className="font-label-caps text-xs text-primary tracking-widest uppercase bg-primary/10 px-4 py-1.5 rounded-full border border-primary/20">
          Core Collective
        </span>
        <h2 className="font-display text-4xl sm:text-5xl font-bold text-white tracking-tight">
          The Minds Shaping Diseño Divino
        </h2>
        <p className="font-body text-base text-on-surface-variant">
          Design leads, full-stack builders, creative coders, and operational coordinators powering our vision.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {members.map((member, idx) => {
          const initials = member.name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .substring(0, 2);

          const grad = gradientClasses[idx % gradientClasses.length];

          return (
            <div
              key={member.uid}
              className="glass-card rounded-3xl p-6 flex flex-col items-center text-center transition-all duration-300 hover:-translate-y-2 glow-hover border border-white/10"
            >
              {/* Avatar Pill with Ambient Glow Gradient */}
              <div className={`w-24 h-24 rounded-full mb-5 p-1 ${grad}`}>
                <div className="w-full h-full bg-[#0e1514] rounded-full flex items-center justify-center overflow-hidden">
                  {member.avatarUrl ? (
                    <img
                      src={member.avatarUrl}
                      alt={member.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="font-display text-2xl font-bold text-white">
                      {initials}
                    </span>
                  )}
                </div>
              </div>

              <h3 className="font-display text-xl font-bold text-white mb-1">
                {member.name}
              </h3>

              <span className="bg-primary/10 text-primary font-label-caps text-[10px] px-3 py-1 rounded-full mb-2 border border-primary/20">
                {member.domain}
              </span>

              <p className="font-body text-xs text-on-surface-variant mb-4">
                {member.role === "admin" ? "Design Lead" : "Core Member"} • {member.branch}
              </p>

              {member.bio && (
                <p className="font-body text-xs text-[#859491] line-clamp-2 leading-relaxed">
                  {member.bio}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};
