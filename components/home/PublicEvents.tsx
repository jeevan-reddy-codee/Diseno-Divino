"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Calendar, Clock, MapPin, ArrowRight } from "lucide-react";
import { ClubEvent } from "@/types/event";
import { getEvents } from "@/lib/services/eventService";

export const PublicEvents: React.FC = () => {
  const [events, setEvents] = useState<ClubEvent[]>([]);

  useEffect(() => {
    getEvents().then((data) => setEvents(data.slice(0, 3)));
  }, []);

  return (
    <section id="events" className="py-24 px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto relative z-10">
      <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
        <span className="font-label-caps text-xs text-primary tracking-widest uppercase bg-primary/10 px-4 py-1.5 rounded-full border border-primary/20">
          What&apos;s Happening
        </span>
        <h2 className="font-display text-4xl sm:text-5xl font-bold text-white tracking-tight">
          Upcoming Events & Workshops
        </h2>
        <p className="font-body text-base text-on-surface-variant">
          Immersive hackathons, hands-on design masterclasses, and creative coding sessions. Open to campus creators.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Featured Big Event Card */}
        {events[0] && (
          <div className="lg:col-span-8 glass-card-featured rounded-3xl p-8 sm:p-10 relative overflow-hidden flex flex-col justify-between group glow-hover min-h-[420px]">
            <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 rounded-full blur-[100px] pointer-events-none"></div>

            <div>
              <div className="flex flex-wrap items-center gap-3 mb-6">
                <span className="bg-primary text-black font-bold text-xs px-3.5 py-1 rounded-full uppercase tracking-wider font-label-caps">
                  Featured Event
                </span>
                <span className="text-xs text-primary bg-primary/10 border border-primary/20 px-3 py-1 rounded-full font-label-caps">
                  {events[0].category || "Workshop"}
                </span>
              </div>

              <h3 className="font-display text-3xl sm:text-4xl font-bold text-white mb-4">
                {events[0].name}
              </h3>
              <p className="font-body text-base text-on-surface-variant max-w-xl leading-relaxed mb-6">
                {events[0].description}
              </p>

              <div className="flex flex-wrap gap-6 text-sm text-[#bbcac7] mb-8">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary" />
                  <span>{events[0].date}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-secondary" />
                  <span>{events[0].time}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[#ffd6ad]" />
                  <span>{events[0].location || "Campus Design Lab"}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 pt-6 border-t border-white/10">
              <span className="text-xs text-on-surface-variant">
                🔥 <strong className="text-white">{events[0].registeredCount || events[0].rsvpCount || 142}</strong> registered candidates
              </span>

              <div className="flex items-center gap-3">
                <Link
                  href={`/rsvp?event=${events[0].id}`}
                  className="px-6 py-3 rounded-full font-bold text-sm bg-primary text-black hover:shadow-[0_0_25px_rgba(95,243,232,0.5)] transition-all cursor-pointer flex items-center gap-2"
                >
                  <span>Register for Event</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Secondary Events Column */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {events.slice(1, 3).map((ev) => (
            <div
              key={ev.id}
              className="glass-card rounded-3xl p-6 flex flex-col justify-between flex-1 group glow-hover border border-white/10"
            >
              <div>
                <div className="flex justify-between items-start mb-4">
                  <span className="text-xs font-label-caps text-secondary bg-secondary/10 px-3 py-1 rounded-full border border-secondary/20 uppercase">
                    {ev.category || "Workshop"}
                  </span>
                  <span className="text-xs text-on-surface-variant font-label-caps">
                    {ev.date}
                  </span>
                </div>

                <h4 className="font-display text-xl font-bold text-white mb-2 group-hover:text-primary transition-colors">
                  {ev.name}
                </h4>
                <p className="text-xs text-on-surface-variant leading-relaxed line-clamp-2 mb-4">
                  {ev.description}
                </p>
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-white/10">
                <span className="text-xs text-on-surface-variant flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-primary" />
                  {ev.time}
                </span>

                <Link
                  href={`/rsvp?event=${ev.id}`}
                  className="text-xs px-4 py-2 rounded-full font-bold transition-all cursor-pointer bg-[#111111] border border-white/20 text-white hover:border-primary hover:text-primary"
                >
                  Register →
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
