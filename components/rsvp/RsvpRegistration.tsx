"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { getEvents, registerEventAttendee } from "@/lib/services/eventService";
import { ClubEvent } from "@/types/event";
import { CheckCircle2, ArrowRight, ArrowLeft, ChevronDown } from "lucide-react";

export const RsvpRegistration: React.FC = () => {
  const searchParams = useSearchParams();
  const preselectedEventId = searchParams.get("event");

  const [events, setEvents] = useState<ClubEvent[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>("");

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    usn: "",
    phone: "",
    branch: "",
    requirements: "",
  });

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [confirmationId, setConfirmationId] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getEvents().then((data) => {
      setEvents(data);
      if (preselectedEventId && data.some((e) => e.id === preselectedEventId)) {
        setSelectedEventId(preselectedEventId);
      } else if (data.length > 0) {
        setSelectedEventId(data[0].id);
      }
    });
  }, [preselectedEventId]);

  const selectedEvent = events.find((e) => e.id === selectedEventId) || events[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.fullName.trim() || !formData.email.trim() || !formData.usn.trim()) {
      setError("Please complete all required fields (Full Name, Email, USN).");
      return;
    }

    setLoading(true);
    try {
      const nameParts = formData.fullName.trim().split(" ");
      const firstName = nameParts[0] || "";
      const lastName = nameParts.slice(1).join(" ") || "";

      const res = await registerEventAttendee({
        eventId: selectedEvent?.id || "general",
        eventName: selectedEvent?.name || "Diseño Divino Event",
        firstName,
        lastName,
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        usn: formData.usn.trim().toUpperCase(),
        branch: formData.branch,
        requirements: formData.requirements.trim(),
        domain: selectedEvent?.domain || "General",
      });

      setConfirmationId(res.registrationId);
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#131313] text-[#e2e2e2] min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Atmospheric Background Glows (Level 3 Depth) */}
      <div className="fixed -top-[20%] -right-[10%] w-[50%] h-[50%] rounded-full bg-[#4bfcde]/5 blur-[120px] pointer-events-none" />
      <div className="fixed -bottom-[20%] -left-[10%] w-[40%] h-[40%] rounded-full bg-[#4bfcde]/5 blur-[100px] pointer-events-none" />

      <main className="w-full max-w-lg mx-auto relative z-10 my-8">
        {/* Header / Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block hover:opacity-90 transition-opacity" title="Diseño Divino Home">
            <h1 className="font-display text-4xl sm:text-5xl font-bold text-white tracking-tight">
              Diseño <span className="text-[#4bfcde]">Divino.</span>
            </h1>
          </Link>
        </div>

        {/* Registration Card (Stitch Screen 7632b79dc46f45a78a310fbdc0ba8b43) */}
        <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl p-8 md:p-10 shadow-[0_0_50px_rgba(0,0,0,0.6)]">
          {/* Top Home Navigation Bar */}
          <div className="flex justify-between items-center mb-6 pb-4 border-b border-white/10 relative z-10">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#94A3B8] hover:text-[#4bfcde] transition-colors group"
              title="Return to Home Page"
            >
              <span className="material-symbols-outlined text-sm group-hover:-translate-x-1 transition-transform">
                arrow_back
              </span>
              <span>Back to Home</span>
            </Link>

            <Link
              href="/"
              className="px-3 py-1 rounded-full bg-white/5 border border-white/15 text-xs font-mono text-[#4bfcde] hover:bg-[#4bfcde] hover:text-black transition-all"
            >
              Home
            </Link>
          </div>

          {submitted ? (
            /* Success State */
            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-full mx-auto mb-6 bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <span className="text-xs uppercase tracking-widest text-[#4bfcde] font-semibold block mb-2">
                Registration Confirmed
              </span>

              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
                Application Received!
              </h2>

              <p className="text-sm text-[#94A3B8] leading-relaxed mb-6">
                Thank you, <strong className="text-white">{formData.fullName}</strong>. Your application to attend{" "}
                <strong className="text-[#4bfcde]">{selectedEvent?.name}</strong> has been registered.
              </p>

              <div className="p-3.5 rounded-xl font-mono text-xs mb-8 bg-[#0e0e0e] border border-white/10 text-[#4bfcde]">
                Reference ID: {confirmationId}
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  href="/"
                  className="flex-1 py-3.5 px-4 rounded-xl text-xs font-semibold uppercase tracking-wider bg-white/5 border border-white/15 text-white hover:bg-white/10 transition-colors flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Return to Home</span>
                </Link>

                <Link
                  href="/dashboard"
                  className="flex-1 py-3.5 px-4 rounded-xl text-xs font-bold uppercase tracking-wider bg-[#4bfcde] text-[#00382f] hover:bg-white hover:shadow-[0_0_20px_rgba(79,255,225,0.4)] transition-all flex items-center justify-center gap-2"
                >
                  <span>Member Portal</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ) : (
            /* Registration Form */
            <>
              <div className="text-center mb-8">
                <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                  Event Registration
                </h2>
                <p className="text-sm text-[#94A3B8]">
                  Secure your spot for upcoming exclusive events & workshops.
                </p>
              </div>

              {error && (
                <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Event Selection */}
                <div className="space-y-1.5">
                  <label
                    className="block text-xs uppercase tracking-wider font-semibold text-[#bacac5]"
                    htmlFor="event"
                  >
                    Select Event *
                  </label>
                  <div className="relative">
                    <select
                      id="event"
                      name="event"
                      value={selectedEventId}
                      onChange={(e) => setSelectedEventId(e.target.value)}
                      required
                      className="w-full bg-[#1b1b1b] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#4bfcde] focus:ring-1 focus:ring-[#4bfcde] appearance-none cursor-pointer"
                    >
                      {events.length === 0 && (
                        <option value="" disabled>
                          Loading upcoming events...
                        </option>
                      )}
                      {events.map((ev) => (
                        <option key={ev.id} value={ev.id} className="bg-[#1b1b1b] text-white">
                          {ev.name} — {ev.date}
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-[#94A3B8]">
                      <ChevronDown className="w-4 h-4" />
                    </div>
                  </div>
                </div>

                {/* Full Name */}
                <div className="space-y-1.5">
                  <label
                    className="block text-xs uppercase tracking-wider font-semibold text-[#bacac5]"
                    htmlFor="fullName"
                  >
                    Full Name *
                  </label>
                  <input
                    id="fullName"
                    name="fullName"
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    placeholder="Jane Doe"
                    className="w-full bg-[#1b1b1b]/80 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-[#94A3B8]/40 focus:outline-none focus:border-[#4bfcde] focus:ring-1 focus:ring-[#4bfcde] transition-all"
                  />
                </div>

                {/* Email */}
                <div className="space-y-1.5">
                  <label
                    className="block text-xs uppercase tracking-wider font-semibold text-[#bacac5]"
                    htmlFor="email"
                  >
                    Email Address *
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="jane@example.com"
                    className="w-full bg-[#1b1b1b]/80 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-[#94A3B8]/40 focus:outline-none focus:border-[#4bfcde] focus:ring-1 focus:ring-[#4bfcde] transition-all"
                  />
                </div>

                {/* USN */}
                <div className="space-y-1.5">
                  <label
                    className="block text-xs uppercase tracking-wider font-semibold text-[#bacac5]"
                    htmlFor="usn"
                  >
                    USN / Student ID *
                  </label>
                  <input
                    id="usn"
                    name="usn"
                    type="text"
                    required
                    value={formData.usn}
                    onChange={(e) => setFormData({ ...formData, usn: e.target.value })}
                    placeholder="1DD24CS001"
                    className="w-full bg-[#1b1b1b]/80 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-[#94A3B8]/40 uppercase focus:outline-none focus:border-[#4bfcde] focus:ring-1 focus:ring-[#4bfcde] transition-all"
                  />
                </div>

                {/* Phone Number */}
                <div className="space-y-1.5">
                  <label
                    className="block text-xs uppercase tracking-wider font-semibold text-[#bacac5]"
                    htmlFor="phone"
                  >
                    Phone Number
                  </label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+91 98765 43210"
                    className="w-full bg-[#1b1b1b]/80 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-[#94A3B8]/40 focus:outline-none focus:border-[#4bfcde] focus:ring-1 focus:ring-[#4bfcde] transition-all"
                  />
                </div>

                {/* Branch */}
                <div className="space-y-1.5">
                  <label
                    className="block text-xs uppercase tracking-wider font-semibold text-[#bacac5]"
                    htmlFor="branch"
                  >
                    Branch / Department
                  </label>
                  <div className="relative">
                    <select
                      id="branch"
                      name="branch"
                      value={formData.branch}
                      onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                      className="w-full bg-[#1b1b1b] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#4bfcde] focus:ring-1 focus:ring-[#4bfcde] appearance-none cursor-pointer"
                    >
                      <option value="">Select your branch...</option>
                      <option value="Computer Science">Computer Science & Engineering</option>
                      <option value="Information Science">Information Science & Engineering</option>
                      <option value="Electronics">Electronics & Communication</option>
                      <option value="Mechanical">Mechanical Engineering</option>
                      <option value="Civil">Civil Engineering</option>
                      <option value="Design">UI/UX & Digital Design</option>
                      <option value="Other">Other / Creative Disciplines</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-[#94A3B8]">
                      <ChevronDown className="w-4 h-4" />
                    </div>
                  </div>
                </div>

                {/* Special Requirements */}
                <div className="space-y-1.5">
                  <label
                    className="block text-xs uppercase tracking-wider font-semibold text-[#bacac5]"
                    htmlFor="requirements"
                  >
                    Special Requirements (Optional)
                  </label>
                  <textarea
                    id="requirements"
                    name="requirements"
                    rows={3}
                    value={formData.requirements}
                    onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                    placeholder="Dietary restrictions, accessibility needs, team partner names..."
                    className="w-full bg-[#1b1b1b]/80 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-[#94A3B8]/40 resize-none focus:outline-none focus:border-[#4bfcde] focus:ring-1 focus:ring-[#4bfcde] transition-all"
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-6 bg-[#4bfcde] text-[#00382f] font-bold text-xs uppercase tracking-widest py-4 rounded-full hover:shadow-[0_0_25px_rgba(75,252,222,0.5)] hover:bg-white transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-[#00382f] border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <span>Register Now</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-8 flex flex-col sm:flex-row justify-between items-center gap-3 border-t border-white/10 pt-6">
                <Link
                  href="/"
                  className="text-xs text-[#94A3B8] hover:text-white transition-colors inline-flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Return to Home</span>
                </Link>

                <Link
                  href="/dashboard"
                  className="text-xs text-[#4bfcde] hover:underline transition-colors inline-flex items-center gap-1.5 font-medium"
                >
                  <span>Member Portal →</span>
                </Link>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
};
