"use client";

import React, { useState, useEffect } from "react";
import { Member, MemberPermissions, MemberRole, MemberStatus } from "@/types/member";
import {
  subscribeToMembers,
  updateMember,
  setMemberStatus,
} from "@/lib/services/memberService";
import { createTodo } from "@/lib/services/todoService";
import { useAuth } from "@/lib/firebase/authContext";
import {
  UserPlus,
  Search,
  ShieldCheck,
  CheckSquare,
  Edit,
  UserX,
  UserCheck,
  X,
  AlertCircle,
} from "lucide-react";

export const MemberDirectory: React.FC = () => {
  const { user, memberProfile, isPresident, isDomainHead, hasPermission } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDomain, setSelectedDomain] = useState<string>("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalMember, setEditModalMember] = useState<Member | null>(null);
  const [assignTodoMember, setAssignTodoMember] = useState<Member | null>(null);
  const [profileModalMember, setProfileModalMember] = useState<Member | null>(null);

  // Add Member Form State
  const [newMemberForm, setNewMemberForm] = useState({
    name: "",
    email: "",
    loginEmail: "",
    password: "",
    confirmPassword: "",
    usn: "",
    semester: "4th Semester",
    branch: "Computer Science",
    domain: "UI/UX",
    role: "member" as MemberRole,
    permissions: {
      reviewRequests: false,
      manageRequests: false,
      assignTodos: false,
      manageMembers: false,
      createEvents: false,
    },
  });

  // Assign Task State
  const [todoText, setTodoText] = useState("");
  const [todoDueDate, setTodoDueDate] = useState("Due this week");

  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canManage = isPresident || isDomainHead() || hasPermission("manageMembers");

  useEffect(() => {
    setLoading(true);
    setError(null);
    const unsubscribe = subscribeToMembers(
      (list) => {
        setMembers(list);
        setLoading(false);
      },
      (err) => {
        setError(err.message || "Failed to load members from Firestore.");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const handleAddMemberSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (newMemberForm.password !== newMemberForm.confirmPassword) {
      setFormError("Passwords do not match.");
      return;
    }

    if (newMemberForm.password.length < 6) {
      setFormError("Password must be at least 6 characters.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/admin/create-member", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newMemberForm,
          adminUid: memberProfile?.uid || user?.uid || "president",
          adminName: memberProfile?.name || "President",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create member");
      }

      setAddModalOpen(false);
      setNewMemberForm({
        name: "",
        email: "",
        loginEmail: "",
        password: "",
        confirmPassword: "",
        usn: "",
        semester: "4th Semester",
        branch: "Computer Science",
        domain: "UI/UX",
        role: "member",
        permissions: {
          reviewRequests: false,
          manageRequests: false,
          assignTodos: false,
          manageMembers: false,
          createEvents: false,
        },
      });
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (member: Member) => {
    if (!isPresident) return;
    const newStatus: MemberStatus = member.status === "active" ? "disabled" : "active";
    try {
      await setMemberStatus(
        member.uid,
        newStatus,
        memberProfile?.uid || "president",
        memberProfile?.name || "President"
      );
    } catch (err: any) {
      alert("Failed to update status: " + (err.message || "Unknown error"));
    }
  };

  const handleAssignTodoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignTodoMember || !todoText.trim()) return;

    try {
      await createTodo({
        text: todoText.trim(),
        assignedTo: assignTodoMember.uid,
        assignedToName: assignTodoMember.name,
        createdBy: memberProfile?.uid || user?.uid || "president",
        createdByName: memberProfile?.name || "President",
        dueDate: todoDueDate,
      });

      setAssignTodoMember(null);
      setTodoText("");
    } catch (err: any) {
      alert("Failed to assign To-Do: " + (err.message || "Unknown error"));
    }
  };

  const handleSaveEditMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editModalMember) return;

    try {
      await updateMember(
        editModalMember.uid,
        {
          name: editModalMember.name,
          domain: editModalMember.domain,
          role: editModalMember.role,
          branch: editModalMember.branch,
          semester: editModalMember.semester,
          permissions: editModalMember.permissions,
        },
        memberProfile?.uid || "president",
        memberProfile?.name || "President"
      );

      setEditModalMember(null);
    } catch (err: any) {
      alert("Failed to update member: " + (err.message || "Unknown error"));
    }
  };

  const domains = ["All", "UI/UX", "Tech", "Graphics", "Social Media", "PR / Marketing & Sponsorship", "Operations"];

  const filteredMembers = members.filter((m) => {
    const matchDomain = selectedDomain === "All" || m.domain === selectedDomain;
    const matchSearch =
      !searchQuery ||
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.usn.toLowerCase().includes(searchQuery.toLowerCase());
    return matchDomain && matchSearch;
  });

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 pb-4 border-b border-white/10">
        <div>
          <span className="font-label-caps text-xs text-primary tracking-widest uppercase bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
            Collective Directory
          </span>
          <h1 className="font-display text-4xl sm:text-5xl font-bold text-white tracking-tight mt-1">
            Members
          </h1>
          <p className="font-body text-sm text-on-surface-variant max-w-xl">
            Active creators, developers, and leads shaping the Diseño Divino ecosystem.
          </p>
        </div>

        {canManage && (
          <button
            onClick={() => setAddModalOpen(true)}
            className="btn-primary shrink-0 cursor-pointer shadow-[0_0_25px_rgba(95,243,232,0.4)]"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ Add Member</span>
          </button>
        )}
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-error/10 border border-error/30 text-error text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter & Search Toolbar */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between bg-[#111111] p-3.5 rounded-2xl border border-white/10">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-on-surface-variant absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search members by name, USN, or domain..."
            className="w-full pl-10 pr-4 py-2 text-xs bg-transparent text-white placeholder-[#71717a] focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          {domains.map((d) => (
            <button
              key={d}
              onClick={() => setSelectedDomain(d)}
              className={`px-3 py-1.5 rounded-xl text-xs font-label-caps whitespace-nowrap transition-all cursor-pointer ${
                selectedDomain === d
                  ? "bg-primary text-black font-bold"
                  : "bg-white/5 text-on-surface-variant hover:text-white"
              }`}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      {/* Members Grid */}
      {loading ? (
        <div className="glass-card rounded-3xl p-12 text-center border border-white/10">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-xs text-on-surface-variant">Loading members from Firestore...</p>
        </div>
      ) : filteredMembers.length === 0 ? (
        <div className="glass-card rounded-3xl p-12 text-center border border-white/10">
          <p className="font-display text-lg text-white mb-1">No Members Found</p>
          <p className="text-xs text-on-surface-variant">There are no members matching the current filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredMembers.map((member) => {
            const initials = member.name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .substring(0, 2);

            const isDisabled = member.status === "disabled";

            return (
              <div
                key={member.uid}
                className={`glass-card rounded-3xl p-6 flex flex-col justify-between group transition-all duration-300 border ${
                  isDisabled
                    ? "opacity-60 border-error/30 bg-error/5"
                    : "border-white/10 hover:border-primary/50 hover:-translate-y-1.5 glow-hover"
                }`}
              >
                <div className="flex flex-col items-center text-center">
                  {/* Avatar with dynamic ring */}
                  <div
                    className={`w-20 h-20 rounded-full mb-4 p-0.5 ${
                      member.role === "admin"
                        ? "bg-gradient-to-tr from-primary via-secondary to-transparent"
                        : "bg-white/20"
                    }`}
                  >
                    <div className="w-full h-full bg-[#0e1514] rounded-full flex items-center justify-center overflow-hidden">
                      {member.avatarUrl ? (
                        <img
                          src={member.avatarUrl}
                          alt={member.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="font-display text-xl font-bold text-white">
                          {initials}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <h3 className="font-display text-lg font-bold text-white group-hover:text-primary transition-colors">
                      {member.name}
                    </h3>
                    {member.role === "admin" && (
                      <span title="Club President">
                        <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 mt-1 mb-3">
                    <span className="bg-primary/10 text-primary font-label-caps text-[10px] px-2.5 py-0.5 rounded-full border border-primary/20">
                      {member.domain}
                    </span>
                    {isDisabled && (
                      <span className="bg-error/20 text-error font-label-caps text-[10px] px-2 py-0.5 rounded-full">
                        Disabled
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-on-surface-variant">
                    {member.usn} • {member.branch}
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="pt-5 mt-4 border-t border-white/10 flex flex-wrap gap-2 justify-center">
                  <button
                    onClick={() => setProfileModalMember(member)}
                    className="px-3 py-1.5 rounded-full bg-[#111111] border border-white/15 text-[11px] text-white hover:border-primary transition-all cursor-pointer"
                  >
                    View Profile
                  </button>

                  {canManage && (
                    <>
                      <button
                        onClick={() => setAssignTodoMember(member)}
                        className="px-3 py-1.5 rounded-full bg-secondary/15 border border-secondary/30 text-[11px] text-secondary hover:bg-secondary hover:text-black font-medium transition-all cursor-pointer flex items-center gap-1"
                      >
                        <CheckSquare className="w-3 h-3" />
                        <span>Assign To-Do</span>
                      </button>

                      {isPresident && (
                        <>
                          <button
                            onClick={() => setEditModalMember(member)}
                            className="px-2.5 py-1.5 rounded-full bg-white/5 border border-white/15 text-[11px] text-white hover:border-primary transition-all cursor-pointer"
                            title="Edit Member"
                          >
                            <Edit className="w-3 h-3 text-primary" />
                          </button>

                          <button
                            onClick={() => handleToggleStatus(member)}
                            className={`px-2.5 py-1.5 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
                              isDisabled
                                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                                : "bg-error/10 text-error border border-error/30 hover:bg-error hover:text-white"
                            }`}
                            title={isDisabled ? "Enable Member" : "Disable Member"}
                          >
                            {isDisabled ? <UserCheck className="w-3 h-3" /> : <UserX className="w-3 h-3" />}
                          </button>
                        </>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ADD MEMBER MODAL */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="glass-card-heavy w-full max-w-2xl rounded-3xl p-8 relative border border-primary/40 my-8 shadow-[0_0_50px_rgba(95,243,232,0.2)]">
            <button
              onClick={() => setAddModalOpen(false)}
              className="absolute top-6 right-6 text-on-surface-variant hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-6 space-y-1">
              <span className="font-label-caps text-xs text-primary uppercase tracking-widest">
                President Provisioning
              </span>
              <h2 className="font-display text-2xl font-bold text-white">
                Create Club Member Account
              </h2>
              <p className="font-body text-xs text-on-surface-variant">
                Creates a secure Firebase Authentication credential and Firestore member profile.
              </p>
            </div>

            {formError && (
              <div className="mb-6 p-4 rounded-2xl bg-error/10 border border-error/30 text-error text-xs">
                {formError}
              </div>
            )}

            <form onSubmit={handleAddMemberSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-label-caps text-on-surface-variant mb-1 uppercase">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={newMemberForm.name}
                    onChange={(e) => setNewMemberForm({ ...newMemberForm, name: e.target.value })}
                    placeholder="e.g. Elena Rodriguez"
                    className="w-full form-input px-3.5 py-2.5 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-label-caps text-on-surface-variant mb-1 uppercase">
                    Login Email (Firebase Auth) *
                  </label>
                  <input
                    type="email"
                    required
                    value={newMemberForm.loginEmail || newMemberForm.email}
                    onChange={(e) =>
                      setNewMemberForm({
                        ...newMemberForm,
                        loginEmail: e.target.value,
                        email: e.target.value,
                      })
                    }
                    placeholder="elena@gmail.com"
                    className="w-full form-input px-3.5 py-2.5 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-label-caps text-on-surface-variant mb-1 uppercase">
                    USN *
                  </label>
                  <input
                    type="text"
                    required
                    value={newMemberForm.usn}
                    onChange={(e) => setNewMemberForm({ ...newMemberForm, usn: e.target.value })}
                    placeholder="1DD23CS019"
                    className="w-full form-input px-3.5 py-2.5 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-label-caps text-on-surface-variant mb-1 uppercase">
                    Semester
                  </label>
                  <select
                    value={newMemberForm.semester}
                    onChange={(e) =>
                      setNewMemberForm({ ...newMemberForm, semester: e.target.value })
                    }
                    className="w-full form-input px-3.5 py-2.5 text-xs text-white bg-[#111111]"
                  >
                    <option value="1st Semester">1st Semester</option>
                    <option value="2nd Semester">2nd Semester</option>
                    <option value="3rd Semester">3rd Semester</option>
                    <option value="4th Semester">4th Semester</option>
                    <option value="5th Semester">5th Semester</option>
                    <option value="6th Semester">6th Semester</option>
                    <option value="7th Semester">7th Semester</option>
                    <option value="8th Semester">8th Semester</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-label-caps text-on-surface-variant mb-1 uppercase">
                    Branch / Dept
                  </label>
                  <input
                    type="text"
                    value={newMemberForm.branch}
                    onChange={(e) => setNewMemberForm({ ...newMemberForm, branch: e.target.value })}
                    placeholder="Computer Science & Engineering"
                    className="w-full form-input px-3.5 py-2.5 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-label-caps text-on-surface-variant mb-1 uppercase">
                    Primary Domain
                  </label>
                  <select
                    value={newMemberForm.domain}
                    onChange={(e) => setNewMemberForm({ ...newMemberForm, domain: e.target.value })}
                    className="w-full form-input px-3.5 py-2.5 text-xs text-white bg-[#111111]"
                  >
                    <option value="UI/UX">UI/UX</option>
                    <option value="Tech">Tech</option>
                    <option value="Web Development">Web Development</option>
                    <option value="AI/ML">AI/ML</option>
                    <option value="App Development">App Development</option>
                    <option value="Graphics">Graphics</option>
                    <option value="Social Media">Social Media</option>
                    <option value="PR / Marketing & Sponsorship">PR / Marketing & Sponsorship</option>
                    <option value="Operations">Operations</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-label-caps text-on-surface-variant mb-1 uppercase">
                    Role
                  </label>
                  <select
                    value={newMemberForm.role}
                    onChange={(e) => setNewMemberForm({ ...newMemberForm, role: e.target.value as MemberRole })}
                    className="w-full form-input px-3.5 py-2.5 text-xs text-white bg-[#111111]"
                  >
                    <option value="member">Normal Member</option>
                    <option value="lead">Domain Head / Team Lead</option>
                    <option value="president">President</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-label-caps text-on-surface-variant mb-1 uppercase">
                    Initial Password *
                  </label>
                  <input
                    type="password"
                    required
                    value={newMemberForm.password}
                    onChange={(e) => setNewMemberForm({ ...newMemberForm, password: e.target.value })}
                    placeholder="••••••••"
                    className="w-full form-input px-3.5 py-2.5 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-label-caps text-on-surface-variant mb-1 uppercase">
                    Confirm Password *
                  </label>
                  <input
                    type="password"
                    required
                    value={newMemberForm.confirmPassword}
                    onChange={(e) => setNewMemberForm({ ...newMemberForm, confirmPassword: e.target.value })}
                    placeholder="••••••••"
                    className="w-full form-input px-3.5 py-2.5 text-xs text-white"
                  />
                </div>
              </div>

              {/* Granular Permissions Section */}
              <div className="p-4 rounded-2xl bg-[#111111] border border-white/10 space-y-2 mt-4">
                <p className="text-xs font-label-caps text-primary uppercase font-bold">
                  Granular Permissions
                </p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newMemberForm.permissions.reviewRequests}
                      onChange={(e) =>
                        setNewMemberForm({
                          ...newMemberForm,
                          permissions: { ...newMemberForm.permissions, reviewRequests: e.target.checked },
                        })
                      }
                      className="rounded text-primary bg-[#111111]"
                    />
                    <span>Review Requests</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newMemberForm.permissions.manageRequests}
                      onChange={(e) =>
                        setNewMemberForm({
                          ...newMemberForm,
                          permissions: { ...newMemberForm.permissions, manageRequests: e.target.checked },
                        })
                      }
                      className="rounded text-primary bg-[#111111]"
                    />
                    <span>Accept/Reject Requests</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newMemberForm.permissions.assignTodos}
                      onChange={(e) =>
                        setNewMemberForm({
                          ...newMemberForm,
                          permissions: { ...newMemberForm.permissions, assignTodos: e.target.checked },
                        })
                      }
                      className="rounded text-primary bg-[#111111]"
                    />
                    <span>Assign Tasks to Members</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newMemberForm.permissions.createEvents}
                      onChange={(e) =>
                        setNewMemberForm({
                          ...newMemberForm,
                          permissions: { ...newMemberForm.permissions, createEvents: e.target.checked },
                        })
                      }
                      className="rounded text-primary bg-[#111111]"
                    />
                    <span>Create Events</span>
                  </label>
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setAddModalOpen(false)}
                  className="px-5 py-2.5 rounded-full border border-white/20 text-xs font-medium hover:bg-white/5 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary px-6 py-2.5 text-xs font-bold cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? "Creating Member..." : "Create Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ASSIGN TASK MODAL */}
      {assignTodoMember && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-card-heavy w-full max-w-md rounded-3xl p-6 relative border border-secondary/40">
            <button
              onClick={() => setAssignTodoMember(null)}
              className="absolute top-5 right-5 text-on-surface-variant hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-4">
              <span className="font-label-caps text-xs text-secondary uppercase">Assign Task</span>
              <h3 className="font-display text-xl font-bold text-white">
                Task for {assignTodoMember.name}
              </h3>
            </div>

            <form onSubmit={handleAssignTodoSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-label-caps text-on-surface-variant mb-1 uppercase">
                  Task Description
                </label>
                <textarea
                  required
                  rows={3}
                  value={todoText}
                  onChange={(e) => setTodoText(e.target.value)}
                  placeholder="e.g. Design hero section wireframes for mobile breakpoint..."
                  className="w-full form-input px-3.5 py-2.5 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-label-caps text-on-surface-variant mb-1 uppercase">
                  Due Timeline
                </label>
                <input
                  type="text"
                  value={todoDueDate}
                  onChange={(e) => setTodoDueDate(e.target.value)}
                  placeholder="Due Friday, 11:59 PM"
                  className="w-full form-input px-3.5 py-2 text-xs text-white"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAssignTodoMember(null)}
                  className="px-4 py-2 rounded-full border border-white/20 text-xs font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full bg-secondary text-black font-bold text-xs hover:shadow-[0_0_20px_rgba(210,187,255,0.4)] cursor-pointer"
                >
                  Assign Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MEMBER MODAL */}
      {editModalMember && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-card-heavy w-full max-w-lg rounded-3xl p-6 relative border border-white/20">
            <button
              onClick={() => setEditModalMember(null)}
              className="absolute top-5 right-5 text-on-surface-variant hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="font-display text-xl font-bold text-white mb-4">
              Edit Member: {editModalMember.name}
            </h3>

            <form onSubmit={handleSaveEditMember} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-label-caps text-on-surface-variant uppercase mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    value={editModalMember.name}
                    onChange={(e) =>
                      setEditModalMember({ ...editModalMember, name: e.target.value })
                    }
                    className="w-full form-input px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-label-caps text-on-surface-variant uppercase mb-1">
                    Domain
                  </label>
                  <input
                    type="text"
                    value={editModalMember.domain}
                    onChange={(e) =>
                      setEditModalMember({ ...editModalMember, domain: e.target.value })
                    }
                    className="w-full form-input px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              {/* Permissions Checkboxes */}
              <div className="p-3.5 bg-[#111111] rounded-2xl border border-white/10 space-y-2">
                <p className="text-[11px] font-label-caps text-primary uppercase font-bold">
                  Permissions
                </p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {Object.keys(editModalMember.permissions || {}).map((permKey) => (
                    <label key={permKey} className="flex items-center gap-2 cursor-pointer text-xs">
                      <input
                        type="checkbox"
                        checked={
                          (editModalMember.permissions as any)?.[permKey] || false
                        }
                        onChange={(e) =>
                          setEditModalMember({
                            ...editModalMember,
                            permissions: {
                              ...editModalMember.permissions,
                              [permKey]: e.target.checked,
                            },
                          })
                        }
                        className="rounded text-primary bg-[#111111]"
                      />
                      <span className="capitalize">{permKey.replace(/([A-Z])/g, " $1")}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditModalMember(null)}
                  className="px-4 py-2 rounded-full border border-white/20 text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full bg-primary text-black font-bold text-xs cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW PROFILE MODAL */}
      {profileModalMember && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-card-heavy w-full max-w-md rounded-3xl p-6 relative border border-white/20 text-center">
            <button
              onClick={() => setProfileModalMember(null)}
              className="absolute top-5 right-5 text-on-surface-variant hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-20 h-20 rounded-full mx-auto mb-4 p-0.5 bg-gradient-to-tr from-primary to-secondary">
              <div className="w-full h-full bg-[#0e1514] rounded-full flex items-center justify-center overflow-hidden">
                {profileModalMember.avatarUrl ? (
                  <img
                    src={profileModalMember.avatarUrl}
                    alt={profileModalMember.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="font-display text-xl font-bold text-white">
                    {profileModalMember.name.charAt(0)}
                  </span>
                )}
              </div>
            </div>

            <h3 className="font-display text-2xl font-bold text-white">
              {profileModalMember.name}
            </h3>
            <p className="text-xs text-primary font-label-caps mb-4">
              {profileModalMember.domain} • {profileModalMember.role}
            </p>

            <div className="bg-[#111111] p-4 rounded-2xl border border-white/10 text-left space-y-2 text-xs mb-6">
              <p className="text-[#bbcac7]">USN: <strong className="text-white">{profileModalMember.usn}</strong></p>
              <p className="text-[#bbcac7]">Branch: <strong className="text-white">{profileModalMember.branch}</strong> ({profileModalMember.semester})</p>
              <p className="text-[#bbcac7]">Email: <strong className="text-white">{profileModalMember.email}</strong></p>
              {profileModalMember.bio && (
                <p className="text-on-surface-variant pt-2 border-t border-white/10 italic">
                  &ldquo;{profileModalMember.bio}&rdquo;
                </p>
              )}
            </div>

            <button
              onClick={() => setProfileModalMember(null)}
              className="w-full py-2.5 rounded-full bg-[#161d1c] border border-white/20 text-white text-xs font-medium hover:border-primary cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
