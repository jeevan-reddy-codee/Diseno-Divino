"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ClubEvent, EventStatus } from "@/types/event";
import {
  subscribeToEvents,
  createEvent,
  setEventStatus,
  getEventRegistrations,
  EventRegistrationRecord,
} from "@/lib/services/eventService";
import { useAuth } from "@/lib/firebase/authContext";
import {
  Calendar,
  Clock,
  MapPin,
  Plus,
  X,
  Sparkles,
  Users,
  AlertCircle,
  ArrowRight,
  Eye,
  Phone,
  Mail,
  FileText,
} from "lucide-react";

export const EventManagement: React.FC = () => {
  const { user, memberProfile, isPresident, isDomainHead, hasPermission } = useAuth();
  const [events, setEvents] = useState<ClubEvent[]>([]);
  const [activeTab, setActiveTab] = useState<"upcoming" | "past">("upcoming");
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedEventForAttendees, setSelectedEventForAttendees] = useState<ClubEvent | null>(null);
  const [attendeesList, setAttendeesList] = useState<EventRegistrationRecord[]>([]);
  const [loadingAttendees, setLoadingAttendees] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create Event Form
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    date: "",
    time: "",
    location: "Campus Design Lab",
    category: "Workshop",
    domain: "General",
  });

  const canCreate = isPresident || isDomainHead() || hasPermission("createEvents");

  const handleOpenAttendees = async (ev: ClubEvent) => {
    setSelectedEventForAttendees(ev);
    setLoadingAttendees(true);
    try {
      const list = await getEventRegistrations(ev.id);
      setAttendeesList(list);
    } catch (err) {
      console.warn("Could not load attendees:", err);
      setAttendeesList([]);
    } finally {
      setLoadingAttendees(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    setError(null);
    const unsubscribe = subscribeToEvents(
      (list) => {
        setEvents(list);
        setLoading(false);
      },
      (err) => {
        setError(err.message || "Failed to load events from Firestore.");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.date.trim()) return;

    try {
      await createEvent(
        formData,
        memberProfile?.uid || user?.uid || "president",
        memberProfile?.name || "President"
      );

      setModalOpen(false);
      setFormData({
        name: "",
        description: "",
        date: "",
        time: "",
        location: "Campus Design Lab",
        category: "Workshop",
        domain: "General",
      });
    } catch (err: any) {
      alert("Error creating event: " + (err.message || "Failed"));
    }
  };

  const handleToggleStatus = async (eventId: string, currentStatus: EventStatus) => {
    if (!canCreate) return;
    const newStatus: EventStatus = currentStatus === "active" ? "completed" : "active";
    try {
      await setEventStatus(
        eventId,
        newStatus,
        memberProfile?.uid || user?.uid || "president",
        memberProfile?.name || "President"
      );
    } catch (err: any) {
      alert("Error updating event status: " + (err.message || "Failed"));
    }
  };

  const upcomingEvents = events.filter((e) => e.status === "active");
  const pastEvents = events.filter((e) => e.status === "completed");
  const displayedEvents = activeTab === "upcoming" ? upcomingEvents : pastEvents;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 pb-4 border-b border-white/10">
        <div>
          <span className="font-label-caps text-xs text-primary tracking-widest uppercase bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
            Club Gatherings
          </span>
          <h1 className="font-display text-4xl sm:text-5xl font-bold text-white tracking-tight mt-1">
            Events & Workshops
          </h1>
          <p className="font-body text-sm text-on-surface-variant max-w-xl">
            Explore upcoming workshops, design sprints, hackathons, and register your application.
          </p>
        </div>

        {canCreate && (
          <button
            onClick={() => setModalOpen(true)}
            className="btn-primary shrink-0 cursor-pointer shadow-[0_0_25px_rgba(95,243,232,0.4)]"
          >
            <Plus className="w-4 h-4" />
            <span>+ Create Event</span>
          </button>
        )}
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-error/10 border border-error/30 text-error text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex bg-[#111111] rounded-full p-1 border border-white/10 w-fit">
        <button
          onClick={() => setActiveTab("upcoming")}
          className={`px-6 py-2 rounded-full font-bold text-xs transition-all cursor-pointer ${activeTab === "upcoming"
              ? "bg-primary text-black"
              : "text-on-surface-variant hover:text-white"
            }`}
        >
          Upcoming Events ({upcomingEvents.length})
        </button>
        <button
          onClick={() => setActiveTab("past")}
          className={`px-6 py-2 rounded-full font-bold text-xs transition-all cursor-pointer ${activeTab === "past"
              ? "bg-primary text-black"
              : "text-on-surface-variant hover:text-white"
            }`}
        >
          Past / Concluded ({pastEvents.length})
        </button>
      </div>

      {/* Events Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full glass-card rounded-3xl p-12 text-center border border-white/10">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-xs text-on-surface-variant">Loading events from Firestore...</p>
          </div>
        ) : displayedEvents.length === 0 ? (
          <div className="col-span-full glass-card rounded-3xl p-12 text-center border border-white/10">
            <Sparkles className="w-8 h-8 text-primary/30 mx-auto mb-2" />
            <p className="font-display text-lg text-white mb-1">No Events Found</p>
            <p className="text-xs text-on-surface-variant">
              There are no {activeTab} events registered in the club database.
            </p>
          </div>
        ) : (
          displayedEvents.map((ev) => {
            return (
              <div
                key={ev.id}
                className="glass-card rounded-3xl p-7 flex flex-col justify-between group transition-all duration-300 border border-white/10 hover:border-primary/50 hover:-translate-y-1.5 glow-hover"
              >
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-label-caps text-secondary bg-secondary/10 px-3 py-1 rounded-full border border-secondary/20 uppercase">
                        {ev.category || "Event"}
                      </span>
                      {ev.domain && (
                        <span className="text-[10px] font-label-caps text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">
                          {ev.domain}
                        </span>
                      )}
                    </div>
                    <span
                      className={`text-[10px] font-label-caps px-2.5 py-0.5 rounded-full uppercase font-bold ${ev.status === "active"
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                          : "bg-white/10 text-on-surface-variant"
                        }`}
                    >
                      {ev.status}
                    </span>
                  </div>

                  <h3 className="font-display text-2xl font-bold text-white mb-2 group-hover:text-primary transition-colors">
                    {ev.name}
                  </h3>
                  <p className="font-body text-xs text-on-surface-variant leading-relaxed mb-6">
                    {ev.description}
                  </p>

                  <div className="space-y-2 text-xs text-[#bbcac7] mb-6 pt-4 border-t border-white/10">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span>{ev.date}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-secondary shrink-0" />
                      <span>{ev.time}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-[#ffd6ad] shrink-0" />
                      <span>{ev.location || "Campus Design Lab"}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
                  <button
                    onClick={() => canCreate && handleOpenAttendees(ev)}
                    className={`text-[11px] flex items-center gap-1.5 transition-colors ${canCreate
                        ? "text-primary hover:underline cursor-pointer"
                        : "text-on-surface-variant"
                      }`}
                    title={canCreate ? "Click to view attendee registration details" : undefined}
                  >
                    <Users className="w-3.5 h-3.5 text-primary" />
                    <span>{ev.registeredCount || ev.rsvpCount || 0} Registered</span>
                    {canCreate && <Eye className="w-3 h-3 text-primary/70 ml-0.5" />}
                  </button>

                  <div className="flex items-center gap-2">
                    {canCreate && (
                      <button
                        onClick={() => handleOpenAttendees(ev)}
                        className="text-xs px-3 py-1.5 rounded-full bg-white/5 border border-white/15 text-white hover:border-primary hover:text-primary transition-all cursor-pointer flex items-center gap-1"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Attendees</span>
                      </button>
                    )}

                    {ev.status === "active" && (
                      <Link
                        href={`/rsvp?event=${ev.id}`}
                        className="text-xs px-4 py-2 rounded-full font-bold bg-primary text-black hover:shadow-[0_0_20px_rgba(95,243,232,0.4)] transition-all flex items-center gap-1.5"
                      >
                        <span>Register</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    )}

                    {canCreate && (
                      <button
                        onClick={() => handleToggleStatus(ev.id, ev.status)}
                        className="text-xs px-3 py-2 rounded-full bg-[#111111] border border-white/15 text-white hover:border-primary transition-all cursor-pointer"
                        title="Toggle Status"
                      >
                        {ev.status === "active" ? "Conclude" : "Reactivate"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* CREATE EVENT MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-card-heavy w-full max-w-lg rounded-3xl p-8 relative border border-primary/40 shadow-[0_0_50px_rgba(95,243,232,0.2)]">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-6 right-6 text-on-surface-variant hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-6">
              <span className="font-label-caps text-xs text-primary uppercase tracking-widest">
                President & Domain Head Action
              </span>
              <h2 className="font-display text-2xl font-bold text-white">Create New Event</h2>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-label-caps text-on-surface-variant mb-1 uppercase">
                  Event Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Generative AI Design Jam"
                  className="w-full form-input px-3.5 py-2.5 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-label-caps text-on-surface-variant mb-1 uppercase">
                  Description *
                </label>
                <textarea
                  required
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="What will attendees learn, build, or experience?"
                  className="w-full form-input px-3.5 py-2.5 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-label-caps text-on-surface-variant mb-1 uppercase">
                    Date *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    placeholder="e.g. April 18, 2026"
                    className="w-full form-input px-3.5 py-2.5 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-label-caps text-on-surface-variant mb-1 uppercase">
                    Time *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    placeholder="e.g. 14:00 - 17:00"
                    className="w-full form-input px-3.5 py-2.5 text-xs text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-label-caps text-on-surface-variant mb-1 uppercase">
                    Location
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="Design Lab 404"
                    className="w-full form-input px-3 py-2.5 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-label-caps text-on-surface-variant mb-1 uppercase">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full form-input px-3 py-2.5 text-xs text-white bg-[#111111]"
                  >
                    <option value="Workshop">Workshop</option>
                    <option value="Hackathon">Hackathon</option>
                    <option value="Coding Jam">Coding Jam</option>
                    <option value="Design Sprint">Design Sprint</option>
                    <option value="Tech Talk">Tech Talk</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-label-caps text-on-surface-variant mb-1 uppercase">
                    Domain
                  </label>
                  <select
                    value={formData.domain}
                    onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                    className="w-full form-input px-3 py-2.5 text-xs text-white bg-[#111111]"
                  >
                    <option value="General">General / All</option>
                    <option value="UI/UX">UI/UX</option>
                    <option value="Tech">Tech</option>
                    <option value="Web Development">Web Development</option>
                    <option value="AI/ML">AI/ML</option>
                    <option value="App Development">App Development</option>
                    <option value="Graphics">Graphics</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-5 py-2.5 rounded-full border border-white/20 text-xs font-medium hover:bg-white/5 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary px-6 py-2.5 text-xs font-bold cursor-pointer"
                >
                  Publish Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW ATTENDEES MODAL */}
      {selectedEventForAttendees && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-card-heavy w-full max-w-3xl max-h-[85vh] rounded-3xl p-8 relative border border-primary/40 shadow-[0_0_50px_rgba(95,243,232,0.2)] flex flex-col">
            <button
              onClick={() => setSelectedEventForAttendees(null)}
              className="absolute top-6 right-6 text-on-surface-variant hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-6 pb-4 border-b border-white/10">
              <span className="font-label-caps text-xs text-primary uppercase tracking-widest bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
                Registered Attendees
              </span>
              <h2 className="font-display text-2xl font-bold text-white mt-2">
                {selectedEventForAttendees.name}
              </h2>
              <p className="text-xs text-on-surface-variant mt-1">
                {selectedEventForAttendees.date} • {selectedEventForAttendees.time} • {selectedEventForAttendees.location || "Campus"}
              </p>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-2">
              {loadingAttendees ? (
                <div className="py-12 text-center">
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                  <p className="text-xs text-on-surface-variant">Loading registrations...</p>
                </div>
              ) : attendeesList.length === 0 ? (
                <div className="py-12 text-center text-on-surface-variant text-xs">
                  <Users className="w-8 h-8 text-primary/40 mx-auto mb-2" />
                  <p>No attendee registrations found for this event yet.</p>
                </div>
              ) : (
                attendeesList.map((att) => (
                  <div
                    key={att.id}
                    className="p-4 rounded-2xl bg-[#111111] border border-white/10 hover:border-primary/30 transition-all space-y-2"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center font-bold text-xs text-primary">
                          {att.fullName.charAt(0) || "?"}
                        </div>
                        <div>
                          <h4 className="font-display text-sm font-bold text-white">
                            {att.fullName}
                          </h4>
                          <p className="text-xs text-primary font-mono">{att.usn}</p>
                        </div>
                      </div>
                      <span className="text-[10px] text-on-surface-variant font-mono">
                        {new Date(att.registeredAt).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-[#bbcac7] pt-2 border-t border-white/5">
                      <div className="flex items-center gap-1.5 truncate">
                        <Mail className="w-3 h-3 text-on-surface-variant shrink-0" />
                        <span className="truncate">{att.email}</span>
                      </div>
                      {att.phone && (
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-3 h-3 text-secondary shrink-0" />
                          <span>{att.phone}</span>
                        </div>
                      )}
                      {att.branch && (
                        <div className="flex items-center gap-1.5 truncate">
                          <span className="text-[10px] uppercase font-bold text-[#ffd6ad]">Dept:</span>
                          <span className="truncate">{att.branch}</span>
                        </div>
                      )}
                    </div>

                    {att.requirements && (
                      <div className="pt-2 border-t border-white/5">
                        <div className="flex items-start gap-1.5 text-[11px] text-white bg-white/5 p-2 rounded-xl">
                          <FileText className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                          <div>
                            <span className="font-semibold text-primary block text-[10px] uppercase">Special Requirements:</span>
                            <span>{att.requirements}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="pt-4 border-t border-white/10 flex justify-between items-center mt-4">
              <span className="text-xs font-mono text-on-surface-variant">
                Total Registrations: <strong className="text-primary">{attendeesList.length}</strong>
              </span>
              <button
                type="button"
                onClick={() => setSelectedEventForAttendees(null)}
                className="px-5 py-2 rounded-full bg-white/10 text-white font-medium text-xs hover:bg-white/20 transition-all cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
