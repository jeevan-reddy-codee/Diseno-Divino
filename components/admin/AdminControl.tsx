"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Member, MemberStatus } from "@/types/member";
import { JoinRequest, RequestStatus } from "@/types/joinRequest";
import { ClubEvent } from "@/types/event";
import { ActivityLog } from "@/types/activity";
import { Todo } from "@/types/todo";
import {
  subscribeToMembers,
  setMemberStatus,
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
} from "lucide-react";

export const AdminControl: React.FC = () => {
  const { user, memberProfile } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [requests, setRequests] = useState<JoinRequest[]>([]);
  const [events, setEvents] = useState<ClubEvent[]>([]);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [searchMember, setSearchMember] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [seeding, setSeeding] = useState(false);
  const [seedSuccess, setSeedSuccess] = useState<string | null>(null);

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
        memberProfile?.uid || "admin",
        memberProfile?.name || "Admin"
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
        memberProfile?.uid || "admin",
        memberProfile?.name || "Admin"
      );
    } catch (err: any) {
      alert("Error updating member status: " + (err.message || "Failed"));
    }
  };

  const handleSeedDatabase = async () => {
    setSeeding(true);
    setSeedSuccess(null);
    try {
      // First try server-side seed endpoint
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

      // Fallback to client Firestore seed
      const res = await seedFirestoreDatabase();
      setSeedSuccess(res.message);
    } catch (err: any) {
      alert("Seeding error: " + (err.message || "Failed to seed database"));
    } finally {
      setSeeding(false);
    }
  };

  const pendingRequests = requests.filter((r) => r.status === "pending");
  const activeMembers = members.filter((m) => m.status === "active");
  const openTodos = todos.filter((t) => !t.completed);
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
          <span className="font-label-caps text-xs text-secondary tracking-widest uppercase bg-secondary/10 px-3 py-1 rounded-full border border-secondary/20 flex items-center gap-1.5 w-fit">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Root Administrator Level</span>
          </span>
          <h1 className="font-display text-4xl sm:text-5xl font-bold text-white tracking-tight mt-2">
            Admin Control Center
          </h1>
          <p className="font-body text-sm text-on-surface-variant max-w-xl">
            Real-time Firestore overview: applicant pipeline, member provisioning, permission matrix, and activity logs.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleSeedDatabase}
            disabled={seeding}
            className="px-4 py-2.5 rounded-full bg-[#161d1c] border border-primary/40 text-primary text-xs font-bold hover:bg-primary hover:text-black transition-all flex items-center gap-2 cursor-pointer shadow-[0_0_20px_rgba(95,243,232,0.15)] disabled:opacity-50"
            title="Seed 12 sample members (2 per domain), events, todos, and requests into Firestore"
          >
            <Database className="w-4 h-4" />
            <span>{seeding ? "Seeding Database..." : "Seed 12 Sample Members"}</span>
          </button>

          <Link
            href="/dashboard/members"
            className="btn-primary shrink-0 cursor-pointer shadow-[0_0_25px_rgba(95,243,232,0.4)]"
          >
            + Add New Member
          </Link>
        </div>
      </div>

      {seedSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-3">
          <Check className="w-4 h-4 shrink-0" />
          <span>{seedSuccess}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-error/10 border border-error/30 text-error text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Quick Stat Tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-6 rounded-3xl border border-white/10">
          <div className="flex justify-between items-center mb-3">
            <span className="font-label-caps text-xs text-primary uppercase">
              Pending Requests
            </span>
            <Layers className="w-5 h-5 text-primary" />
          </div>
          <p className="font-display text-3xl font-bold text-white">
            {pendingRequests.length}
          </p>
          <p className="text-[11px] text-on-surface-variant mt-1">Awaiting Domain Lead Review</p>
        </div>

        <div className="glass-card p-6 rounded-3xl border border-white/10">
          <div className="flex justify-between items-center mb-3">
            <span className="font-label-caps text-xs text-secondary uppercase">
              Active Members
            </span>
            <Users className="w-5 h-5 text-secondary" />
          </div>
          <p className="font-display text-3xl font-bold text-white">
            {activeMembers.length}
          </p>
          <p className="text-[11px] text-on-surface-variant mt-1">Across 6 Specialized Domains</p>
        </div>

        <div className="glass-card p-6 rounded-3xl border border-white/10">
          <div className="flex justify-between items-center mb-3">
            <span className="font-label-caps text-xs text-[#ffd6ad] uppercase">
              Open To-Dos
            </span>
            <CheckSquare className="w-5 h-5 text-[#ffd6ad]" />
          </div>
          <p className="font-display text-3xl font-bold text-white">
            {openTodos.length}
          </p>
          <p className="text-[11px] text-on-surface-variant mt-1">Active Deliverables</p>
        </div>

        <div className="glass-card p-6 rounded-3xl border border-white/10">
          <div className="flex justify-between items-center mb-3">
            <span className="font-label-caps text-xs text-emerald-400 uppercase">
              Active Events
            </span>
            <Calendar className="w-5 h-5 text-emerald-400" />
          </div>
          <p className="font-display text-3xl font-bold text-white">
            {activeEvents.length}
          </p>
          <p className="text-[11px] text-on-surface-variant mt-1">Upcoming on Schedule</p>
        </div>
      </div>

      {/* Main Grid: Management Modules */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column (8 Cols): Applications & Members */}
        <div className="lg:col-span-8 space-y-8">
          {/* Applications Pending Review */}
          <section className="glass-card rounded-3xl p-6 sm:p-8 border border-white/10 space-y-6">
            <div className="flex justify-between items-center pb-4 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <Layers className="w-5 h-5 text-primary" />
                <h2 className="font-display text-xl font-bold text-white">
                  Applications Pending Review
                </h2>
              </div>
              <Link
                href="/dashboard/requests"
                className="text-xs text-primary hover:underline font-label-caps"
              >
                View all in Domains →
              </Link>
            </div>

            <div className="space-y-3">
              {pendingRequests.length === 0 ? (
                <p className="text-xs text-on-surface-variant text-center py-6">
                  No pending applications. All requests have been reviewed.
                </p>
              ) : (
                pendingRequests.slice(0, 4).map((req) => (
                  <div
                    key={req.id}
                    className="p-4 rounded-2xl bg-[#111111] border border-white/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-primary/40 transition-all"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-display text-base font-bold text-white">
                          {req.name}
                        </h4>
                        <span className="text-[10px] font-label-caps px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                          {req.domain}
                        </span>
                      </div>
                      <p className="text-xs text-on-surface-variant mt-1">
                        {req.usn} • {req.branch} • {req.email}
                      </p>
                      {req.workLink && (
                        <a
                          href={req.workLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline mt-1"
                        >
                          <span>Portfolio Link</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                      <button
                        onClick={() => handleRequestAction(req.id, "accepted")}
                        className="px-3.5 py-1.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold hover:bg-emerald-500 hover:text-black transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Accept</span>
                      </button>
                      <button
                        onClick={() => handleRequestAction(req.id, "rejected")}
                        className="px-3.5 py-1.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 text-xs font-bold hover:bg-rose-500 hover:text-white transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Reject</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Member Management Table */}
          <section className="glass-card rounded-3xl p-6 sm:p-8 border border-white/10 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <Users className="w-5 h-5 text-secondary" />
                <h2 className="font-display text-xl font-bold text-white">
                  Member Management
                </h2>
              </div>
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-on-surface-variant absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchMember}
                  onChange={(e) => setSearchMember(e.target.value)}
                  placeholder="Filter members..."
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-[#111111] border border-white/15 rounded-full text-white placeholder-[#71717a] focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-on-surface-variant font-label-caps uppercase">
                    <th className="pb-3 px-2">Member</th>
                    <th className="pb-3 px-2">Domain & USN</th>
                    <th className="pb-3 px-2">Role</th>
                    <th className="pb-3 px-2">Status</th>
                    <th className="pb-3 px-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredMembers.slice(0, 6).map((m) => (
                    <tr key={m.uid} className="hover:bg-white/5 transition-colors">
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-[#111111] border border-white/10 flex items-center justify-center font-bold text-primary shrink-0">
                            {m.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-white">{m.name}</p>
                            <p className="text-[10px] text-[#859491]">{m.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-2 text-[#bbcac7]">
                        {m.domain} • {m.usn}
                      </td>
                      <td className="py-3 px-2">
                        <span className="capitalize font-label-caps text-secondary">
                          {m.role}
                        </span>
                      </td>
                      <td className="py-3 px-2">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-label-caps uppercase font-bold ${
                            m.status === "active"
                              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                              : "bg-error/20 text-error border border-error/30"
                          }`}
                        >
                          {m.status}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-right">
                        <button
                          onClick={() => handleToggleMemberStatus(m)}
                          className={`p-1.5 rounded-full transition-all cursor-pointer ${
                            m.status === "active"
                              ? "text-error hover:bg-error/10"
                              : "text-emerald-400 hover:bg-emerald-500/10"
                          }`}
                          title={m.status === "active" ? "Disable Portal Access" : "Enable Access"}
                        >
                          {m.status === "active" ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        {/* Right Column (4 Cols): Live Activity Audit Feed */}
        <div className="lg:col-span-4 space-y-6">
          <section className="glass-card-heavy rounded-3xl p-6 sm:p-7 border border-white/15 space-y-6">
            <div className="flex items-center gap-2.5 pb-4 border-b border-white/10">
              <Activity className="w-5 h-5 text-primary" />
              <h2 className="font-display text-xl font-bold text-white">
                Live Audit Stream
              </h2>
            </div>

            <div className="space-y-4">
              {activities.length === 0 ? (
                <p className="text-xs text-on-surface-variant py-6 text-center">
                  No activity recorded yet.
                </p>
              ) : (
                activities.map((act) => (
                  <div
                    key={act.id}
                    className="p-3.5 rounded-2xl bg-[#111111] border border-white/10 text-xs space-y-1 relative"
                  >
                    <div className="flex justify-between items-start gap-2">
                      <span className="font-display font-bold text-white">
                        {act.action}
                      </span>
                      <span className="text-[10px] text-[#859491] whitespace-nowrap">
                        {new Date(act.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>

                    <p className="text-on-surface-variant text-[11px] leading-relaxed">
                      {act.details || `Performed on ${act.target || "System"}`}
                    </p>

                    <div className="flex items-center gap-1.5 pt-1 text-[10px] text-primary font-label-caps">
                      <span>By: {act.performedByName || act.performedBy}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
