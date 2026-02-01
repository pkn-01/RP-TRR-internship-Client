"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/services/api";
import {
  ArrowUpRight,
  ChevronRight,
  Package,
  Wrench,
  Clock,
} from "lucide-react";

interface RepairItem {
  id: number;
  ticketCode: string;
  problemTitle: string;
  status: string;
  createdAt: string;
  assignees?: {
    id: number;
    name: string;
  }[];
}

interface LoanItem {
  id: number;
  itemName: string;
  borrowerName?: string;
  expectedReturnDate: string;
  status: string;
}

interface Stats {
  repairs: {
    total: number;
    waiting: number; // For "รอรับงาน"
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

export default function ITDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats>({
    repairs: { total: 0, waiting: 0, inProgress: 0, completed: 0 },
    loans: { total: 0, active: 0, overdue: 0, returned: 0 },
  });
  const [recentRepairs, setRecentRepairs] = useState<RepairItem[]>([]);
  const [recentLoans, setRecentLoans] = useState<LoanItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const userIdStr = localStorage.getItem("userId");
        const userId = userIdStr ? parseInt(userIdStr) : null;

        if (!userId) {
          // If no user ID, maybe redirect or just show empty
          // But usually middleware handles this.
        }

        const [repairsData, loansData] = await Promise.all([
          apiFetch("/api/repairs").catch(() => []),
          apiFetch("/api/loans").catch(() => []),
        ]);

        const allRepairsRaw: any[] = Array.isArray(repairsData)
          ? repairsData
          : repairsData?.data || [];

        // Map data to match our interface (flattens assignees)
        const allRepairs: RepairItem[] = allRepairsRaw.map((r) => ({
          ...r,
          assignees:
            r.assignees?.map((a: any) => ({
              id: a.user?.id || a.userId,
              name: a.user?.name || "Unknown",
            })) || [],
        }));

        const allLoans: LoanItem[] = Array.isArray(loansData) ? loansData : [];

        // Filter Repairs for Current IT User (My Repairs)
        // If userId is present, check if userId exists in the assignees array
        const myRepairs = userId
          ? allRepairs.filter((r) => r.assignees?.some((a) => a.id === userId))
          : [];

        // Calculate Repair Stats (My Repairs)
        const repairStats = {
          total: myRepairs.length,
          waiting: allRepairs.filter((r) => r.status === "PENDING").length, // "งานที่รอรับเรื่อง" - Total unassigned pending tasks
          inProgress: myRepairs.filter((r) =>
            ["IN_PROGRESS", "REPAIRING"].includes(r.status),
          ).length,
          completed: myRepairs.filter((r) => r.status === "COMPLETED").length,
        };

        // Calculate Loan Stats (Global - as IT monitors the system)
        const loanStats = {
          total: allLoans.length,
          active: allLoans.filter((l) => l.status === "BORROWED").length,
          overdue: allLoans.filter((l) => l.status === "OVERDUE").length,
          returned: allLoans.filter((l) => l.status === "RETURNED").length,
        };

        setStats({
          repairs: {
            total: repairStats.total,
            waiting: repairStats.waiting,
            inProgress: repairStats.inProgress,
            completed: repairStats.completed,
          },
          loans: loanStats,
        });

        // Set Recent Items
        // Repairs: My recent repairs
        setRecentRepairs(myRepairs.slice(0, 4));

        // Loans: Global recent loans
        setRecentLoans(allLoans.slice(0, 4));
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
      PENDING: "งานที่รอรับเรื่อง",
      ASSIGNED: "มอบหมายแล้ว",
      IN_PROGRESS: "กำลังดำเนินการ",
      REPAIRING: "กำลังซ่อม",
      COMPLETED: "เสร็จสิ้น",
      CANCELLED: "ยกเลิก",
      BORROWED: "กำลังยืม",
      RETURNED: "คืนแล้ว",
      OVERDUE: "เกินกำหนด",
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
        {/* Repairs Section (My Repairs) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="รายการซ่อมทั้งหมดของฉัน"
            value={stats.repairs.total}
            href="/it/repairs?tab=mine"
          />
          <StatCard
            label="งานที่รอรับเรื่อง"
            value={stats.repairs.waiting}
            href="/it/repairs?tab=unassigned"
          />
          <StatCard
            label="กำลังดำเนินการ"
            value={stats.repairs.inProgress}
            href="/it/repairs?tab=mine"
          />
          <StatCard
            label="เสร็จสิ้น"
            value={stats.repairs.completed}
            href="/it/repairs?tab=history"
          />
        </div>

        {/* Loans Section (Global) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="รายการยืมทั้งหมด"
            value={stats.loans.total}
            href="/it/loans"
          />
          <StatCard
            label="กำลังยืม"
            value={stats.loans.active}
            href="/it/loans?status=BORROWED"
          />
          <StatCard
            label="เกินกำหนด"
            value={stats.loans.overdue}
            href="/it/loans?status=OVERDUE"
          />
          <StatCard
            label="ส่งคืนแล้ว"
            value={stats.loans.returned}
            href="/it/loans?status=RETURNED"
          />
        </div>

        {/* Recent Lists */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Repairs List */}
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center">
              <h2 className="font-semibold text-gray-900 bg-gray-100 px-3 py-1 rounded-md">
                งานแจ้งซ่อม
              </h2>
            </div>
            <div className="divide-y divide-gray-100">
              {recentRepairs.length > 0 ? (
                recentRepairs.map((repair) => (
                  <Link
                    key={repair.id}
                    href={`/it/repairs?id=${repair.id}`} // Or a specific detail page if exists
                    className="block p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {repair.problemTitle}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-gray-500">
                            {new Date(repair.createdAt).toLocaleDateString(
                              "th-TH",
                            )}
                          </span>
                          <span className="text-xs text-gray-400">•</span>
                          <span className="text-xs text-gray-500">
                            {repair.ticketCode}
                          </span>
                          <span className="text-xs text-gray-400">•</span>
                          <span className="text-xs text-gray-500">
                            สถานะ: {getStatusLabel(repair.status)}
                          </span>
                        </div>
                      </div>
                      <ChevronRight size={18} className="text-gray-400 ml-2" />
                    </div>
                  </Link>
                ))
              ) : (
                <div className="p-8 text-center text-gray-400 text-sm">
                  ไม่มีรายการซ่อมที่ได้รับมอบหมาย
                </div>
              )}
            </div>
          </div>

          {/* Recent Loans List */}
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center">
              <h2 className="font-semibold text-gray-900 bg-gray-100 px-3 py-1 rounded-md">
                การยืม
              </h2>
            </div>
            <div className="divide-y divide-gray-100">
              {recentLoans.length > 0 ? (
                recentLoans.map((loan) => (
                  <Link
                    key={loan.id}
                    href="/it/loans"
                    className="block p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {loan.itemName}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-gray-500">
                            {new Date(
                              loan.expectedReturnDate,
                            ).toLocaleDateString("th-TH")}
                          </span>
                          <span className="text-xs text-gray-400">•</span>
                          <span className="text-xs text-gray-500">
                            {loan.id}
                          </span>{" "}
                          {/* Using ID or code if available */}
                          <div className="ml-auto">
                            <span className="text-xs text-gray-500">
                              กำหนดคืน:{" "}
                              {new Date(
                                loan.expectedReturnDate,
                              ).toLocaleDateString("th-TH")}
                            </span>
                          </div>
                        </div>
                      </div>
                      <ChevronRight size={18} className="text-gray-400 ml-2" />
                    </div>
                  </Link>
                ))
              ) : (
                <div className="p-8 text-center text-gray-400 text-sm">
                  ไม่มีรายการยืม
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

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
      className="bg-gray-200 hover:bg-gray-300 transition-colors p-4 rounded-lg group relative overflow-hidden"
    >
      <div className="flex items-start justify-between relative z-10">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <ArrowUpRight
          size={16}
          className="text-gray-500 group-hover:text-gray-700 transition-colors"
        />
      </div>
      <div className="mt-3 relative z-10">
        <span className="text-3xl font-bold text-gray-800">{value}</span>
      </div>
    </Link>
  );
}
