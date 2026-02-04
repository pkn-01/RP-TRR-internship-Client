"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { apiFetch } from "../../../../services/api";
import { ArrowUpRight, ChevronRight } from "lucide-react";

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
    cancelled: number;
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
    repairs: {
      total: 0,
      pending: 0,
      inProgress: 0,
      completed: 0,
      cancelled: 0,
    },
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
            cancelled: repairStats?.cancelled || 0,
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-gray-500">กำลังโหลด...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-6">
      <div className="max-w-[1400px] mx-auto space-y-4 md:space-y-6">
        {/* Repair Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard
            label="รายการซ่อมทั้งหมด"
            value={stats.repairs.total}
            href="/admin/repairs"
          />
          <StatCard
            label="รอรับงาน"
            value={stats.repairs.pending}
            href="/admin/repairs?status=PENDING"
          />
          <StatCard
            label="กำลังดำเนินการ"
            value={stats.repairs.inProgress}
            href="/admin/repairs?status=IN_PROGRESS"
          />
          <StatCard
            label="เสร็จสิ้น"
            value={stats.repairs.completed}
            href="/admin/repairs?status=COMPLETED"
          />
          <StatCard
            label="ยกเลิก"
            value={stats.repairs.cancelled}
            href="/admin/repairs?status=CANCELLED"
          />
        </div>

        {/* Loan Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard
            label="รายการยืมทั้งหมด"
            value={stats.loans.total}
            href="/admin/loans"
          />
          <StatCard
            label="กำลังยืม"
            value={stats.loans.active}
            href="/admin/loans?status=BORROWED"
          />
          <StatCard
            label="ส่งคืนแล้ว"
            value={stats.loans.returned}
            href="/admin/loans?status=RETURNED"
          />
        </div>

        {/* Recent Items Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Repairs */}
          <div className="bg-white rounded-lg">
            <div className="p-4">
              <h2 className="font-semibold text-gray-900">งานแจ้งซ่อมวันนี้</h2>
            </div>
            <div className="divide-y divide-gray-100">
              {recentRepairs.map((repair) => (
                <Link
                  key={repair.id}
                  href={`/admin/repairs/${repair.id}`}
                  className="block p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {repair.problemTitle}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(repair.createdAt).toLocaleDateString("th-TH")}{" "}
                        • {repair.ticketCode}
                        <span className="ml-2 text-gray-400">
                          สถานะ: {getStatusLabel(repair.status)}
                        </span>
                      </p>
                    </div>
                    <ChevronRight size={18} className="text-gray-400 ml-2" />
                  </div>
                </Link>
              ))}
              {recentRepairs.length === 0 && (
                <div className="p-6 text-center text-gray-500 text-sm">
                  ไม่มีรายการ
                </div>
              )}
            </div>
          </div>

          {/* Recent Loans */}
          <div className="bg-white rounded-lg">
            <div className="p-4">
              <h2 className="font-semibold text-gray-900">การยืม</h2>
            </div>
            <div className="divide-y divide-gray-100">
              {recentLoans.map((loan) => (
                <Link
                  key={loan.id}
                  href="/admin/loans"
                  className="block p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {loan.itemName}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(loan.expectedReturnDate).toLocaleDateString(
                          "th-TH",
                        )}
                        <span className="ml-2">
                          กำหนดคืน:{" "}
                          {new Date(loan.expectedReturnDate).toLocaleDateString(
                            "th-TH",
                          )}
                        </span>
                      </p>
                    </div>
                    <ChevronRight size={18} className="text-gray-400 ml-2" />
                  </div>
                </Link>
              ))}
              {recentLoans.length === 0 && (
                <div className="p-6 text-center text-gray-500 text-sm">
                  ไม่มีรายการ
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Stat Card Component
function StatCard({
  label,
  value,
  href,
}: {
  label: string;
  value: number;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="bg-gray-200 hover:bg-gray-300 transition-colors p-4 rounded-lg group"
    >
      <div className="flex items-start justify-between">
        <span className="text-sm text-gray-600">{label}</span>
        <ArrowUpRight
          size={16}
          className="text-gray-400 group-hover:text-gray-600 transition-colors"
        />
      </div>
      <div className="mt-2">
        <span className="text-3xl font-bold text-gray-900">{value}</span>
      </div>
    </Link>
  );
}
