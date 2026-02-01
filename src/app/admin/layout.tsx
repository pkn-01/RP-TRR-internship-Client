"use client";

import AdminSidebar from "@/components/AdminSidebar";
import "@/app/globals.css";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex bg-gray-100 min-h-screen">
      <AdminSidebar />
      <main className="flex-1 lg:ml-56 lg:pt-0 pt-16 min-h-screen">
        {children}
      </main>
    </div>
  );
}
