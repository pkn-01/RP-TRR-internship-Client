"use client";

import { useState, useEffect, Suspense, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Trash2,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Clock,
  Play,
  Pause,
} from "lucide-react";
import { apiFetch } from "@/services/api";
import { userService, User as UserType } from "@/services/userService";
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
  assignees: {
    user: {
      id: number;
      name: string;
    };
  }[];
}

const statusLabels: Record<string, string> = {
  PENDING: "รอรับงาน",
  ASSIGNED: "มอบหมายแล้ว",
  IN_PROGRESS: "กำลังดำเนินการ",
  COMPLETED: "เสร็จสิ้น",
  CANCELLED: "ยกเลิก",
};

function AdminRepairsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [repairs, setRepairs] = useState<Repair[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);
  const [showMyTasksOnly, setShowMyTasksOnly] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
  const [countdown, setCountdown] = useState(15); // 15 seconds refresh
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Stats
  const stats = {
    total: repairs.length,
    pending: repairs.filter((r) => r.status === "PENDING").length,
    inProgress: repairs.filter((r) => r.status === "IN_PROGRESS").length,
    completed: repairs.filter((r) => r.status === "COMPLETED").length,
    cancelled: repairs.filter((r) => r.status === "CANCELLED").length,
  };

  useEffect(() => {
    const status = searchParams.get("status");
    if (status) setFilterStatus(status);
  }, [searchParams]);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userId = localStorage.getItem("userId");
        if (userId) {
          const user = await userService.getUserById(parseInt(userId));
          setCurrentUser(user);
        }
      } catch (error) {
        console.error("Failed to fetch user:", error);
      }
    };
    fetchUser();
  }, []);

  const fetchRepairs = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      else setIsRefreshing(true);

      const data = await apiFetch("/api/repairs");
      setRepairs((data as Repair[]) || []);
      setLastUpdated(new Date());
    } catch (err) {
      console.error("Error fetching repairs:", err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchRepairs();
  }, [fetchRepairs]);

  // Auto-refresh countdown logic
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (autoRefreshEnabled) {
      timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            fetchRepairs(false);
            return 15;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [autoRefreshEnabled, fetchRepairs]);

  const handleDelete = async (id: string, ticketCode: string) => {
    if (!window.confirm(`ลบงานซ่อม #${ticketCode}?`)) return;
    try {
      await apiFetch(`/api/repairs/${id}`, { method: "DELETE" });
      setRepairs(repairs.filter((r) => r.id !== id));
    } catch (err) {
      console.error("Error deleting repair:", err);
      alert("เกิดข้อผิดพลาด");
    }
  };

  const filteredRepairs = repairs.filter((item) => {
    const matchesSearch =
      item.ticketCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.problemTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.reporterName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      filterStatus === "all" || item.status === filterStatus;

    // Filter by assignee if "My Tasks" is checked
    const matchesAssignee = showMyTasksOnly
      ? currentUser && item.assignees?.some((a) => a.user.id === currentUser.id)
      : true;

    return matchesSearch && matchesStatus && matchesAssignee;
  });

  const totalPages = Math.ceil(filteredRepairs.length / itemsPerPage);
  const paginatedRepairs = filteredRepairs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const handleExportExcel = () => {
    if (repairs.length === 0) {
      alert("ไม่มีข้อมูลสำหรับส่งออก");
      return;
    }

    try {
      // 1. Prepare and format data for export
      const exportData = filteredRepairs.map((repair) => ({
        เลขใบงาน: repair.ticketCode,
        วันที่แจ้ง: new Date(repair.createdAt).toLocaleDateString("th-TH"),
        เวลาที่แจ้ง: new Date(repair.createdAt).toLocaleTimeString("th-TH", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        "ปัญหา/รายการ": repair.problemTitle,
        รายละเอียด: repair.problemDescription || "-",
        สถานที่: repair.location,
        ความสำคัญ:
          repair.urgency === "CRITICAL"
            ? "ด่วนมาก"
            : repair.urgency === "URGENT"
              ? "ด่วน"
              : "ปกติ",
        ชื่อผู้แจ้ง: repair.reporterName || "-",
        แผนก: repair.reporterDepartment || "-",
        เบอร์โทรศัพท์: repair.reporterPhone || "-",
        สถานะ: statusLabels[repair.status] || repair.status,
        ผู้รับผิดชอบ:
          repair.assignees && repair.assignees.length > 0
            ? repair.assignees.map((a) => a.user.name).join(", ")
            : "ยังไม่มีผู้รับงาน",
      }));

      // 2. Create Workbook and Worksheet
      const wb = XLSX.utils.book_new();

      // Create Worksheet with professional headers
      const ws = XLSX.utils.aoa_to_sheet([
        ["รายงานการแจ้งซ่อม (Repair Management Report)"],
        [
          `วันที่พิมพ์: ${new Date().toLocaleDateString("th-TH")} ${new Date().toLocaleTimeString("th-TH")}`,
          "",
          "",
          "",
          "",
          "",
          "",
          "",
          "",
          "",
          "",
          `จำนวนทั้งหมด: ${filteredRepairs.length} รายการ`,
        ],
        [""], // Spacer
      ]);

      // Add actual data starting from row 4
      XLSX.utils.sheet_add_json(ws, exportData, { origin: "A4" });

      // 3. Set Styles and Layout
      // Set Column Widths
      ws["!cols"] = [
        { wch: 20 }, // เลขใบงาน
        { wch: 15 }, // วันที่แจ้ง
        { wch: 10 }, // เวลาที่แจ้ง
        { wch: 30 }, // ปัญหา/รายการ
        { wch: 40 }, // รายละเอียด
        { wch: 20 }, // สถานที่
        { wch: 12 }, // ความสำคัญ
        { wch: 20 }, // ชื่อผู้แจ้ง
        { wch: 15 }, // แผนก
        { wch: 15 }, // เบอร์โทรศัพท์
        { wch: 15 }, // สถานะ
        { wch: 20 }, // ผู้รับผิดชอบ
      ];

      // Merge Title Cells
      ws["!merges"] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 11 } }, // Main Title
        { s: { r: 1, c: 0 }, e: { r: 1, c: 5 } }, // Date info
        { s: { r: 1, c: 6 }, e: { r: 1, c: 11 } }, // Summary info
      ];

      // 4. Download File
      XLSX.utils.book_append_sheet(wb, ws, "รายละเอียดการแจ้งซ่อม");
      const fileName = `รายละเอียดการแจ้งซ่อม_${new Date().toISOString().split("T")[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);
    } catch (error) {
      console.error("Export error:", error);
      alert("เกิดข้อผิดพลาดในการส่งออกไฟล์ Excel");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-gray-500">กำลังโหลด...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-[1400px] mx-auto space-y-6">
        {/* Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard label="รายการซ่อมทั้งหมด" value={stats.total} />
          <StatCard label="รอรับงาน" value={stats.pending} />
          <StatCard label="กำลังดำเนินการ" value={stats.inProgress} />
          <StatCard label="เสร็จสิ้น" value={stats.completed} />
          <StatCard label="ยกเลิก" value={stats.cancelled} />
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-3 items-start md:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-3 flex-1">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <input
                type="text"
                placeholder="ค้นหาชื่อผู้แจ้ง/เลขรหัส"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-4 pr-10 py-2 border border-gray-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-1 focus:ring-gray-400"
              />
              <button className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 bg-gray-200 text-gray-700 text-xs rounded hover:bg-gray-300">
                ค้นหา
              </button>
            </div>

            {/* My Tasks Toggle */}
            <button
              onClick={() => setShowMyTasksOnly(!showMyTasksOnly)}
              className={`px-4 py-2 border rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                showMyTasksOnly
                  ? "bg-amber-50 text-amber-700 border-amber-200"
                  : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
              }`}
            >
              <div
                className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                  showMyTasksOnly
                    ? "bg-amber-500 border-amber-500"
                    : "border-gray-400"
                }`}
              >
                {showMyTasksOnly && (
                  <svg
                    className="w-3 h-3 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={3}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                )}
              </div>
              งานของฉัน
            </button>

            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-sm focus:outline-none"
            >
              <option value="all">ทุกสถานะ</option>
              <option value="PENDING">รอรับงาน</option>
              <option value="ASSIGNED">มอบหมายงาน</option>
              <option value="IN_PROGRESS">กำลังดำเนินการ</option>
              <option value="COMPLETED">เสร็จสิ้น</option>
              <option value="CANCELLED">ยกเลิก</option>
            </select>

            {/* Priority Filter */}
            <select className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-sm focus:outline-none">
              <option value="all">ทุกความสำคัญ</option>
              <option value="NORMAL">ปกติ</option>
              <option value="URGENT">ด่วน</option>
              <option value="CRITICAL">ด่วนมาก</option>
            </select>
          </div>

          {/* Export Button & Real-time Info */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-700 rounded-full border border-green-100 text-xs font-medium">
              <span className="relative flex h-2 w-2">
                {autoRefreshEnabled && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                )}
                <span
                  className={`relative inline-flex rounded-full h-2 w-2 ${autoRefreshEnabled ? "bg-green-500" : "bg-gray-400"}`}
                ></span>
              </span>
              {autoRefreshEnabled ? "เรียลไทม์" : "ปิดเรียลไทม์"}
              <span className="text-green-300 mx-1">|</span>
              <span className="font-mono">{countdown}s</span>
              <span className="text-green-300 mx-1">|</span>
              <Clock size={12} className="inline mr-1" />
              {lastUpdated.toLocaleTimeString("th-TH")}
            </div>

            <button
              onClick={() => setAutoRefreshEnabled(!autoRefreshEnabled)}
              className={`p-2 border border-gray-300 rounded-lg transition-colors ${
                autoRefreshEnabled
                  ? "bg-amber-50 text-amber-600 hover:bg-amber-100 border-amber-200"
                  : "bg-white text-gray-600 hover:bg-gray-50"
              }`}
              title={
                autoRefreshEnabled ? "ปิด Auto Refresh" : "เปิด Auto Refresh"
              }
            >
              {autoRefreshEnabled ? <Pause size={18} /> : <Play size={18} />}
            </button>

            <button
              onClick={() => {
                fetchRepairs(false);
                setCountdown(15);
              }}
              disabled={isRefreshing}
              className="p-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 disabled:opacity-50 transition-colors"
              title="รีเฟรชข้อมูล"
            >
              <RefreshCw
                size={18}
                className={`text-gray-600 ${isRefreshing ? "animate-spin" : ""}`}
              />
            </button>

            <button
              onClick={handleExportExcel}
              className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-sm hover:bg-gray-50 font-medium flex items-center gap-2"
            >
              Export report
            </button>
          </div>
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block bg-white rounded-lg overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-6 py-4 text-xs font-semibold text-gray-600">
                  เลข/รหัส
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-600">
                  ปัญหา
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-600">
                  สถานที่
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-600">
                  สถานะ
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-600 text-right">
                  จัดการ
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedRepairs.map((repair) => (
                <tr
                  key={repair.id}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => router.push(`/admin/repairs/${repair.id}`)}
                >
                  <td className="px-6 py-4">
                    <span className="text-sm font-mono text-gray-900">
                      {repair.ticketCode}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-900">
                      {repair.problemTitle}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-700">
                      {repair.location}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-700">
                      {statusLabels[repair.status] || repair.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div
                      className="flex items-center justify-end gap-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() =>
                          router.push(`/admin/repairs/${repair.id}`)
                        }
                        className="p-1 text-gray-400 hover:text-gray-600"
                      >
                        <ChevronRight size={18} />
                      </button>
                      <button
                        onClick={() =>
                          handleDelete(repair.id, repair.ticketCode)
                        }
                        className="p-1 text-gray-400 hover:text-red-600"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {paginatedRepairs.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-12 text-center text-gray-500"
                  >
                    ไม่พบรายการ
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden space-y-3">
          {paginatedRepairs.map((repair) => (
            <div
              key={repair.id}
              className="bg-white rounded-lg p-4"
              onClick={() => router.push(`/admin/repairs/${repair.id}`)}
            >
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-mono text-gray-500">
                  {repair.ticketCode}
                </span>
                <span className="text-xs px-2 py-1 bg-gray-100 rounded text-gray-600">
                  {statusLabels[repair.status] || repair.status}
                </span>
              </div>
              <p className="text-sm font-medium text-gray-900 mb-1">
                {repair.problemTitle}
              </p>
              <p className="text-xs text-gray-500">{repair.location}</p>
              <div className="flex justify-end items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(repair.id, repair.ticketCode);
                  }}
                  className="p-2 text-gray-400 hover:text-red-600"
                >
                  <Trash2 size={16} />
                </button>
                <button className="p-2 text-gray-400 hover:text-gray-600">
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          ))}
          {paginatedRepairs.length === 0 && (
            <div className="bg-white rounded-lg p-8 text-center text-gray-500">
              ไม่พบรายการ
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 0 && (
          <div className="flex items-center justify-end gap-2">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
              className="p-2 text-gray-600 hover:bg-gray-200 rounded disabled:opacity-40"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="text-sm text-gray-700">
              {currentPage}/{totalPages}
            </span>
            <button
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
              className="p-2 text-gray-600 hover:bg-gray-200 rounded disabled:opacity-40"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-gray-200 p-4 rounded-lg">
      <span className="text-sm text-gray-600">{label}</span>
      <div className="mt-2">
        <span className="text-3xl font-bold text-gray-900">{value}</span>
      </div>
    </div>
  );
}

export default function AdminRepairsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-100 flex items-center justify-center">
          กำลังโหลด...
        </div>
      }
    >
      <AdminRepairsContent />
    </Suspense>
  );
}
