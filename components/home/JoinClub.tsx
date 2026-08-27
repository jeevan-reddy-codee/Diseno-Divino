"use client";

import React, { useState } from "react";
import { submitJoinRequest } from "@/lib/services/requestService";
import { DomainType } from "@/types/joinRequest";
import { Send, CheckCircle, Sparkles, AlertCircle, X } from "lucide-react";

export const JoinClub: React.FC = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    semester: "3rd Semester",
    branch: "",
    usn: "",
    domain: "UI/UX" as DomainType,
    workLink: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const domains: DomainType[] = [
    "UI/UX",
    "Tech",
    "Graphics",
    "Social Media",
    "PR / Marketing & Sponsorship",
    "Operations",
  ];

  const semesters = [
    "1st Semester",
    "2nd Semester",
    "3rd Semester",
    "4th Semester",
    "5th Semester",
    "6th Semester",
    "7th Semester",
    "8th Semester",
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.name.trim() || !formData.email.trim() || !formData.usn.trim()) {
      setError("Please fill out all required fields.");
      return;
    }

    setSubmitting(true);
    try {
      await submitJoinRequest({
        name: formData.name.trim(),
        email: formData.email.trim(),
        semester: formData.semester,
        branch: formData.branch.trim() || "Computer Science",
        usn: formData.usn.trim().toUpperCase(),
        domain: formData.domain,
        workLink: formData.workLink.trim() || "https://github.com",
      });

      setShowModal(true);
      setFormData({
        name: "",
        email: "",
        semester: "3rd Semester",
        branch: "",
        usn: "",
        domain: "UI/UX",
        workLink: "",
      });
    } catch (err: any) {
      setError(err.message || "Failed to submit your request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section id="join" className="py-24 px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto relative z-10">
      <div className="max-w-4xl mx-auto glass-card-heavy rounded-3xl p-8 sm:p-12 relative overflow-hidden border border-white/15">
        {/* Glow backdrop */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-primary/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-secondary/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 text-center max-w-2xl mx-auto mb-10 space-y-3">
          <span className="font-label-caps text-xs text-primary tracking-widest uppercase bg-primary/10 px-4 py-1.5 rounded-full border border-primary/20">
            Membership Application
          </span>
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-tight">
            Join the Diseño Divino Collective
          </h2>
          <p className="font-body text-sm sm:text-base text-on-surface-variant">
            Submit your application to become part of our core team. Requests are evaluated by domain leads.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-error/10 border border-error/30 text-error text-sm flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="relative z-10 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Full Name */}
            <div className="space-y-2">
              <label className="block text-xs font-label-caps text-on-surface-variant uppercase">
                Full Name <span className="text-primary">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Alex Rivera"
                className="w-full form-input px-4 py-3.5 text-white"
              />
            </div>

            {/* Email Address */}
            <div className="space-y-2">
              <label className="block text-xs font-label-caps text-on-surface-variant uppercase">
                College / Personal Email <span className="text-primary">*</span>
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="e.g. alex@college.edu"
                className="w-full form-input px-4 py-3.5 text-white"
              />
            </div>

            {/* USN / Student ID */}
            <div className="space-y-2">
              <label className="block text-xs font-label-caps text-on-surface-variant uppercase">
                USN / Student ID <span className="text-primary">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.usn}
                onChange={(e) => setFormData({ ...formData, usn: e.target.value })}
                placeholder="e.g. 1DD24CS012"
                className="w-full form-input px-4 py-3.5 text-white uppercase"
              />
            </div>

            {/* Branch / Department */}
            <div className="space-y-2">
              <label className="block text-xs font-label-caps text-on-surface-variant uppercase">
                Branch / Major <span className="text-primary">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.branch}
                onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                placeholder="e.g. Computer Science & Engineering"
                className="w-full form-input px-4 py-3.5 text-white"
              />
            </div>

            {/* Semester */}
            <div className="space-y-2">
              <label className="block text-xs font-label-caps text-on-surface-variant uppercase">
                Current Semester
              </label>
              <select
                value={formData.semester}
                onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                className="w-full form-input px-4 py-3.5 text-white bg-[#111111]"
              >
                {semesters.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            {/* Primary Domain */}
            <div className="space-y-2">
              <label className="block text-xs font-label-caps text-on-surface-variant uppercase">
                Desired Domain <span className="text-primary">*</span>
              </label>
              <select
                value={formData.domain}
                onChange={(e) => setFormData({ ...formData, domain: e.target.value as DomainType })}
                className="w-full form-input px-4 py-3.5 text-white bg-[#111111]"
              >
                {domains.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Work / Portfolio Link */}
          <div className="space-y-2">
            <label className="block text-xs font-label-caps text-on-surface-variant uppercase">
              Portfolio / GitHub / Work Link <span className="text-primary">*</span>
            </label>
            <input
              type="url"
              required
              value={formData.workLink}
              onChange={(e) => setFormData({ ...formData, workLink: e.target.value })}
              placeholder="e.g. https://behance.net/yourprofile or https://github.com/yourhandle"
              className="w-full form-input px-4 py-3.5 text-white"
            />
            <p className="text-[11px] text-[#859491]">
              Share a Figma file, Behance/Dribbble link, GitHub profile, or Google Drive folder with your recent work.
            </p>
          </div>

          <div className="pt-4 flex justify-center">
            <button
              type="submit"
              disabled={submitting}
              className="w-full sm:w-auto px-10 py-4 rounded-full bg-primary text-[#003734] font-bold text-base hover:shadow-[0_0_35px_rgba(95,243,232,0.6)] hover:scale-105 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                  <span>Submitting Request...</span>
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  <span>Submit Application</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Confirmation Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-card-heavy w-full max-w-md rounded-3xl p-8 text-center relative border border-primary/40 shadow-[0_0_50px_rgba(95,243,232,0.3)] animate-float">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-5 right-5 text-on-surface-variant hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-16 h-16 rounded-full bg-primary/15 border border-primary/40 flex items-center justify-center text-primary mx-auto mb-5">
              <CheckCircle className="w-8 h-8 text-primary" />
            </div>

            <h3 className="font-display text-2xl font-bold text-white mb-2">
              Your request is sent.
            </h3>
            <p className="font-body text-sm text-on-surface-variant leading-relaxed mb-6">
              Thank you for applying to Diseño Divino! Domain leads will review your portfolio. You will be contacted via email once your application is evaluated.
            </p>

            <button
              onClick={() => setShowModal(false)}
              className="w-full py-3 rounded-full bg-primary text-[#003734] font-bold text-sm hover:shadow-[0_0_20px_rgba(95,243,232,0.4)] transition-all cursor-pointer"
            >
              Back to Home
            </button>
          </div>
        </div>
      )}
    </section>
  );
};
