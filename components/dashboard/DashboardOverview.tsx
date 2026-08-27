"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/firebase/authContext";
import { Todo } from "@/types/todo";
import { ClubEvent } from "@/types/event";
import { AppNotification } from "@/types/notification";
import { subscribeToTodos, toggleTodoCompleted } from "@/lib/services/todoService";
import { subscribeToEvents } from "@/lib/services/eventService";
import { subscribeToNotifications, markNotificationAsRead } from "@/lib/services/notificationService";
import {
  ShieldCheck,
  Calendar,
  Bell,
  ArrowRight,
  Layers,
  Users,
  CheckSquare,
} from "lucide-react";

export const DashboardOverview: React.FC = () => {
  const { user, memberProfile } = useAuth();
  const [todos, setTodos] = useState<Todo[]>([]);
  const [events, setEvents] = useState<ClubEvent[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);

  const uid = memberProfile?.uid || user?.uid || "";

  useEffect(() => {
    if (!uid) return;
    setLoading(true);

    const unsubTodos = subscribeToTodos(
      uid,
      memberProfile?.role === "admin",
      (t) => setTodos(t),
      (err) => console.warn("Todos listener error:", err)
    );

    const unsubEvents = subscribeToEvents(
      (e) => setEvents(e.slice(0, 2)),
      (err) => console.warn("Events listener error:", err)
    );

    const unsubNotifs = subscribeToNotifications(
      uid,
      (n) => setNotifications(n.slice(0, 3)),
      (err) => console.warn("Notifs listener error:", err)
    );

    setLoading(false);

    return () => {
      unsubTodos();
      unsubEvents();
      unsubNotifs();
    };
  }, [uid, memberProfile?.role]);

  const handleToggleTodo = async (todoId: string) => {
    if (!uid) return;
    try {
      await toggleTodoCompleted(todoId, uid, memberProfile?.name || "Member");
    } catch (err: any) {
      console.warn("Could not toggle todo:", err);
    }
  };

  const pendingTodos = todos.filter((t) => !t.completed);

  return (
    <div className="space-y-8">
      {/* Header Greeting */}
      <section className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 pb-4 border-b border-white/10">
        <div>
          <p className="font-label-caps text-xs text-primary tracking-widest uppercase mb-1">
            Member Portal
          </p>
          <h1 className="font-display text-4xl sm:text-5xl font-bold text-white tracking-tight">
            Dashboard
          </h1>
        </div>
        <div className="text-left md:text-right">
          <p className="font-body text-xs text-on-surface-variant">Welcome back,</p>
          <p className="font-display text-2xl font-bold text-primary">
            {memberProfile?.name || "Member"}
          </p>
        </div>
      </section>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Member Status Card */}
        <div className="glass-card rounded-3xl p-8 col-span-1 md:col-span-5 flex flex-col justify-between min-h-[260px] border border-white/10 glow-hover">
          <div className="flex justify-between items-start">
            <div>
              <span className="font-display text-2xl font-bold text-white block mb-1">
                Active Member
              </span>
              <p className="font-body text-xs text-on-surface-variant">
                Joined {memberProfile?.joinedAt ? new Date(memberProfile.joinedAt).toLocaleDateString() : "Fall 2023"}
              </p>
            </div>
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center border border-primary/30 text-primary">
              <ShieldCheck className="w-6 h-6" />
            </div>
          </div>

          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#111111] border border-white/10 mb-3">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
              <span className="font-label-caps text-xs text-primary">
                {memberProfile?.role === "admin" ? "Core Lead / Admin" : "Active Collective"}
              </span>
            </div>
            <p className="font-body text-xs text-on-surface-variant leading-relaxed">
              USN: <strong className="text-white">{memberProfile?.usn || "1DD23CS001"}</strong> • {memberProfile?.branch || "Computer Science"}
            </p>
          </div>
        </div>

        {/* Primary Domain Featured Card */}
        <div className="glass-card-featured rounded-3xl p-8 col-span-1 md:col-span-7 flex flex-col justify-between min-h-[260px] relative overflow-hidden glow-hover">
          <div className="absolute -right-16 -bottom-16 w-60 h-60 bg-secondary/25 rounded-full blur-[80px] pointer-events-none"></div>

          <div className="relative z-10 flex justify-between items-start">
            <div>
              <p className="font-label-caps text-xs text-secondary tracking-widest uppercase mb-1">
                Primary Domain
              </p>
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-white">
                {memberProfile?.domain || "UI/UX"}
              </h2>
            </div>
            <div className="w-12 h-12 rounded-full bg-secondary/15 flex items-center justify-center border border-secondary/30 text-secondary">
              <Layers className="w-6 h-6" />
            </div>
          </div>

          <div className="relative z-10 flex flex-wrap gap-4 mt-6">
            <Link
              href="/dashboard/requests"
              className="px-6 py-3 rounded-full bg-primary text-[#003734] font-bold text-xs hover:shadow-[0_0_25px_rgba(95,243,232,0.4)] transition-all flex items-center gap-2"
            >
              <span>Domain Applications</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/dashboard/members"
              className="px-6 py-3 rounded-full bg-[#111111] border border-white/20 text-white font-medium text-xs hover:border-primary transition-all flex items-center gap-2"
            >
              <Users className="w-4 h-4 text-primary" />
              <span>View Team</span>
            </Link>
          </div>
        </div>

        {/* My To-Do Bento Box */}
        <div className="glass-card rounded-3xl p-8 col-span-1 md:col-span-6 flex flex-col justify-between min-h-[360px] border border-white/10">
          <div>
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <CheckSquare className="w-5 h-5 text-primary" />
                <h3 className="font-display text-xl font-bold text-white">My Tasks</h3>
              </div>
              <span className="text-xs font-label-caps text-primary bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
                {pendingTodos.length} Open
              </span>
            </div>

            <div className="space-y-3">
              {todos.length === 0 ? (
                <p className="text-xs text-on-surface-variant py-4 text-center">
                  No tasks assigned. You&apos;re all caught up!
                </p>
              ) : (
                todos.slice(0, 4).map((todo) => (
                  <div
                    key={todo.id}
                    onClick={() => handleToggleTodo(todo.id)}
                    className="flex items-start gap-3 p-3 rounded-2xl hover:bg-white/5 transition-all cursor-pointer group border border-transparent hover:border-white/10"
                  >
                    <input
                      type="checkbox"
                      checked={todo.completed}
                      onChange={() => {}}
                      className="mt-0.5 w-4 h-4 rounded border-white/30 text-primary focus:ring-primary bg-[#111111] cursor-pointer"
                    />
                    <div className="flex-1">
                      <p
                        className={`text-xs font-medium transition-all ${
                          todo.completed
                            ? "line-through text-on-surface-variant"
                            : "text-white group-hover:text-primary"
                        }`}
                      >
                        {todo.text}
                      </p>
                      {todo.dueDate && (
                        <p className="text-[10px] text-[#859491] mt-0.5">{todo.dueDate}</p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-4 mt-auto border-t border-white/10">
            <Link
              href="/dashboard/todos"
              className="w-full py-2.5 rounded-full bg-[#111111] border border-white/10 text-xs text-white font-medium hover:border-primary hover:text-primary transition-all flex items-center justify-center gap-2"
            >
              <span>Manage All Tasks</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Notifications & Events Bento Box */}
        <div className="glass-card rounded-3xl p-8 col-span-1 md:col-span-6 flex flex-col justify-between min-h-[360px] border border-white/10">
          <div>
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5 text-secondary" />
                <h3 className="font-display text-xl font-bold text-white">Live Updates</h3>
              </div>
              <Link
                href="/dashboard/notifications"
                className="text-xs text-secondary hover:underline font-label-caps"
              >
                View all
              </Link>
            </div>

            <div className="space-y-3">
              {notifications.length === 0 ? (
                <p className="text-xs text-on-surface-variant py-4 text-center">
                  No notifications yet.
                </p>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => markNotificationAsRead(n.id)}
                    className={`p-3 rounded-2xl transition-all cursor-pointer border ${
                      !n.read
                        ? "bg-primary/5 border-primary/20 hover:border-primary/40"
                        : "bg-[#111111] border-white/5 hover:border-white/20"
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <p className="text-xs font-semibold text-white">{n.title || n.message}</p>
                      {!n.read && (
                        <span className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1"></span>
                      )}
                    </div>
                    <p className="text-[11px] text-on-surface-variant mt-1 line-clamp-1">
                      {n.message}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-4 mt-auto border-t border-white/10">
            <Link
              href="/dashboard/events"
              className="w-full py-2.5 rounded-full bg-[#111111] border border-white/10 text-xs text-white font-medium hover:border-secondary hover:text-secondary transition-all flex items-center justify-center gap-2"
            >
              <Calendar className="w-3.5 h-3.5 text-secondary" />
              <span>Explore Upcoming Events</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
