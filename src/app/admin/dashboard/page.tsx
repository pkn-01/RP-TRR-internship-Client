"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { apiFetch } from "../../../../services/api";
import { ArrowUpRight, ChevronRight } from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface RepairItem {
  id: number;
  ticketCode: string;
  problemTitle: string;
  status: string;
  createdAt: string;
}

interface LoanItem {
  id: number;
  itemName: string;
  borrowerName?: string;
  expectedReturnDate: string;
  borrowedBy?: { name: string };
}

interface Stats {
  repairs: {
    total: number;
    pending: number;
    inProgress: number;
    completed: number;
  };
  loans: {
    total: number;
    active: number;
    overdue: number;
    returned: number;
  };
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    repairs: { total: 0, pending: 0, inProgress: 0, completed: 0 },
    loans: { total: 0, active: 0, overdue: 0, returned: 0 },
  });
  const [recentRepairs, setRecentRepairs] = useState<RepairItem[]>([]);
  const [recentLoans, setRecentLoans] = useState<LoanItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        // Fetch repair statistics
        const repairStats = await apiFetch(
          "/repairs/statistics/overview",
          "GET",
        );

        // Fetch loans
        const loansData = await apiFetch("/api/loans/admin/all");
        const loansArray = Array.isArray(loansData) ? loansData : [];

        // Calculate loan stats
        const loanStats = {
          total: loansArray.length,
          active: loansArray.filter(
            (l: { status: string }) => l.status === "BORROWED",
          ).length,
          overdue: loansArray.filter(
            (l: { status: string }) => l.status === "OVERDUE",
          ).length,
          returned: loansArray.filter(
            (l: { status: string }) => l.status === "RETURNED",
          ).length,
        };

        setStats({
          repairs: {
            total: repairStats?.total || 0,
            pending: repairStats?.pending || 0,
            inProgress: repairStats?.inProgress || 0,
            completed: repairStats?.completed || 0,
          },
          loans: loanStats,
        });

        // Fetch recent repairs
        const repairsData = await apiFetch("/api/repairs");
        const repairsArray = Array.isArray(repairsData)
          ? repairsData
          : repairsData?.data || [];
        setRecentRepairs(repairsArray.slice(0, 4));

        // Recent loans
        setRecentLoans(loansArray.slice(0, 3));
      } catch (error) {
        console.error("Failed to load dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      PENDING: "รอรับงาน",
      IN_PROGRESS: "กำลังดำเนินการ",
      COMPLETED: "เสร็จสิ้น",
      BORROWED: "กำลังยืม",
      RETURNED: "คืนสำเร็จ",
    };
    return labels[status] || status;
  };

  const repairChartData = [
    { name: "รอรับงาน", value: stats.repairs.pending, color: "#F59E0B" },
    {
      name: "กำลังดำเนินการ",
      value: stats.repairs.inProgress,
      color: "#3B82F6",
    },
    { name: "เสร็จสิ้น", value: stats.repairs.completed, color: "#10B981" },
  ].filter((d) => d.value > 0);

  const loanChartData = [
    { name: "กำลังยืม", value: stats.loans.active, color: "#3B82F6" },
    { name: "เกินกำหนด", value: stats.loans.overdue, color: "#EF4444" },
    { name: "คืนแล้ว", value: stats.loans.returned, color: "#10B981" },
  ].filter((d) => d.value > 0);

  // Custom Label for Pie Chart
  const renderCustomizedLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
  }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? "start" : "end"}
        dominantBaseline="central"
        fontSize={12}
        fontWeight="bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <div className="text-gray-500 font-medium">กำลังโหลด...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 space-y-8 font-sans">
      <div className="max-w-[1600px] mx-auto space-y-8">
        {/* Header Section */}
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Dashboard ภาพรวม</h1>
          <p className="text-gray-500 text-sm mt-1">
            สรุปข้อมูลการแจ้งซ่อมและระบบยืม-คืนอุปกรณ์
          </p>
        </div>

        {/* REPAIRS SECTION */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-6 bg-blue-600 rounded-full"></div>
            <h2 className="text-xl font-semibold text-gray-800">
              งานแจ้งซ่อม (Repairs)
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Stats Cards Grid (span 2 cols) */}
            <div className="lg:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard
                label="ทั้งหมด"
                value={stats.repairs.total}
                href="/admin/repairs"
                icon={<div className="w-2 h-2 rounded-full bg-gray-400" />}
              />
              <StatCard
                label="รอรับงาน"
                value={stats.repairs.pending}
                href="/admin/repairs?status=PENDING"
                className="bg-amber-50 hover:bg-amber-100 border-amber-200"
                textClassName="text-amber-700"
                icon={<div className="w-2 h-2 rounded-full bg-amber-500" />}
              />
              <StatCard
                label="กำลังดำเนินการ"
                value={stats.repairs.inProgress}
                href="/admin/repairs?status=IN_PROGRESS"
                className="bg-blue-50 hover:bg-blue-100 border-blue-200"
                textClassName="text-blue-700"
                icon={<div className="w-2 h-2 rounded-full bg-blue-500" />}
              />
              <StatCard
                label="เสร็จสิ้น"
                value={stats.repairs.completed}
                href="/admin/repairs?status=COMPLETED"
                className="bg-green-50 hover:bg-green-100 border-green-200"
                textClassName="text-green-700"
                icon={<div className="w-2 h-2 rounded-full bg-green-500" />}
              />
            </div>

            {/* Chart (span 1 col) */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center min-h-[250px]">
              <h3 className="text-sm font-medium text-gray-500 mb-2 w-full text-left">
                สัดส่วนสถานะงานซ่อม
              </h3>
              {repairChartData.length > 0 ? (
                <div className="w-full h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={repairChartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={renderCustomizedLabel}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        paddingAngle={2}
                      >
                        {repairChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend
                        iconSize={8}
                        wrapperStyle={{ fontSize: "12px" }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="text-gray-400 text-sm">
                  ไม่มีข้อมูลสำหรับกราฟ
                </div>
              )}
            </div>
          </div>
        </div>

        {/* LOANS SECTION */}
        <div className="space-y-4 pt-4 border-t border-gray-200">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-6 bg-purple-600 rounded-full"></div>
            <h2 className="text-xl font-semibold text-gray-800">
              ระบบยืม-คืน (Loans)
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Stats Cards */}
            <div className="lg:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard
                label="ทั้งหมด"
                value={stats.loans.total}
                href="/admin/loans"
                icon={<div className="w-2 h-2 rounded-full bg-gray-400" />}
              />
              <StatCard
                label="กำลังยืม"
                value={stats.loans.active}
                href="/admin/loans?status=BORROWED"
                className="bg-blue-50 hover:bg-blue-100 border-blue-200"
                textClassName="text-blue-700"
                icon={<div className="w-2 h-2 rounded-full bg-blue-500" />}
              />
              <StatCard
                label="เกินกำหนด"
                value={stats.loans.overdue}
                href="/admin/loans?status=OVERDUE"
                className="bg-red-50 hover:bg-red-100 border-red-200"
                textClassName="text-red-700"
                icon={<div className="w-2 h-2 rounded-full bg-red-500" />}
              />
              <StatCard
                label="คืนสำเร็จ"
                value={stats.loans.returned}
                href="/admin/loans?status=RETURNED"
                className="bg-green-50 hover:bg-green-100 border-green-200"
                textClassName="text-green-700"
                icon={<div className="w-2 h-2 rounded-full bg-green-500" />}
              />
            </div>

            {/* Chart */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center min-h-[250px]">
              <h3 className="text-sm font-medium text-gray-500 mb-2 w-full text-left">
                สัดส่วนสถานะการยืม
              </h3>
              {loanChartData.length > 0 ? (
                <div className="w-full h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={loanChartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={renderCustomizedLabel}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        paddingAngle={2}
                      >
                        {loanChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend
                        iconSize={8}
                        wrapperStyle={{ fontSize: "12px" }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="text-gray-400 text-sm">
                  ไม่มีข้อมูลสำหรับกราฟ
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recent Items Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-4 border-t border-gray-200">
          {/* Recent Repairs */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-5 border-b border-gray-50 flex justify-between items-center">
              <h2 className="font-semibold text-gray-800 flex items-center gap-2">
                <span className="p-1.5 bg-blue-100 text-blue-600 rounded-lg">
                  <ArrowUpRight size={16} />
                </span>
                งานแจ้งซ่อมล่าสุด
              </h2>
              <Link
                href="/admin/repairs"
                className="text-xs font-medium text-blue-600 hover:text-blue-700"
              >
                ดูทั้งหมด
              </Link>
            </div>
            <div className="divide-y divide-gray-50">
              {recentRepairs.map((repair) => (
                <Link
                  key={repair.id}
                  href={`/admin/repairs/${repair.id}`}
                  className="block p-4 hover:bg-gray-50/80 transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                        {repair.problemTitle}
                      </p>
                      <div className="flex items-center gap-3 mt-1.5">
                        <span className="text-xs text-xs px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 font-mono">
                          {repair.ticketCode}
                        </span>
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                          {new Date(repair.createdAt).toLocaleDateString(
                            "th-TH",
                          )}
                        </span>
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded-full border ${
                            repair.status === "PENDING"
                              ? "border-amber-200 text-amber-600 bg-amber-50"
                              : repair.status === "IN_PROGRESS"
                                ? "border-blue-200 text-blue-600 bg-blue-50"
                                : repair.status === "COMPLETED"
                                  ? "border-green-200 text-green-600 bg-green-50"
                                  : "border-gray-200 text-gray-600 bg-gray-50"
                          }`}
                        >
                          {getStatusLabel(repair.status)}
                        </span>
                      </div>
                    </div>
                    <ChevronRight
                      size={18}
                      className="text-gray-300 group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all"
                    />
                  </div>
                </Link>
              ))}
              {recentRepairs.length === 0 && (
                <div className="p-10 text-center text-gray-400 text-sm">
                  ยังไม่มีรายการแจ้งซ่อม
                </div>
              )}
            </div>
          </div>

          {/* Recent Loans */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-5 border-b border-gray-50 flex justify-between items-center">
              <h2 className="font-semibold text-gray-800 flex items-center gap-2">
                <span className="p-1.5 bg-purple-100 text-purple-600 rounded-lg">
                  <ArrowUpRight size={16} />
                </span>
                การยืมล่าสุด
              </h2>
              <Link
                href="/admin/loans"
                className="text-xs font-medium text-purple-600 hover:text-purple-700"
              >
                ดูทั้งหมด
              </Link>
            </div>
            <div className="divide-y divide-gray-50">
              {recentLoans.map((loan) => (
                <Link
                  key={loan.id}
                  href="/admin/loans"
                  className="block p-4 hover:bg-gray-50/80 transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate group-hover:text-purple-600 transition-colors">
                        {loan.itemName}
                      </p>
                      <div className="flex items-center gap-3 mt-1.5">
                        <span className="text-xs text-gray-500">
                          ผู้ยืม:{" "}
                          {loan.borrowerName || loan.borrowedBy?.name || "-"}
                        </span>
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                          คืน:{" "}
                          {new Date(loan.expectedReturnDate).toLocaleDateString(
                            "th-TH",
                          )}
                        </span>
                      </div>
                    </div>
                    <ChevronRight
                      size={18}
                      className="text-gray-300 group-hover:text-purple-400 group-hover:translate-x-0.5 transition-all"
                    />
                  </div>
                </Link>
              ))}
              {recentLoans.length === 0 && (
                <div className="p-10 text-center text-gray-400 text-sm">
                  ยังไม่มีรายการยืม
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Stats Card Component
function StatCard({
  label,
  value,
  href,
  className = "bg-white border-gray-200",
  textClassName = "text-gray-900",
  icon,
}: {
  label: string;
  value: number;
  href: string;
  className?: string;
  textClassName?: string;
  icon?: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`block p-4 rounded-xl border transition-all hover:shadow-md ${className} group`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
            {label}
          </span>
        </div>
      </div>
      <div className="flex items-baseline gap-1">
        <span className={`text-2xl font-bold ${textClassName}`}>{value}</span>
        <span className="text-xs text-gray-400 font-normal">รายการ</span>
      </div>
    </Link>
  );
}
