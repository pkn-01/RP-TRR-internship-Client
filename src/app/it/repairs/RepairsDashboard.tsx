"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Search,
  Clock,
  Briefcase,
  CheckCircle,
  Inbox,
} from "lucide-react";
import { apiFetch } from "@/services/api";
import Swal from "sweetalert2";
import * as XLSX from "xlsx";

interface Repair {
  id: string;
  ticketCode: string;
  problemTitle: string;
  problemDescription?: string;
  location: string;
  reporterName: string;
  reporterDepartment?: string;
  reporterPhone?: string;
  status: string;
  urgency: string;
  createdAt: string;
  assignees?: {
    id: number;
    name: string;
  }[];
}

const statusLabels: Record<string, string> = {
  PENDING: "รอรับงาน",
  ASSIGNED: "มอบหมายแล้ว",
  IN_PROGRESS: "กำลังดำเนินการ",
  REPAIRING: "กำลังซ่อม",
  COMPLETED: "เสร็จสิ้น",
  CANCELLED: "ยกเลิก",
  WAITING_PARTS: "รออะไหล่",
};

// Tabs definition
type Tab = "mine" | "unassigned" | "history";

export function RepairsDashboard() {
  const router = useRouter();
  const [repairs, setRepairs] = useState<Repair[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("mine");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [currentUser, setCurrentUser] = useState<{
    id: number;
    name: string;
  } | null>(null);

  const searchParams = useSearchParams();
  const urlTab = searchParams.get("tab");

  /* ---------------- Init ---------------- */
  useEffect(() => {
    const userId = localStorage.getItem("userId");
    const userName = localStorage.getItem("name") || "IT Staff";
    if (userId) {
      setCurrentUser({ id: parseInt(userId), name: userName });
    }

    if (urlTab === "mine" || urlTab === "unassigned" || urlTab === "history") {
      setActiveTab(urlTab as Tab);
    }
  }, [urlTab]);

  /* ---------------- Fetching ---------------- */
  const fetchRepairs = useCallback(async () => {
    try {
      setLoading(true);
      const rawData = await apiFetch("/api/repairs");
      const mappedData = ((rawData as any[]) || []).map((r) => ({
        ...r,
        assignees:
          r.assignees?.map((a: any) => ({
            id: a.user?.id || a.userId,
            name: a.user?.name || "Unknown",
          })) || [],
      }));
      setRepairs(mappedData);
    } catch (err) {
      console.error("Error fetching repairs:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRepairs();
    // Auto-refresh every 30s
    const interval = setInterval(() => fetchRepairs(), 30000);
    return () => clearInterval(interval);
  }, [fetchRepairs]);

  /* ---------------- Filtering Logic ---------------- */
  const getFilteredRepairs = () => {
    let filtered = repairs;

    // 1. Filter by Tab
    if (activeTab === "mine") {
      // My Active Jobs (Assigned to me AND Not Completed/Cancelled)
      filtered = repairs.filter(
        (r) =>
          currentUser &&
          r.assignees?.some((a) => a.id === currentUser.id) &&
          !["COMPLETED", "CANCELLED"].includes(r.status),
      );
    } else if (activeTab === "unassigned") {
      // Unassigned Jobs (PENDING status)
      filtered = repairs.filter((r) => r.status === "PENDING");
    } else if (activeTab === "history") {
      // All Completed/Cancelled Jobs
      filtered = repairs.filter((r) =>
        ["COMPLETED", "CANCELLED"].includes(r.status),
      );
    }

    // 2. Filter by Search
    if (searchTerm) {
      const lowerTerm = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.ticketCode.toLowerCase().includes(lowerTerm) ||
          r.problemTitle.toLowerCase().includes(lowerTerm) ||
          r.reporterName.toLowerCase().includes(lowerTerm),
      );
    }

    return filtered;
  };

  const filteredData = getFilteredRepairs();
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const countUnassigned = repairs.filter((r) => r.status === "PENDING").length;
  const countMine = currentUser
    ? repairs.filter(
        (r) =>
          r.assignees?.some((a) => a.id === currentUser.id) &&
          !["COMPLETED", "CANCELLED"].includes(r.status),
      ).length
    : 0;

  const handleAcceptJob = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUser) {
      Swal.fire({
        title: "ไม่พบข้อมูลผู้ใช้",
        text: "กรุณาลองใหม่อีกครั้ง",
        icon: "error",
      });
      return;
    }

    const result = await Swal.fire({
      title: "รับงานนี้?",
      text: "คุณต้องการรับงานซ่อมนี้ใช่หรือไม่",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#2563eb",
      cancelButtonColor: "#a1a1aa",
      confirmButtonText: "รับงาน",
      cancelButtonText: "ยกเลิก",
    });

    if (!result.isConfirmed) return;

    try {
      await apiFetch(`/api/repairs/${id}`, {
        method: "PUT",
        body: {
          assigneeIds: [currentUser.id],
          status: "IN_PROGRESS",
        },
      });

      await Swal.fire({
        title: "รับงานสำเร็จ!",
        icon: "success",
        timer: 1500,
        showConfirmButton: false,
      });

      fetchRepairs();
    } catch (err) {
      console.error("Error accepting job:", err);
      Swal.fire({
        title: "เกิดข้อผิดพลาด",
        text: "ไม่สามารถรับงานได้ กรุณาลองใหม่",
        icon: "error",
      });
    }
  };

  /* ---------------- Export ---------------- */
  const handleExportExcel = () => {
    if (filteredData.length === 0) {
      Swal.fire({
        title: "ไม่มีข้อมูล",
        text: "ไม่มีข้อมูลสำหรับส่งออก",
        icon: "info",
      });
      return;
    }

    const exportData = filteredData.map((repair) => ({
      เลขใบงาน: repair.ticketCode,
      วันที่แจ้ง: new Date(repair.createdAt).toLocaleDateString("th-TH"),
      ปัญหา: repair.problemTitle,
      ความสำคัญ:
        repair.urgency === "CRITICAL"
          ? "ด่วนมาก"
          : repair.urgency === "URGENT"
            ? "ด่วน"
            : "ปกติ",
      สถานที่: repair.location,
      สถานะ: statusLabels[repair.status] || repair.status,
      ผู้รับผิดชอบ: repair.assignees?.map((a) => a.name).join(", ") || "-",
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(exportData);
    XLSX.utils.book_append_sheet(wb, ws, "Repairs");
    XLSX.writeFile(
      wb,
      `Repairs_Export_${new Date().toISOString().split("T")[0]}.xlsx`,
    );
  };

  /* ---------------- UI Components ---------------- */
  return (
    <div className="min-h-[calc(100vh-4rem)] lg:min-h-screen bg-gray-50 p-4 lg:p-6 font-sans overflow-x-hidden">
      <div className="w-full max-w-6xl mx-auto space-y-6">
        {/* Header & Controls */}
        <div className="flex flex-row flex-wrap justify-between items-center gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900">
              รายการแจ้งซ่อม{" "}
              <span className="hidden sm:inline text-gray-500 font-normal text-xl">
                (IT Support)
              </span>
            </h1>
            <p className="text-xs md:text-sm text-gray-500 mt-1">
              สวัสดี, {currentUser?.name || "IT Staff"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchRepairs}
              className="p-2 text-gray-500 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg shadow-sm transition-all"
              title="รีเฟรชข้อมูล"
            >
              <RefreshCw size={18} />
            </button>
            <button
              onClick={handleExportExcel}
              className="p-2 text-gray-500 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg shadow-sm transition-all"
            >
              <span>Export</span>
            </button>
          </div>
        </div>

        {/* Tabs & Search Bar */}
        <div className="sticky top-[4rem] z-30 bg-white/95 backdrop-blur-sm p-2 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4 transition-all">
          {/* Tabs */}
          <div className="flex p-1 bg-gray-100/80 rounded-lg w-full md:w-auto overflow-x-auto no-scrollbar">
            <TabButton
              active={activeTab === "mine"}
              onClick={() => {
                setActiveTab("mine");
                setCurrentPage(1);
              }}
              icon={<Briefcase size={16} />}
              label="งานของฉัน"
              count={countMine}
              colorClass="text-blue-600 bg-blue-50"
            />
            <TabButton
              active={activeTab === "unassigned"}
              onClick={() => {
                setActiveTab("unassigned");
                setCurrentPage(1);
              }}
              icon={<Inbox size={16} />}
              label="งานรอรับเรื่อง"
              count={countUnassigned}
              colorClass="text-orange-600 bg-orange-50"
            />
            <TabButton
              active={activeTab === "history"}
              onClick={() => {
                setActiveTab("history");
                setCurrentPage(1);
              }}
              icon={<CheckCircle size={16} />}
              label="ประวัติ"
            />
          </div>

          {/* Search */}
          <div className="relative w-full md:w-64">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={16}
            />
            <input
              type="text"
              placeholder="ค้นหา..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-gray-50/50 focus:bg-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Content Area */}
        <div className="space-y-4">
          {/* Desktop Table */}
          <div className="hidden lg:block bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      รหัสใบงาน
                    </th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      ปัญหา / สถานที่
                    </th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      ผู้แจ้ง
                    </th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      สถานะ
                    </th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">
                      ดำเนินการ
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {loading && repairs.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-6 py-8 text-center text-gray-400"
                      >
                        กำลังโหลด...
                      </td>
                    </tr>
                  ) : paginatedData.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-6 py-8 text-center text-gray-400"
                      >
                        ไม่พบรายการ
                      </td>
                    </tr>
                  ) : (
                    paginatedData.map((item) => (
                      <tr
                        key={item.id}
                        className="hover:bg-gray-50 transition-colors cursor-pointer group"
                        onClick={() => router.push(`/it/repairs/${item.id}`)}
                      >
                        <td className="px-6 py-4">
                          <span className="font-mono text-sm font-medium text-gray-700 group-hover:text-blue-600 transition-colors">
                            {item.ticketCode}
                          </span>
                          <div className="flex items-center gap-1 mt-1 text-xs text-gray-400">
                            <Clock size={12} />
                            {new Date(item.createdAt).toLocaleDateString(
                              "th-TH",
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">
                            {item.problemTitle}
                          </div>
                          <div className="text-xs text-gray-500 mt-0.5">
                            {item.location}
                          </div>
                          {/* Urgency Badge */}
                          {item.urgency === "CRITICAL" && (
                            <span className="inline-block mt-1 px-2 py-0.5 text-[10px] font-bold bg-red-100 text-red-600 rounded-full">
                              ด่วนมาก
                            </span>
                          )}
                          {item.urgency === "URGENT" && (
                            <span className="inline-block mt-1 px-2 py-0.5 text-[10px] font-bold bg-orange-100 text-orange-600 rounded-full">
                              ด่วน
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-700">
                            {item.reporterName}
                          </div>
                          <div className="text-xs text-gray-400">
                            {item.reporterDepartment || "-"}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge status={item.status} />
                        </td>
                        <td className="px-6 py-4 text-right">
                          {item.status === "PENDING" ? (
                            <button
                              onClick={(e) => handleAcceptJob(item.id, e)}
                              className="px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                            >
                              รับงาน
                            </button>
                          ) : (
                            <ChevronRight
                              size={18}
                              className="text-gray-300 ml-auto group-hover:text-gray-500"
                            />
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Cards */}
          <div className="lg:hidden space-y-3">
            {loading && repairs.length === 0 ? (
              <div className="text-center py-8 text-gray-400">กำลังโหลด...</div>
            ) : paginatedData.length === 0 ? (
              <div className="text-center py-8 text-gray-400 bg-white rounded-xl border border-gray-100">
                ไม่พบรายการ
              </div>
            ) : (
              paginatedData.map((item) => (
                <div
                  key={item.id}
                  className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 active:bg-gray-50 active:scale-[0.99] transition-all cursor-pointer"
                  onClick={() => router.push(`/it/repairs/${item.id}`)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-mono text-xs text-gray-500">
                      {item.ticketCode}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">
                        {new Date(item.createdAt).toLocaleDateString("th-TH")}
                      </span>
                      <StatusBadge status={item.status} />
                    </div>
                  </div>

                  <h3 className="text-sm font-semibold text-gray-900 mb-1 line-clamp-2">
                    {item.problemTitle}
                  </h3>

                  <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                    <span className="bg-gray-100 px-1.5 py-0.5 rounded truncate max-w-[120px]">
                      {item.location}
                    </span>
                    <span>•</span>
                    <span className="truncate">{item.reporterName}</span>
                  </div>

                  <div className="flex justify-between items-center border-t border-gray-50 pt-2">
                    <div className="flex gap-1">
                      {item.urgency === "CRITICAL" && (
                        <span className="px-2 py-0.5 text-[10px] font-bold bg-red-100 text-red-600 rounded-full">
                          ด่วนมาก
                        </span>
                      )}
                      {item.urgency === "URGENT" && (
                        <span className="px-2 py-0.5 text-[10px] font-bold bg-orange-100 text-orange-600 rounded-full">
                          ด่วน
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {item.status === "PENDING" ? (
                        <button
                          onClick={(e) => handleAcceptJob(item.id, e)}
                          className="px-3 py-1 bg-blue-600 text-white text-[11px] font-bold rounded-lg hover:bg-blue-700"
                        >
                          รับงาน
                        </button>
                      ) : (
                        <span className="text-xs text-blue-600 font-medium">
                          ดูรายละเอียด &rarr;
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden px-6 py-4 flex items-center justify-between">
            <div className="text-xs text-gray-500">
              หน้า {currentPage} จาก {totalPages}
            </div>
            <div className="flex gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((c) => c - 1)}
                className="p-1.5 rounded hover:bg-gray-200 disabled:opacity-30 transition-all"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((c) => c + 1)}
                className="p-1.5 rounded hover:bg-gray-200 disabled:opacity-30 transition-all"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------------- Sub-Components ---------------- */

function TabButton({
  active,
  onClick,
  icon,
  label,
  count,
  colorClass = "text-gray-700",
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  count?: number;
  colorClass?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`
                flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap
                ${
                  active
                    ? "bg-white text-gray-900 shadow-sm ring-1 ring-black/5"
                    : "text-gray-500 hover:text-gray-700 hover:bg-white/50"
                }
            `}
    >
      {icon}
      {label}
      {count !== undefined && count > 0 && (
        <span
          className={`px-1.5 py-0.5 rounded-full text-[10px] bg-gray-100 ${active ? colorClass.replace("text-", "bg-opacity-20 text-") : "text-gray-500"}`}
        >
          {count}
        </span>
      )}
    </button>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    PENDING: "bg-yellow-50 text-yellow-700 border-yellow-200",
    ASSIGNED: "bg-blue-50 text-blue-600 border-blue-100",
    IN_PROGRESS: "bg-purple-50 text-purple-600 border-purple-100",
    WAITING_PARTS: "bg-orange-50 text-orange-600 border-orange-100",
    COMPLETED: "bg-green-50 text-green-600 border-green-100",
    CANCELLED: "bg-gray-100 text-gray-500 border-gray-200",
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${styles[status] || "bg-gray-50 text-gray-600 border-gray-200"}`}
    >
      {statusLabels[status] || status}
    </span>
  );
}
