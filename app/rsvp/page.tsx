import React, { Suspense } from "react";
import type { Metadata } from "next";
import { RsvpRegistration } from "@/components/rsvp/RsvpRegistration";

export const metadata: Metadata = {
  title: "Register for Events & Workshops — Diseño Divino Club",
  description:
    "Register for upcoming masterclasses, workshops, and hackathons hosted by Diseño Divino Club.",
};

export default function EventRegistrationPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#131313] flex items-center justify-center text-white">
          <div className="w-8 h-8 border-2 border-[#4bfcde] border-t-transparent rounded-full animate-spin"></div>
        </div>
      }
    >
      <RsvpRegistration />
    </Suspense>
  );
}
