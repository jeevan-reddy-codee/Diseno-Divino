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
  Filter,
  Sparkles,
  AlertCircle,
} from "lucide-react";

export const DomainsAndRequests: React.FC = () => {
  const { user, memberProfile, isAdmin, hasPermission } = useAuth();
  const [selectedDomain, setSelectedDomain] = useState<DomainType | "All">("All");
  const [requests, setRequests] = useState<JoinRequest[]>([]);
  const [activeRequest, setActiveRequest] = useState<JoinRequest | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<RequestStatus | "All">("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const canManage = isAdmin || hasPermission("manageRequests") || hasPermission("reviewRequests");

  const domainsList: { name: DomainType; icon: any }[] = [
    { name: "UI/UX", icon: Layout },
    { name: "Tech", icon: Code },
    { name: "Graphics", icon: Brush },
    { name: "Social Media", icon: Share2 },
    { name: "PR / Marketing & Sponsorship", icon: Megaphone },
    { name: "Operations", icon: Workflow },
  ];

  useEffect(() => {
    setLoading(true);
    setError(null);
    const unsubscribe = subscribeToJoinRequests(
      undefined,
      (reqs) => {
        setRequests(reqs);
        setLoading(false);
      },
      (err) => {
        setError(err.message || "Failed to load requests from Firestore.");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const counts = React.useMemo(() => {
    const res: Record<string, { total: number; pending: number; accepted: number; rejected: number }> = {};
    domainsList.forEach((d) => {
      res[d.name] = { total: 0, pending: 0, accepted: 0, rejected: 0 };
    });

    requests.forEach((r) => {
      if (!res[r.domain]) {
        res[r.domain] = { total: 0, pending: 0, accepted: 0, rejected: 0 };
      }
      res[r.domain].total += 1;
      if (r.status === "pending") res[r.domain].pending += 1;
      if (r.status === "accepted") res[r.domain].accepted += 1;
      if (r.status === "rejected") res[r.domain].rejected += 1;
    });
    return res;
  }, [requests]);

  const handleAction = async (id: string, status: RequestStatus) => {
    if (!canManage) return;
    const reviewerUid = memberProfile?.uid || user?.uid || "admin";
    const reviewerName = memberProfile?.name || "Admin";

    setActionLoading(id);
    try {
      const updated = await updateRequestStatus(id, status, reviewerUid, reviewerName);
      if (activeRequest?.id === id && updated) {
        setActiveRequest(updated);
      }
    } catch (err: any) {
      alert("Error updating request: " + (err.message || "Failed"));
    } finally {
      setActionLoading(null);
    }
  };

  const filteredRequests = requests.filter((r) => {
    const matchDomain = selectedDomain === "All" || r.domain === selectedDomain;
    const matchStatus = statusFilter === "All" || r.status === statusFilter;
    const matchSearch =
      !searchQuery ||
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.usn.toLowerCase().includes(searchQuery.toLowerCase());
    return matchDomain && matchStatus && matchSearch;
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <span className="font-label-caps text-xs text-primary tracking-widest uppercase bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
            Applicant Pipeline
          </span>
        </div>
        <h1 className="font-display text-4xl sm:text-5xl font-bold text-white tracking-tight">
          Domains & Requests
        </h1>
        <p className="font-body text-sm text-on-surface-variant max-w-2xl mt-1">
          Review, accept, or reject candidate applications organized by creative and technical domains.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-error/10 border border-error/30 text-error text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Domain Cards Bento Filter */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
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
          <p className="font-display text-2xl font-bold">
            {requests.length}
          </p>
          <p className="text-[10px] opacity-80 mt-1">
            {requests.filter((r) => r.status === "pending").length} Pending
          </p>
        </button>

        {domainsList.map((d) => {
          const Icon = d.icon;
          const isSelected = selectedDomain === d.name;
          const dCount = counts[d.name] || { total: 0, pending: 0, accepted: 0, rejected: 0 };

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
              <p className="font-display text-lg font-bold truncate">{d.name}</p>
              <p className="text-[10px] text-on-surface-variant mt-1">
                {dCount.total} Total
              </p>
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
            placeholder="Search applicants by name, email, or USN..."
            className="w-full pl-10 pr-4 py-2 text-xs bg-transparent border-0 text-white placeholder-[#71717a] focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto">
          {(["All", "pending", "accepted", "rejected"] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-label-caps capitalize transition-all cursor-pointer ${
                statusFilter === st
                  ? "bg-white text-black font-bold"
                  : "bg-white/5 text-on-surface-variant hover:text-white"
              }`}
            >
              {st}
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
                There are no requests matching your active filter criteria.
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
                      <span
                        className={`text-[10px] font-label-caps px-2 py-0.5 rounded-full uppercase font-bold ${
                          req.status === "accepted"
                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                            : req.status === "rejected"
                            ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                            : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
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
                    <span>View</span>
                  </button>

                  {canManage && req.status === "pending" && (
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
              Applicant Review Details
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
                    <p className="font-bold uppercase text-amber-300">{activeRequest.status}</p>
                  </div>
                </div>

                <div className="text-xs space-y-1">
                  <span className="text-[10px] font-label-caps text-on-surface-variant uppercase">
                    Academic Info
                  </span>
                  <p className="text-white">USN: {activeRequest.usn}</p>
                  <p className="text-[#bbcac7]">{activeRequest.branch} ({activeRequest.semester})</p>
                  <p className="text-[#859491]">{activeRequest.email}</p>
                </div>

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
                    <span>View Portfolio / GitHub</span>
                    <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                  </a>
                </div>

                {activeRequest.notes && (
                  <div className="p-3 rounded-xl bg-[#111111] border border-white/10 text-xs text-on-surface-variant">
                    <strong className="text-white block mb-1">Review Notes:</strong>
                    {activeRequest.notes}
                  </div>
                )}

                {canManage && activeRequest.status === "pending" && (
                  <div className="pt-4 border-t border-white/10 flex gap-2">
                    <button
                      onClick={() => handleAction(activeRequest.id, "accepted")}
                      disabled={actionLoading === activeRequest.id}
                      className="flex-1 py-2.5 rounded-full bg-emerald-500 text-black font-bold text-xs hover:shadow-[0_0_20px_rgba(16,185,129,0.5)] transition-all cursor-pointer flex items-center justify-center gap-1 disabled:opacity-50"
                    >
                      <Check className="w-4 h-4" />
                      <span>Accept Application</span>
                    </button>
                    <button
                      onClick={() => handleAction(activeRequest.id, "rejected")}
                      disabled={actionLoading === activeRequest.id}
                      className="flex-1 py-2.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold text-xs hover:bg-rose-500 hover:text-white transition-all cursor-pointer flex items-center justify-center gap-1 disabled:opacity-50"
                    >
                      <X className="w-4 h-4" />
                      <span>Reject</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12 text-on-surface-variant text-xs space-y-2">
                <Sparkles className="w-8 h-8 text-primary/40 mx-auto" />
                <p>Select an applicant card to inspect their portfolio link and review status.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
