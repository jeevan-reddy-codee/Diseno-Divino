"use client";

import React, { useState } from "react";
import { useAuth } from "@/lib/firebase/authContext";
import { updateMember } from "@/lib/services/memberService";
import {
  User,
  Mail,
  Lock,
  Globe,
  Github,
  Linkedin,
  ShieldCheck,
  Save,
  CheckCircle2,
  AlertCircle,
  KeyRound,
} from "lucide-react";

export const ProfileSettings: React.FC = () => {
  const { user, memberProfile, resetPassword } = useAuth();

  const [formData, setFormData] = useState({
    name: memberProfile?.name || "Alex Mercer",
    bio: memberProfile?.bio || "Design Lead & Full Stack Architect at Diseño Divino.",
    portfolio: memberProfile?.portfolio || "https://alexmercer.design",
    github: memberProfile?.github || "https://github.com/alexmercer",
    linkedin: memberProfile?.linkedin || "https://linkedin.com/in/alexmercer",
  });

  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [resetSent, setResetSent] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberProfile) return;

    setSaving(true);
    setSuccessMsg(null);

    await updateMember(
      memberProfile.uid,
      {
        name: formData.name,
        bio: formData.bio,
        portfolio: formData.portfolio,
        github: formData.github,
        linkedin: formData.linkedin,
      },
      memberProfile.uid,
      memberProfile.name
    );

    setSaving(false);
    setSuccessMsg("Profile attributes successfully updated.");
  };

  const handlePasswordReset = async () => {
    if (!memberProfile?.email) return;
    await resetPassword(memberProfile.email);
    setResetSent(true);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="pb-4 border-b border-white/10">
        <span className="font-label-caps text-xs text-primary tracking-widest uppercase bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
          Member Identity
        </span>
        <h1 className="font-display text-4xl sm:text-5xl font-bold text-white tracking-tight mt-1">
          Profile Settings
        </h1>
        <p className="font-body text-sm text-on-surface-variant">
          Manage your personal biography, portfolio links, and security preferences.
        </p>
      </div>

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Identity Card */}
        <div className="lg:col-span-4">
          <div className="glass-card-heavy rounded-3xl p-6 border border-white/15 text-center space-y-4">
            <div className="w-24 h-24 rounded-full mx-auto p-1 bg-gradient-to-tr from-primary to-secondary">
              <div className="w-full h-full bg-[#0e1514] rounded-full flex items-center justify-center overflow-hidden">
                {memberProfile?.avatarUrl ? (
                  <img
                    src={memberProfile.avatarUrl}
                    alt={memberProfile.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="font-display text-3xl font-bold text-white">
                    {memberProfile?.name?.charAt(0) || "A"}
                  </span>
                )}
              </div>
            </div>

            <div>
              <h2 className="font-display text-xl font-bold text-white">
                {memberProfile?.name}
              </h2>
              <div className="flex items-center justify-center gap-1.5 mt-1">
                <span className="text-xs text-primary font-label-caps uppercase">
                  {memberProfile?.domain}
                </span>
                <span className="text-on-surface-variant">•</span>
                <span className="text-xs text-secondary font-label-caps uppercase">
                  {memberProfile?.role}
                </span>
              </div>
            </div>

            <div className="bg-[#111111] p-4 rounded-2xl border border-white/10 text-left space-y-2 text-xs">
              <p className="text-[#bbcac7]">USN: <strong className="text-white">{memberProfile?.usn}</strong></p>
              <p className="text-[#bbcac7]">Branch: <strong className="text-white">{memberProfile?.branch}</strong></p>
              <p className="text-[#bbcac7]">Semester: <strong className="text-white">{memberProfile?.semester}</strong></p>
              <p className="text-[#bbcac7]">Email: <strong className="text-white">{memberProfile?.email}</strong></p>
            </div>

            {/* Password Reset Trigger */}
            <div className="pt-2">
              <button
                onClick={handlePasswordReset}
                className="w-full py-2.5 rounded-full bg-[#161d1c] border border-white/20 text-white text-xs font-medium hover:border-primary transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <KeyRound className="w-3.5 h-3.5 text-primary" />
                <span>Request Password Reset</span>
              </button>
              {resetSent && (
                <p className="text-[11px] text-emerald-400 mt-2">
                  Password reset link sent to your registered email!
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Right: Editable Settings Form */}
        <div className="lg:col-span-8">
          <form onSubmit={handleSave} className="glass-card rounded-3xl p-8 border border-white/10 space-y-6">
            <h3 className="font-display text-2xl font-bold text-white pb-3 border-b border-white/10">
              Personal Information
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-label-caps text-on-surface-variant mb-1.5 uppercase">
                  Display Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full form-input px-4 py-3 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-label-caps text-on-surface-variant mb-1.5 uppercase">
                  Personal Biography / Status
                </label>
                <textarea
                  rows={3}
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  placeholder="Share a short bio, design specialty, or project focus..."
                  className="w-full form-input px-4 py-3 text-xs text-white"
                />
              </div>

              <div className="space-y-3 pt-2">
                <p className="text-xs font-label-caps text-primary uppercase font-bold">
                  Work & Social Presence
                </p>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-primary shrink-0" />
                    <input
                      type="url"
                      value={formData.portfolio}
                      onChange={(e) => setFormData({ ...formData, portfolio: e.target.value })}
                      placeholder="https://yourportfolio.design"
                      className="w-full form-input px-3.5 py-2.5 text-xs text-white"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <Github className="w-4 h-4 text-white shrink-0" />
                    <input
                      type="url"
                      value={formData.github}
                      onChange={(e) => setFormData({ ...formData, github: e.target.value })}
                      placeholder="https://github.com/yourhandle"
                      className="w-full form-input px-3.5 py-2.5 text-xs text-white"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <Linkedin className="w-4 h-4 text-[#0A66C2] shrink-0" />
                    <input
                      type="url"
                      value={formData.linkedin}
                      onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })}
                      placeholder="https://linkedin.com/in/yourhandle"
                      className="w-full form-input px-3.5 py-2.5 text-xs text-white"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="btn-primary px-8 py-3 text-xs font-bold shadow-[0_0_25px_rgba(95,243,232,0.4)]"
              >
                {saving ? "Saving Changes..." : "Save Profile Updates"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
