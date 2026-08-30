"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Member, MemberStatus, MemberRole } from "@/types/member";
import { JoinRequest, RequestStatus } from "@/types/joinRequest";
import { ClubEvent } from "@/types/event";
import { ActivityLog } from "@/types/activity";
import { Todo } from "@/types/todo";
import {
  subscribeToMembers,
  setMemberStatus,
  updateMember,
  assignDomainHead,
} from "@/lib/services/memberService";
import {
  subscribeToJoinRequests,
  updateRequestStatus,
} from "@/lib/services/requestService";
import { subscribeToEvents } from "@/lib/services/eventService";
import { subscribeToTodos } from "@/lib/services/todoService";
import { subscribeToRecentActivity } from "@/lib/services/activityService";
import { seedFirestoreDatabase } from "@/lib/services/seedService";
import { useAuth } from "@/lib/firebase/authContext";
import {
  Users,
  Layers,
  Calendar,
  CheckSquare,
  Activity,
  Check,
  X,
  Search,
  ShieldCheck,
  UserCheck,
  UserX,
  Sparkles,
  ExternalLink,
  Database,
  AlertCircle,
  Crown,
  Clock,
  Briefcase,
} from "lucide-react";

export const AdminControl: React.FC = () => {
  const { user, memberProfile, isPresident } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [requests, setRequests] = useState<JoinRequest[]>([]);
  const [events, setEvents] = useState<ClubEvent[]>([]);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [searchMember, setSearchMember] = useState("");
  const [activeView, setActiveView] = useState<"overview" | "domain_heads" | "waitlist" | "users">("overview");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [seeding, setSeeding] = useState(false);
  const [seedSuccess, setSeedSuccess] = useState<string | null>(null);

  // Assign Domain Head Modal
  const [selectedMemberForLead, setSelectedMemberForLead] = useState<Member | null>(null);
  const [leadDomainInput, setLeadDomainInput] = useState("Web Development");
  const [leadDesignationInput, setLeadDesignationInput] = useState("Web Development Team Lead");

  useEffect(() => {
    setLoading(true);
    setError(null);

    const unsubMembers = subscribeToMembers(
      (m) => setMembers(m),
      (err) => console.warn("Members listener note:", err)
    );

    const unsubRequests = subscribeToJoinRequests(
      undefined,
      (r) => setRequests(r),
      (err) => console.warn("Requests listener note:", err)
    );

    const unsubEvents = subscribeToEvents(
      (e) => setEvents(e),
      (err) => console.warn("Events listener note:", err)
    );

    const unsubTodos = subscribeToTodos(
      undefined,
      true,
      (t) => setTodos(t),
      (err) => console.warn("Todos listener note:", err)
    );

    const unsubActivity = subscribeToRecentActivity(
      20,
      (a) => setActivities(a),
      (err) => console.warn("Activity listener note:", err)
    );

    setLoading(false);

    return () => {
      unsubMembers();
      unsubRequests();
      unsubEvents();
      unsubTodos();
      unsubActivity();
    };
  }, []);

  const handleRequestAction = async (id: string, status: RequestStatus) => {
    try {
      await updateRequestStatus(
        id,
        status,
        memberProfile?.uid || "president",
        memberProfile?.name || "President"
      );
    } catch (err: any) {
      alert("Error updating request: " + (err.message || "Failed"));
    }
  };

  const handleToggleMemberStatus = async (member: Member) => {
    const newStatus: MemberStatus = member.status === "active" ? "disabled" : "active";
    try {
      await setMemberStatus(
        member.uid,
        newStatus,
        memberProfile?.uid || "president",
        memberProfile?.name || "President"
      );
    } catch (err: any) {
      alert("Error updating member status: " + (err.message || "Failed"));
    }
  };

  const handleAssignDomainHeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMemberForLead) return;

    try {
      await assignDomainHead(
        selectedMemberForLead.uid,
        [leadDomainInput],
        leadDesignationInput || `${leadDomainInput} Team Lead`,
        memberProfile?.uid || "president",
        memberProfile?.name || "President"
      );
      setSelectedMemberForLead(null);
    } catch (err: any) {
      alert("Error assigning Domain Head: " + (err.message || "Failed"));
    }
  };

  const handleRemoveDomainHead = async (member: Member) => {
    try {
      await updateMember(
        member.uid,
        {
          role: "member",
          leadDomains: [],
          designation: "Club Creator",
          permissions: {
            reviewRequests: false,
            manageRequests: false,
            assignTodos: false,
            manageMembers: false,
            createEvents: false,
          },
        },
        memberProfile?.uid || "president",
        memberProfile?.name || "President"
      );
    } catch (err: any) {
      alert("Error removing Domain Head role: " + (err.message || "Failed"));
    }
  };

  const handleSeedDatabase = async () => {
    setSeeding(true);
    setSeedSuccess(null);
    try {
      try {
        const res = await fetch("/api/admin/seed", { method: "POST" });
        if (res.ok) {
          const data = await res.json();
          setSeedSuccess(data.message || "Firestore database seeded successfully!");
          setSeeding(false);
          return;
        }
      } catch (apiErr) {
        console.warn("API route seed failed, running client seed fallback:", apiErr);
      }

      const res = await seedFirestoreDatabase();
      setSeedSuccess(res.message);
    } catch (err: any) {
      alert("Seeding error: " + (err.message || "Failed to seed database"));
    } finally {
      setSeeding(false);
    }
  };

  const pendingRequests = requests.filter((r) => r.status === "pending");
  const waitlistedRequests = requests.filter((r) => r.status === "waitlisted");
  const activeMembers = members.filter((m) => m.status === "active");
  const domainHeads = members.filter((m) => m.role === "lead");
  const activeEvents = events.filter((e) => e.status === "active");

  const filteredMembers = members.filter(
    (m) =>
      m.name.toLowerCase().includes(searchMember.toLowerCase()) ||
      m.domain.toLowerCase().includes(searchMember.toLowerCase()) ||
      m.usn.toLowerCase().includes(searchMember.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 pb-4 border-b border-white/10">
        <div>
          <span className="font-label-caps text-xs text-primary tracking-widest uppercase bg-primary/10 px-3 py-1 rounded-full border border-primary/20 flex items-center gap-1.5 w-fit">
            <Crown className="w-3.5 h-3.5 text-primary" />
            <span>President Control Center</span>
          </span>
          <h1 className="font-display text-4xl sm:text-5xl font-bold text-white tracking-tight mt-2">
            Executive Portal
          </h1>
          <p className="font-body text-sm text-on-surface-variant max-w-xl">
            Global management: domain heads, applications & waitlists, member provisioning, and club activities.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleSeedDatabase}
            disabled={seeding}
            className="px-4 py-2.5 rounded-full bg-[#161d1c] border border-primary/40 text-primary text-xs font-bold hover:bg-primary hover:text-black transition-all flex items-center gap-2 cursor-pointer shadow-[0_0_20px_rgba(95,243,232,0.15)] disabled:opacity-50"
            title="Seed sample members, events, and candidate applications into Firestore"
          >
            <Database className="w-4 h-4" />
            <span>{seeding ? "Seeding Data..." : "Seed Sample Data"}</span>
          </button>

          <Link
            href="/dashboard/members"
            className="btn-primary shrink-0 cursor-pointer shadow-[0_0_25px_rgba(95,243,232,0.4)]"
          >
            + Provision Member
          </Link>
        </div>
      </div>

      {seedSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm flex items-center gap-3">
          <Check className="w-5 h-5 shrink-0" />
          <span>{seedSuccess}</span>
        </div>
      )}

      {/* Control Navigation Pills */}
      <div className="flex bg-[#111111] rounded-full p-1 border border-white/10 w-fit overflow-x-auto">
        <button
          onClick={() => setActiveView("overview")}
          className={`px-5 py-2 rounded-full font-bold text-xs transition-all cursor-pointer ${
            activeView === "overview" ? "bg-primary text-black" : "text-on-surface-variant hover:text-white"
          }`}
        >
          Overview ({members.length})
        </button>
        <button
          onClick={() => setActiveView("domain_heads")}
          className={`px-5 py-2 rounded-full font-bold text-xs transition-all cursor-pointer ${
            activeView === "domain_heads" ? "bg-primary text-black" : "text-on-surface-variant hover:text-white"
          }`}
        >
          Domain Heads / Team Leads ({domainHeads.length})
        </button>
        <button
          onClick={() => setActiveView("waitlist")}
          className={`px-5 py-2 rounded-full font-bold text-xs transition-all cursor-pointer ${
            activeView === "waitlist" ? "bg-amber-400 text-black" : "text-on-surface-variant hover:text-white"
          }`}
        >
          Waitlist Review ({waitlistedRequests.length})
        </button>
        <button
          onClick={() => setActiveView("users")}
          className={`px-5 py-2 rounded-full font-bold text-xs transition-all cursor-pointer ${
            activeView === "users" ? "bg-primary text-black" : "text-on-surface-variant hover:text-white"
          }`}
        >
          User Management ({activeMembers.length})
        </button>
      </div>

      {/* VIEW: OVERVIEW */}
      {activeView === "overview" && (
        <div className="space-y-8">
          {/* Bento Metric Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="glass-card p-6 rounded-3xl border border-white/10 flex flex-col justify-between">
              <div className="flex justify-between items-center mb-4">
                <span className="text-xs font-label-caps text-on-surface-variant uppercase">Active Members</span>
                <Users className="w-5 h-5 text-primary" />
              </div>
              <p className="font-display text-4xl font-bold text-white">{activeMembers.length}</p>
              <p className="text-xs text-on-surface-variant mt-2">Total registered creators</p>
            </div>

            <div className="glass-card p-6 rounded-3xl border border-white/10 flex flex-col justify-between">
              <div className="flex justify-between items-center mb-4">
                <span className="text-xs font-label-caps text-on-surface-variant uppercase">Domain Leads</span>
                <Crown className="w-5 h-5 text-secondary" />
              </div>
              <p className="font-display text-4xl font-bold text-secondary">{domainHeads.length}</p>
              <p className="text-xs text-on-surface-variant mt-2">Leading domain teams</p>
            </div>

            <div className="glass-card p-6 rounded-3xl border border-white/10 flex flex-col justify-between">
              <div className="flex justify-between items-center mb-4">
                <span className="text-xs font-label-caps text-on-surface-variant uppercase">Pending Candidates</span>
                <Layers className="w-5 h-5 text-[#ffd6ad]" />
              </div>
              <p className="font-display text-4xl font-bold text-[#ffd6ad]">{pendingRequests.length}</p>
              <Link href="/dashboard/requests" className="text-xs text-primary hover:underline mt-2 inline-block">
                Review Pipeline →
              </Link>
            </div>

            <div className="glass-card p-6 rounded-3xl border border-white/10 flex flex-col justify-between">
              <div className="flex justify-between items-center mb-4">
                <span className="text-xs font-label-caps text-on-surface-variant uppercase">Waitlisted</span>
                <Clock className="w-5 h-5 text-amber-300" />
              </div>
              <p className="font-display text-4xl font-bold text-amber-300">{waitlistedRequests.length}</p>
              <button
                onClick={() => setActiveView("waitlist")}
                className="text-xs text-amber-300 hover:underline mt-2 text-left cursor-pointer"
              >
                Review Waitlist →
              </button>
            </div>
          </div>

          {/* Activity Log Feed */}
          <div className="glass-card rounded-3xl p-6 border border-white/10">
            <h3 className="font-display text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              <span>Real-Time Club Activity Audit Log</span>
            </h3>
            <div className="space-y-3">
              {activities.length === 0 ? (
                <p className="text-xs text-on-surface-variant py-4">No recent activity logged yet.</p>
              ) : (
                activities.slice(0, 8).map((act) => (
                  <div
                    key={act.id}
                    className="p-3.5 rounded-2xl bg-[#111111] border border-white/5 flex flex-col sm:flex-row justify-between sm:items-center gap-2 text-xs"
                  >
                    <div>
                      <span className="font-bold text-white mr-2">[{act.action}]</span>
                      <span className="text-[#bbcac7]">{act.details || act.target}</span>
                    </div>
                    <span className="text-[10px] font-mono text-on-surface-variant shrink-0">
                      {new Date(act.createdAt).toLocaleString()}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* VIEW: DOMAIN HEADS / TEAM LEADS */}
      {activeView === "domain_heads" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-display text-2xl font-bold text-white">Domain Heads & Team Leads</h3>
              <p className="text-xs text-on-surface-variant mt-1">
                Each domain/team has assigned domain heads with autonomous review authority for their domain.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {domainHeads.length === 0 ? (
              <div className="col-span-full glass-card p-12 text-center rounded-3xl border border-white/10">
                <Crown className="w-8 h-8 text-primary/30 mx-auto mb-2" />
                <p className="text-white font-bold">No Domain Heads Assigned Yet</p>
                <p className="text-xs text-on-surface-variant mt-1">
                  Go to User Management tab below to assign a member as a Domain Head / Team Lead.
                </p>
              </div>
            ) : (
              domainHeads.map((lead) => (
                <div
                  key={lead.uid}
                  className="glass-card rounded-3xl p-6 border border-secondary/40 flex flex-col justify-between glow-hover"
                >
                  <div>
                    <div className="flex justify-between items-start mb-3">
                      <span className="text-[10px] font-label-caps text-secondary bg-secondary/10 px-3 py-1 rounded-full border border-secondary/20 uppercase font-bold">
                        {lead.designation || "Domain Head"}
                      </span>
                      <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                        Active Lead
                      </span>
                    </div>

                    <h4 className="font-display text-xl font-bold text-white mb-1">{lead.name}</h4>
                    <p className="text-xs text-[#859491] mb-4">{lead.email}</p>

                    <div className="p-3 rounded-xl bg-[#111111] border border-white/10 text-xs space-y-1">
                      <p className="text-on-surface-variant">
                        <strong className="text-white">Assigned Domains:</strong>{" "}
                        <span className="text-primary font-bold">
                          {(lead.leadDomains && lead.leadDomains.join(", ")) || lead.domain}
                        </span>
                      </p>
                      <p className="text-on-surface-variant">
                        <strong className="text-white">USN:</strong> {lead.usn} ({lead.branch})
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-white/10 flex justify-end gap-2 mt-4">
                    <button
                      onClick={() => handleRemoveDomainHead(lead)}
                      className="px-3 py-1.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs hover:bg-rose-500 hover:text-white transition-all cursor-pointer"
                    >
                      Revoke Lead Role
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* VIEW: WAITLIST REVIEW */}
      {activeView === "waitlist" && (
        <div className="space-y-6">
          <div>
            <h3 className="font-display text-2xl font-bold text-white">Waitlisted Candidate Review</h3>
            <p className="text-xs text-on-surface-variant mt-1">
              Candidates placed on hold for later evaluation. You can review their submission and accept or reject.
            </p>
          </div>

          <div className="space-y-4">
            {waitlistedRequests.length === 0 ? (
              <div className="glass-card p-12 text-center rounded-3xl border border-white/10">
                <Clock className="w-8 h-8 text-amber-300/40 mx-auto mb-2" />
                <p className="text-white font-bold">No Candidates on Waitlist</p>
                <p className="text-xs text-on-surface-variant mt-1">
                  All candidate applications are currently processed or pending initial review.
                </p>
              </div>
            ) : (
              waitlistedRequests.map((req) => (
                <div
                  key={req.id}
                  className="glass-card rounded-2xl p-5 border border-amber-500/30 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-display text-base font-bold text-white">{req.name}</h4>
                      <span className="text-[10px] font-label-caps px-2 py-0.5 rounded-full bg-white/10 text-white">
                        {req.domain}
                      </span>
                      {req.eventName && (
                        <span className="text-[10px] font-label-caps px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                          {req.eventName}
                        </span>
                      )}
                      <span className="text-[10px] font-label-caps px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase font-bold">
                        Waitlisted
                      </span>
                    </div>
                    <p className="text-xs text-on-surface-variant mt-1">
                      {req.usn} • {req.branch} • {req.email}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleRequestAction(req.id, "accepted")}
                      className="px-4 py-2 rounded-full bg-emerald-500 text-black font-bold text-xs hover:shadow-[0_0_20px_rgba(16,185,129,0.5)] transition-all cursor-pointer flex items-center gap-1"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Accept from Waitlist</span>
                    </button>
                    <button
                      onClick={() => handleRequestAction(req.id, "rejected")}
                      className="px-4 py-2 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold text-xs hover:bg-rose-500 hover:text-white transition-all cursor-pointer flex items-center gap-1"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Reject</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* VIEW: USER MANAGEMENT */}
      {activeView === "users" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-on-surface-variant absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchMember}
                onChange={(e) => setSearchMember(e.target.value)}
                placeholder="Search members by name, domain, or USN..."
                className="w-full pl-10 pr-4 py-2 text-xs bg-[#111111] border border-white/10 rounded-2xl text-white placeholder-[#71717a] focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-3">
            {filteredMembers.map((m) => (
              <div
                key={m.uid}
                className="glass-card rounded-2xl p-4 border border-white/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-[#111111] border border-white/10 flex items-center justify-center text-primary font-bold text-sm">
                    {m.name.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-display text-sm font-bold text-white">{m.name}</h4>
                      <span
                        className={`text-[10px] font-label-caps px-2 py-0.5 rounded-full uppercase font-bold ${
                          m.role === "president" || m.role === "admin"
                            ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                            : m.role === "lead"
                            ? "bg-secondary-container text-white border border-secondary/40"
                            : "bg-white/10 text-white"
                        }`}
                      >
                        {m.role === "president" || m.role === "admin" ? "President" : m.role === "lead" ? "Domain Head" : "Member"}
                      </span>
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                          m.status === "active" ? "text-emerald-400 bg-emerald-500/10" : "text-rose-400 bg-rose-500/10"
                        }`}
                      >
                        {m.status}
                      </span>
                    </div>
                    <p className="text-xs text-on-surface-variant mt-0.5">
                      {m.email} • {m.domain} • {m.usn}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {m.role === "member" && (
                    <button
                      onClick={() => {
                        setSelectedMemberForLead(m);
                        setLeadDomainInput(m.domain || "Web Development");
                        setLeadDesignationInput(`${m.domain || "Web Development"} Team Lead`);
                      }}
                      className="px-3 py-1.5 rounded-full bg-secondary/10 border border-secondary/30 text-secondary text-xs hover:bg-secondary hover:text-black transition-all cursor-pointer flex items-center gap-1"
                    >
                      <Crown className="w-3.5 h-3.5" />
                      <span>Promote to Lead</span>
                    </button>
                  )}

                  {m.role === "lead" && (
                    <button
                      onClick={() => handleRemoveDomainHead(m)}
                      className="px-3 py-1.5 rounded-full bg-white/5 border border-white/20 text-white text-xs hover:border-rose-500 hover:text-rose-400 transition-all cursor-pointer"
                    >
                      Demote to Member
                    </button>
                  )}

                  {m.role !== "president" && m.role !== "admin" && (
                    <button
                      onClick={() => handleToggleMemberStatus(m)}
                      className={`px-3 py-1.5 rounded-full text-xs transition-all cursor-pointer ${
                        m.status === "active"
                          ? "bg-rose-500/10 border border-rose-500/30 text-rose-300 hover:bg-rose-500 hover:text-white"
                          : "bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500 hover:text-black"
                      }`}
                    >
                      {m.status === "active" ? "Disable" : "Enable"}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ASSIGN DOMAIN HEAD MODAL */}
      {selectedMemberForLead && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-card-heavy w-full max-w-md rounded-3xl p-8 relative border border-secondary/40 shadow-[0_0_50px_rgba(96,1,209,0.3)]">
            <button
              onClick={() => setSelectedMemberForLead(null)}
              className="absolute top-6 right-6 text-on-surface-variant hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-6">
              <span className="font-label-caps text-xs text-secondary uppercase tracking-widest flex items-center gap-1">
                <Crown className="w-3.5 h-3.5" />
                <span>President Authorization</span>
              </span>
              <h2 className="font-display text-2xl font-bold text-white mt-1">
                Assign Domain Head
              </h2>
              <p className="text-xs text-on-surface-variant mt-1">
                Promote <strong className="text-white">{selectedMemberForLead.name}</strong> to lead an autonomous domain team.
              </p>
            </div>

            <form onSubmit={handleAssignDomainHeadSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-label-caps text-on-surface-variant mb-1 uppercase">
                  Assigned Domain *
                </label>
                <select
                  value={leadDomainInput}
                  onChange={(e) => {
                    setLeadDomainInput(e.target.value);
                    setLeadDesignationInput(`${e.target.value} Team Lead`);
                  }}
                  className="w-full form-input px-3.5 py-2.5 text-xs text-white bg-[#111111]"
                >
                  <option value="Web Development">Web Development</option>
                  <option value="AI/ML">AI/ML</option>
                  <option value="App Development">App Development</option>
                  <option value="UI/UX">UI/UX</option>
                  <option value="Tech">Tech</option>
                  <option value="Graphics">Graphics</option>
                  <option value="Social Media">Social Media</option>
                  <option value="PR / Marketing & Sponsorship">PR / Marketing & Sponsorship</option>
                  <option value="Operations">Operations</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-label-caps text-on-surface-variant mb-1 uppercase">
                  Designation Title *
                </label>
                <input
                  type="text"
                  required
                  value={leadDesignationInput}
                  onChange={(e) => setLeadDesignationInput(e.target.value)}
                  className="w-full form-input px-3.5 py-2.5 text-xs text-white"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedMemberForLead(null)}
                  className="px-5 py-2.5 rounded-full border border-white/20 text-xs font-medium hover:bg-white/5 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-full bg-secondary text-white font-bold text-xs hover:shadow-[0_0_25px_rgba(96,1,209,0.6)] cursor-pointer"
                >
                  Confirm Lead Role
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
