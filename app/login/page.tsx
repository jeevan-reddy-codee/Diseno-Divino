import React, { Suspense } from "react";
import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata: Metadata = {
  title: "Member Login — Diseño Divino Club",
  description: "Enter your credentials to access the Diseño Divino Club internal portal.",
};

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#131313] text-[#e2e2e2] flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Background Atmospheric Glows */}
      <div className="fixed top-0 left-1/4 w-[500px] h-[500px] bg-[#4bfcde]/5 rounded-full blur-[120px] pointer-events-none transform -translate-y-1/2" />
      <div className="fixed bottom-0 right-1/4 w-[600px] h-[600px] bg-[#4bfcde]/5 rounded-full blur-[150px] pointer-events-none transform translate-y-1/2" />

      <main className="w-full max-w-[480px] my-12 relative z-10">
        <Suspense
          fallback={
            <div className="text-center text-[#4bfcde] font-mono text-xs">
              <div className="w-6 h-6 border-2 border-[#4bfcde] border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              Loading credentials portal...
            </div>
          }
        >
          <LoginForm />
        </Suspense>
      </main>
    </div>
  );
}
