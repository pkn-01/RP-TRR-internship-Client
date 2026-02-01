"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader, RefreshCw } from "lucide-react";
import { apiFetch } from "@/services/api";

interface RepairTicket {
  id: number;
  ticketCode: string;
  reporterName: string;
  reporterDepartment: string;
  problemTitle: string;
  problemCategory: string;
  location: string;
  urgency: "NORMAL" | "URGENT" | "CRITICAL";
  status: "PENDING" | "IN_PROGRESS" | "WAITING_PARTS" | "COMPLETED" | "CANCELLED";
  createdAt: string;
  updatedAt: string;
  assignee?: {
    id: number;
    name: string;
    email: string;
  };
}

interface RepairStats {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
  cancelled: number;
}

export default function RepairsOverviewPage() {
  const router = useRouter();
  const [tickets, setTickets] = useState<RepairTicket[]>([]);
  const [stats, setStats] = useState<RepairStats>({
    total: 0,
    pending: 0,
    inProgress: 0,
    completed: 0,
    cancelled: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchRepairs();
  }, []);

  const fetchRepairs = async () => {
    try {
      setLoading(true);
      const response = await apiFetch("/api/repairs", "GET");
      if (Array.isArray(response)) {
        setTickets(response);
        calculateStats(response);
      }
    } catch (error) {
      console.error("Error fetching repairs:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchRepairs();
    setRefreshing(false);
  };

  const calculateStats = (ticketList: RepairTicket[]) => {
    const newStats: RepairStats = {
      total: ticketList.length,
      pending: ticketList.filter((t) => t.status === "PENDING").length,
      inProgress: ticketList.filter((t) => t.status === "IN_PROGRESS").length,
      completed: ticketList.filter((t) => t.status === "COMPLETED").length,
      cancelled: ticketList.filter((t) => t.status === "CANCELLED").length,
    };
    setStats(newStats);
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "PENDING":
        return "รอรับงาน";
      case "IN_PROGRESS":
        return "กำลังซ่อม";
      case "COMPLETED":
        return "เสร็จแล้ว";
      case "CANCELLED":
        return "ยกเลิก";
      default:
        return status;
    }
  };

  const getUrgencyLabel = (urgency: string) => {
    switch (urgency) {
      case "CRITICAL":
        return "ด่วนมาก";
      case "URGENT":
        return "ด่วน";
      default:
        return "ปกติ";
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case "CRITICAL":
        return "bg-red-50 text-red-700 border border-red-200";
      case "URGENT":
        return "bg-orange-50 text-orange-700 border border-orange-200";
      default:
        return "bg-slate-50 text-slate-600 border border-slate-200";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "text-blue-700";
      case "IN_PROGRESS":
        return "text-slate-700 font-medium";
      case "COMPLETED":
        return "text-green-700";
      case "CANCELLED":
        return "text-gray-500";
      default:
        return "text-gray-700";
    }
  };

  const StatCard = ({
    title,
    count,
    onClick,
  }: {
    title: string;
    count: number;
    onClick?: () => void;
  }) => (
    <div
      onClick={onClick}
      className={`p-6 bg-white border border-gray-200 rounded-lg transition-all ${
        onClick ? "cursor-pointer hover:border-gray-400 hover:shadow-md" : ""
      }`}
    >
      <p className="text-sm text-gray-600 font-medium">{title}</p>
      <p className="text-3xl font-bold text-gray-900 mt-3">{count}</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-white p-4 md:p-8 lg:ml-56">
      {/* Header */}
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">งานซ่อมแซม</h1>
          <p className="text-gray-500 mt-2 text-sm">ภาพรวมและการติดตามสถานะงาน</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="p-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 transition-all disabled:opacity-50"
          title="รีเฟรชข้อมูล"
        >
          <RefreshCw
            size={20}
            className={refreshing ? "animate-spin" : ""}
          />
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
        <StatCard title="ทั้งหมด" count={stats.total} />
        <StatCard
          title="รอรับงาน"
          count={stats.pending}
          onClick={() => router.push("/repairs/waiting")}
        />
        <StatCard
          title="กำลังซ่อม"
          count={stats.inProgress}
          onClick={() => router.push("/repairs/in-progress")}
        />
        <StatCard
          title="เสร็จแล้ว"
          count={stats.completed}
          onClick={() => router.push("/repairs/completed")}
        />
        <StatCard title="ยกเลิก" count={stats.cancelled} />
      </div>

      {/* Recent Tickets */}
      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            งานซ่อมล่าสุด
          </h2>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader size={32} className="animate-spin text-gray-400" />
          </div>
        ) : tickets.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-500">ไม่มีรายการงานซ่อม</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left font-semibold text-gray-700">
                    รหัสงาน
                  </th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-700">
                    ผู้แจ้ง
                  </th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-700">
                    เรื่องซ่อม
                  </th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-700">
                    สถานที่
                  </th>
                  <th className="px-6 py-3 text-center font-semibold text-gray-700">
                    ด่วน
                  </th>
                  <th className="px-6 py-3 text-center font-semibold text-gray-700">
                    สถานะ
                  </th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-700">
                    วันที่
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {tickets.slice(0, 10).map((ticket) => (
                  <tr
                    key={ticket.id}
                    onClick={() => router.push(`/repairs/details/${ticket.id}`)}
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <td className="px-6 py-4">
                      <span className="font-semibold text-blue-600">
                        {ticket.ticketCode}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900">
                          {ticket.reporterName}
                        </p>
                        <p className="text-xs text-gray-500">
                          {ticket.reporterDepartment}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-gray-900">{ticket.problemTitle}</p>
                    </td>
                    <td className="px-6 py-4 text-gray-600 text-sm">
                      {ticket.location}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-block px-3 py-1 rounded text-xs font-medium ${getUrgencyColor(ticket.urgency)}`}>
                        {getUrgencyLabel(ticket.urgency)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`text-sm font-medium ${getStatusColor(ticket.status)}`}>
                        {getStatusLabel(ticket.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600 text-sm">
                      {new Date(ticket.createdAt).toLocaleDateString("th-TH")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && tickets.length > 10 && (
          <div className="px-6 py-4 border-t border-gray-200 text-center text-sm text-gray-500">
            แสดง 10 จากทั้งหมด {tickets.length} รายการ
          </div>
        )}
      </div>
    </div>
  );
}
