"use client";

import { ProtectedRoute } from "@/hooks/useAuth";
import ITSidebar from "@/components/ITSidebar";

export default function ITLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ProtectedRoute requireIT>
      <div className="flex min-h-screen bg-white">
        <ITSidebar />
        <main className="flex-1 w-full min-w-0 lg:ml-64 pt-16 lg:pt-0 overflow-x-hidden">
          <div className="lg:p-8">{children}</div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
