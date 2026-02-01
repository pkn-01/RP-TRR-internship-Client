"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "@/services/api";
import {
  Plus,
  Search,
  Package,
  Clock,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  LogOut,
  Calendar,
  User,
  Trash2,
  Eye,
} from "lucide-react";

interface Loan {
  id: number;
  itemName: string;
  description: string;
  quantity: number;
  borrowDate: string;
  expectedReturnDate: string;
  status: string;
  borrowedBy: {
    name: string;
  };
}

export default function LoansPage() {
  const router = useRouter();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const loanStats = {
    active: loans.filter((l) => l.status === "BORROWED").length,
    returned: loans.filter((l) => l.status === "RETURNED").length,
    overdue: loans.filter((l) => l.status === "OVERDUE").length,
  };

  const handleLogout = async () => {
    localStorage.clear();
    router.push("/login/admin");
  };

  useEffect(() => {
    const fetchLoans = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          router.push("/login/admin");
          return;
        }

        const data = await apiFetch("/api/loans");
        setLoans(data || []);
      } catch (error) {
        console.error("Failed to fetch loans:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLoans();
  }, [router]);

  const filteredLoans = loans.filter(
    (loan) =>
      loan.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      loan.description.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  if (isLoading) return <LoansSkeleton />;

  return (
    <div className="min-h-screen bg-zinc-50 pb-20 pt-20 px-4 md:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div>
            <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">
              ระบบยืมของ
            </h1>
            <p className="text-zinc-500 mt-2 flex items-center gap-2">
              <Package size={16} /> ติดตามการยืมและคืนของต่างๆ
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/loans/create"
              className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-bold transition-all shadow-sm hover:shadow-md"
            >
              <Plus size={20} />
              <span>ยืมของใหม่</span>
            </Link>
            <button
              onClick={handleLogout}
              className="inline-flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-bold transition-all shadow-sm hover:shadow-md"
              title="ออกจากระบบ"
            >
              <LogOut size={20} />
              <span className="hidden md:inline">ออกจากระบบ</span>
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <StatCard
            label="กำลังยืม"
            count={loanStats.active}
            icon="📦"
            color="bg-blue-50 border-blue-200"
          />
          <StatCard
            label="คืนแล้ว"
            count={loanStats.returned}
            icon="✓"
            color="bg-green-50 border-green-200"
          />
          <StatCard
            label="เกินกำหนด"
            count={loanStats.overdue}
            icon="⚠"
            color="bg-red-50 border-red-200"
          />
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400"
              size={18}
            />
            <input
              type="text"
              placeholder="ค้นหาชื่อของหรือรายละเอียด..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 transition-all text-sm"
            />
          </div>
        </div>

        {/* Loans List */}
        <div className="bg-white border border-zinc-200 rounded-lg overflow-hidden">
          {filteredLoans.length > 0 ? (
            <div className="divide-y divide-zinc-100">
              {filteredLoans.map((loan) => (
                <div
                  key={loan.id}
                  className="p-6 hover:bg-zinc-50/50 transition-colors group flex items-center justify-between"
                >
                  <div className="flex gap-4 items-start flex-1">
                    <div
                      className={`p-3 rounded-lg ${
                        loan.status === "RETURNED"
                          ? "bg-green-50 text-green-600"
                          : loan.status === "OVERDUE"
                            ? "bg-red-50 text-red-600"
                            : "bg-blue-50 text-blue-600"
                      }`}
                    >
                      <Package size={24} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-zinc-900">
                        {loan.itemName}
                      </h3>
                      <p className="text-sm text-zinc-500 mt-1">
                        {loan.description}
                      </p>
                      <div className="flex flex-wrap gap-4 mt-3 text-xs text-zinc-600">
                        <span className="flex items-center gap-1">
                          <Package size={13} /> จำนวน: {loan.quantity}
                        </span>
                        <span className="flex items-center gap-1">
                          <User size={13} /> {loan.borrowedBy.name}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar size={13} />{" "}
                          {new Date(loan.borrowDate).toLocaleDateString(
                            "th-TH",
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 ml-4">
                    <div className="text-right hidden md:block">
                      <span
                        className={`text-xs font-bold px-3 py-1 rounded-full ${
                          loan.status === "RETURNED"
                            ? "bg-green-100 text-green-700"
                            : loan.status === "OVERDUE"
                              ? "bg-red-100 text-red-700"
                              : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {loan.status === "RETURNED"
                          ? "คืนแล้ว"
                          : loan.status === "OVERDUE"
                            ? "เกินกำหนด"
                            : "กำลังยืม"}
                      </span>
                      <p className="text-[11px] text-zinc-500 mt-1">
                        ต้องคืน:{" "}
                        {new Date(loan.expectedReturnDate).toLocaleDateString(
                          "th-TH",
                        )}
                      </p>
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-2 text-zinc-500 hover:text-zinc-900 hover:bg-white rounded-md transition-colors">
                        <Eye size={16} />
                      </button>
                      <button className="p-2 text-zinc-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <ChevronRight
                      size={20}
                      className="text-zinc-300 group-hover:text-blue-600 group-hover:translate-x-1 transition-all hidden md:block"
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState />
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  count,
  icon,
  color,
}: {
  label: string;
  count: number;
  icon: string;
  color: string;
}) {
  return (
    <div className={`p-6 rounded-lg border ${color}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-zinc-600 font-medium">{label}</p>
          <p className="text-2xl font-bold text-zinc-900 mt-2">{count}</p>
        </div>
        <span className="text-2xl">{icon}</span>
      </div>
    </div>
  );
}

function LoansSkeleton() {
  return (
    <div className="min-h-screen bg-zinc-50 pb-20 pt-20 px-4 md:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="animate-pulse space-y-6">
          <div className="h-10 bg-zinc-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 bg-zinc-200 rounded-lg"></div>
            ))}
          </div>
          <div className="h-12 bg-zinc-200 rounded-lg mb-6"></div>
          <div className="bg-white rounded-lg space-y-4 p-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-20 bg-zinc-100 rounded"></div>
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
      <Package className="mx-auto mb-4 text-zinc-300" size={48} />
      <h3 className="text-lg font-semibold text-zinc-900 mb-2">
        ยังไม่มีรายการยืมของ
      </h3>
      <p className="text-zinc-500 mb-6">เริ่มต้นด้วยการบันทึกการยืมของใหม่</p>
      <Link
        href="/loans/create"
        className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-all"
      >
        <Plus size={18} />
        ยืมของใหม่
      </Link>
    </div>
  );
}
