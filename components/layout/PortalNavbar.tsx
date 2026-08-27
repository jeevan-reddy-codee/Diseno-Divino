"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/firebase/authContext";
import { subscribeToNotifications } from "@/lib/services/notificationService";
import {
  LayoutDashboard,
  Layers,
  Users,
  CheckSquare,
  Calendar,
  ShieldCheck,
  Bell,
  User,
  LogOut,
  Menu,
  X,
} from "lucide-react";

export const PortalNavbar: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { user, memberProfile, isAdmin, signOutUser } = useAuth();
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const uid = memberProfile?.uid || user?.uid || "";
    if (!uid) return;

    const unsubscribe = subscribeToNotifications(
      uid,
      (notifs) => {
        setUnreadCount(notifs.filter((n) => !n.read).length);
      },
      (err) => console.warn("PortalNavbar notification listener note:", err)
    );

    return () => unsubscribe();
  }, [user, memberProfile]);

  const navItems = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "Domains & Requests", href: "/dashboard/requests", icon: Layers },
    { label: "Members", href: "/dashboard/members", icon: Users },
    { label: "To-Do", href: "/dashboard/todos", icon: CheckSquare },
    { label: "Events", href: "/dashboard/events", icon: Calendar },
    ...(isAdmin
      ? [{ label: "Admin Control", href: "/admin", icon: ShieldCheck, highlight: true }]
      : []),
  ];

  const handleSignOut = async () => {
    await signOutUser();
    router.push("/");
  };

  return (
    <>
      {/* Desktop Sidebar Navigation */}
      <aside className="hidden md:flex flex-col fixed left-0 top-0 bottom-0 w-64 bg-[#090f0f]/90 backdrop-blur-2xl border-r border-white/10 z-40">
        {/* Brand */}
        <div className="p-6 border-b border-white/10">
          <Link href="/dashboard" className="flex items-center gap-1 group">
            <div className="bg-[#111111] px-4 py-2 rounded-full border border-white/10 group-hover:border-primary/50 transition-colors">
              <span className="font-display text-[20px] text-[#dde4e2] font-bold">
                Diseño <span className="text-primary">Divino.</span>
              </span>
            </div>
          </Link>
          <div className="mt-3 flex items-center justify-between">
            <span className="font-label-caps text-[10px] text-primary tracking-widest uppercase bg-primary/10 px-2.5 py-0.5 rounded-full border border-primary/20">
              {memberProfile?.role === "admin" ? "Admin Access" : "Member Portal"}
            </span>
            <span className="text-xs text-on-surface-variant">
              {memberProfile?.domain || "Core"}
            </span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  active
                    ? item.highlight
                      ? "bg-secondary-container text-white shadow-[0_0_20px_rgba(96,1,209,0.4)]"
                      : "bg-primary text-[#003734] font-bold shadow-[0_0_20px_rgba(95,243,232,0.3)]"
                    : "text-[#bbcac7] hover:text-[#dde4e2] hover:bg-[#1a2120]"
                }`}
              >
                <Icon className={`w-5 h-5 ${active ? (item.highlight ? "text-white" : "text-[#003734]") : "text-primary/70"}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Info & Footer Actions */}
        <div className="p-4 border-t border-white/10 space-y-1 bg-[#0e1514]/50">
          <Link
            href="/dashboard/notifications"
            className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm transition-all ${
              pathname === "/dashboard/notifications"
                ? "bg-primary/20 text-primary border border-primary/30"
                : "text-[#bbcac7] hover:bg-[#1a2120] hover:text-white"
            }`}
          >
            <div className="flex items-center gap-3">
              <Bell className="w-4 h-4 text-primary" />
              <span>Notifications</span>
            </div>
            {unreadCount > 0 && (
              <span className="bg-primary text-black font-bold text-xs px-2 py-0.5 rounded-full">
                {unreadCount}
              </span>
            )}
          </Link>

          <Link
            href="/dashboard/profile"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
              pathname === "/dashboard/profile"
                ? "bg-primary/20 text-primary border border-primary/30"
                : "text-[#bbcac7] hover:bg-[#1a2120] hover:text-white"
            }`}
          >
            <User className="w-4 h-4 text-secondary" />
            <div className="flex flex-col text-left">
              <span className="font-medium text-xs text-[#dde4e2]">
                {memberProfile?.name || "Member"}
              </span>
              <span className="text-[10px] text-[#859491]">View Profile</span>
            </div>
          </Link>

          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-error/80 hover:text-error hover:bg-error/10 transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Mobile Top App Bar */}
      <header className="md:hidden fixed top-0 left-0 right-0 h-16 bg-[#050505]/90 backdrop-blur-xl border-b border-white/10 z-40 px-4 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-1">
          <span className="font-display text-lg text-white font-bold">
            Diseño <span className="text-primary">Divino</span>
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/notifications"
            className="p-2 rounded-full bg-[#111111] border border-white/10 text-primary relative"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-black font-bold text-[10px] rounded-full flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </Link>

          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2 rounded-full bg-[#111111] border border-white/10 text-white cursor-pointer"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Mobile Menu Drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 top-16 bg-[#050505]/98 z-50 p-6 flex flex-col justify-between overflow-y-auto">
          <nav className="space-y-3">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active =
                item.href === "/dashboard"
                  ? pathname === "/dashboard"
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  onClick={() => setMobileOpen(false)}
                  href={item.href}
                  className={`flex items-center gap-4 px-5 py-4 rounded-2xl text-base font-medium transition-all ${
                    active
                      ? "bg-primary text-black font-bold shadow-[0_0_20px_rgba(95,243,232,0.3)]"
                      : "text-white bg-[#111111] border border-white/10"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}

            <Link
              onClick={() => setMobileOpen(false)}
              href="/dashboard/profile"
              className="flex items-center gap-4 px-5 py-4 rounded-2xl text-base font-medium text-white bg-[#111111] border border-white/10"
            >
              <User className="w-5 h-5 text-secondary" />
              <span>Profile Settings</span>
            </Link>
          </nav>

          <div className="pt-6 border-t border-white/10 space-y-3">
            <div className="p-4 rounded-2xl bg-[#161d1c] border border-white/10">
              <p className="text-sm font-bold text-white">{memberProfile?.name || "Member"}</p>
              <p className="text-xs text-primary">{memberProfile?.domain} • {memberProfile?.role}</p>
            </div>

            <button
              onClick={() => {
                setMobileOpen(false);
                handleSignOut();
              }}
              className="w-full py-3 rounded-full bg-error/10 border border-error/30 text-error font-medium flex items-center justify-center gap-2 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
};
