"use client";

import React, { useState, useEffect } from "react";
import { JoinRequest, DomainType, RequestStatus } from "@/types/joinRequest";
import {
  subscribeToJoinRequests,
  updateRequestStatus,
} from "@/lib/services/requestService";
import { useAuth } from "@/lib/firebase/authContext";
import {
  Layout,
  Code,
  Brush,
  Share2,
  Megaphone,
  Workflow,
  Check,
  X,
  ExternalLink,
  Eye,
  Search,
  Clock,
  Sparkles,
  AlertCircle,
  ShieldCheck,
  UserCheck,
} from "lucide-react";

export const DomainsAndRequests: React.FC = () => {
  const { user, memberProfile, isPresident, isDomainHead } = useAuth();
  const [selectedDomain, setSelectedDomain] = useState<DomainType | "All">("All");
  const [requests, setRequests] = useState<JoinRequest[]>([]);
  const [activeRequest, setActiveRequest] = useState<JoinRequest | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<RequestStatus | "All">("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [notesInput, setNotesInput] = useState("");

  const isUserPresident = isPresident;
  const userLeadDomains = memberProfile?.leadDomains || (memberProfile?.domain ? [memberProfile.domain] : []);
  const isUserDomainHead = !isUserPresident && isDomainHead();

  // If Domain Head, default their view to their assigned domain
  useEffect(() => {
    if (isUserDomainHead && userLeadDomains.length > 0) {
      setSelectedDomain(userLeadDomains[0] as DomainType);
    }
  }, [isUserDomainHead]);

  const allDomainsList: { name: DomainType; icon: any }[] = [
    { name: "UI/UX", icon: Layout },
    { name: "Tech", icon: Code },
    { name: "Web Development", icon: Code },
    { name: "AI/ML", icon: Workflow },
    { name: "App Development", icon: Code },
    { name: "Graphics", icon: Brush },
    { name: "Social Media", icon: Share2 },
    { name: "PR / Marketing & Sponsorship", icon: Megaphone },
    { name: "Operations", icon: Workflow },
  ];

  // Filter domain options if domain head
  const visibleDomains = isUserPresident
    ? allDomainsList
    : allDomainsList.filter((d) =>
        userLeadDomains.some((ld) => ld.toLowerCase() === d.name.toLowerCase())
      );

  useEffect(() => {
    setLoading(true);
    setError(null);

    // If domain head, scope query to domain
    const queryDomain = isUserPresident
      ? undefined
      : (userLeadDomains.length === 1 ? userLeadDomains[0] : undefined);

    const unsubscribe = subscribeToJoinRequests(
      queryDomain as any,
      (reqs) => {
        // Enforce backend/client scoping: Domain heads only receive requests for their domain
        if (!isUserPresident && isUserDomainHead) {
          const scopedReqs = reqs.filter((r) =>
            userLeadDomains.some((ld) => ld.toLowerCase() === r.domain.toLowerCase())
          );
          setRequests(scopedReqs);
        } else {
          setRequests(reqs);
        }
        setLoading(false);
      },
      (err) => {
        setError(err.message || "Failed to load applications from Firestore.");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [isUserPresident, isUserDomainHead]);

  const counts = React.useMemo(() => {
    const res: Record<string, { total: number; pending: number; accepted: number; rejected: number; waitlisted: number }> = {};
    allDomainsList.forEach((d) => {
      res[d.name] = { total: 0, pending: 0, accepted: 0, rejected: 0, waitlisted: 0 };
    });

    requests.forEach((r) => {
      if (!res[r.domain]) {
        res[r.domain] = { total: 0, pending: 0, accepted: 0, rejected: 0, waitlisted: 0 };
      }
      res[r.domain].total += 1;
      if (r.status === "pending") res[r.domain].pending += 1;
      if (r.status === "accepted") res[r.domain].accepted += 1;
      if (r.status === "rejected") res[r.domain].rejected += 1;
      if (r.status === "waitlisted") res[r.domain].waitlisted += 1;
    });
    return res;
  }, [requests]);

  const handleAction = async (id: string, status: RequestStatus, customNotes?: string) => {
    const reviewerUid = memberProfile?.uid || user?.uid || "president";
    const reviewerName = memberProfile?.name || (isUserPresident ? "President" : "Domain Head");

    setActionLoading(id);
    try {
      const updated = await updateRequestStatus(
        id,
        status,
        reviewerUid,
        reviewerName,
        customNotes || notesInput || `Status updated to ${status}`
      );
      if (activeRequest?.id === id && updated) {
        setActiveRequest(updated);
      }
      setNotesInput("");
    } catch (err: any) {
      alert("Error updating application: " + (err.message || "Failed"));
    } finally {
      setActionLoading(null);
    }
  };

  const filteredRequests = requests.filter((r) => {
    const matchDomain = selectedDomain === "All" || r.domain.toLowerCase() === selectedDomain.toLowerCase();
    const matchStatus = statusFilter === "All" || r.status === statusFilter;
    const matchSearch =
      !searchQuery ||
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.usn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.eventName && r.eventName.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchDomain && matchStatus && matchSearch;
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 pb-4 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="font-label-caps text-xs text-primary tracking-widest uppercase bg-primary/10 px-3 py-1 rounded-full border border-primary/20 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{isUserPresident ? "President Access — Global Review" : `Domain Lead — ${userLeadDomains.join(", ")}`}</span>
            </span>
          </div>
          <h1 className="font-display text-4xl sm:text-5xl font-bold text-white tracking-tight">
            Domains & Applications
          </h1>
          <p className="font-body text-sm text-on-surface-variant max-w-2xl mt-1">
            {isUserPresident
              ? "Review, accept, reject, or waitlist candidates across all club domains and event registrations."
              : `Review and manage candidate applications and waitlists assigned specifically to ${userLeadDomains.join(", ")}.`}
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-error/10 border border-error/30 text-error text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Domain Cards Bento Filter */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {isUserPresident && (
          <button
            onClick={() => setSelectedDomain("All")}
            className={`p-4 rounded-2xl text-left transition-all border cursor-pointer ${
              selectedDomain === "All"
                ? "bg-primary text-black border-primary shadow-[0_0_20px_rgba(95,243,232,0.4)]"
                : "glass-card border-white/10 hover:border-primary/50 text-white"
            }`}
          >
            <div className="flex justify-between items-start mb-2">
              <span className="font-label-caps text-xs font-bold uppercase">All Domains</span>
            </div>
            <p className="font-display text-2xl font-bold">{requests.length}</p>
            <div className="flex gap-2 text-[10px] opacity-80 mt-1">
              <span>{requests.filter((r) => r.status === "pending").length} Pending</span>
              <span>• {requests.filter((r) => r.status === "waitlisted").length} Waitlisted</span>
            </div>
          </button>
        )}

        {visibleDomains.map((d) => {
          const Icon = d.icon;
          const isSelected = selectedDomain.toLowerCase() === d.name.toLowerCase();
          const dCount = counts[d.name] || { total: 0, pending: 0, accepted: 0, rejected: 0, waitlisted: 0 };

          return (
            <button
              key={d.name}
              onClick={() => setSelectedDomain(d.name)}
              className={`p-4 rounded-2xl text-left transition-all border cursor-pointer ${
                isSelected
                  ? "bg-secondary-container text-white border-secondary shadow-[0_0_20px_rgba(96,1,209,0.4)]"
                  : "glass-card border-white/10 hover:border-secondary/50 text-white"
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <Icon className="w-4 h-4 text-primary" />
                {dCount.pending > 0 && (
                  <span className="bg-primary/20 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {dCount.pending} new
                  </span>
                )}
              </div>
              <p className="font-display text-base font-bold truncate">{d.name}</p>
              <div className="flex justify-between items-center text-[10px] text-on-surface-variant mt-1">
                <span>{dCount.total} Total</span>
                {dCount.waitlisted > 0 && <span className="text-amber-300">{dCount.waitlisted} Waitlisted</span>}
              </div>
            </button>
          );
        })}
      </div>

      {/* Controls Bar: Search & Status Filters */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 bg-[#111111] p-3 rounded-2xl border border-white/10">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-on-surface-variant absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search applicants by name, email, event, or USN..."
            className="w-full pl-10 pr-4 py-2 text-xs bg-transparent border-0 text-white placeholder-[#71717a] focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto">
          {(["All", "pending", "waitlisted", "accepted", "rejected"] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-label-caps capitalize transition-all cursor-pointer ${
                statusFilter === st
                  ? st === "waitlisted"
                    ? "bg-amber-400 text-black font-bold"
                    : "bg-white text-black font-bold"
                  : "bg-white/5 text-on-surface-variant hover:text-white"
              }`}
            >
              {st === "waitlisted" ? "⏳ Waitlisted" : st}
            </button>
          ))}
        </div>
      </div>

      {/* Requests Grid / Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-4">
          {loading ? (
            <div className="glass-card rounded-3xl p-12 text-center border border-white/10">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
              <p className="text-xs text-on-surface-variant">Loading applications from Firestore...</p>
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="glass-card rounded-3xl p-12 text-center border border-white/10">
              <p className="font-display text-lg text-white mb-1">No Applications Found</p>
              <p className="text-xs text-on-surface-variant">
                There are no candidate applications matching your active domain and status filter.
              </p>
            </div>
          ) : (
            filteredRequests.map((req) => (
              <div
                key={req.id}
                className="glass-card rounded-2xl p-5 border border-white/10 hover:border-primary/40 transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 group"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-[#111111] border border-white/10 flex items-center justify-center text-primary font-display text-lg font-bold shrink-0">
                    {req.name.charAt(0)}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-display text-base font-bold text-white group-hover:text-primary transition-colors">
                        {req.name}
                      </h3>
                      <span className="text-[10px] font-label-caps px-2 py-0.5 rounded-full bg-white/10 text-white">
                        {req.domain}
                      </span>
                      {req.eventName && (
                        <span className="text-[10px] font-label-caps px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                          {req.eventName}
                        </span>
                      )}
                      <span
                        className={`text-[10px] font-label-caps px-2.5 py-0.5 rounded-full uppercase font-bold ${
                          req.status === "accepted"
                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                            : req.status === "rejected"
                            ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                            : req.status === "waitlisted"
                            ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                            : "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                        }`}
                      >
                        {req.status}
                      </span>
                    </div>

                    <p className="text-xs text-on-surface-variant mt-1">
                      {req.usn} • {req.branch} • {req.semester}
                    </p>
                    <p className="text-xs text-[#859491]">{req.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-white/10">
                  <button
                    onClick={() => setActiveRequest(req)}
                    className="px-3 py-1.5 rounded-full bg-[#111111] border border-white/20 text-white text-xs font-medium hover:border-primary transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5 text-primary" />
                    <span>Review</span>
                  </button>

                  {req.status === "pending" && (
                    <>
                      <button
                        onClick={() => handleAction(req.id, "accepted")}
                        disabled={actionLoading === req.id}
                        className="px-3 py-1.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold hover:bg-emerald-500 hover:text-black transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
                        title="Accept Application"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Accept</span>
                      </button>
                      <button
                        onClick={() => handleAction(req.id, "waitlisted")}
                        disabled={actionLoading === req.id}
                        className="px-3 py-1.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold hover:bg-amber-500 hover:text-black transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
                        title="Put on Waitlist"
                      >
                        <Clock className="w-3.5 h-3.5" />
                        <span>Waitlist</span>
                      </button>
                      <button
                        onClick={() => handleAction(req.id, "rejected")}
                        disabled={actionLoading === req.id}
                        className="px-3 py-1.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 text-xs font-bold hover:bg-rose-500 hover:text-white transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
                        title="Reject Application"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Reject</span>
                      </button>
                    </>
                  )}

                  {req.status === "waitlisted" && (
                    <>
                      <button
                        onClick={() => handleAction(req.id, "accepted")}
                        disabled={actionLoading === req.id}
                        className="px-3 py-1.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold hover:bg-emerald-500 hover:text-black transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Accept</span>
                      </button>
                      <button
                        onClick={() => handleAction(req.id, "rejected")}
                        disabled={actionLoading === req.id}
                        className="px-3 py-1.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 text-xs font-bold hover:bg-rose-500 hover:text-white transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Reject</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Selected Applicant Details Drawer */}
        <div className="lg:col-span-4">
          <div className="glass-card-heavy rounded-3xl p-6 border border-white/15 sticky top-24 space-y-6">
            <h3 className="font-display text-xl font-bold text-white pb-3 border-b border-white/10">
              Applicant Review Dossier
            </h3>

            {activeRequest ? (
              <div className="space-y-4">
                <div>
                  <span className="text-[10px] font-label-caps text-on-surface-variant uppercase">
                    Applicant Name
                  </span>
                  <p className="font-display text-lg font-bold text-white">
                    {activeRequest.name}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] font-label-caps text-on-surface-variant uppercase">
                      Domain Applied
                    </span>
                    <p className="font-bold text-primary">{activeRequest.domain}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-label-caps text-on-surface-variant uppercase">
                      Current Status
                    </span>
                    <p
                      className={`font-bold uppercase ${
                        activeRequest.status === "accepted"
                          ? "text-emerald-300"
                          : activeRequest.status === "rejected"
                          ? "text-rose-300"
                          : activeRequest.status === "waitlisted"
                          ? "text-amber-300"
                          : "text-blue-300"
                      }`}
                    >
                      {activeRequest.status}
                    </p>
                  </div>
                </div>

                {activeRequest.eventName && (
                  <div>
                    <span className="text-[10px] font-label-caps text-on-surface-variant uppercase">
                      Target Event / Workshop
                    </span>
                    <p className="text-xs font-bold text-white">{activeRequest.eventName}</p>
                  </div>
                )}

                <div className="text-xs space-y-1">
                  <span className="text-[10px] font-label-caps text-on-surface-variant uppercase">
                    Academic & Contact Info
                  </span>
                  <p className="text-white">USN: {activeRequest.usn}</p>
                  <p className="text-[#bbcac7]">{activeRequest.branch} ({activeRequest.semester})</p>
                  <p className="text-[#859491]">{activeRequest.email}</p>
                  {activeRequest.phone && (
                    <p className="text-[#4bfcde]">Phone: {activeRequest.phone}</p>
                  )}
                </div>

                {activeRequest.requirements && (
                  <div>
                    <span className="text-[10px] font-label-caps text-on-surface-variant uppercase block mb-1">
                      Special Requirements / Notes
                    </span>
                    <p className="text-xs text-white bg-[#111111] p-2.5 rounded-xl border border-white/10">
                      {activeRequest.requirements}
                    </p>
                  </div>
                )}

                {activeRequest.workLink && activeRequest.workLink !== "Event Registration Application" && (
                  <div>
                    <span className="text-[10px] font-label-caps text-on-surface-variant uppercase block mb-1">
                      Submitted Work Link
                    </span>
                    <a
                      href={activeRequest.workLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-xs text-primary bg-primary/10 border border-primary/30 px-4 py-2 rounded-xl hover:bg-primary hover:text-black transition-all break-all"
                    >
                      <span>View Portfolio / Work</span>
                      <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                    </a>
                  </div>
                )}

                {/* Status History & Notes */}
                {activeRequest.statusHistory && activeRequest.statusHistory.length > 0 && (
                  <div className="p-3 rounded-xl bg-[#111111] border border-white/10 text-xs space-y-2">
                    <strong className="text-white block font-label-caps text-[10px] uppercase">
                      Status Change History
                    </strong>
                    {activeRequest.statusHistory.map((h, i) => (
                      <div key={i} className="text-[11px] text-[#bbcac7] pb-1 border-b border-white/5 last:border-0">
                        <span className="font-bold text-white capitalize">{h.status}</span> by {h.changedByName || h.changedBy} on {new Date(h.changedAt).toLocaleDateString()}
                        {h.notes && <p className="text-[10px] text-on-surface-variant mt-0.5">{h.notes}</p>}
                      </div>
                    ))}
                  </div>
                )}

                {/* Notes Input Field */}
                <div>
                  <label className="block text-[10px] font-label-caps text-on-surface-variant uppercase mb-1">
                    Review Decision Note (Optional)
                  </label>
                  <input
                    type="text"
                    value={notesInput}
                    onChange={(e) => setNotesInput(e.target.value)}
                    placeholder="e.g. Strong portfolio; invite for round 2"
                    className="w-full form-input px-3 py-2 text-xs text-white"
                  />
                </div>

                {/* Action Buttons */}
                <div className="pt-4 border-t border-white/10 flex flex-col gap-2">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAction(activeRequest.id, "accepted")}
                      disabled={actionLoading === activeRequest.id || activeRequest.status === "accepted"}
                      className="flex-1 py-2.5 rounded-full bg-emerald-500 text-black font-bold text-xs hover:shadow-[0_0_20px_rgba(16,185,129,0.5)] transition-all cursor-pointer flex items-center justify-center gap-1 disabled:opacity-40"
                    >
                      <Check className="w-4 h-4" />
                      <span>Accept</span>
                    </button>
                    <button
                      onClick={() => handleAction(activeRequest.id, "waitlisted")}
                      disabled={actionLoading === activeRequest.id || activeRequest.status === "waitlisted"}
                      className="flex-1 py-2.5 rounded-full bg-amber-500 text-black font-bold text-xs hover:shadow-[0_0_20px_rgba(245,158,11,0.5)] transition-all cursor-pointer flex items-center justify-center gap-1 disabled:opacity-40"
                    >
                      <Clock className="w-4 h-4" />
                      <span>Waitlist</span>
                    </button>
                    <button
                      onClick={() => handleAction(activeRequest.id, "rejected")}
                      disabled={actionLoading === activeRequest.id || activeRequest.status === "rejected"}
                      className="flex-1 py-2.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold text-xs hover:bg-rose-500 hover:text-white transition-all cursor-pointer flex items-center justify-center gap-1 disabled:opacity-40"
                    >
                      <X className="w-4 h-4" />
                      <span>Reject</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-on-surface-variant text-xs space-y-2">
                <Sparkles className="w-8 h-8 text-primary/40 mx-auto" />
                <p>Select a candidate card to inspect details and perform evaluation actions.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
