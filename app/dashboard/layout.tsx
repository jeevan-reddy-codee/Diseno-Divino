import React from "react";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { PortalNavbar } from "@/components/layout/PortalNavbar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-[#050505] text-[#dde4e2] flex relative overflow-x-hidden">
        {/* Navigation Sidebar & Mobile Header */}
        <PortalNavbar />

        {/* Main Content Area (Offset by desktop sidebar width 256px) */}
        <main className="flex-1 md:ml-64 pt-20 md:pt-8 px-margin-mobile md:px-margin-desktop pb-24 max-w-[1500px] w-full min-h-screen relative z-10">
          {children}
        </main>
      </div>
    </AuthGuard>
  );
}
