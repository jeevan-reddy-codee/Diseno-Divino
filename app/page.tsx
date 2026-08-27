import React from "react";
import { PublicNavbar } from "@/components/layout/PublicNavbar";
import { Hero } from "@/components/home/Hero";
import { About } from "@/components/home/About";
import { WhatWeDo } from "@/components/home/WhatWeDo";
import { PublicEvents } from "@/components/home/PublicEvents";
import { Team } from "@/components/home/Team";
import { JoinClub } from "@/components/home/JoinClub";
import { Footer } from "@/components/layout/Footer";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#050505] text-[#dde4e2] relative overflow-x-hidden">
      <PublicNavbar />
      <main>
        <Hero />
        <About />
        <WhatWeDo />
        <PublicEvents />
        <Team />
        <JoinClub />
      </main>
      <Footer />
    </div>
  );
}
