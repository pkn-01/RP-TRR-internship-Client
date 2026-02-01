"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "@/services/api";
import {
  Plus,
  Search,
  Clock,
  CheckCircle2,
  HelpCircle,
  ChevronRight,
  MessageSquare,
  Wrench,
  AlertCircle,
  FileText,
  LogOut,
} from "lucide-react";

interface Ticket {
  id: number;
  ticketCode: string;
  title: string;
  status: string;
  priority: string;
  createdAt: string;
}

export default function UserTickets() {
  const router = useRouter();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // สรุปสถานะเฉพาะของผู้ใช้
  const userStats = {
    pending: tickets.filter((t) => t.status === "OPEN").length,
    inProgress: tickets.filter((t) => t.status === "IN_PROGRESS").length,
    completed: tickets.filter((t) => t.status === "DONE").length,
  };

  const handleLogout = async () => {
    localStorage.clear();
    router.push("/login/admin");
  };

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          router.push("/login/admin");
          return;
        }

        const data = await apiFetch("/api/tickets");
        setTickets(data);
      } catch (error) {
        console.error("Failed to fetch tickets:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTickets();
  }, [router]);

  if (isLoading) return <TicketsSkeleton />;

  return (
    <div className="min-h-screen bg-[#fcfcfd] pb-20 pt-8 px-4 md:px-8">
      <div className="max-w-5xl mx-auto">
        {/* User Welcome Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              รายการแจ้งซ่อมของฉัน
            </h1>
            <p className="text-slate-500 mt-2 flex items-center gap-2">
              <HelpCircle size={16} />{" "}
              ติดตามสถานะการแจ้งซ่อมและประวัติการแจ้งทั้งหมด
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/tickets/create"
              className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg font-bold transition-all shadow-sm hover:shadow-md"
            >
              <Plus size={20} />
              <span>แจ้งซ่อมใหม่</span>
            </Link>
            <button
              onClick={handleLogout}
              className="inline-flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white px-6 py-4 rounded-lg font-bold transition-all shadow-sm hover:shadow-md"
              title="ออกจากระบบ"
            >
              <LogOut size={20} />
              <span className="hidden md:inline">ออกจากระบบ</span>
            </button>
          </div>
        </div>

        {/* Status Tracker Tiles (สำหรับ User ดูง่ายๆ) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
          <StatusTile
            label="รอรับเรื่อง"
            count={userStats.pending}
            icon={<Clock className="text-amber-500" />}
            color="border-amber-100 bg-amber-50/30"
          />
          <StatusTile
            label="กำลังซ่อม"
            count={userStats.inProgress}
            icon={<Wrench className="text-blue-500" />}
            color="border-blue-100 bg-blue-50/30"
          />
          <StatusTile
            label="ซ่อมเสร็จแล้ว"
            count={userStats.completed}
            icon={<CheckCircle2 className="text-emerald-500" />}
            color="border-emerald-100 bg-emerald-50/30"
          />
        </div>

        {/* Ticket List Area */}
        <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-white">
            <h2 className="font-bold text-slate-800">
              ประวัติการแจ้งซ่อมล่าสุด
            </h2>
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                size={16}
              />
              <input
                type="text"
                placeholder="ค้นหา..."
                className="pl-9 pr-4 py-2 bg-slate-50 rounded-full text-sm outline-none focus:ring-2 focus:ring-blue-500/10 w-40 md:w-64"
              />
            </div>
          </div>

          <div className="divide-y divide-slate-50">
            {tickets.length > 0 ? (
              tickets.map((ticket) => (
                <div
                  key={ticket.id}
                  onClick={() => router.push(`/tickets/${ticket.id}`)}
                  className="p-6 hover:bg-slate-50/80 transition-all cursor-pointer flex items-center justify-between group"
                >
                  <div className="flex gap-4 items-start">
                    <div
                      className={`p-3 rounded-2xl ${ticket.status === "DONE" ? "bg-emerald-50 text-emerald-600" : "bg-slate-50 text-slate-400"}`}
                    >
                      <FileText size={24} />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                        {ticket.title}
                      </h3>
                      <div className="flex items-center gap-3 mt-1 text-sm text-slate-500">
                        <span className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded italic">
                          #{ticket.ticketCode}
                        </span>
                        <span>•</span>
                        <span>
                          {new Date(ticket.createdAt).toLocaleDateString(
                            "th-TH",
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="hidden md:flex flex-col items-end">
                      <span
                        className={`text-[11px] font-black px-3 py-1 rounded-full uppercase border ${getStatusClass(ticket.status)}`}
                      >
                        {ticket.status}
                      </span>
                      {ticket.priority === "HIGH" && (
                        <span className="text-[10px] text-red-500 font-bold mt-1 flex items-center gap-1">
                          <AlertCircle size={10} /> เร่งด่วน
                        </span>
                      )}
                    </div>
                    <ChevronRight
                      size={20}
                      className="text-slate-300 group-hover:text-blue-600 group-hover:translate-x-1 transition-all"
                    />
                  </div>
                </div>
              ))
            ) : (
              <EmptyState />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusTile({
  label,
  count,
  icon,
  color,
}: {
  label: string;
  count: number;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <div
      className={`p-6 rounded-3xl border ${color} flex items-center justify-between`}
    >
      <div>
        <p className="text-slate-500 text-sm font-medium">{label}</p>
        <p className="text-3xl font-black text-slate-900 mt-1">{count}</p>
      </div>
      <div className="bg-white p-3 rounded-2xl shadow-sm">{icon}</div>
    </div>
  );
}

function getStatusClass(status: string) {
  switch (status) {
    case "DONE":
      return "bg-emerald-100 text-emerald-700 border-emerald-200";
    case "IN_PROGRESS":
      return "bg-blue-100 text-blue-700 border-blue-200";
    case "OPEN":
      return "bg-amber-100 text-amber-700 border-amber-200";
    default:
      return "bg-slate-100 text-slate-700 border-slate-200";
  }
}

function TicketsSkeleton() {
  return (
    <div className="min-h-screen bg-[#fcfcfd] pb-20 pt-8 px-4 md:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="animate-pulse space-y-6">
          <div className="h-10 bg-slate-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-28 bg-slate-200 rounded-3xl"></div>
            ))}
          </div>
          <div className="bg-white rounded-2xl space-y-3 p-6">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-slate-100 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="p-12 text-center">
      <FileText className="mx-auto mb-4 text-slate-300" size={48} />
      <h3 className="text-lg font-semibold text-slate-900 mb-2">
        ยังไม่มีรายการแจ้งซ่อม
      </h3>
      <p className="text-slate-500 mb-6">
        เริ่มต้นด้วยการสร้างรายการแจ้งซ่อมใหม่
      </p>
      <Link
        href="/tickets/create"
        className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium transition-all"
      >
        <Plus size={18} />
        แจ้งซ่อมใหม่
      </Link>
    </div>
  );
}
