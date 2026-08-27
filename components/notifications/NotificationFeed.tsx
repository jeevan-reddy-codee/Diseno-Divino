"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AppNotification } from "@/types/notification";
import {
  subscribeToNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "@/lib/services/notificationService";
import { useAuth } from "@/lib/firebase/authContext";
import {
  Bell,
  CheckCircle2,
  Calendar,
  CheckSquare,
  UserPlus,
  Radio,
  ExternalLink,
  AlertCircle,
} from "lucide-react";

export const NotificationFeed: React.FC = () => {
  const { user, memberProfile } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const uid = memberProfile?.uid || user?.uid || "";

  useEffect(() => {
    if (!uid) return;
    setLoading(true);
    setError(null);

    const unsubscribe = subscribeToNotifications(
      uid,
      (list) => {
        setNotifications(list);
        setLoading(false);
      },
      (err) => {
        setError(err.message || "Failed to load notifications from Firestore.");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [uid]);

  const handleMarkRead = async (id: string) => {
    try {
      await markNotificationAsRead(id);
    } catch (err: any) {
      console.warn("Could not mark notification as read:", err);
    }
  };

  const handleMarkAllRead = async () => {
    if (!uid) return;
    try {
      await markAllNotificationsAsRead(uid);
    } catch (err: any) {
      alert("Failed to mark all as read: " + (err.message || "Error"));
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "todo":
        return <CheckSquare className="w-5 h-5 text-secondary" />;
      case "event":
      case "event_completed":
        return <Calendar className="w-5 h-5 text-[#ffd6ad]" />;
      case "request":
        return <UserPlus className="w-5 h-5 text-primary" />;
      default:
        return <Radio className="w-5 h-5 text-primary" />;
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 pb-4 border-b border-white/10">
        <div>
          <span className="font-label-caps text-xs text-primary tracking-widest uppercase bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
            System Dispatch
          </span>
          <h1 className="font-display text-4xl sm:text-5xl font-bold text-white tracking-tight mt-1">
            Notifications
          </h1>
          <p className="font-body text-sm text-on-surface-variant">
            {unreadCount > 0
              ? `You have ${unreadCount} unread update${unreadCount > 1 ? "s" : ""}.`
              : "You're all caught up with recent updates."}
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="px-5 py-2 rounded-full bg-primary text-black font-bold text-xs hover:shadow-[0_0_20px_rgba(95,243,232,0.4)] transition-all cursor-pointer flex items-center gap-1.5"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Mark all as read</span>
          </button>
        )}
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-error/10 border border-error/30 text-error text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Notifications List */}
      <div className="space-y-4">
        {loading ? (
          <div className="glass-card rounded-3xl p-12 text-center border border-white/10">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-xs text-on-surface-variant">Loading notifications from Firestore...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="glass-card rounded-3xl p-12 text-center border border-white/10">
            <Bell className="w-8 h-8 text-primary/30 mx-auto mb-2" />
            <p className="font-display text-lg text-white mb-1">No Notifications</p>
            <p className="text-xs text-on-surface-variant">
              When tasks are assigned, events are scheduled, or applications are submitted, you&apos;ll be notified here.
            </p>
          </div>
        ) : (
          notifications.map((notif) => (
            <div
              key={notif.id}
              onClick={() => !notif.read && handleMarkRead(notif.id)}
              className={`glass-card rounded-2xl p-5 border transition-all flex items-start gap-4 cursor-pointer relative overflow-hidden group ${
                !notif.read
                  ? "border-primary/40 bg-primary/5 shadow-[0_0_25px_rgba(95,243,232,0.08)]"
                  : "border-white/10 opacity-70 hover:opacity-100"
              }`}
            >
              {/* Left Unread Indicator */}
              <div className="mt-1 flex flex-col items-center">
                {!notif.read ? (
                  <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse"></span>
                ) : (
                  <div className="w-2.5"></div>
                )}
              </div>

              {/* Icon */}
              <div className="w-12 h-12 rounded-full bg-[#111111] border border-white/10 flex items-center justify-center shrink-0">
                {getIcon(notif.type)}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline gap-2 mb-1">
                  <h3 className="font-display text-base font-bold text-white group-hover:text-primary transition-colors">
                    {notif.title || "Notification"}
                  </h3>
                  <span className="text-[11px] text-[#859491] whitespace-nowrap">
                    {new Date(notif.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <p className="text-xs text-on-surface-variant leading-relaxed">
                  {notif.message}
                </p>

                {notif.link && (
                  <Link
                    href={notif.link}
                    className="inline-flex items-center gap-1.5 text-xs text-primary font-label-caps mt-3 hover:underline"
                  >
                    <span>View Details</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
