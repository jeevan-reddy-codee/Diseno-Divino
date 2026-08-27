import React from "react";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";
import { PublicNavbar } from "@/components/layout/PublicNavbar";
import { Footer } from "@/components/layout/Footer";

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen bg-[#050505] text-[#dde4e2] flex flex-col justify-between relative overflow-x-hidden">
      <PublicNavbar />
      <main className="flex-1 flex items-center justify-center px-4 py-32 relative z-10">
        <ForgotPasswordForm />
      </main>
      <Footer />
    </div>
  );
}
